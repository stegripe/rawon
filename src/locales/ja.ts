import type { Translations } from "./en";

export const ja: Translations = {
    nav: {
        home: "ホーム",
        docs: "ドキュメント",
        gettingStarted: "はじめに",
        configuration: "設定",
        cookiesSetup: "クッキー設定",
        disclaimers: "免責事項",
        permissionCalculator: "権限計算機",
        links: "リンク"
    },

    home: {
        title: "Rawon",
        description:
            "本番環境にも使える、シンプルで高機能なDiscord向け音楽（マルチ）ボットです。コード不要で簡単に使えます。",
        invite: "招待する",
        inviteBot: "ボットを招待",
        support: "サポート",
        viewDocs: "ドキュメントを見る"
    },

    gettingStarted: {
        title: "はじめに",
        subtitle:
            "手順どおり進めれば、数分でRawonを起動できます。",
        features: {
            title: "✨ 主な機能",
            items: [
                "🚀 本番運用を想定。コードは不要です",
                "📺 リクエストチャンネルで、途切れにくい音楽体験",
                "🎶 YouTube・Spotify・SoundCloud・直リンクのファイルに対応",
                "🤖 ボイスチャンネルごとに複数インスタンスを動かせます",
                "⚡ 音声の先読みキャッシュで再生がスムーズに",
                "🍪 PuppeteerによるGoogleログインでクッキー管理を内蔵"
            ]
        },
        requirements: {
            title: "📋 必要なもの",
            nodeVersion: "**Node.js** は `20.0.0` 以上",
            discordToken:
                "**Discord ボットトークン**（[Discord Developer Portal](https://discord.com/developers/applications) から取得）",
            optional:
                "**任意：** 通常（非Docker）環境では音声処理に [FFmpeg](https://ffmpeg.org/) — Docker イメージには FFmpeg が同梱されています"
        },
        standardSetup: {
            title: "💻 標準セットアップ（Node.js）",
            steps: [
                "上記の前提条件をダウンロード・インストールする",
                "このリポジトリをクローンするか、ZIPで取得する",
                "`.env.example` を `.env` にコピーし、必須項目を記入する（最低限 `DISCORD_TOKEN`）",
                "依存関係を入れる: `pnpm install`",
                "ビルドする: `pnpm run build`",
                "起動する: `pnpm start`"
            ],
            requestChannel:
                "（任意）ボットがオンラインになったら、音楽専用チャンネルを用意できます："
        },
        dockerSetup: {
            title: "🐳 Docker セットアップ（推奨）",
            composeTitle: "Docker Compose を使う",
            composeSteps: [
                "設定を `.env` に書く（`.env.example` をコピー）",
                "（任意）追加設定用に `dev.env.example` から `dev.env` を作る",
                "`docker-compose.yaml` を用意する（下の例を参照）",
                "起動: `docker compose up -d`",
                "ログ確認: `docker logs -f rawon-bot`"
            ],
            runTitle: "docker run を使う",
            volumeInfo: {
                title: "📁 ボリュームの中身",
                description: "`/app/cache` ボリュームには次が保存されます：",
                items: [
                    "音声ストリーム用の `yt-dlp` バイナリ",
                    "永続設定用の `data.*`（リクエストチャンネルやプレイヤー状態など）",
                    "（有効時）キャッシュされた音声ファイル",
                    "Googleログインによるクッキーとプロファイル（詳しくは [クッキー設定](/docs/cookies-setup)）"
                ]
            },
            portInfo: {
                title: "🔌 ポートについて",
                description:
                    "`DEVTOOLS_PORT`（既定 `3000`）は Chrome DevTools のリモートデバッグ用プロキシです。別のマシンから接続して `!login start` を使うときに必要になります。別ポートにしたい場合は `dev.env` で `DEVTOOLS_PORT` を変え、Docker Compose または `docker run` でポートを公開してください。"
            }
        },

        cookiesQuickStart: {
            title: "🍪 ホスティングでのクッキー（すぐ試せる手順）",
            description:
                "クラウド（AWS・GCP・Azure・Railway など）では、**「ボットではないことを確認するためにログインしてください」** と出ることがあります。組み込みのログインフローで対処できます：",
            steps: [
                "Discord で `!login start` を実行する",
                "ボットが送る DevTools のURLを開き、リモートブラウザでGoogleにログインし終える",
                "`!login status` でクッキーを確認するか、`!login logout` のあと `!login start` で取り直す"
            ],
            tip: "💡 **使い捨てのGoogleアカウント**を使ってください（普段お使いのメインのアカウントではなく）。詳細は [クッキー設定](/docs/cookies-setup) をどうぞ。"
        }
    },

    configuration: {
        title: "設定",
        subtitle: "設定ファイルと環境変数がどう役割分担されているかです。",
        overview: {
            title: "📄 設定ファイル",
            intro: "意図的に複数ファイルに分かれています：",
            items: [
                "**`.env.example`** — Discord／Spotify トークン、プレフィックス、ID、アクティビティなど。**`.env`** にコピーして値を埋めます。",
                "**`dev.env.example`** — 開発者向けの任意項目（プレフィックス／スラッシュのオンオフ、シャーディング、`!login` 用 DevTools ポート、Chromium のパス、デバッグなど）。必要なら **`dev.env`** にコピーします。",
                "**`setup` コマンド** — 埋め込み色、yes／no絵文字、スプラッシュ、代替プレフィックス、既定ボリューム、選択方式、音声キャッシュなどボット固有の設定は **`setup`**（開発者のみ）からデータベースに保存します。一覧は `<prefix>setup view` で確認できます。"
            ]
        },
        essential: {
            title: "⚡ 主要な環境変数（`.env`）",
            description:
                "`.env.example` にある値です。**必須は `DISCORD_TOKEN` だけ**です。Spotifyや歌詞トークンなどは必要に応じて追加してください。",
            discordToken: {
                name: "DISCORD_TOKEN",
                description:
                    "[Discord Developer Portal](https://discord.com/developers/applications) のボットトークン。**カンマ区切り**で複数指定するとマルチボットモードになります。",
                required: true
            },
            spotify: {
                name: "Spotify API",
                description:
                    "`SPOTIFY_CLIENT_ID` と `SPOTIFY_CLIENT_SECRET` を [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard) で取得して設定。**Spotify 対応に必須**です。",
                required: false
            },
            stegripeLyrics: {
                name: "STEGRIPE_API_LYRICS_TOKEN",
                description:
                    "**歌詞コマンド**を正しく出すために必要です。利用には開発者へお問い合わせください。",
                required: false
            },
            mainPrefix: {
                name: "MAIN_PREFIX",
                description: "メインのコマンドプレフィックス。例：`!` なら `!play` のように入力します",
                default: "!"
            },
            mainServer: {
                name: "MAIN_SERVER",
                description:
                    "スラッシュコマンド登録を速くするためのメインサーバーID。空にするとグローバル登録になり、反映まで最大1時間程度かかることがあります",
                required: false
            },
            devs: {
                name: "DEVS",
                description:
                    "ボット開発者のユーザーID（カンマ区切り）。`setup` や `login` など特別コマンドにアクセスできます。",
                required: false
            },
            locale: {
                name: "LOCALE",
                description: "ボット応答の言語",
                default: "en-US",
                options:
                    "en-US, es-ES, fr-FR, id-ID, zh-CN, zh-TW, uk-UA, vi-VN, pt-BR, ru-RU, ja-JP, tr-TR, ko-KR"
            },
            activityTypes: {
                name: "ACTIVITY_TYPES",
                description:
                    "`ACTIVITIES` の各項目に対応するアクティビティ種類（カンマ区切り）。件数は `ACTIVITIES` と一致させます",
                options: "PLAYING, WATCHING, LISTENING, COMPETING",
                default: "PLAYING"
            },
            activities: {
                name: "ACTIVITIES",
                description:
                    "ボット名の下に出る状態文（カンマ区切り）。プレースホルダー: `{prefix}`, `{userCount}`, `{textChannelCount}`, `{serverCount}`, `{playingCount}`, `{username}`",
                required: false
            }
        },
        multiBot: {
            title: "🔄 マルチボットモード",
            description:
                "追加設定なしで自動的に切り替わります。トークン1つならシングル、**カンマ区切り**にするとマルチになります。",
            example: "例：",
            exampleCode: 'DISCORD_TOKEN="token1, token2, token3"',
            features: [
                "**先頭の**トークンが全体コマンド用のメインボットです",
                "各ボットは **自分がいる** ボイスチャンネルのユーザー向けに音楽を再生します",
                "メインボットがサーバーにいない場合、次に使えるボットが引き継げます",
                "ボットごとに **別の** Discord アプリケーションが必要です"
            ]
        },
        developer: {
            title: "🛠️ 開発者向け（`dev.env`）",
            description: "`dev.env.example` の内容です。**任意**です。意味がわかる場合だけ変更してください。",
            enablePrefix: {
                name: "ENABLE_PREFIX",
                description: "`!play` などプレフィックスコマンドのオン／オフ",
                default: "yes",
                options: "yes, no"
            },
            enableSlash: {
                name: "ENABLE_SLASH_COMMAND",
                description: "`/play` などスラッシュコマンドのオン／オフ",
                default: "yes",
                options: "yes, no"
            },
            enableSharding: {
                name: "ENABLE_SHARDING",
                description: "大規模ボット向けシャーディング（**シングルトークンのときのみ**）",
                default: "no",
                options: "yes, no"
            },
            devtoolsPort: {
                name: "DEVTOOLS_PORT",
                description:
                    "Chrome DevTools リモートデバッグ用プロキシのポート。別マシンで DevTools を開いて `!login start` を使うときに使います。既定: `3000`",
                default: "3000"
            },
            chromiumPath: {
                name: "CHROMIUM_PATH",
                description: "Googleログイン用の Chrome／Chromium のパス。空なら自動検出",
                required: false
            },
            nodeEnv: {
                name: "NODE_ENV",
                description: "実行モード",
                default: "production",
                options: "production, development"
            },
            debugMode: {
                name: "DEBUG_MODE",
                description: "詳細ログをコンソールに出力",
                default: "no",
                options: "yes, no"
            }
        }
    },

    cookiesSetup: {
        title: "クッキー設定",
        subtitle:
            "クラウドで「ボット確認のためログイン」と出たときの対処。おすすめは組み込みの **`!login`** です。",
        why: {
            title: "なぜ必要？",
            description:
                "OVHcloud・AWS・GCP・Azureなど、クラウドやVPSで Rawon を動かしていると、次のような表示が出ることがあります：",
            error: "Sign in to confirm you're not a bot",
            explanation:
                "データセンターIPからのリクエストがブロックされることがあります。**Google アカウントで認証**すると有効なクッキーを取得し、その制限を回避できます。"
        },
        loginMethod: {
            title: "おすすめ: `!login` コマンド",
            description:
                "いちばん簡単なのは Puppeteer で実ブラウザを動かす **`!login`** フローです：",
            benefits: [
                "✅ 本物のブラウザで Google にログイン",
                "✅ クッキーを出力して自動保存",
                "✅ ログイン後にブラウザを閉じるので、ぶら下がりません",
                "✅ Docker ボリュームまたは `cache/` で再起動後も保持"
            ]
        },
        commandUsage: {
            title: "コマンドの使い方"
        },
        quickStart: {
            title: "すぐ試す",
            steps: [
                "Discord で `!login start` を実行する",
                "ボットが送った **DevTools のURL** を手元のブラウザで開く",
                "**リモート**のブラウザセッション側で Google ログインを完了する",
                "**使い捨てのGoogleアカウント**でサインインする（メインのアカウントではないほうが安全です）",
                "完了するとボットがクッキーを保存し、ブラウザを閉じます",
                "以降のリクエストは保存済みセッションを使います"
            ]
        },
        staleCookies: {
            title: "またボットチェックが出たら",
            description: "事業者側でローテーションされるとクッキーが古くなることがあります。そのときは：",
            steps: [
                "`!login logout` で古いクッキーとプロファイルを消す",
                "`!login start` で再度サインインし、新しいセッションにする"
            ]
        },
        prerequisites: {
            title: "前提条件",
            items: [
                "**サブ／使い捨ての Google アカウント**（**メインは使わない**でください）",
                "**非Docker:** ホストに Chrome または Chromium を入れてください",
                "**Docker:** Chromium は入っています。リモートから `!login` する場合は `DEVTOOLS_PORT` を公開してください（[設定](/docs/configuration) を参照）"
            ]
        },
        docker: {
            title: "Docker",
            persistence:
                "クッキーとプロファイルは、コンテナを再起動しても **`rawon:/app/cache`** 名前付きボリュームに残ります。",
            chromium: "公式イメージに Chromium が入っているので、イメージ側の追加設定なしで **`!login start`** が使えます。"
        },
        envVars: {
            title: "環境変数（`dev.env`）",
            intro: "任意の微調整（`dev.env.example` 参照）：",
            dockerComposeHint:
                "Docker では `docker-compose.yaml` の `ports` で DevTools 用ポートを公開してください。例："
        },
        duration: {
            title: "クッキーはどれくらいもつ？",
            description:
                "事業者がセッションを切り替えると古くなることがあります。次を守っている間はだいたい有効です：",
            conditions: [
                "セッションを無効化するログアウトをしていない",
                "パスワードを変えていない",
                "アカウントのセキュリティ設定でセッションを失効させていない",
                "不正利用として事業者にフラグが立っていない"
            ],
            footer: "切れたら `!login logout` のあと、もう一度 `!login start` してください。"
        },
        troubleshooting: {
            title: "トラブルシューティング",
            stillErrors: {
                title: "まだ \"Sign in to confirm you're not a bot\" と出る？",
                steps: [
                    "`!login status` でログインとクッキーの状態を確認する",
                    "`!login logout` のあと `!login start` で新しいセッションを作る"
                ]
            },
            browserWontStart: {
                title: "ブラウザが起動しない？",
                steps: [
                    "`!login status` のエラー内容を確認する",
                    "ベアメタルでは Chrome/Chromium を入れるか、`dev.env` で `CHROMIUM_PATH` を指定する",
                    "Docker では公式イメージならそのままで動くはずです"
                ]
            },
            accountSuspended: {
                title: "アカウントが停止された？",
                steps: [
                    "新しい使い捨て Google アカウントを作る",
                    "`!login logout` で古いセッションを消す",
                    "`!login start` で新アカウントでサインインする"
                ]
            }
        },
        manualAlternative: {
            title: "別案: 手動のクッキーファイル",
            description:
                "下記パスに **Netscape形式** のクッキーファイルを置くこともできます。あれば読み込みますが、手順は **`!login` のほうが簡単**です。",
            pathLabel: "パス"
        },
        security: {
            title: "セキュリティ上の注意",
            warningLabel: "警告",
            warnings: [
                "**使い捨て** の Google アカウントを使ってください。**メイン** は使わないでください",
                "DevTools のURLはリモートブラウザへの窓になります。**他人に広めない**でください",
                "クッキーファイルには**機微な**認証情報が含まれます"
            ]
        }
    },

    disclaimers: {
        title: "免責事項",
        subtitle: "ご利用の前によくお読みください。",
        warningBanner: "重要な法的情報",
        copyright: {
            title: "著作権・DMCA・知的財産",
            items: [
                "**所有権：** ボットが利用・再生・表示する知的財産は、運営者・メンテナー・コントリビューターによる**ものではありません**。ボットのコマンドで使われる音声・動画・画像なども含まれますが、これに限りません。",
                "**ホスティング事業者のポリシー：** DMCA で保護されたコンテンツのホストや配布を禁止している事業者もあります。著作権がある音楽・動画を再生する Discord ボットも対象になり得ます。\n- **そのようなプラットフォームへのデプロイは自己責任でお願いします**",
                "**利用者の責任：** このボットの使い方、およびどのコンテンツを再生するかについては、利用者ご自身が責任を負います。"
            ]
        },
        code: {
            title: "コードの改変",
            items: [
                "**ライセンス：** 本プロジェクトは [Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International (CC BY-NC-ND 4.0)](https://creativecommons.org/licenses/by-nc-nd/4.0/) です。条文全文はリポジトリの [`LICENSE`](https://github.com/stegripe/rawon/blob/main/LICENSE) をご覧ください。",
                "**無保証：** ライセンスのとおり、このコードの利用に起因する損害について**責任を負いません**。クレジット表記・非商用・改変素材の頒布制限など、ライセンス条項を守ってください。",
                "**クレジット：** 自分の原创作品であるかのような主張はせず、常に原作プロジェクトへ適切に帰属を示してください。"
            ]
        },
        licenseFooterPrefix: "ライセンス全文はリポジトリの",
        licenseLinkLabel: "LICENSE (CC BY-NC-ND 4.0)"
    },

    permissionCalculator: {
        title: "権限計算機",
        clientId: "クライアント ID",
        scope: "スコープ",
        redirectUri: "リダイレクト URI",
        permissions: "権限",
        permissionsNote:
            "色が付いている権限は、サーバーが2段階認証を求める場合、そのOAuthユーザーがアカウントで2FAを有効にする必要があります",
        general: "一般",
        voice: "ボイス",
        text: "テキスト",
        result: "結果",
        resultNote: "このリンクでボットをサーバーに招待できます"
    },

    common: {
        back: "戻る",
        copy: "コピー",
        default: "既定",
        required: "必須",
        optional: "任意",
        example: "例",
        learnMore: "詳しく見る",

        language: "言語",
        tip: "ヒント",
        warning: "警告",
        note: "注記"
    }
};
