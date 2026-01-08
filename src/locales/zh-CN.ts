export const zhCN = {
    nav: {
        home: "首页",
        docs: "文档",
        gettingStarted: "开始使用",
        configuration: "配置",
        cookiesSetup: "Cookie设置",
        disclaimers: "免责声明",
        permissionCalculator: "权限计算器",
        links: "链接"
    },

    home: {
        title: "Rawon",
        description: "一个简单而强大的Discord音乐机器人，满足您的制作需求。",
        invite: "邀请",
        inviteBot: "邀请机器人",
        support: "支持",
        viewDocs: "查看文档"
    },

    gettingStarted: {
        title: "开始使用",
        subtitle: "按照我们的分步指南，几分钟内启动Rawon。",
        features: {
            title: "功能",
            items: [
                "🚀 生产就绪，无需编码",
                "📺 无缝音乐体验的请求频道功能",
                "🤖 为不同语音频道运行多个机器人实例",
                "⚡ 智能音频预缓存，播放更流畅",
                "🎶 支持多个音乐平台（视频网站、Spotify、SoundCloud）",
                "🔄 多Cookie轮换，不间断播放"
            ]
        },
        requirements: {
            title: "要求",
            nodeVersion: "Node.js 版本 22.12.0 或更高",
            discordToken: "Discord Bot Token（从[Discord开发者门户](https://discord.com/developers/applications)获取）",
            optional: "可选：Spotify API凭据以支持Spotify"
        },
        standardSetup: {
            title: "标准设置（Node.js）",
            steps: [
                "下载并安装Node.js版本22.12.0或更高",
                "克隆或下载此仓库",
                "将.env.example复制为.env并填写所需值（最少：DISCORD_TOKEN）",
                "安装依赖：pnpm install",
                "构建项目：pnpm run build",
                "启动机器人：pnpm start"
            ],
            requestChannel: "（可选）机器人上线后，设置专用音乐频道："
        },
        dockerSetup: {
            title: "Docker设置（推荐）",
            composeTitle: "使用Docker Compose",
            composeSteps: [
                "创建.env文件（从.env.example复制）",
                "创建docker-compose.yaml文件（见下面示例）",
                "启动机器人：docker compose up -d",
                "查看日志：docker logs -f rawon-bot"
            ],
            runTitle: "使用Docker Run",
            volumeInfo: {
                title: "卷信息",
                description: "/app/cache卷存储：",
                items: [
                    "用于音频流的yt-dlp二进制文件",
                    "用于持久设置的data.*（请求频道、播放器状态）",
                    "缓存的音频文件（如果启用了音频缓存）",
                    "用于视频平台认证的Cookie文件"
                ]
            }
        },

        cookiesQuickStart: {
            title: "🍪 快速开始：Cookie设置",
            description:
                "如果您在云服务提供商（AWS、GCP、Azure、Railway等）上托管，可能会收到\"Sign in to confirm you're not a bot\"错误。使用cookies命令轻松修复：",
            steps: [
                "从浏览器导出cookies（请参阅[Cookie设置指南](/docs/cookies-setup)）",
                "在Discord中输入：`!cookies add 1`",
                "将您的`cookies.txt`文件附加到消息中",
                "完成！Cookie立即生效"
            ],
            tip: "💡 您可以添加多个cookies以实现冗余。当一个失败时，Rawon会自动切换到下一个！"
        }
    },

    configuration: {
        title: "配置",
        subtitle: "使用这些设置根据您的需求配置Rawon。",
        essential: {
            title: "基本设置",
            description: "这些是运行机器人所需的最低设置。",
            discordToken: {
                name: "DISCORD_TOKEN",
                description: "来自[Discord开发者门户](https://discord.com/developers/applications)的Discord机器人令牌",
                required: true
            },
            mainPrefix: {
                name: "MAIN_PREFIX",
                description: "主命令前缀",
                default: "!"
            },
            mainServer: {
                name: "MAIN_SERVER",
                description: "用于斜杠命令注册的主服务器ID",
                required: false
            },
            locale: {
                name: "LOCALE",
                description: "机器人语言",
                default: "en-US",
                options:
                    "en-US, es-ES, fr-FR, id-ID, zh-CN, zh-TW, uk-UA, vi-VN, pt-BR, ru-RU, ja-JP, tr-TR"
            },
            spotify: {
                name: "Spotify API",
                description: "要支持Spotify，请从[developer.spotify.com/dashboard](https://developer.spotify.com/dashboard)获取凭据并设置`SPOTIFY_CLIENT_ID`和`SPOTIFY_CLIENT_SECRET`"
            }
        },
        optional: {
            title: "可选设置",
            description: "自定义Rawon的行为和外观。",
            altPrefix: {
                name: "ALT_PREFIX",
                description: "备用前缀（逗号分隔）。使用{mention}表示@bot提及",
                default: "{mention}"
            },
            activities: {
                name: "ACTIVITIES",
                description:
                    "机器人状态活动（逗号分隔）。格式：{prefix}、{userCount}、{textChannelCount}、{serverCount}、{playingCount}、{username}"
            },
            activityTypes: {
                name: "ACTIVITY_TYPES",
                description: "每个活动的活动类型（逗号分隔）",
                options: "PLAYING、WATCHING、LISTENING、COMPETING"
            },
            embedColor: {
                name: "EMBED_COLOR",
                description: "嵌入颜色（十六进制，不带#）",
                default: "22C9FF"
            },
            emojis: {
                name: "(EMOJIS)",
                description: "自定义成功（YES_EMOJI）和失败（NO_EMOJI）表情符号",
                defaults: "✅ / ❌"
            },
            musicSelection: {
                name: "MUSIC_SELECTION_TYPE",
                description: "音乐选择样式",
                options: "message、selectmenu",
                default: "message"
            },
            audioCache: {
                name: "ENABLE_AUDIO_CACHE",
                description: "缓存下载的音频以加快重复播放",
                default: "yes"
            },
            requestChannelSplash: {
                name: "REQUEST_CHANNEL_SPLASH",
                description: "请求频道播放器嵌入的自定义图片URL",
                default: "https://cdn.stegripe.org/images/rawon_splash.png"
            }
        },
        developer: {
            title: "🛠️ 开发者设置",
            description: "机器人开发者的高级设置。只有在您知道自己在做什么时才使用！",
            devs: {
                name: "DEVS",
                description: "机器人开发者ID（逗号分隔）。开发者可以访问特殊命令"
            },
            enablePrefix: {
                name: "ENABLE_PREFIX",
                description: "启用/禁用前缀命令（如!play）。如果您只想要斜杠命令很有用",
                default: "yes",
                options: "yes, no"
            },
            enableSlash: {
                name: "ENABLE_SLASH_COMMAND",
                description: "启用/禁用斜杠命令（如/play）。如果您只想要前缀命令很有用",
                default: "yes",
                options: "yes, no"
            },
            debugMode: {
                name: "DEBUG_MODE",
                description: "启用调试日志以进行故障排除。在控制台显示详细日志",
                default: "no",
                options: "yes, no"
            }
        }
    },

    cookiesSetup: {
        title: "Cookie设置",
        subtitle: "修复托管提供商上的\"Sign in to confirm you're not a bot\"错误。",
        why: {
            title: "为什么需要这个？",
            description:
                "如果您在OVHcloud、AWS、GCP、Azure或其他托管服务上托管Rawon，可能会遇到错误：",
            error: "Sign in to confirm you're not a bot",
            explanation:
                "这是因为平台阻止来自数据中心IP地址的请求。通过使用已登录账户的Cookie，您可以绕过此限制。"
        },

        quickMethod: {
            title: "🚀 简便方法：使用Cookies命令（推荐）",
            description: "管理cookies的最简单方法 - 无需编辑文件！",
            benefits: [
                "✅ 立即生效 - 无需重启",
                "✅ 支持多个cookies自动轮换",
                "✅ 当一个cookie失败时，机器人自动使用下一个",
                "✅ 机器人重启后cookies仍然保留"
            ],
            commands: {
                title: "📝 可用命令",

            },
            quickStart: {
                title: "⚡ 快速开始（3个步骤）",
                steps: [
                    "从浏览器导出cookies（请参阅下面的指南）",
                    "在Discord中输入：!cookies add 1 并附加您的cookies.txt文件",
                    "完成！Cookie现在已激活"
                ]
            },
            multiCookie: {
                title: "💡 专业提示：添加多个Cookies",
                description: "从不同账户添加cookies以获得更好的可靠性："
            }
        },
        prerequisites: {
            title: "前提条件",
            items: [
                "辅助/一次性账户（出于安全原因，请勿使用主账户）",
                "网络浏览器（Chrome、Firefox或Edge）",
                "Cookie导出扩展",
                "非Docker用户：Deno JavaScript运行时（yt-dlp签名解析所需）"
            ]
        },
        steps: {
            title: "📖 如何导出Cookie",
            createAccount: {
                title: "步骤1：创建一次性账户",
                steps: [
                    "前往[账户创建页面](https://accounts.google.com/signup)",
                    "专门为此机器人创建新账户",
                    "⚠️ 重要：绝对不要使用您的个人/主账户！"
                ]
            },
            login: {
                title: "步骤2：登录视频平台",
                steps: [
                    "打开浏览器",
                    "前往[视频平台](https://youtube.com)",
                    "使用一次性账户登录",
                    "如有提示，接受条款"
                ]
            },
            extension: {
                title: "步骤3：安装Cookie导出扩展",
                chrome: "Chrome/Edge：从Chrome Web Store安装[**Get cookies.txt LOCALLY**](https://chromewebstore.google.com/detail/get-cookiestxt-locally/cclelndahbckbenkjhflpdbgdldlbecc)（推荐）",
                firefox: "Firefox：从Firefox Add-ons安装[**cookies.txt**](https://addons.mozilla.org/en-US/firefox/addon/cookies-txt/)"
            },
            exportCookies: {
                title: "步骤4：导出Cookie",
                steps: [
                    "确保您在[视频平台网站](https://youtube.com)上",
                    "点击浏览器工具栏中的Cookie扩展图标",
                    "选择**Export**或**Export cookies for this site**",
                    "将文件保存为`cookies.txt`"
                ]
            },
            upload: {
                title: "步骤5：添加到Rawon",
                steps: [
                    "前往Rawon可以看到您消息的任何频道",
                    "输入：`!cookies add 1`",
                    "将cookies.txt文件附加到消息并发送",
                    "Rawon会确认cookie已添加！"
                ]
            }
        },
        troubleshooting: {
            title: "🔧 故障排除",
            stillGettingErrors: {
                title: "仍然收到\"Sign in to confirm you're not a bot\"错误？",
                steps: [
                    "使用`!cookies list`检查cookie状态",
                    "如果cookie显示**Failed**，尝试`!cookies reset`重试",
                    "从不同账户添加更多cookies以实现冗余"
                ]
            },
            allCookiesFailed: {
                title: "所有cookies都失败了？",
                steps: [
                    "创建新的一次性账户",
                    "导出新的cookies",
                    "使用!cookies add <编号>添加它们"
                ]
            },
            accountSuspended: {
                title: "账户被暂停？",
                steps: [
                    "这可能发生在大量使用的情况下",
                    "只需创建一个新的一次性账户",
                    "导出新cookies并添加它们"
                ]
            }
        },
        duration: {
            title: "Cookie能持续多久？",
            description: "好消息：平台Cookie不会定期过期。只要满足以下条件，它们将保持有效：",
            conditions: [
                "不在浏览器中登出平台",
                "不更改账户密码",
                "不从账户设置中撤销会话",
                "平台未检测到可疑活动"
            ],
            tips: "实际上，如果遵循最佳实践，Cookie可以持续数月甚至数年。"
        },
        security: {
            title: "🔒 安全注意事项",
            warnings: [
                "⚠️ 切勿与任何人分享您的Cookie文件",
                "⚠️ 使用一次性账户，而非主账户",
                "⚠️ Cookie文件包含敏感认证数据"
            ]
        }
    },

    disclaimers: {
        title: "免责声明",
        subtitle: "使用此机器人前请仔细阅读。",
        warningBanner: "重要法律信息",
        copyright: {
            title: "版权、DMCA和知识产权",
            items: [
                "**所有权：** 机器人使用、播放或显示的任何知识产权均非我们、维护者或任何贡献者所有。这包括但不限于机器人命令中使用的音频、视频和图像文件。",
                "**托管提供商政策：** 某些托管提供商禁止托管或分发受DMCA保护的内容。这包括播放受版权保护的音乐/视频的Discord音乐机器人。在此类平台上部署需自行承担风险。",
                "**用户责任：** 您对如何使用此机器人以及通过它播放的内容负责。"
            ]
        },
        code: {
            title: "代码修改",
            items: [
                "**许可证：** 此机器人是开源的，可以在**AGPL-3.0**许可证下修改和重新分发。",
                "**无保证：** 如许可证所述，我们对因修改、重新分发或使用此代码而造成的任何损害或损失不承担责任。",
                "**归属：** 切勿声称此项目是您的原创作品。请始终对原始项目给予适当归属。"
            ]
        }
    },

    permissionCalculator: {
        title: "权限计算器",
        clientId: "客户端ID",
        scope: "范围",
        redirectUri: "重定向URI",
        permissions: "权限",
        permissionsNote: "彩色表示如果服务器需要2FA，OAuth用户需要在其账户上启用2FA",
        general: "常规",
        voice: "语音",
        text: "文字",
        result: "结果",
        resultNote: "这是您可以用来将机器人添加到服务器的链接"
    },

    common: {
        back: "返回",
        copy: "复制",
        default: "默认",
        required: "必需",
        optional: "可选",
        example: "示例",
        learnMore: "了解更多",

        language: "语言",
        tip: "提示",
        warning: "警告",
        note: "注意"
    }
};
