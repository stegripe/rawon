import type { Translations } from "./en";

export const ru: Translations = {
    nav: {
        home: "Главная",
        docs: "Документация",
        gettingStarted: "Начало работы",
        configuration: "Настройка",
        cookiesSetup: "Настройка cookie",
        disclaimers: "Отказ от ответственности",
        permissionCalculator: "Калькулятор разрешений",
        links: "Ссылки"
    },

    home: {
        title: "Rawon",
        description:
            "Простой и мощный музыкальный (мульти-)бот для Discord, заточенный под продакшен. Удобен в использовании и не требует программирования.",
        invite: "Пригласить",
        inviteBot: "Пригласить бота",
        support: "Поддержка",
        viewDocs: "Документация"
    },

    gettingStarted: {
        title: "Начало работы",
        subtitle:
            "Запустите Rawon за несколько минут с помощью пошагового руководства.",
        features: {
            title: "✨ Возможности",
            items: [
                "🚀 Готово к продакшену, без необходимости писать код",
                "📺 Канал запросов для комфортного прослушивания музыки",
                "🎶 Поддержка YouTube, Spotify, SoundCloud и прямых ссылок на файлы",
                "🤖 Несколько экземпляров бота для разных голосовых каналов",
                "⚡ Умное предварительное кэширование аудио для плавного воспроизведения",
                "🍪 Встроенный вход в Google через Puppeteer для управления cookie"
            ]
        },
        requirements: {
            title: "📋 Требования",
            nodeVersion: "**Node.js** версия `20.0.0` или выше",
            discordToken:
                "**Токен Discord-бота** (получите в [Discord Developer Portal](https://discord.com/developers/applications))",
            optional:
                "**По желанию:** [FFmpeg](https://ffmpeg.org/) для обработки аудио при обычной (не Docker) установке — в образах Docker FFmpeg уже включён"
        },
        standardSetup: {
            title: "💻 Обычная установка (Node.js)",
            steps: [
                "Скачайте и установите перечисленные выше требования",
                "Клонируйте или скачайте этот репозиторий",
                "Скопируйте `.env.example` в `.env` и заполните нужные значения (минимум: `DISCORD_TOKEN`)",
                "Установите зависимости: `pnpm install`",
                "Соберите проект: `pnpm run build`",
                "Запустите бота: `pnpm start`"
            ],
            requestChannel:
                "(По желанию) После того как бот в сети, настройте отдельный музыкальный канал:"
        },
        dockerSetup: {
            title: "🐳 Установка через Docker (рекомендуется)",
            composeTitle: "Через Docker Compose",
            composeSteps: [
                "Создайте файл `.env` с вашей конфигурацией (скопируйте из `.env.example`)",
                "(По желанию) Создайте `dev.env` из `dev.env.example` для дополнительных настроек",
                "Создайте `docker-compose.yaml` (пример ниже)",
                "Запустите бота: `docker compose up -d`",
                "Смотрите логи: `docker logs -f rawon-bot`"
            ],
            runTitle: "Через docker run",
            volumeInfo: {
                title: "📁 Сведения о томе",
                description: "Том `/app/cache` хранит:",
                items: [
                    "бинарник `yt-dlp` для потоковой передачи аудио",
                    "файлы `data.*` с постоянными настройками (каналы запросов, состояние плеера)",
                    "кэшированные аудиофайлы (если включено кэширование аудио)",
                    "файл cookie и данные профиля после входа в Google (см. [Настройку cookie](/docs/cookies-setup))"
                ]
            },
            portInfo: {
                title: "🔌 Порты",
                description:
                    "`DEVTOOLS_PORT` (по умолчанию `3000`) используется для прокси удалённой отладки Chrome DevTools. Нужен для `!login start`, если вы подключаетесь с другого компьютера. Укажите `DEVTOOLS_PORT` в `dev.env` для другого порта и пробросьте его в Docker Compose или `docker run`."
            }
        },

        cookiesQuickStart: {
            title: "🍪 Cookie: быстрое решение на хостинге",
            description:
                "На облачных хостингах (AWS, GCP, Azure, Railway и т.д.) может появиться сообщение **«Sign in to confirm you're not a bot»**. Используйте встроенный сценарий входа:",
            steps: [
                "Выполните в Discord `!login start`",
                "Откройте присланный ботом URL DevTools и завершите вход в Google в удалённом браузере",
                "Проверьте cookie командой `!login status` или обновите сессию: `!login logout`, затем снова `!login start`"
            ],
            tip: "💡 Используйте **отдельный (одноразовый) аккаунт Google**, а не основной. Подробности — в полном руководстве [Настройка cookie](/docs/cookies-setup)."
        }
    },

    configuration: {
        title: "Настройка",
        subtitle:
            "Как файлы конфигурации Rawon и переменные окружения работают вместе.",
        overview: {
            title: "📄 Файлы конфигурации",
            intro: "Параметры намеренно разнесены по нескольким файлам:",
            items: [
                "**`.env.example`** — основные настройки (токены Discord/Spotify, префикс, ID, активности и т.д.). Скопируйте в **`.env`** и заполните.",
                "**`dev.env.example`** — дополнительные настройки для разработчиков (префикс и слэш-команды, шардирование, порт DevTools для `!login`, путь к Chromium, режим отладки). При необходимости скопируйте в **`dev.env`**.",
                "**Команда `setup`** — параметры бота (цвет эмбеда, эмодзи да/нет, splash, альтернативный префикс, громкость по умолчанию, тип выбора, кэш аудио) задаются **командой `setup`** (только разработчики) и хранятся в базе. Список настроек: `<prefix>setup view`."
            ]
        },
        essential: {
            title: "⚡ Основные настройки (`.env`)",
            description:
                "Значения из `.env.example`. Для запуска **строго обязателен** только **`DISCORD_TOKEN`**; Spotify, токен текста песен и остальное добавляйте по мере необходимости.",
            discordToken: {
                name: "DISCORD_TOKEN",
                description:
                    "Токен(ы) Discord-бота из [Discord Developer Portal](https://discord.com/developers/applications). Несколько токенов через **запятую** включают режим нескольких ботов.",
                required: true
            },
            spotify: {
                name: "Spotify API",
                description:
                    "Укажите `SPOTIFY_CLIENT_ID` и `SPOTIFY_CLIENT_SECRET` из [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard). **Нужно для работы со Spotify.**",
                required: false
            },
            stegripeLyrics: {
                name: "STEGRIPE_API_LYRICS_TOKEN",
                description:
                    "Нужен для корректного вывода команды **lyrics**. Свяжитесь с разработчиком для доступа.",
                required: false
            },
            mainPrefix: {
                name: "MAIN_PREFIX",
                description:
                    "Основной префикс команд. Например, `!` означает, что для воспроизведения вы вводите `!play`",
                default: "!"
            },
            mainServer: {
                name: "MAIN_SERVER",
                description:
                    "ID основного сервера для более быстрой регистрации слэш-команд. Пусто — глобальные команды (обновление может занять до часа)",
                required: false
            },
            devs: {
                name: "DEVS",
                description:
                    "ID пользователей-разработчиков бота (через запятую). Разработчики получают доступ к служебным командам, включая `setup` и инструменты `login`.",
                required: false
            },
            locale: {
                name: "LOCALE",
                description: "Язык ответов бота",
                default: "en-US",
                options:
                    "en-US, es-ES, fr-FR, id-ID, zh-CN, zh-TW, uk-UA, vi-VN, pt-BR, ru-RU, ja-JP, tr-TR, ko-KR"
            },
            activityTypes: {
                name: "ACTIVITY_TYPES",
                description:
                    "Типы активности для каждой записи в `ACTIVITIES` (через запятую). Число должно совпадать с количеством активностей",
                options: "PLAYING, WATCHING, LISTENING, COMPETING",
                default: "PLAYING"
            },
            activities: {
                name: "ACTIVITIES",
                description:
                    "Строки статуса под именем бота (через запятую). Плейсхолдеры: `{prefix}`, `{userCount}`, `{textChannelCount}`, `{serverCount}`, `{playingCount}`, `{username}`",
                required: false
            }
        },
        multiBot: {
            title: "🔄 Режим нескольких ботов",
            description:
                "Режим нескольких ботов включается сам — **дополнительной настройки не нужно**. Один токен — один бот; токены через **запятую** автоматически включают мультибот.",
            example: "Пример:",
            exampleCode: 'DISCORD_TOKEN="token1, token2, token3"',
            features: [
                "**Первый** токен — основной бот для общих команд",
                "Каждый бот обслуживает музыку пользователям в **своём** голосовом канале",
                "Если основного бота нет на сервере, роль может взять следующий доступный бот",
                "У каждого бота должно быть **своё** приложение Discord"
            ]
        },
        developer: {
            title: "🛠️ Настройки разработчика (`dev.env`)",
            description:
                "Из `dev.env.example`. **По желанию** — меняйте только если понимаете, что делаете.",
            enablePrefix: {
                name: "ENABLE_PREFIX",
                description: "Включить или отключить команды с префиксом (например `!play`)",
                default: "yes",
                options: "yes, no"
            },
            enableSlash: {
                name: "ENABLE_SLASH_COMMAND",
                description: "Включить или отключить слэш-команды (например `/play`)",
                default: "yes",
                options: "yes, no"
            },
            enableSharding: {
                name: "ENABLE_SHARDING",
                description: "Шардирование для крупных ботов (**только режим с одним токеном**)",
                default: "no",
                options: "yes, no"
            },
            devtoolsPort: {
                name: "DEVTOOLS_PORT",
                description:
                    "Порт прокси удалённой отладки Chrome DevTools. Используется `!login start`, когда DevTools открывают с другой машины. По умолчанию: `3000`",
                default: "3000"
            },
            chromiumPath: {
                name: "CHROMIUM_PATH",
                description:
                    "Путь к Chrome/Chromium для входа в Google. Пусто — автоопределение",
                required: false
            },
            nodeEnv: {
                name: "NODE_ENV",
                description: "Режим среды выполнения",
                default: "production",
                options: "production, development"
            },
            debugMode: {
                name: "DEBUG_MODE",
                description: "Подробный отладочный вывод в консоль",
                default: "no",
                options: "yes, no"
            }
        }
    },

    cookiesSetup: {
        title: "Настройка cookie",
        subtitle:
            "Устранение «Sign in to confirm you're not a bot» в облаке. Рекомендуется встроенная команда **`!login`**.",
        why: {
            title: "Зачем это нужно?",
            description:
                "Если Rawon размещён у OVHcloud, AWS, GCP, Azure или на другом облачном/VPS-хостинге, может появиться:",
            error: "Sign in to confirm you're not a bot",
            explanation:
                "Платформа часто блокирует запросы с IP дата-центров. Вход с **аккаунта Google** позволяет Rawon получить валидные cookie и обойти ограничение."
        },
        loginMethod: {
            title: "Рекомендуется: команда `!login`",
            description:
                "Проще всего настроить cookie встроенным сценарием **`!login`** (настоящий браузер через Puppeteer):",
            benefits: [
                "✅ Открывается настоящий браузер для входа в Google",
                "✅ Cookie экспортируются и сохраняются автоматически",
                "✅ После входа браузер закрывается — не остаётся лишних процессов",
                "✅ Сохраняется после перезапуска (том Docker или папка `cache/`)"
            ]
        },
        commandUsage: {
            title: "Использование команд"
        },
        quickStart: {
            title: "Быстрый старт",
            steps: [
                "Выполните в Discord `!login start`",
                "Откройте в локальном браузере **URL DevTools**, который пришлёт бот",
                "Завершите вход в Google в **удалённой** сессии браузера",
                "Войдите в **одноразовый** аккаунт Google (не в основной)",
                "После входа бот сохранит cookie и закроет браузер",
                "Готово — дальнейшие запросы используют сохранённую сессию"
            ]
        },
        staleCookies: {
            title: "Если проверки ботом снова появились",
            description: "Cookie устаревают, когда провайдер их ротирует. Тогда:",
            steps: [
                "Выполните `!login logout`, чтобы удалить старые cookie и данные профиля",
                "Запустите `!login start` и войдите снова для новой сессии"
            ]
        },
        prerequisites: {
            title: "Требования",
            items: [
                "**Второй / одноразовый** аккаунт Google (**не** используйте основной)",
                "**Без Docker:** на хосте установлены Chrome или Chromium",
                "**Docker:** Chromium уже в образе; пробросьте `DEVTOOLS_PORT`, если подключаетесь к `!login` удалённо (см. [Настройку](/docs/configuration))"
            ]
        },
        docker: {
            title: "Docker",
            persistence:
                "Cookie и данные профиля сохраняются в именованном томе **`rawon:/app/cache`** между перезапусками контейнера.",
            chromium:
                "В образе есть Chromium, поэтому **`!login start`** работает без дополнительной настройки со стороны образа."
        },
        envVars: {
            title: "Переменные окружения (`dev.env`)",
            intro: "Дополнительная настройка (см. `dev.env.example`):",
            dockerComposeHint:
                "В Docker убедитесь, что в `docker-compose.yaml` в `ports` проброшен порт DevTools, например:"
        },
        duration: {
            title: "Как долго живут cookie?",
            description:
                "Со временем они могут устареть из-за ротации сессий. Обычно остаются действительными, пока:",
            conditions: [
                "Вы не выходите так, что сессия инвалидируется",
                "Вы не меняете пароль аккаунта",
                "Вы не отзываете сессию в настройках безопасности",
                "Провайдер не помечает активность как подозрительную"
            ],
            footer: "Когда cookie истекут, снова выполните `!login logout`, затем `!login start`."
        },
        troubleshooting: {
            title: "Решение проблем",
            stillErrors: {
                title: "Всё ещё видите «Sign in to confirm you're not a bot»?",
                steps: [
                    "Используйте `!login status`, чтобы посмотреть состояние входа и cookie",
                    "Выполните `!login logout`, затем `!login start` для новой сессии"
                ]
            },
            browserWontStart: {
                title: "Браузер не запускается?",
                steps: [
                    "Проверьте `!login status` на детали ошибки",
                    "На «железе» установите Chrome/Chromium или задайте `CHROMIUM_PATH` в `dev.env`",
                    "В Docker Chromium должен работать из коробки с официальным образом"
                ]
            },
            accountSuspended: {
                title: "Аккаунт заблокирован?",
                steps: [
                    "Создайте новый одноразовый аккаунт Google",
                    "Выполните `!login logout`, чтобы стереть старую сессию",
                    "Запустите `!login start` и войдите с новым аккаунтом"
                ]
            }
        },
        manualAlternative: {
            title: "Альтернатива: файл cookie вручную",
            description:
                "Можно положить файл cookie в **формате Netscape** по указанному ниже пути. Бот использует его, если файл есть; **`!login` всё равно предпочтительнее** для простоты.",
            pathLabel: "Путь"
        },
        security: {
            title: "Безопасность",
            warningLabel: "WARNING",
            warnings: [
                "Используйте **одноразовый** аккаунт Google — **не** основной",
                "URL DevTools даёт доступ к удалённой сессии браузера — **не публикуйте** его",
                "Файлы cookie содержат **чувствительные** данные аутентификации"
            ]
        }
    },

    disclaimers: {
        title: "Отказ от ответственности",
        subtitle: "Внимательно прочитайте перед использованием бота.",
        warningBanner: "Важная правовая информация",
        copyright: {
            title: "Авторское право, DMCA и объекты интеллектуальной собственности",
            items: [
                "**Правообладатель:** любые объекты интеллектуальной собственности, которые бот использует, воспроизводит или показывает, **не принадлежат нам**, мейнтейнерам или участникам проекта. Сюда входят, в частности, аудио, видео и изображения в командах бота.",
                "**Правила хостинг-провайдеров:** некоторые провайдеры запрещают размещение или распространение контента, защищённого DMCA. Сюда относятся и музыкальные боты Discord с воспроизведением защищённой музыки/видео.\n- **Разворачивайте на таких платформах на свой страх и риск**",
                "**Ответственность пользователя:** вы отвечаете за то, как используете бота и какой контент через него воспроизводите."
            ]
        },
        code: {
            title: "Изменение кода",
            items: [
                "**Лицензия:** проект распространяется по [Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International (CC BY-NC-ND 4.0)](https://creativecommons.org/licenses/by-nc-nd/4.0/). Полный юридический текст — в файле [`LICENSE`](https://github.com/stegripe/rawon/blob/main/LICENSE) репозитория.",
                "**Без гарантий:** как указано в лицензии, мы **не несём ответственности** за ущерб или убытки от использования кода. Соблюдайте условия лицензии относительно атрибуции, некоммерческого использования и ограничений на распространение производных работ.",
                "**Атрибуция:** не выдавайте этот проект за свою оригинальную разработку. Всегда указывайте ссылку на исходный проект."
            ]
        },
        licenseFooterPrefix: "Полный текст лицензии см. в репозитории",
        licenseLinkLabel: "LICENSE (CC BY-NC-ND 4.0)"
    },

    permissionCalculator: {
        title: "Калькулятор разрешений",
        clientId: "ID приложения",
        scope: "Scope",
        redirectUri: "Redirect URI",
        permissions: "Разрешения",
        permissionsNote:
            "Цветная подсветка значит, что пользователю OAuth нужно включить 2FA, если сервер требует двухфакторную аутентификацию",
        general: "Общие",
        voice: "Голос",
        text: "Текст",
        result: "Результат",
        resultNote: "Эту ссылку можно использовать, чтобы добавить бота на сервер"
    },

    common: {
        back: "Назад",
        copy: "Копировать",
        default: "По умолчанию",
        required: "Обязательно",
        optional: "Необязательно",
        example: "Пример",
        learnMore: "Подробнее",

        language: "Язык",
        tip: "Совет",
        warning: "Предупреждение",
        note: "Примечание"
    }
};
