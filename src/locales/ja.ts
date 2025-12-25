export const ja = {
    // Navigation
    nav: {
        home: "ホーム",
        docs: "ドキュメント",
        gettingStarted: "はじめに",
        configuration: "設定",
        cookiesSetup: "Cookie設定",
        disclaimers: "免責事項",
        permissionCalculator: "権限計算機",
        links: "リンク"
    },

    // Home page
    home: {
        title: "Rawon",
        description:
            "あなたの制作欲求を満たすためのシンプルで強力なDiscord音楽ボット。",
        invite: "招待",
        support: "サポート",
        viewDocs: "ドキュメント"
    },

    // Getting Started page
    gettingStarted: {
        title: "はじめに",
        subtitle:
            "ステップバイステップガイドで数分でRawonを起動しましょう。",
        features: {
            title: "機能",
            items: [
                "インタラクションサポート（スラッシュコマンドとボタン）",
                "シームレスな音楽体験のためのリクエストチャンネル機能",
                "本番環境対応、コーディング不要",
                "設定可能で使いやすい",
                "基本的な音楽コマンド（play、pause、skip、queue等）",
                "多言語サポート"
            ]
        },
        requirements: {
            title: "必要条件",
            nodeVersion: "Node.js バージョン22.12.0以上",
            discordToken:
                "Discord Bot Token（Discord Developer Portalから取得）",
            optional: "オプション：SpotifyサポートのためのSpotify API認証情報"
        },
        standardSetup: {
            title: "標準セットアップ（Node.js）",
            steps: [
                "Node.js バージョン22.12.0以上をダウンロードしてインストール",
                "このリポジトリをクローンまたはダウンロード",
                ".env_exampleを.envにコピーして必要な値を入力（最低限：DISCORD_TOKEN）",
                "依存関係をインストール：pnpm install",
                "プロジェクトをビルド：pnpm run build",
                "ボットを起動：pnpm start"
            ],
            requestChannel:
                "（オプション）ボットがオンラインになった後、専用の音楽チャンネルを設定："
        },
        dockerSetup: {
            title: "Dockerセットアップ（推奨）",
            composeTitle: "Docker Composeを使用",
            composeSteps: [
                ".env_exampleからコピーして.envファイルを作成",
                "docker-compose.yamlファイルを作成（下記の例を参照）",
                "ボットを起動：docker compose up -d",
                "ログを確認：docker logs -f rawon-bot"
            ],
            runTitle: "Docker Runを使用",
            volumeInfo: {
                title: "ボリューム情報",
                description: "/app/cacheボリュームには以下が保存されます：",
                items: [
                    "オーディオストリーミング用のyt-dlpバイナリ",
                    "永続的な設定のためのdata.json（リクエストチャンネル、プレーヤー状態）",
                    "キャッシュされたオーディオファイル（オーディオキャッシュが有効な場合）"
                ]
            }
        },
        railwaySetup: {
            title: "Railwayデプロイ",
            description:
                "Railwayは毎月$5の無料クレジットを提供しています。使用量が$5未満であれば、ボットは24時間365日オンラインを維持します。",
            warning: "重要：Railwayにデプロイする前に免責事項をお読みください。"
        }
    },

    // Configuration page
    configuration: {
        title: "設定",
        subtitle: "これらの設定でRawonをカスタマイズしてください。",
        essential: {
            title: "必須設定",
            description:
                "ボットを実行するために必要な最小限の設定です。",
            discordToken: {
                name: "DISCORD_TOKEN",
                description:
                    "Discord Developer PortalからのDiscordボットトークン",
                required: true
            },
            mainPrefix: {
                name: "MAIN_PREFIX",
                description: "メインコマンドプレフィックス",
                default: "!"
            },
            mainServer: {
                name: "MAIN_SERVER",
                description: "スラッシュコマンド登録用のメインサーバーID",
                required: false
            },
            locale: {
                name: "LOCALE",
                description: "ボットの言語",
                default: "en-US",
                options:
                    "en-US, es-ES, fr-FR, id-ID, zh-CN, zh-TW, uk-UA, vi-VN, pt-BR, ru-RU, ja-JP, tr-TR"
            },
            spotify: {
                name: "Spotify API",
                description:
                    "SpotifyサポートのためにSPOTIFY_CLIENT_IDとSPOTIFY_CLIENT_SECRETを設定"
            }
        },
        optional: {
            title: "オプション設定",
            description: "Rawonの動作と外観をカスタマイズします。",
            altPrefix: {
                name: "ALT_PREFIX",
                description:
                    "代替プレフィックス（カンマ区切り）。@botメンションには{mention}を使用",
                default: "{mention}"
            },
            activities: {
                name: "ACTIVITIES",
                description:
                    "ボットステータスアクティビティ（カンマ区切り）。形式：{prefix}、{userCount}、{textChannelCount}、{serverCount}、{playingCount}、{username}"
            },
            activityTypes: {
                name: "ACTIVITY_TYPES",
                description: "各アクティビティのアクティビティタイプ（カンマ区切り）",
                options: "PLAYING、WATCHING、LISTENING、COMPETING"
            },
            embedColor: {
                name: "EMBED_COLOR",
                description: "埋め込みカラー（16進数、#なし）",
                default: "22C9FF"
            },
            emojis: {
                name: "絵文字",
                description: "成功（YES_EMOJI）と失敗（NO_EMOJI）の絵文字をカスタマイズ",
                defaults: "✅ / ❌"
            },
            musicSelection: {
                name: "MUSIC_SELECTION_TYPE",
                description: "音楽選択スタイル",
                options: "message、selectmenu",
                default: "message"
            },
            audioCache: {
                name: "ENABLE_AUDIO_CACHE",
                description:
                    "[実験的] ダウンロードしたオーディオをキャッシュして繰り返し再生を高速化",
                default: "no"
            }
        }
    },

    // Cookies Setup page
    cookiesSetup: {
        title: "Cookie設定",
        subtitle:
            "ホスティングプロバイダーでの「Sign in to confirm you're not a bot」エラーを修正します。",
        why: {
            title: "なぜこれが必要ですか？",
            description:
                "OVHcloud、AWS、GCP、Azure、その他のホスティングサービスでRawonをホスティングしている場合、次のエラーが発生する可能性があります：",
            error: "Sign in to confirm you're not a bot",
            explanation:
                "これは、プラットフォームがデータセンターIPアドレスからのリクエストをブロックしているために発生します。ログインしたアカウントのCookieを使用することで、この制限を回避できます。"
        },
        prerequisites: {
            title: "前提条件",
            items: [
                "セカンダリ/使い捨てアカウント（セキュリティ上の理由からメインアカウントは使用しないでください）",
                "Webブラウザ（Chrome、Firefox、またはEdge）",
                "Cookie エクスポート拡張機能",
                "非Dockerユーザー向け：Deno JavaScriptランタイム（yt-dlp署名解決に必要）"
            ]
        },
        steps: {
            title: "ステップバイステップガイド",
            createAccount: {
                title: "ステップ1：使い捨てアカウントを作成",
                steps: [
                    "アカウント作成ページに移動",
                    "このボット専用の新しいアカウントを作成",
                    "重要：個人/メインアカウントは使用しないでください"
                ]
            },
            login: {
                title: "ステップ2：プラットフォームにログイン",
                steps: [
                    "ブラウザを開く",
                    "プラットフォーム（YouTube）に移動",
                    "使い捨てアカウントでサインイン",
                    "プロンプトが表示されたら条件に同意"
                ]
            },
            extension: {
                title: "ステップ3：Cookieエクスポート拡張機能をインストール",
                chrome: "Chrome/Edge用：「Get cookies.txt LOCALLY」または「cookies.txt」をインストール",
                firefox: "Firefox用：「cookies.txt」をインストール"
            },
            exportCookies: {
                title: "ステップ4：Cookieをエクスポート",
                steps: [
                    "プラットフォームのウェブサイトにいることを確認",
                    "ブラウザツールバーのCookie拡張機能アイコンをクリック",
                    "「Export」または「Export cookies for this site」を選択",
                    "ファイルをcookies.txtとして保存"
                ]
            },
            upload: {
                title: "ステップ5：サーバーにアップロード",
                steps: [
                    "Rawonディレクトリにcacheフォルダがなければ作成",
                    "cookies.txtファイルをcacheフォルダにアップロード",
                    "パスは./cache/cookies.txtである必要があります"
                ]
            },
            configure: {
                title: "ステップ6：環境変数を設定",
                instruction: ".envファイルに以下を追加："
            },
            restart: {
                title: "ステップ7：Rawonを再起動",
                instruction: "変更を適用するためにボットを再起動してください。"
            }
        },
        docker: {
            title: "Dockerセットアップ",
            description:
                "Dockerを使用している場合は、cookies.txtファイルをdocker-compose.yamlファイルの横に置き、ボリュームマウントを追加してください。"
        },
        duration: {
            title: "Cookieはどのくらい持続しますか？",
            description:
                "良いニュース：プラットフォームのCookieは定期的に期限切れになりません。以下の条件が満たされている限り有効です：",
            conditions: [
                "ブラウザでプラットフォームからログアウトしない",
                "アカウントのパスワードを変更しない",
                "アカウント設定からセッションを取り消さない",
                "プラットフォームが不審なアクティビティを検出しない"
            ],
            tips: "実際には、ベストプラクティスに従えば、Cookieは数ヶ月または数年持続する可能性があります。"
        },
        security: {
            title: "セキュリティに関する注意",
            warnings: [
                "Cookieファイルを誰とも共有しないでください",
                "メインアカウントではなく使い捨てアカウントを使用してください",
                "Cookieファイルには機密認証データが含まれています",
                "誤ってコミットしないようにcookies.txtを.gitignoreに追加してください"
            ]
        }
    },

    // Disclaimers page
    disclaimers: {
        title: "免責事項",
        subtitle: "このボットを使用する前に注意深くお読みください。",
        warningBanner: "重要な法的情報",
        copyright: {
            title: "著作権、DMCA、知的財産",
            items: [
                "所有権：ボットによって使用、再生、または表示される知的財産は、私たち、メンテナー、または貢献者のいずれも所有していません。これには、ボットのコマンドで使用されるオーディオ、ビデオ、画像ファイルが含まれますが、これらに限定されません。",
                "ホスティングプロバイダーのポリシー：一部のホスティングプロバイダー（Railwayなど）は、DMCA保護されたコンテンツのホスティングまたは配布を禁止しています。これには、著作権で保護された音楽/ビデオを再生するDiscord音楽ボットが含まれます。このようなプラットフォームへのデプロイは自己責任で行ってください。",
                "ユーザーの責任：このボットの使用方法と、それを通じて再生されるコンテンツについては、ユーザーの責任です。"
            ]
        },
        code: {
            title: "コードの修正",
            items: [
                "ライセンス：このボットはオープンソースであり、AGPL-3.0ライセンスの下で修正および再配布できます。",
                "保証なし：ライセンスに記載されているように、このコードの修正、再配布、または使用から生じるいかなる損害または損失についても責任を負いません。",
                "帰属：このプロジェクトを自分のオリジナル作品として主張しないでください。常に元のプロジェクトに適切な帰属を提供してください。"
            ]
        }
    },

    // Permission Calculator page
    permissionCalculator: {
        title: "権限計算機",
        clientId: "クライアントID",
        scope: "スコープ",
        redirectUri: "リダイレクトURI",
        permissions: "権限",
        permissionsNote:
            "色付きは、サーバーが2FAを必要とする場合、OAuthユーザーがアカウントで2FAを有効にする必要があることを意味します",
        general: "一般",
        voice: "ボイス",
        text: "テキスト",
        result: "結果",
        resultNote: "これはボットをサーバーに追加するために使用できるリンクです"
    },

    // Common
    common: {
        back: "戻る",
        copy: "コピー",
        default: "デフォルト",
        required: "必須",
        optional: "オプション",
        example: "例",
        learnMore: "詳細",
        deployOnRailway: "Railwayにデプロイ",
        language: "言語"
    }
};
