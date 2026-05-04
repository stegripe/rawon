import type { Translations } from "./en";

export const tr: Translations = {
    nav: {
        home: "Ana Sayfa",
        docs: "Belgeler",
        gettingStarted: "Başlangıç",
        configuration: "Yapılandırma",
        cookiesSetup: "Çerez kurulumu",
        disclaimers: "Yasal uyarılar",
        permissionCalculator: "İzin hesaplayıcı",
        links: "Bağlantılar"
    },

    home: {
        title: "Rawon",
        description:
            "Üretim ortamınız için tasarlanmış, kullanımı kolay ve kod gerektirmeyen basit ve güçlü bir Discord müzik (çoklu) botu.",
        invite: "Davet et",
        inviteBot: "Botu davet et",
        support: "Destek",
        viewDocs: "Belgeleri görüntüle"
    },

    gettingStarted: {
        title: "Başlangıç",
        subtitle:
            "Adım adım kılavuzla Rawon’u dakikalar içinde çalıştırın.",
        features: {
            title: "✨ Özellikler",
            items: [
                "🚀 Üretime hazır, kod yazmaya gerek yok",
                "📺 Kesintisiz müzik için istek kanalı",
                "🎶 YouTube, Spotify, SoundCloud ve doğrudan dosya desteği",
                "🤖 Farklı ses kanalları için birden fazla bot örneği",
                "⚡ Daha akıcı oynatma için akıllı ses önbelleği",
                "🍪 Çerez yönetimi için Puppeteer ile yerleşik Google girişi"
            ]
        },
        requirements: {
            title: "📋 Gereksinimler",
            nodeVersion: "**Node.js** sürümü `20.0.0` veya üzeri",
            discordToken:
                "**Discord bot token** ([Discord Developer Portal](https://discord.com/developers/applications) üzerinden alın)",
            optional:
                "**İsteğe bağlı:** Standart (Docker dışı) kurulumlarda ses işleme için [FFmpeg](https://ffmpeg.org/) — Docker görüntüleri FFmpeg içerir"
        },
        standardSetup: {
            title: "💻 Standart kurulum (Node.js)",
            steps: [
                "Yukarıdaki gereksinimleri indirip kurun",
                "Bu depoyu klonlayın veya indirin",
                "`.env.example` dosyasını `.env` olarak kopyalayıp gerekli değerleri doldurun (en azından: `DISCORD_TOKEN`)",
                "Bağımlılıkları kurun: `pnpm install`",
                "Projeyi derleyin: `pnpm run build`",
                "Botu başlatın: `pnpm start`"
            ],
            requestChannel:
                "(İsteğe bağlı) Bot çevrim içindeyken ayrı bir müzik kanalı kurun:"
        },
        dockerSetup: {
            title: "🐳 Docker kurulumu (önerilen)",
            composeTitle: "Docker Compose ile",
            composeSteps: [
                "Yapılandırmanızla bir `.env` dosyası oluşturun (`.env.example` dosyasından kopyalayın)",
                "(İsteğe bağlı) Ek ayarlar için `dev.env.example` dosyasından `dev.env` oluşturun",
                "Bir `docker-compose.yaml` dosyası oluşturun (aşağıdaki örneğe bakın)",
                "Botu başlatın: `docker compose up -d`",
                "Günlükleri görüntüleyin: `docker logs -f rawon-bot`"
            ],
            runTitle: "docker run ile",
            volumeInfo: {
                title: "📁 Birim bilgisi",
                description: "`/app/cache` birimi şunları saklar:",
                items: [
                    "ses akışı için `yt-dlp` ikili dosyası",
                    "kalıcı ayarlar için `data.*` (istek kanalları, oynatıcı durumları)",
                    "önbelleğe alınmış ses dosyaları (ses önbelleği etkinse)",
                    "Google girişinden çerez dosyası ve profil verileri ([Çerez kurulumu](/docs/cookies-setup) bölümüne bakın)"
                ]
            },
            portInfo: {
                title: "🔌 Port bilgisi",
                description:
                    "`DEVTOOLS_PORT` (varsayılan: `3000`) Chrome DevTools uzaktan hata ayıklama vekil sunucusu içindir. Başka bir makineden bağlandığınızda `!login start` için gereklidir. Farklı bir port için `dev.env` içinde `DEVTOOLS_PORT` ayarlayın ve Docker Compose veya `docker run` ile eşleyin."
            }
        },

        cookiesQuickStart: {
            title: "🍪 Çerezler: barındırma için hızlı çözüm",
            description:
                "Bulut barındırıcılarda (AWS, GCP, Azure, Railway vb.) **«Sign in to confirm you're not a bot»** görebilirsiniz. Yerleşik giriş akışını kullanın:",
            steps: [
                "Discord’da `!login start` çalıştırın",
                "Botun gönderdiği DevTools URL’sini açıp uzak tarayıcıda Google girişini tamamlayın",
                "Çerezleri `!login status` ile kontrol edin veya `!login logout` ardından `!login start` ile yenileyin"
            ],
            tip: "💡 Ana hesabınız yerine **atılabilir bir Google hesabı** kullanın. Ayrıntılar için tam [Çerez kurulumu](/docs/cookies-setup) kılavuzuna bakın."
        }
    },

    configuration: {
        title: "Yapılandırma",
        subtitle:
            "Rawon yapılandırma dosyaları ile ortam değişkenlerinin nasıl bir araya geldiği.",
        overview: {
            title: "📄 Yapılandırma dosyaları",
            intro: "Ayarlar kasıtlı olarak birkaç dosyaya bölünmüştür:",
            items: [
                "**`.env.example`** — Temel ayarlar (Discord/Spotify token’ları, önek, ID’ler, aktiviteler vb.). **`.env`** olarak kopyalayıp doldurun.",
                "**`dev.env.example`** — İsteğe bağlı geliştirici ayarları (önek/slash anahtarları, parçalama, `!login` için DevTools portu, Chromium yolu, hata ayıklama modu). Gerekirse **`dev.env`** olarak kopyalayın.",
                "**`setup` komutu** — Bot ayarları (gömme rengi, evet/hayır emojisi, splash, alternatif önek, varsayılan ses, seçim türü, ses önbelleği) yalnızca geliştiricilerin **`setup` komutu** ile yönetilir ve veritabanında saklanır. Mevcut ayarlar için `<prefix>setup view` kullanın."
            ]
        },
        essential: {
            title: "⚡ Temel ayarlar (`.env`)",
            description:
                "`.env.example` değerleri. Çalıştırmak için yalnızca **`DISCORD_TOKEN`** zorunludur; Spotify, şarkı sözü token’ı ve diğerlerini ihtiyaca göre ekleyin.",
            discordToken: {
                name: "DISCORD_TOKEN",
                description:
                    "[Discord Developer Portal](https://discord.com/developers/applications) üzerinden Discord bot token’ınız. Çoklu bot için token’ları **virgülle ayırın**.",
                required: true
            },
            spotify: {
                name: "Spotify API",
                description:
                    "`SPOTIFY_CLIENT_ID` ve `SPOTIFY_CLIENT_SECRET` değerlerini [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard) adresinden ayarlayın. **Spotify desteği için gereklidir.**",
                required: false
            },
            stegripeLyrics: {
                name: "STEGRIPE_API_LYRICS_TOKEN",
                description:
                    "Doğru **lyrics** komutu çıktısı için gereklidir. Erişim için geliştiriciyle iletişime geçin.",
                required: false
            },
            mainPrefix: {
                name: "MAIN_PREFIX",
                description:
                    "Ana komut öneki. Örnek: `!` kullanıyorsanız müzik için `!play` yazarsınız",
                default: "!"
            },
            mainServer: {
                name: "MAIN_SERVER",
                description:
                    "Eğik çizgi komutlarını daha hızlı kaydetmek için ana sunucu ID’si. Boş bırakırsanız komutlar genel olur (güncellenmesi bir saate kadar sürebilir)",
                required: false
            },
            devs: {
                name: "DEVS",
                description:
                    "Bot geliştirici kullanıcı ID’leri (virgülle ayrılmış). Geliştiriciler `setup` ve `login` araçları dahil özel komutlara erişir.",
                required: false
            },
            locale: {
                name: "LOCALE",
                description: "Bot yanıtları için dil",
                default: "en-US",
                options:
                    "en-US, es-ES, fr-FR, id-ID, zh-CN, zh-TW, uk-UA, vi-VN, pt-BR, ru-RU, ja-JP, tr-TR, ko-KR"
            },
            activityTypes: {
                name: "ACTIVITY_TYPES",
                description:
                    "`ACTIVITIES` içindeki her giriş için etkinlik türleri (virgülle ayrılmış). Sayı, etkinlik sayısıyla eşleşmelidir",
                options: "PLAYING, WATCHING, LISTENING, COMPETING",
                default: "PLAYING"
            },
            activities: {
                name: "ACTIVITIES",
                description:
                    "Bot adının altındaki durum satırları (virgülle ayrılmış). Yer tutucular: `{prefix}`, `{userCount}`, `{textChannelCount}`, `{serverCount}`, `{playingCount}`, `{username}`",
                required: false
            }
        },
        multiBot: {
            title: "🔄 Çoklu bot modu",
            description:
                "Çoklu bot modu uyarlanır — **ek yapılandırma gerekmez**. Bir token tek bot çalıştırır; **virgülle ayrılmış** token’lar çoklu botu otomatik etkinleştirir.",
            example: "Örnek:",
            exampleCode: 'DISCORD_TOKEN="token1, token2, token3"',
            features: [
                "**İlk** token genel komutlar için birincil botur",
                "Her bot, **kendi** ses kanalındaki kullanıcılara müzik sunar",
                "Birincil bot sunucuda yoksa sıradaki uygun bot devralabilir",
                "Her botun **kendi** Discord uygulaması olmalıdır"
            ]
        },
        developer: {
            title: "🛠️ Geliştirici ayarları (`dev.env`)",
            description:
                "`dev.env.example` kaynaklıdır. **İsteğe bağlı** — yalnızca ne yaptığınızı biliyorsanız değiştirin.",
            enablePrefix: {
                name: "ENABLE_PREFIX",
                description: "Önekli komutları etkinleştirin veya devre dışı bırakın (ör. `!play`)",
                default: "yes",
                options: "yes, no"
            },
            enableSlash: {
                name: "ENABLE_SLASH_COMMAND",
                description: "Eğik çizgi komutlarını etkinleştirin veya devre dışı bırakın (ör. `/play`)",
                default: "yes",
                options: "yes, no"
            },
            enableSharding: {
                name: "ENABLE_SHARDING",
                description: "Büyük botlar için parçalama (**yalnızca tek token modu**)",
                default: "no",
                options: "yes, no"
            },
            devtoolsPort: {
                name: "DEVTOOLS_PORT",
                description:
                    "Chrome DevTools uzaktan hata ayıklama vekil sunucusu portu. DevTools başka bir makineden açıldığında `!login start` tarafından kullanılır. Varsayılan: `3000`",
                default: "3000"
            },
            chromiumPath: {
                name: "CHROMIUM_PATH",
                description:
                    "Google girişi için Chrome/Chromium yolu. Otomatik algılama için boş bırakın",
                required: false
            },
            nodeEnv: {
                name: "NODE_ENV",
                description: "Çalışma ortamı modu",
                default: "production",
                options: "production, development"
            },
            debugMode: {
                name: "DEBUG_MODE",
                description: "Konsola ayrıntılı hata ayıklama günlüğü",
                default: "no",
                options: "yes, no"
            }
        }
    },

    cookiesSetup: {
        title: "Çerez kurulumu",
        subtitle:
            "Bulut barındırmasında «Sign in to confirm you're not a bot» sorununu giderin. Önerilen: yerleşik **`!login`** komutu.",
        why: {
            title: "Buna neden ihtiyacım var?",
            description:
                "Rawon’u OVHcloud, AWS, GCP, Azure veya diğer bulut/VPS sağlayıcılarında barındırıyorsanız şunu görebilirsiniz:",
            error: "Sign in to confirm you're not a bot",
            explanation:
                "Platform genelde veri merkezi IP’lerinden gelen istekleri engeller. **Google hesabı** ile kimlik doğrulaması, Rawon’un geçerli çerezler alıp bu kısıtlamayı aşmasını sağlar."
        },
        loginMethod: {
            title: "Önerilen: `!login` komutu",
            description:
                "Çerezleri kurmanın en kolay yolu yerleşik **`!login`** akışıdır (Puppeteer ile gerçek tarayıcı):",
            benefits: [
                "✅ Google girişi için gerçek tarayıcı açılır",
                "✅ Çerezler dışa aktarılır ve otomatik kaydedilir",
                "✅ Girişten sonra tarayıcı kapanır — arka planda kalıntı yok",
                "✅ Yeniden başlatmalarda kalır (Docker birimi veya `cache/` klasörü)"
            ]
        },
        commandUsage: {
            title: "Komut kullanımı"
        },
        quickStart: {
            title: "Hızlı başlangıç",
            steps: [
                "Discord’da `!login start` çalıştırın",
                "Botun gönderdiği **DevTools URL**’sini yerel tarayıcınızda açın",
                "**Uzak** tarayıcı oturumunda Google girişini tamamlayın",
                "**Atılabilir bir Google hesabı** ile oturum açın (ana hesabınızla değil)",
                "Giriş bitince bot çerezleri kaydeder ve tarayıcıyı kapatır",
                "Bitti — sonraki istekler kayıtlı oturumu kullanır"
            ]
        },
        staleCookies: {
            title: "Bot kontrolleri yeniden olursa",
            description: "Sağlayıcı çerezleri yenilediğinde çerezler bayatlayabilir. O zaman:",
            steps: [
                "Eski çerezleri ve profil verilerini temizlemek için `!login logout` çalıştırın",
                "Yeni oturum için `!login start` çalıştırıp yeniden giriş yapın"
            ]
        },
        prerequisites: {
            title: "Önkoşullar",
            items: [
                "**İkincil / atılabilir bir Google hesabı** (ana hesabınızı **kullanmayın**)",
                "**Docker dışı:** Ana bilgisayarda Chrome veya Chromium kurulu",
                "**Docker:** Chromium dahildir; `!login`’e uzaktan bağlanıyorsanız `DEVTOOLS_PORT` eşleyin ([Yapılandırma](/docs/configuration))"
            ]
        },
        docker: {
            title: "Docker",
            persistence:
                "Çerez ve profil verileri konteyner yeniden başlatmalarında **`rawon:/app/cache`** adlı birimde kalır.",
            chromium:
                "Görüntü Chromium ile gelir, bu nedenle görüntü tarafında ek kurulum olmadan **`!login start`** çalışır."
        },
        envVars: {
            title: "Ortam değişkenleri (`dev.env`)",
            intro: "İsteğe bağlı ince ayar (`dev.env.example` bölümüne bakın):",
            dockerComposeHint:
                "Docker için `docker-compose.yaml` içindeki `ports` alanının DevTools portunu yayınladığından emin olun, örn.:"
        },
        duration: {
            title: "Çerezler ne kadar dayanır?",
            description:
                "Sağlayıcılar oturumları döndürdüğü için zamanla bayatlayabilirler. Genelde şunlar geçerliyken geçerlidirler:",
            conditions: [
                "Oturumu geçersiz kılan bir şekilde çıkış yapmazsınız",
                "Hesap parolasını değiştirmezsiniz",
                "Hesap güvenlik ayarlarında oturumu iptal etmezsiniz",
                "Sağlayıcı şüpheli etkinlik işaretlemez"
            ],
            footer: "Çerezlerin süresi dolduğunda `!login logout` ardından yeniden `!login start` çalıştırın."
        },
        troubleshooting: {
            title: "Sorun giderme",
            stillErrors: {
                title: "Hâlâ «Sign in to confirm you're not a bot» mı görüyorsunuz?",
                steps: [
                    "Giriş ve çerez durumunu incelemek için `!login status` kullanın",
                    "Yeni oturum için `!login logout` ardından `!login start` çalıştırın"
                ]
            },
            browserWontStart: {
                title: "Tarayıcı başlamıyor mu?",
                steps: [
                    "Ayrıntılı hata için `!login status` kontrol edin",
                    "Fiziksel makinede Chrome/Chromium kurun veya `dev.env` içinde `CHROMIUM_PATH` ayarlayın",
                    "Docker’da resmi görüntü ile Chromium genelde hazır çalışır"
                ]
            },
            accountSuspended: {
                title: "Hesap askıya alındı mı?",
                steps: [
                    "Yeni bir atılabilir Google hesabı oluşturun",
                    "Eski oturumu silmek için `!login logout` çalıştırın",
                    "`!login start` çalıştırıp yeni hesapla giriş yapın"
                ]
            }
        },
        manualAlternative: {
            title: "Alternatif: el ile çerez dosyası",
            description:
                "Aşağıdaki yola **Netscape biçiminde** bir çerez dosyası koyabilirsiniz. Varsa bot kullanır; yine de daha basit akış için **`!login` önerilir**.",
            pathLabel: "Yol"
        },
        security: {
            title: "Güvenlik notları",
            warningLabel: "WARNING",
            warnings: [
                "**Atılabilir** bir Google hesabı kullanın — birincil hesabınızı **değil**",
                "DevTools URL’si uzak tarayıcı oturumuna erişim verir — **herkese açık paylaşmayın**",
                "Çerez dosyaları **hassas** kimlik doğrulama verileri içerir"
            ]
        }
    },

    disclaimers: {
        title: "Yasal uyarılar",
        subtitle: "Bu botu kullanmadan önce dikkatle okuyun.",
        warningBanner: "Önemli hukuki bilgi",
        copyright: {
            title: "Telif hakkı, DMCA ve fikri mülkiyet",
            items: [
                "**Sahiplik:** Bot tarafından kullanılan, çalınan veya gösterilen fikri mülkiyetler **bizim**, bakımcıların veya katkıda bulunanların **mülkiyetinde değildir**. Bot komutlarında kullanılan ses, video ve görüntü dosyaları dahil ancak bunlarla sınırlı değildir.",
                "**Barındırma sağlayıcı politikaları:** Bazı barındırıcılar DMCA korumalı içeriği barındırmayı veya dağıtmayı yasaklar. Telifli müzik/video çalan Discord müzik botları buna dahildir.\n- **Bu tür platformlara kendi riskinizle dağıtın**",
                "**Kullanıcı sorumluluğu:** Bu botu nasıl kullandığınızdan ve üzerinden hangi içeriğin çalındığından siz sorumlusunuz."
            ]
        },
        code: {
            title: "Kod değişiklikleri",
            items: [
                "**Lisans:** Bu proje [Creative Commons Atıf-GayriTicari-Türetilemez 4.0 Uluslararası (CC BY-NC-ND 4.0)](https://creativecommons.org/licenses/by-nc-nd/4.0/) ile lisanslanmıştır. Tam yasal metin depodaki [`LICENSE`](https://github.com/stegripe/rawon/blob/main/LICENSE) dosyasındadır.",
                "**Garanti yok:** Lisansda belirtildiği gibi, bu kodun kullanımından kaynaklanan zarar veya kayıplardan **sorumlu değiliz**. Atıf, ticari olmayan kullanım ve uyarlanmış materyali paylaşma kısıtlarına uygun hareket edin.",
                "**Atıf:** Bu projeyi kendi özgün çalışmanız gibi göstermeyin. Her zaman özgün projeye uygun atıf sağlayın."
            ]
        },
        licenseFooterPrefix: "Tam lisans metni için depoya bakın",
        licenseLinkLabel: "LICENSE (CC BY-NC-ND 4.0)"
    },

    permissionCalculator: {
        title: "İzin hesaplayıcı",
        clientId: "İstemci ID",
        scope: "Scope",
        redirectUri: "Redirect URI",
        permissions: "İzinler",
        permissionsNote:
            "Renkli olan, sunucu 2FA gerektiriyorsa OAuth kullanıcısının hesabında 2FA etkin olmalı anlamına gelir",
        general: "Genel",
        voice: "Ses",
        text: "Metin",
        result: "Sonuç",
        resultNote: "Botu sunucunuza eklemek için kullanabileceğiniz bağlantı budur"
    },

    common: {
        back: "Geri",
        copy: "Kopyala",
        default: "Varsayılan",
        required: "Gerekli",
        optional: "İsteğe bağlı",
        example: "Örnek",
        learnMore: "Daha fazla bilgi",

        language: "Dil",
        tip: "İpucu",
        warning: "Uyarı",
        note: "Not"
    }
};
