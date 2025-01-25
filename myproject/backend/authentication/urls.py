from django.urls import path, include
from .views import RegisterView, CurrentUserView, LogoutView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import UpdateProfileView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('user/', CurrentUserView.as_view(), name='user'),
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('logout/', LogoutView.as_view(), name='logout'),  # Новый маршрут
    path('profile/update/', UpdateProfileView.as_view(), name='profile_update'),
]
