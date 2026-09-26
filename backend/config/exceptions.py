"""Standardized API error response format used across the whole project."""
import logging

from rest_framework.views import exception_handler as drf_exception_handler

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """
    Wrap every DRF error response in a consistent envelope:

    {
        "success": false,
        "message": "<human readable summary>",
        "errors": {...} | [...] | "<detail>"
    }
    """
    response = drf_exception_handler(exc, context)

    if response is None:
        logger.exception("Unhandled exception in %s", context.get("view"))
        return response

    detail = response.data
    if isinstance(detail, dict):
        message = detail.get("detail", "Request failed")
    elif isinstance(detail, list) and detail:
        message = str(detail[0])
    else:
        message = "Request failed"

    response.data = {
        "success": False,
        "message": message,
        "errors": detail,
    }
    return response
