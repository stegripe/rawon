export const uk = {
    // Navigation
    nav: {
        home: "Головна",
        docs: "Документація",
        gettingStarted: "Початок роботи",
        configuration: "Налаштування",
        cookiesSetup: "Налаштування Cookie",
        disclaimers: "Застереження",
        permissionCalculator: "Калькулятор дозволів",
        links: "Посилання"
    },

    // Home page
    home: {
        title: "Rawon",
        description:
            "Простий, але потужний музичний бот Discord, створений для задоволення ваших виробничих потреб.",
        invite: "Запросити",
        support: "Підтримка",
        viewDocs: "Документація"
    },

    // Getting Started page
    gettingStarted: {
        title: "Початок роботи",
        subtitle: "Запустіть Rawon за кілька хвилин з нашим покроковим посібником.",
        features: {
            title: "Можливості",
            items: [
                "🎮 ",
                "Підтримка взаємодій (slash-команди та кнопки)",
                "Функція каналу запитів для безперервного музичного досвіду",
                "Готовий до виробництва, кодування не потрібно",
                "Налаштовуваний і простий у використанні",
                "Базові музичні команди (play, pause, skip, queue тощо)",
                "Багатомовна підтримка"
            ]
        },
        requirements: {
            title: "Вимоги",
            nodeVersion: "Node.js версії 22.12.0 або вище",
            discordToken: "Токен бота Discord (отримати на Discord Developer Portal)",
            optional: "Опціонально: облікові дані Spotify API для підтримки Spotify"
        },
        standardSetup: {
            title: "Стандартна установка (Node.js)",
            steps: [
                "Завантажте та встановіть Node.js версії 22.12.0 або вище",
                "Клонуйте або завантажте цей репозиторій",
                "Скопіюйте .env_example в .env та заповніть необхідні значення (мінімум: DISCORD_TOKEN)",
                "Встановіть залежності: pnpm install",
                "Зберіть проект: pnpm run build",
                "Запустіть бота: pnpm start"
            ],
            requestChannel: "(Опціонально) Після того як бот онлайн, налаштуйте виділений музичний канал:"
        },
        dockerSetup: {
            title: "Установка Docker (Рекомендовано)",
            composeTitle: "Використовуючи Docker Compose",
            composeSteps: [
                "Створіть файл .env з вашою конфігурацією (скопіюйте з .env_example)",
                "Створіть файл docker-compose.yaml (див. приклад нижче)",
                "Запустіть бота: docker compose up -d",
                "Перегляд логів: docker logs -f rawon-bot"
            ],
            runTitle: "Використовуючи Docker Run",
            volumeInfo: {
                title: "Інформація про том",
                description: "Том /app/cache зберігає:",
                items: [
                    "Бінарний файл yt-dlp для потокової передачі аудіо",
                    "data.json для постійних налаштувань (канали запитів, стани плеєра)",
                    "Кешовані аудіофайли (якщо кешування аудіо увімкнено)"
                ]
            }
        },
        railwaySetup: {
            title: "Розгортання на Railway",
            description:
                "Railway надає $5 безкоштовних кредитів щомісяця. Ваш бот буде онлайн 24/7, поки використання не перевищує $5.",
            warning: "ВАЖЛИВО: Прочитайте Застереження перед розгортанням на Railway."
        },
        cookiesQuickStart: {
            title: "🍪 Quick Start: Cookies Setup",
            description:
                "If you're hosting on cloud providers (AWS, GCP, Azure, Railway, etc.), you may get 'Sign in to confirm you're not a bot' errors. Fix it easily with the cookies command:",
            steps: [
                "Export cookies from your browser (see Cookies Setup guide)",
                "In Discord, type: !cookies add 1",
                "Attach your cookies.txt file to the message",
                "Done! The cookie takes effect immediately"
            ],
            tip: "💡 You can add multiple cookies for redundancy. When one fails, Rawon automatically switches to the next one!"
        }
    },

    // Configuration page
    configuration: {
        title: "Налаштування",
        subtitle: "Налаштуйте Rawon під ваші потреби з цими параметрами.",
        essential: {
            title: "Основні налаштування",
            description: "Це мінімальні налаштування, необхідні для запуску бота.",
            discordToken: {
                name: "DISCORD_TOKEN",
                description: "Ваш токен бота Discord з Discord Developer Portal",
                required: true
            },
            mainPrefix: {
                name: "MAIN_PREFIX",
                description: "Основний префікс команд",
                default: "!"
            },
            mainServer: {
                name: "MAIN_SERVER",
                description: "ID вашого основного сервера для реєстрації slash-команд",
                required: false
            },
            locale: {
                name: "LOCALE",
                description: "Мова бота",
                default: "en-US",
                options: "en-US, es-ES, fr-FR, id-ID, zh-CN, zh-TW, uk-UA, vi-VN, pt-BR, ru-RU, ja-JP, tr-TR"
            },
            spotify: {
                name: "Spotify API",
                description: "Для підтримки Spotify встановіть SPOTIFY_CLIENT_ID та SPOTIFY_CLIENT_SECRET"
            }
        },
        optional: {
            title: "Додаткові налаштування",
            description: "Налаштуйте поведінку та зовнішній вигляд Rawon.",
            altPrefix: {
                name: "ALT_PREFIX",
                description: "Альтернативні префікси (через кому). Використовуйте {mention} для згадки @bot",
                default: "{mention}"
            },
            activities: {
                name: "ACTIVITIES",
                description:
                    "Активності статусу бота (через кому). Формати: {prefix}, {userCount}, {textChannelCount}, {serverCount}, {playingCount}, {username}"
            },
            activityTypes: {
                name: "ACTIVITY_TYPES",
                description: "Типи активності для кожної активності (через кому)",
                options: "PLAYING, WATCHING, LISTENING, COMPETING"
            },
            embedColor: {
                name: "EMBED_COLOR",
                description: "Колір embed в hex (без #)",
                default: "22C9FF"
            },
            emojis: {
                name: "Емодзі",
                description: "Налаштуйте емодзі успіху (YES_EMOJI) та помилки (NO_EMOJI)",
                defaults: "✅ / ❌"
            },
            musicSelection: {
                name: "MUSIC_SELECTION_TYPE",
                description: "Стиль вибору музики",
                options: "message, selectmenu",
                default: "message"
            },
            audioCache: {
                name: "ENABLE_AUDIO_CACHE",
                description: "[ЕКСПЕРИМЕНТАЛЬНО] Кешування завантаженого аудіо для швидшого повторного відтворення",
                default: "no"
            },
            requestChannelSplash: {
                name: "REQUEST_CHANNEL_SPLASH",
                description: "Custom image URL for the request channel player embed",
                default: "https://cdn.stegripe.org/images/rawon_splash.png"
            }
        },
        developer: {
            title: "🛠️ Developer Settings",
            description: "Advanced settings for bot developers. Only use if you know what you're doing!",
            devs: {
                name: "DEVS",
                description: "Bot developer IDs (comma-separated). Developers can access special commands"
            },
            enablePrefix: {
                name: "ENABLE_PREFIX",
                description: "Enable/disable prefix commands (like !play). Useful if you only want slash commands",
                default: "yes",
                options: "yes, no"
            },
            enableSlash: {
                name: "ENABLE_SLASH_COMMAND",
                description: "Enable/disable slash commands (like /play). Useful if you only want prefix commands",
                default: "yes",
                options: "yes, no"
            },
            debugMode: {
                name: "DEBUG_MODE",
                description: "Enable debug logging for troubleshooting. Shows detailed logs in console",
                default: "no",
                options: "yes, no"
            }
        }
    },

    // Cookies Setup page
    cookiesSetup: {
        title: "Налаштування Cookie",
        subtitle: "Виправлення помилки 'Sign in to confirm you're not a bot' на хостинг-провайдерах.",
        why: {
            title: "Навіщо це потрібно?",
            description:
                "Якщо ви розміщуєте Rawon на хмарних провайдерах, таких як OVHcloud, AWS, GCP, Azure або інших хостинг-сервісах, ви можете зіткнутися з помилкою:",
            error: "Sign in to confirm you're not a bot",
            explanation:
                "Це відбувається тому, що платформа блокує запити з IP-адрес дата-центрів. Використовуючи cookie від залогіненого акаунту, ви можете обійти це обмеження."
        },

        quickMethod: {
            title: "🚀 Easy Method: Using the Cookies Command (Recommended)",
            description: "The easiest way to manage cookies - no file editing needed!",
            benefits: [
                "✅ Works instantly - no restart needed",
                "✅ Supports multiple cookies with automatic rotation",
                "✅ When one cookie fails, bot automatically uses the next one",
                "✅ Cookies persist after bot restarts"
            ],
            commands: {
                title: "📝 Available Commands",
                add: "!cookies add <number> - Add a cookie (attach cookies.txt file to your message)",
                remove: "!cookies remove <number> - Remove a specific cookie",
                removeAll: "!cookies remove all - Remove all cookies",
                list: "!cookies list - Show all cookies and their status",
                reset: "!cookies reset - Reset failed status to retry all cookies"
            },
            quickStart: {
                title: "⚡ Quick Start (3 steps)",
                steps: [
                    "Export cookies from your browser (see guide below)",
                    "In Discord, type: !cookies add 1 and attach your cookies.txt file",
                    "Done! The cookie is now active"
                ]
            },
            multiCookie: {
                title: "💡 Pro Tip: Add Multiple Cookies",
                description: "Add cookies from different accounts for better reliability:",
                example: "!cookies add 1 (attach first cookies.txt)\n!cookies add 2 (attach second cookies.txt from another account)\n!cookies add 3 (attach third cookies.txt)"
            }
        },
        prerequisites: {
            title: "Попередні вимоги",
            items: [
                "Вторинний/одноразовий акаунт (НЕ використовуйте основний акаунт з міркувань безпеки)",
                "Веб-браузер (Chrome, Firefox або Edge)",
                "Розширення для експорту cookie",
                "Для користувачів без Docker: середовище виконання Deno JavaScript (потрібно для вирішення підпису yt-dlp)"
            ]
        },
        steps: {
            title: "Покрокове керівництво",
            createAccount: {
                title: "Крок 1: Створіть одноразовий акаунт",
                steps: [
                    "Перейдіть на сторінку створення акаунту",
                    "Створіть новий акаунт спеціально для цього бота",
                    "Важливо: НЕ використовуйте особистий/основний акаунт"
                ]
            },
            login: {
                title: "Крок 2: Увійдіть на платформу",
                steps: [
                    "Відкрийте браузер",
                    "Перейдіть на платформу (YouTube)",
                    "Увійдіть з одноразового акаунту",
                    "Прийміть умови, якщо потрібно"
                ]
            },
            extension: {
                title: "Крок 3: Встановіть розширення для експорту Cookie",
                chrome: "Для Chrome/Edge: Встановіть 'Get cookies.txt LOCALLY' або 'cookies.txt'",
                firefox: "Для Firefox: Встановіть 'cookies.txt'"
            },
            exportCookies: {
                title: "Крок 4: Експортуйте Cookie",
                steps: [
                    "Переконайтеся, що ви на сайті платформи",
                    "Натисніть на іконку розширення cookie на панелі інструментів",
                    "Виберіть 'Export' або 'Export cookies for this site'",
                    "Збережіть файл як cookies.txt"
                ]
            },
            upload: {
                title: "Крок 5: Завантажте на сервер",
                steps: [
                    "Створіть папку cache в директорії Rawon, якщо її немає",
                    "Завантажте файл cookies.txt в папку cache",
                    "Шлях повинен бути: ./cache/cookies.txt"
                ]
            }
        },
        troubleshooting: {
            title: "🔧 Troubleshooting",
            stillGettingErrors: {
                title: "Still getting 'Sign in to confirm you're not a bot' errors?",
                steps: [
                    "Use !cookies list to check cookie status",
                    "If a cookie shows 'Failed', try !cookies reset to retry",
                    "Add more cookies from different accounts for redundancy"
                ]
            },
            allCookiesFailed: {
                title: "All cookies failed?",
                steps: [
                    "Create new throwaway accounts",
                    "Export fresh cookies",
                    "Add them with !cookies add <number>"
                ]
            },
            accountSuspended: {
                title: "Account got suspended?",
                steps: [
                    "This can happen with heavy usage",
                    "Simply create a new throwaway account",
                    "Export new cookies and add them"
                ]
            }
        },
        duration: {
            title: "Як довго діють Cookie?",
            description:
                "Хороші новини: Cookie платформи НЕ закінчуються регулярно. Вони залишаться дійсними, поки:",
            conditions: [
                "Ви не вийдете з платформи в браузері",
                "Ви не зміните пароль акаунту",
                "Ви не відкличете сесію в налаштуваннях акаунту",
                "Платформа не виявить підозрілу активність"
            ],
            tips: "На практиці cookie можуть діяти місяці або навіть роки, якщо дотримуватися найкращих практик."
        },
        security: {
            title: "Замітки про безпеку",
            warnings: [
                "Ніколи не діліться файлом cookie з ким-небудь",
                "Використовуйте одноразовий акаунт, НЕ основний",
                "Файл cookie містить конфіденційні дані автентифікації",
                "Додайте cookies.txt в .gitignore для запобігання випадкових комітів"
            ]
        }
    },

    // Disclaimers page
    disclaimers: {
        title: "Застереження",
        subtitle: "Будь ласка, уважно прочитайте перед використанням цього бота.",
        warningBanner: "Важлива юридична інформація",
        copyright: {
            title: "Авторські права, DMCA та інтелектуальна власність",
            items: [
                "Право власності: Будь-яка інтелектуальна власність, що використовується, відтворюється або відображається ботом, не належить нам, мейнтейнерам або учасникам. Це включає, але не обмежується аудіо, відео та зображеннями, що використовуються в командах бота.",
                "Політики хостинг-провайдерів: Деякі хостинг-провайдери (наприклад, Railway) забороняють розміщення або розповсюдження контенту, захищеного DMCA. Це включає музичних ботів Discord, що відтворюють захищену авторським правом музику/відео. Розгортання на таких платформах на ваш страх і ризик.",
                "Відповідальність користувача: Ви несете відповідальність за те, як ви використовуєте цього бота та який контент відтворюється через нього."
            ]
        },
        code: {
            title: "Модифікації коду",
            items: [
                "Ліцензія: Цей бот має відкритий вихідний код і може бути модифікований та розповсюджений під ліцензією AGPL-3.0.",
                "Без гарантій: Як зазначено в ліцензії, ми не несемо відповідальності за будь-яку шкоду або збитки, що виникли в результаті модифікації, розповсюдження або використання цього коду.",
                "Атрибуція: Ніколи не заявляйте, що цей проект є вашою оригінальною роботою. Завжди вказуйте належну атрибуцію оригінальному проекту."
            ]
        }
    },

    // Permission Calculator page
    permissionCalculator: {
        title: "Калькулятор дозволів",
        clientId: "ID клієнта",
        scope: "Область",
        redirectUri: "URI перенаправлення",
        permissions: "Дозволи",
        permissionsNote:
            "Кольорове означає, що користувачу OAuth потрібно увімкнути 2FA на своєму акаунті, якщо сервер вимагає 2FA",
        general: "Загальні",
        voice: "Голос",
        text: "Текст",
        result: "Результат",
        resultNote: "Це посилання, яке ви можете використати для додавання бота на сервер"
    },

    // Common
    common: {
        back: "Назад",
        copy: "Копіювати",
        default: "За замовчуванням",
        required: "Обов'язково",
        optional: "Опціонально",
        example: "Приклад",
        learnMore: "Детальніше",
        deployOnRailway: "Розгорнути на Railway",
        language: "Мова",
        tip: "Tip",
        warning: "Warning",
        note: "Note"
    }
};
