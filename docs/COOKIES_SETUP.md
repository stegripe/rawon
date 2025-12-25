# Cookies Setup Guide / Panduan Setup Cookies

[English](#english) | [Bahasa Indonesia](#bahasa-indonesia)

---

## English

### Why do I need this?

If you're hosting Rawon on cloud providers like OVHcloud, AWS, GCP, Azure, or other hosting services, you might encounter the error:

> "Sign in to confirm you're not a bot"

This happens because the platform blocks requests from data center IP addresses. By using cookies from a logged-in account, you can bypass this restriction.

### 🆕 Recommended Method: Using the Cookies Command

The easiest way to manage cookies is using the built-in `!cookies` command. This method:
- ✅ Works without restart
- ✅ Supports multiple cookies with automatic rotation
- ✅ Automatically switches to next cookie when one fails
- ✅ Persists across bot restarts (Docker volume or cache folder)

#### Command Usage

```
!cookies add <number>    - Add a cookie (attach cookies.txt file)
!cookies remove <number> - Remove a specific cookie
!cookies remove all      - Remove all cookies
!cookies list            - Show all cookies and their status
!cookies reset           - Reset failed status to retry all cookies
```

#### Quick Start with Command

1. Export cookies from your browser (see [How to Export Cookies](#how-to-export-cookies))
2. In Discord, use `!cookies add 1` and attach your `cookies.txt` file
3. Done! The cookie takes effect immediately

You can add multiple cookies for redundancy:
```
!cookies add 1  (attach first cookies.txt)
!cookies add 2  (attach second cookies.txt from another account)
!cookies add 3  (attach third cookies.txt)
```

When one cookie gets rate-limited, Rawon automatically switches to the next available cookie.

### Prerequisites

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

### How to Export Cookies

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

#### Step 5: Add to Rawon

Use the `!cookies add <number>` command in Discord with the file attached.

### Docker Setup

Docker users have automatic cookie persistence through the named volume `rawon:/app/cache`. Cookies added via the `!cookies` command are stored in this volume and persist across container restarts.

Just use the `!cookies` command - no additional configuration needed!

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
- Use `!cookies list` to check cookie status
- If a cookie shows as "Failed", try `!cookies reset` to retry
- Add more cookies from different accounts for redundancy

**All cookies failed?**
- Create new throwaway accounts
- Export fresh cookies
- Add them with `!cookies add <number>`

**Account got suspended?**
- Create a new throwaway account
- Export new cookies
- Add with `!cookies add <number>`

### Security Notes

⚠️ **WARNING**: 
- Never share your cookies file with anyone
- Use a throwaway account, NOT your main account
- The cookies file contains sensitive authentication data
- Add `cookies.txt` to your `.gitignore` to prevent accidental commits

---

## Bahasa Indonesia

### Mengapa saya butuh ini?

Jika kamu hosting Rawon di cloud provider seperti OVHcloud, AWS, GCP, Azure, atau layanan hosting lainnya, kamu mungkin mengalami error:

> "Sign in to confirm you're not a bot" (Masuk untuk memastikan kamu bukan bot)

Ini terjadi karena platform memblokir request dari alamat IP data center. Dengan menggunakan cookies dari akun yang sudah login, kamu bisa melewati pembatasan ini.

### 🆕 Metode yang Direkomendasikan: Menggunakan Command Cookies

Cara termudah untuk mengelola cookies adalah menggunakan command `!cookies` bawaan. Metode ini:
- ✅ Bekerja tanpa restart
- ✅ Mendukung banyak cookies dengan rotasi otomatis
- ✅ Otomatis beralih ke cookie berikutnya saat satu gagal
- ✅ Tetap tersimpan setelah restart bot (Docker volume atau folder cache)

#### Penggunaan Command

```
!cookies add <nomor>    - Tambah cookie (lampirkan file cookies.txt)
!cookies remove <nomor> - Hapus cookie tertentu
!cookies remove all     - Hapus semua cookies
!cookies list           - Tampilkan semua cookies dan statusnya
!cookies reset          - Reset status gagal untuk mencoba ulang semua cookies
```

#### Quick Start dengan Command

1. Export cookies dari browser kamu (lihat [Cara Export Cookies](#cara-export-cookies))
2. Di Discord, gunakan `!cookies add 1` dan lampirkan file `cookies.txt`
3. Selesai! Cookie langsung aktif

Kamu bisa menambah banyak cookies untuk cadangan:
```
!cookies add 1  (lampirkan cookies.txt pertama)
!cookies add 2  (lampirkan cookies.txt kedua dari akun lain)
!cookies add 3  (lampirkan cookies.txt ketiga)
```

Saat satu cookie kena rate-limit, Rawon otomatis beralih ke cookie yang tersedia berikutnya.

### Prasyarat

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

### Cara Export Cookies

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

#### Langkah 5: Tambahkan ke Rawon

Gunakan command `!cookies add <nomor>` di Discord dengan file terlampir.

### Setup Docker

Pengguna Docker memiliki persistence cookie otomatis melalui named volume `rawon:/app/cache`. Cookies yang ditambah via command `!cookies` tersimpan di volume ini dan tetap ada setelah container restart.

Langsung pakai command `!cookies` - tidak perlu konfigurasi tambahan!

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
- Gunakan `!cookies list` untuk cek status cookie
- Jika cookie menunjukkan "Failed", coba `!cookies reset` untuk mencoba ulang
- Tambah lebih banyak cookies dari akun berbeda untuk cadangan

**Semua cookies gagal?**
- Buat akun tumbal baru
- Export cookies baru
- Tambahkan dengan `!cookies add <nomor>`

**Akun di-suspend?**
- Buat akun tumbal baru
- Export cookies baru
- Tambahkan dengan `!cookies add <nomor>`

### Catatan Keamanan

⚠️ **PERINGATAN**: 
- Jangan pernah bagikan file cookies kamu ke siapapun
- Gunakan akun tumbal, BUKAN akun utama kamu
- File cookies berisi data autentikasi sensitif
- Tambahkan `cookies.txt` ke `.gitignore` kamu untuk mencegah commit tidak sengaja
