"""
Service layer for the accounts app.

Views stay thin (HTTP concerns only); business logic and side effects
(email sending, token issuance) live here so they're reusable and testable
in isolation from the request/response cycle.
"""
import logging

from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone

from .models import EmailVerificationToken, PasswordResetToken, User

logger = logging.getLogger(__name__)


class AccountService:
    @staticmethod
    def issue_verification_email(user: User) -> EmailVerificationToken:
        token = EmailVerificationToken.objects.create(user=user)
        link = f"{settings.FRONTEND_BASE_URL}/verify-email?token={token.token}"
        AccountService._send_email(
            subject="Verify your email",
            message=f"Hi {user.get_short_name()}, verify your account: {link}",
            to=[user.email],
        )
        return token

    @staticmethod
    def verify_email(token_value) -> User:
        token = EmailVerificationToken.objects.select_related("user").get(
            token=token_value, used=False
        )
        token.used = True
        token.save(update_fields=["used"])
        user = token.user
        user.is_verified = True
        user.save(update_fields=["is_verified"])
        return user

    @staticmethod
    def issue_password_reset(email: str) -> None:
        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            # Do not reveal whether the email exists.
            logger.info("Password reset requested for unknown email: %s", email)
            return
        token = PasswordResetToken.objects.create(user=user)
        link = f"{settings.FRONTEND_BASE_URL}/reset-password?token={token.token}"
        AccountService._send_email(
            subject="Reset your password",
            message=f"Hi {user.get_short_name()}, reset your password: {link}",
            to=[user.email],
        )

    @staticmethod
    def reset_password(token_value, new_password: str) -> User:
        token = PasswordResetToken.objects.select_related("user").get(
            token=token_value, used=False
        )
        # Reset tokens are valid for 1 hour.
        if (timezone.now() - token.created_at).total_seconds() > 3600:
            raise PasswordResetToken.DoesNotExist("Token expired")
        token.used = True
        token.save(update_fields=["used"])
        user = token.user
        user.set_password(new_password)
        user.save(update_fields=["password"])
        return user

    @staticmethod
    def _send_email(subject: str, message: str, to: list[str]) -> None:
        """
        Uses Django's email backend. In development this is configured to
        print to the console (see settings) instead of requiring real SMTP
        credentials -- swap EMAIL_BACKEND in production.
        """
        try:
            send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, to, fail_silently=False)
        except Exception:  # pragma: no cover - defensive logging only
            logger.exception("Failed to send email to %s", to)
