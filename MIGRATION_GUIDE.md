# Quick Reference: API v1 Migration

## 🔄 Endpoint Changes

### User Management
| Old Endpoint | New Endpoint | Notes |
|-------------|--------------|-------|
| `GET /api/coaches` | `GET /api/v1/users?role=coach` | Consolidated |
| `GET /api/entrepreneurs` | `GET /api/v1/users?role=entrepreneur` | Consolidated |
| `GET /api/me` | `GET /api/v1/users/profile` | Main endpoint |
| `GET /api/me` | `GET /api/v1/me` | Alias for convenience |
| `GET /api/me/sessions` | `GET /api/v1/sessions` | Already filtered by context |
| `GET /api/me/goals` | `GET /api/v1/goals` | Already filtered by context |
| `GET /api/me/payments` | `GET /api/v1/payments` | Already filtered by context |

### New Endpoints
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/payments/:id/invoice` | GET | Download invoice PDF |
| `/api/v1/payments/:id/send-invoice` | POST | Email invoice to coach |
| `/api/v1/sessions/:id/rating` | POST | Submit session feedback |

## 🎯 Quick Examples

### Filter Users by Role
```bash
# Get all coaches
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/v1/users?role=coach

# Get all entrepreneurs  
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/v1/users?role=entrepreneur
```

### Download Invoice PDF
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/v1/payments/507f1f77bcf86cd799439011/invoice \
  -o invoice.pdf
```

### Send Invoice Email
```bash
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  http://localhost:5000/api/v1/payments/507f1f77bcf86cd799439011/send-invoice
```

### Submit Session Rating
```bash
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "score": 5,
    "comment": "Excellent session!",
    "feedback": "Very helpful insights on product development."
  }' \
  http://localhost:5000/api/v1/sessions/507f1f77bcf86cd799439020/rating
```

## 🔑 Authorization Matrix

| Endpoint | Admin | Manager | Coach | Entrepreneur |
|----------|-------|---------|-------|--------------|
| `GET /users` | ✅ | ✅ | ❌ | ❌ |
| `GET /users?role=*` | ✅ | ✅ | ❌ | ❌ |
| `GET /users/profile` | ✅ | ✅ | ✅ | ✅ |
| `GET /payments/:id/invoice` | ✅ | ✅ | ✅ (own) | ❌ |
| `POST /payments/:id/send-invoice` | ✅ | ✅ | ❌ | ❌ |
| `POST /sessions/:id/rating` | ✅ | ✅ | ❌ | ✅ (own) |

## 📝 Response Format Changes

### User List (with role filter)
```json
{
  "data": [
    {
      "_id": "...",
      "email": "coach@example.com",
      "role": "coach",
      "firstName": "John",
      "lastName": "Doe",
      "hourlyRate": 100
    }
  ],
  "meta": {
    "total": 15,
    "page": 1,
    "limit": 20
  }
}
```

### Session Rating Response
```json
{
  "message": "Rating submitted successfully",
  "rating": {
    "score": 5,
    "comment": "Excellent session!",
    "feedback": "Detailed feedback...",
    "submittedBy": "507f...",
    "submittedAt": "2025-11-26T10:30:00.000Z"
  }
}
```

## ⚡ Performance Notes

### Puppeteer PDF Generation
- First generation: ~2-3 seconds (cold start)
- Subsequent: ~1-2 seconds
- Memory: ~200-300 MB per PDF generation
- Consider caching generated PDFs if needed

### Role Filtering
- Uses MongoDB index on `{ role: 1, organizationId: 1 }`
- O(log n) query performance
- Efficient for all role filter combinations

## 🐛 Common Issues & Solutions

### Issue: "Payment not found" when downloading invoice
**Solution:** Ensure the payment ID is correct and belongs to your organization. Coaches can only access their own invoices.

### Issue: "Session must be completed to be rated"
**Solution:** Only sessions with `status: 'completed'` can be rated. Check session status first.

### Issue: Puppeteer timeout in production
**Solution:** Increase timeout in pdfGenerator.ts or ensure Chrome dependencies are installed in production environment.

### Issue: Role filter returns empty array
**Solution:** Verify the role parameter is one of: `coach`, `entrepreneur`, `manager`, `admin`. Check case sensitivity.

## 🔧 Environment Variables

Add these to your `.env` file for production:

```env
# Email Configuration (for invoice sending)
SENDGRID_API_KEY=your_sendgrid_api_key
EMAIL_FROM=noreply@yourdomain.com

# Optional: PDF Generation Settings
PDF_GENERATION_TIMEOUT=30000
PUPPETEER_ARGS=--no-sandbox,--disable-setuid-sandbox
```

## 📚 Additional Resources

- Full API Documentation: `/api-docs` (Swagger UI)
- Implementation Details: `IMPLEMENTATION_SUMMARY.md`
- Complete API Reference: `API_DOCS.md`
