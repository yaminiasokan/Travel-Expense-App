"""
Unit tests for the settlement engine's pure math: simplify_debts().

These tests don't touch the database at all -- they exercise the greedy
min-cash-flow algorithm directly against hand-computed balance scenarios,
so they're fast and unambiguous about what the algorithm guarantees:

  1. Every simplified transaction list sums to zero net movement.
  2. No more transactions are produced than necessary (n-1 for n non-zero
     balances is the theoretical ceiling; many real scenarios do better).
  3. The classic "A paid 5000, B paid 1000, C paid 0, split equally"
     example from the spec resolves to exactly the two transactions
     described there.
"""
from decimal import Decimal

import pytest

from settlements.services import simplify_debts

pytestmark = pytest.mark.django_db


def total_paid_by(transactions, user_id):
    return sum(amt for debtor, creditor, amt in transactions if debtor == user_id)


def total_received_by(transactions, user_id):
    return sum(amt for debtor, creditor, amt in transactions if creditor == user_id)


class TestSimplifyDebtsBasics:
    def test_spec_example_two_transactions(self):
        """
        A paid 5000, B paid 1000, C paid 0. Total 6000, equal 3-way split
        => each owes 2000.
        Net balances: A = 5000-2000=+3000, B=1000-2000=-1000, C=0-2000=-2000.
        Expected settlement: B->A 1000, C->A 2000 (order may vary but the
        amounts and pairing must match).
        """
        balances = {
            "A": Decimal("3000.00"),
            "B": Decimal("-1000.00"),
            "C": Decimal("-2000.00"),
        }
        transactions = simplify_debts(balances)

        assert len(transactions) == 2
        # A receives everything; B and C pay exactly their debts.
        assert total_received_by(transactions, "A") == Decimal("3000.00")
        assert total_paid_by(transactions, "B") == Decimal("1000.00")
        assert total_paid_by(transactions, "C") == Decimal("2000.00")
        # Every transaction must flow FROM a debtor TO a creditor, never to self.
        for debtor, creditor, amount in transactions:
            assert debtor != creditor
            assert amount > 0

    def test_two_person_simple_debt(self):
        balances = {"A": Decimal("50.00"), "B": Decimal("-50.00")}
        transactions = simplify_debts(balances)
        assert transactions == [("B", "A", Decimal("50.00"))]

    def test_already_settled_produces_no_transactions(self):
        balances = {"A": Decimal("0.00"), "B": Decimal("0.00"), "C": Decimal("0.00")}
        assert simplify_debts(balances) == []

    def test_zero_dict_produces_no_transactions(self):
        assert simplify_debts({}) == []

    def test_minimum_transaction_count_for_n_participants(self):
        """
        Classic minimization case: 4 people, balances +30, +30, -30, -30.
        Optimal is 2 transactions (not the naive 3-4 a pairwise settlement
        would produce).
        """
        balances = {
            "A": Decimal("30.00"),
            "B": Decimal("30.00"),
            "C": Decimal("-30.00"),
            "D": Decimal("-30.00"),
        }
        transactions = simplify_debts(balances)
        assert len(transactions) == 2

    def test_chain_settles_completely(self):
        """5 participants with staggered balances -- every cent must clear."""
        balances = {
            "A": Decimal("120.00"),
            "B": Decimal("80.00"),
            "C": Decimal("-40.00"),
            "D": Decimal("-60.00"),
            "E": Decimal("-100.00"),
        }
        transactions = simplify_debts(balances)

        net = {uid: Decimal("0.00") for uid in balances}
        for debtor, creditor, amount in transactions:
            net[debtor] -= amount
            net[creditor] += amount

        for uid, starting_balance in balances.items():
            # Each participant's net movement (money received minus money
            # paid via these transactions) should exactly match what they
            # were owed/owed-by at the start -- i.e. the transactions
            # neutralize the starting balance.
            assert net[uid] == starting_balance

        # At most n-1 transactions for n participants.
        assert len(transactions) <= len(balances) - 1

    def test_never_exceeds_n_minus_one_transactions_random_cases(self):
        """
        Property-style check across several generated scenarios: the
        number of transactions never exceeds (participants_with_nonzero
        balance - 1), which is the theoretical maximum for optimal debt
        simplification.
        """
        scenarios = [
            {"A": Decimal("10"), "B": Decimal("10"), "C": Decimal("10"), "D": Decimal("-30")},
            {"A": Decimal("100"), "B": Decimal("-25"), "C": Decimal("-25"),
             "D": Decimal("-25"), "E": Decimal("-25")},
            {"A": Decimal("15.50"), "B": Decimal("-7.25"), "C": Decimal("-8.25")},
        ]
        for balances in scenarios:
            transactions = simplify_debts(balances)
            nonzero_participants = sum(1 for v in balances.values() if v != 0)
            assert len(transactions) <= max(nonzero_participants - 1, 0)

    def test_rounding_safe_fractional_cents(self):
        """
        Balances that don't divide evenly (e.g. thirds of a rupee) must
        still fully reconcile to zero after settlement, with no stray
        fractions of a cent left over.
        """
        balances = {
            "A": Decimal("66.67"),
            "B": Decimal("33.33"),
            "C": Decimal("-100.00"),
        }
        transactions = simplify_debts(balances)
        net = {uid: Decimal("0.00") for uid in balances}
        for debtor, creditor, amount in transactions:
            net[debtor] -= amount
            net[creditor] += amount
        for uid, starting_balance in balances.items():
            assert net[uid] == starting_balance
