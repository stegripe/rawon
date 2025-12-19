# YouTube Cookies Setup Guide / Panduan Setup Cookies YouTube

[English](#english) | [Bahasa Indonesia](#bahasa-indonesia)

---

## English

### Why do I need this?

If you're hosting Rawon on cloud providers like OVHcloud, AWS, GCP, Azure, or other hosting services, you might encounter the error:

> "Sign in to confirm you're not a bot"

This happens because YouTube blocks requests from data center IP addresses. By using cookies from a logged-in YouTube account, you can bypass this restriction.

### Prerequisites

- A **secondary/throwaway Google account** (DO NOT use your main account for security reasons)
- A web browser (Chrome, Firefox, or Edge)
- A cookies export extension

### Step-by-Step Guide

#### Step 1: Create a Throwaway Google Account

1. Go to [Google Account Creation](https://accounts.google.com/signup)
2. Create a new Google account specifically for this bot
3. **Important**: Do NOT use your personal/main Google account

#### Step 2: Log in to YouTube

1. Open your browser
2. Go to [YouTube](https://www.youtube.com)
3. Sign in with your throwaway Google account
4. Accept any terms if prompted

#### Step 3: Install Cookies Export Extension

**For Chrome/Edge:**
- Install [Get cookies.txt LOCALLY](https://chromewebstore.google.com/detail/get-cookiestxt-locally/cclelndahbckbenkjhflpdbgdldlbecc) (Recommended)
- Or [cookies.txt](https://chromewebstore.google.com/detail/cookiestxt/njabckikapfpffapmjgojcnbfjonfjfg)

**For Firefox:**
- Install [cookies.txt](https://addons.mozilla.org/en-US/firefox/addon/cookies-txt/)

#### Step 4: Export Cookies

1. Make sure you're on YouTube website (youtube.com)
2. Click the cookies extension icon in your browser toolbar
3. Choose "Export" or "Export cookies for this site"
4. Save the file as `cookies.txt`

#### Step 5: Upload to Your Server

1. Create a `cache` folder in your Rawon directory if it doesn't exist
2. Upload the `cookies.txt` file to the `cache` folder
3. The path should be: `./cache/cookies.txt`

#### Step 6: Configure Environment Variable

Add this to your `.env` file:

```env
YOUTUBE_COOKIES="./cache/cookies.txt"
```

#### Step 7: Restart Rawon

Restart your bot to apply the changes.

### Docker Setup

If you're using Docker, mount the cookies file:

```yaml
services:
  rawon:
    image: ghcr.io/stegripe/rawon:latest
    container_name: rawon-bot
    restart: unless-stopped
    env_file: .env
    volumes:
      - rawon:/app/cache
      - ./cookies.txt:/app/cache/cookies.txt:ro
```

And set in your `.env`:
```env
YOUTUBE_COOKIES="/app/cache/cookies.txt"
```

### Troubleshooting

**Cookies expired?**
- Cookies may expire after some time
- Re-export the cookies following the same steps above

**Still getting errors?**
- Make sure the cookies file path is correct
- Check that the Google account is not suspended
- Try logging out and back in on YouTube, then re-export cookies

**Bot works but stops after a while?**
- YouTube may invalidate old sessions
- Re-export cookies periodically (every few weeks)

### Security Notes

⚠️ **WARNING**: 
- Never share your cookies file with anyone
- Use a throwaway account, NOT your main Google account
- The cookies file contains sensitive authentication data
- Add `cookies.txt` to your `.gitignore` to prevent accidental commits

---

## Bahasa Indonesia

### Mengapa saya butuh ini?

Jika kamu hosting Rawon di cloud provider seperti OVHcloud, AWS, GCP, Azure, atau layanan hosting lainnya, kamu mungkin mengalami error:

> "Sign in to confirm you're not a bot" (Masuk untuk memastikan kamu bukan bot)

Ini terjadi karena YouTube memblokir request dari alamat IP data center. Dengan menggunakan cookies dari akun YouTube yang sudah login, kamu bisa melewati pembatasan ini.

### Prasyarat

- Akun Google **cadangan/tumbal** (JANGAN gunakan akun utama demi keamanan)
- Browser web (Chrome, Firefox, atau Edge)
- Extension untuk export cookies

### Panduan Langkah demi Langkah

#### Langkah 1: Buat Akun Google Tumbal

1. Buka [Pembuatan Akun Google](https://accounts.google.com/signup)
2. Buat akun Google baru khusus untuk bot ini
3. **Penting**: JANGAN gunakan akun Google pribadi/utama kamu

#### Langkah 2: Login ke YouTube

1. Buka browser kamu
2. Buka [YouTube](https://www.youtube.com)
3. Login dengan akun Google tumbal kamu
4. Terima syarat & ketentuan jika diminta

#### Langkah 3: Install Extension Export Cookies

**Untuk Chrome/Edge:**
- Install [Get cookies.txt LOCALLY](https://chromewebstore.google.com/detail/get-cookiestxt-locally/cclelndahbckbenkjhflpdbgdldlbecc) (Direkomendasikan)
- Atau [cookies.txt](https://chromewebstore.google.com/detail/cookiestxt/njabckikapfpffapmjgojcnbfjonfjfg)

**Untuk Firefox:**
- Install [cookies.txt](https://addons.mozilla.org/en-US/firefox/addon/cookies-txt/)

#### Langkah 4: Export Cookies

1. Pastikan kamu sedang di website YouTube (youtube.com)
2. Klik ikon extension cookies di toolbar browser kamu
3. Pilih "Export" atau "Export cookies for this site"
4. Simpan file sebagai `cookies.txt`

#### Langkah 5: Upload ke Server

1. Buat folder `cache` di direktori Rawon kamu jika belum ada
2. Upload file `cookies.txt` ke folder `cache`
3. Path-nya harus: `./cache/cookies.txt`

#### Langkah 6: Konfigurasi Environment Variable

Tambahkan ini ke file `.env` kamu:

```env
YOUTUBE_COOKIES="./cache/cookies.txt"
```

#### Langkah 7: Restart Rawon

Restart bot kamu untuk menerapkan perubahan.

### Setup Docker

Jika kamu menggunakan Docker, mount file cookies:

```yaml
services:
  rawon:
    image: ghcr.io/stegripe/rawon:latest
    container_name: rawon-bot
    restart: unless-stopped
    env_file: .env
    volumes:
      - rawon:/app/cache
      - ./cookies.txt:/app/cache/cookies.txt:ro
```

Dan set di `.env` kamu:
```env
YOUTUBE_COOKIES="/app/cache/cookies.txt"
```

### Troubleshooting / Pemecahan Masalah

**Cookies kadaluarsa?**
- Cookies mungkin kadaluarsa setelah beberapa waktu
- Export ulang cookies dengan mengikuti langkah yang sama di atas

**Masih dapat error?**
- Pastikan path file cookies benar
- Cek apakah akun Google tidak di-suspend
- Coba logout dan login lagi di YouTube, lalu export ulang cookies

**Bot jalan tapi berhenti setelah beberapa waktu?**
- YouTube mungkin membatalkan sesi lama
- Export ulang cookies secara berkala (setiap beberapa minggu)

### Catatan Keamanan

⚠️ **PERINGATAN**: 
- Jangan pernah bagikan file cookies kamu ke siapapun
- Gunakan akun tumbal, BUKAN akun Google utama kamu
- File cookies berisi data autentikasi sensitif
- Tambahkan `cookies.txt` ke `.gitignore` kamu untuk mencegah commit tidak sengaja
