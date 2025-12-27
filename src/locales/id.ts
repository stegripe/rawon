export const id = {
    // Navigation
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

    // Home page
    home: {
        title: "Rawon",
        description:
            "Bot musik Discord yang simpel tapi powerful, dibuat untuk memenuhi kebutuhan produksi Anda. Mudah digunakan, tanpa perlu coding.",
        invite: "Undang",
        support: "Dukungan",
        viewDocs: "Dokumentasi"
    },

    // Getting Started page
    gettingStarted: {
        title: "Memulai",
        subtitle:
            "Jalankan Rawon dalam hitungan menit dengan panduan langkah demi langkah kami.",
        features: {
            title: "✨ Fitur",
            items: [
                "🎮 Dukungan interaksi (slash commands dan tombol)",
                "📺 Fitur request channel untuk pengalaman musik yang mulus",
                "🚀 Siap produksi, tanpa perlu coding",
                "⚙️ Mudah dikonfigurasi dan digunakan",
                "🎵 Perintah musik dasar (play, pause, skip, queue, dll.)",
                "🌍 Dukungan multi-bahasa (12 bahasa)",
                "🔄 Rotasi multi-cookie untuk pemutaran tanpa gangguan",
                "⚡ Pre-caching audio pintar untuk pemutaran lebih lancar",
                "🎶 Dukungan berbagai platform musik (situs video, Spotify, SoundCloud)",
                "📋 Dukungan playlist penuh (termasuk playlist besar 100+ lagu)"
            ]
        },
        requirements: {
            title: "📋 Persyaratan",
            nodeVersion: "Node.js versi 22.12.0 atau lebih tinggi",
            discordToken:
                "Token Bot Discord (dapatkan dari [Discord Developer Portal](https://discord.com/developers/applications))",
            optional: "Opsional: Kredensial API Spotify untuk dukungan Spotify"
        },
        standardSetup: {
            title: "💻 Setup Standar (Node.js)",
            steps: [
                "Download dan install Node.js versi 22.12.0 atau lebih tinggi",
                "Clone atau download repository ini",
                "Salin .env_example ke .env dan isi nilai yang diperlukan (minimal: DISCORD_TOKEN)",
                "Install dependencies: pnpm install",
                "Build project: pnpm run build",
                "Jalankan bot: pnpm start"
            ],
            requestChannel:
                "(Opsional) Setelah bot online, setup channel musik khusus:"
        },
        dockerSetup: {
            title: "🐳 Setup Docker (Disarankan)",
            composeTitle: "Menggunakan Docker Compose",
            composeSteps: [
                "Buat file .env dengan konfigurasi Anda (salin dari .env_example)",
                "Buat file docker-compose.yaml (lihat contoh di bawah)",
                "Jalankan bot: docker compose up -d",
                "Lihat log: docker logs -f rawon-bot"
            ],
            runTitle: "Menggunakan Docker Run",
            volumeInfo: {
                title: "📁 Informasi Volume",
                description: "Volume /app/cache menyimpan:",
                items: [
                    "Binary yt-dlp untuk streaming audio",
                    "data.json untuk pengaturan persisten (request channels, status player)",
                    "File audio yang di-cache (jika audio caching diaktifkan)",
                    "File cookie untuk autentikasi platform video"
                ]
            }
        },
        railwaySetup: {
            title: "🚂 Deploy ke Railway",
            description:
                "Railway menyediakan $5 kredit gratis per bulan. Bot Anda akan online 24/7 selama penggunaan di bawah $5.",
            warning:
                "PENTING: Baca Disclaimer sebelum deploy ke Railway."
        },
        cookiesQuickStart: {
            title: "🍪 Quick Start: Setup Cookies",
            description:
                "Jika hosting di cloud provider (AWS, GCP, Azure, Railway, dll.), Anda mungkin dapat error \"Sign in to confirm you're not a bot\". Perbaiki dengan mudah menggunakan command cookies:",
            steps: [
                "Export cookies dari browser (lihat [panduan Setup Cookies](/docs/cookies-setup))",
                "Di Discord, ketik: `!cookies add 1`",
                "Lampirkan file `cookies.txt` ke pesan Anda",
                "Selesai! Cookie langsung aktif"
            ],
            tip: "💡 Anda bisa menambah banyak cookies untuk cadangan. Saat satu gagal, Rawon otomatis beralih ke yang berikutnya!"
        }
    },

    // Configuration page
    configuration: {
        title: "Konfigurasi",
        subtitle: "Konfigurasikan Rawon sesuai kebutuhan Anda dengan pengaturan ini.",
        essential: {
            title: "⚡ Pengaturan Esensial",
            description:
                "Ini adalah pengaturan minimum untuk menjalankan bot. Cukup isi token Discord dan Anda siap!",
            discordToken: {
                name: "DISCORD_TOKEN",
                description:
                    "Token bot Discord Anda dari [Discord Developer Portal](https://discord.com/developers/applications). Ini satu-satunya pengaturan WAJIB!",
                required: true
            },
            mainPrefix: {
                name: "MAIN_PREFIX",
                description: "Prefix perintah utama. Contoh: ! berarti Anda ketik !play untuk memutar musik",
                default: "!"
            },
            mainServer: {
                name: "MAIN_SERVER",
                description: "ID server utama untuk registrasi slash command lebih cepat. Kosongkan untuk command global (butuh waktu hingga 1 jam untuk update)",
                required: false
            },
            locale: {
                name: "LOCALE",
                description: "Bahasa bot - pilih bahasa yang Anda inginkan untuk respon bot",
                default: "en-US",
                options:
                    "en-US, es-ES, fr-FR, id-ID, zh-CN, zh-TW, uk-UA, vi-VN, pt-BR, ru-RU, ja-JP, tr-TR"
            },
            spotify: {
                name: "API Spotify",
                description:
                    "Untuk dukungan Spotify, dapatkan kredensial dari [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard) dan atur `SPOTIFY_CLIENT_ID` dan `SPOTIFY_CLIENT_SECRET`"
            }
        },
        optional: {
            title: "🎨 Pengaturan Opsional",
            description: "Kustomisasi perilaku dan tampilan Rawon. Semua ini opsional - bot berfungsi baik tanpanya!",
            altPrefix: {
                name: "ALT_PREFIX",
                description:
                    "Prefix alternatif (pisahkan dengan koma). Gunakan {mention} untuk mengizinkan @bot sebagai prefix. Contoh: {mention},r! mengizinkan @Rawon play dan r!play",
                default: "{mention}"
            },
            activities: {
                name: "ACTIVITIES",
                description:
                    "Aktivitas status bot yang ditampilkan di bawah nama bot (pisahkan dengan koma). Placeholder tersedia: {prefix}, {userCount}, {textChannelCount}, {serverCount}, {playingCount}, {username}"
            },
            activityTypes: {
                name: "ACTIVITY_TYPES",
                description: "Tipe aktivitas untuk setiap aktivitas di atas (pisahkan dengan koma). Harus sesuai jumlah ACTIVITIES",
                options: "PLAYING, WATCHING, LISTENING, COMPETING"
            },
            embedColor: {
                name: "EMBED_COLOR",
                description: "Warna embed dalam hex (tanpa #). Warna ini muncul di semua embed pesan bot",
                default: "22C9FF"
            },
            emojis: {
                name: "Emoji",
                description:
                    "Kustomisasi emoji sukses (YES_EMOJI) dan gagal (NO_EMOJI) yang ditampilkan di respon bot",
                defaults: "✅ / ❌"
            },
            musicSelection: {
                name: "MUSIC_SELECTION_TYPE",
                description: "Cara hasil pencarian ditampilkan. 'message' menunjukkan daftar bernomor, 'selectmenu' menunjukkan menu dropdown",
                options: "message, selectmenu",
                default: "message"
            },
            audioCache: {
                name: "ENABLE_AUDIO_CACHE",
                description:
                    "[EKSPERIMENTAL] Cache audio yang didownload untuk pemutaran ulang lebih cepat. Menggunakan lebih banyak disk space tapi mempercepat lagu yang sering diputar",
                default: "no"
            },
            requestChannelSplash: {
                name: "REQUEST_CHANNEL_SPLASH",
                description: "URL gambar kustom untuk embed player request channel",
                default: "https://cdn.stegripe.org/images/rawon_splash.png"
            }
        },
        developer: {
            title: "🛠️ Pengaturan Developer",
            description: "Pengaturan lanjutan untuk developer bot. Hanya gunakan jika Anda tahu apa yang Anda lakukan!",
            devs: {
                name: "DEVS",
                description: "ID developer bot (pisahkan dengan koma). Developer dapat mengakses command khusus"
            },
            enablePrefix: {
                name: "ENABLE_PREFIX",
                description: "Aktifkan/nonaktifkan prefix commands (seperti !play). Berguna jika Anda hanya ingin slash commands",
                default: "yes",
                options: "yes, no"
            },
            enableSlash: {
                name: "ENABLE_SLASH_COMMAND",
                description: "Aktifkan/nonaktifkan slash commands (seperti /play). Berguna jika Anda hanya ingin prefix commands",
                default: "yes",
                options: "yes, no"
            },
            debugMode: {
                name: "DEBUG_MODE",
                description: "Aktifkan debug logging untuk troubleshooting. Menampilkan log detail di console",
                default: "no",
                options: "yes, no"
            }
        }
    },

    // Cookies Setup page
    cookiesSetup: {
        title: "Setup Cookies",
        subtitle:
            "Perbaiki error \"Sign in to confirm you're not a bot\" di hosting provider. Lebih mudah dari yang Anda kira!",
        why: {
            title: "🤔 Mengapa saya butuh ini?",
            description:
                "Jika Anda hosting Rawon di cloud provider seperti OVHcloud, AWS, GCP, Azure, Railway, atau layanan hosting lainnya, Anda mungkin mengalami error:",
            error: "Sign in to confirm you're not a bot",
            explanation:
                "Ini terjadi karena platform video memblokir request dari alamat IP data center. Dengan menggunakan cookies dari akun yang sudah login, Anda bisa melewati pembatasan ini. Jangan khawatir - setup-nya mudah!"
        },
        quickMethod: {
            title: "🚀 Metode Mudah: Menggunakan Command Cookies (Disarankan)",
            description: "Cara termudah mengelola cookies - tidak perlu edit file!",
            benefits: [
                "✅ Langsung aktif - tidak perlu restart",
                "✅ Mendukung banyak cookies dengan rotasi otomatis",
                "✅ Saat satu cookie gagal, bot otomatis pakai yang berikutnya",
                "✅ Cookies tetap tersimpan setelah restart bot"
            ],
            commands: {
                title: "📝 Command yang Tersedia"
            },
            quickStart: {
                title: "⚡ Quick Start (3 langkah)",
                steps: [
                    "Export cookies dari browser (lihat panduan di bawah)",
                    "Di Discord, ketik: `!cookies add 1` dan lampirkan file cookies.txt",
                    "Selesai! Cookie sekarang aktif"
                ]
            },
            multiCookie: {
                title: "💡 Tips Pro: Tambah Banyak Cookies",
                description: "Tambah cookies dari akun berbeda untuk reliabilitas lebih baik:"
            }
        },
        prerequisites: {
            title: "📋 Yang Anda Butuhkan",
            items: [
                "Akun platform video cadangan/tumbal (JANGAN gunakan akun utama!)",
                "Browser web (Chrome, Firefox, atau Edge)",
                "Extension untuk export cookies (gratis dari browser store)"
            ]
        },
        steps: {
            title: "📖 Cara Export Cookies",
            createAccount: {
                title: "Langkah 1: Buat Akun Tumbal",
                steps: [
                    "Buka [halaman pendaftaran akun platform video](https://accounts.google.com/signup)",
                    "Buat akun BARU khusus untuk bot ini",
                    "⚠️ PENTING: JANGAN gunakan akun pribadi/utama!"
                ]
            },
            login: {
                title: "Langkah 2: Login ke Platform Video",
                steps: [
                    "Buka browser Anda",
                    "Buka [website platform video](https://youtube.com)",
                    "Login dengan akun tumbal Anda",
                    "Terima syarat & ketentuan jika diminta"
                ]
            },
            extension: {
                title: "Langkah 3: Install Extension Export Cookies",
                chrome: "Untuk Chrome/Edge: Install [**Get cookies.txt LOCALLY**](https://chromewebstore.google.com/detail/get-cookiestxt-locally/cclelndahbckbenkjhflpdbgdldlbecc) (disarankan) dari Chrome Web Store",
                firefox: "Untuk Firefox: Install [**cookies.txt**](https://addons.mozilla.org/en-US/firefox/addon/cookies-txt/) dari Firefox Add-ons"
            },
            exportCookies: {
                title: "Langkah 4: Export Cookies",
                steps: [
                    "Pastikan Anda di [website platform video](https://youtube.com)",
                    "Klik ikon extension cookies di toolbar browser",
                    "Klik **Export** atau **Export cookies for this site**",
                    "Simpan file sebagai `cookies.txt`"
                ]
            },
            upload: {
                title: "Langkah 5: Tambahkan ke Rawon",
                steps: [
                    "Buka channel dimana Rawon bisa melihat pesan Anda",
                    "Ketik: `!cookies add 1`",
                    "Lampirkan file cookies.txt ke pesan dan kirim",
                    "Rawon akan konfirmasi cookie sudah ditambahkan!"
                ]
            }
        },
        troubleshooting: {
            title: "🔧 Troubleshooting",
            stillGettingErrors: {
                title: "Masih dapat error \"Sign in to confirm you're not a bot\"?",
                steps: [
                    "Gunakan `!cookies list` untuk cek status cookie",
                    "Jika cookie menunjukkan **Failed**, coba `!cookies reset` untuk mencoba ulang",
                    "Tambah lebih banyak cookies dari akun berbeda untuk cadangan"
                ]
            },
            allCookiesFailed: {
                title: "Semua cookies gagal?",
                steps: [
                    "Buat akun tumbal baru",
                    "Export cookies baru",
                    "Tambahkan dengan `!cookies add <nomor>`"
                ]
            },
            accountSuspended: {
                title: "Akun di-suspend?",
                steps: [
                    "Ini bisa terjadi dengan penggunaan berat",
                    "Cukup buat akun tumbal baru",
                    "Export cookies baru dan tambahkan"
                ]
            }
        },
        duration: {
            title: "⏰ Berapa Lama Cookies Bertahan?",
            description:
                "Kabar baik! Cookies platform video TIDAK kadaluarsa secara berkala. Mereka tetap valid selama:",
            conditions: [
                "Anda tidak logout dari platform video di browser",
                "Anda tidak ganti password akun",
                "Anda tidak revoke session dari pengaturan akun",
                "Platform tidak mendeteksi aktivitas mencurigakan"
            ],
            tips: "Dalam praktiknya, cookies bisa bertahan berbulan-bulan bahkan bertahun-tahun! Cukup setup sekali dan lupakan."
        },
        security: {
            title: "🔒 Catatan Keamanan",
            warnings: [
                "⚠️ JANGAN pernah bagikan file cookies ke siapapun",
                "⚠️ Gunakan akun tumbal, BUKAN akun utama",
                "⚠️ File cookies berisi data login sensitif"
            ]
        }
    },

    // Disclaimers page
    disclaimers: {
        title: "Disclaimer",
        subtitle: "Harap baca dengan seksama sebelum menggunakan bot ini.",
        warningBanner: "Informasi hukum penting",
        copyright: {
            title: "Hak Cipta, DMCA, dan Kekayaan Intelektual",
            items: [
                "Kepemilikan: Setiap kekayaan intelektual yang digunakan, diputar, atau ditampilkan oleh bot BUKAN milik kami, pengelola, atau kontributor manapun. Ini termasuk, tetapi tidak terbatas pada, file audio, video, dan gambar yang digunakan dalam perintah bot.",
                "Kebijakan Hosting Provider: Beberapa hosting provider (seperti Railway) melarang hosting atau distribusi konten yang dilindungi DMCA. Ini termasuk bot musik Discord yang memutar musik/video berhak cipta. Deploy ke platform tersebut dengan risiko Anda sendiri.",
                "Tanggung Jawab Pengguna: Anda bertanggung jawab atas cara Anda menggunakan bot ini dan konten apa yang diputar melaluinya."
            ]
        },
        code: {
            title: "Modifikasi Kode",
            items: [
                "Lisensi: Bot ini open source dan dapat dimodifikasi serta didistribusikan ulang di bawah lisensi AGPL-3.0.",
                "Tanpa Jaminan: Sebagaimana dinyatakan dalam lisensi, kami TIDAK bertanggung jawab atas kerusakan atau kerugian yang diakibatkan dari memodifikasi, mendistribusikan ulang, atau menggunakan kode ini.",
                "Atribusi: Jangan pernah mengklaim proyek ini sebagai karya asli Anda sendiri. Selalu berikan atribusi yang tepat ke proyek asli."
            ]
        }
    },

    // Permission Calculator page
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

    // Common
    common: {
        back: "Kembali",
        copy: "Salin",
        default: "Default",
        required: "Wajib",
        optional: "Opsional",
        example: "Contoh",
        learnMore: "Pelajari Lebih Lanjut",
        deployOnRailway: "Deploy ke Railway",
        language: "Bahasa",
        tip: "Tips",
        warning: "Peringatan",
        note: "Catatan"
    }
};
