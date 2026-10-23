# MailSync 

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-green.svg)](https://nodejs.org/)
[![GitHub stars](https://img.shields.io/github/stars/Harshit-Maurya838/MailSync?style=social)](https://github.com/Harshit-Maurya838/MailSync)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start)

> ⭐ **Support the Project:** If you like or use MailSync, please consider [giving the repo a star on GitHub](https://github.com/Harshit-Maurya838/MailSync) — it helps keep the project active and maintained!

**MailSync** is a lightweight, open-source, self-hosted email-sending API built with Node.js, Express, and [Nodemailer](https://nodemailer.com/). It allows anyone to deploy a private, serverless email API to **Vercel**, **Netlify**, **Docker**, or any VPS in less than 60 seconds.

Stop paying for expensive third-party email delivery services for simple contact forms, transactional notifications, verification codes, or alerts.

---

## ✨ Features

- **Single Clean Endpoint**: Send transactional emails with a simple `POST /mail` (or `POST /api/mail`).
- **Zero Config Serverless**: Pre-configured for seamless 1-click deployments on **Vercel** and **Netlify**.
- **Multi-Account Dynamic Failover ("Zero-DB List Rotation")**: Pass comma-separated accounts (`EMAIL_USER="m1@gmail.com,m2@gmail.com"`). If primary hits rate limits (SMTP 421/452/535), MailSync instantly fails over to backup credentials in the same request.
- **Transporter Caching & Re-use**: SMTP connection pools are cached in module scope across warm serverless invocations, eliminating redundant TLS/auth handshakes and shaving up to 1 second per email.
- **Works with Gmail & Any Provider**: Built-in support for Gmail App Passwords, SendGrid, Mailgun, or custom SMTP servers.
- **Built-in HTML Email Formatting**: Raw text messages are automatically wrapped into clean, modern, mobile-responsive HTML templates. Custom HTML is also fully supported.
- **Optional API Key Security**: Protect your endpoint with an `x-access-key` header, or leave it open for public contact forms.
- **Interactive Web Dashboard**: Built-in browser playground to test your API, inspect live logs, and generate client code snippets in cURL, JavaScript, and Python.
- **Docker Ready**: Includes production `Dockerfile` and `docker-compose.yml`.

---

## 🚀 1-Click Deployment

### Deploy to Vercel
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

1. Click the button above to import this repository.
2. Set your environment variables in Vercel:
   - `EMAIL_USER`: Your Gmail address (e.g. `yourname@gmail.com`)
   - `EMAIL_PASSWORD`: Your 16-character [Google App Password](https://myaccount.google.com/apppasswords)
   - `ACCESS_KEY`: *(Optional)* Secret token to protect your `/mail` endpoint
3. Click **Deploy**. Your API is live!

### Deploy to Netlify
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start)

Netlify is supported via the included `netlify.toml` and serverless function adapter. Add the environment variables in your Netlify Site Settings.

---

## 💻 Local Development Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Harshit-Maurya838/MailSync.git
   cd MailSync
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and fill in your email credentials:
   ```env
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-16-character-app-password
   ACCESS_KEY=my-super-secret-key
   PORT=5000
   ```

   > **Note on Gmail:** You need a Google **App Password**, not your normal account password. Generate one at [Google Account App Passwords](https://myaccount.google.com/apppasswords).

4. **Start the server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:5000](http://localhost:5000) in your browser to view the interactive dashboard.

---

## 📡 API Reference

### Send Email

```http
POST /mail
```
*(Also available at `POST /api/mail`)*

#### Headers
| Header | Value | Description |
|---|---|---|
| `Content-Type` | `application/json` | Required |
| `x-access-key` | `YOUR_ACCESS_KEY` | Required only if `ACCESS_KEY` is configured |
| `Authorization` | `Bearer YOUR_ACCESS_KEY` | Alternative to `x-access-key` |

#### Request Body
```json
{
  "email": "recipient@example.com",
  "name": "Alex Rivers",
  "subject": "Welcome to MailSync!",
  "message": "Hello! Your account has been created successfully."
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `email` or `to` | `string` | **Yes** | Target recipient email address |
| `message` | `string` | **Yes\*** | Email body text (auto-wrapped in clean HTML layout with watermark) |
| `html` | `string` | No\* | Custom HTML body if you want full layout control |
| `subject` | `string` | No | Email subject line (default: "New Notification from MailSync") |
| `name` | `string` | No | Personalizes the greeting (e.g., "Hello Alex,") |
| `fromName` | `string` | No | Custom sender/from name (e.g., "Acme Team"). Overrides `FROM_NAME`. |
| `from` | `string` | No | Full custom sender header (e.g. `"Acme" <support@domain.com>`) |

*\* Either `message` or `html` must be provided.*
*🛡️ Note: All emails include an open-source watermark badge ("⚡ Powered by MailSync • Open Source Project") in the footer.*

#### Response
```json
{
  "success": true,
  "message": "Email sent successfully",
  "messageId": "<b6589fc6-8e12-7dc2-359a-20a52cfa4323@gmail.com>",
  "recipient": "recipient@example.com"
}
```

---

### Diagnostic Endpoints

- **`GET /health`**: Healthcheck endpoint returning system status and timestamp.
- **`GET /server-info`**: Real-time server uptime, mail dispatch counts, and auth state.
- **`GET /api/verify`**: Validates the Nodemailer connection to your mail provider without sending an email.
- **`GET /logs`**: Returns recent server activity logs.

---

## 💡 Code Examples

### cURL
```bash
curl -X POST "https://your-mailsync.vercel.app/mail" \
  -H "Content-Type: application/json" \
  -H "x-access-key: your-secret-key" \
  -d '{
    "email": "user@example.com",
    "name": "Alex",
    "subject": "Order Confirmation",
    "message": "Thank you for your purchase!"
  }'
```

### JavaScript (Fetch)
```javascript
const response = await fetch("https://your-mailsync.vercel.app/mail", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-access-key": "your-secret-key"
  },
  body: JSON.stringify({
    email: "user@example.com",
    name: "Alex",
    subject: "Welcome!",
    message: "Thank you for joining our platform."
  })
});

const data = await response.json();
console.log(data);
```

### Python
```python
import requests

url = "https://your-mailsync.vercel.app/mail"
headers = {
    "Content-Type": "application/json",
    "x-access-key": "your-secret-key"
}
payload = {
    "email": "user@example.com",
    "name": "Alex",
    "subject": "Security Code",
    "message": "Your verification code is 492041."
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())
```

---

## 🤖 AI Agent Integration & Guided Prompt

Integrate your hosted MailSync instance into **any** application (Next.js, Node.js, Python, React, Go) in seconds using an AI coding assistant (**Cursor, Antigravity, Claude Code, Copilot, or Windsurf**).

### 📋 1-Click Agent Prompt
Copy and paste this prompt directly into your AI assistant:

```markdown
Please implement transactional email sending in this application using our hosted MailSync API instance.

### MailSync Instance Details:
- Base API URL: https://your-mailsync.vercel.app (or https://mailsync-sigma.vercel.app)
- Endpoint: POST /mail (or POST /api/mail)
- Headers:
  - Content-Type: application/json
  - x-access-key: [YOUR_ACCESS_KEY or none if public]

### Request Body Schema (JSON):
{
  "email": "user@example.com",
  "name": "Alex",
  "subject": "Order Confirmation",
  "message": "Thank you for your purchase!"
}

### Steps for the Agent:
1. Environment Setup: Add `MAILSYNC_API_URL` (and optional `MAILSYNC_ACCESS_KEY`) to `.env`.
2. Client Service: Create a clean email utility module (e.g., `lib/mailsync.ts` or `services/email.ts`) that POSTs to `/mail`.
3. Wire Feature: Connect the utility to our user-facing triggers (contact form, verification, or notification).
4. Verify: Test against `GET /health` and dispatch a test email.
```

### ⚡ Antigravity Agent Skill
If using the **Antigravity IDE** or `agy` CLI, copy the included skill from [`.agents/skills/mailsync-integration/`](.agents/skills/mailsync-integration/SKILL.md) to your application's `.agents/skills/` directory. The agent will automatically detect and apply all best practices.

See [INTEGRATION_PROMPT.md](INTEGRATION_PROMPT.md) for full documentation and framework examples.

---

## ⚙️ Environment Variables

| Variable | Default | Description |
|---|---|---|
| `EMAIL_USER` | *None* | Primary email or comma-separated list for failover (`user1@gmail.com,user2@gmail.com`) |
| `EMAIL_PASSWORD` | *None* | Primary password or comma-separated list (`pass1,pass2`) |
| `FROM_NAME` | `"MailSync"` | Default sender/from name (e.g. `"MyBrand"`, `"Acme Support"`) |
| `EMAIL_SERVICE` | `gmail` | Nodemailer service provider (`gmail`, `sendgrid`, `mailgun`, etc.) |
| `EMAIL_FROM` | `"${FROM_NAME}" <EMAIL_USER>` | Full custom sender header (overrides `FROM_NAME`) |
| `ACCESS_KEY` | *None* | Secret key required to send emails. If empty, the endpoint is public. |
| `PORT` | `5000` | Port for the standalone Node.js server |

### 🔄 Multi-Account Dynamic Failover (Zero-DB Rotation)
To protect against Gmail daily limits (500 mails/day on free accounts) or provider rate-limiting, provide comma-separated credentials:
```env
EMAIL_USER="primary@gmail.com,backup1@gmail.com,backup2@gmail.com"
EMAIL_PASSWORD="app-pass-1,app-pass-2,app-pass-3"
```
When MailSync encounters a rate limit (HTTP 421 or SMTP 452/535), it automatically retries with the next account in line within the same incoming request.

### ⚡ Transporter Connection Caching
Transporters are pooled and cached at module scope outside request handlers, enabling warm Vercel/Netlify/Lambda container re-use without re-establishing TCP/TLS handshakes on every invocation.

---

## 🐳 Docker Deployment

Run with Docker:
```bash
docker build -t mailsync .
docker run -p 5000:5000 \
  -e EMAIL_USER=your-email@gmail.com \
  -e EMAIL_PASSWORD=your-app-password \
  -e ACCESS_KEY=your-access-key \
  mailsync
```

Or with Docker Compose:
```bash
docker-compose up -d
```

---

## 🤝 Contributing

Contributions are welcome and greatly appreciated! Please review our [Contributing Guide](CONTRIBUTING.md) to get started with local development, architecture overview, commit conventions, and pull requests.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE). Feel free to fork, customize, and use it in your personal or commercial projects.
