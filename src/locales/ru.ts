export const ru = {
    // Navigation
    nav: {
        home: "Главная",
        docs: "Документация",
        gettingStarted: "Начало работы",
        configuration: "Настройки",
        cookiesSetup: "Настройка Cookie",
        disclaimers: "Отказ от ответственности",
        permissionCalculator: "Калькулятор разрешений",
        links: "Ссылки"
    },

    // Home page
    home: {
        title: "Rawon",
        description:
            "Простой, но мощный музыкальный бот Discord, созданный для удовлетворения ваших производственных потребностей.",
        invite: "Пригласить",
        support: "Поддержка",
        viewDocs: "Документация"
    },

    // Getting Started page
    gettingStarted: {
        title: "Начало работы",
        subtitle: "Запустите Rawon за несколько минут с нашим пошаговым руководством.",
        features: {
            title: "Возможности",
            items: [
                "🎮 ",
                "Поддержка взаимодействий (slash-команды и кнопки)",
                "Функция канала запросов для бесшовного музыкального опыта",
                "Готов к производству, кодирование не требуется",
                "Настраиваемый и простой в использовании",
                "Базовые музыкальные команды (play, pause, skip, queue и т.д.)",
                "Многоязычная поддержка"
            ]
        },
        requirements: {
            title: "Требования",
            nodeVersion: "Node.js версии 22.12.0 или выше",
            discordToken: "Токен бота Discord (получить на Discord Developer Portal)",
            optional: "Опционально: учетные данные Spotify API для поддержки Spotify"
        },
        standardSetup: {
            title: "Стандартная установка (Node.js)",
            steps: [
                "Скачайте и установите Node.js версии 22.12.0 или выше",
                "Клонируйте или скачайте этот репозиторий",
                "Скопируйте .env_example в .env и заполните необходимые значения (минимум: DISCORD_TOKEN)",
                "Установите зависимости: pnpm install",
                "Соберите проект: pnpm run build",
                "Запустите бота: pnpm start"
            ],
            requestChannel: "(Опционально) После того как бот онлайн, настройте выделенный музыкальный канал:"
        },
        dockerSetup: {
            title: "Установка Docker (Рекомендуется)",
            composeTitle: "Используя Docker Compose",
            composeSteps: [
                "Создайте файл .env с вашей конфигурацией (скопируйте из .env_example)",
                "Создайте файл docker-compose.yaml (см. пример ниже)",
                "Запустите бота: docker compose up -d",
                "Просмотр логов: docker logs -f rawon-bot"
            ],
            runTitle: "Используя Docker Run",
            volumeInfo: {
                title: "Информация о томе",
                description: "Том /app/cache хранит:",
                items: [
                    "Бинарный файл yt-dlp для потоковой передачи аудио",
                    "data.json для постоянных настроек (каналы запросов, состояния плеера)",
                    "Кэшированные аудиофайлы (если кэширование аудио включено)"
                ]
            }
        },
        railwaySetup: {
            title: "Развертывание на Railway",
            description:
                "Railway предоставляет $5 бесплатных кредитов ежемесячно. Ваш бот будет онлайн 24/7, пока использование не превышает $5.",
            warning: "ВАЖНО: Прочитайте Отказ от ответственности перед развертыванием на Railway."
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
        title: "Настройки",
        subtitle: "Настройте Rawon под ваши потребности с этими параметрами.",
        essential: {
            title: "Основные настройки",
            description: "Это минимальные настройки, необходимые для запуска бота.",
            discordToken: {
                name: "DISCORD_TOKEN",
                description: "Ваш токен бота Discord с Discord Developer Portal",
                required: true
            },
            mainPrefix: {
                name: "MAIN_PREFIX",
                description: "Основной префикс команд",
                default: "!"
            },
            mainServer: {
                name: "MAIN_SERVER",
                description: "ID вашего основного сервера для регистрации slash-команд",
                required: false
            },
            locale: {
                name: "LOCALE",
                description: "Язык бота",
                default: "en-US",
                options: "en-US, es-ES, fr-FR, id-ID, zh-CN, zh-TW, uk-UA, vi-VN, pt-BR, ru-RU, ja-JP, tr-TR"
            },
            spotify: {
                name: "Spotify API",
                description: "Для поддержки Spotify установите SPOTIFY_CLIENT_ID и SPOTIFY_CLIENT_SECRET"
            }
        },
        optional: {
            title: "Дополнительные настройки",
            description: "Настройте поведение и внешний вид Rawon.",
            altPrefix: {
                name: "ALT_PREFIX",
                description: "Альтернативные префиксы (через запятую). Используйте {mention} для упоминания @bot",
                default: "{mention}"
            },
            activities: {
                name: "ACTIVITIES",
                description:
                    "Активности статуса бота (через запятую). Форматы: {prefix}, {userCount}, {textChannelCount}, {serverCount}, {playingCount}, {username}"
            },
            activityTypes: {
                name: "ACTIVITY_TYPES",
                description: "Типы активности для каждой активности (через запятую)",
                options: "PLAYING, WATCHING, LISTENING, COMPETING"
            },
            embedColor: {
                name: "EMBED_COLOR",
                description: "Цвет embed в hex (без #)",
                default: "22C9FF"
            },
            emojis: {
                name: "Эмодзи",
                description: "Настройте эмодзи успеха (YES_EMOJI) и ошибки (NO_EMOJI)",
                defaults: "✅ / ❌"
            },
            musicSelection: {
                name: "MUSIC_SELECTION_TYPE",
                description: "Стиль выбора музыки",
                options: "message, selectmenu",
                default: "message"
            },
            audioCache: {
                name: "ENABLE_AUDIO_CACHE",
                description: "[ЭКСПЕРИМЕНТАЛЬНО] Кэширование загруженного аудио для более быстрого повторного воспроизведения",
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
        title: "Настройка Cookie",
        subtitle: "Исправление ошибки 'Sign in to confirm you're not a bot' на хостинг-провайдерах.",
        why: {
            title: "Зачем это нужно?",
            description:
                "Если вы размещаете Rawon на облачных провайдерах, таких как OVHcloud, AWS, GCP, Azure или других хостинг-сервисах, вы можете столкнуться с ошибкой:",
            error: "Sign in to confirm you're not a bot",
            explanation:
                "Это происходит потому, что платформа блокирует запросы с IP-адресов дата-центров. Используя cookie от залогиненного аккаунта, вы можете обойти это ограничение."
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
            title: "Предварительные требования",
            items: [
                "Вторичный/одноразовый аккаунт (НЕ используйте основной аккаунт из соображений безопасности)",
                "Веб-браузер (Chrome, Firefox или Edge)",
                "Расширение для экспорта cookie",
                "Для пользователей без Docker: среда выполнения Deno JavaScript (требуется для решения подписи yt-dlp)"
            ]
        },
        steps: {
            title: "Пошаговое руководство",
            createAccount: {
                title: "Шаг 1: Создайте одноразовый аккаунт",
                steps: [
                    "Перейдите на страницу создания аккаунта",
                    "Создайте новый аккаунт специально для этого бота",
                    "Важно: НЕ используйте личный/основной аккаунт"
                ]
            },
            login: {
                title: "Шаг 2: Войдите на платформу",
                steps: [
                    "Откройте браузер",
                    "Перейдите на платформу (YouTube)",
                    "Войдите с одноразового аккаунта",
                    "Примите условия, если потребуется"
                ]
            },
            extension: {
                title: "Шаг 3: Установите расширение для экспорта Cookie",
                chrome: "Для Chrome/Edge: Установите 'Get cookies.txt LOCALLY' или 'cookies.txt'",
                firefox: "Для Firefox: Установите 'cookies.txt'"
            },
            exportCookies: {
                title: "Шаг 4: Экспортируйте Cookie",
                steps: [
                    "Убедитесь, что вы на сайте платформы",
                    "Нажмите на иконку расширения cookie на панели инструментов",
                    "Выберите 'Export' или 'Export cookies for this site'",
                    "Сохраните файл как cookies.txt"
                ]
            },
            upload: {
                title: "Шаг 5: Загрузите на сервер",
                steps: [
                    "Создайте папку cache в директории Rawon, если её нет",
                    "Загрузите файл cookies.txt в папку cache",
                    "Путь должен быть: ./cache/cookies.txt"
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
            title: "Как долго действуют Cookie?",
            description:
                "Хорошие новости: Cookie платформы НЕ истекают регулярно. Они останутся действительными, пока:",
            conditions: [
                "Вы не выйдете из платформы в браузере",
                "Вы не измените пароль аккаунта",
                "Вы не отзовете сессию в настройках аккаунта",
                "Платформа не обнаружит подозрительную активность"
            ],
            tips: "На практике cookie могут действовать месяцы или даже годы, если следовать лучшим практикам."
        },
        security: {
            title: "Заметки о безопасности",
            warnings: [
                "Никогда не делитесь файлом cookie с кем-либо",
                "Используйте одноразовый аккаунт, НЕ основной",
                "Файл cookie содержит конфиденциальные данные аутентификации",
                "Добавьте cookies.txt в .gitignore для предотвращения случайных коммитов"
            ]
        }
    },

    // Disclaimers page
    disclaimers: {
        title: "Отказ от ответственности",
        subtitle: "Пожалуйста, внимательно прочитайте перед использованием этого бота.",
        warningBanner: "Важная юридическая информация",
        copyright: {
            title: "Авторские права, DMCA и интеллектуальная собственность",
            items: [
                "Право собственности: Любая интеллектуальная собственность, используемая, воспроизводимая или отображаемая ботом, не принадлежит нам, мейнтейнерам или участникам. Это включает, но не ограничивается аудио, видео и изображениями, используемыми в командах бота.",
                "Политики хостинг-провайдеров: Некоторые хостинг-провайдеры (например, Railway) запрещают размещение или распространение контента, защищенного DMCA. Это включает музыкальных ботов Discord, воспроизводящих защищенную авторским правом музыку/видео. Развертывание на таких платформах на ваш страх и риск.",
                "Ответственность пользователя: Вы несете ответственность за то, как вы используете этого бота и какой контент воспроизводится через него."
            ]
        },
        code: {
            title: "Модификации кода",
            items: [
                "Лицензия: Этот бот имеет открытый исходный код и может быть модифицирован и распространен под лицензией AGPL-3.0.",
                "Без гарантий: Как указано в лицензии, мы не несем ответственности за любой ущерб или убытки, возникшие в результате модификации, распространения или использования этого кода.",
                "Атрибуция: Никогда не заявляйте, что этот проект является вашей оригинальной работой. Всегда указывайте надлежащую атрибуцию оригинальному проекту."
            ]
        }
    },

    // Permission Calculator page
    permissionCalculator: {
        title: "Калькулятор разрешений",
        clientId: "ID клиента",
        scope: "Область",
        redirectUri: "URI перенаправления",
        permissions: "Разрешения",
        permissionsNote:
            "Цветное означает, что пользователю OAuth нужно включить 2FA на своем аккаунте, если сервер требует 2FA",
        general: "Общие",
        voice: "Голос",
        text: "Текст",
        result: "Результат",
        resultNote: "Это ссылка, которую вы можете использовать для добавления бота на сервер"
    },

    // Common
    common: {
        back: "Назад",
        copy: "Копировать",
        default: "По умолчанию",
        required: "Обязательно",
        optional: "Опционально",
        example: "Пример",
        learnMore: "Подробнее",
        deployOnRailway: "Развернуть на Railway",
        language: "Язык",
        tip: "Tip",
        warning: "Warning",
        note: "Note"
    }
};
