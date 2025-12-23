# Cookies Setup Guide / Panduan Setup Cookies

[English](#english) | [Bahasa Indonesia](#bahasa-indonesia)

---

## English

### Do I Need Cookies?

**Short answer: Probably not!**

Rawon now works **without cookies** for most YouTube videos. The bot uses a cookie-less player client (`android_sdkless`) that doesn't require authentication for most content.

**You only need cookies if:**
- You frequently encounter "Sign in to confirm you're not a bot" errors
- You need to access age-restricted content
- You're on a hosting provider with heavily restricted IPs
- The cookie-less mode doesn't work consistently for your use case

If the bot works fine without cookies, you don't need to set them up!

### Why Cookies Were Previously Required

In the past, hosting Rawon on cloud providers like OVHcloud, AWS, GCP, Azure, or other hosting services would result in:

> "Sign in to confirm you're not a bot"

This happened because the platform blocked requests from data center IP addresses. Cookies from a logged-in account were needed to bypass this restriction.

**Now**, the bot uses a different player client that doesn't require authentication for most videos, eliminating the need for cookies in most cases.

### Prerequisites (Only if you need cookies)

- A **secondary/throwaway account** (DO NOT use your main account for security reasons)
- A web browser (Chrome, Firefox, or Edge)
- A cookies export extension
- **For non-Docker users**: [Deno](https://deno.land/) JavaScript runtime (required for yt-dlp signature solving)

### Installing Deno (Non-Docker Users Only)

If you're NOT using Docker, you need to install Deno for yt-dlp to solve the platform's signature challenge:

**Linux/macOS:**
```bash
curl -fsSL https://deno.land/install.sh | sh
```

**Windows (PowerShell):**
```powershell
irm https://deno.land/install.ps1 | iex
```

After installation, make sure `deno` is in your PATH. You can verify by running:
```bash
deno --version
```

> **Note**: Docker users don't need to install Deno manually - it's already included in the Docker image.

### Step-by-Step Guide

#### Step 1: Create a Throwaway Account

1. Go to [Account Creation](https://accounts.google.com/signup)
2. Create a new account specifically for this bot
3. **Important**: Do NOT use your personal/main account

#### Step 2: Log in to the Platform

1. Open your browser
2. Go to [the platform](https://www.youtube.com)
3. Sign in with your throwaway account
4. Accept any terms if prompted

#### Step 3: Install Cookies Export Extension

**For Chrome/Edge:**
- Install [Get cookies.txt LOCALLY](https://chromewebstore.google.com/detail/get-cookiestxt-locally/cclelndahbckbenkjhflpdbgdldlbecc) (Recommended)
- Or [cookies.txt](https://chromewebstore.google.com/detail/cookiestxt/njabckikapfpffapmjgojcnbfjonfjfg)

**For Firefox:**
- Install [cookies.txt](https://addons.mozilla.org/en-US/firefox/addon/cookies-txt/)

#### Step 4: Export Cookies

1. Make sure you're on the platform website
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
      - ./cookies.txt:/app/cache/cookies.txt:ro
```

And set in your `.env`:
```env
YOUTUBE_COOKIES="./cache/cookies.txt"
```

> **Note**: The cookies file is mounted into `/app/cache/cookies.txt` inside the container, so the path in `.env` is the same as non-Docker setup (`./cache/cookies.txt`). Make sure the `cookies.txt` file exists before running `docker compose up`, otherwise Docker will create an empty directory instead.

### How Long Do Cookies Last?

**Good news**: Platform cookies do NOT expire on a regular schedule like other websites. They will remain valid as long as:
- ✅ You don't log out from the platform in your browser
- ✅ You don't change your account password
- ✅ You don't revoke the session from account settings
- ✅ The platform doesn't detect suspicious activity on the account

**Tips to keep cookies valid longer:**
1. Use a dedicated browser profile just for this account
2. Don't use the throwaway account for anything else
3. Don't log out from the platform in that browser
4. Keep the browser profile intact (don't clear cookies)

In practice, cookies can last **months or even years** if you follow these tips.

### Troubleshooting

**Still getting "Sign in to confirm you're not a bot" errors?**
- Make sure the cookies file path is correct
- Verify the cookies.txt file is not empty
- Re-export cookies while logged in to the platform

**Cookies suddenly stopped working?**
This usually happens if:
- You logged out from the platform in your browser → Re-export cookies
- You changed your password → Re-export cookies
- The platform detected suspicious activity → Check your email for security alerts, then re-export cookies

**Account got suspended?**
- Create a new throwaway account
- Follow the setup steps again

### Security Notes

⚠️ **WARNING**: 
- Never share your cookies file with anyone
- Use a throwaway account, NOT your main account
- The cookies file contains sensitive authentication data
- Add `cookies.txt` to your `.gitignore` to prevent accidental commits

---

## Bahasa Indonesia

### Apakah Saya Butuh Cookies?

**Jawaban singkat: Kemungkinan tidak!**

Rawon sekarang bisa berjalan **tanpa cookies** untuk kebanyakan video YouTube. Bot menggunakan player client tanpa cookies (`android_sdkless`) yang tidak memerlukan autentikasi untuk kebanyakan konten.

**Kamu hanya perlu cookies jika:**
- Sering mengalami error "Sign in to confirm you're not a bot"
- Perlu mengakses konten yang dibatasi usia (age-restricted)
- Hosting di provider dengan IP yang sangat dibatasi
- Mode tanpa cookies tidak bekerja konsisten untuk kasus penggunaan kamu

Jika bot bekerja dengan baik tanpa cookies, kamu tidak perlu setup cookies!

### Mengapa Cookies Dulu Diperlukan

Sebelumnya, hosting Rawon di cloud provider seperti OVHcloud, AWS, GCP, Azure, atau layanan hosting lainnya akan menghasilkan error:

> "Sign in to confirm you're not a bot" (Masuk untuk memastikan kamu bukan bot)

Ini terjadi karena platform memblokir request dari alamat IP data center. Cookies dari akun yang sudah login diperlukan untuk melewati pembatasan ini.

**Sekarang**, bot menggunakan player client yang berbeda yang tidak memerlukan autentikasi untuk kebanyakan video, menghilangkan kebutuhan cookies di kebanyakan kasus.

### Prasyarat (Hanya jika kamu butuh cookies)

- Akun **cadangan/tumbal** (JANGAN gunakan akun utama demi keamanan)
- Browser web (Chrome, Firefox, atau Edge)
- Extension untuk export cookies
- **Untuk pengguna non-Docker**: [Deno](https://deno.land/) JavaScript runtime (diperlukan untuk yt-dlp signature solving)

### Menginstall Deno (Hanya untuk Pengguna Non-Docker)

Jika kamu TIDAK menggunakan Docker, kamu perlu install Deno agar yt-dlp bisa solve signature challenge platform:

**Linux/macOS:**
```bash
curl -fsSL https://deno.land/install.sh | sh
```

**Windows (PowerShell):**
```powershell
irm https://deno.land/install.ps1 | iex
```

Setelah instalasi, pastikan `deno` ada di PATH kamu. Verifikasi dengan menjalankan:
```bash
deno --version
```

> **Catatan**: Pengguna Docker tidak perlu install Deno manual - sudah termasuk di Docker image.

### Panduan Langkah demi Langkah

#### Langkah 1: Buat Akun Tumbal

1. Buka [Pembuatan Akun](https://accounts.google.com/signup)
2. Buat akun baru khusus untuk bot ini
3. **Penting**: JANGAN gunakan akun pribadi/utama kamu

#### Langkah 2: Login ke Platform

1. Buka browser kamu
2. Buka [platform](https://www.youtube.com)
3. Login dengan akun tumbal kamu
4. Terima syarat & ketentuan jika diminta

#### Langkah 3: Install Extension Export Cookies

**Untuk Chrome/Edge:**
- Install [Get cookies.txt LOCALLY](https://chromewebstore.google.com/detail/get-cookiestxt-locally/cclelndahbckbenkjhflpdbgdldlbecc) (Direkomendasikan)
- Atau [cookies.txt](https://chromewebstore.google.com/detail/cookiestxt/njabckikapfpffapmjgojcnbfjonfjfg)

**Untuk Firefox:**
- Install [cookies.txt](https://addons.mozilla.org/en-US/firefox/addon/cookies-txt/)

#### Langkah 4: Export Cookies

1. Pastikan kamu sedang di website platform
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
      - ./cookies.txt:/app/cache/cookies.txt:ro
```

Dan set di `.env` kamu:
```env
YOUTUBE_COOKIES="./cache/cookies.txt"
```

> **Catatan**: File cookies di-mount ke `/app/cache/cookies.txt` di dalam container, jadi path di `.env` sama seperti setup non-Docker (`./cache/cookies.txt`). Pastikan file `cookies.txt` sudah ada sebelum menjalankan `docker compose up`, kalau tidak Docker akan membuat folder kosong.

### Berapa Lama Cookies Bertahan?

**Kabar baik**: Cookies platform TIDAK kadaluarsa secara berkala seperti website lain. Mereka akan tetap valid selama:
- ✅ Kamu tidak logout dari platform di browser
- ✅ Kamu tidak ganti password akun
- ✅ Kamu tidak revoke session dari pengaturan akun
- ✅ Platform tidak mendeteksi aktivitas mencurigakan di akun

**Tips agar cookies awet lebih lama:**
1. Gunakan profile browser khusus hanya untuk akun ini
2. Jangan gunakan akun tumbal untuk hal lain
3. Jangan logout dari platform di browser tersebut
4. Jaga profile browser tetap utuh (jangan hapus cookies)

Dalam praktiknya, cookies bisa bertahan **berbulan-bulan bahkan bertahun-tahun** jika kamu mengikuti tips ini.

### Troubleshooting / Pemecahan Masalah

**Masih dapat error "Sign in to confirm you're not a bot"?**
- Pastikan path file cookies benar
- Verifikasi file cookies.txt tidak kosong
- Export ulang cookies saat dalam kondisi login di platform

**Cookies tiba-tiba berhenti bekerja?**
Ini biasanya terjadi jika:
- Kamu logout dari platform di browser → Export ulang cookies
- Kamu ganti password → Export ulang cookies
- Platform mendeteksi aktivitas mencurigakan → Cek email untuk security alert, lalu export ulang cookies

**Akun di-suspend?**
- Buat akun tumbal baru
- Ikuti langkah setup dari awal

### Catatan Keamanan

⚠️ **PERINGATAN**: 
- Jangan pernah bagikan file cookies kamu ke siapapun
- Gunakan akun tumbal, BUKAN akun utama kamu
- File cookies berisi data autentikasi sensitif
- Tambahkan `cookies.txt` ke `.gitignore` kamu untuk mencegah commit tidak sengaja
