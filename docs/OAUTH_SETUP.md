# OAuth Setup Guide / Panduan Setup OAuth

[English](#english) | [Bahasa Indonesia](#bahasa-indonesia)

---

## English

### Why use OAuth instead of Cookies?

While cookies work for authentication, they have a significant drawback: **they can expire or become invalid** due to:
- YouTube rate limits
- Account suspensions
- Session timeouts
- Security actions on your account

When this happens, you need to manually:
1. Open a browser
2. Log in to YouTube
3. Export new cookies
4. Restart the bot (or Docker container)

**OAuth with refresh tokens solves this problem!** The refresh token can automatically renew access tokens when they expire, meaning:
- ✅ No more manual cookie renewals
- ✅ No more Docker restarts for authentication issues
- ✅ Automatic recovery from temporary rate limits
- ✅ Works seamlessly in cloud environments

### Prerequisites

- A **secondary/throwaway account** (DO NOT use your main account for security reasons)
- Node.js installed on your local machine

### Step-by-Step Guide

#### Step 1: Create a Throwaway Account

1. Go to [Account Creation](https://accounts.google.com/signup)
2. Create a new account specifically for this bot
3. **Important**: Do NOT use your personal/main account

#### Step 2: Generate Refresh Token

Run the following command in your terminal to start the OAuth authorization process:

```bash
npx youtubei oauth
```

Or if you have the rawon repository cloned:

```bash
cd /path/to/rawon
node -e "const { OAuth } = require('youtubei'); OAuth.authorize().then(console.log)"
```

This will:
1. Display a URL and a code
2. Open the URL in your browser (or open it manually)
3. Enter the code when prompted
4. Sign in with your throwaway account
5. Authorize the application

After successful authorization, you'll receive output like:
```json
{
  "accessToken": "ya29.xxx...",
  "expiresIn": 3600,
  "refreshToken": "1//xxx...",
  "scope": "...",
  "tokenType": "Bearer"
}
```

**Copy the `refreshToken` value** - this is what you need!

#### Step 3: Configure Environment Variable

Add this to your `.env` file:

```env
YOUTUBE_OAUTH_REFRESH_TOKEN="1//xxx..."
```

Replace `1//xxx...` with your actual refresh token.

#### Step 4: Remove Cookies (Optional)

If you were previously using cookies, you can remove the `YOUTUBE_COOKIES` line from your `.env` file. OAuth takes priority over cookies when both are configured.

#### Step 5: Restart Rawon

Restart your bot to apply the changes.

### Docker Setup

If you're using Docker, simply add the environment variable to your `.env` file:

```env
YOUTUBE_OAUTH_REFRESH_TOKEN="1//xxx..."
```

And run:
```bash
docker compose down && docker compose up -d
```

### How It Works

1. When Rawon starts, it checks for `YOUTUBE_OAUTH_REFRESH_TOKEN`
2. If present, it uses the refresh token to obtain an access token
3. The access token is used for YouTube API requests (via youtubei) and yt-dlp downloads
4. When the access token expires (every ~1 hour), it's automatically refreshed using the refresh token
5. The refresh token itself doesn't expire as long as it's used periodically

### Advantages Over Cookies

| Feature | Cookies | OAuth |
|---------|---------|-------|
| Auto-renewal | ❌ Manual | ✅ Automatic |
| Rate limit recovery | ❌ Manual refresh needed | ✅ Automatic after cooldown |
| Setup complexity | Medium | One-time |
| Longevity | Days to weeks | Indefinite (with use) |
| Docker restarts | Required when expired | Rarely needed |

### Troubleshooting

**Getting "invalid_grant" errors?**
- The refresh token may have been revoked
- Generate a new refresh token by running the authorization process again

**Still getting "Sign in to confirm you're not a bot" errors?**
- This can happen with heavy usage even with OAuth
- Wait a few hours for rate limits to reset
- Consider using a different throwaway account

**Token not refreshing?**
- Make sure the `YOUTUBE_OAUTH_REFRESH_TOKEN` is correctly set in your `.env`
- Check the bot logs for any OAuth-related error messages

### Security Notes

⚠️ **WARNING**: 
- Never share your refresh token with anyone
- Use a throwaway account, NOT your main account
- The refresh token provides full access to the YouTube account
- Add your `.env` file to `.gitignore` to prevent accidental commits

---

## Bahasa Indonesia

### Mengapa menggunakan OAuth daripada Cookies?

Meskipun cookies berfungsi untuk autentikasi, mereka memiliki kelemahan signifikan: **bisa kadaluarsa atau tidak valid** karena:
- Rate limit YouTube
- Suspend akun
- Timeout sesi
- Aksi keamanan pada akun

Ketika ini terjadi, kamu harus manual:
1. Buka browser
2. Login ke YouTube
3. Export cookies baru
4. Restart bot (atau container Docker)

**OAuth dengan refresh token menyelesaikan masalah ini!** Refresh token bisa otomatis memperbarui access token saat kadaluarsa, artinya:
- ✅ Tidak perlu lagi memperbarui cookies manual
- ✅ Tidak perlu restart Docker untuk masalah autentikasi
- ✅ Pemulihan otomatis dari rate limit sementara
- ✅ Bekerja mulus di environment cloud

### Prasyarat

- Akun **cadangan/tumbal** (JANGAN gunakan akun utama demi keamanan)
- Node.js terinstall di komputer lokal

### Panduan Langkah demi Langkah

#### Langkah 1: Buat Akun Tumbal

1. Buka [Pembuatan Akun](https://accounts.google.com/signup)
2. Buat akun baru khusus untuk bot ini
3. **Penting**: JANGAN gunakan akun pribadi/utama kamu

#### Langkah 2: Generate Refresh Token

Jalankan perintah berikut di terminal untuk memulai proses otorisasi OAuth:

```bash
npx youtubei oauth
```

Atau jika kamu sudah clone repository rawon:

```bash
cd /path/to/rawon
node -e "const { OAuth } = require('youtubei'); OAuth.authorize().then(console.log)"
```

Ini akan:
1. Menampilkan URL dan kode
2. Membuka URL di browser (atau buka manual)
3. Masukkan kode saat diminta
4. Login dengan akun tumbal
5. Otorisasi aplikasi

Setelah otorisasi berhasil, kamu akan menerima output seperti:
```json
{
  "accessToken": "ya29.xxx...",
  "expiresIn": 3600,
  "refreshToken": "1//xxx...",
  "scope": "...",
  "tokenType": "Bearer"
}
```

**Salin nilai `refreshToken`** - ini yang kamu butuhkan!

#### Langkah 3: Konfigurasi Environment Variable

Tambahkan ini ke file `.env` kamu:

```env
YOUTUBE_OAUTH_REFRESH_TOKEN="1//xxx..."
```

Ganti `1//xxx...` dengan refresh token asli kamu.

#### Langkah 4: Hapus Cookies (Opsional)

Jika sebelumnya kamu menggunakan cookies, kamu bisa menghapus baris `YOUTUBE_COOKIES` dari file `.env`. OAuth lebih prioritas daripada cookies ketika keduanya dikonfigurasi.

#### Langkah 5: Restart Rawon

Restart bot kamu untuk menerapkan perubahan.

### Setup Docker

Jika kamu menggunakan Docker, cukup tambahkan environment variable ke file `.env`:

```env
YOUTUBE_OAUTH_REFRESH_TOKEN="1//xxx..."
```

Dan jalankan:
```bash
docker compose down && docker compose up -d
```

### Cara Kerjanya

1. Saat Rawon start, dia memeriksa `YOUTUBE_OAUTH_REFRESH_TOKEN`
2. Jika ada, dia menggunakan refresh token untuk mendapatkan access token
3. Access token digunakan untuk request YouTube API (via youtubei) dan download yt-dlp
4. Ketika access token kadaluarsa (setiap ~1 jam), otomatis diperbarui menggunakan refresh token
5. Refresh token sendiri tidak kadaluarsa selama digunakan secara berkala

### Keunggulan Dibanding Cookies

| Fitur | Cookies | OAuth |
|-------|---------|-------|
| Auto-renewal | ❌ Manual | ✅ Otomatis |
| Pemulihan rate limit | ❌ Perlu refresh manual | ✅ Otomatis setelah cooldown |
| Kompleksitas setup | Sedang | Sekali saja |
| Daya tahan | Hari hingga minggu | Tidak terbatas (dengan penggunaan) |
| Restart Docker | Diperlukan saat expired | Jarang diperlukan |

### Troubleshooting / Pemecahan Masalah

**Dapat error "invalid_grant"?**
- Refresh token mungkin sudah di-revoke
- Generate refresh token baru dengan menjalankan proses otorisasi lagi

**Masih dapat error "Sign in to confirm you're not a bot"?**
- Ini bisa terjadi dengan penggunaan berat bahkan dengan OAuth
- Tunggu beberapa jam sampai rate limit reset
- Pertimbangkan menggunakan akun tumbal yang berbeda

**Token tidak refresh?**
- Pastikan `YOUTUBE_OAUTH_REFRESH_TOKEN` sudah diset dengan benar di `.env`
- Cek log bot untuk pesan error terkait OAuth

### Catatan Keamanan

⚠️ **PERINGATAN**: 
- Jangan pernah bagikan refresh token kamu ke siapapun
- Gunakan akun tumbal, BUKAN akun utama kamu
- Refresh token memberikan akses penuh ke akun YouTube
- Tambahkan file `.env` ke `.gitignore` untuk mencegah commit tidak sengaja
