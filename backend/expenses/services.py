"""
Expense split calculation service.

Given a total amount, a split type, and raw per-member input, this computes
the exact monetary amount each member owes -- guaranteeing (to the cent)
that individual splits always sum back to the original total, regardless of
rounding. This guarantee is what the settlement engine depends on.
"""
from decimal import ROUND_HALF_UP, Decimal

from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework.exceptions import ValidationError

TWO_PLACES = Decimal("0.01")


def _quantize(value: Decimal) -> Decimal:
    return value.quantize(TWO_PLACES, rounding=ROUND_HALF_UP)


def _distribute_rounding_remainder(amounts: dict, total: Decimal) -> dict:
    """
    After independently rounding each share to 2dp, the sum can be off by a
    few cents due to rounding. Distribute that remainder one cent at a time,
    in a stable (user-id sorted) order, so the total always reconciles
    exactly with `total`.
    """
    quantized = {uid: _quantize(v) for uid, v in amounts.items()}
    remainder = _quantize(total) - sum(quantized.values())
    if remainder == 0:
        return quantized

    cents = int((remainder * 100).to_integral_value())
    ordered_ids = sorted(quantized.keys())
    step = Decimal("0.01") if cents > 0 else Decimal("-0.01")
    for i in range(abs(cents)):
        uid = ordered_ids[i % len(ordered_ids)]
        quantized[uid] += step
    return quantized


class SplitCalculationError(ValidationError):
    pass


class ExpenseSplitService:
    """Computes {user_id: amount_owed} for each supported split type."""

    @staticmethod
    def calculate(split_type: str, total_amount: Decimal, participants: list[dict]) -> dict:
        """
        participants: list of {"user_id": <id>, "value": <optional Decimal>}
            - equal: "value" ignored
            - percentage: "value" is percentage points (must sum to 100)
            - exact: "value" is the exact amount owed (must sum to total)
            - share: "value" is the number of shares (must be > 0)
        Returns: {user_id: Decimal amount_owed}
        """
        if not participants:
            raise SplitCalculationError("At least one participant is required for a split.")

        total_amount = Decimal(total_amount)
        user_ids = [p["user_id"] for p in participants]
        if len(set(user_ids)) != len(user_ids):
            raise SplitCalculationError("Duplicate participants are not allowed in a split.")

        method = getattr(ExpenseSplitService, f"_calculate_{split_type}", None)
        if method is None:
            raise SplitCalculationError(f"Unsupported split type: {split_type}")
        return method(total_amount, participants)

    @staticmethod
    def _calculate_equal(total_amount, participants):
        n = len(participants)
        base_share = total_amount / n
        raw = {p["user_id"]: base_share for p in participants}
        return _distribute_rounding_remainder(raw, total_amount)

    @staticmethod
    def _calculate_percentage(total_amount, participants):
        total_pct = sum(Decimal(str(p.get("value") or 0)) for p in participants)
        if total_pct != Decimal("100"):
            raise SplitCalculationError(
                f"Percentages must add up to 100 (got {total_pct})."
            )
        raw = {
            p["user_id"]: total_amount * Decimal(str(p["value"])) / Decimal("100")
            for p in participants
        }
        return _distribute_rounding_remainder(raw, total_amount)

    @staticmethod
    def _calculate_exact(total_amount, participants):
        raw = {p["user_id"]: Decimal(str(p["value"])) for p in participants}
        total_given = sum(raw.values())
        if _quantize(total_given) != _quantize(total_amount):
            raise SplitCalculationError(
                f"Exact split amounts ({total_given}) must sum to the total expense amount ({total_amount})."
            )
        return {uid: _quantize(v) for uid, v in raw.items()}

    @staticmethod
    def _calculate_share(total_amount, participants):
        shares = {p["user_id"]: Decimal(str(p.get("value") or 0)) for p in participants}
        total_shares = sum(shares.values())
        if total_shares <= 0:
            raise SplitCalculationError("Total shares must be greater than zero.")
        raw = {
            uid: total_amount * share / total_shares for uid, share in shares.items()
        }
        return _distribute_rounding_remainder(raw, total_amount)
