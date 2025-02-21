# API Documentation

## Authentication

### POST /api/auth/signup
Create a new user account.

**Request Body:**
```json
{
  "email": "string",
  "password": "string",
  "displayName": "string"
}
```

**Response:**
```json
{
  "success": true,
  "userId": "string"
}
```

### POST /api/auth/login
Authenticate a user.

**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "success": true,
  "token": "string"
}
```

## Campaigns

### GET /api/campaigns
Get user's campaigns with pagination.

**Query Parameters:**
- page (optional): number
- limit (optional): number
- status (optional): 'draft' | 'active' | 'completed' | 'failed'

**Response:**
```json
{
  "data": [
    {
      "id": "string",
      "name": "string",
      "status": "string",
      "sentCount": number,
      "openCount": number,
      "clickCount": number
    }
  ],
  "total": number,
  "currentPage": number,
  "totalPages": number,
  "hasMore": boolean
}
```

### POST /api/campaigns
Create a new campaign.

**Request Body:**
```json
{
  "name": "string",
  "niche": "string",
  "totalEmails": number
}
```

### POST /api/campaigns/{id}/send
Start sending a campaign.

**Request Body:**
```json
{
  "templateId": "string"
}
```

## Email Templates

### GET /api/templates
Get email templates for a niche.

**Query Parameters:**
- niche: string

**Response:**
```json
{
  "templates": [
    {
      "id": "string",
      "name": "string",
      "subject": "string",
      "body": "string",
      "performance": {
        "openRate": number,
        "clickRate": number
      }
    }
  ]
}
```

## Analytics

### GET /api/analytics/campaign/{id}
Get campaign analytics.

**Response:**
```json
{
  "sentCount": number,
  "openRate": number,
  "clickRate": number,
  "bounceRate": number,
  "timeSeriesData": [
    {
      "date": "string",
      "opens": number,
      "clicks": number
    }
  ]
}
```

### GET /api/analytics/user
Get user's overall analytics.

**Response:**
```json
{
  "totalCampaigns": number,
  "avgOpenRate": number,
  "avgClickRate": number,
  "nichePerformance": [
    {
      "niche": "string",
      "campaigns": number,
      "avgOpenRate": number
    }
  ]
}
```

## Payments

### POST /api/payments/initialize
Initialize a payment.

**Request Body:**
```json
{
  "amount": number,
  "planId": "string",
  "interval": "monthly" | "yearly"
}
```

**Response:**
```json
{
  "success": true,
  "paymentUrl": "string",
  "transactionId": "string"
}
```

### GET /api/payments/verify/{transactionId}
Verify payment status.

**Response:**
```json
{
  "success": true,
  "status": "completed" | "pending" | "failed"
}
```

## Shopify Verification

### POST /api/verify-shopify
Start Shopify store verification.

**Request Body:**
```json
{
  "storeDomain": "string"
}
```

### GET /api/verify-shopify
Check verification status.

**Response:**
```json
{
  "success": true,
  "isVerified": boolean
}
```

## Rate Limits

All API endpoints are rate-limited. The limits are:
- Authentication endpoints: 5 requests per minute
- Campaign endpoints: 60 requests per minute
- Analytics endpoints: 100 requests per minute

Rate limit headers are included in all responses:
- X-RateLimit-Limit: Maximum requests allowed in the window
- X-RateLimit-Remaining: Remaining requests in the current window
- X-RateLimit-Reset: Time when the rate limit resets (Unix timestamp)

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "error": "Description of the error"
}
```

### 401 Unauthorized
```json
{
  "error": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "error": "Insufficient permissions"
}
```

### 429 Too Many Requests
```json
{
  "error": "Rate limit exceeded",
  "resetAt": "timestamp"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

## Webhooks

### POST /api/webhooks/sendgrid
SendGrid email event webhook.

### POST /api/webhooks/crypto-payment
NOWPayments IPN webhook.

## Authentication

All API endpoints (except authentication endpoints) require a Bearer token in the Authorization header:

```
Authorization: Bearer <token>
```

## Testing

For testing the API in development, use the following base URL:
```
http://localhost:3000/api
```

For production:
```
https://your-domain.com/api
``` 