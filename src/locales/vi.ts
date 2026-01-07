export const vi = {
    nav: {
        home: "Trang chủ",
        docs: "Tài liệu",
        gettingStarted: "Bắt đầu",
        configuration: "Cấu hình",
        cookiesSetup: "Thiết lập Cookie",
        disclaimers: "Tuyên bố miễn trừ",
        permissionCalculator: "Tính toán quyền",
        links: "Liên kết"
    },

    home: {
        title: "Rawon",
        description:
            "Bot nhạc Discord đơn giản nhưng mạnh mẽ, được tạo ra để đáp ứng nhu cầu sản xuất của bạn.",
        invite: "Mời",
        inviteBot: "Mời Bot",
        support: "Hỗ trợ",
        viewDocs: "Xem tài liệu"
    },

    gettingStarted: {
        title: "Bắt đầu",
        subtitle: "Khởi chạy Rawon trong vài phút với hướng dẫn từng bước của chúng tôi.",
        features: {
            title: "Tính năng",
            items: [
                "🚀 Sẵn sàng sản xuất, không cần code",
                "📺 Tính năng kênh yêu cầu cho trải nghiệm âm nhạc liền mạch",
                "🤖 Chạy nhiều instance bot cho các kênh thoại khác nhau",
                "⚡ Pre-cache âm thanh thông minh để phát mượt mà hơn",
                "🎶 Hỗ trợ nhiều nền tảng âm nhạc (trang video, Spotify, SoundCloud)",
                "🔄 Xoay vòng đa cookie cho phát không gián đoạn"
            ]
        },
        requirements: {
            title: "Yêu cầu",
            nodeVersion: "Node.js phiên bản 22.12.0 trở lên",
            discordToken: "Discord Bot Token (lấy từ [Discord Developer Portal](https://discord.com/developers/applications))",
            optional: "Tùy chọn: Thông tin xác thực Spotify API để hỗ trợ Spotify"
        },
        standardSetup: {
            title: "Cài đặt tiêu chuẩn (Node.js)",
            steps: [
                "Tải và cài đặt Node.js phiên bản 22.12.0 trở lên",
                "Clone hoặc tải repository này",
                "Sao chép .env.example thành .env và điền các giá trị cần thiết (tối thiểu: DISCORD_TOKEN)",
                "Cài đặt dependencies: pnpm install",
                "Build project: pnpm run build",
                "Khởi chạy bot: pnpm start"
            ],
            requestChannel: "(Tùy chọn) Sau khi bot online, thiết lập kênh nhạc chuyên dụng:"
        },
        dockerSetup: {
            title: "Cài đặt Docker (Khuyến nghị)",
            composeTitle: "Sử dụng Docker Compose",
            composeSteps: [
                "Tạo file .env với cấu hình của bạn (sao chép từ .env.example)",
                "Tạo file docker-compose.yaml (xem ví dụ bên dưới)",
                "Khởi chạy bot: docker compose up -d",
                "Xem logs: docker logs -f rawon-bot"
            ],
            runTitle: "Sử dụng Docker Run",
            volumeInfo: {
                title: "Thông tin Volume",
                description: "Volume /app/cache lưu trữ:",
                items: [
                    "Binary yt-dlp cho streaming audio",
                    "data.* cho cài đặt bền vững (kênh yêu cầu, trạng thái player)",
                    "File audio được cache (nếu bật cache audio)",
                    "File cookie cho xác thực nền tảng video"
                ]
            }
        },

        cookiesQuickStart: {
            title: "🍪 Bắt Đầu Nhanh: Thiết Lập Cookie",
            description:
                "Nếu bạn đang hosting trên các nhà cung cấp cloud (AWS, GCP, Azure, Railway, v.v.), bạn có thể gặp lỗi \"Sign in to confirm you're not a bot\". Sửa dễ dàng với lệnh cookies:",
            steps: [
                "Xuất cookies từ trình duyệt (xem [hướng dẫn Thiết lập Cookie](/docs/cookies-setup))",
                "Trong Discord, gõ: `!cookies add 1`",
                "Đính kèm file `cookies.txt` vào tin nhắn",
                "Xong! Cookie có hiệu lực ngay lập tức"
            ],
            tip: "💡 Bạn có thể thêm nhiều cookies để dự phòng. Khi một cái thất bại, Rawon tự động chuyển sang cái tiếp theo!"
        }
    },

    configuration: {
        title: "Cấu hình",
        subtitle: "Cấu hình Rawon theo nhu cầu của bạn với các cài đặt này.",
        essential: {
            title: "Cài đặt cơ bản",
            description: "Đây là các cài đặt tối thiểu cần thiết để chạy bot.",
            discordToken: {
                name: "DISCORD_TOKEN",
                description: "Token bot Discord của bạn từ [Discord Developer Portal](https://discord.com/developers/applications)",
                required: true
            },
            mainPrefix: {
                name: "MAIN_PREFIX",
                description: "Tiền tố lệnh chính",
                default: "!"
            },
            mainServer: {
                name: "MAIN_SERVER",
                description: "ID server chính của bạn để đăng ký lệnh slash",
                required: false
            },
            locale: {
                name: "LOCALE",
                description: "Ngôn ngữ bot",
                default: "en-US",
                options: "en-US, es-ES, fr-FR, id-ID, zh-CN, zh-TW, uk-UA, vi-VN, pt-BR, ru-RU, ja-JP, tr-TR"
            },
            spotify: {
                name: "Spotify API",
                description: "Để hỗ trợ Spotify, lấy thông tin xác thực từ [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard) và đặt `SPOTIFY_CLIENT_ID` và `SPOTIFY_CLIENT_SECRET`"
            }
        },
        optional: {
            title: "Cài đặt tùy chọn",
            description: "Tùy chỉnh hành vi và giao diện của Rawon.",
            altPrefix: {
                name: "ALT_PREFIX",
                description: "Tiền tố thay thế (phân cách bằng dấu phẩy). Sử dụng {mention} để mention @bot",
                default: "{mention}"
            },
            activities: {
                name: "ACTIVITIES",
                description:
                    "Hoạt động trạng thái bot (phân cách bằng dấu phẩy). Định dạng: {prefix}, {userCount}, {textChannelCount}, {serverCount}, {playingCount}, {username}"
            },
            activityTypes: {
                name: "ACTIVITY_TYPES",
                description: "Loại hoạt động cho mỗi hoạt động (phân cách bằng dấu phẩy)",
                options: "PLAYING, WATCHING, LISTENING, COMPETING"
            },
            embedColor: {
                name: "EMBED_COLOR",
                description: "Màu embed dạng hex (không có #)",
                default: "22C9FF"
            },
            emojis: {
                name: "Emoji",
                description: "Tùy chỉnh emoji thành công (YES_EMOJI) và thất bại (NO_EMOJI)",
                defaults: "✅ / ❌"
            },
            musicSelection: {
                name: "MUSIC_SELECTION_TYPE",
                description: "Kiểu chọn nhạc",
                options: "message, selectmenu",
                default: "message"
            },
            audioCache: {
                name: "ENABLE_AUDIO_CACHE",
                description: "[THỰC NGHIỆM] Cache audio đã tải để phát lại nhanh hơn",
                default: "no"
            },
            requestChannelSplash: {
                name: "REQUEST_CHANNEL_SPLASH",
                description: "URL hình ảnh tùy chỉnh cho embed player kênh yêu cầu",
                default: "https://cdn.stegripe.org/images/rawon_splash.png"
            }
        },
        developer: {
            title: "🛠️ Cài Đặt Nhà Phát Triển",
            description: "Cài đặt nâng cao cho nhà phát triển bot. Chỉ sử dụng nếu bạn biết mình đang làm gì!",
            devs: {
                name: "DEVS",
                description: "ID nhà phát triển bot (phân cách bằng dấu phẩy). Nhà phát triển có thể truy cập các lệnh đặc biệt"
            },
            enablePrefix: {
                name: "ENABLE_PREFIX",
                description: "Bật/tắt lệnh có prefix (như !play). Hữu ích nếu bạn chỉ muốn lệnh slash",
                default: "yes",
                options: "yes, no"
            },
            enableSlash: {
                name: "ENABLE_SLASH_COMMAND",
                description: "Bật/tắt lệnh slash (như /play). Hữu ích nếu bạn chỉ muốn lệnh có prefix",
                default: "yes",
                options: "yes, no"
            },
            debugMode: {
                name: "DEBUG_MODE",
                description: "Bật ghi log debug để khắc phục sự cố. Hiển thị log chi tiết trong console",
                default: "no",
                options: "yes, no"
            }
        }
    },

    cookiesSetup: {
        title: "Thiết lập Cookie",
        subtitle: "Sửa lỗi \"Sign in to confirm you're not a bot\" trên các nhà cung cấp hosting.",
        why: {
            title: "Tại sao tôi cần điều này?",
            description:
                "Nếu bạn host Rawon trên các nhà cung cấp cloud như OVHcloud, AWS, GCP, Azure, hoặc các dịch vụ hosting khác, bạn có thể gặp lỗi:",
            error: "Sign in to confirm you're not a bot",
            explanation:
                "Điều này xảy ra vì nền tảng chặn các yêu cầu từ địa chỉ IP của data center. Bằng cách sử dụng cookie từ tài khoản đã đăng nhập, bạn có thể vượt qua hạn chế này."
        },

        quickMethod: {
            title: "🚀 Phương Pháp Dễ: Sử Dụng Lệnh Cookies (Khuyến Nghị)",
            description: "Cách dễ nhất để quản lý cookies - không cần chỉnh sửa file!",
            benefits: [
                "✅ Hoạt động ngay lập tức - không cần khởi động lại",
                "✅ Hỗ trợ nhiều cookies với xoay vòng tự động",
                "✅ Khi một cookie thất bại, bot tự động sử dụng cái tiếp theo",
                "✅ Cookies được giữ lại sau khi bot khởi động lại"
            ],
            commands: {
                title: "📝 Các Lệnh Có Sẵn",
                add: "`!cookies add <số>` - Thêm cookie (đính kèm file cookies.txt vào tin nhắn)",

            },
            quickStart: {
                title: "⚡ Bắt Đầu Nhanh (3 bước)",
                steps: [
                    "Xuất cookies từ trình duyệt (xem hướng dẫn bên dưới)",
                    "Trong Discord, gõ: `!cookies add 1` và đính kèm file cookies.txt",
                    "Xong! Cookie đã được kích hoạt"
                ]
            },
            multiCookie: {
                title: "💡 Mẹo Pro: Thêm Nhiều Cookies",
                description: "Thêm cookies từ các tài khoản khác nhau để đáng tin cậy hơn:"
            }
        },
        prerequisites: {
            title: "Điều kiện tiên quyết",
            items: [
                "Tài khoản phụ/dùng một lần (KHÔNG sử dụng tài khoản chính vì lý do bảo mật)",
                "Trình duyệt web (Chrome, Firefox hoặc Edge)",
                "Extension xuất cookie",
                "Cho người dùng không dùng Docker: Deno JavaScript runtime (cần thiết cho giải quyết chữ ký yt-dlp)"
            ]
        },
        steps: {
            title: "📖 Cách Xuất Cookie",
            createAccount: {
                title: "Bước 1: Tạo tài khoản dùng một lần",
                steps: [
                    "Truy cập [trang tạo tài khoản](https://accounts.google.com/signup)",
                    "Tạo tài khoản mới dành riêng cho bot này",
                    "⚠️ Quan trọng: KHÔNG BAO GIỜ sử dụng tài khoản cá nhân/chính của bạn!"
                ]
            },
            login: {
                title: "Bước 2: Đăng nhập vào nền tảng video",
                steps: [
                    "Mở trình duyệt",
                    "Truy cập [nền tảng video](https://youtube.com)",
                    "Đăng nhập bằng tài khoản dùng một lần",
                    "Chấp nhận điều khoản nếu được yêu cầu"
                ]
            },
            extension: {
                title: "Bước 3: Cài đặt extension xuất Cookie",
                chrome: "Cho Chrome/Edge: Cài đặt [**Get cookies.txt LOCALLY**](https://chromewebstore.google.com/detail/get-cookiestxt-locally/cclelndahbckbenkjhflpdbgdldlbecc) (khuyến nghị) từ Chrome Web Store",
                firefox: "Cho Firefox: Cài đặt [**cookies.txt**](https://addons.mozilla.org/en-US/firefox/addon/cookies-txt/) từ Firefox Add-ons"
            },
            exportCookies: {
                title: "Bước 4: Xuất Cookie",
                steps: [
                    "Đảm bảo bạn đang ở [trang web nền tảng video](https://youtube.com)",
                    "Nhấn vào biểu tượng extension cookie trên thanh công cụ",
                    "Chọn **Export** hoặc **Export cookies for this site**",
                    "Lưu file dưới tên `cookies.txt`"
                ]
            },
            upload: {
                title: "Bước 5: Thêm vào Rawon",
                steps: [
                    "Đi đến kênh mà Rawon có thể xem tin nhắn của bạn",
                    "Gõ: `!cookies add 1`",
                    "Đính kèm file cookies.txt vào tin nhắn và gửi",
                    "Rawon sẽ xác nhận cookie đã được thêm!"
                ]
            }
        },
        troubleshooting: {
            title: "🔧 Khắc Phục Sự Cố",
            stillGettingErrors: {
                title: "Vẫn gặp lỗi \"Sign in to confirm you're not a bot\"?",
                steps: [
                    "Sử dụng `!cookies list` để kiểm tra trạng thái cookie",
                    "Nếu cookie hiển thị **Failed**, thử `!cookies reset` để thử lại",
                    "Thêm nhiều cookies từ các tài khoản khác để dự phòng"
                ]
            },
            allCookiesFailed: {
                title: "Tất cả cookies đều thất bại?",
                steps: [
                    "Tạo tài khoản dùng một lần mới",
                    "Xuất cookies mới",
                    "Thêm chúng với `!cookies add <số>`"
                ]
            },
            accountSuspended: {
                title: "Tài khoản bị tạm ngưng?",
                steps: [
                    "Điều này có thể xảy ra với việc sử dụng nhiều",
                    "Đơn giản là tạo tài khoản dùng một lần mới",
                    "Xuất cookies mới và thêm chúng"
                ]
            }
        },
        duration: {
            title: "Cookie tồn tại bao lâu?",
            description:
                "Tin tốt: Cookie của nền tảng KHÔNG hết hạn định kỳ. Chúng sẽ vẫn có hiệu lực miễn là:",
            conditions: [
                "Bạn không đăng xuất khỏi nền tảng trong trình duyệt",
                "Bạn không thay đổi mật khẩu tài khoản",
                "Bạn không thu hồi phiên từ cài đặt tài khoản",
                "Nền tảng không phát hiện hoạt động đáng ngờ"
            ],
            tips: "Trên thực tế, cookie có thể tồn tại hàng tháng hoặc thậm chí hàng năm nếu bạn tuân theo các thực hành tốt nhất."
        },
        security: {
            title: "🔒 Lưu ý bảo mật",
            warnings: [
                "⚠️ Không bao giờ chia sẻ file cookie với bất kỳ ai",
                "⚠️ Sử dụng tài khoản dùng một lần, KHÔNG phải tài khoản chính",
                "⚠️ File cookie chứa dữ liệu xác thực nhạy cảm"
            ]
        }
    },

    disclaimers: {
        title: "Tuyên bố miễn trừ",
        subtitle: "Vui lòng đọc kỹ trước khi sử dụng bot này.",
        warningBanner: "Thông tin pháp lý quan trọng",
        copyright: {
            title: "Bản quyền, DMCA và Sở hữu trí tuệ",
            items: [
                "**Quyền sở hữu:** Bất kỳ tài sản trí tuệ nào được sử dụng, phát hoặc hiển thị bởi bot đều không thuộc sở hữu của chúng tôi, những người duy trì, hoặc bất kỳ người đóng góp nào. Điều này bao gồm, nhưng không giới hạn, các file audio, video và hình ảnh được sử dụng trong các lệnh của bot.",
                "**Chính sách nhà cung cấp hosting:** Một số nhà cung cấp hosting cấm hosting hoặc phân phối nội dung được bảo vệ DMCA. Điều này bao gồm các bot nhạc Discord phát nhạc/video có bản quyền. Triển khai lên các nền tảng như vậy tự chịu rủi ro.",
                "**Trách nhiệm người dùng:** Bạn chịu trách nhiệm về cách bạn sử dụng bot này và nội dung nào được phát qua nó."
            ]
        },
        code: {
            title: "Sửa đổi mã",
            items: [
                "**Giấy phép:** Bot này là mã nguồn mở và có thể được sửa đổi và phân phối lại theo giấy phép **AGPL-3.0**.",
                "**Không bảo hành:** Như đã nêu trong giấy phép, chúng tôi không chịu trách nhiệm cho bất kỳ thiệt hại hoặc mất mát nào do sửa đổi, phân phối lại hoặc sử dụng mã này.",
                "**Ghi nhận:** Không bao giờ tuyên bố dự án này là công việc gốc của riêng bạn. Luôn cung cấp ghi nhận phù hợp cho dự án gốc."
            ]
        }
    },

    permissionCalculator: {
        title: "Tính toán quyền",
        clientId: "ID Client",
        scope: "Phạm vi",
        redirectUri: "URI chuyển hướng",
        permissions: "Quyền",
        permissionsNote:
            "Có màu nghĩa là người dùng OAuth cần bật 2FA trên tài khoản của họ nếu server yêu cầu 2FA",
        general: "Chung",
        voice: "Giọng nói",
        text: "Văn bản",
        result: "Kết quả",
        resultNote: "Đây là liên kết bạn có thể sử dụng để thêm bot vào server của bạn"
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
