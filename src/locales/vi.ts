export const vi = {
    // Navigation
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

    // Home page
    home: {
        title: "Rawon",
        description:
            "Bot nhạc Discord đơn giản nhưng mạnh mẽ, được tạo ra để đáp ứng nhu cầu sản xuất của bạn.",
        invite: "Mời",
        support: "Hỗ trợ",
        viewDocs: "Xem tài liệu"
    },

    // Getting Started page
    gettingStarted: {
        title: "Bắt đầu",
        subtitle: "Khởi chạy Rawon trong vài phút với hướng dẫn từng bước của chúng tôi.",
        features: {
            title: "Tính năng",
            items: [
                "Hỗ trợ tương tác (lệnh slash và nút)",
                "Tính năng kênh yêu cầu cho trải nghiệm âm nhạc liền mạch",
                "Sẵn sàng sản xuất, không cần code",
                "Có thể cấu hình và dễ sử dụng",
                "Các lệnh nhạc cơ bản (play, pause, skip, queue, v.v.)",
                "Hỗ trợ đa ngôn ngữ"
            ]
        },
        requirements: {
            title: "Yêu cầu",
            nodeVersion: "Node.js phiên bản 22.12.0 trở lên",
            discordToken: "Discord Bot Token (lấy từ Discord Developer Portal)",
            optional: "Tùy chọn: Thông tin xác thực Spotify API để hỗ trợ Spotify"
        },
        standardSetup: {
            title: "Cài đặt tiêu chuẩn (Node.js)",
            steps: [
                "Tải và cài đặt Node.js phiên bản 22.12.0 trở lên",
                "Clone hoặc tải repository này",
                "Sao chép .env_example thành .env và điền các giá trị cần thiết (tối thiểu: DISCORD_TOKEN)",
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
                "Tạo file .env với cấu hình của bạn (sao chép từ .env_example)",
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
                    "data.json cho cài đặt bền vững (kênh yêu cầu, trạng thái player)",
                    "File audio được cache (nếu bật cache audio)"
                ]
            }
        },
        railwaySetup: {
            title: "Triển khai trên Railway",
            description:
                "Railway cung cấp $5 tín dụng miễn phí hàng tháng. Bot của bạn sẽ online 24/7 miễn là sử dụng dưới $5.",
            warning: "QUAN TRỌNG: Đọc Tuyên bố miễn trừ trước khi triển khai lên Railway."
        }
    },

    // Configuration page
    configuration: {
        title: "Cấu hình",
        subtitle: "Cấu hình Rawon theo nhu cầu của bạn với các cài đặt này.",
        essential: {
            title: "Cài đặt cơ bản",
            description: "Đây là các cài đặt tối thiểu cần thiết để chạy bot.",
            discordToken: {
                name: "DISCORD_TOKEN",
                description: "Token bot Discord của bạn từ Discord Developer Portal",
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
                description: "Để hỗ trợ Spotify, đặt SPOTIFY_CLIENT_ID và SPOTIFY_CLIENT_SECRET"
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
            }
        }
    },

    // Cookies Setup page
    cookiesSetup: {
        title: "Thiết lập Cookie",
        subtitle: "Sửa lỗi 'Sign in to confirm you're not a bot' trên các nhà cung cấp hosting.",
        why: {
            title: "Tại sao tôi cần điều này?",
            description:
                "Nếu bạn host Rawon trên các nhà cung cấp cloud như OVHcloud, AWS, GCP, Azure, hoặc các dịch vụ hosting khác, bạn có thể gặp lỗi:",
            error: "Sign in to confirm you're not a bot",
            explanation:
                "Điều này xảy ra vì nền tảng chặn các yêu cầu từ địa chỉ IP của data center. Bằng cách sử dụng cookie từ tài khoản đã đăng nhập, bạn có thể vượt qua hạn chế này."
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
            title: "Hướng dẫn từng bước",
            createAccount: {
                title: "Bước 1: Tạo tài khoản dùng một lần",
                steps: [
                    "Truy cập trang tạo tài khoản",
                    "Tạo tài khoản mới dành riêng cho bot này",
                    "Quan trọng: KHÔNG sử dụng tài khoản cá nhân/chính của bạn"
                ]
            },
            login: {
                title: "Bước 2: Đăng nhập vào nền tảng",
                steps: [
                    "Mở trình duyệt",
                    "Truy cập nền tảng (YouTube)",
                    "Đăng nhập bằng tài khoản dùng một lần",
                    "Chấp nhận điều khoản nếu được yêu cầu"
                ]
            },
            extension: {
                title: "Bước 3: Cài đặt extension xuất Cookie",
                chrome: "Cho Chrome/Edge: Cài đặt 'Get cookies.txt LOCALLY' hoặc 'cookies.txt'",
                firefox: "Cho Firefox: Cài đặt 'cookies.txt'"
            },
            exportCookies: {
                title: "Bước 4: Xuất Cookie",
                steps: [
                    "Đảm bảo bạn đang ở trang web của nền tảng",
                    "Nhấn vào biểu tượng extension cookie trên thanh công cụ",
                    "Chọn 'Export' hoặc 'Export cookies for this site'",
                    "Lưu file dưới tên cookies.txt"
                ]
            },
            upload: {
                title: "Bước 5: Tải lên server của bạn",
                steps: [
                    "Tạo thư mục cache trong thư mục Rawon nếu chưa có",
                    "Tải file cookies.txt vào thư mục cache",
                    "Đường dẫn phải là: ./cache/cookies.txt"
                ]
            },
            configure: {
                title: "Bước 6: Cấu hình biến môi trường",
                instruction: "Thêm dòng này vào file .env:"
            },
            restart: {
                title: "Bước 7: Khởi động lại Rawon",
                instruction: "Khởi động lại bot để áp dụng thay đổi."
            }
        },
        docker: {
            title: "Cài đặt Docker",
            description:
                "Nếu bạn đang sử dụng Docker, đặt file cookies.txt cạnh file docker-compose.yaml và thêm volume mount."
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
            title: "Lưu ý bảo mật",
            warnings: [
                "Không bao giờ chia sẻ file cookie với bất kỳ ai",
                "Sử dụng tài khoản dùng một lần, KHÔNG phải tài khoản chính",
                "File cookie chứa dữ liệu xác thực nhạy cảm",
                "Thêm cookies.txt vào .gitignore để ngăn commit vô tình"
            ]
        }
    },

    // Disclaimers page
    disclaimers: {
        title: "Tuyên bố miễn trừ",
        subtitle: "Vui lòng đọc kỹ trước khi sử dụng bot này.",
        warningBanner: "Thông tin pháp lý quan trọng",
        copyright: {
            title: "Bản quyền, DMCA và Sở hữu trí tuệ",
            items: [
                "Quyền sở hữu: Bất kỳ tài sản trí tuệ nào được sử dụng, phát hoặc hiển thị bởi bot đều không thuộc sở hữu của chúng tôi, những người duy trì, hoặc bất kỳ người đóng góp nào. Điều này bao gồm, nhưng không giới hạn, các file audio, video và hình ảnh được sử dụng trong các lệnh của bot.",
                "Chính sách nhà cung cấp hosting: Một số nhà cung cấp hosting (như Railway) cấm hosting hoặc phân phối nội dung được bảo vệ DMCA. Điều này bao gồm các bot nhạc Discord phát nhạc/video có bản quyền. Triển khai lên các nền tảng như vậy tự chịu rủi ro.",
                "Trách nhiệm người dùng: Bạn chịu trách nhiệm về cách bạn sử dụng bot này và nội dung nào được phát qua nó."
            ]
        },
        code: {
            title: "Sửa đổi mã",
            items: [
                "Giấy phép: Bot này là mã nguồn mở và có thể được sửa đổi và phân phối lại theo giấy phép AGPL-3.0.",
                "Không bảo hành: Như đã nêu trong giấy phép, chúng tôi không chịu trách nhiệm cho bất kỳ thiệt hại hoặc mất mát nào do sửa đổi, phân phối lại hoặc sử dụng mã này.",
                "Ghi nhận: Không bao giờ tuyên bố dự án này là công việc gốc của riêng bạn. Luôn cung cấp ghi nhận phù hợp cho dự án gốc."
            ]
        }
    },

    // Permission Calculator page
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

    // Common
    common: {
        back: "Quay lại",
        copy: "Sao chép",
        default: "Mặc định",
        required: "Bắt buộc",
        optional: "Tùy chọn",
        example: "Ví dụ",
        learnMore: "Tìm hiểu thêm",
        deployOnRailway: "Triển khai trên Railway",
        language: "Ngôn ngữ"
    }
};
