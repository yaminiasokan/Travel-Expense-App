from decimal import Decimal

import pytest

from expenses.services import ExpenseSplitService, SplitCalculationError


class TestEqualSplit:
    def test_divides_evenly(self):
        result = ExpenseSplitService.calculate(
            "equal", Decimal("300.00"), [{"user_id": "a"}, {"user_id": "b"}, {"user_id": "c"}]
        )
        assert result == {"a": Decimal("100.00"), "b": Decimal("100.00"), "c": Decimal("100.00")}
        assert sum(result.values()) == Decimal("300.00")

    def test_handles_non_divisible_remainder(self):
        """100 / 3 = 33.333... -- must distribute leftover cents, summing exactly to 100."""
        result = ExpenseSplitService.calculate(
            "equal", Decimal("100.00"), [{"user_id": "a"}, {"user_id": "b"}, {"user_id": "c"}]
        )
        assert sum(result.values()) == Decimal("100.00")
        # No single person's share should be off by more than a cent from the others.
        values = sorted(result.values())
        assert values[-1] - values[0] <= Decimal("0.01")

    def test_single_participant_gets_everything(self):
        result = ExpenseSplitService.calculate("equal", Decimal("42.50"), [{"user_id": "a"}])
        assert result == {"a": Decimal("42.50")}


class TestPercentageSplit:
    def test_valid_percentages_sum_to_total(self):
        result = ExpenseSplitService.calculate(
            "percentage", Decimal("500.00"),
            [{"user_id": "a", "value": Decimal("60")}, {"user_id": "b", "value": Decimal("40")}],
        )
        assert result == {"a": Decimal("300.00"), "b": Decimal("200.00")}

    def test_percentages_not_summing_to_100_rejected(self):
        with pytest.raises(SplitCalculationError):
            ExpenseSplitService.calculate(
                "percentage", Decimal("100.00"),
                [{"user_id": "a", "value": Decimal("60")}, {"user_id": "b", "value": Decimal("30")}],
            )

    def test_fractional_percentages_still_sum_exactly(self):
        result = ExpenseSplitService.calculate(
            "percentage", Decimal("1000.00"),
            [
                {"user_id": "a", "value": Decimal("33.33")},
                {"user_id": "b", "value": Decimal("33.33")},
                {"user_id": "c", "value": Decimal("33.34")},
            ],
        )
        assert sum(result.values()) == Decimal("1000.00")


class TestExactSplit:
    def test_exact_amounts_matching_total_accepted(self):
        result = ExpenseSplitService.calculate(
            "exact", Decimal("150.00"),
            [{"user_id": "a", "value": Decimal("100.00")}, {"user_id": "b", "value": Decimal("50.00")}],
        )
        assert result == {"a": Decimal("100.00"), "b": Decimal("50.00")}

    def test_exact_amounts_not_matching_total_rejected(self):
        with pytest.raises(SplitCalculationError):
            ExpenseSplitService.calculate(
                "exact", Decimal("150.00"),
                [{"user_id": "a", "value": Decimal("100.00")}, {"user_id": "b", "value": Decimal("40.00")}],
            )


class TestShareSplit:
    def test_shares_split_proportionally(self):
        result = ExpenseSplitService.calculate(
            "share", Decimal("400.00"),
            [{"user_id": "a", "value": Decimal("1")}, {"user_id": "b", "value": Decimal("3")}],
        )
        assert result == {"a": Decimal("100.00"), "b": Decimal("300.00")}

    def test_zero_total_shares_rejected(self):
        with pytest.raises(SplitCalculationError):
            ExpenseSplitService.calculate(
                "share", Decimal("100.00"),
                [{"user_id": "a", "value": Decimal("0")}, {"user_id": "b", "value": Decimal("0")}],
            )


class TestGeneralValidation:
    def test_empty_participants_rejected(self):
        with pytest.raises(SplitCalculationError):
            ExpenseSplitService.calculate("equal", Decimal("100.00"), [])

    def test_duplicate_participants_rejected(self):
        with pytest.raises(SplitCalculationError):
            ExpenseSplitService.calculate(
                "equal", Decimal("100.00"), [{"user_id": "a"}, {"user_id": "a"}]
            )

    def test_unsupported_split_type_rejected(self):
        with pytest.raises(SplitCalculationError):
            ExpenseSplitService.calculate("bogus", Decimal("100.00"), [{"user_id": "a"}])
