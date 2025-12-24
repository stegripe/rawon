# Cookies Setup Guide / Panduan Setup Cookies

[English](#english) | [Bahasa Indonesia](#bahasa-indonesia)

---

## English

### Why do I need this?

If you're hosting Rawon on cloud providers like OVHcloud, AWS, GCP, Azure, or other hosting services, you might encounter the error:

> "Sign in to confirm you're not a bot"

This happens because the platform blocks requests from data center IP addresses. By using cookies from a logged-in account, you can bypass this restriction.

### Prerequisites

- A **secondary/throwaway account** (DO NOT use your main account for security reasons)
- Chrome or Chromium browser on your computer
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

### Step-by-Step Guide (Browser Login)

Rawon includes a built-in browser login feature that extracts cookies automatically.

#### Step 1: Create a Throwaway Account

1. Go to [Account Creation](https://accounts.google.com/signup)
2. Create a new account specifically for this bot
3. **Important**: Do NOT use your personal/main account

#### Step 2: Enable Browser Login Feature

Add these to your `.env`, `dev.env`, or `optional.env` file:

```env
ENABLE_BROWSER_LOGIN=yes
BROWSER_DEBUG_PORT=9222
BROWSER_INSTRUCTIONS_PORT=9223
PUBLIC_HOST=your-server-ip-or-localhost
```

#### Step 3: Configure Docker Ports (Docker only)

If using Docker, uncomment these ports in your `docker-compose.yaml`:

```yaml
ports:
  - "${BROWSER_DEBUG_PORT:-9222}:${BROWSER_DEBUG_PORT:-9222}"
  - "${BROWSER_INSTRUCTIONS_PORT:-9223}:${BROWSER_INSTRUCTIONS_PORT:-9223}"
```

#### Step 4: Start the Bot

Start or restart your bot to apply the changes.

#### Step 5: Start Browser Login Session

In Discord, run the command:
```
ytcookies login
```

This will start a browser session on your server.

#### Step 6: Connect to Remote Browser

1. Open Chrome/Chromium on your computer
2. Go to `chrome://inspect`
3. Click "Configure..." and add:
   - For local: `localhost:9222`
   - For remote server: `your-server-ip:9222`
4. Click "Done"
5. Under "Remote Target", click "inspect" on the page that appears

#### Step 7: Complete Google Login

1. In the opened DevTools window, you'll see the Google login page
2. Log in with your throwaway account
3. Complete any verification if prompted
4. Wait until you're redirected to YouTube

#### Step 8: Save Cookies

Once you're on YouTube, run in Discord:
```
ytcookies save
```

The cookies will be automatically extracted and saved. You can verify with:
```
ytcookies status
```

### Available Commands

- `ytcookies status` - Check current cookie status
- `ytcookies login` - Start a browser login session
- `ytcookies save` - Save cookies from active session
- `ytcookies cancel` - Cancel active login session
- `ytcookies clear` - Clear all stored cookies

### How Long Do Cookies Last?

**Good news**: Platform cookies do NOT expire on a regular schedule like other websites. They will remain valid as long as:
- ✅ You don't change your account password
- ✅ You don't revoke the session from account settings
- ✅ The platform doesn't detect suspicious activity on the account

In practice, cookies can last **months or even years** if you follow these tips.

### Troubleshooting

**Still getting "Sign in to confirm you're not a bot" errors?**
- Run `ytcookies status` to verify cookies exist
- Try clearing cookies with `ytcookies clear` and login again
- Make sure you completed the login process fully (reached youtube.com)

**Can't connect to chrome://inspect?**
- Make sure the ports are exposed in docker-compose.yaml
- Check firewall settings on your server
- Verify the PUBLIC_HOST is set correctly

**Browser login shows "browser not secure" error?**
- This is Google's anti-bot detection
- Try using a different throwaway account
- Wait a few hours before trying again

**Account got suspended?**
- Create a new throwaway account
- Follow the setup steps again

### Security Notes

⚠️ **WARNING**: 
- Never share your cookies file with anyone
- Use a throwaway account, NOT your main account
- The cookies file contains sensitive authentication data
- The browser session stores data in `cache/browser-data/`
- Login sessions auto-expire after 10 minutes

---

## Bahasa Indonesia

### Mengapa saya butuh ini?

Jika kamu hosting Rawon di cloud provider seperti OVHcloud, AWS, GCP, Azure, atau layanan hosting lainnya, kamu mungkin mengalami error:

> "Sign in to confirm you're not a bot" (Masuk untuk memastikan kamu bukan bot)

Ini terjadi karena platform memblokir request dari alamat IP data center. Dengan menggunakan cookies dari akun yang sudah login, kamu bisa melewati pembatasan ini.

### Prasyarat

- Akun **cadangan/tumbal** (JANGAN gunakan akun utama demi keamanan)
- Browser Chrome atau Chromium di komputer kamu
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

### Panduan Langkah demi Langkah (Browser Login)

Rawon menyertakan fitur browser login bawaan yang mengekstrak cookies secara otomatis.

#### Langkah 1: Buat Akun Tumbal

1. Buka [Pembuatan Akun](https://accounts.google.com/signup)
2. Buat akun baru khusus untuk bot ini
3. **Penting**: JANGAN gunakan akun pribadi/utama kamu

#### Langkah 2: Aktifkan Fitur Browser Login

Tambahkan ini ke file `.env`, `dev.env`, atau `optional.env` kamu:

```env
ENABLE_BROWSER_LOGIN=yes
BROWSER_DEBUG_PORT=9222
BROWSER_INSTRUCTIONS_PORT=9223
PUBLIC_HOST=ip-server-kamu-atau-localhost
```

#### Langkah 3: Konfigurasi Port Docker (Docker saja)

Jika menggunakan Docker, uncomment port ini di `docker-compose.yaml`:

```yaml
ports:
  - "${BROWSER_DEBUG_PORT:-9222}:${BROWSER_DEBUG_PORT:-9222}"
  - "${BROWSER_INSTRUCTIONS_PORT:-9223}:${BROWSER_INSTRUCTIONS_PORT:-9223}"
```

#### Langkah 4: Jalankan Bot

Jalankan atau restart bot kamu untuk menerapkan perubahan.

#### Langkah 5: Mulai Sesi Browser Login

Di Discord, jalankan command:
```
ytcookies login
```

Ini akan memulai sesi browser di server kamu.

#### Langkah 6: Hubungkan ke Remote Browser

1. Buka Chrome/Chromium di komputer kamu
2. Buka `chrome://inspect`
3. Klik "Configure..." dan tambahkan:
   - Untuk lokal: `localhost:9222`
   - Untuk server remote: `ip-server-kamu:9222`
4. Klik "Done"
5. Di bawah "Remote Target", klik "inspect" pada halaman yang muncul

#### Langkah 7: Selesaikan Login Google

1. Di jendela DevTools yang terbuka, kamu akan melihat halaman login Google
2. Login dengan akun tumbal kamu
3. Selesaikan verifikasi jika diminta
4. Tunggu sampai diredirect ke YouTube

#### Langkah 8: Simpan Cookies

Setelah kamu di YouTube, jalankan di Discord:
```
ytcookies save
```

Cookies akan otomatis diekstrak dan disimpan. Kamu bisa verifikasi dengan:
```
ytcookies status
```

### Command yang Tersedia

- `ytcookies status` - Cek status cookies saat ini
- `ytcookies login` - Mulai sesi browser login
- `ytcookies save` - Simpan cookies dari sesi aktif
- `ytcookies cancel` - Batalkan sesi login aktif
- `ytcookies clear` - Hapus semua cookies tersimpan

### Berapa Lama Cookies Bertahan?

**Kabar baik**: Cookies platform TIDAK kadaluarsa secara berkala seperti website lain. Mereka akan tetap valid selama:
- ✅ Kamu tidak ganti password akun
- ✅ Kamu tidak revoke session dari pengaturan akun
- ✅ Platform tidak mendeteksi aktivitas mencurigakan di akun

Dalam praktiknya, cookies bisa bertahan **berbulan-bulan bahkan bertahun-tahun** jika kamu mengikuti tips ini.

### Troubleshooting / Pemecahan Masalah

**Masih dapat error "Sign in to confirm you're not a bot"?**
- Jalankan `ytcookies status` untuk verifikasi cookies ada
- Coba hapus cookies dengan `ytcookies clear` dan login ulang
- Pastikan kamu menyelesaikan proses login sepenuhnya (sampai youtube.com)

**Tidak bisa connect ke chrome://inspect?**
- Pastikan port sudah di-expose di docker-compose.yaml
- Cek pengaturan firewall di server kamu
- Verifikasi PUBLIC_HOST sudah diset dengan benar

**Browser login menampilkan error "browser not secure"?**
- Ini adalah deteksi anti-bot Google
- Coba gunakan akun tumbal yang berbeda
- Tunggu beberapa jam sebelum mencoba lagi

**Akun di-suspend?**
- Buat akun tumbal baru
- Ikuti langkah setup dari awal

### Catatan Keamanan

⚠️ **PERINGATAN**: 
- Jangan pernah bagikan file cookies kamu ke siapapun
- Gunakan akun tumbal, BUKAN akun utama kamu
- File cookies berisi data autentikasi sensitif
- Sesi browser menyimpan data di `cache/browser-data/`
- Sesi login otomatis kadaluarsa setelah 10 menit
