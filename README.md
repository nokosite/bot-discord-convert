# GitHub Webhook to Discord - Vercel Deployment

GitHub webhook handler yang menerima event dari GitHub dan mengirim notifikasi ke multiple Discord channels.

## 🚀 Features

- ✅ Terima webhook dari GitHub (push, pull_request, release, issues)
- ✅ Filter data - **tanpa username/author**
- ✅ Kirim ke **multiple Discord webhooks**
- ✅ Support routing per event type
- ✅ Deploy di Vercel (serverless)
- ✅ Gratis & mudah setup

## 📁 Project Structure

```
github-webhook-vercel/
├── api/
│   └── github-webhook.js    # Main webhook handler
├── .env.example              # Template environment variables
├── .gitignore
├── package.json
├── vercel.json               # Vercel configuration
├── README.md
├── DISCORD_SETUP.md          # Discord webhook setup guide
└── push-to-github.bat        # Script untuk push ke GitHub
```

## 🔧 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Environment Variables

Copy `.env.example` ke `.env` dan isi dengan Discord webhook URLs:

```bash
# Multiple webhooks (comma-separated)
DISCORD_WEBHOOK_URLS=https://discord.com/api/webhooks/id1/token1,https://discord.com/api/webhooks/id2/token2

# Or per event type
DISCORD_WEBHOOK_GENERAL=https://discord.com/api/webhooks/general-id/token
DISCORD_WEBHOOK_RELEASES=https://discord.com/api/webhooks/releases-id/token
DISCORD_WEBHOOK_ISSUES=https://discord.com/api/webhooks/issues-id/token
DISCORD_WEBHOOK_PULL_REQUESTS=https://discord.com/api/webhooks/pr-id/token
```

### 3. Deploy ke Vercel

#### Option A: Via Vercel Dashboard
1. Push project ke GitHub (jalankan `push-to-github.bat`)
2. Buka https://vercel.com
3. Import repository: `nokosite/bot-discord-convert`
4. Add environment variables
5. Deploy!

#### Option B: Via Vercel CLI
```bash
npm install -g vercel
vercel login
vercel --prod
```

### 4. Setup GitHub Webhook

1. Buka repository GitHub Anda
2. Settings → Webhooks → Add webhook
3. Payload URL: `https://your-project.vercel.app/webhook/github`
4. Content type: `application/json`
5. Events: Pilih events yang diinginkan (push, pull_request, release, issues)
6. Save!

## 📝 Supported Events

| Event | Description | Discord Channel |
|-------|-------------|-----------------|
| `push` | Code pushed ke repository | General + All |
| `pull_request` | PR opened/closed/merged | Pull Requests + General + All |
| `release` | New release published | Releases + General + All |
| `issues` | Issue opened/closed | Issues + General + All |

## 🎯 Discord Webhook Routing

Lihat `DISCORD_SETUP.md` untuk detail lengkap tentang routing dan setup multiple webhooks.

## 🧪 Testing

### Local Testing
```bash
npm run dev
```

### Test dengan curl
```bash
curl -X POST http://localhost:3000/webhook/github \
  -H "Content-Type: application/json" \
  -H "x-github-event: push" \
  -d '{"repository":{"name":"test-repo"},"commits":[{"message":"Test commit"}]}'
```

## 📚 Documentation

- `README.md` - Setup & deployment guide (this file)
- `DISCORD_SETUP.md` - Multiple Discord webhooks setup
- `.env.example` - Environment variables template

## 🔒 Security

- Webhook secret verification (optional)
- Environment variables untuk sensitive data
- No username/author data exposed

## 📦 Dependencies

- `axios` - HTTP client untuk Discord webhooks
- `@vercel/node` - Vercel serverless functions

## 🤝 Contributing

Feel free to submit issues or pull requests!

## 📄 License

MIT

---

Made with ❤️ for GitHub + Discord integration
