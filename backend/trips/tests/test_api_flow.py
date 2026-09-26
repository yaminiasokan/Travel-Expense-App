"""
Full API-level tests using DRF's APIClient -- these hit real URLs, real
serializers, and real permission classes, not just internal services.
"""
from decimal import Decimal

import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

User = get_user_model()

pytestmark = pytest.mark.django_db


def auth_client(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client


@pytest.fixture
def owner():
    return User.objects.create_user(email="owner@example.com", password="Testpass123", full_name="Owner One")


@pytest.fixture
def member():
    return User.objects.create_user(email="member@example.com", password="Testpass123", full_name="Member One")


class TestAuthFlow:
    def test_register_returns_tokens_and_user(self):
        client = APIClient()
        response = client.post(
            "/api/v1/auth/register/",
            {
                "email": "new@example.com",
                "full_name": "New User",
                "password": "StrongPass123",
                "password_confirm": "StrongPass123",
            },
            format="json",
        )
        assert response.status_code == 201
        assert response.data["success"] is True
        assert "access" in response.data["tokens"]
        assert response.data["user"]["email"] == "new@example.com"

    def test_register_rejects_mismatched_passwords(self):
        client = APIClient()
        response = client.post(
            "/api/v1/auth/register/",
            {
                "email": "new2@example.com",
                "full_name": "New User",
                "password": "StrongPass123",
                "password_confirm": "Different123",
            },
            format="json",
        )
        assert response.status_code == 400

    def test_login_with_correct_credentials(self, owner):
        client = APIClient()
        response = client.post(
            "/api/v1/auth/login/",
            {"email": "owner@example.com", "password": "Testpass123"},
            format="json",
        )
        assert response.status_code == 200
        assert response.data["success"] is True
        assert "access" in response.data["tokens"]

    def test_login_with_wrong_password_rejected(self, owner):
        client = APIClient()
        response = client.post(
            "/api/v1/auth/login/",
            {"email": "owner@example.com", "password": "wrongpass"},
            format="json",
        )
        assert response.status_code == 401

    def test_unauthenticated_request_rejected(self):
        client = APIClient()
        response = client.get("/api/v1/trips/")
        assert response.status_code == 401


class TestTripAndExpenseFlow:
    def test_create_trip_join_add_expense_and_settle(self, owner, member):
        owner_client = auth_client(owner)

        create_resp = owner_client.post(
            "/api/v1/trips/",
            {
                "name": "Manali Trip",
                "destination": "Manali",
                "currency": "INR",
                "start_date": "2026-08-01",
                "end_date": "2026-08-05",
            },
            format="json",
        )
        assert create_resp.status_code == 201
        trip_id = create_resp.data["id"]
        invite_code = create_resp.data["invite_code"]

        # Member joins via invite code
        member_client = auth_client(member)
        join_resp = member_client.post("/api/v1/trips/join/", {"code": invite_code}, format="json")
        assert join_resp.status_code == 200
        assert join_resp.data["id"] == trip_id

        # Owner adds an equal-split expense between owner and member
        expense_resp = owner_client.post(
            "/api/v1/expenses/",
            {
                "trip": trip_id,
                "title": "Hotel booking",
                "amount": "4000.00",
                "paid_by_id": str(owner.id),
                "split_type": "equal",
                "expense_date": "2026-08-01",
                "split_between": [{"user_id": str(owner.id)}, {"user_id": str(member.id)}],
            },
            format="json",
        )
        assert expense_resp.status_code == 201, expense_resp.data
        assert len(expense_resp.data["splits"]) == 2

        # Check balances
        balances_resp = owner_client.get(f"/api/v1/trips/{trip_id}/balances/")
        assert balances_resp.status_code == 200
        balances_by_email = {b["user"]["email"]: Decimal(b["net_balance"]) for b in balances_resp.data}
        assert balances_by_email["owner@example.com"] == Decimal("2000.00")
        assert balances_by_email["member@example.com"] == Decimal("-2000.00")

        # Generate settlements
        gen_resp = owner_client.post(f"/api/v1/trips/{trip_id}/settlements/generate/")
        assert gen_resp.status_code == 200
        settlements = gen_resp.data["settlements"]
        assert len(settlements) == 1
        assert settlements[0]["from_user"]["email"] == "member@example.com"
        assert settlements[0]["to_user"]["email"] == "owner@example.com"
        assert Decimal(settlements[0]["amount"]) == Decimal("2000.00")

        # Member pays it off
        settlement_id = settlements[0]["id"]
        pay_resp = member_client.post(
            f"/api/v1/settlements/{settlement_id}/pay/", {"amount": "2000.00"}, format="json"
        )
        assert pay_resp.status_code == 200
        assert pay_resp.data["status"] == "paid"

    def test_non_member_cannot_see_trip(self, owner, member):
        owner_client = auth_client(owner)
        create_resp = owner_client.post(
            "/api/v1/trips/",
            {"name": "Private Trip", "currency": "INR"},
            format="json",
        )
        trip_id = create_resp.data["id"]

        member_client = auth_client(member)
        detail_resp = member_client.get(f"/api/v1/trips/{trip_id}/")
        assert detail_resp.status_code == 404

    def test_non_owner_cannot_delete_trip(self, owner, member):
        owner_client = auth_client(owner)
        create_resp = owner_client.post(
            "/api/v1/trips/", {"name": "Trip X", "currency": "INR"}, format="json"
        )
        trip_id = create_resp.data["id"]
        invite_code = create_resp.data["invite_code"]

        member_client = auth_client(member)
        member_client.post("/api/v1/trips/join/", {"code": invite_code}, format="json")

        delete_resp = member_client.delete(f"/api/v1/trips/{trip_id}/")
        assert delete_resp.status_code == 403
