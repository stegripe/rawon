# Cookies Setup Guide / Panduan Setup Cookies

[English](#english) | [Bahasa Indonesia](#bahasa-indonesia)

---

## English

### Why do I need this?

If you're hosting Rawon on cloud providers like OVHcloud, AWS, GCP, Azure, or other hosting services, you might encounter the error:

> "Sign in to confirm you're not a bot"

This happens because the platform blocks requests from data center IP addresses. By authenticating with a Google account, Rawon can generate and maintain valid cookies to bypass this restriction.

### Recommended Method: Using the Login Command

The easiest way to set up cookies is using the built-in `!login` command. This method:
- ✅ Opens a real browser for Google login via Puppeteer
- ✅ Automatically generates and refreshes cookies
- ✅ Works without manual cookie file export
- ✅ Persists across bot restarts (Docker volume or cache folder)
- ✅ Auto-refreshes cookies when bot detection is encountered

#### Command Usage

```
!login start    - Open a browser and start Google login
!login status   - View current login & cookie status
!login refresh  - Manually refresh cookies from active session
!login reset    - Reset bot detection counter
!login logout   - Clear the current login session
```

#### Quick Start

1. Run `!login start` in Discord
2. The bot will send you a DevTools URL — open it in your browser
3. A Google login page will appear in the remote browser
4. Log in with a **throwaway Google account** (NOT your main account)
5. Once logged in, the bot automatically saves the cookies
6. Done! Cookies are refreshed automatically in the background

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

Docker users have automatic cookie persistence through the named volume `rawon:/app/cache`. The login session (cookies + browser profile) is stored in this volume and persists across container restarts.

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

**Good news**: Platform cookies do NOT expire on a regular schedule like other websites. They will remain valid as long as:
- ✅ You don't log out from the platform in your browser
- ✅ You don't change your account password
- ✅ You don't revoke the session from account settings
- ✅ The platform doesn't detect suspicious activity on the account

Additionally, if the browser session is still running, Rawon will automatically refresh cookies when bot detection is encountered (after 3 consecutive detections).

### Troubleshooting

**Still getting "Sign in to confirm you're not a bot" errors?**
- Use `!login status` to check cookie and login status
- If bot detection counter is high, try `!login reset`
- Use `!login refresh` to manually refresh cookies
- If the session expired, run `!login start` again

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

The bot will use this file if it exists. However, the `!login` method is recommended as it handles cookie refresh automatically.

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

Ini terjadi karena platform memblokir request dari alamat IP data center. Dengan mengautentikasi menggunakan akun Google, Rawon bisa menghasilkan dan memelihara cookies yang valid untuk melewati pembatasan ini.

### Metode yang Direkomendasikan: Menggunakan Command Login

Cara termudah untuk setup cookies adalah menggunakan command `!login` bawaan. Metode ini:
- ✅ Membuka browser sungguhan untuk login Google via Puppeteer
- ✅ Otomatis menghasilkan dan me-refresh cookies
- ✅ Tanpa perlu export file cookie secara manual
- ✅ Tetap tersimpan setelah restart bot (Docker volume atau folder cache)
- ✅ Otomatis refresh cookies saat bot detection terdeteksi

#### Penggunaan Command

```
!login start    - Buka browser dan mulai login Google
!login status   - Lihat status login & cookie saat ini
!login refresh  - Refresh cookies secara manual dari sesi aktif
!login reset    - Reset counter bot detection
!login logout   - Hapus sesi login saat ini
```

#### Quick Start

1. Jalankan `!login start` di Discord
2. Bot akan mengirim URL DevTools — buka di browser kamu
3. Akan muncul halaman login Google di browser remote
4. Login dengan **akun Google tumbal** (JANGAN akun utama)
5. Setelah login, bot otomatis menyimpan cookies
6. Selesai! Cookies akan di-refresh otomatis di background

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

Pengguna Docker memiliki persistence cookie otomatis melalui named volume `rawon:/app/cache`. Sesi login (cookies + browser profile) tersimpan di volume ini dan tetap ada setelah container restart.

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

**Kabar baik**: Cookies platform TIDAK kadaluarsa secara berkala seperti website lain. Mereka akan tetap valid selama:
- ✅ Kamu tidak logout dari platform di browser
- ✅ Kamu tidak ganti password akun
- ✅ Kamu tidak revoke session dari pengaturan akun
- ✅ Platform tidak mendeteksi aktivitas mencurigakan di akun

Selain itu, jika sesi browser masih berjalan, Rawon akan otomatis me-refresh cookies saat bot detection terdeteksi (setelah 3 deteksi berturut-turut).

### Troubleshooting / Pemecahan Masalah

**Masih dapat error "Sign in to confirm you're not a bot"?**
- Gunakan `!login status` untuk cek status cookie dan login
- Jika counter bot detection tinggi, coba `!login reset`
- Gunakan `!login refresh` untuk refresh cookies secara manual
- Jika sesi expired, jalankan `!login start` lagi

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

Bot akan menggunakan file ini jika ada. Namun, metode `!login` lebih direkomendasikan karena menangani refresh cookies secara otomatis.

### Catatan Keamanan

⚠️ **PERINGATAN**: 
- Gunakan akun tumbal Google, BUKAN akun utama kamu
- URL DevTools memberi akses ke sesi browser — jangan bagikan secara publik
- File cookies berisi data autentikasi sensitif
