import type { Translations } from "./en";

export const zhCN: Translations = {
    nav: {
        home: "首页",
        docs: "文档",
        gettingStarted: "入门",
        configuration: "配置",
        cookiesSetup: "Cookie 设置",
        disclaimers: "免责声明",
        permissionCalculator: "权限计算器",
        links: "链接"
    },

    home: {
        title: "Rawon",
        description:
            "简洁而强大的 Discord 音乐（多实例）机器人，面向生产环境；开箱即用，无需编写代码。",
        invite: "邀请",
        inviteBot: "邀请机器人",
        support: "支持",
        viewDocs: "查看文档"
    },

    gettingStarted: {
        title: "入门",
        subtitle: "按照分步指南，几分钟内即可运行 Rawon。",
        features: {
            title: "✨ 功能",
            items: [
                "🚀 生产就绪，无需编程",
                "📺 请求频道，音乐体验更顺滑",
                "🎶 支持 YouTube、Spotify、SoundCloud 与直链文件",
                "🤖 可为不同语音频道运行多个机器人实例",
                "⚡ 智能音频预缓存，播放更流畅",
                "🍪 内置 Puppeteer Google 登录，便于管理 Cookie"
            ]
        },
        requirements: {
            title: "📋 环境要求",
            nodeVersion: "**Node.js** 版本 `20.0.0` 或更高",
            discordToken:
                "**Discord 机器人令牌**（从 [Discord Developer Portal](https://discord.com/developers/applications) 获取）",
            optional:
                "**可选：** 标准（非 Docker）安装用于音频处理的 [FFmpeg](https://ffmpeg.org/) — Docker 镜像已包含 FFmpeg"
        },
        standardSetup: {
            title: "💻 标准安装（Node.js）",
            steps: [
                "下载并安装上述前置条件",
                "克隆或下载本仓库",
                "将 `.env.example` 复制为 `.env` 并填写必填项（至少：`DISCORD_TOKEN`）",
                "安装依赖：`pnpm install`",
                "构建项目：`pnpm run build`",
                "启动机器人：`pnpm start`"
            ],
            requestChannel: "（可选）机器人上线后，可设置专用音乐频道："
        },
        dockerSetup: {
            title: "🐳 Docker 安装（推荐）",
            composeTitle: "使用 Docker Compose",
            composeSteps: [
                "创建 `.env` 配置文件（从 `.env.example` 复制）",
                "（可选）从 `dev.env.example` 创建 `dev.env` 以使用额外设置",
                "创建 `docker-compose.yaml`（见下方示例）",
                "启动机器人：`docker compose up -d`",
                "查看日志：`docker logs -f rawon-bot`"
            ],
            runTitle: "使用 docker run",
            volumeInfo: {
                title: "📁 卷说明",
                description: "`/app/cache` 卷用于存放：",
                items: [
                    "用于音频流的 `yt-dlp` 二进制",
                    "持久化设置的 `data.*`（请求频道、播放器状态等）",
                    "缓存的音频文件（若启用音频缓存）",
                    "Google 登录产生的 Cookie 与用户配置数据（参见 [Cookie 设置](/docs/cookies-setup)）"
                ]
            },
            portInfo: {
                title: "🔌 端口说明",
                description:
                    "`DEVTOOLS_PORT`（默认：`3000`）用于 Chrome DevTools 远程调试代理。从另一台机器连接时需要 `!login start`。可在 `dev.env` 中设置 `DEVTOOLS_PORT` 更换端口，并在 Docker Compose 或 `docker run` 中映射。"
            }
        },

        cookiesQuickStart: {
            title: "🍪 Cookie：托管环境快速处理",
            description:
                "在云主机（AWS、GCP、Azure、Railway 等）上，你可能会看到 **\"Sign in to confirm you're not a bot\"**。请使用内置登录流程：",
            steps: [
                "在 Discord 中执行 `!login start`",
                "打开机器人发来的 DevTools URL，在远程浏览器中完成 Google 登录",
                "使用 `!login status` 检查 Cookie，或执行 `!login logout` 后再 `!login start` 刷新"
            ],
            tip: "💡 请使用**备用 Google 账号**，不要用主账号。完整说明见 [Cookie 设置](/docs/cookies-setup)。"
        }
    },

    configuration: {
        title: "配置",
        subtitle: "Rawon 的配置文件与环境变量如何协同工作。",
        overview: {
            title: "📄 配置文件",
            intro: "设置有意拆分到多个文件中：",
            items: [
                "**`.env.example`** — 核心设置（Discord/Spotify 令牌、前缀、ID、状态活动等）。复制为 **`.env`** 并填写。",
                "**`dev.env.example`** — 可选开发者设置（前缀/斜杠开关、分片、`!login` 的 DevTools 端口、Chromium 路径、调试模式）。需要时复制为 **`dev.env`**。",
                "**`setup` 命令** — 机器人专属选项（嵌入颜色、是/否表情、启动图、备用前缀、默认音量、选择方式、音频缓存）由 **`setup` 命令**（仅开发者）管理并存入数据库。使用 `<prefix>setup view` 查看可配置项。"
            ]
        },
        essential: {
            title: "⚡ 核心设置（`.env`）",
            description:
                "与 `.env.example` 对应。严格来说只需 **`DISCORD_TOKEN`** 即可运行；按需添加 Spotify、歌词令牌等。",
            discordToken: {
                name: "DISCORD_TOKEN",
                description:
                    "来自 [Discord Developer Portal](https://discord.com/developers/applications) 的机器人令牌。使用**英文逗号分隔**的多个令牌可启用多机器人模式。",
                required: true
            },
            spotify: {
                name: "Spotify API",
                description:
                    "在 [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard) 获取并设置 `SPOTIFY_CLIENT_ID` 与 `SPOTIFY_CLIENT_SECRET`。**启用 Spotify 支持所必需。**",
                required: false
            },
            stegripeLyrics: {
                name: "STEGRIPE_API_LYRICS_TOKEN",
                description:
                    "用于 **`lyrics`** 命令输出更准确的结果。请联系开发者获取。",
                required: false
            },
            mainPrefix: {
                name: "MAIN_PREFIX",
                description: "主命令前缀。例如：`!` 表示输入 `!play` 播放音乐",
                default: "!"
            },
            mainServer: {
                name: "MAIN_SERVER",
                description:
                    "主服务器 ID，用于更快注册斜杠命令。留空则为全局命令（更新最多可能需要约一小时）",
                required: false
            },
            devs: {
                name: "DEVS",
                description:
                    "机器人开发者用户 ID（逗号分隔）。开发者可使用包括 `setup` 与 `login` 工具在内的特殊命令。",
                required: false
            },
            locale: {
                name: "LOCALE",
                description: "机器人回复所使用的语言",
                default: "en-US",
                options:
                    "en-US, es-ES, fr-FR, id-ID, zh-CN, zh-TW, uk-UA, vi-VN, pt-BR, ru-RU, ja-JP, tr-TR, ko-KR"
            },
            activityTypes: {
                name: "ACTIVITY_TYPES",
                description:
                    "`ACTIVITIES` 中每项对应的活动类型（逗号分隔）。数量必须与活动条目一致",
                options: "PLAYING, WATCHING, LISTENING, COMPETING",
                default: "PLAYING"
            },
            activities: {
                name: "ACTIVITIES",
                description:
                    "机器人名称下方的状态行（逗号分隔）。占位符：`{prefix}`、`{userCount}`、`{textChannelCount}`、`{serverCount}`、`{playingCount}`、`{username}`",
                required: false
            }
        },
        multiBot: {
            title: "🔄 多机器人模式",
            description:
                "多机器人模式可自适应 — **无需额外配置**。单个令牌运行单实例；**逗号分隔**多个令牌即可自动启用多机器人。",
            example: "示例：",
            exampleCode: 'DISCORD_TOKEN="token1, token2, token3"',
            features: [
                "**第一个**令牌作为主机器人处理通用命令",
                "每个机器人为**其所在**语音频道中的用户播放音乐",
                "若主机器人不在某服务器，可由下一个可用实例接管",
                "每个机器人需要**各自独立**的 Discord 应用程序"
            ]
        },
        developer: {
            title: "🛠️ 开发者设置（`dev.env`）",
            description:
                "来自 `dev.env.example`。**可选** — 仅在理解含义后再修改。",
            enablePrefix: {
                name: "ENABLE_PREFIX",
                description: "启用或禁用前缀命令（例如 `!play`）",
                default: "yes",
                options: "yes, no"
            },
            enableSlash: {
                name: "ENABLE_SLASH_COMMAND",
                description: "启用或禁用斜杠命令（例如 `/play`）",
                default: "yes",
                options: "yes, no"
            },
            enableSharding: {
                name: "ENABLE_SHARDING",
                description: "为大型机器人启用分片（**仅单令牌模式**）",
                default: "no",
                options: "yes, no"
            },
            devtoolsPort: {
                name: "DEVTOOLS_PORT",
                description:
                    "Chrome DevTools 远程调试代理端口。从另一台机器打开 DevTools 时供 `!login start` 使用。默认：`3000`",
                default: "3000"
            },
            chromiumPath: {
                name: "CHROMIUM_PATH",
                description: "Google 登录所用的 Chrome/Chromium 路径。留空则自动检测",
                required: false
            },
            nodeEnv: {
                name: "NODE_ENV",
                description: "运行时环境模式",
                default: "production",
                options: "production, development"
            },
            debugMode: {
                name: "DEBUG_MODE",
                description: "在控制台输出详细调试日志",
                default: "no",
                options: "yes, no"
            }
        }
    },

    cookiesSetup: {
        title: "Cookie 设置",
        subtitle:
            "解决云托管上的 \"Sign in to confirm you're not a bot\"。推荐：内置 **`!login`** 命令。",
        why: {
            title: "为什么需要？",
            description:
                "若在 OVHcloud、AWS、GCP、Azure 或其他云/VPS 上托管 Rawon，你可能会看到：",
            error: "Sign in to confirm you're not a bot",
            explanation:
                "平台常会拦截来自数据中心 IP 的请求。使用 **Google 账户** 登录后，Rawon 可获取有效 Cookie 并绕过限制。"
        },
        loginMethod: {
            title: "推荐：`!login` 命令",
            description:
                "最简单的做法是使用内置 **`!login`** 流程（通过 Puppeteer 使用真实浏览器）：",
            benefits: [
                "✅ 打开真实浏览器完成 Google 登录",
                "✅ 自动导出并保存 Cookie",
                "✅ 登录后关闭浏览器 — 不留后台进程",
                "✅ 重启后仍可保留（Docker 卷或 `cache/` 目录）"
            ]
        },
        commandUsage: {
            title: "命令用法"
        },
        quickStart: {
            title: "快速开始",
            steps: [
                "在 Discord 中运行 `!login start`",
                "在本地浏览器打开机器人发送的 **DevTools URL**",
                "在**远程**浏览器会话中完成 Google 登录",
                "使用**备用 Google 账号**登录（不要用主账号）",
                "完成后机器人会保存 Cookie 并关闭浏览器",
                "完成 — 后续请求将使用已保存的会话"
            ]
        },
        staleCookies: {
            title: "若再次出现人机验证",
            description: "服务商轮换会话时 Cookie 可能失效。此时请：",
            steps: [
                "运行 `!login logout` 清除旧 Cookie 与用户数据",
                "再运行 `!login start` 并重新登录以获得新会话"
            ]
        },
        prerequisites: {
            title: "前置条件",
            items: [
                "**次要 / 备用 Google 账号**（**切勿**使用主账号）",
                "**非 Docker：** 主机需安装 Chrome 或 Chromium",
                "**Docker：** 镜像已含 Chromium；远程使用 `!login` 时请映射 `DEVTOOLS_PORT`（参见 [配置](/docs/configuration)）"
            ]
        },
        docker: {
            title: "Docker",
            persistence:
                "Cookie 与用户数据保存在命名卷 **`rawon:/app/cache`** 中，容器重启后仍会保留。",
            chromium: "镜像自带 Chromium，因此 **`!login start`** 在镜像侧无需额外配置。"
        },
        envVars: {
            title: "环境变量（`dev.env`）",
            intro: "可选调优（参见 `dev.env.example`）：",
            dockerComposeHint:
                "使用 Docker 时，请在 `docker-compose.yaml` 的 `ports` 中暴露 DevTools 端口，例如："
        },
        duration: {
            title: "Cookie 能用多久？",
            description:
                "服务商轮换会话时可能会失效。在以下情况下通常仍有效：",
            conditions: [
                "未以会作废会话的方式退出登录",
                "未更改账户密码",
                "未在账户安全设置中撤销会话",
                "服务商未标记可疑活动"
            ],
            footer: "Cookie 过期后请运行 `!login logout`，再执行 `!login start`。"
        },
        troubleshooting: {
            title: "故障排除",
            stillErrors: {
                title: "仍显示 \"Sign in to confirm you're not a bot\"？",
                steps: [
                    "使用 `!login status` 检查登录与 Cookie 状态",
                    "运行 `!login logout` 再 `!login start` 获取全新会话"
                ]
            },
            browserWontStart: {
                title: "浏览器无法启动？",
                steps: [
                    "查看 `!login status` 中的错误详情",
                    "在实体机上安装 Chrome/Chromium，或在 `dev.env` 中设置 `CHROMIUM_PATH`",
                    "在 Docker 中，官方镜像通常可直接使用 Chromium"
                ]
            },
            accountSuspended: {
                title: "账号被停用？",
                steps: [
                    "新建备用 Google 账号",
                    "运行 `!login logout` 清除旧会话",
                    "运行 `!login start` 并用新账号登录"
                ]
            }
        },
        manualAlternative: {
            title: "备选：手动 Cookie 文件",
            description:
                "可将 **Netscape 格式** 的 Cookie 文件放在下方路径。若存在机器人会使用；流程上仍**推荐 `!login`**。",
            pathLabel: "路径"
        },
        security: {
            title: "安全提示",
            warningLabel: "WARNING",
            warnings: [
                "请使用**备用** Google 账号 — **不要**使用主账号",
                "DevTools URL 可访问远程浏览器会话 — **请勿公开分享**",
                "Cookie 文件包含**敏感**的身份验证数据"
            ]
        }
    },

    disclaimers: {
        title: "免责声明",
        subtitle: "使用本机器人前请仔细阅读。",
        warningBanner: "重要法律信息",
        copyright: {
            title: "版权、DMCA 与知识产权",
            items: [
                "**权属：** 机器人使用、播放或展示的任何知识产权**均不属于我们**、维护者或贡献者。包括但不限于命令中使用的音频、视频与图像文件。",
                "**托管商政策：** 部分托管商禁止托管或分发受 DMCA 保护的内容，包括播放受版权音乐/视频的 Discord 音乐机器人。\n- **在此类平台部署风险自负**",
                "**用户责任：** 您对如何使用本机器人以及通过其播放的内容负责。"
            ]
        },
        code: {
            title: "代码修改",
            items: [
                "**许可：** 本项目采用 [Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International (CC BY-NC-ND 4.0)](https://creativecommons.org/licenses/by-nc-nd/4.0/) 许可。完整法律文本见仓库 [`LICENSE`](https://github.com/stegripe/rawon/blob/main/LICENSE) 文件。",
                "**无担保：** 许可条款声明，我们**不对**使用本代码造成的损害或损失负责。请遵守署名、非商业使用及改编作品传播限制等条款。",
                "**署名：** 不得将本项目宣称为您的原创作品。请始终正确署名原始项目。"
            ]
        },
        licenseFooterPrefix: "完整许可文本见仓库",
        licenseLinkLabel: "LICENSE (CC BY-NC-ND 4.0)"
    },

    permissionCalculator: {
        title: "权限计算器",
        clientId: "Client ID",
        scope: "Scope",
        redirectUri: "Redirect URI",
        permissions: "Permissions",
        permissionsNote:
            "彩色表示若服务器要求 2FA，OAuth 用户需在账号上启用两步验证",
        general: "常规",
        voice: "语音",
        text: "文字",
        result: "结果",
        resultNote: "这是可将机器人添加到服务器的邀请链接"
    },

    common: {
        back: "返回",
        copy: "复制",
        default: "默认",
        required: "必填",
        optional: "可选",
        example: "示例",
        learnMore: "了解更多",

        language: "语言",
        tip: "提示",
        warning: "警告",
        note: "说明"
    }
};
