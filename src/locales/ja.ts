export const ja = {
    nav: {
        home: "ホーム",
        docs: "ドキュメント",
        gettingStarted: "はじめに",
        configuration: "設定",
        cookiesSetup: "Cookie設定",
        permissionCalculator: "権限計算機",
        links: "リンク"
    },

    home: {
        title: "Rawon",
        description:
            "あなたの制作欲求を満たすためのシンプルで強力なDiscord音楽ボット。",
        invite: "招待",
        support: "サポート",
        viewDocs: "ドキュメント"
    },

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
                "基本的な音楽コマンド（play、pause、skip、queue等）",
                "多言語サポート"
            ]
        },
        requirements: {
            title: "必要条件",
            nodeVersion: "**Node.js** バージョン`22.12.0`以上",
            discordToken:
                "**Discord Bot Token**（[Discord Developer Portal](https://discord.com/developers/applications)から取得）",
            optional: "**オプション：** SpotifyサポートのためのSpotify API認証情報"
        },
        standardSetup: {
            title: "標準セットアップ（Node.js）",
            steps: [
                "**Node.js** バージョン`22.12.0`以上をダウンロードしてインストール",
                "このリポジトリをクローンまたはダウンロード",
                "`.env_example`を`.env`にコピーして必要な値を入力（最低限：`DISCORD_TOKEN`）",
                "依存関係をインストール：`pnpm install`",
                "プロジェクトをビルド：`pnpm run build`",
                "ボットを起動：`pnpm start`"
            ],
            requestChannel:
                "（オプション）ボットがオンラインになった後、専用の音楽チャンネルを設定："
        },
        dockerSetup: {
            title: "Dockerセットアップ（推奨）",
            composeTitle: "Docker Composeを使用",
            composeSteps: [
                "`.env_example`からコピーして`.env`ファイルを作成",
                "`docker-compose.yaml`ファイルを作成（下記の例を参照）",
                "ボットを起動：`docker compose up -d`",
                "ログを確認：`docker logs -f rawon-bot`"
            ],
            runTitle: "Docker Runを使用",
            volumeInfo: {
                title: "ボリューム情報",
                description: "`/app/cache`ボリュームには以下が保存されます：",
                items: [
                    "オーディオストリーミング用の`yt-dlp`バイナリ",
                    "永続的な設定のための`data.json`（リクエストチャンネル、プレーヤー状態）",
                    "キャッシュされたオーディオファイル（オーディオキャッシュが有効な場合）"
                ]
            }
        },

        cookiesQuickStart: {
            title: "🍪 クイックスタート：Cookie設定",
            description:
                "クラウドプロバイダー（AWS、GCP、Azure、Railway等）でホスティングしている場合、「Sign in to confirm you're not a bot」エラーが発生することがあります。cookiesコマンドで簡単に修正できます：",
            steps: [
                "ブラウザからCookieをエクスポート（[Cookie設定ガイド](/docs/cookies-setup)を参照）",
                "Discordで「`!cookies add 1`」と入力",
                "`cookies.txt`ファイルをメッセージに添付",
                "完了！Cookieは即座に有効になります"
            ],
            tip: "💡 冗長性のために複数のCookieを追加できます。1つが失敗すると、Rawonは自動的に次に切り替わります！"
        }
    },

    configuration: {
        title: "設定",
        subtitle: "これらの設定でRawonをカスタマイズしてください。",
        essential: {
            title: "必須設定",
            description:
                "ボットを実行するために必要な最小限の設定です。**Discordトークン**を入力するだけで準備完了！",
            discordToken: {
                name: "DISCORD_TOKEN",
                description:
                    "[Discord Developer Portal](https://discord.com/developers/applications)からのDiscordボットトークン。これが**唯一の必須設定**です！",
                required: true
            },
            mainPrefix: {
                name: "MAIN_PREFIX",
                description: "メインコマンドプレフィックス。例：`!`は`!play`で音楽を再生することを意味します",
                default: "!"
            },
            mainServer: {
                name: "MAIN_SERVER",
                description: "スラッシュコマンド登録用のメインサーバーID。グローバルコマンドの場合は空欄（更新に最大1時間かかります）",
                required: false
            },
            locale: {
                name: "LOCALE",
                description: "ボットの言語 - ボットの応答に使用する言語を選択",
                default: "en-US",
                options:
                    "en-US, es-ES, fr-FR, id-ID, zh-CN, zh-TW, uk-UA, vi-VN, pt-BR, ru-RU, ja-JP, tr-TR"
            },
            spotify: {
                name: "Spotify API",
                description:
                    "Spotifyサポートのために[developer.spotify.com/dashboard](https://developer.spotify.com/dashboard)から認証情報を取得し、`SPOTIFY_CLIENT_ID`と`SPOTIFY_CLIENT_SECRET`を設定"
            }
        },
        optional: {
            title: "オプション設定",
            description: "Rawonの動作と外観をカスタマイズします。これらすべてオプションです - なくてもボットは正常に動作します！",
            altPrefix: {
                name: "ALT_PREFIX",
                description:
                    "代替プレフィックス（カンマ区切り）。@botメンションには`{mention}`を使用。例：`{mention},r!`で`@Rawon play`と`r!play`の両方が可能",
                default: "{mention}"
            },
            activities: {
                name: "ACTIVITIES",
                description:
                    "ボット名の下に表示されるステータスアクティビティ（カンマ区切り）。利用可能なプレースホルダー：`{prefix}`、`{userCount}`、`{textChannelCount}`、`{serverCount}`、`{playingCount}`、`{username}`"
            },
            activityTypes: {
                name: "ACTIVITY_TYPES",
                description: "各アクティビティのアクティビティタイプ（カンマ区切り）。`ACTIVITIES`の数と一致する必要があります",
                options: "PLAYING、WATCHING、LISTENING、COMPETING"
            },
            embedColor: {
                name: "EMBED_COLOR",
                description: "埋め込みカラー（16進数、`#`なし）。このカラーはすべてのボットメッセージの埋め込みに表示されます",
                default: "22C9FF"
            },
            emojis: {
                name: "絵文字",
                description: "成功（`YES_EMOJI`）と失敗（`NO_EMOJI`）の絵文字をカスタマイズ",
                defaults: "✅ / ❌"
            },
            musicSelection: {
                name: "MUSIC_SELECTION_TYPE",
                description: "検索結果の表示方法。`message`は番号付きリスト、`selectmenu`はドロップダウンメニューを表示",
                options: "message、selectmenu",
                default: "message"
            },
            audioCache: {
                name: "ENABLE_AUDIO_CACHE",
                description:
                    "**[実験的]** ダウンロードしたオーディオをキャッシュして繰り返し再生を高速化。ディスク容量を多く使用しますが、頻繁に再生される曲を高速化",
                default: "no"
            },
            requestChannelSplash: {
                name: "REQUEST_CHANNEL_SPLASH",
                description: "リクエストチャンネルプレーヤーの埋め込み用カスタム画像URL",
                default: "https://cdn.stegripe.org/images/rawon_splash.png"
            }
        },
        developer: {
            title: "🛠️ 開発者設定",
            description: "ボット開発者向けの詳細設定。**何をしているか分かっている場合のみ使用してください！**",
            devs: {
                name: "DEVS",
                description: "ボット開発者ID（カンマ区切り）。開発者は特別なコマンドにアクセスできます"
            },
            enablePrefix: {
                name: "ENABLE_PREFIX",
                description: "プレフィックスコマンド（`!play`など）を有効/無効化。スラッシュコマンドのみ使用したい場合に便利",
                default: "yes",
                options: "yes, no"
            },
            enableSlash: {
                name: "ENABLE_SLASH_COMMAND",
                description: "スラッシュコマンド（`/play`など）を有効/無効化。プレフィックスコマンドのみ使用したい場合に便利",
                default: "yes",
                options: "yes, no"
            },
            debugMode: {
                name: "DEBUG_MODE",
                description: "トラブルシューティング用のデバッグログを有効化。コンソールに詳細なログを表示",
                default: "no",
                options: "yes, no"
            }
        }
    },

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

        quickMethod: {
            title: "🚀 簡単な方法：Cookiesコマンドを使用（推奨）",
            description: "Cookieを管理する最も簡単な方法 - ファイル編集不要！",
            benefits: [
                "✅ 即座に動作 - 再起動不要",
                "✅ 自動ローテーション付きで複数のCookieをサポート",
                "✅ 1つのCookieが失敗すると、ボットは自動的に次を使用",
                "✅ ボット再起動後もCookieは保持されます"
            ],
            commands: {
                title: "📝 利用可能なコマンド",
                add: "`!cookies add <番号>` - Cookieを追加（cookies.txtファイルをメッセージに添付）",

            },
            quickStart: {
                title: "⚡ クイックスタート（3ステップ）",
                steps: [
                    "ブラウザからCookieをエクスポート（下記ガイドを参照）",
                    "Discordで「!cookies add 1」と入力し、cookies.txtファイルを添付",
                    "完了！Cookieは現在アクティブです"
                ]
            },
            multiCookie: {
                title: "💡 プロのコツ：複数のCookieを追加",
                description: "信頼性を高めるために異なるアカウントからCookieを追加："
            }
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
            title: "📖 Cookieのエクスポート方法",
            createAccount: {
                title: "ステップ1：使い捨てアカウントを作成",
                steps: [
                    "[アカウント作成ページ](https://accounts.google.com/signup)に移動",
                    "このボット専用の新しいアカウントを作成",
                    "⚠️ 重要：個人/メインアカウントは絶対に使用しないでください！"
                ]
            },
            login: {
                title: "ステップ2：動画プラットフォームにログイン",
                steps: [
                    "ブラウザを開く",
                    "[動画プラットフォーム](https://youtube.com)に移動",
                    "使い捨てアカウントでサインイン",
                    "プロンプトが表示されたら条件に同意"
                ]
            },
            extension: {
                title: "ステップ3：Cookieエクスポート拡張機能をインストール",
                chrome: "Chrome/Edge用：Chrome Web Storeから[**Get cookies.txt LOCALLY**](https://chromewebstore.google.com/detail/get-cookiestxt-locally/cclelndahbckbenkjhflpdbgdldlbecc)（推奨）をインストール",
                firefox: "Firefox用：Firefox Add-onsから[**cookies.txt**](https://addons.mozilla.org/en-US/firefox/addon/cookies-txt/)をインストール"
            },
            exportCookies: {
                title: "ステップ4：Cookieをエクスポート",
                steps: [
                    "[動画プラットフォームのウェブサイト](https://youtube.com)にいることを確認",
                    "ブラウザツールバーのCookie拡張機能アイコンをクリック",
                    "**Export**または**Export cookies for this site**を選択",
                    "ファイルを`cookies.txt`として保存"
                ]
            },
            upload: {
                title: "ステップ5：Rawonに追加",
                steps: [
                    "Rawonがメッセージを見られるチャンネルに移動",
                    "`!cookies add 1`と入力",
                    "cookies.txtファイルをメッセージに添付して送信",
                    "Rawonがcookieが追加されたことを確認します！"
                ]
            }
        },
        troubleshooting: {
            title: "🔧 トラブルシューティング",
            stillGettingErrors: {
                title: "まだ「Sign in to confirm you're not a bot」エラーが出ますか？",
                steps: [
                    "`!cookies list`でCookieの状態を確認",
                    "Cookieが「Failed」と表示されている場合、`!cookies reset`で再試行",
                    "冗長性のために異なるアカウントからCookieを追加"
                ]
            },
            allCookiesFailed: {
                title: "すべてのCookieが失敗しましたか？",
                steps: [
                    "新しい使い捨てアカウントを作成",
                    "新しいCookieをエクスポート",
                    "`!cookies add <番号>`で追加"
                ]
            },
            accountSuspended: {
                title: "アカウントが停止されましたか？",
                steps: [
                    "これは頻繁な使用で発生することがあります",
                    "単に新しい使い捨てアカウントを作成",
                    "新しいCookieをエクスポートして追加"
                ]
            }
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
            title: "🔒 セキュリティに関する注意",
            warnings: [
                "⚠️ Cookieファイルを誰とも共有しないでください",
                "⚠️ メインアカウントではなく使い捨てアカウントを使用してください",
                "⚠️ Cookieファイルには機密認証データが含まれています"
            ]
        }
    },



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

    common: {
        back: "戻る",
        copy: "コピー",
        default: "デフォルト",
        required: "必須",
        optional: "オプション",
        example: "例",
        learnMore: "詳細",

        language: "言語",
        tip: "ヒント",
        warning: "警告",
        note: "注意"
    }
};
