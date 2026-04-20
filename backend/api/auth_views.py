from django.contrib.auth.models import User
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
import os


@api_view(["POST"])
@permission_classes([AllowAny])
def google_login(request):
    token = request.data.get("token")
    if not token:
        return Response({"error": "Token required"}, status=400)

    try:
        idinfo = id_token.verify_oauth2_token(
            token,
            google_requests.Request(),
            os.environ.get("GOOGLE_CLIENT_ID"),
        )
    except ValueError as e:
        return Response({"error": str(e)}, status=400)

    email = idinfo.get("email")
    name = idinfo.get("name", "")
    first_name = idinfo.get("given_name", "")
    last_name = idinfo.get("family_name", "")

    if not email:
        return Response({"error": "No email from Google"}, status=400)

    user, created = User.objects.get_or_create(
        email=email,
        defaults={
            "username": email,
            "first_name": first_name,
            "last_name": last_name,
        },
    )

    if not created:
        user.first_name = first_name
        user.last_name = last_name
        user.save()

    token_obj, _ = Token.objects.get_or_create(user=user)

    return Response({
        "token": token_obj.key,
        "user": {
            "email": user.email,
            "name": name,
            "first_name": first_name,
            "last_name": last_name,
        },
    })