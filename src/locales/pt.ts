export const pt = {
    // Navigation
    nav: {
        home: "Início",
        docs: "Docs",
        gettingStarted: "Começar",
        configuration: "Configuração",
        cookiesSetup: "Config. Cookies",
        disclaimers: "Avisos Legais",
        permissionCalculator: "Calculadora Permissões",
        links: "Links"
    },

    // Home page
    home: {
        title: "Rawon",
        description:
            "Um bot de música Discord simples mas poderoso, criado para atender às suas necessidades de produção.",
        invite: "Convidar",
        support: "Suporte",
        viewDocs: "Ver Docs"
    },

    // Getting Started page
    gettingStarted: {
        title: "Começar",
        subtitle: "Coloque o Rawon em funcionamento em minutos com nosso guia passo a passo.",
        features: {
            title: "Recursos",
            items: [
                "Suporte a interações (comandos slash e botões)",
                "Canal de requisições para experiência musical perfeita",
                "Pronto para produção, sem necessidade de código",
                "Configurável e fácil de usar",
                "Comandos básicos de música (play, pause, skip, queue, etc.)",
                "Suporte multilíngue"
            ]
        },
        requirements: {
            title: "Requisitos",
            nodeVersion: "Node.js versão 22.12.0 ou superior",
            discordToken: "Token do Bot Discord (obter no Discord Developer Portal)",
            optional: "Opcional: Credenciais da API Spotify para suporte ao Spotify"
        },
        standardSetup: {
            title: "Configuração Padrão (Node.js)",
            steps: [
                "Baixe e instale o Node.js versão 22.12.0 ou superior",
                "Clone ou baixe este repositório",
                "Copie .env_example para .env e preencha os valores necessários (mínimo: DISCORD_TOKEN)",
                "Instale as dependências: pnpm install",
                "Compile o projeto: pnpm run build",
                "Inicie o bot: pnpm start"
            ],
            requestChannel: "(Opcional) Após o bot estar online, configure um canal de música dedicado:"
        },
        dockerSetup: {
            title: "Configuração Docker (Recomendado)",
            composeTitle: "Usando Docker Compose",
            composeSteps: [
                "Crie um arquivo .env com sua configuração (copie de .env_example)",
                "Crie um arquivo docker-compose.yaml (veja exemplo abaixo)",
                "Inicie o bot: docker compose up -d",
                "Ver logs: docker logs -f rawon-bot"
            ],
            runTitle: "Usando Docker Run",
            volumeInfo: {
                title: "Informações do Volume",
                description: "O volume /app/cache armazena:",
                items: [
                    "Binário yt-dlp para streaming de áudio",
                    "data.json para configurações persistentes (canais de requisição, estados do player)",
                    "Arquivos de áudio em cache (se o cache de áudio estiver habilitado)"
                ]
            }
        },
        railwaySetup: {
            title: "Deploy no Railway",
            description:
                "O Railway oferece $5 de créditos gratuitos mensais. Seu bot ficará online 24/7 enquanto o uso ficar abaixo de $5.",
            warning: "IMPORTANTE: Leia os Avisos Legais antes de fazer deploy no Railway."
        },
        cookiesQuickStart: {
            title: "🍪 Quick Start: Cookies Setup",
            description:
                "If you're hosting on cloud providers (AWS, GCP, Azure, Railway, etc.), you may get 'Sign in to confirm you're not a bot' errors. Fix it easily with the cookies command:",
            steps: [
                "Export cookies from your browser (see Cookies Setup guide)",
                "In Discord, type: !cookies add 1",
                "Attach your cookies.txt file to the message",
                "Done! The cookie takes effect immediately"
            ],
            tip: "💡 You can add multiple cookies for redundancy. When one fails, Rawon automatically switches to the next one!"
        }
    },

    // Configuration page
    configuration: {
        title: "Configuração",
        subtitle: "Configure o Rawon de acordo com suas necessidades com estas configurações.",
        essential: {
            title: "Configurações Essenciais",
            description: "Estas são as configurações mínimas necessárias para executar o bot.",
            discordToken: {
                name: "DISCORD_TOKEN",
                description: "Seu token de bot Discord do Discord Developer Portal",
                required: true
            },
            mainPrefix: {
                name: "MAIN_PREFIX",
                description: "Prefixo principal de comando",
                default: "!"
            },
            mainServer: {
                name: "MAIN_SERVER",
                description: "ID do seu servidor principal para registro de comandos slash",
                required: false
            },
            locale: {
                name: "LOCALE",
                description: "Idioma do bot",
                default: "en-US",
                options: "en-US, es-ES, fr-FR, id-ID, zh-CN, zh-TW, uk-UA, vi-VN, pt-BR, ru-RU, ja-JP, tr-TR"
            },
            spotify: {
                name: "Spotify API",
                description: "Para suporte ao Spotify, defina SPOTIFY_CLIENT_ID e SPOTIFY_CLIENT_SECRET"
            }
        },
        optional: {
            title: "Configurações Opcionais",
            description: "Personalize o comportamento e aparência do Rawon.",
            altPrefix: {
                name: "ALT_PREFIX",
                description: "Prefixos alternativos (separados por vírgula). Use {mention} para menção @bot",
                default: "{mention}"
            },
            activities: {
                name: "ACTIVITIES",
                description:
                    "Atividades de status do bot (separadas por vírgula). Formatos: {prefix}, {userCount}, {textChannelCount}, {serverCount}, {playingCount}, {username}"
            },
            activityTypes: {
                name: "ACTIVITY_TYPES",
                description: "Tipos de atividade para cada atividade (separados por vírgula)",
                options: "PLAYING, WATCHING, LISTENING, COMPETING"
            },
            embedColor: {
                name: "EMBED_COLOR",
                description: "Cor do embed em hex (sem #)",
                default: "22C9FF"
            },
            emojis: {
                name: "Emojis",
                description: "Personalize emojis de sucesso (YES_EMOJI) e erro (NO_EMOJI)",
                defaults: "✅ / ❌"
            },
            musicSelection: {
                name: "MUSIC_SELECTION_TYPE",
                description: "Estilo de seleção de música",
                options: "message, selectmenu",
                default: "message"
            },
            audioCache: {
                name: "ENABLE_AUDIO_CACHE",
                description: "[EXPERIMENTAL] Cache de áudio baixado para reprodução repetida mais rápida",
                default: "no"
            },
            requestChannelSplash: {
                name: "REQUEST_CHANNEL_SPLASH",
                description: "Custom image URL for the request channel player embed",
                default: "https://cdn.stegripe.org/images/rawon_splash.png"
            }
        },
        developer: {
            title: "🛠️ Developer Settings",
            description: "Advanced settings for bot developers. Only use if you know what you're doing!",
            devs: {
                name: "DEVS",
                description: "Bot developer IDs (comma-separated). Developers can access special commands"
            },
            enablePrefix: {
                name: "ENABLE_PREFIX",
                description: "Enable/disable prefix commands (like !play). Useful if you only want slash commands",
                default: "yes",
                options: "yes, no"
            },
            enableSlash: {
                name: "ENABLE_SLASH_COMMAND",
                description: "Enable/disable slash commands (like /play). Useful if you only want prefix commands",
                default: "yes",
                options: "yes, no"
            },
            debugMode: {
                name: "DEBUG_MODE",
                description: "Enable debug logging for troubleshooting. Shows detailed logs in console",
                default: "no",
                options: "yes, no"
            }
        }
    },

    // Cookies Setup page
    cookiesSetup: {
        title: "Configuração de Cookies",
        subtitle: "Corrija erros 'Sign in to confirm you're not a bot' em provedores de hospedagem.",
        why: {
            title: "Por que preciso disso?",
            description:
                "Se você está hospedando o Rawon em provedores de nuvem como OVHcloud, AWS, GCP, Azure ou outros serviços de hospedagem, pode encontrar o erro:",
            error: "Sign in to confirm you're not a bot",
            explanation:
                "Isso acontece porque a plataforma bloqueia requisições de endereços IP de data centers. Usando cookies de uma conta logada, você pode contornar essa restrição."
        },

        quickMethod: {
            title: "🚀 Easy Method: Using the Cookies Command (Recommended)",
            description: "The easiest way to manage cookies - no file editing needed!",
            benefits: [
                "✅ Works instantly - no restart needed",
                "✅ Supports multiple cookies with automatic rotation",
                "✅ When one cookie fails, bot automatically uses the next one",
                "✅ Cookies persist after bot restarts"
            ],
            commands: {
                title: "📝 Available Commands",
                add: "!cookies add <number> - Add a cookie (attach cookies.txt file to your message)",
                remove: "!cookies remove <number> - Remove a specific cookie",
                removeAll: "!cookies remove all - Remove all cookies",
                list: "!cookies list - Show all cookies and their status",
                reset: "!cookies reset - Reset failed status to retry all cookies"
            },
            quickStart: {
                title: "⚡ Quick Start (3 steps)",
                steps: [
                    "Export cookies from your browser (see guide below)",
                    "In Discord, type: !cookies add 1 and attach your cookies.txt file",
                    "Done! The cookie is now active"
                ]
            },
            multiCookie: {
                title: "💡 Pro Tip: Add Multiple Cookies",
                description: "Add cookies from different accounts for better reliability:",
                example: "!cookies add 1 (attach first cookies.txt)\n!cookies add 2 (attach second cookies.txt from another account)\n!cookies add 3 (attach third cookies.txt)"
            }
        },
        prerequisites: {
            title: "Pré-requisitos",
            items: [
                "Uma conta secundária/descartável (NÃO use sua conta principal por razões de segurança)",
                "Um navegador web (Chrome, Firefox ou Edge)",
                "Uma extensão de exportação de cookies",
                "Para usuários não-Docker: Runtime Deno JavaScript (necessário para resolução de assinatura yt-dlp)"
            ]
        },
        steps: {
            title: "Guia Passo a Passo",
            createAccount: {
                title: "Passo 1: Criar uma Conta Descartável",
                steps: [
                    "Vá para Criação de Conta",
                    "Crie uma nova conta especificamente para este bot",
                    "Importante: NÃO use sua conta pessoal/principal"
                ]
            },
            login: {
                title: "Passo 2: Fazer Login na Plataforma",
                steps: [
                    "Abra seu navegador",
                    "Vá para a plataforma (YouTube)",
                    "Faça login com sua conta descartável",
                    "Aceite os termos se solicitado"
                ]
            },
            extension: {
                title: "Passo 3: Instalar Extensão de Exportação de Cookies",
                chrome: "Para Chrome/Edge: Instale 'Get cookies.txt LOCALLY' ou 'cookies.txt'",
                firefox: "Para Firefox: Instale 'cookies.txt'"
            },
            exportCookies: {
                title: "Passo 4: Exportar Cookies",
                steps: [
                    "Certifique-se de estar no site da plataforma",
                    "Clique no ícone da extensão de cookies na barra de ferramentas",
                    "Escolha 'Export' ou 'Export cookies for this site'",
                    "Salve o arquivo como cookies.txt"
                ]
            },
            upload: {
                title: "Passo 5: Enviar para Seu Servidor",
                steps: [
                    "Crie uma pasta cache no diretório do Rawon se não existir",
                    "Envie o arquivo cookies.txt para a pasta cache",
                    "O caminho deve ser: ./cache/cookies.txt"
                ]
            }
        },
        troubleshooting: {
            title: "🔧 Troubleshooting",
            stillGettingErrors: {
                title: "Still getting 'Sign in to confirm you're not a bot' errors?",
                steps: [
                    "Use !cookies list to check cookie status",
                    "If a cookie shows 'Failed', try !cookies reset to retry",
                    "Add more cookies from different accounts for redundancy"
                ]
            },
            allCookiesFailed: {
                title: "All cookies failed?",
                steps: [
                    "Create new throwaway accounts",
                    "Export fresh cookies",
                    "Add them with !cookies add <number>"
                ]
            },
            accountSuspended: {
                title: "Account got suspended?",
                steps: [
                    "This can happen with heavy usage",
                    "Simply create a new throwaway account",
                    "Export new cookies and add them"
                ]
            }
        },
        duration: {
            title: "Quanto Tempo os Cookies Duram?",
            description:
                "Boas notícias: Os cookies da plataforma NÃO expiram regularmente. Eles permanecerão válidos enquanto:",
            conditions: [
                "Você não fizer logout da plataforma no navegador",
                "Você não mudar a senha da conta",
                "Você não revogar a sessão nas configurações da conta",
                "A plataforma não detectar atividade suspeita"
            ],
            tips: "Na prática, os cookies podem durar meses ou até anos se você seguir as melhores práticas."
        },
        security: {
            title: "Notas de Segurança",
            warnings: [
                "Nunca compartilhe seu arquivo de cookies com ninguém",
                "Use uma conta descartável, NÃO sua conta principal",
                "O arquivo de cookies contém dados de autenticação sensíveis",
                "Adicione cookies.txt ao seu .gitignore para evitar commits acidentais"
            ]
        }
    },

    // Disclaimers page
    disclaimers: {
        title: "Avisos Legais",
        subtitle: "Por favor, leia com atenção antes de usar este bot.",
        warningBanner: "Informações legais importantes",
        copyright: {
            title: "Direitos Autorais, DMCA e Propriedade Intelectual",
            items: [
                "Propriedade: Qualquer propriedade intelectual usada, reproduzida ou exibida pelo bot não é de nossa propriedade, dos mantenedores ou de quaisquer contribuidores. Isso inclui, mas não se limita a, arquivos de áudio, vídeo e imagem usados nos comandos do bot.",
                "Políticas de Provedores de Hospedagem: Alguns provedores de hospedagem (como Railway) proíbem hospedar ou distribuir conteúdo protegido por DMCA. Isso inclui bots de música Discord que reproduzem música/vídeo protegido por direitos autorais. Faça deploy em tais plataformas por sua conta e risco.",
                "Responsabilidade do Usuário: Você é responsável por como usa este bot e qual conteúdo é reproduzido através dele."
            ]
        },
        code: {
            title: "Modificações de Código",
            items: [
                "Licença: Este bot é open source e pode ser modificado e redistribuído sob a licença AGPL-3.0.",
                "Sem Garantia: Conforme declarado na licença, não somos responsáveis por quaisquer danos ou perdas resultantes de modificar, redistribuir ou usar este código.",
                "Atribuição: Nunca alegue que este projeto é seu próprio trabalho original. Sempre forneça a atribuição adequada ao projeto original."
            ]
        }
    },

    // Permission Calculator page
    permissionCalculator: {
        title: "Calculadora de Permissões",
        clientId: "ID do Cliente",
        scope: "Escopo",
        redirectUri: "URI de Redirecionamento",
        permissions: "Permissões",
        permissionsNote:
            "Colorido significa que o usuário OAuth precisa habilitar 2FA em sua conta se o servidor exigir 2FA",
        general: "Geral",
        voice: "Voz",
        text: "Texto",
        result: "Resultado",
        resultNote: "Este é o link que você pode usar para adicionar o bot ao seu servidor"
    },

    // Common
    common: {
        back: "Voltar",
        copy: "Copiar",
        default: "Padrão",
        required: "Obrigatório",
        optional: "Opcional",
        example: "Exemplo",
        learnMore: "Saiba Mais",
        deployOnRailway: "Deploy no Railway",
        language: "Idioma",
        tip: "Tip",
        warning: "Warning",
        note: "Note"
    }
};
