# Lead Generation API

Transform your outreach with our powerful lead generation API, powered by Apollo.io integration.

## 🚀 Core Features

### 1. Lead Search & Discovery
```http
GET /api/v1/leads
```
Find qualified leads based on:
```json
{
  "industry": ["Fashion"],
  "title": ["owner", "CEO"],
  "limit": 100
}
```

What you get:
- Industry-targeted leads
- Professional titles
- Verified business information
- Lead quality scores

### 2. Lead Management
```http
POST /api/v1/leads
```
Store and manage your leads with:
- Contact information tracking
- Lead scoring
- Data enrichment
- Activity history

### 3. Performance Analytics
```http
GET /api/user/stats
```
Track your lead generation metrics:
```json
{
  "metrics": {
    "searched": 1000,
    "qualified": 250,
    "enriched": 200
  }
}
```

## 💎 Pricing Plans

### Free Trial
- 25 lead searches
- 14 days access
- Basic features
- No credit card needed

### Paid Plans
```json
{
  "starter": {
    "perfect_for": "Starting teams",
    "credits": 150,
    "price": 29,
    "features": [
      "Lead search",
      "Basic enrichment",
      "Standard analytics"
    ]
  },
  "growth": {
    "perfect_for": "Growing teams",
    "credits": 500,
    "price": 79,
    "features": [
      "Advanced search",
      "Full enrichment",
      "Detailed analytics"
    ]
  },
  "pro": {
    "perfect_for": "Power users",
    "credits": 1500,
    "price": 149,
    "features": [
      "Premium search",
      "Bulk enrichment",
      "Advanced analytics"
    ]
  }
}
```

## 🔒 Security & Rate Limits

```http
Authorization: Bearer YOUR_API_KEY
```

Rate limits:
- 100 requests/minute
- 1,000 requests/day
- 10,000 requests/month

## 📈 Credit System

- 1 credit per lead search
- Credits deducted on successful search
- Monitor usage in real-time
- Purchase more credits as needed

## 🛟 Error Handling

```json
{
  "error": {
    "code": "insufficient_credits",
    "message": "Not enough credits",
    "remaining": 5
  }
}
```

## 💡 Best Practices

1. **Efficient Searching**
- Use specific industry filters
- Target relevant titles
- Set appropriate limits

2. **Credit Management**
- Monitor credit balance
- Purchase before depletion
- Track usage patterns

Start your free trial today and enhance your lead generation capabilities with our API.
