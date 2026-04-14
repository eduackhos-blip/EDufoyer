# Production Email Setup

## Option 1: SendGrid (Recommended for Production)
1. Sign up at https://sendgrid.com/
2. Get API key from Settings → API Keys
3. Update ecosystem.config.js:
```javascript
SMTP_HOST: 'smtp.sendgrid.net',
SMTP_PORT: 587,
SMTP_USER: 'apikey',
SMTP_PASS: 'your-sendgrid-api-key'
```

## Option 2: Mailgun
1. Sign up at https://mailgun.com/
2. Get SMTP credentials from Domains
3. Update ecosystem.config.js:
```javascript
SMTP_HOST: 'smtp.mailgun.org',
SMTP_PORT: 587,
SMTP_USER: 'your-mailgun-smtp-username',
SMTP_PASS: 'your-mailgun-smtp-password'
```

## Option 3: Fix Gmail for Production
1. Enable 2-Factor Authentication
2. Generate App Password
3. Update SMTP_PASS with 16-character app password
