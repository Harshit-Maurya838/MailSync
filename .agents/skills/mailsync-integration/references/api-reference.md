# MailSync API Reference & Integration Details

This reference covers the HTTP contract, headers, response format, and troubleshooting guidelines for the hosted MailSync service.

---

## Endpoints

### 1. `POST /mail` (or `POST /api/mail`)
Sends a transactional email.

#### Request Headers
- `Content-Type: application/json` (Required)
- `x-access-key: <string>` (Optional, required if configured on instance)
- `Authorization: Bearer <string>` (Alternative auth header)

#### Request Body (JSON)
```json
{
  "email": "user@example.com",
  "name": "Alex Rivers",
  "subject": "Order Confirmation #1042",
  "message": "Thank you for your purchase! Your order is being processed.",
  "fromName": "Acme Store"
}
```

#### Fields Details
- `email` or `to` (string, required): Destination email address. Validated against regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`.
- `message` (string, conditional): Plain text body. Auto-wrapped in clean HTML layout with responsive table design.
- `html` (string, conditional): Custom HTML body. Either `message` or `html` must be provided.
- `subject` (string, optional): Email subject line. Default: `"New Notification from MailSync"`.
- `name` (string, optional): Recipient name. Injected into greeting (`"Hello <name>,"`).
- `fromName` (string, optional): Custom sender display name (e.g., `"Acme Notifications"`).
- `from` (string, optional): Overrides entire from address header (e.g. `"Support" <support@yourdomain.com>`).

#### Success Response (`HTTP 200`)
```json
{
  "success": true,
  "message": "Email sent successfully",
  "messageId": "<b6589fc6-8e12-7dc2-359a-20a52cfa4323@gmail.com>",
  "recipient": "user@example.com",
  "sentVia": "primary@gmail.com",
  "attempt": 1,
  "totalAccounts": 2
}
```

#### Error Responses
- `HTTP 400 Bad Request`:
  - Missing recipient: `{ "success": false, "error": "Missing required field: 'email' (or 'to') is required." }`
  - Missing content: `{ "success": false, "error": "Missing required field: either 'message' or 'html' is required." }`
  - Invalid email: `{ "success": false, "error": "Invalid email address format: 'invalid'." }`
- `HTTP 401 Unauthorized`:
  - Missing or incorrect key: `{ "success": false, "error": "Unauthorized: Invalid or missing x-access-key header" }`
- `HTTP 500 Internal Server Error`:
  - SMTP transport failure: `{ "success": false, "error": "Failed to send email", "details": "<error_message>" }`

---

### 2. `GET /health` (or `GET /api/health`)
Returns instance health.
```json
{
  "status": "ok",
  "service": "MailSync",
  "timestamp": "2026-10-23T13:20:00.000Z"
}
```

### 3. `GET /api/verify`
Tests the underlying SMTP connection with the email provider without sending an email.
```json
{
  "success": true,
  "message": "Transporter verified successfully. Ready to send emails."
}
```

---

## Watermark Badge Notice
All emails generated or dispatched via MailSync automatically include a discrete, elegant open-source badge in the footer:
> "Powered by MailSync • ⭐ Support by starring on GitHub"

If custom HTML is provided via the `html` field, the watermark is injected automatically right before `</body>`.
