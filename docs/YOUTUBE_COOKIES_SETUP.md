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

If you're using Docker, simply place your `cookies.txt` file next to your `docker-compose.yaml` file:

```
your-rawon-folder/
├── docker-compose.yaml
├── .env
└── cookies.txt          <-- Place cookies here
```

Then add this volume mount to your `docker-compose.yaml`:

```yaml
services:
  rawon:
    image: ghcr.io/stegripe/rawon:latest
    container_name: rawon-bot
    restart: unless-stopped
    env_file: .env
    volumes:
      - rawon:/app/cache
      - ./cookies.txt:/app/cookies.txt:ro
```

And set in your `.env`:
```env
YOUTUBE_COOKIES="/app/cookies.txt"
```

> **Note**: The cookies file is mounted to `/app/cookies.txt` (not inside `/app/cache`) to keep it separate from the cache volume.

### How Long Do Cookies Last?

**Good news**: YouTube cookies do NOT expire on a regular schedule like other websites. They will remain valid as long as:
- ✅ You don't log out from YouTube in your browser
- ✅ You don't change your Google account password
- ✅ You don't revoke the session from Google Account settings
- ✅ Google doesn't detect suspicious activity on the account

**Tips to keep cookies valid longer:**
1. Use a dedicated browser profile just for this account
2. Don't use the throwaway account for anything else
3. Don't log out from YouTube in that browser
4. Keep the browser profile intact (don't clear cookies)

In practice, cookies can last **months or even years** if you follow these tips.

### Troubleshooting

**Still getting "Sign in to confirm you're not a bot" errors?**
- Make sure the cookies file path is correct
- Verify the cookies.txt file is not empty
- Re-export cookies while logged in to YouTube

**Cookies suddenly stopped working?**
This usually happens if:
- You logged out from YouTube in your browser → Re-export cookies
- You changed your Google password → Re-export cookies
- Google detected suspicious activity → Check your email for security alerts, then re-export cookies

**Account got suspended?**
- Create a new throwaway Google account
- Follow the setup steps again

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

Jika kamu menggunakan Docker, cukup letakkan file `cookies.txt` di samping file `docker-compose.yaml`:

```
folder-rawon-kamu/
├── docker-compose.yaml
├── .env
└── cookies.txt          <-- Letakkan cookies di sini
```

Lalu tambahkan volume mount ini ke `docker-compose.yaml` kamu:

```yaml
services:
  rawon:
    image: ghcr.io/stegripe/rawon:latest
    container_name: rawon-bot
    restart: unless-stopped
    env_file: .env
    volumes:
      - rawon:/app/cache
      - ./cookies.txt:/app/cookies.txt:ro
```

Dan set di `.env` kamu:
```env
YOUTUBE_COOKIES="/app/cookies.txt"
```

> **Catatan**: File cookies di-mount ke `/app/cookies.txt` (bukan di dalam `/app/cache`) agar terpisah dari volume cache.

### Berapa Lama Cookies Bertahan?

**Kabar baik**: Cookies YouTube TIDAK kadaluarsa secara berkala seperti website lain. Mereka akan tetap valid selama:
- ✅ Kamu tidak logout dari YouTube di browser
- ✅ Kamu tidak ganti password akun Google
- ✅ Kamu tidak revoke session dari pengaturan Akun Google
- ✅ Google tidak mendeteksi aktivitas mencurigakan di akun

**Tips agar cookies awet lebih lama:**
1. Gunakan profile browser khusus hanya untuk akun ini
2. Jangan gunakan akun tumbal untuk hal lain
3. Jangan logout dari YouTube di browser tersebut
4. Jaga profile browser tetap utuh (jangan hapus cookies)

Dalam praktiknya, cookies bisa bertahan **berbulan-bulan bahkan bertahun-tahun** jika kamu mengikuti tips ini.

### Troubleshooting / Pemecahan Masalah

**Masih dapat error "Sign in to confirm you're not a bot"?**
- Pastikan path file cookies benar
- Verifikasi file cookies.txt tidak kosong
- Export ulang cookies saat dalam kondisi login di YouTube

**Cookies tiba-tiba berhenti bekerja?**
Ini biasanya terjadi jika:
- Kamu logout dari YouTube di browser → Export ulang cookies
- Kamu ganti password Google → Export ulang cookies
- Google mendeteksi aktivitas mencurigakan → Cek email untuk security alert, lalu export ulang cookies

**Akun di-suspend?**
- Buat akun Google tumbal baru
- Ikuti langkah setup dari awal

### Catatan Keamanan

⚠️ **PERINGATAN**: 
- Jangan pernah bagikan file cookies kamu ke siapapun
- Gunakan akun tumbal, BUKAN akun Google utama kamu
- File cookies berisi data autentikasi sensitif
- Tambahkan `cookies.txt` ke `.gitignore` kamu untuk mencegah commit tidak sengaja
