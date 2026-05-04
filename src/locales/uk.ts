import type { Translations } from "./en";

export const uk: Translations = {
    nav: {
        home: "Головна",
        docs: "Документація",
        gettingStarted: "Початок роботи",
        configuration: "Налаштування",
        cookiesSetup: "Налаштування cookie",
        disclaimers: "Застереження",
        permissionCalculator: "Калькулятор дозволів",
        links: "Посилання"
    },

    home: {
        title: "Rawon",
        description:
            "Простий і потужний музичний (мульти-)бот для Discord, створений для продакшену. Зручний у використанні й не потребує програмування.",
        invite: "Запросити",
        inviteBot: "Запросити бота",
        support: "Підтримка",
        viewDocs: "Документація"
    },

    gettingStarted: {
        title: "Початок роботи",
        subtitle:
            "Запустіть Rawon за кілька хвилин за покроковою інструкцією.",
        features: {
            title: "✨ Можливості",
            items: [
                "🚀 Готовий до продакшену, без написання коду",
                "📺 Канал запитів для зручного прослуховування музики",
                "🎶 Підтримка YouTube, Spotify, SoundCloud і прямих посилань на файли",
                "🤖 Кілька екземплярів бота для різних голосових каналів",
                "⚡ Розумне попереднє кешування аудіо для плавного відтворення",
                "🍪 Вбудований вхід у Google через Puppeteer для керування cookie"
            ]
        },
        requirements: {
            title: "📋 Вимоги",
            nodeVersion: "**Node.js** версія `20.0.0` або новіша",
            discordToken:
                "**Токен Discord-бота** (отримайте в [Discord Developer Portal](https://discord.com/developers/applications))",
            optional:
                "**За бажанням:** [FFmpeg](https://ffmpeg.org/) для обробки аудіо при звичайній (не Docker) інсталяції — в образах Docker FFmpeg уже включено"
        },
        standardSetup: {
            title: "💻 Звичайна інсталяція (Node.js)",
            steps: [
                "Завантажте та встановіть перелічені вище вимоги",
                "Клонуйте або завантажте цей репозиторій",
                "Скопіюйте `.env.example` в `.env` і заповніть потрібні значення (мінімум: `DISCORD_TOKEN`)",
                "Встановіть залежності: `pnpm install`",
                "Зберіть проєкт: `pnpm run build`",
                "Запустіть бота: `pnpm start`"
            ],
            requestChannel:
                "(За бажанням) Після того як бот онлайн, налаштуйте окремий музичний канал:"
        },
        dockerSetup: {
            title: "🐳 Інсталяція через Docker (рекомендовано)",
            composeTitle: "Через Docker Compose",
            composeSteps: [
                "Створіть файл `.env` з вашою конфігурацією (скопіюйте з `.env.example`)",
                "(За бажанням) Створіть `dev.env` з `dev.env.example` для додаткових налаштувань",
                "Створіть `docker-compose.yaml` (приклад нижче)",
                "Запустіть бота: `docker compose up -d`",
                "Переглядайте логи: `docker logs -f rawon-bot`"
            ],
            runTitle: "Через docker run",
            volumeInfo: {
                title: "📁 Інформація про том",
                description: "Том `/app/cache` зберігає:",
                items: [
                    "бінарник `yt-dlp` для потокового аудіо",
                    "файли `data.*` із постійними налаштуваннями (канали запитів, стан плеєра)",
                    "кешовані аудіофайли (якщо увімкнено кешування аудіо)",
                    "файл cookie і дані профілю після входу в Google (див. [Налаштування cookie](/docs/cookies-setup))"
                ]
            },
            portInfo: {
                title: "🔌 Порти",
                description:
                    "`DEVTOOLS_PORT` (за замовчуванням `3000`) використовується для проксі віддаленої відладки Chrome DevTools. Потрібен для `!login start`, якщо ви підключаєтеся з іншого комп’ютера. Вкажіть `DEVTOOLS_PORT` у `dev.env` для іншого порту і пробросьте його в Docker Compose або `docker run`."
            }
        },

        cookiesQuickStart: {
            title: "🍪 Cookie: швидке рішення на хостингу",
            description:
                "На хмарних хостингах (AWS, GCP, Azure, Railway тощо) може з’явитися **«Sign in to confirm you're not a bot»**. Скористайтеся вбудованим сценарієм входу:",
            steps: [
                "У Discord виконайте `!login start`",
                "Відкрийте надісланий ботом URL DevTools і завершіть вхід у Google у віддаленому браузері",
                "Перевірте cookie командою `!login status` або оновіть сесію: `!login logout`, потім знову `!login start`"
            ],
            tip: "💡 Використовуйте **окремий (одноразовий) обліковий запис Google**, а не основний. Деталі — у повному посібнику [Налаштування cookie](/docs/cookies-setup)."
        }
    },

    configuration: {
        title: "Налаштування",
        subtitle:
            "Як файли конфігурації Rawon і змінні середовища працюють разом.",
        overview: {
            title: "📄 Файли конфігурації",
            intro: "Параметри навмисно рознесені кількома файлами:",
            items: [
                "**`.env.example`** — основні налаштування (токени Discord/Spotify, префікс, ID, активності тощо). Скопіюйте в **`.env`** і заповніть.",
                "**`dev.env.example`** — додаткові налаштування для розробників (префікс і слеш-команди, шардинг, порт DevTools для `!login`, шлях до Chromium, режим налагодження). За потреби скопіюйте в **`dev.env`**.",
                "**Команда `setup`** — параметри бота (колір ембеда, емодзі так/ні, splash, альтернативний префікс, гучність за замовчуванням, тип вибору, кеш аудіо) керуються **командою `setup`** (лише розробники) і зберігаються в базі. Список: `<prefix>setup view`."
            ]
        },
        essential: {
            title: "⚡ Основні налаштування (`.env`)",
            description:
                "Значення з `.env.example`. Для запуску **обов’язковий** лише **`DISCORD_TOKEN`**; Spotify, токен тексту пісні та інше додавайте за потреби.",
            discordToken: {
                name: "DISCORD_TOKEN",
                description:
                    "Токен(и) Discord-бота з [Discord Developer Portal](https://discord.com/developers/applications). Кілька токенів через **кому** увімкнуть режим кількох ботів.",
                required: true
            },
            spotify: {
                name: "Spotify API",
                description:
                    "Вкажіть `SPOTIFY_CLIENT_ID` і `SPOTIFY_CLIENT_SECRET` з [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard). **Потрібно для Spotify.**",
                required: false
            },
            stegripeLyrics: {
                name: "STEGRIPE_API_LYRICS_TOKEN",
                description:
                    "Потрібен для коректного виводу команди **lyrics**. Зв’яжіться з розробником для доступу.",
                required: false
            },
            mainPrefix: {
                name: "MAIN_PREFIX",
                description:
                    "Основний префікс команд. Наприклад, `!` означає, що для відтворення ви вводите `!play`",
                default: "!"
            },
            mainServer: {
                name: "MAIN_SERVER",
                description:
                    "ID основного сервера для швидшої реєстрації слеш-команд. Порожньо — глобальні команди (оновлення може тривати до години)",
                required: false
            },
            devs: {
                name: "DEVS",
                description:
                    "ID користувачів-розробників бота (через кому). Розробники отримують доступ до службових команд, включно з `setup` і `login`.",
                required: false
            },
            locale: {
                name: "LOCALE",
                description: "Мова відповідей бота",
                default: "en-US",
                options:
                    "en-US, es-ES, fr-FR, id-ID, zh-CN, zh-TW, uk-UA, vi-VN, pt-BR, ru-RU, ja-JP, tr-TR, ko-KR"
            },
            activityTypes: {
                name: "ACTIVITY_TYPES",
                description:
                    "Типи активності для кожного запису в `ACTIVITIES` (через кому). Кількість має збігатися з кількістю активностей",
                options: "PLAYING, WATCHING, LISTENING, COMPETING",
                default: "PLAYING"
            },
            activities: {
                name: "ACTIVITIES",
                description:
                    "Рядки статусу під ім’ям бота (через кому). Плейсхолдери: `{prefix}`, `{userCount}`, `{textChannelCount}`, `{serverCount}`, `{playingCount}`, `{username}`",
                required: false
            }
        },
        multiBot: {
            title: "🔄 Режим кількох ботів",
            description:
                "Режим кількох ботів вмикається сам — **додаткового налаштування не потрібно**. Один токен — один бот; токени через **кому** автоматично вмикають мультибот.",
            example: "Приклад:",
            exampleCode: 'DISCORD_TOKEN="token1, token2, token3"',
            features: [
                "**Перший** токен — основний бот для загальних команд",
                "Кожен бот обслуговує музику користувачам у **своєму** голосовому каналі",
                "Якщо основного бота немає на сервері, роль може взяти наступний доступний бот",
                "У кожного бота має бути **власний** застосунок Discord"
            ]
        },
        developer: {
            title: "🛠️ Налаштування розробника (`dev.env`)",
            description:
                "З `dev.env.example`. **За бажанням** — змінюйте лише якщо розумієте призначення.",
            enablePrefix: {
                name: "ENABLE_PREFIX",
                description: "Увімкнути або вимкнути команди з префіксом (наприклад `!play`)",
                default: "yes",
                options: "yes, no"
            },
            enableSlash: {
                name: "ENABLE_SLASH_COMMAND",
                description: "Увімкнути або вимкнути слеш-команди (наприклад `/play`)",
                default: "yes",
                options: "yes, no"
            },
            enableSharding: {
                name: "ENABLE_SHARDING",
                description: "Шардинг для великих ботів (**лише режим з одним токеном**)",
                default: "no",
                options: "yes, no"
            },
            devtoolsPort: {
                name: "DEVTOOLS_PORT",
                description:
                    "Порт проксі віддаленої відладки Chrome DevTools. Використовується `!login start`, коли DevTools відкривають з іншої машини. За замовчуванням: `3000`",
                default: "3000"
            },
            chromiumPath: {
                name: "CHROMIUM_PATH",
                description:
                    "Шлях до Chrome/Chromium для входу в Google. Порожньо — автовизначення",
                required: false
            },
            nodeEnv: {
                name: "NODE_ENV",
                description: "Режим середовища виконання",
                default: "production",
                options: "production, development"
            },
            debugMode: {
                name: "DEBUG_MODE",
                description: "Докладний налагоджувальний вивід у консоль",
                default: "no",
                options: "yes, no"
            }
        }
    },

    cookiesSetup: {
        title: "Налаштування cookie",
        subtitle:
            "Усунення «Sign in to confirm you're not a bot» у хмарі. Рекомендовано вбудована команда **`!login`**.",
        why: {
            title: "Навіщо це потрібно?",
            description:
                "Якщо Rawon розміщено у OVHcloud, AWS, GCP, Azure або на іншому хмарному/VPS-хостингу, може з’явитися:",
            error: "Sign in to confirm you're not a bot",
            explanation:
                "Платформа часто блокує запити з IP дата-центрів. Вхід з **облікового запису Google** дозволяє Rawon отримати дійсні cookie й обійти обмеження."
        },
        loginMethod: {
            title: "Рекомендовано: команда `!login`",
            description:
                "Найпростіше налаштувати cookie вбудованим сценарієм **`!login`** (справжній браузер через Puppeteer):",
            benefits: [
                "✅ Відкривається справжній браузер для входу в Google",
                "✅ Cookie експортуються й зберігаються автоматично",
                "✅ Після входу браузер закривається — не залишається зайвих процесів",
                "✅ Зберігається після перезапуску (том Docker або папка `cache/`)"
            ]
        },
        commandUsage: {
            title: "Використання команд"
        },
        quickStart: {
            title: "Швидкий старт",
            steps: [
                "У Discord виконайте `!login start`",
                "Відкрийте у локальному браузері **URL DevTools**, який надішле бот",
                "Завершіть вхід у Google в **віддаленій** сесії браузера",
                "Увійдіть в **одноразовий** обліковий запис Google (не в основний)",
                "Після входу бот збереже cookie й закриє браузер",
                "Готово — подальші запити використовують збережену сесію"
            ]
        },
        staleCookies: {
            title: "Якщо перевірки ботом з’явилися знову",
            description: "Cookie застарівають, коли провайдер їх ротує. Тоді:",
            steps: [
                "Виконайте `!login logout`, щоб видалити старі cookie і дані профілю",
                "Запустіть `!login start` і увійдіть знову для нової сесії"
            ]
        },
        prerequisites: {
            title: "Вимоги",
            items: [
                "**Другий / одноразовий** обліковий запис Google (**не** використовуйте основний)",
                "**Без Docker:** на хості встановлені Chrome або Chromium",
                "**Docker:** Chromium уже в образі; пробросьте `DEVTOOLS_PORT`, якщо підключаєтеся до `!login` віддалено (див. [Налаштування](/docs/configuration))"
            ]
        },
        docker: {
            title: "Docker",
            persistence:
                "Cookie і дані профілю зберігаються в іменованому томі **`rawon:/app/cache`** між перезапусками контейнера.",
            chromium:
                "В образі є Chromium, тому **`!login start`** працює без додаткового налаштування з боку образу."
        },
        envVars: {
            title: "Змінні середовища (`dev.env`)",
            intro: "Додаткове налаштування (див. `dev.env.example`):",
            dockerComposeHint:
                "У Docker переконайтеся, що в `docker-compose.yaml` у `ports` проброшено порт DevTools, наприклад:"
        },
        duration: {
            title: "Як довго живуть cookie?",
            description:
                "З часом вони можуть застаріти через ротацію сесій. Зазвичай залишаються дійовими, поки:",
            conditions: [
                "Ви не виходите так, що сесію інвалідовано",
                "Ви не змінюєте пароль облікового запису",
                "Ви не відкликаєте сесію в налаштуваннях безпеки",
                "Провайдер не позначає активність як підозрілу"
            ],
            footer: "Коли cookie закінчаться, знову виконайте `!login logout`, потім `!login start`."
        },
        troubleshooting: {
            title: "Усунення проблем",
            stillErrors: {
                title: "Досі бачите «Sign in to confirm you're not a bot»?",
                steps: [
                    "Скористайтеся `!login status`, щоб переглянути стан входу й cookie",
                    "Виконайте `!login logout`, потім `!login start` для нової сесії"
                ]
            },
            browserWontStart: {
                title: "Браузер не запускається?",
                steps: [
                    "Перевірте `!login status` на деталі помилки",
                    "На «залізі» встановіть Chrome/Chromium або задайте `CHROMIUM_PATH` у `dev.env`",
                    "У Docker Chromium має працювати з коробки з офіційним образом"
                ]
            },
            accountSuspended: {
                title: "Обліковий запис заблоковано?",
                steps: [
                    "Створіть новий одноразовий обліковий запис Google",
                    "Виконайте `!login logout`, щоб стерти стару сесію",
                    "Запустіть `!login start` і увійдіть з новим обліковим записом"
                ]
            }
        },
        manualAlternative: {
            title: "Альтернатива: файл cookie вручну",
            description:
                "Можна покласти файл cookie у **форматі Netscape** за вказаним нижче шляхом. Бот використовує його, якщо файл є; **`!login` усе одно зручніший** варіант.",
            pathLabel: "Шлях"
        },
        security: {
            title: "Безпека",
            warningLabel: "WARNING",
            warnings: [
                "Використовуйте **одноразовий** обліковий запис Google — **не** основний",
                "URL DevTools дає доступ до віддаленої сесії браузера — **не публікуйте** його",
                "Файли cookie містять **чутливі** дані автентифікації"
            ]
        }
    },

    disclaimers: {
        title: "Застереження",
        subtitle: "Уважно прочитайте перед використанням бота.",
        warningBanner: "Важлива правова інформація",
        copyright: {
            title: "Авторське право, DMCA та об’єкти інтелектуальної власності",
            items: [
                "**Власність:** будь-які об’єкти інтелектуальної власності, які бот використовує, відтворює або показує, **не належать нам**, мейнтейнерам чи учасникам проєкту. Сюди входять, зокрема, аудіо, відео та зображення в командах бота.",
                "**Правила хостинг-провайдерів:** деякі провайдери забороняють розміщення або поширення контенту, захищеного DMCA. Сюди належать і музичні боти Discord із відтворенням захищеної музики/відео.\n- **Розгортайте на таких платформах на свій ризик**",
                "**Відповідальність користувача:** ви відповідаєте за те, як користуєтеся ботом і який контент через нього відтворюєте."
            ]
        },
        code: {
            title: "Зміни коду",
            items: [
                "**Ліцензія:** проєкт розповсюджується за [Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International (CC BY-NC-ND 4.0)](https://creativecommons.org/licenses/by-nc-nd/4.0/). Повний юридичний текст — у файлі [`LICENSE`](https://github.com/stegripe/rawon/blob/main/LICENSE) репозиторію.",
                "**Без гарантій:** як зазначено в ліцензії, ми **не несемо відповідальності** за шкоду або збитки від використання коду. Дотримуйтесь умов ліцензії щодо атрибуції, некомерційного використання та обмежень на поширення похідних робіт.",
                "**Атрибуція:** не видавайте цей проєкт за свою оригінальну роботу. Завжди вказуйте посилання на вихідний проєкт."
            ]
        },
        licenseFooterPrefix: "Повний текст ліцензії див. у репозиторії",
        licenseLinkLabel: "LICENSE (CC BY-NC-ND 4.0)"
    },

    permissionCalculator: {
        title: "Калькулятор дозволів",
        clientId: "ID клієнта",
        scope: "Scope",
        redirectUri: "Redirect URI",
        permissions: "Дозволи",
        permissionsNote:
            "Кольорове підсвічування означає, що користувачу OAuth потрібно ввімкнути 2FA, якщо сервер вимагає двофакторну автентифікацію",
        general: "Загальні",
        voice: "Голос",
        text: "Текст",
        result: "Результат",
        resultNote: "Це посилання для додавання бота на сервер"
    },

    common: {
        back: "Назад",
        copy: "Копіювати",
        default: "За замовчуванням",
        required: "Обов’язково",
        optional: "Необов’язково",
        example: "Приклад",
        learnMore: "Докладніше",

        language: "Мова",
        tip: "Порада",
        warning: "Попередження",
        note: "Примітка"
    }
};
