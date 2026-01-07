Implementation Complete! Bearer Token API Version Added

  I've successfully implemented the Bearer token authentication API for superadmins. Here's everything you need to know:

  ---
  What Was Added

  1. User Model Update (app/Models/User.php:11,16)

  - Added HasApiTokens trait from Laravel Sanctum
  - Enables token generation for users

  2. New API Controller (app/Http/Controllers/Api/SuperAdminApiController.php)

  - login() - Get Bearer token
  - logout() - Revoke token
  - onlineUsers() - Get online users (same logic as web version)

  3. API Routes (routes/api.php:94-104)

  - POST /api/admin/login - Public, get token
  - POST /api/admin/logout - Protected, revoke token
  - GET /api/admin/online-users - Protected, get online users

  ---
  How to Use (Step-by-Step)

  Step 1: Login and Get Token

  Endpoint:
  POST http://127.0.0.1:8001/api/admin/login

  Request:
  {
    "email": "superadmin@example.com",
    "password": "your_password"
  }

  Response:
  {
    "success": true,
    "message": "Login successful",
    "token": "1|AbCdEf123456...",
    "user": {
      "id": 1,
      "name": "Super Admin",
      "email": "superadmin@example.com",
      "role": "super_admin"
    }
  }

  Save the token - You'll use it for all subsequent requests!

  ---
  Step 2: Get Online Users

  Endpoint:
  GET http://127.0.0.1:8001/api/admin/online-users

  Headers:
  Authorization: Bearer 1|AbCdEf123456...
  Accept: application/json

  Response:
  {
    "success": true,
    "count": 3,
    "time_window": "5 minutes",
    "session_driver": "redis",
    "note": "Using last_login_at as fallback (session driver: redis)",
    "users": [
      {
        "id": 5,
        "username": "John Doe",
        "company_name": "Acme Corp",
        "last_activity": "2026-01-07 16:30:00",
        "last_activity_human": "2 minutes ago",
        "role": "account_owner"
      },
      {
        "id": 12,
        "username": "Jane Smith",
        "company_name": "Tech Solutions",
        "last_activity": "2026-01-07 16:28:00",
        "last_activity_human": "4 minutes ago",
        "role": "manager"
      }
    ]
  }

  ---
  Step 3: Logout (Optional)

  Endpoint:
  POST http://127.0.0.1:8001/api/admin/logout

  Headers:
  Authorization: Bearer 1|AbCdEf123456...

  Response:
  {
    "success": true,
    "message": "Logged out successfully"
  }

  ---
  Testing with cURL

  Complete Example:

  # Step 1: Login and get token
  curl -X POST http://127.0.0.1:8001/api/admin/login \
    -H "Content-Type: application/json" \
    -H "Accept: application/json" \
    -d '{
      "email": "superadmin@example.com",
      "password": "your_password"
    }'

  # Response will contain the token, copy it

  # Step 2: Get online users (replace YOUR_TOKEN with actual token)
  curl -X GET http://127.0.0.1:8001/api/admin/online-users \
    -H "Authorization: Bearer YOUR_TOKEN" \
    -H "Accept: application/json"

  # Step 3: Logout when done
  curl -X POST http://127.0.0.1:8001/api/admin/logout \
    -H "Authorization: Bearer YOUR_TOKEN" \
    -H "Accept: application/json"

  ---
  Testing with Postman

  1. Login Request:

  - Method: POST
  - URL: http://127.0.0.1:8001/api/admin/login
  - Headers:
    - Content-Type: application/json
    - Accept: application/json
  - Body (JSON):
  {
    "email": "superadmin@example.com",
    "password": "your_password"
  }
  - Copy the token from response

  2. Online Users Request:

  - Method: GET
  - URL: http://127.0.0.1:8001/api/admin/online-users
  - Headers:
    - Authorization: Bearer YOUR_TOKEN
    - Accept: application/json

  ---
  Security Features

  ✓ Only Superadmins - Login validates role === 'super_admin'
  ✓ Active Users Only - Checks status === 'active'
  ✓ Token-Based - Uses Laravel Sanctum bearer tokens
  ✓ Per-Request Validation - Token validated on every request
  ✓ Logout Support - Can revoke tokens when done

  ---
  Error Responses

  Invalid Credentials:

  {
    "message": "The provided credentials are incorrect.",
    "errors": {
      "email": ["The provided credentials are incorrect."]
    }
  }

  Not a Superadmin:

  {
    "message": "Only super admins can access the API.",
    "errors": {
      "email": ["Only super admins can access the API."]
    }
  }

  Missing/Invalid Token:

  {
    "message": "Unauthenticated."
  }

  Forbidden (wrong role):

  {
    "success": false,
    "message": "Only super admins can access this endpoint."
  }

  ---
  Summary

  You now have two ways to access online users:

  | Method | Endpoint                | Auth Type      | Use Case                                |
  |--------|-------------------------|----------------|-----------------------------------------|
  | Web    | /admin/online-users     | Session Cookie | Browser, web apps                       |
  | API    | /api/admin/online-users | Bearer Token   | Mobile apps, scripts, external services |

  Both endpoints return the same data structure and work exactly the same way!