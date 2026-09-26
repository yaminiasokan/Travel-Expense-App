from rest_framework.routers import DefaultRouter

from .views import AttachmentViewSet, CategoryViewSet, ExpenseViewSet

router = DefaultRouter()
router.register(r"expenses", ExpenseViewSet, basename="expense")
router.register(r"categories", CategoryViewSet, basename="category")
router.register(r"attachments", AttachmentViewSet, basename="attachment")

urlpatterns = router.urls
