# Cookies Setup Guide / Panduan Setup Cookies

[English](#english) | [Bahasa Indonesia](#bahasa-indonesia)

---

## English

### Why do I need this?

If you're hosting Rawon on cloud providers like OVHcloud, AWS, GCP, Azure, or other hosting services, you might encounter the error:

> "Sign in to confirm you're not a bot"

This happens because the platform blocks requests from data center IP addresses. By authenticating with a Google account, Rawon can generate valid cookies to bypass this restriction.

### Recommended Method: Using the Login Command

The easiest way to set up cookies is using the built-in `!login` command. This method:
- ✅ Opens a real browser for Google login via Puppeteer
- ✅ Automatically exports cookies and saves them to disk
- ✅ Closes the browser after login — no background processes
- ✅ Persists across bot restarts (Docker volume or cache folder)

#### Command Usage

```
!login start    - Open a browser and start Google login
!login status   - View current login & cookie status
!login logout   - Clear the current login session (wipes all cookies and profile data)
```

#### Quick Start

1. Run `!login start` in Discord
2. The bot will send you a DevTools URL — open it in your browser
3. A Google login page will appear in the remote browser
4. Log in with a **throwaway Google account** (NOT your main account)
5. Once logged in, the bot automatically saves the cookies and closes the browser
6. Done! The bot uses the saved cookies for all subsequent requests

#### If Bot Detection Occurs Again

Cookies may eventually become stale due to server-side rotation. When this happens:
1. Run `!login logout` to clear the old cookies
2. Run `!login start` to log in again with a fresh session

### Prerequisites

- A **secondary/throwaway Google account** (DO NOT use your main account for security reasons)
- **For non-Docker users**: [Deno](https://deno.land/) JavaScript runtime (required for yt-dlp signature solving)
- **For non-Docker users**: Chrome or Chromium browser installed on the host machine

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

> **Note**: Docker users don't need to install Deno manually — it's already included in the Docker image.

### Docker Setup

Docker users have automatic cookie persistence through the named volume `rawon:/app/cache`. The cookies and profile data are stored in this volume and persist across container restarts.

The Docker image comes with Chromium pre-installed, so `!login start` works out of the box.

### Environment Variables

You can optionally configure the following in `dev.env`:

```env
# Port for Chrome DevTools remote debugging proxy
# Used for the login command to access DevTools from a remote machine/host
# Default: 3000
DEVTOOLS_PORT=""

# Path to Chrome/Chromium executable (auto-detected if empty)
CHROMIUM_PATH=""
```

For Docker users, make sure the port mapping in `docker-compose.yaml` matches:
```yaml
ports:
  - "${DEVTOOLS_PORT:-3000}:${DEVTOOLS_PORT:-3000}"
```

### How Long Do Cookies Last?

Cookies may become stale over time due to server-side rotation. They will generally remain valid as long as:
- ✅ You don't log out from the platform in your browser
- ✅ You don't change your account password
- ✅ You don't revoke the session from account settings
- ✅ The platform doesn't detect suspicious activity on the account

When cookies go stale, simply re-login using `!login logout` followed by `!login start`.

### Troubleshooting

**Still getting "Sign in to confirm you're not a bot" errors?**
- Use `!login status` to check cookie and login status
- Run `!login logout` then `!login start` to generate fresh cookies

**Browser won't start?**
- Check `!login status` for error details
- Make sure Chrome/Chromium is installed (or set `CHROMIUM_PATH` in `dev.env`)
- Docker users: this should work automatically with the included Chromium

**Account got suspended?**
- Create a new throwaway Google account
- Run `!login logout` to clear the old session
- Run `!login start` to log in with the new account

### Alternative: Manual Cookie File

If you prefer not to use the login command, you can still manually place a Netscape-format cookie file at:
```
cache/cookies.txt
```

The bot will use this file if it exists. However, the `!login` method is recommended as it provides a simpler workflow.

### Security Notes

⚠️ **WARNING**: 
- Use a throwaway Google account, NOT your main account
- The DevTools URL gives access to the browser session — don't share it publicly
- Cookie files contain sensitive authentication data

---

## Bahasa Indonesia

### Mengapa saya butuh ini?

Jika kamu hosting Rawon di cloud provider seperti OVHcloud, AWS, GCP, Azure, atau layanan hosting lainnya, kamu mungkin mengalami error:

> "Sign in to confirm you're not a bot" (Masuk untuk memastikan kamu bukan bot)

Ini terjadi karena platform memblokir request dari alamat IP data center. Dengan mengautentikasi menggunakan akun Google, Rawon bisa menghasilkan cookies yang valid untuk melewati pembatasan ini.

### Metode yang Direkomendasikan: Menggunakan Command Login

Cara termudah untuk setup cookies adalah menggunakan command `!login` bawaan. Metode ini:
- ✅ Membuka browser sungguhan untuk login Google via Puppeteer
- ✅ Otomatis mengekspor cookies dan menyimpannya ke disk
- ✅ Menutup browser setelah login — tidak ada proses background
- ✅ Tetap tersimpan setelah restart bot (Docker volume atau folder cache)

#### Penggunaan Command

```
!login start    - Buka browser dan mulai login Google
!login status   - Lihat status login & cookie saat ini
!login logout   - Hapus sesi login saat ini (hapus semua cookies dan data profil)
```

#### Quick Start

1. Jalankan `!login start` di Discord
2. Bot akan mengirim URL DevTools — buka di browser kamu
3. Akan muncul halaman login Google di browser remote
4. Login dengan **akun Google tumbal** (JANGAN akun utama)
5. Setelah login, bot otomatis menyimpan cookies dan menutup browser
6. Selesai! Bot menggunakan cookies yang tersimpan untuk semua request selanjutnya

#### Jika Bot Detection Terjadi Lagi

Cookies mungkin menjadi kedaluwarsa karena rotasi di sisi server. Jika ini terjadi:
1. Jalankan `!login logout` untuk menghapus cookies lama
2. Jalankan `!login start` untuk login ulang dengan sesi baru

### Prasyarat

- Akun **cadangan/tumbal Google** (JANGAN gunakan akun utama demi keamanan)
- **Untuk pengguna non-Docker**: [Deno](https://deno.land/) JavaScript runtime (diperlukan untuk yt-dlp signature solving)
- **Untuk pengguna non-Docker**: Browser Chrome atau Chromium terinstall di mesin host

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

> **Catatan**: Pengguna Docker tidak perlu install Deno manual — sudah termasuk di Docker image.

### Setup Docker

Pengguna Docker memiliki persistence cookie otomatis melalui named volume `rawon:/app/cache`. Cookies dan data profil tersimpan di volume ini dan tetap ada setelah container restart.

Docker image sudah termasuk Chromium, jadi `!login start` langsung bisa dipakai tanpa konfigurasi tambahan.

### Variabel Environment

Kamu bisa mengkonfigurasi opsional berikut di `dev.env`:

```env
# Port untuk proxy remote debugging Chrome DevTools
# Digunakan untuk command login agar DevTools bisa diakses dari mesin/host remote
# Default: 3000
DEVTOOLS_PORT=""

# Path ke executable Chrome/Chromium (otomatis terdeteksi jika kosong)
CHROMIUM_PATH=""
```

Untuk pengguna Docker, pastikan port mapping di `docker-compose.yaml` sesuai:
```yaml
ports:
  - "${DEVTOOLS_PORT:-3000}:${DEVTOOLS_PORT:-3000}"
```

### Berapa Lama Cookies Bertahan?

Cookies mungkin menjadi kedaluwarsa seiring waktu karena rotasi di sisi server. Mereka umumnya akan tetap valid selama:
- ✅ Kamu tidak logout dari platform di browser
- ✅ Kamu tidak ganti password akun
- ✅ Kamu tidak revoke session dari pengaturan akun
- ✅ Platform tidak mendeteksi aktivitas mencurigakan di akun

Jika cookies kedaluwarsa, cukup login ulang menggunakan `!login logout` diikuti `!login start`.

### Troubleshooting / Pemecahan Masalah

**Masih dapat error "Sign in to confirm you're not a bot"?**
- Gunakan `!login status` untuk cek status cookie dan login
- Jalankan `!login logout` lalu `!login start` untuk membuat cookies baru

**Browser tidak mau start?**
- Cek `!login status` untuk detail error
- Pastikan Chrome/Chromium terinstall (atau set `CHROMIUM_PATH` di `dev.env`)
- Pengguna Docker: harusnya bisa otomatis dengan Chromium bawaan

**Akun di-suspend?**
- Buat akun tumbal Google baru
- Jalankan `!login logout` untuk hapus sesi lama
- Jalankan `!login start` untuk login dengan akun baru

### Alternatif: File Cookie Manual

Jika kamu tidak ingin menggunakan command login, kamu masih bisa menaruh file cookie berformat Netscape secara manual di:
```
cache/cookies.txt
```

Bot akan menggunakan file ini jika ada. Namun, metode `!login` lebih direkomendasikan karena menyediakan alur kerja yang lebih sederhana.

### Catatan Keamanan

⚠️ **PERINGATAN**: 
- Gunakan akun tumbal Google, BUKAN akun utama kamu
- URL DevTools memberi akses ke sesi browser — jangan bagikan secara publik
- File cookies berisi data autentikasi sensitif
