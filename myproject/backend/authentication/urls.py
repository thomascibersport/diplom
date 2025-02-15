from django.urls import path
from .views import (
    RegisterView, 
    CurrentUserView, 
    LogoutView, 
    UpdateProfileView,
    UploadAvatarView,
    UpdatePasswordView,
    RouteRecordCreateView
)
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.conf import settings
from django.conf.urls.static import static
from .views import RouteRecordListView
from .views import RouteRecordListView, RouteRecordDeleteView
from .views import StatisticsView
urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("user/", CurrentUserView.as_view(), name="user"),
    path("login/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("profile/update/", UpdateProfileView.as_view(), name="profile_update"),
    path("upload-avatar/", UploadAvatarView.as_view(), name="upload-avatar"),
    path("update-password/", UpdatePasswordView.as_view(), name="update-password"),
    path("routes/", RouteRecordCreateView.as_view(), name="route_record_create"),
    path('api/route-records/', RouteRecordListView.as_view(), name='route_record_list'),
    path('api/routes/', RouteRecordListView.as_view(), name='route-record-list'),
    path('api/routes/<int:pk>/', RouteRecordDeleteView.as_view(), name='route-record-delete'),
    path('api/statistics/', StatisticsView.as_view(), name='statistics'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)