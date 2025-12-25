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
            "Bot musik Discord yang simpel tapi powerful, dibuat untuk memenuhi kebutuhan produksi Anda.",
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
            title: "Fitur",
            items: [
                "Dukungan interaksi (slash commands dan tombol)",
                "Fitur request channel untuk pengalaman musik yang mulus",
                "Siap produksi, tanpa perlu coding",
                "Mudah dikonfigurasi dan digunakan",
                "Perintah musik dasar (play, pause, skip, queue, dll.)",
                "Dukungan multi-bahasa"
            ]
        },
        requirements: {
            title: "Persyaratan",
            nodeVersion: "Node.js versi 22.12.0 atau lebih tinggi",
            discordToken:
                "Token Bot Discord (dapatkan dari Discord Developer Portal)",
            optional: "Opsional: Kredensial API Spotify untuk dukungan Spotify"
        },
        standardSetup: {
            title: "Setup Standar (Node.js)",
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
            title: "Setup Docker (Disarankan)",
            composeTitle: "Menggunakan Docker Compose",
            composeSteps: [
                "Buat file .env dengan konfigurasi Anda (salin dari .env_example)",
                "Buat file docker-compose.yaml (lihat contoh di bawah)",
                "Jalankan bot: docker compose up -d",
                "Lihat log: docker logs -f rawon-bot"
            ],
            runTitle: "Menggunakan Docker Run",
            volumeInfo: {
                title: "Informasi Volume",
                description: "Volume /app/cache menyimpan:",
                items: [
                    "Binary yt-dlp untuk streaming audio",
                    "data.json untuk pengaturan persisten (request channels, status player)",
                    "File audio yang di-cache (jika audio caching diaktifkan)"
                ]
            }
        },
        railwaySetup: {
            title: "Deploy ke Railway",
            description:
                "Railway menyediakan $5 kredit gratis per bulan. Bot Anda akan online 24/7 selama penggunaan di bawah $5.",
            warning:
                "PENTING: Baca Disclaimer sebelum deploy ke Railway."
        }
    },

    // Configuration page
    configuration: {
        title: "Konfigurasi",
        subtitle: "Konfigurasikan Rawon sesuai kebutuhan Anda dengan pengaturan ini.",
        essential: {
            title: "Pengaturan Esensial",
            description:
                "Ini adalah pengaturan minimum yang diperlukan untuk menjalankan bot.",
            discordToken: {
                name: "DISCORD_TOKEN",
                description:
                    "Token bot Discord Anda dari Discord Developer Portal",
                required: true
            },
            mainPrefix: {
                name: "MAIN_PREFIX",
                description: "Prefix perintah utama",
                default: "!"
            },
            mainServer: {
                name: "MAIN_SERVER",
                description: "ID server utama untuk registrasi slash command",
                required: false
            },
            locale: {
                name: "LOCALE",
                description: "Bahasa bot",
                default: "en-US",
                options:
                    "en-US, es-ES, fr-FR, id-ID, zh-CN, zh-TW, uk-UA, vi-VN, pt-BR, ru-RU, ja-JP, tr-TR"
            },
            spotify: {
                name: "API Spotify",
                description:
                    "Untuk dukungan Spotify, atur SPOTIFY_CLIENT_ID dan SPOTIFY_CLIENT_SECRET"
            }
        },
        optional: {
            title: "Pengaturan Opsional",
            description: "Kustomisasi perilaku dan tampilan Rawon.",
            altPrefix: {
                name: "ALT_PREFIX",
                description:
                    "Prefix alternatif (pisahkan dengan koma). Gunakan {mention} untuk mention @bot",
                default: "{mention}"
            },
            activities: {
                name: "ACTIVITIES",
                description:
                    "Aktivitas status bot (pisahkan dengan koma). Format: {prefix}, {userCount}, {textChannelCount}, {serverCount}, {playingCount}, {username}"
            },
            activityTypes: {
                name: "ACTIVITY_TYPES",
                description: "Tipe aktivitas untuk setiap aktivitas (pisahkan dengan koma)",
                options: "PLAYING, WATCHING, LISTENING, COMPETING"
            },
            embedColor: {
                name: "EMBED_COLOR",
                description: "Warna embed dalam hex (tanpa #)",
                default: "22C9FF"
            },
            emojis: {
                name: "Emoji",
                description:
                    "Kustomisasi emoji sukses (YES_EMOJI) dan gagal (NO_EMOJI)",
                defaults: "✅ / ❌"
            },
            musicSelection: {
                name: "MUSIC_SELECTION_TYPE",
                description: "Gaya pemilihan musik",
                options: "message, selectmenu",
                default: "message"
            },
            audioCache: {
                name: "ENABLE_AUDIO_CACHE",
                description:
                    "[EKSPERIMENTAL] Cache audio yang didownload untuk pemutaran ulang yang lebih cepat",
                default: "no"
            }
        }
    },

    // Cookies Setup page
    cookiesSetup: {
        title: "Setup Cookies",
        subtitle:
            "Perbaiki error 'Sign in to confirm you're not a bot' di hosting provider.",
        why: {
            title: "Mengapa saya butuh ini?",
            description:
                "Jika Anda hosting Rawon di cloud provider seperti OVHcloud, AWS, GCP, Azure, atau layanan hosting lainnya, Anda mungkin mengalami error:",
            error: "Sign in to confirm you're not a bot",
            explanation:
                "Ini terjadi karena platform memblokir request dari alamat IP data center. Dengan menggunakan cookies dari akun yang sudah login, Anda bisa melewati pembatasan ini."
        },
        prerequisites: {
            title: "Prasyarat",
            items: [
                "Akun cadangan/tumbal (JANGAN gunakan akun utama demi keamanan)",
                "Browser web (Chrome, Firefox, atau Edge)",
                "Extension untuk export cookies",
                "Untuk pengguna non-Docker: Deno JavaScript runtime (diperlukan untuk yt-dlp signature solving)"
            ]
        },
        steps: {
            title: "Panduan Langkah demi Langkah",
            createAccount: {
                title: "Langkah 1: Buat Akun Tumbal",
                steps: [
                    "Buka halaman Pembuatan Akun",
                    "Buat akun baru khusus untuk bot ini",
                    "Penting: JANGAN gunakan akun pribadi/utama"
                ]
            },
            login: {
                title: "Langkah 2: Login ke Platform",
                steps: [
                    "Buka browser Anda",
                    "Buka platform (YouTube)",
                    "Login dengan akun tumbal Anda",
                    "Terima syarat & ketentuan jika diminta"
                ]
            },
            extension: {
                title: "Langkah 3: Install Extension Export Cookies",
                chrome: "Untuk Chrome/Edge: Install 'Get cookies.txt LOCALLY' atau 'cookies.txt'",
                firefox: "Untuk Firefox: Install 'cookies.txt'"
            },
            exportCookies: {
                title: "Langkah 4: Export Cookies",
                steps: [
                    "Pastikan Anda sedang di website platform",
                    "Klik ikon extension cookies di toolbar browser",
                    "Pilih 'Export' atau 'Export cookies for this site'",
                    "Simpan file sebagai cookies.txt"
                ]
            },
            upload: {
                title: "Langkah 5: Upload ke Server",
                steps: [
                    "Buat folder cache di direktori Rawon jika belum ada",
                    "Upload file cookies.txt ke folder cache",
                    "Path-nya harus: ./cache/cookies.txt"
                ]
            },
            configure: {
                title: "Langkah 6: Konfigurasi Environment Variable",
                instruction: "Tambahkan ini ke file .env Anda:"
            },
            restart: {
                title: "Langkah 7: Restart Rawon",
                instruction: "Restart bot Anda untuk menerapkan perubahan."
            }
        },
        docker: {
            title: "Setup Docker",
            description:
                "Jika menggunakan Docker, letakkan file cookies.txt di samping file docker-compose.yaml dan tambahkan volume mount."
        },
        duration: {
            title: "Berapa Lama Cookies Bertahan?",
            description:
                "Kabar baik: Cookies platform TIDAK kadaluarsa secara berkala. Mereka akan tetap valid selama:",
            conditions: [
                "Anda tidak logout dari platform di browser",
                "Anda tidak ganti password akun",
                "Anda tidak revoke session dari pengaturan akun",
                "Platform tidak mendeteksi aktivitas mencurigakan"
            ],
            tips: "Dalam praktiknya, cookies bisa bertahan berbulan-bulan bahkan bertahun-tahun jika mengikuti best practice."
        },
        security: {
            title: "Catatan Keamanan",
            warnings: [
                "Jangan pernah bagikan file cookies ke siapapun",
                "Gunakan akun tumbal, BUKAN akun utama",
                "File cookies berisi data autentikasi sensitif",
                "Tambahkan cookies.txt ke .gitignore untuk mencegah commit tidak sengaja"
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
        language: "Bahasa"
    }
};
