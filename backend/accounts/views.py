from django.contrib.auth import get_user_model
from rest_framework import generics, permissions, status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .models import EmailVerificationToken, PasswordResetToken
from .serializers import (
    ChangePasswordSerializer,
    ForgotPasswordSerializer,
    RegisterSerializer,
    ResetPasswordSerializer,
    UserSerializer,
    VerifyEmailSerializer,
)
from .services import AccountService

User = get_user_model()


def tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {"access": str(refresh.access_token), "refresh": str(refresh)}


class RegisterView(generics.CreateAPIView):
    """POST /api/v1/auth/register/"""

    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        AccountService.issue_verification_email(user)
        tokens = tokens_for_user(user)
        return Response(
            {
                "success": True,
                "message": "Account created. Check your email to verify your address.",
                "user": UserSerializer(user).data,
                "tokens": tokens,
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(TokenObtainPairView):
    """POST /api/v1/auth/login/  (email + password -> access/refresh tokens)"""

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            email = request.data.get("email")
            user = User.objects.filter(email__iexact=email).first()
            response.data = {
                "success": True,
                "message": "Login successful.",
                "user": UserSerializer(user).data if user else None,
                "tokens": {
                    "access": response.data["access"],
                    "refresh": response.data["refresh"],
                },
            }
        return response


class RefreshTokenView(TokenRefreshView):
    """POST /api/v1/auth/refresh/"""
    pass


class LogoutView(APIView):
    """POST /api/v1/auth/logout/  - blacklists the provided refresh token."""

    def post(self, request):
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return Response(
                {"success": False, "message": "Refresh token is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except Exception:
            # Blacklist app may not be installed; treat as a soft logout.
            pass
        return Response({"success": True, "message": "Logged out."})


class MeView(generics.RetrieveUpdateAPIView):
    """GET/PATCH /api/v1/auth/me/"""

    serializer_class = UserSerializer
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_object(self):
        return self.request.user


class ChangePasswordView(APIView):
    """POST /api/v1/auth/change-password/"""

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"success": True, "message": "Password updated."})


class ForgotPasswordView(APIView):
    """POST /api/v1/auth/forgot-password/"""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        AccountService.issue_password_reset(serializer.validated_data["email"])
        return Response(
            {"success": True, "message": "If that email exists, a reset link has been sent."}
        )


class ResetPasswordView(APIView):
    """POST /api/v1/auth/reset-password/"""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            AccountService.reset_password(
                serializer.validated_data["token"], serializer.validated_data["new_password"]
            )
        except PasswordResetToken.DoesNotExist:
            return Response(
                {"success": False, "message": "Invalid or expired token."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response({"success": True, "message": "Password has been reset."})


class VerifyEmailView(APIView):
    """POST /api/v1/auth/verify-email/"""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = VerifyEmailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            AccountService.verify_email(serializer.validated_data["token"])
        except EmailVerificationToken.DoesNotExist:
            return Response(
                {"success": False, "message": "Invalid or expired token."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response({"success": True, "message": "Email verified."})
