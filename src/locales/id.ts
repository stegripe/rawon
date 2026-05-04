import type { Translations } from "./en";

export const id: Translations = {
    nav: {
        home: "Beranda",
        docs: "Dokumentasi",
        gettingStarted: "Memulai",
        configuration: "Konfigurasi",
        cookiesSetup: "Setup Cookies",
        disclaimers: "Disclaimer",
        permissionCalculator: "Kalkulator Izin",
        links: "Tautan"
    },

    home: {
        title: "Rawon",
        description:
            "Bot musik Discord (multi-) yang simpel tapi powerful, dibuat untuk kebutuhan produksi. Mudah dipakai, tanpa perlu coding.",
        invite: "Undang",
        inviteBot: "Undang Bot",
        support: "Dukungan",
        viewDocs: "Dokumentasi"
    },

    gettingStarted: {
        title: "Memulai",
        subtitle:
            "Jalankan Rawon dalam hitungan menit dengan panduan langkah demi langkah.",
        features: {
            title: "✨ Fitur",
            items: [
                "🚀 Siap produksi, tanpa perlu coding",
                "📺 Fitur request channel untuk pengalaman musik yang mulus",
                "🎶 Dukungan YouTube, Spotify, SoundCloud, dan file langsung",
                "🤖 Beberapa instance bot untuk voice channel berbeda",
                "⚡ Pre-caching audio pintar untuk pemutaran lebih lancar",
                "🍪 Login Google bawaan lewat Puppeteer untuk kelola cookies"
            ]
        },
        requirements: {
            title: "📋 Persyaratan",
            nodeVersion: "**Node.js** versi `20.0.0` atau lebih tinggi",
            discordToken:
                "**Token Bot Discord** (dari [Discord Developer Portal](https://discord.com/developers/applications))",
            optional:
                "**Opsional:** [FFmpeg](https://ffmpeg.org/) untuk audio pada setup standar (non-Docker) — image Docker sudah menyertakan FFmpeg"
        },
        standardSetup: {
            title: "💻 Setup Standar (Node.js)",
            steps: [
                "Pasang prasyarat di atas",
                "Clone atau unduh repository ini",
                "Salin `.env.example` ke `.env` dan isi nilai yang diperlukan (minimal: `DISCORD_TOKEN`)",
                "Install dependencies: `pnpm install`",
                "Build project: `pnpm run build`",
                "Jalankan bot: `pnpm start`"
            ],
            requestChannel:
                "(Opsional) Setelah bot online, atur channel musik khusus:"
        },
        dockerSetup: {
            title: "🐳 Setup Docker (Disarankan)",
            composeTitle: "Menggunakan Docker Compose",
            composeSteps: [
                "Buat file `.env` dari `.env.example` dan isi konfigurasi",
                "(Opsional) Buat `dev.env` dari `dev.env.example` untuk pengaturan tambahan",
                "Buat `docker-compose.yaml` (lihat contoh di bawah)",
                "Jalankan bot: `docker compose up -d`",
                "Lihat log: `docker logs -f rawon-bot`"
            ],
            runTitle: "Menggunakan Docker Run",
            volumeInfo: {
                title: "📁 Informasi volume",
                description: "Volume `/app/cache` menyimpan:",
                items: [
                    "Binary `yt-dlp` untuk streaming audio",
                    "`data.*` untuk pengaturan persisten (request channel, state player)",
                    "File audio cache (jika audio caching aktif)",
                    "File cookie dan data profil dari login Google (lihat [Setup Cookies](/docs/cookies-setup))"
                ]
            },
            portInfo: {
                title: "🔌 Informasi port",
                description:
                    "`DEVTOOLS_PORT` (default: `3000`) dipakai untuk proxy remote debugging Chrome DevTools. Diperlukan agar `!login start` bisa diakses dari mesin lain. Atur `DEVTOOLS_PORT` di `dev.env` jika ingin port lain, dan petakan di Docker Compose atau `docker run`."
            }
        },

        cookiesQuickStart: {
            title: "🍪 Cookies: perbaikan cepat di hosting",
            description:
                "Di cloud (AWS, GCP, Azure, Railway, dll.) kamu bisa melihat **\"Sign in to confirm you're not a bot\"**. Pakai alur login bawaan:",
            steps: [
                "Jalankan `!login start` di Discord",
                "Buka **URL DevTools** yang dikirim bot, selesaikan login Google di browser remote",
                "Pakai `!login status` untuk cek cookie, atau `!login logout` lalu `!login start` untuk segarkan sesi"
            ],
            tip: "💡 Pakai **akun Google tumbal**, bukan akun utama. Lihat panduan lengkap [Setup Cookies](/docs/cookies-setup)."
        }
    },

    configuration: {
        title: "Konfigurasi",
        subtitle: "Cara file konfigurasi dan variabel lingkungan Rawon saling melengkapi.",
        overview: {
            title: "📄 File konfigurasi",
            intro: "Pengaturan dibagi ke beberapa file dengan tujuan jelas:",
            items: [
                "**`.env.example`** — Pengaturan esensial (token Discord/Spotify, prefix, ID, aktivitas, dll.). Salin ke **`.env`** lalu isi.",
                "**`dev.env.example`** — Opsional untuk developer (toggle prefix/slash, sharding, port DevTools untuk `!login`, path Chromium, debug). Salin ke **`dev.env`** bila perlu.",
                "**Perintah `setup`** — Opsi khusus bot (warna embed, emoji ya/tidak, splash, alt prefix, volume default, tipe seleksi, audio cache) dikelola lewat **perintah `setup`** (khusus developer) dan disimpan di database. Pakai `<prefix>setup view` untuk melihat opsi yang tersedia."
            ]
        },
        essential: {
            title: "⚡ Pengaturan esensial (`.env`)",
            description:
                "Nilai dari `.env.example`. Hanya **`DISCORD_TOKEN`** yang wajib untuk jalan; tambahkan Spotify, token lirik, dan lainnya sesuai kebutuhan.",
            discordToken: {
                name: "DISCORD_TOKEN",
                description:
                    "Token bot Discord dari [Discord Developer Portal](https://discord.com/developers/applications). Token **dipisah koma** untuk mode multi-bot.",
                required: true
            },
            spotify: {
                name: "API Spotify",
                description:
                    "Atur `SPOTIFY_CLIENT_ID` dan `SPOTIFY_CLIENT_SECRET` dari [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard). **Wajib untuk dukungan Spotify.**",
                required: false
            },
            stegripeLyrics: {
                name: "STEGRIPE_API_LYRICS_TOKEN",
                description:
                    "Diperlukan untuk akurasi command **lyrics**. Hubungi developer untuk akses.",
                required: false
            },
            mainPrefix: {
                name: "MAIN_PREFIX",
                description: "Prefix perintah utama. Contoh: `!` berarti `!play` untuk memutar musik",
                default: "!"
            },
            mainServer: {
                name: "MAIN_SERVER",
                description: "ID server utama untuk registrasi slash command lebih cepat. Kosongkan untuk command global (bisa butuh hingga ~1 jam untuk update)",
                required: false
            },
            devs: {
                name: "DEVS",
                description: "ID user developer bot (pisahkan koma). Developer mengakses command khusus termasuk `setup` dan alat `login`.",
                required: false
            },
            locale: {
                name: "LOCALE",
                description: "Bahasa respon bot",
                default: "en-US",
                options:
                    "en-US, es-ES, fr-FR, id-ID, zh-CN, zh-TW, uk-UA, vi-VN, pt-BR, ru-RU, ja-JP, tr-TR, ko-KR"
            },
            activityTypes: {
                name: "ACTIVITY_TYPES",
                description: "Tipe aktivitas untuk setiap entri di `ACTIVITIES` (pisahkan koma). Jumlahnya harus cocok",
                options: "PLAYING, WATCHING, LISTENING, COMPETING",
                default: "PLAYING"
            },
            activities: {
                name: "ACTIVITIES",
                description:
                    "Baris status di bawah nama bot (pisahkan koma). Placeholder: `{prefix}`, `{userCount}`, `{textChannelCount}`, `{serverCount}`, `{playingCount}`, `{username}`",
                required: false
            }
        },
        multiBot: {
            title: "🔄 Mode multi-bot",
            description:
                "Mode multi-bot **adaptif** — **tanpa** konfigurasi ekstra. Satu token = satu bot; token **dipisah koma** mengaktifkan multi-bot otomatis.",
            example: "Contoh:",
            exampleCode: 'DISCORD_TOKEN="token1, token2, token3"',
            features: [
                "Token **pertama** jadi bot utama untuk command umum",
                "Setiap bot melayani musik untuk user di **voice channel miliknya**",
                "Jika bot utama tidak ada di server, bot berikutnya bisa mengambil alih",
                "Setiap bot butuh **aplikasi Discord sendiri**"
            ]
        },
        developer: {
            title: "🛠️ Pengaturan developer (`dev.env`)",
            description: "Dari `dev.env.example`. **Opsional** — ubah hanya jika paham dampaknya.",
            enablePrefix: {
                name: "ENABLE_PREFIX",
                description: "Aktif/nonaktif command prefix (mis. `!play`)",
                default: "yes",
                options: "yes, no"
            },
            enableSlash: {
                name: "ENABLE_SLASH_COMMAND",
                description: "Aktif/nonaktif slash command (mis. `/play`)",
                default: "yes",
                options: "yes, no"
            },
            enableSharding: {
                name: "ENABLE_SHARDING",
                description: "Sharding untuk bot besar (**hanya mode token tunggal**)",
                default: "no",
                options: "yes, no"
            },
            devtoolsPort: {
                name: "DEVTOOLS_PORT",
                description:
                    "Port proxy remote debugging Chrome DevTools. Dipakai `!login start` saat DevTools dibuka dari mesin lain. Default: `3000`",
                default: "3000"
            },
            chromiumPath: {
                name: "CHROMIUM_PATH",
                description: "Path ke Chrome/Chromium untuk login Google. Kosongkan untuk deteksi otomatis",
                required: false
            },
            nodeEnv: {
                name: "NODE_ENV",
                description: "Mode lingkungan runtime",
                default: "production",
                options: "production, development"
            },
            debugMode: {
                name: "DEBUG_MODE",
                description: "Logging debug verbose ke konsol",
                default: "no",
                options: "yes, no"
            }
        }
    },

    cookiesSetup: {
        title: "Setup Cookies",
        subtitle:
            "Atasi \"Sign in to confirm you're not a bot\" di hosting cloud. Disarankan: command **`!login`** bawaan.",
        why: {
            title: "Mengapa saya butuh ini?",
            description:
                "Jika kamu hosting Rawon di OVHcloud, AWS, GCP, Azure, atau host cloud/VPS lain, kamu bisa melihat:",
            error: "Sign in to confirm you're not a bot",
            explanation:
                "Platform sering memblokir request dari IP data center. Dengan autentikasi **akun Google**, Rawon bisa mendapat cookie valid dan melewati pembatasan itu."
        },
        loginMethod: {
            title: "Disarankan: command `!login`",
            description:
                "Cara termudah: alur **`!login`** (browser sungguhan lewat Puppeteer):",
            benefits: [
                "✅ Membuka browser sungguhan untuk login Google",
                "✅ Mengekspor cookie dan menyimpannya otomatis",
                "✅ Menutup browser setelah login — tidak ada browser mengambang",
                "✅ Bertahan setelah restart (volume Docker atau folder `cache/`)"
            ]
        },
        commandUsage: {
            title: "Penggunaan command"
        },
        quickStart: {
            title: "Quick start",
            steps: [
                "Jalankan `!login start` di Discord",
                "Buka **URL DevTools** yang dikirim bot di browser lokal kamu",
                "Selesaikan login Google di sesi browser **remote**",
                "Login dengan **akun Google tumbal** (bukan akun utama)",
                "Setelah selesai, bot menyimpan cookie dan menutup browser",
                "Selesai — request berikutnya memakai sesi tersimpan"
            ]
        },
        staleCookies: {
            title: "Jika pemeriksaan bot terjadi lagi",
            description: "Cookie bisa kedaluwarsa saat penyedia merotasi sesi. Maka:",
            steps: [
                "Jalankan `!login logout` untuk hapus cookie dan data profil lama",
                "Jalankan `!login start` dan login lagi untuk sesi segar"
            ]
        },
        prerequisites: {
            title: "Prasyarat",
            items: [
                "**Akun Google cadangan/tumbal** (jangan pakai akun utama)",
                "**Non-Docker:** Chrome atau Chromium terpasang di host",
                "**Docker:** Chromium sudah termasuk; petakan `DEVTOOLS_PORT` jika `!login` dari jarak jauh (lihat [Konfigurasi](/docs/configuration))"
            ]
        },
        docker: {
            title: "Docker",
            persistence:
                "Cookie dan data profil bertahan di volume bernama **`rawon:/app/cache`** melewati restart container.",
            chromium: "Image sudah berisi Chromium, jadi **`!login start`** jalan tanpa setup tambahan di sisi image."
        },
        envVars: {
            title: "Variabel environment (`dev.env`)",
            intro: "Opsi tambahan (lihat `dev.env.example`):",
            dockerComposeHint:
                "Untuk Docker, pastikan `ports` di `docker-compose.yaml` memetakan port DevTools, misalnya:"
        },
        duration: {
            title: "Berapa lama cookie bertahan?",
            description:
                "Bisa kedaluwarsa seiring waktu karena rotasi sesi. Biasanya tetap valid selama:",
            conditions: [
                "Kamu tidak logout dengan cara yang membatalkan sesi",
                "Kamu tidak mengganti password akun",
                "Kamu tidak mencabut sesi di pengaturan keamanan akun",
                "Penyedia tidak menandai aktivitas mencurigakan"
            ],
            footer: "Saat cookie habis masa pakai, jalankan `!login logout` lalu `!login start` lagi."
        },
        troubleshooting: {
            title: "Troubleshooting / Pemecahan masalah",
            stillErrors: {
                title: "Masih melihat \"Sign in to confirm you're not a bot\"?",
                steps: [
                    "Pakai `!login status` untuk cek status login dan cookie",
                    "Jalankan `!login logout` lalu `!login start` untuk sesi baru"
                ]
            },
            browserWontStart: {
                title: "Browser tidak mau start?",
                steps: [
                    "Cek `!login status` untuk detail error",
                    "Di bare metal, pasang Chrome/Chromium atau set `CHROMIUM_PATH` di `dev.env`",
                    "Di Docker, Chromium biasanya langsung jalan dengan image resmi"
                ]
            },
            accountSuspended: {
                title: "Akun di-suspend?",
                steps: [
                    "Buat akun Google tumbal baru",
                    "Jalankan `!login logout` untuk hapus sesi lama",
                    "Jalankan `!login start` dan login dengan akun baru"
                ]
            }
        },
        manualAlternative: {
            title: "Alternatif: file cookie manual",
            description:
                "Kamu bisa menaruh file cookie format **Netscape** di path di bawah. Bot memakainya jika ada; **`!login` tetap disarankan** untuk alur lebih sederhana.",
            pathLabel: "Path"
        },
        security: {
            title: "Catatan keamanan",
            warningLabel: "PERINGATAN",
            warnings: [
                "Pakai akun Google **tumbal** — **bukan** akun utama",
                "URL DevTools memberi akses ke sesi browser remote — **jangan** sebar ke publik",
                "File cookie berisi data autentikasi **sensitif**"
            ]
        }
    },

    disclaimers: {
        title: "Disclaimer",
        subtitle: "Harap baca dengan saksama sebelum menggunakan bot ini.",
        warningBanner: "Informasi hukum penting",
        copyright: {
            title: "Hak Cipta, DMCA, dan Kekayaan Intelektual",
            items: [
                "**Kepemilikan:** Kekayaan intelektual yang dipakai, diputar, atau ditampilkan bot **bukan milik kami**, pengelola, atau kontributor. Termasuk namun tidak terbatas pada audio, video, dan gambar dalam command bot.",
                "**Kebijakan penyedia hosting:** Beberapa penyedia melarang hosting atau distribusi konten dilindungi DMCA, termasuk bot musik Discord yang memutar musik/video berhak cipta.\n- **Deploy ke platform tersebut dengan risiko kamu sendiri**",
                "**Tanggung jawab pengguna:** Kamu bertanggung jawab atas cara memakai bot dan konten yang diputar."
            ]
        },
        code: {
            title: "Modifikasi kode",
            items: [
                "**Lisensi:** Proyek ini berlisensi [Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International (CC BY-NC-ND 4.0)](https://creativecommons.org/licenses/by-nc-nd/4.0/). Teks hukum lengkap ada di file [`LICENSE`](https://github.com/stegripe/rawon/blob/main/LICENSE) di repository.",
                "**Tanpa jaminan:** Sesuai lisensi, kami **tidak bertanggung jawab** atas kerugian akibat pemakaian kode ini. Ikuti ketentuan lisensi untuk atribusi, penggunaan non-komersial, dan larangan berbagi materi adaptasi.",
                "**Atribusi:** Jangan mengklaim proyek ini sebagai karya asli kamu. Selalu beri atribusi ke proyek asli."
            ]
        },
        licenseFooterPrefix: "Untuk teks lisensi lengkap, lihat di repository",
        licenseLinkLabel: "LICENSE (CC BY-NC-ND 4.0)"
    },

    permissionCalculator: {
        title: "Kalkulator Izin",
        clientId: "Client ID",
        scope: "Scope",
        redirectUri: "Redirect URI",
        permissions: "Izin",
        permissionsNote:
            "Berwarna berarti pengguna OAuth perlu mengaktifkan 2FA di akun mereka jika server memerlukan 2FA",
        general: "Umum",
        voice: "Suara",
        text: "Teks",
        result: "Hasil",
        resultNote: "Ini adalah link yang bisa digunakan untuk menambahkan bot ke server Anda"
    },

    common: {
        back: "Kembali",
        copy: "Salin",
        default: "Default",
        required: "Wajib",
        optional: "Opsional",
        example: "Contoh",
        learnMore: "Pelajari Lebih Lanjut",

        language: "Bahasa",
        tip: "Tips",
        warning: "Peringatan",
        note: "Catatan"
    }
};
