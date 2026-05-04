import type { Translations } from "./en";

export const vi: Translations = {
    nav: {
        home: "Trang chủ",
        docs: "Tài liệu",
        gettingStarted: "Bắt đầu",
        configuration: "Cấu hình",
        cookiesSetup: "Thiết lập cookie",
        disclaimers: "Tuyên bố miễn trừ",
        permissionCalculator: "Tính quyền OAuth",
        links: "Liên kết"
    },

    home: {
        title: "Rawon",
        description:
            "Bot nhạc Discord đơn giản nhưng mạnh mẽ (hỗ trợ nhiều instance), giúp bạn triển khai production dễ dàng — dùng được ngay, không cần viết code.",
        invite: "Mời",
        inviteBot: "Mời bot",
        support: "Hỗ trợ",
        viewDocs: "Xem tài liệu"
    },

    gettingStarted: {
        title: "Bắt đầu",
        subtitle:
            "Chạy Rawon chỉ trong vài phút với hướng dẫn từng bước.",
        features: {
            title: "✨ Tính năng",
            items: [
                "🚀 Sẵn sàng production, không cần viết code",
                "📺 Kênh yêu cầu nhạc để trải nghiệm liền mạch",
                "🎶 Hỗ trợ YouTube, Spotify, SoundCloud và file trực tiếp",
                "🤖 Chạy nhiều instance bot cho các kênh thoại khác nhau",
                "⚡ Tiền cache âm thanh thông minh để phát mượt hơn",
                "🍪 Đăng nhập Google qua Puppeteer có sẵn để quản lý cookie"
            ]
        },
        requirements: {
            title: "📋 Yêu cầu",
            nodeVersion: "**Node.js** phiên bản `20.0.0` trở lên",
            discordToken:
                "**Discord Bot Token** (lấy tại [Discord Developer Portal](https://discord.com/developers/applications))",
            optional:
                "**Tùy chọn:** [FFmpeg](https://ffmpeg.org/) để xử lý âm thanh khi cài đặt chuẩn (không Docker) — ảnh Docker đã có FFmpeg"
        },
        standardSetup: {
            title: "💻 Cài đặt chuẩn (Node.js)",
            steps: [
                "Tải và cài các yêu cầu ở trên",
                "Clone hoặc tải repository này",
                "Sao chép `.env.example` thành `.env` và điền giá trị (tối thiểu: `DISCORD_TOKEN`)",
                "Cài dependency: `pnpm install`",
                "Build dự án: `pnpm run build`",
                "Khởi động bot: `pnpm start`"
            ],
            requestChannel:
                "(Tùy chọn) Sau khi bot online, thiết lập kênh nhạc riêng:"
        },
        dockerSetup: {
            title: "🐳 Cài đặt Docker (khuyến nghị)",
            composeTitle: "Dùng Docker Compose",
            composeSteps: [
                "Tạo file `.env` với cấu hình của bạn (sao từ `.env.example`)",
                "(Tùy chọn) Tạo `dev.env` từ `dev.env.example` cho cài đặt bổ sung",
                "Tạo file `docker-compose.yaml` (xem ví dụ bên dưới)",
                "Chạy bot: `docker compose up -d`",
                "Xem log: `docker logs -f rawon-bot`"
            ],
            runTitle: "Dùng Docker Run",
            volumeInfo: {
                title: "📁 Thông tin volume",
                description: "Volume `/app/cache` lưu:",
                items: [
                    "Binary `yt-dlp` để stream âm thanh",
                    "`data.*` cho cài đặt bền vững (kênh yêu cầu, trạng thái player)",
                    "File âm thanh cache (nếu bật cache âm thanh)",
                    "File cookie và dữ liệu profile từ đăng nhập Google (xem [Thiết lập cookie](/docs/cookies-setup))"
                ]
            },
            portInfo: {
                title: "🔌 Thông tin cổng",
                description:
                    "`DEVTOOLS_PORT` (mặc định: `3000`) dùng cho proxy gỡ lỗi từ xa Chrome DevTools. Cần cho `!login start` khi bạn kết nối từ máy khác. Đặt `DEVTOOLS_PORT` trong `dev.env` để đổi cổng và map trong Docker Compose hoặc `docker run`."
            }
        },

        cookiesQuickStart: {
            title: "🍪 Cookie: xử lý nhanh trên hosting",
            description:
                "Trên cloud (AWS, GCP, Azure, Railway, v.v.) bạn có thể gặp **\"Sign in to confirm you're not a bot\"**. Hãy dùng luồng đăng nhập có sẵn:",
            steps: [
                "Chạy `!login start` trong Discord",
                "Mở URL DevTools bot gửi và hoàn tất đăng nhập Google trong trình duyệt từ xa",
                "Dùng `!login status` để kiểm tra cookie, hoặc `!login logout` rồi `!login start` để làm mới"
            ],
            tip: "💡 Dùng **tài khoản Google dùng một lần**, không dùng tài khoản chính. Xem hướng dẫn đầy đủ [Thiết lập cookie](/docs/cookies-setup)."
        }
    },

    configuration: {
        title: "Cấu hình",
        subtitle:
            "Cách các file cấu hình và biến môi trường của Rawon kết hợp với nhau.",
        overview: {
            title: "📄 File cấu hình",
            intro: "Cài đặt được chia ra nhiều file có chủ đích:",
            items: [
                "**`.env.example`** — Cài đặt cốt lõi (token Discord/Spotify, prefix, ID, hoạt động, v.v.). Sao sang **`.env`** và điền giá trị.",
                "**`dev.env.example`** — Cài đặt developer (bật/tắt prefix và slash, sharding, cổng DevTools cho `!login`, đường dẫn Chromium, chế độ debug). Sao sang **`dev.env`** khi cần.",
                "**Lệnh `setup`** — Tùy chọn riêng bot (màu embed, emoji có/không, splash, prefix phụ, âm lượng mặc định, kiểu chọn, cache âm thanh) quản lý bằng **`setup`** (chỉ developer) và lưu trong DB. Gõ `<prefix>setup view` để xem các mục có thể chỉnh."
            ]
        },
        essential: {
            title: "⚡ Cài đặt cốt lõi (`.env`)",
            description:
                "Giống `.env.example`. Chỉ **`DISCORD_TOKEN`** là bắt buộc để chạy; thêm Spotify, token lyrics và phần còn lại khi cần.",
            discordToken: {
                name: "DISCORD_TOKEN",
                description:
                    "Token bot Discord từ [Discord Developer Portal](https://discord.com/developers/applications). Dùng token **ngăn cách bằng dấu phẩy** để bật chế độ multi-bot.",
                required: true
            },
            spotify: {
                name: "Spotify API",
                description:
                    "Đặt `SPOTIFY_CLIENT_ID` và `SPOTIFY_CLIENT_SECRET` từ [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard). **Bắt buộc để hỗ trợ Spotify.**",
                required: false
            },
            stegripeLyrics: {
                name: "STEGRIPE_API_LYRICS_TOKEN",
                description:
                    "Cần để lệnh **lyrics** ra kết quả chính xác. Liên hệ developer để được cấp.",
                required: false
            },
            mainPrefix: {
                name: "MAIN_PREFIX",
                description:
                    "Prefix lệnh chính. Ví dụ: `!` nghĩa là gõ `!play` để phát nhạc",
                default: "!"
            },
            mainServer: {
                name: "MAIN_SERVER",
                description:
                    "ID server chính để đăng ký slash command nhanh hơn. Để trống cho lệnh toàn cục (có thể mất tới một giờ để cập nhật)",
                required: false
            },
            devs: {
                name: "DEVS",
                description:
                    "ID người dùng developer bot (ngăn cách bằng dấu phẩy). Developer dùng được lệnh đặc biệt gồm `setup` và công cụ `login`.",
                required: false
            },
            locale: {
                name: "LOCALE",
                description: "Ngôn ngữ phản hồi của bot",
                default: "en-US",
                options:
                    "en-US, es-ES, fr-FR, id-ID, zh-CN, zh-TW, uk-UA, vi-VN, pt-BR, ru-RU, ja-JP, tr-TR, ko-KR"
            },
            activityTypes: {
                name: "ACTIVITY_TYPES",
                description:
                    "Loại hoạt động cho mỗi mục trong `ACTIVITIES` (ngăn cách bằng dấu phẩy). Phải khớp số lượng hoạt động",
                options: "PLAYING, WATCHING, LISTENING, COMPETING",
                default: "PLAYING"
            },
            activities: {
                name: "ACTIVITIES",
                description:
                    "Dòng trạng thái dưới tên bot (ngăn cách bằng dấu phẩy). Placeholder: `{prefix}`, `{userCount}`, `{textChannelCount}`, `{serverCount}`, `{playingCount}`, `{username}`",
                required: false
            }
        },
        multiBot: {
            title: "🔄 Chế độ multi-bot",
            description:
                "Multi-bot **tự thích ứng** — không cần cấu hình thêm. Một token chạy một bot; token **ngăn cách bằng dấu phẩy** bật multi-bot tự động.",
            example: "Ví dụ:",
            exampleCode: 'DISCORD_TOKEN="token1, token2, token3"',
            features: [
                "Token **đầu tiên** là bot chính cho lệnh chung",
                "Mỗi bot phục vụ nhạc cho người trong **kênh thoại của nó**",
                "Nếu bot chính không có trong server, bot kế tiếp có thể đảm nhiệm",
                "Mỗi bot cần **ứng dụng Discord riêng**"
            ]
        },
        developer: {
            title: "🛠️ Cài đặt developer (`dev.env`)",
            description:
                "Theo `dev.env.example`. **Tùy chọn** — chỉ đổi khi bạn hiểu rõ.",
            enablePrefix: {
                name: "ENABLE_PREFIX",
                description: "Bật hoặc tắt lệnh prefix (vd. `!play`)",
                default: "yes",
                options: "yes, no"
            },
            enableSlash: {
                name: "ENABLE_SLASH_COMMAND",
                description: "Bật hoặc tắt slash command (vd. `/play`)",
                default: "yes",
                options: "yes, no"
            },
            enableSharding: {
                name: "ENABLE_SHARDING",
                description: "Bật sharding cho bot lớn (**chỉ một token**)",
                default: "no",
                options: "yes, no"
            },
            devtoolsPort: {
                name: "DEVTOOLS_PORT",
                description:
                    "Cổng proxy gỡ lỗi từ xa Chrome DevTools. Dùng khi `!login start` mở DevTools từ máy khác. Mặc định: `3000`",
                default: "3000"
            },
            chromiumPath: {
                name: "CHROMIUM_PATH",
                description:
                    "Đường dẫn Chrome/Chromium để đăng nhập Google. Để trống để tự nhận diện",
                required: false
            },
            nodeEnv: {
                name: "NODE_ENV",
                description: "Chế độ môi trường chạy",
                default: "production",
                options: "production, development"
            },
            debugMode: {
                name: "DEBUG_MODE",
                description: "Log debug chi tiết ra console",
                default: "no",
                options: "yes, no"
            }
        }
    },

    cookiesSetup: {
        title: "Thiết lập cookie",
        subtitle:
            "Xử lý \"Sign in to confirm you're not a bot\" trên hosting cloud. Khuyến nghị: lệnh **`!login`** có sẵn.",
        why: {
            title: "Tại sao cần?",
            description:
                "Nếu bạn host Rawon trên OVHcloud, AWS, GCP, Azure hoặc VPS/cloud khác, bạn có thể thấy:",
            error: "Sign in to confirm you're not a bot",
            explanation:
                "Nền tảng thường chặn request từ IP trung tâm dữ liệu. Xác thực **tài khoản Google** giúp Rawon lấy cookie hợp lệ và vượt hạn chế đó."
        },
        loginMethod: {
            title: "Khuyến nghị: lệnh `!login`",
            description:
                "Cách dễ nhất là luồng **`!login`** (trình duyệt thật qua Puppeteer):",
            benefits: [
                "✅ Mở trình duyệt thật để đăng nhập Google",
                "✅ Xuất cookie và lưu tự động",
                "✅ Đóng trình duyệt sau khi đăng nhập — không để process rác",
                "✅ Giữ được sau khi khởi động lại (volume Docker hoặc thư mục `cache/`)"
            ]
        },
        commandUsage: {
            title: "Cách dùng lệnh"
        },
        quickStart: {
            title: "Bắt đầu nhanh",
            steps: [
                "Chạy `!login start` trong Discord",
                "Mở **URL DevTools** bot gửi trong trình duyệt cục bộ",
                "Hoàn tất đăng nhập Google trong phiên **từ xa**",
                "Đăng nhập bằng **tài khoản Google dùng một lần** (không dùng tài khoản chính)",
                "Khi xong, bot lưu cookie và đóng trình duyệt",
                "Xong — các request sau dùng phiên đã lưu"
            ]
        },
        staleCookies: {
            title: "Nếu kiểm tra bot xuất hiện lại",
            description:
                "Cookie có thể hết hạn khi nhà cung cấp đổi phiên. Khi đó:",
            steps: [
                "Chạy `!login logout` để xóa cookie và profile cũ",
                "Chạy `!login start` và đăng nhập lại để có phiên mới"
            ]
        },
        prerequisites: {
            title: "Điều kiện",
            items: [
                "**Tài khoản Google phụ / dùng một lần** (**không** dùng tài khoản chính)",
                "**Không Docker:** Chrome hoặc Chromium đã cài trên máy host",
                "**Docker:** Đã có Chromium; map `DEVTOOLS_PORT` nếu dùng `!login` từ xa (xem [Cấu hình](/docs/configuration))"
            ]
        },
        docker: {
            title: "Docker",
            persistence:
                "Cookie và dữ liệu profile vẫn trong volume có tên **`rawon:/app/cache`** khi container khởi động lại.",
            chromium:
                "Ảnh có sẵn Chromium nên **`!login start`** chạy được mà không cần cài thêm trên ảnh."
        },
        envVars: {
            title: "Biến môi trường (`dev.env`)",
            intro: "Tinh chỉnh tùy chọn (xem `dev.env.example`):",
            dockerComposeHint:
                "Với Docker, trong `docker-compose.yaml` hãy `ports` expose cổng DevTools, ví dụ:"
        },
        duration: {
            title: "Cookie dùng được bao lâu?",
            description:
                "Có thể hết hạn theo thời gian vì nhà cung cấp đổi phiên. Thường vẫn hiệu lực khi:",
            conditions: [
                "Bạn không đăng xuất theo cách làm vô hiệu phiên",
                "Bạn không đổi mật khẩu tài khoản",
                "Bạn không thu hồi phiên trong cài đặt bảo mật",
                "Nhà cung cấp không đánh dấu hoạt động đáng ngờ"
            ],
            footer:
                "Khi cookie hết hạn, chạy `!login logout` rồi `!login start` lại."
        },
        troubleshooting: {
            title: "Xử lý sự cố",
            stillErrors: {
                title: "Vẫn thấy \"Sign in to confirm you're not a bot\"?",
                steps: [
                    "Dùng `!login status` để xem trạng thái đăng nhập và cookie",
                    "Chạy `!login logout` rồi `!login start` để tạo phiên mới"
                ]
            },
            browserWontStart: {
                title: "Trình duyệt không khởi động?",
                steps: [
                    "Xem `!login status` để biết lỗi",
                    "Trên máy bare metal, cài Chrome/Chromium hoặc đặt `CHROMIUM_PATH` trong `dev.env`",
                    "Trên Docker, Chromium thường chạy được ngay với ảnh chính thức"
                ]
            },
            accountSuspended: {
                title: "Tài khoản bị khóa?",
                steps: [
                    "Tạo tài khoản Google dùng một lần mới",
                    "Chạy `!login logout` để xóa phiên cũ",
                    "Chạy `!login start` và đăng nhập bằng tài khoản mới"
                ]
            }
        },
        manualAlternative: {
            title: "Thay thế: file cookie thủ công",
            description:
                "Bạn có thể đặt file cookie định dạng **Netscape** tại đường dẫn bên dưới. Bot sẽ dùng nếu có; **`!login` vẫn được khuyến nghị** cho quy trình đơn giản hơn.",
            pathLabel: "Đường dẫn"
        },
        security: {
            title: "Lưu ý bảo mật",
            warningLabel: "WARNING",
            warnings: [
                "Dùng tài khoản Google **dùng một lần** — **không** dùng tài khoản chính",
                "URL DevTools cho phép điều khiển phiên trình duyệt từ xa — **đừng chia sẻ công khai**",
                "File cookie chứa dữ liệu xác thực **nhạy cảm**"
            ]
        }
    },

    disclaimers: {
        title: "Tuyên bố miễn trừ",
        subtitle: "Vui lòng đọc kỹ trước khi dùng bot này.",
        warningBanner: "Thông tin pháp lý quan trọng",
        copyright: {
            title: "Bản quyền, DMCA và sở hữu trí tuệ",
            items: [
                "**Quyền sở hữu:** Mọi sở hữu trí tuệ được bot dùng, phát hoặc hiển thị **không thuộc về chúng tôi**, người duy trì hay đóng góp. Bao gồm nhưng không giới hạn âm thanh, video và hình ảnh trong lệnh của bot.",
                "**Chính sách nhà cung cấp hosting:** Một số nhà cung cấp cấm host hoặc phân phối nội dung được DMCA bảo vệ, gồm cả bot nhạc Discord phát nhạc/video có bản quyền.\n- **Triển khai lên các nền tảng đó là rủi ro của bạn**",
                "**Trách nhiệm người dùng:** Bạn chịu trách nhiệm về cách dùng bot và nội dung được phát qua bot."
            ]
        },
        code: {
            title: "Chỉnh sửa mã nguồn",
            items: [
                "**Giấy phép:** Dự án có giấy phép [Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International (CC BY-NC-ND 4.0)](https://creativecommons.org/licenses/by-nc-nd/4.0/). Toàn văn pháp lý nằm trong file [`LICENSE`](https://github.com/stegripe/rawon/blob/main/LICENSE) của repo.",
                "**Không bảo hành:** Theo giấy phép, chúng tôi **không chịu trách nhiệm** về thiệt hại hay mất mát do dùng mã này. Tuân thủ điều khoản về ghi công, phi thương mại và hạn chế chia sẻ bản sửa đổi.",
                "**Ghi công:** Không tuyên bố dự án là công trình gốc của bạn. Luôn ghi công đúng cho dự án gốc."
            ]
        },
        licenseFooterPrefix: "Toàn văn giấy phép xem trong repo",
        licenseLinkLabel: "LICENSE (CC BY-NC-ND 4.0)"
    },

    permissionCalculator: {
        title: "Tính quyền OAuth",
        clientId: "Client ID",
        scope: "Scope",
        redirectUri: "Redirect URI",
        permissions: "Permissions",
        permissionsNote:
            "Ô màu nghĩa là người OAuth cần bật 2FA trên tài khoản nếu server yêu cầu 2FA",
        general: "Chung",
        voice: "Thoại",
        text: "Văn bản",
        result: "Kết quả",
        resultNote:
            "Đây là liên kết để thêm bot vào server của bạn"
    },

    common: {
        back: "Quay lại",
        copy: "Sao chép",
        default: "Mặc định",
        required: "Bắt buộc",
        optional: "Tùy chọn",
        example: "Ví dụ",
        learnMore: "Tìm hiểu thêm",

        language: "Ngôn ngữ",
        tip: "Mẹo",
        warning: "Cảnh báo",
        note: "Ghi chú"
    }
};
