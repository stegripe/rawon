export const zhTW = {
    // Navigation
    nav: {
        home: "首頁",
        docs: "文檔",
        gettingStarted: "開始使用",
        configuration: "配置",
        cookiesSetup: "Cookie設置",
        disclaimers: "免責聲明",
        permissionCalculator: "權限計算器",
        links: "連結"
    },

    // Home page
    home: {
        title: "Rawon",
        description: "一個簡單而強大的Discord音樂機器人，滿足您的製作需求。",
        invite: "邀請",
        support: "支援",
        viewDocs: "查看文檔"
    },

    // Getting Started page
    gettingStarted: {
        title: "開始使用",
        subtitle: "按照我們的分步指南，幾分鐘內啟動Rawon。",
        features: {
            title: "功能",
            items: [
                "互動支援（斜線命令和按鈕）",
                "無縫音樂體驗的請求頻道功能",
                "生產就緒，無需編碼",
                "可配置且易於使用",
                "基本音樂命令（play、pause、skip、queue等）",
                "多語言支援"
            ]
        },
        requirements: {
            title: "要求",
            nodeVersion: "Node.js 版本 22.12.0 或更高",
            discordToken: "Discord Bot Token（從Discord開發者入口網站獲取）",
            optional: "可選：Spotify API憑據以支援Spotify"
        },
        standardSetup: {
            title: "標準設置（Node.js）",
            steps: [
                "下載並安裝Node.js版本22.12.0或更高",
                "克隆或下載此倉庫",
                "將.env_example複製為.env並填寫所需值（最少：DISCORD_TOKEN）",
                "安裝依賴：pnpm install",
                "構建項目：pnpm run build",
                "啟動機器人：pnpm start"
            ],
            requestChannel: "（可選）機器人上線後，設置專用音樂頻道："
        },
        dockerSetup: {
            title: "Docker設置（推薦）",
            composeTitle: "使用Docker Compose",
            composeSteps: [
                "創建.env檔案（從.env_example複製）",
                "創建docker-compose.yaml檔案（見下面示例）",
                "啟動機器人：docker compose up -d",
                "查看日誌：docker logs -f rawon-bot"
            ],
            runTitle: "使用Docker Run",
            volumeInfo: {
                title: "卷資訊",
                description: "/app/cache卷存儲：",
                items: [
                    "用於音訊串流的yt-dlp二進制檔案",
                    "用於持久設置的data.json（請求頻道、播放器狀態）",
                    "快取的音訊檔案（如果啟用了音訊快取）"
                ]
            }
        },
        railwaySetup: {
            title: "Railway部署",
            description:
                "Railway每月提供5美元免費額度。只要使用量低於5美元，您的機器人將24/7在線。",
            warning: "重要：部署到Railway之前請閱讀免責聲明。"
        },
        cookiesQuickStart: {
            title: "🍪 快速開始：Cookie設定",
            description:
                "如果您在雲端服務提供商（AWS、GCP、Azure、Railway等）上託管，可能會收到\"Sign in to confirm you're not a bot\"錯誤。使用cookies命令輕鬆修復：",
            steps: [
                "從瀏覽器匯出cookies（請參閱Cookie設定指南）",
                "在Discord中輸入：!cookies add 1",
                "將您的cookies.txt檔案附加到訊息中",
                "完成！Cookie立即生效"
            ],
            tip: "💡 您可以新增多個cookies以實現冗餘。當一個失敗時，Rawon會自動切換到下一個！"
        }
    },

    // Configuration page
    configuration: {
        title: "配置",
        subtitle: "使用這些設置根據您的需求配置Rawon。",
        essential: {
            title: "基本設置",
            description: "這些是運行機器人所需的最低設置。",
            discordToken: {
                name: "DISCORD_TOKEN",
                description: "來自Discord開發者入口網站的Discord機器人令牌",
                required: true
            },
            mainPrefix: {
                name: "MAIN_PREFIX",
                description: "主命令前綴",
                default: "!"
            },
            mainServer: {
                name: "MAIN_SERVER",
                description: "用於斜線命令註冊的主伺服器ID",
                required: false
            },
            locale: {
                name: "LOCALE",
                description: "機器人語言",
                default: "en-US",
                options:
                    "en-US, es-ES, fr-FR, id-ID, zh-CN, zh-TW, uk-UA, vi-VN, pt-BR, ru-RU, ja-JP, tr-TR"
            },
            spotify: {
                name: "Spotify API",
                description: "要支援Spotify，請設置SPOTIFY_CLIENT_ID和SPOTIFY_CLIENT_SECRET"
            }
        },
        optional: {
            title: "可選設置",
            description: "自定義Rawon的行為和外觀。",
            altPrefix: {
                name: "ALT_PREFIX",
                description: "備用前綴（逗號分隔）。使用{mention}表示@bot提及",
                default: "{mention}"
            },
            activities: {
                name: "ACTIVITIES",
                description:
                    "機器人狀態活動（逗號分隔）。格式：{prefix}、{userCount}、{textChannelCount}、{serverCount}、{playingCount}、{username}"
            },
            activityTypes: {
                name: "ACTIVITY_TYPES",
                description: "每個活動的活動類型（逗號分隔）",
                options: "PLAYING、WATCHING、LISTENING、COMPETING"
            },
            embedColor: {
                name: "EMBED_COLOR",
                description: "嵌入顏色（十六進制，不帶#）",
                default: "22C9FF"
            },
            emojis: {
                name: "表情符號",
                description: "自定義成功（YES_EMOJI）和失敗（NO_EMOJI）表情符號",
                defaults: "✅ / ❌"
            },
            musicSelection: {
                name: "MUSIC_SELECTION_TYPE",
                description: "音樂選擇樣式",
                options: "message、selectmenu",
                default: "message"
            },
            audioCache: {
                name: "ENABLE_AUDIO_CACHE",
                description: "[實驗性] 快取下載的音訊以加快重複播放",
                default: "no"
            },
            requestChannelSplash: {
                name: "REQUEST_CHANNEL_SPLASH",
                description: "請求頻道播放器嵌入的自訂圖片URL",
                default: "https://cdn.stegripe.org/images/rawon_splash.png"
            }
        },
        developer: {
            title: "🛠️ 開發者設定",
            description: "機器人開發者的進階設定。只有在您知道自己在做什麼時才使用！",
            devs: {
                name: "DEVS",
                description: "機器人開發者ID（逗號分隔）。開發者可以存取特殊命令"
            },
            enablePrefix: {
                name: "ENABLE_PREFIX",
                description: "啟用/停用前綴命令（如!play）。如果您只想要斜線命令很有用",
                default: "yes",
                options: "yes, no"
            },
            enableSlash: {
                name: "ENABLE_SLASH_COMMAND",
                description: "啟用/停用斜線命令（如/play）。如果您只想要前綴命令很有用",
                default: "yes",
                options: "yes, no"
            },
            debugMode: {
                name: "DEBUG_MODE",
                description: "啟用除錯日誌以進行故障排除。在主控台顯示詳細日誌",
                default: "no",
                options: "yes, no"
            }
        }
    },

    // Cookies Setup page
    cookiesSetup: {
        title: "Cookie設置",
        subtitle: "修復託管提供商上的\"Sign in to confirm you're not a bot\"錯誤。",
        why: {
            title: "為什麼需要這個？",
            description:
                "如果您在OVHcloud、AWS、GCP、Azure或其他託管服務上託管Rawon，可能會遇到錯誤：",
            error: "Sign in to confirm you're not a bot",
            explanation:
                "這是因為平台阻止來自資料中心IP地址的請求。透過使用已登入帳戶的Cookie，您可以繞過此限制。"
        },

        quickMethod: {
            title: "🚀 簡便方法：使用Cookies命令（建議）",
            description: "管理cookies的最簡單方法 - 無需編輯檔案！",
            benefits: [
                "✅ 立即生效 - 無需重啟",
                "✅ 支援多個cookies自動輪換",
                "✅ 當一個cookie失敗時，機器人自動使用下一個",
                "✅ 機器人重啟後cookies仍然保留"
            ],
            commands: {
                title: "📝 可用命令",

            },
            quickStart: {
                title: "⚡ 快速開始（3個步驟）",
                steps: [
                    "從瀏覽器匯出cookies（請參閱下面的指南）",
                    "在Discord中輸入：!cookies add 1 並附加您的cookies.txt檔案",
                    "完成！Cookie現在已啟動"
                ]
            },
            multiCookie: {
                title: "💡 專業提示：新增多個Cookies",
                description: "從不同帳戶新增cookies以獲得更好的可靠性："
            }
        },
        prerequisites: {
            title: "前提條件",
            items: [
                "輔助/一次性帳戶（出於安全原因，請勿使用主帳戶）",
                "網頁瀏覽器（Chrome、Firefox或Edge）",
                "Cookie導出擴充功能",
                "非Docker用戶：Deno JavaScript運行時（yt-dlp簽名解析所需）"
            ]
        },
        steps: {
            title: "分步指南",
            createAccount: {
                title: "步驟1：創建一次性帳戶",
                steps: [
                    "前往帳戶創建頁面",
                    "專門為此機器人創建新帳戶",
                    "重要：不要使用您的個人/主帳戶"
                ]
            },
            login: {
                title: "步驟2：登入平台",
                steps: [
                    "打開瀏覽器",
                    "前往平台（視頻平台）",
                    "使用一次性帳戶登入",
                    "如有提示，接受條款"
                ]
            },
            extension: {
                title: "步驟3：安裝Cookie導出擴充功能",
                chrome: "Chrome/Edge：安裝\"Get cookies.txt LOCALLY\"或\"cookies.txt\"",
                firefox: "Firefox：安裝\"cookies.txt\""
            },
            exportCookies: {
                title: "步驟4：導出Cookie",
                steps: [
                    "確保您在平台網站上",
                    "點擊瀏覽器工具列中的Cookie擴充功能圖示",
                    "選擇\"Export\"或\"Export cookies for this site\"",
                    "將檔案儲存為cookies.txt"
                ]
            },
            upload: {
                title: "步驟5：上傳到伺服器",
                steps: [
                    "如果不存在，在Rawon目錄中創建cache資料夾",
                    "將cookies.txt檔案上傳到cache資料夾",
                    "路徑應為：./cache/cookies.txt"
                ]
            }
        },
        troubleshooting: {
            title: "🔧 故障排除",
            stillGettingErrors: {
                title: "仍然收到\"Sign in to confirm you're not a bot\"錯誤？",
                steps: [
                    "使用`!cookies list`檢查cookie狀態",
                    "如果cookie顯示**Failed**，嘗試`!cookies reset`重試",
                    "從不同帳戶新增更多cookies以實現冗餘"
                ]
            },
            allCookiesFailed: {
                title: "所有cookies都失敗了？",
                steps: [
                    "建立新的一次性帳戶",
                    "匯出新的cookies",
                    "使用!cookies add <編號>新增它們"
                ]
            },
            accountSuspended: {
                title: "帳戶被暫停？",
                steps: [
                    "這可能發生在大量使用的情況下",
                    "只需建立一個新的一次性帳戶",
                    "匯出新cookies並新增它們"
                ]
            }
        },
        duration: {
            title: "Cookie能持續多久？",
            description: "好消息：平台Cookie不會定期過期。只要滿足以下條件，它們將保持有效：",
            conditions: [
                "不在瀏覽器中登出平台",
                "不更改帳戶密碼",
                "不從帳戶設置中撤銷工作階段",
                "平台未檢測到可疑活動"
            ],
            tips: "實際上，如果遵循最佳實踐，Cookie可以持續數月甚至數年。"
        },
        security: {
            title: "安全注意事項",
            warnings: [
                "切勿與任何人分享您的Cookie檔案",
                "使用一次性帳戶，而非主帳戶",
                "Cookie檔案包含敏感認證資料",
                "將cookies.txt添加到.gitignore以防止意外提交"
            ]
        }
    },

    // Disclaimers page
    disclaimers: {
        title: "免責聲明",
        subtitle: "使用此機器人前請仔細閱讀。",
        warningBanner: "重要法律資訊",
        copyright: {
            title: "版權、DMCA和智慧財產權",
            items: [
                "所有權：機器人使用、播放或顯示的任何智慧財產權均非我們、維護者或任何貢獻者所有。這包括但不限於機器人命令中使用的音訊、視訊和圖像檔案。",
                "託管提供商政策：某些託管提供商（如Railway）禁止託管或分發受DMCA保護的內容。這包括播放受版權保護的音樂/視訊的Discord音樂機器人。在此類平台上部署需自行承擔風險。",
                "用戶責任：您對如何使用此機器人以及透過它播放的內容負責。"
            ]
        },
        code: {
            title: "程式碼修改",
            items: [
                "授權：此機器人是開源的，可以在AGPL-3.0授權下修改和重新分發。",
                "無保證：如授權所述，我們對因修改、重新分發或使用此程式碼而造成的任何損害或損失不承擔責任。",
                "歸屬：切勿聲稱此專案是您的原創作品。請始終對原始專案給予適當歸屬。"
            ]
        }
    },

    // Permission Calculator page
    permissionCalculator: {
        title: "權限計算器",
        clientId: "客戶端ID",
        scope: "範圍",
        redirectUri: "重定向URI",
        permissions: "權限",
        permissionsNote: "彩色表示如果伺服器需要2FA，OAuth用戶需要在其帳戶上啟用2FA",
        general: "常規",
        voice: "語音",
        text: "文字",
        result: "結果",
        resultNote: "這是您可以用來將機器人添加到伺服器的連結"
    },

    // Common
    common: {
        back: "返回",
        copy: "複製",
        default: "預設",
        required: "必需",
        optional: "可選",
        example: "示例",
        learnMore: "了解更多",
        deployOnRailway: "部署到Railway",
        language: "語言",
        tip: "提示",
        warning: "警告",
        note: "注意"
    }
};
