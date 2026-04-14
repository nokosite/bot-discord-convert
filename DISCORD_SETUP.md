# Setup Multiple Discord Webhooks

Ada 2 cara untuk setup multiple Discord webhooks:

## Cara 1: Multiple Webhooks untuk Semua Event

Kirim ke beberapa channel Discord sekaligus untuk semua event.

### Environment Variable:
```
DISCORD_WEBHOOK_URLS=https://discord.com/api/webhooks/id1/token1,https://discord.com/api/webhooks/id2/token2,https://discord.com/api/webhooks/id3/token3
```

### Contoh:
```
DISCORD_WEBHOOK_URLS=https://discord.com/api/webhooks/123/abc,https://discord.com/api/webhooks/456/def
```

Semua event (push, PR, release, issues) akan dikirim ke kedua webhook tersebut.

---

## Cara 2: Webhook Berbeda per Event Type

Kirim event tertentu ke channel tertentu.

### Environment Variables:

```bash
# Channel untuk semua event umum (push, dll)
DISCORD_WEBHOOK_GENERAL=https://discord.com/api/webhooks/general-id/token

# Channel khusus untuk releases
DISCORD_WEBHOOK_RELEASES=https://discord.com/api/webhooks/releases-id/token

# Channel khusus untuk issues
DISCORD_WEBHOOK_ISSUES=https://discord.com/api/webhooks/issues-id/token

# Channel khusus untuk pull requests
DISCORD_WEBHOOK_PULL_REQUESTS=https://discord.com/api/webhooks/pr-id/token
```

### Routing Logic:

| Event Type    | Dikirim ke Webhook                                    |
|---------------|-------------------------------------------------------|
| `push`        | `DISCORD_WEBHOOK_URLS` + `DISCORD_WEBHOOK_GENERAL`   |
| `pull_request`| `DISCORD_WEBHOOK_URLS` + `DISCORD_WEBHOOK_GENERAL` + `DISCORD_WEBHOOK_PULL_REQUESTS` |
| `release`     | `DISCORD_WEBHOOK_URLS` + `DISCORD_WEBHOOK_GENERAL` + `DISCORD_WEBHOOK_RELEASES` |
| `issues`      | `DISCORD_WEBHOOK_URLS` + `DISCORD_WEBHOOK_GENERAL` + `DISCORD_WEBHOOK_ISSUES` |

---

## Cara 3: Kombinasi (Recommended)

Gabungkan kedua cara untuk fleksibilitas maksimal:

```bash
# Kirim semua event ke channel utama
DISCORD_WEBHOOK_URLS=https://discord.com/api/webhooks/main-channel/token

# Plus kirim releases ke channel khusus
DISCORD_WEBHOOK_RELEASES=https://discord.com/api/webhooks/releases-channel/token

# Plus kirim issues ke channel khusus
DISCORD_WEBHOOK_ISSUES=https://discord.com/api/webhooks/issues-channel/token
```

Dengan setup ini:
- Push events → Hanya ke main channel
- Release events → Ke main channel + releases channel
- Issue events → Ke main channel + issues channel

---

## Cara Mendapatkan Discord Webhook URL

1. Buka Discord server Anda
2. Klik kanan pada channel → Edit Channel
3. Integrations → Webhooks → New Webhook
4. Beri nama (misal: "GitHub Bot")
5. Copy Webhook URL
6. Ulangi untuk channel lain jika perlu

---

## Setup di Vercel Dashboard

1. Buka project di [vercel.com](https://vercel.com)
2. Settings → Environment Variables
3. Tambahkan variable sesuai kebutuhan:

### Contoh Setup:

**Variable 1:**
- Key: `DISCORD_WEBHOOK_URLS`
- Value: `https://discord.com/api/webhooks/123/abc,https://discord.com/api/webhooks/456/def`

**Variable 2:**
- Key: `DISCORD_WEBHOOK_RELEASES`
- Value: `https://discord.com/api/webhooks/789/ghi`

4. Save
5. Redeploy project (otomatis atau manual)

---

## Testing

Setelah setup, test dengan:

1. Push commit ke repository
2. Cek apakah notifikasi muncul di Discord channel yang sesuai
3. Cek logs di Vercel Dashboard → Deployments → Functions

### Expected Log Output:

```
=== GitHub Update ===
Event: push
🔄 Push to my-project (main)
...
===================
📤 Sending to 2 Discord webhook(s)...
✅ Sent to Discord: https://discord.com/api/webhooks/123...
✅ Sent to Discord: https://discord.com/api/webhooks/456...
```

---

## Troubleshooting

### Webhook tidak terkirim?

1. Cek environment variables sudah benar
2. Cek webhook URL masih valid (tidak expired/deleted)
3. Cek logs di Vercel untuk error message
4. Test webhook URL manual dengan curl:

```bash
curl -X POST "YOUR_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{"content": "Test message"}'
```

### Duplicate messages?

Jika menerima message duplikat, kemungkinan webhook URL sama di multiple variables. Pastikan setiap variable punya URL yang berbeda.

---

## Best Practices

✅ **DO:**
- Gunakan channel berbeda untuk event berbeda
- Set webhook name yang jelas (misal: "GitHub - Releases")
- Test setelah setup

❌ **DON'T:**
- Jangan share webhook URL di public
- Jangan hardcode URL di code
- Jangan gunakan webhook URL yang sama di multiple variables (kecuali memang ingin duplicate)

---

## Example Configurations

### Minimal Setup (1 channel untuk semua):
```bash
DISCORD_WEBHOOK_URLS=https://discord.com/api/webhooks/main/token
```

### Moderate Setup (2 channels):
```bash
DISCORD_WEBHOOK_GENERAL=https://discord.com/api/webhooks/general/token
DISCORD_WEBHOOK_RELEASES=https://discord.com/api/webhooks/releases/token
```

### Advanced Setup (4+ channels):
```bash
DISCORD_WEBHOOK_URLS=https://discord.com/api/webhooks/main/token,https://discord.com/api/webhooks/backup/token
DISCORD_WEBHOOK_GENERAL=https://discord.com/api/webhooks/general/token
DISCORD_WEBHOOK_RELEASES=https://discord.com/api/webhooks/releases/token
DISCORD_WEBHOOK_ISSUES=https://discord.com/api/webhooks/issues/token
DISCORD_WEBHOOK_PULL_REQUESTS=https://discord.com/api/webhooks/pr/token
```
