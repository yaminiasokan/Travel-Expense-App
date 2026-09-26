"""
Settlement engine.

Two responsibilities, kept separate so each can be unit tested in isolation:

1. `compute_balances(trip)`  — for every trip member, net_balance =
   total amount they paid out - total amount they owe (their share across
   all expenses). Positive = they are owed money. Negative = they owe money.

2. `simplify_debts(balances)` — a pure function that takes those net
   balances and returns the MINIMUM number of (debtor, creditor, amount)
   transactions that settle everyone up. This is the classic "optimal debt
   simplification" problem, solved greedily: repeatedly match the biggest
   debtor against the biggest creditor. This greedy approach is provably
   optimal for this problem (it is equivalent to the min-cash-flow
   algorithm commonly used by expense-splitting apps).

`generate_settlements(trip)` ties both together and persists the result as
Settlement rows, replacing any still-pending settlements (paid/partial
history is preserved).
"""
import heapq
import uuid
from decimal import ROUND_HALF_UP, Decimal
from typing import Dict, List, Tuple

from django.db import transaction

from expenses.models import Expense, ExpenseSplit
from trips.models import Notification, Trip, TripMember
from trips.services import NotificationService

from .models import Payment, Settlement

CENTS = Decimal("0.01")


def _q(value: Decimal) -> Decimal:
    return Decimal(value).quantize(CENTS, rounding=ROUND_HALF_UP)


def compute_balances(trip: Trip) -> Dict[str, Decimal]:
    """
    Returns {user_id (str): net_balance} for every member of the trip.
    net_balance > 0  => this user is owed money overall
    net_balance < 0  => this user owes money overall
    Balances always sum to (approximately, to-the-cent) zero.
    """
    member_ids = list(TripMember.objects.filter(trip=trip).values_list("user_id", flat=True))
    balances: Dict[str, Decimal] = {str(uid): Decimal("0.00") for uid in member_ids}

    for expense in Expense.objects.filter(trip=trip).only("id", "amount", "paid_by_id"):
        uid = str(expense.paid_by_id)
        balances.setdefault(uid, Decimal("0.00"))
        balances[uid] += Decimal(expense.amount)

    for split in ExpenseSplit.objects.filter(expense__trip=trip).only("user_id", "amount_owed"):
        uid = str(split.user_id)
        balances.setdefault(uid, Decimal("0.00"))
        balances[uid] -= Decimal(split.amount_owed)

    return {uid: _q(bal) for uid, bal in balances.items()}


def simplify_debts(balances: Dict[str, Decimal]) -> List[Tuple[str, str, Decimal]]:
    """
    Pure function: given {user_id: net_balance}, return a minimal list of
    (debtor_id, creditor_id, amount) transactions that zero everyone out.

    Algorithm (greedy max-heap matching):
      - Push all debtors (negative balance) into a max-heap keyed by |amount|.
      - Push all creditors (positive balance) into a max-heap keyed by amount.
      - Repeatedly pop the largest debtor and largest creditor, settle the
        smaller of the two amounts between them, push back any remainder.
      - This produces at most (n - 1) transactions for n participants with
        non-zero balances, which is optimal for this problem.
    """
    EPS = Decimal("0.01")
    debtors = []  # max-heap of (amount_owed, user_id) via negative amount for heapq
    creditors = []
    for uid, bal in balances.items():
        if bal <= -EPS:
            heapq.heappush(debtors, (bal, uid))  # bal is negative; smallest (most negative) pops first
        elif bal >= EPS:
            heapq.heappush(creditors, (-bal, uid))  # negate to pop largest first

    transactions: List[Tuple[str, str, Decimal]] = []

    while debtors and creditors:
        debtor_bal, debtor_id = heapq.heappop(debtors)
        creditor_neg_bal, creditor_id = heapq.heappop(creditors)
        debtor_owes = -debtor_bal          # positive amount this debtor still owes
        creditor_owed = -creditor_neg_bal  # positive amount this creditor is still owed

        settle_amount = min(debtor_owes, creditor_owed)
        settle_amount = _q(settle_amount)
        if settle_amount > 0:
            transactions.append((debtor_id, creditor_id, settle_amount))

        remaining_debtor = _q(debtor_owes - settle_amount)
        remaining_creditor = _q(creditor_owed - settle_amount)

        if remaining_debtor >= EPS:
            heapq.heappush(debtors, (-remaining_debtor, debtor_id))
        if remaining_creditor >= EPS:
            heapq.heappush(creditors, (-remaining_creditor, creditor_id))

    return transactions


class SettlementService:
    @staticmethod
    @transaction.atomic
    def generate_settlements(trip: Trip) -> List[Settlement]:
        """
        Recomputes balances from scratch and regenerates the trip's pending
        settlements. Settlements that already have payments recorded
        (partial/paid) are left untouched so payment history is never lost;
        only fully PENDING (untouched) settlements are replaced.
        """
        balances = compute_balances(trip)
        transactions = simplify_debts(balances)

        Settlement.objects.filter(trip=trip, status=Settlement.Status.PENDING).delete()

        created = []
        for debtor_id, creditor_id, amount in transactions:
            settlement, _ = Settlement.objects.get_or_create(
                trip=trip,
                from_user_id=uuid.UUID(str(debtor_id)),
                to_user_id=uuid.UUID(str(creditor_id)),
                status=Settlement.Status.PENDING,
                defaults={"amount": amount},
            )
            if settlement.amount != amount:
                settlement.amount = amount
                settlement.save(update_fields=["amount"])
            created.append(settlement)

        if created:
            NotificationService.notify_trip_members(
                trip,
                Notification.NotificationType.SETTLEMENT_GENERATED,
                f"Settlements recalculated for {trip.name}",
            )
        return created

    @staticmethod
    @transaction.atomic
    def record_payment(settlement: Settlement, amount: Decimal, recorded_by, note: str = "") -> Payment:
        amount = _q(Decimal(amount))
        if amount <= 0:
            raise ValueError("Payment amount must be positive.")
        if amount > settlement.remaining_amount + CENTS:
            raise ValueError("Payment exceeds the remaining settlement amount.")

        payment = Payment.objects.create(
            settlement=settlement, amount=amount, recorded_by=recorded_by, note=note
        )
        settlement.amount_paid = _q(settlement.amount_paid + amount)
        settlement.status = (
            Settlement.Status.PAID
            if settlement.amount_paid >= settlement.amount - CENTS
            else Settlement.Status.PARTIAL
        )
        settlement.save(update_fields=["amount_paid", "status", "updated_at"])

        NotificationService.notify_user(
            settlement.to_user,
            Notification.NotificationType.PAYMENT_RECEIVED,
            f"{recorded_by.get_short_name()} paid you {amount} for {settlement.trip.name}",
            trip=settlement.trip,
        )
        return payment
