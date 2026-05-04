import type { Translations } from "./en";

export const zhTW: Translations = {
    nav: {
        home: "首頁",
        docs: "文件",
        gettingStarted: "入門",
        configuration: "設定",
        cookiesSetup: "Cookie 設定",
        disclaimers: "免責聲明",
        permissionCalculator: "權限計算機",
        links: "連結"
    },

    home: {
        title: "Rawon",
        description:
            "簡潔而強大的 Discord 音樂（多執行個體）機器人，適合正式環境；開箱即用，無需撰寫程式。",
        invite: "邀請",
        inviteBot: "邀請機器人",
        support: "支援",
        viewDocs: "查看文件"
    },

    gettingStarted: {
        title: "入門",
        subtitle: "依照步驟指南，幾分鐘內即可執行 Rawon。",
        features: {
            title: "✨ 功能",
            items: [
                "🚀 正式環境就緒，無需寫程式",
                "📺 請求頻道，音樂體驗更順暢",
                "🎶 支援 YouTube、Spotify、SoundCloud 與直連檔案",
                "🤖 可為不同語音頻道執行多個機器人實例",
                "⚡ 智慧音訊預先快取，播放更流暢",
                "🍪 內建 Puppeteer Google 登入，方便管理 Cookie"
            ]
        },
        requirements: {
            title: "📋 環境需求",
            nodeVersion: "**Node.js** 版本 `20.0.0` 或更高",
            discordToken:
                "**Discord 機器人權杖**（自 [Discord Developer Portal](https://discord.com/developers/applications) 取得）",
            optional:
                "**選用：** 標準（非 Docker）安裝用於音訊處理的 [FFmpeg](https://ffmpeg.org/) — Docker 映像已包含 FFmpeg"
        },
        standardSetup: {
            title: "💻 標準安裝（Node.js）",
            steps: [
                "下載並安裝上述前置需求",
                "複製或下載此存放庫",
                "將 `.env.example` 複製為 `.env` 並填寫必填值（至少：`DISCORD_TOKEN`）",
                "安裝相依套件：`pnpm install`",
                "建置專案：`pnpm run build`",
                "啟動機器人：`pnpm start`"
            ],
            requestChannel: "（選用）機器人上線後，可設定專用音樂頻道："
        },
        dockerSetup: {
            title: "🐳 Docker 安裝（建議）",
            composeTitle: "使用 Docker Compose",
            composeSteps: [
                "建立 `.env` 設定檔（從 `.env.example` 複製）",
                "（選用）從 `dev.env.example` 建立 `dev.env` 以使用額外設定",
                "建立 `docker-compose.yaml`（見下方範例）",
                "啟動機器人：`docker compose up -d`",
                "查看記錄：`docker logs -f rawon-bot`"
            ],
            runTitle: "使用 docker run",
            volumeInfo: {
                title: "📁 磁區說明",
                description: "`/app/cache` 磁區用來存放：",
                items: [
                    "用於音訊串流的 `yt-dlp` 二進位檔",
                    "持久化設定的 `data.*`（請求頻道、播放器狀態等）",
                    "快取的音訊檔（若啟用音訊快取）",
                    "Google 登入產生的 Cookie 與設定檔資料（請參閱 [Cookie 設定](/docs/cookies-setup)）"
                ]
            },
            portInfo: {
                title: "🔌 連接埠說明",
                description:
                    "`DEVTOOLS_PORT`（預設：`3000`）供 Chrome DevTools 遠端除錯 Proxy 使用。從另一台電腦連線時需要 `!login start`。可在 `dev.env` 設定 `DEVTOOLS_PORT` 變更連接埠，並於 Docker Compose 或 `docker run` 對應對外連接埠。"
            }
        },

        cookiesQuickStart: {
            title: "🍪 Cookie：託管環境快速處理",
            description:
                "在雲端主機（AWS、GCP、Azure、Railway 等）上，你可能會看到 **\"Sign in to confirm you're not a bot\"**。請使用內建登入流程：",
            steps: [
                "在 Discord 執行 `!login start`",
                "開啟機器人傳來的 DevTools URL，於遠端瀏覽器完成 Google 登入",
                "使用 `!login status` 檢查 Cookie，或執行 `!login logout` 後再 `!login start` 重新整理"
            ],
            tip: "💡 請使用**備用 Google 帳號**，不要使用主要帳號。完整說明見 [Cookie 設定](/docs/cookies-setup)。"
        }
    },

    configuration: {
        title: "設定",
        subtitle: "Rawon 的設定檔與環境變數如何搭配運作。",
        overview: {
            title: "📄 設定檔",
            intro: "設定刻意分拆在多個檔案中：",
            items: [
                "**`.env.example`** — 核心設定（Discord/Spotify 權杖、前綴、ID、狀態活動等）。複製為 **`.env`** 並填寫。",
                "**`dev.env.example`** — 選用的開發者設定（前綴／斜線開關、分片、`!login` 的 DevTools 連接埠、Chromium 路徑、偵錯模式）。需要時複製為 **`dev.env`**。",
                "**`setup` 指令** — 機器人專屬選項（嵌入顏色、是／否表情符號、啟動圖、備用前綴、預設音量、選取方式、音訊快取）由 **`setup` 指令**（僅開發者）管理並存入資料庫。使用 `<prefix>setup view` 查看可調整項目。"
            ]
        },
        essential: {
            title: "⚡ 核心設定（`.env`）",
            description:
                "對應 `.env.example`。嚴格來說只需 **`DISCORD_TOKEN`** 即可執行；視需要加入 Spotify、歌詞權杖等。",
            discordToken: {
                name: "DISCORD_TOKEN",
                description:
                    "來自 [Discord Developer Portal](https://discord.com/developers/applications) 的機器人權杖。使用**英文逗號分隔**的多組權杖可啟用多機器人模式。",
                required: true
            },
            spotify: {
                name: "Spotify API",
                description:
                    "於 [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard) 取得並設定 `SPOTIFY_CLIENT_ID` 與 `SPOTIFY_CLIENT_SECRET`。**啟用 Spotify 支援所必需。**",
                required: false
            },
            stegripeLyrics: {
                name: "STEGRIPE_API_LYRICS_TOKEN",
                description:
                    "讓 **`lyrics`** 指令輸出更準確。請向開發者索取存取權。",
                required: false
            },
            mainPrefix: {
                name: "MAIN_PREFIX",
                description: "主指令前綴。例如：`!` 表示輸入 `!play` 播放音樂",
                default: "!"
            },
            mainServer: {
                name: "MAIN_SERVER",
                description:
                    "主要伺服器 ID，用於更快註冊斜線指令。留空則為全域指令（更新最多約需一小時）",
                required: false
            },
            devs: {
                name: "DEVS",
                description:
                    "機器人開發者使用者 ID（逗號分隔）。開發者可使用包含 `setup` 與 `login` 工具在內的特殊指令。",
                required: false
            },
            locale: {
                name: "LOCALE",
                description: "機器人回覆所使用的語言",
                default: "en-US",
                options:
                    "en-US, es-ES, fr-FR, id-ID, zh-CN, zh-TW, uk-UA, vi-VN, pt-BR, ru-RU, ja-JP, tr-TR, ko-KR"
            },
            activityTypes: {
                name: "ACTIVITY_TYPES",
                description:
                    "`ACTIVITIES` 中每一項對應的活動類型（逗號分隔）。數量必須與活動項目一致",
                options: "PLAYING, WATCHING, LISTENING, COMPETING",
                default: "PLAYING"
            },
            activities: {
                name: "ACTIVITIES",
                description:
                    "機器人名稱下方的狀態列（逗號分隔）。預留位置：`{prefix}`、`{userCount}`、`{textChannelCount}`、`{serverCount}`、`{playingCount}`、`{username}`",
                required: false
            }
        },
        multiBot: {
            title: "🔄 多機器人模式",
            description:
                "多機器人模式可自動適應 — **無需額外設定**。單一權杖執行單一實例；**逗號分隔**多組權杖即可自動啟用多機器人。",
            example: "範例：",
            exampleCode: 'DISCORD_TOKEN="token1, token2, token3"',
            features: [
                "**第一個**權杖為處理一般指令的主要機器人",
                "每個機器人為**其所在**語音頻道中的使用者播放音樂",
                "若主要機器人不在某伺服器，可由下一個可用實例接手",
                "每個機器人需要**各自獨立**的 Discord 應用程式"
            ]
        },
        developer: {
            title: "🛠️ 開發者設定（`dev.env`）",
            description:
                "來自 `dev.env.example`。**選用** — 僅在理解用途後再修改。",
            enablePrefix: {
                name: "ENABLE_PREFIX",
                description: "啟用或停用前綴指令（例如 `!play`）",
                default: "yes",
                options: "yes, no"
            },
            enableSlash: {
                name: "ENABLE_SLASH_COMMAND",
                description: "啟用或停用斜線指令（例如 `/play`）",
                default: "yes",
                options: "yes, no"
            },
            enableSharding: {
                name: "ENABLE_SHARDING",
                description: "為大型機器人啟用分片（**僅單權杖模式**）",
                default: "no",
                options: "yes, no"
            },
            devtoolsPort: {
                name: "DEVTOOLS_PORT",
                description:
                    "Chrome DevTools 遠端除錯 Proxy 連接埠。從另一台電腦開啟 DevTools 時供 `!login start` 使用。預設：`3000`",
                default: "3000"
            },
            chromiumPath: {
                name: "CHROMIUM_PATH",
                description: "Google 登入所用的 Chrome/Chromium 路徑。留空則自動偵測",
                required: false
            },
            nodeEnv: {
                name: "NODE_ENV",
                description: "執行時環境模式",
                default: "production",
                options: "production, development"
            },
            debugMode: {
                name: "DEBUG_MODE",
                description: "在主控台輸出詳細偵錯記錄",
                default: "no",
                options: "yes, no"
            }
        }
    },

    cookiesSetup: {
        title: "Cookie 設定",
        subtitle:
            "解決雲端託管上的 \"Sign in to confirm you're not a bot\"。建議：內建 **`!login`** 指令。",
        why: {
            title: "為什麼需要？",
            description:
                "若在 OVHcloud、AWS、GCP、Azure 或其他雲端／VPS 託管 Rawon，你可能會看到：",
            error: "Sign in to confirm you're not a bot",
            explanation:
                "平台常會阻擋來自資料中心 IP 的請求。透過 **Google 帳戶** 驗證後，Rawon 可取得有效 Cookie 並繞過限制。"
        },
        loginMethod: {
            title: "建議：`!login` 指令",
            description:
                "最簡單的方式是使用內建 **`!login`** 流程（透過 Puppeteer 使用真實瀏覽器）：",
            benefits: [
                "✅ 開啟真實瀏覽器完成 Google 登入",
                "✅ 自動匯出並儲存 Cookie",
                "✅ 登入後關閉瀏覽器 — 不留背景程序",
                "✅ 重新啟動後仍可保留（Docker 磁區或 `cache/` 目錄）"
            ]
        },
        commandUsage: {
            title: "指令用法"
        },
        quickStart: {
            title: "快速開始",
            steps: [
                "在 Discord 執行 `!login start`",
                "在本機瀏覽器開啟機器人傳送的 **DevTools URL**",
                "在**遠端**瀏覽器工作階段完成 Google 登入",
                "使用**備用 Google 帳號**登入（不要使用主要帳號）",
                "完成後機器人會儲存 Cookie 並關閉瀏覽器",
                "完成 — 後續請求將使用已儲存的工作階段"
            ]
        },
        staleCookies: {
            title: "若再次出現機器人驗證",
            description: "服務商輪換工作階段時 Cookie 可能失效。此時請：",
            steps: [
                "執行 `!login logout` 清除舊 Cookie 與設定檔資料",
                "再執行 `!login start` 並重新登入以取得新工作階段"
            ]
        },
        prerequisites: {
            title: "前置需求",
            items: [
                "**次要／備用 Google 帳號**（**切勿**使用主要帳號）",
                "**非 Docker：** 主機需安裝 Chrome 或 Chromium",
                "**Docker：** 映像已含 Chromium；遠端使用 `!login` 時請對應 `DEVTOOLS_PORT`（請參閱 [設定](/docs/configuration)）"
            ]
        },
        docker: {
            title: "Docker",
            persistence:
                "Cookie 與設定檔資料保存在命名磁區 **`rawon:/app/cache`**，容器重新啟動後仍會保留。",
            chromium: "映像內建 Chromium，因此 **`!login start`** 在映像端無需額外設定。"
        },
        envVars: {
            title: "環境變數（`dev.env`）",
            intro: "選用微調（請參考 `dev.env.example`）：",
            dockerComposeHint:
                "使用 Docker 時，請在 `docker-compose.yaml` 的 `ports` 中對外公開 DevTools 連接埠，例如："
        },
        duration: {
            title: "Cookie 能用多久？",
            description:
                "服務商輪換工作階段時可能會失效。在下列情況下通常仍有效：",
            conditions: [
                "未以會使工作階段失效的方式登出",
                "未變更帳戶密碼",
                "未在帳戶安全性設定中撤銷工作階段",
                "服務商未標記可疑活動"
            ],
            footer: "Cookie 過期後請執行 `!login logout`，再執行 `!login start`。"
        },
        troubleshooting: {
            title: "疑難排解",
            stillErrors: {
                title: "仍顯示 \"Sign in to confirm you're not a bot\"？",
                steps: [
                    "使用 `!login status` 檢查登入與 Cookie 狀態",
                    "執行 `!login logout` 再 `!login start` 取得全新工作階段"
                ]
            },
            browserWontStart: {
                title: "瀏覽器無法啟動？",
                steps: [
                    "查看 `!login status` 的錯誤詳情",
                    "在實體機安裝 Chrome／Chromium，或在 `dev.env` 設定 `CHROMIUM_PATH`",
                    "在 Docker 中，官方映像通常可直接使用 Chromium"
                ]
            },
            accountSuspended: {
                title: "帳號遭停用？",
                steps: [
                    "建立新的備用 Google 帳號",
                    "執行 `!login logout` 清除舊工作階段",
                    "執行 `!login start` 並以新帳號登入"
                ]
            }
        },
        manualAlternative: {
            title: "備選：手動 Cookie 檔案",
            description:
                "可將 **Netscape 格式** 的 Cookie 檔放在下列路徑。若存在機器人會使用；流程上仍**建議 `!login`**。",
            pathLabel: "路徑"
        },
        security: {
            title: "安全性注意事項",
            warningLabel: "WARNING",
            warnings: [
                "請使用**備用** Google 帳號 — **不要**使用主要帳號",
                "DevTools URL 可存取遠端瀏覽器工作階段 — **請勿公開分享**",
                "Cookie 檔包含**敏感**的驗證資料"
            ]
        }
    },

    disclaimers: {
        title: "免責聲明",
        subtitle: "使用本機器人前請務必詳閱。",
        warningBanner: "重要法律資訊",
        copyright: {
            title: "著作權、DMCA 與智慧財產",
            items: [
                "**權屬：** 機器人使用、播放或展示的任何智慧財產**均非本專案**、維護者或貢獻者所有。包含但不限於指令中使用的音訊、視訊與影像檔。",
                "**託管商政策：** 部分託管商禁止託管或散布受 DMCA 保護的內容，包含播放受著作權音樂／視訊的 Discord 音樂機器人。\n- **於此類平台部署風險自負**",
                "**使用者責任：** 您須對如何使用本機器人以及透過其播放的內容負責。"
            ]
        },
        code: {
            title: "程式碼修改",
            items: [
                "**授權：** 本專案採用 [Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International (CC BY-NC-ND 4.0)](https://creativecommons.org/licenses/by-nc-nd/4.0/) 授權。完整法律文字見存放庫 [`LICENSE`](https://github.com/stegripe/rawon/blob/main/LICENSE) 檔案。",
                "**無擔保：** 依授權條款，我們**不負責**因使用本程式碼造成的損害或損失。請遵循署名、非商業使用及改作散布限制等條款。",
                "**署名：** 不得將本專案宣稱為您的原創作品。請務必正確署名原始專案。"
            ]
        },
        licenseFooterPrefix: "完整授權文字見存放庫",
        licenseLinkLabel: "LICENSE (CC BY-NC-ND 4.0)"
    },

    permissionCalculator: {
        title: "權限計算機",
        clientId: "Client ID",
        scope: "Scope",
        redirectUri: "Redirect URI",
        permissions: "Permissions",
        permissionsNote:
            "彩色表示若伺服器要求 2FA，OAuth 使用者須在帳號啟用兩步驟驗證",
        general: "一般",
        voice: "語音",
        text: "文字",
        result: "結果",
        resultNote: "這是可將機器人新增至伺服器的邀請連結"
    },

    common: {
        back: "返回",
        copy: "複製",
        default: "預設",
        required: "必填",
        optional: "選用",
        example: "範例",
        learnMore: "了解更多",

        language: "語言",
        tip: "提示",
        warning: "警告",
        note: "備註"
    }
};
