export const tr = {
    // Navigation
    nav: {
        home: "Ana Sayfa",
        docs: "Belgeler",
        gettingStarted: "Başlarken",
        configuration: "Yapılandırma",
        cookiesSetup: "Çerez Kurulumu",
        disclaimers: "Yasal Uyarılar",
        permissionCalculator: "İzin Hesaplayıcı",
        links: "Bağlantılar"
    },

    // Home page
    home: {
        title: "Rawon",
        description:
            "Üretim ihtiyaçlarınızı karşılamak için tasarlanmış basit ama güçlü bir Discord müzik botu.",
        invite: "Davet Et",
        support: "Destek",
        viewDocs: "Belgeleri Gör"
    },

    // Getting Started page
    gettingStarted: {
        title: "Başlarken",
        subtitle: "Adım adım kılavuzumuzla Rawon'u birkaç dakika içinde çalıştırın.",
        features: {
            title: "Özellikler",
            items: [
                "Etkileşim desteği (slash komutları ve butonlar)",
                "Kesintisiz müzik deneyimi için istek kanalı özelliği",
                "Üretime hazır, kodlama gerektirmez",
                "Yapılandırılabilir ve kullanımı kolay",
                "Temel müzik komutları (play, pause, skip, queue vb.)",
                "Çoklu dil desteği"
            ]
        },
        requirements: {
            title: "Gereksinimler",
            nodeVersion: "Node.js sürüm 22.12.0 veya üstü",
            discordToken: "Discord Bot Token (Discord Developer Portal'dan alın)",
            optional: "İsteğe bağlı: Spotify desteği için Spotify API kimlik bilgileri"
        },
        standardSetup: {
            title: "Standart Kurulum (Node.js)",
            steps: [
                "Node.js sürüm 22.12.0 veya üstünü indirin ve yükleyin",
                "Bu depoyu klonlayın veya indirin",
                ".env_example'ı .env'ye kopyalayın ve gerekli değerleri doldurun (minimum: DISCORD_TOKEN)",
                "Bağımlılıkları yükleyin: pnpm install",
                "Projeyi derleyin: pnpm run build",
                "Botu başlatın: pnpm start"
            ],
            requestChannel: "(İsteğe bağlı) Bot çevrimiçi olduktan sonra, özel bir müzik kanalı ayarlayın:"
        },
        dockerSetup: {
            title: "Docker Kurulumu (Önerilen)",
            composeTitle: "Docker Compose Kullanarak",
            composeSteps: [
                "Yapılandırmanızla bir .env dosyası oluşturun (.env_example'dan kopyalayın)",
                "Bir docker-compose.yaml dosyası oluşturun (aşağıdaki örneğe bakın)",
                "Botu başlatın: docker compose up -d",
                "Günlükleri görüntüleyin: docker logs -f rawon-bot"
            ],
            runTitle: "Docker Run Kullanarak",
            volumeInfo: {
                title: "Birim Bilgisi",
                description: "/app/cache birimi şunları saklar:",
                items: [
                    "Ses akışı için yt-dlp ikili dosyası",
                    "Kalıcı ayarlar için data.json (istek kanalları, oynatıcı durumları)",
                    "Önbelleğe alınmış ses dosyaları (ses önbelleği etkinse)"
                ]
            }
        },
        railwaySetup: {
            title: "Railway Dağıtımı",
            description:
                "Railway aylık 5$ ücretsiz kredi sağlar. Kullanım 5$'ın altında kaldığı sürece botunuz 7/24 çevrimiçi kalacaktır.",
            warning: "ÖNEMLİ: Railway'e dağıtmadan önce Yasal Uyarıları okuyun."
        },
        cookiesQuickStart: {
            title: "🍪 Hızlı Başlangıç: Çerez Kurulumu",
            description:
                "Bulut sağlayıcılarında (AWS, GCP, Azure, Railway vb.) barındırıyorsanız, \"Sign in to confirm you're not a bot\" hataları alabilirsiniz. Çerez komutuyla kolayca düzeltin:",
            steps: [
                "Tarayıcınızdan çerezleri dışa aktarın (Çerez Kurulumu kılavuzuna bakın)",
                "Discord'da şunu yazın: !cookies add 1",
                "cookies.txt dosyanızı mesaja ekleyin",
                "Tamam! Çerez hemen etkili olur"
            ],
            tip: "💡 Yedeklilik için birden fazla çerez ekleyebilirsiniz. Biri başarısız olduğunda, Rawon otomatik olarak bir sonrakine geçer!"
        }
    },

    // Configuration page
    configuration: {
        title: "Yapılandırma",
        subtitle: "Bu ayarlarla Rawon'u ihtiyaçlarınıza göre yapılandırın.",
        essential: {
            title: "Temel Ayarlar",
            description: "Bunlar botu çalıştırmak için gereken minimum ayarlardır.",
            discordToken: {
                name: "DISCORD_TOKEN",
                description: "Discord Developer Portal'dan Discord bot tokenınız",
                required: true
            },
            mainPrefix: {
                name: "MAIN_PREFIX",
                description: "Ana komut öneki",
                default: "!"
            },
            mainServer: {
                name: "MAIN_SERVER",
                description: "Slash komut kaydı için ana sunucu ID'niz",
                required: false
            },
            locale: {
                name: "LOCALE",
                description: "Bot dili",
                default: "en-US",
                options: "en-US, es-ES, fr-FR, id-ID, zh-CN, zh-TW, uk-UA, vi-VN, pt-BR, ru-RU, ja-JP, tr-TR"
            },
            spotify: {
                name: "Spotify API",
                description: "Spotify desteği için SPOTIFY_CLIENT_ID ve SPOTIFY_CLIENT_SECRET'ı ayarlayın"
            }
        },
        optional: {
            title: "İsteğe Bağlı Ayarlar",
            description: "Rawon'un davranışını ve görünümünü özelleştirin.",
            altPrefix: {
                name: "ALT_PREFIX",
                description: "Alternatif önekler (virgülle ayrılmış). @bot bahsi için {mention} kullanın",
                default: "{mention}"
            },
            activities: {
                name: "ACTIVITIES",
                description:
                    "Bot durum aktiviteleri (virgülle ayrılmış). Formatlar: {prefix}, {userCount}, {textChannelCount}, {serverCount}, {playingCount}, {username}"
            },
            activityTypes: {
                name: "ACTIVITY_TYPES",
                description: "Her aktivite için aktivite türleri (virgülle ayrılmış)",
                options: "PLAYING, WATCHING, LISTENING, COMPETING"
            },
            embedColor: {
                name: "EMBED_COLOR",
                description: "Hex cinsinden embed rengi (# olmadan)",
                default: "22C9FF"
            },
            emojis: {
                name: "Emojiler",
                description: "Başarı (YES_EMOJI) ve hata (NO_EMOJI) emojilerini özelleştirin",
                defaults: "✅ / ❌"
            },
            musicSelection: {
                name: "MUSIC_SELECTION_TYPE",
                description: "Müzik seçim stili",
                options: "message, selectmenu",
                default: "message"
            },
            audioCache: {
                name: "ENABLE_AUDIO_CACHE",
                description: "[DENEYSEL] Daha hızlı tekrar oynatma için indirilen sesi önbelleğe al",
                default: "no"
            },
            requestChannelSplash: {
                name: "REQUEST_CHANNEL_SPLASH",
                description: "İstek kanalı oynatıcı embed'i için özel resim URL'si",
                default: "https://cdn.stegripe.org/images/rawon_splash.png"
            }
        },
        developer: {
            title: "🛠️ Geliştirici Ayarları",
            description: "Bot geliştiricileri için gelişmiş ayarlar. Sadece ne yaptığınızı biliyorsanız kullanın!",
            devs: {
                name: "DEVS",
                description: "Bot geliştirici ID'leri (virgülle ayrılmış). Geliştiriciler özel komutlara erişebilir"
            },
            enablePrefix: {
                name: "ENABLE_PREFIX",
                description: "Önek komutlarını etkinleştir/devre dışı bırak (!play gibi). Sadece slash komutları istiyorsanız kullanışlı",
                default: "yes",
                options: "yes, no"
            },
            enableSlash: {
                name: "ENABLE_SLASH_COMMAND",
                description: "Slash komutlarını etkinleştir/devre dışı bırak (/play gibi). Sadece önek komutları istiyorsanız kullanışlı",
                default: "yes",
                options: "yes, no"
            },
            debugMode: {
                name: "DEBUG_MODE",
                description: "Sorun giderme için hata ayıklama günlüğünü etkinleştir. Konsolda ayrıntılı günlükler gösterir",
                default: "no",
                options: "yes, no"
            }
        }
    },

    // Cookies Setup page
    cookiesSetup: {
        title: "Çerez Kurulumu",
        subtitle: "Barındırma sağlayıcılarındaki \"Sign in to confirm you're not a bot\" hatalarını düzeltin.",
        why: {
            title: "Buna neden ihtiyacım var?",
            description:
                "Rawon'u OVHcloud, AWS, GCP, Azure veya diğer barındırma hizmetlerinde barındırıyorsanız, şu hatayla karşılaşabilirsiniz:",
            error: "Sign in to confirm you're not a bot",
            explanation:
                "Bu, platformun veri merkezi IP adreslerinden gelen istekleri engellemesi nedeniyle olur. Oturum açmış bir hesaptan çerezler kullanarak bu kısıtlamayı atlayabilirsiniz."
        },

        quickMethod: {
            title: "🚀 Kolay Yöntem: Çerez Komutunu Kullanma (Önerilen)",
            description: "Çerezleri yönetmenin en kolay yolu - dosya düzenleme gerekmez!",
            benefits: [
                "✅ Anında çalışır - yeniden başlatma gerekmez",
                "✅ Otomatik rotasyonlu birden fazla çerezi destekler",
                "✅ Bir çerez başarısız olduğunda, bot otomatik olarak sonrakini kullanır",
                "✅ Çerezler bot yeniden başlatmalarından sonra kalıcıdır"
            ],
            commands: {
                title: "📝 Mevcut Komutlar",

            },
            quickStart: {
                title: "⚡ Hızlı Başlangıç (3 adım)",
                steps: [
                    "Tarayıcınızdan çerezleri dışa aktarın (aşağıdaki kılavuza bakın)",
                    "Discord'da şunu yazın: `!cookies add 1` ve cookies.txt dosyanızı ekleyin",
                    "Tamam! Çerez artık aktif"
                ]
            },
            multiCookie: {
                title: "💡 Profesyonel İpucu: Birden Fazla Çerez Ekleyin",
                description: "Daha iyi güvenilirlik için farklı hesaplardan çerez ekleyin:"
            }
        },
        prerequisites: {
            title: "Ön Koşullar",
            items: [
                "İkincil/tek kullanımlık hesap (Güvenlik nedeniyle ana hesabınızı KULLANMAYIN)",
                "Bir web tarayıcısı (Chrome, Firefox veya Edge)",
                "Bir çerez dışa aktarma uzantısı",
                "Docker olmayan kullanıcılar için: Deno JavaScript çalışma zamanı (yt-dlp imza çözümü için gerekli)"
            ]
        },
        steps: {
            title: "📖 Çerezleri Nasıl Dışa Aktarılır",
            createAccount: {
                title: "Adım 1: Tek Kullanımlık Hesap Oluşturun",
                steps: [
                    "[Hesap oluşturma sayfasına](https://accounts.google.com/signup) gidin",
                    "Bu bot için özel olarak yeni bir hesap oluşturun",
                    "⚠️ Önemli: Kişisel/ana hesabınızı ASLA KULLANMAYIN!"
                ]
            },
            login: {
                title: "Adım 2: Video Platformuna Giriş Yapın",
                steps: [
                    "Tarayıcınızı açın",
                    "[Video platformuna](https://youtube.com) gidin",
                    "Tek kullanımlık hesabınızla oturum açın",
                    "İstenirse şartları kabul edin"
                ]
            },
            extension: {
                title: "Adım 3: Çerez Dışa Aktarma Uzantısını Yükleyin",
                chrome: "Chrome/Edge için: Chrome Web Store'dan [**Get cookies.txt LOCALLY**](https://chromewebstore.google.com/detail/get-cookiestxt-locally/cclelndahbckbenkjhflpdbgdldlbecc) (önerilen) yükleyin",
                firefox: "Firefox için: Firefox Add-ons'dan [**cookies.txt**](https://addons.mozilla.org/en-US/firefox/addon/cookies-txt/) yükleyin"
            },
            exportCookies: {
                title: "Adım 4: Çerezleri Dışa Aktarın",
                steps: [
                    "[Video platformu web sitesinde](https://youtube.com) olduğunuzdan emin olun",
                    "Tarayıcı araç çubuğundaki çerez uzantısı simgesine tıklayın",
                    "**Export** veya **Export cookies for this site** seçin",
                    "Dosyayı `cookies.txt` olarak kaydedin"
                ]
            },
            upload: {
                title: "Adım 5: Rawon'a Ekleyin",
                steps: [
                    "Rawon'un mesajlarınızı görebildiği herhangi bir kanala gidin",
                    "`!cookies add 1` yazın",
                    "cookies.txt dosyasını mesajınıza ekleyin ve gönderin",
                    "Rawon çerezin eklendiğini onaylayacak!"
                ]
            }
        },
        troubleshooting: {
            title: "🔧 Sorun Giderme",
            stillGettingErrors: {
                title: "Hâlâ \"Sign in to confirm you're not a bot\" hataları mı alıyorsunuz?",
                steps: [
                    "Çerez durumunu kontrol etmek için `!cookies list` kullanın",
                    "Bir çerez **Failed** gösteriyorsa, yeniden denemek için `!cookies reset` deneyin",
                    "Yedeklilik için farklı hesaplardan daha fazla çerez ekleyin"
                ]
            },
            allCookiesFailed: {
                title: "Tüm çerezler başarısız mı oldu?",
                steps: [
                    "Yeni tek kullanımlık hesaplar oluşturun",
                    "Yeni çerezler dışa aktarın",
                    "!cookies add <numara> ile ekleyin"
                ]
            },
            accountSuspended: {
                title: "Hesap askıya mı alındı?",
                steps: [
                    "Bu yoğun kullanımla olabilir",
                    "Sadece yeni bir tek kullanımlık hesap oluşturun",
                    "Yeni çerezler dışa aktarın ve ekleyin"
                ]
            }
        },
        duration: {
            title: "Çerezler Ne Kadar Sürer?",
            description:
                "İyi haber: Platform çerezleri düzenli olarak sona ERMEZ. Şu sürece geçerli kalacaklar:",
            conditions: [
                "Tarayıcınızda platformdan çıkış yapmadığınız sürece",
                "Hesap şifrenizi değiştirmediğiniz sürece",
                "Hesap ayarlarından oturumu iptal etmediğiniz sürece",
                "Platform şüpheli aktivite tespit etmediği sürece"
            ],
            tips: "Pratikte, en iyi uygulamaları takip ederseniz çerezler aylar hatta yıllar sürebilir."
        },
        security: {
            title: "🔒 Güvenlik Notları",
            warnings: [
                "⚠️ Çerez dosyanızı asla kimseyle paylaşmayın",
                "⚠️ Ana hesabınızı DEĞİL, tek kullanımlık hesap kullanın",
                "⚠️ Çerez dosyası hassas kimlik doğrulama verilerini içerir"
            ]
        }
    },

    // Disclaimers page
    disclaimers: {
        title: "Yasal Uyarılar",
        subtitle: "Bu botu kullanmadan önce lütfen dikkatlice okuyun.",
        warningBanner: "Önemli yasal bilgiler",
        copyright: {
            title: "Telif Hakkı, DMCA ve Fikri Mülkiyet",
            items: [
                "Mülkiyet: Bot tarafından kullanılan, çalınan veya görüntülenen herhangi bir fikri mülkiyet bize, bakımcılara veya katkıda bulunanlara ait değildir. Bu, botun komutlarında kullanılan ses, video ve görüntü dosyalarını içerir ancak bunlarla sınırlı değildir.",
                "Barındırma Sağlayıcı Politikaları: Bazı barındırma sağlayıcıları (Railway gibi) DMCA korumalı içeriği barındırmayı veya dağıtmayı yasaklar. Bu, telif hakkıyla korunan müzik/video çalan Discord müzik botlarını içerir. Bu tür platformlara dağıtım kendi sorumluluğunuzdadır.",
                "Kullanıcı Sorumluluğu: Bu botu nasıl kullandığınızdan ve onun aracılığıyla hangi içeriğin çalındığından siz sorumlusunuz."
            ]
        },
        code: {
            title: "Kod Değişiklikleri",
            items: [
                "Lisans: Bu bot açık kaynaklıdır ve AGPL-3.0 lisansı altında değiştirilebilir ve yeniden dağıtılabilir.",
                "Garanti Yok: Lisansta belirtildiği gibi, bu kodu değiştirmekten, yeniden dağıtmaktan veya kullanmaktan kaynaklanan herhangi bir hasar veya kayıptan sorumlu değiliz.",
                "Atıf: Bu projeyi asla kendi özgün çalışmanız olarak iddia etmeyin. Her zaman orijinal projeye uygun atıf sağlayın."
            ]
        }
    },

    // Permission Calculator page
    permissionCalculator: {
        title: "İzin Hesaplayıcı",
        clientId: "İstemci ID",
        scope: "Kapsam",
        redirectUri: "Yönlendirme URI'si",
        permissions: "İzinler",
        permissionsNote:
            "Renkli, sunucu 2FA gerektiriyorsa OAuth kullanıcısının hesabında 2FA'yı etkinleştirmesi gerektiği anlamına gelir",
        general: "Genel",
        voice: "Ses",
        text: "Metin",
        result: "Sonuç",
        resultNote: "Bu, botu sunucunuza eklemek için kullanabileceğiniz bağlantıdır"
    },

    // Common
    common: {
        back: "Geri",
        copy: "Kopyala",
        default: "Varsayılan",
        required: "Gerekli",
        optional: "İsteğe Bağlı",
        example: "Örnek",
        learnMore: "Daha Fazla Bilgi",
        deployOnRailway: "Railway'e Dağıt",
        language: "Dil",
        tip: "İpucu",
        warning: "Uyarı",
        note: "Not"
    }
};
