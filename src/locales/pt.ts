export const pt = {
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

    home: {
        title: "Rawon",
        description:
            "Um bot de música Discord simples mas poderoso, criado para atender às suas necessidades de produção.",
        invite: "Convidar",
        inviteBot: "Convidar Bot",
        support: "Suporte",
        viewDocs: "Ver Docs"
    },

    gettingStarted: {
        title: "Começar",
        subtitle: "Coloque o Rawon em funcionamento em minutos com nosso guia passo a passo.",
        features: {
            title: "Recursos",
            items: [
                "🚀 Pronto para produção, sem necessidade de código",
                "📺 Canal de requisições para experiência musical perfeita",
                "🤖 Execute várias instâncias de bot para diferentes canais de voz",
                "⚡ Pré-cache de áudio inteligente para reprodução mais suave",
                "🎶 Suporte para YouTube, Spotify e SoundCloud",
                "🔄 Rotação multi-cookie para reprodução ininterrupta"
            ]
        },
        requirements: {
            title: "Requisitos",
            nodeVersion: "**Node.js** versão `22.12.0` ou superior",
            discordToken: "**Token do Bot Discord** (obter no [Discord Developer Portal](https://discord.com/developers/applications))",
            optional: "**Opcional:** Credenciais da API Spotify para suporte ao Spotify"
        },
        standardSetup: {
            title: "Configuração Padrão (Node.js)",
            steps: [
                "Baixe e instale **Node.js** versão `22.12.0` ou superior",
                "Clone ou baixe este repositório",
                "Copie `.env.example` para `.env` e preencha os valores necessários (mínimo: `DISCORD_TOKEN`)",
                "Instale as dependências: `pnpm install`",
                "Compile o projeto: `pnpm run build`",
                "Inicie o bot: `pnpm start`"
            ],
            requestChannel: "(Opcional) Após o bot estar online, configure um canal de música dedicado:"
        },
        dockerSetup: {
            title: "Configuração Docker (Recomendado)",
            composeTitle: "Usando Docker Compose",
            composeSteps: [
                "Crie um arquivo `.env` com sua configuração (copie de `.env.example`)",
                "Crie um arquivo `docker-compose.yaml` (veja exemplo abaixo)",
                "Inicie o bot: `docker compose up -d`",
                "Ver logs: `docker logs -f rawon-bot`"
            ],
            runTitle: "Usando Docker Run",
            volumeInfo: {
                title: "Informações do Volume",
                description: "O volume `/app/cache` armazena:",
                items: [
                    "Binário `yt-dlp` para streaming de áudio",
                    "`data.*` para configurações persistentes (canais de requisição, estados do player)",
                    "Arquivos de áudio em cache (se o cache de áudio estiver habilitado)",
                    "Arquivos de cookies para autenticação do YouTube"
                ]
            }
        },

        cookiesQuickStart: {
            title: "🍪 Início Rápido: Configuração de Cookies",
            description:
                "Se você está hospedando em provedores de nuvem (AWS, GCP, Azure, Railway, etc.), pode receber erros \"Sign in to confirm you're not a bot\". Corrija facilmente com o comando cookies:",
            steps: [
                "Exporte cookies do seu navegador (veja o [guia de Config. Cookies](/docs/cookies-setup))",
                "No Discord, digite: `!cookies add 1`",
                "Anexe seu arquivo `cookies.txt` à mensagem",
                "Pronto! O cookie entra em vigor imediatamente"
            ],
            tip: "💡 Você pode adicionar múltiplos cookies para redundância. Quando um falha, Rawon automaticamente muda para o próximo!"
        }
    },

    configuration: {
        title: "Configuração",
        subtitle: "Configure o Rawon de acordo com suas necessidades com estas configurações.",
        essential: {
            title: "Configurações Essenciais",
            description: "Estas são as configurações mínimas necessárias para executar o bot. Preencha seu **token do Discord** e está pronto!",
            discordToken: {
                name: "DISCORD_TOKEN",
                description: "Seu token de bot Discord do [Discord Developer Portal](https://discord.com/developers/applications). Esta é a **única configuração OBRIGATÓRIA**!",
                required: true
            },
            mainPrefix: {
                name: "MAIN_PREFIX",
                description: "Prefixo principal de comando. Exemplo: `!` significa que você digita `!play` para tocar música",
                default: "!"
            },
            mainServer: {
                name: "MAIN_SERVER",
                description: "ID do seu servidor principal para registro mais rápido de comandos slash. Deixe vazio para comandos globais (leva até 1 hora para atualizar)",
                required: false
            },
            locale: {
                name: "LOCALE",
                description: "Idioma do bot - escolha seu idioma preferido para as respostas do bot",
                default: "en-US",
                options: "en-US, es-ES, fr-FR, id-ID, zh-CN, zh-TW, uk-UA, vi-VN, pt-BR, ru-RU, ja-JP, tr-TR"
            },
            spotify: {
                name: "Spotify API",
                description: "Para suporte ao Spotify, obtenha suas credenciais em [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard) e defina `SPOTIFY_CLIENT_ID` e `SPOTIFY_CLIENT_SECRET`"
            }
        },
        optional: {
            title: "Configurações Opcionais",
            description: "Personalize o comportamento e aparência do Rawon. Todas estas são opcionais - o bot funciona bem sem elas!",
            altPrefix: {
                name: "ALT_PREFIX",
                description: "Prefixos alternativos (separados por vírgula). Use `{mention}` para menção @bot. Exemplo: `{mention},r!` permite `@Rawon play` e `r!play`",
                default: "{mention}"
            },
            activities: {
                name: "ACTIVITIES",
                description:
                    "Atividades de status do bot (separadas por vírgula). Formatos: `{prefix}`, `{userCount}`, `{textChannelCount}`, `{serverCount}`, `{playingCount}`, `{username}`"
            },
            activityTypes: {
                name: "ACTIVITY_TYPES",
                description: "Tipos de atividade para cada atividade (separados por vírgula). Deve corresponder ao número de `ACTIVITIES`",
                options: "PLAYING, WATCHING, LISTENING, COMPETING"
            },
            embedColor: {
                name: "EMBED_COLOR",
                description: "Cor do embed em hex (sem `#`). Esta cor aparece em todos os embeds do bot",
                default: "22C9FF"
            },
            emojis: {
                name: "Emojis",
                description: "Personalize emojis de sucesso (`YES_EMOJI`) e erro (`NO_EMOJI`)",
                defaults: "✅ / ❌"
            },
            musicSelection: {
                name: "MUSIC_SELECTION_TYPE",
                description: "Como os resultados de pesquisa são exibidos. `message` mostra lista numerada, `selectmenu` mostra menu dropdown",
                options: "message, selectmenu",
                default: "message"
            },
            audioCache: {
                name: "ENABLE_AUDIO_CACHE",
                description: "**[EXPERIMENTAL]** Cache de áudio baixado para reprodução repetida mais rápida. Usa mais espaço em disco mas acelera músicas frequentes",
                default: "no"
            },
            requestChannelSplash: {
                name: "REQUEST_CHANNEL_SPLASH",
                description: "URL de imagem personalizada para o embed do player do canal de requisição",
                default: "https://cdn.stegripe.org/images/rawon_splash.png"
            }
        },
        developer: {
            title: "🛠️ Configurações de Desenvolvedor",
            description: "Configurações avançadas para desenvolvedores de bots. **Use apenas se você sabe o que está fazendo!**",
            devs: {
                name: "DEVS",
                description: "IDs de desenvolvedores do bot (separados por vírgula). Desenvolvedores podem acessar comandos especiais"
            },
            enablePrefix: {
                name: "ENABLE_PREFIX",
                description: "Ativar/desativar comandos com prefixo (como `!play`). Útil se você quer apenas comandos slash",
                default: "yes",
                options: "yes, no"
            },
            enableSlash: {
                name: "ENABLE_SLASH_COMMAND",
                description: "Ativar/desativar comandos slash (como `/play`). Útil se você quer apenas comandos com prefixo",
                default: "yes",
                options: "yes, no"
            },
            debugMode: {
                name: "DEBUG_MODE",
                description: "Ativar logs de depuração para solução de problemas. Mostra logs detalhados no console",
                default: "no",
                options: "yes, no"
            }
        }
    },

    cookiesSetup: {
        title: "Configuração de Cookies",
        subtitle: "Corrija erros \"Sign in to confirm you're not a bot\" em provedores de hospedagem.",
        why: {
            title: "Por que preciso disso?",
            description:
                "Se você está hospedando o Rawon em provedores de nuvem como OVHcloud, AWS, GCP, Azure ou outros serviços de hospedagem, pode encontrar o erro:",
            error: "Sign in to confirm you're not a bot",
            explanation:
                "Isso acontece porque a plataforma bloqueia requisições de endereços IP de data centers. Usando cookies de uma conta logada, você pode contornar essa restrição."
        },

        quickMethod: {
            title: "🚀 Método Fácil: Usando o Comando Cookies (Recomendado)",
            description: "A maneira mais fácil de gerenciar cookies - sem edição de arquivos!",
            benefits: [
                "✅ Funciona instantaneamente - sem reinício necessário",
                "✅ Suporta múltiplos cookies com rotação automática",
                "✅ Quando um cookie falha, o bot automaticamente usa o próximo",
                "✅ Cookies persistem após reinícios do bot"
            ],
            commands: {
                title: "📝 Comandos Disponíveis",
                add: "`!cookies add <número>` - Adicionar um cookie (anexe o arquivo cookies.txt à sua mensagem)",

            },
            quickStart: {
                title: "⚡ Início Rápido (3 passos)",
                steps: [
                    "Exporte cookies do seu navegador (veja o guia abaixo)",
                    "No Discord, digite: `!cookies add 1` e anexe seu arquivo cookies.txt",
                    "Pronto! O cookie agora está ativo"
                ]
            },
            multiCookie: {
                title: "💡 Dica Pro: Adicione Múltiplos Cookies",
                description: "Adicione cookies de diferentes contas para melhor confiabilidade:"
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
            title: "📖 Como Exportar Cookies",
            createAccount: {
                title: "Passo 1: Criar uma Conta Descartável",
                steps: [
                    "Vá para a [página de criação de conta](https://accounts.google.com/signup)",
                    "Crie uma nova conta especificamente para este bot",
                    "⚠️ Importante: NUNCA use sua conta pessoal/principal!"
                ]
            },
            login: {
                title: "Passo 2: Fazer Login na Plataforma de Vídeo",
                steps: [
                    "Abra seu navegador",
                    "Vá para [a plataforma de vídeo](https://youtube.com)",
                    "Faça login com sua conta descartável",
                    "Aceite os termos se solicitado"
                ]
            },
            extension: {
                title: "Passo 3: Instalar Extensão de Exportação de Cookies",
                chrome: "Para Chrome/Edge: Instale [**Get cookies.txt LOCALLY**](https://chromewebstore.google.com/detail/get-cookiestxt-locally/cclelndahbckbenkjhflpdbgdldlbecc) (recomendado) da Chrome Web Store",
                firefox: "Para Firefox: Instale [**cookies.txt**](https://addons.mozilla.org/en-US/firefox/addon/cookies-txt/) do Firefox Add-ons"
            },
            exportCookies: {
                title: "Passo 4: Exportar Cookies",
                steps: [
                    "Certifique-se de estar no [site da plataforma de vídeo](https://youtube.com)",
                    "Clique no ícone da extensão de cookies na barra de ferramentas",
                    "Escolha **Export** ou **Export cookies for this site**",
                    "Salve o arquivo como `cookies.txt`"
                ]
            },
            upload: {
                title: "Passo 5: Adicionar ao Rawon",
                steps: [
                    "Vá para qualquer canal onde Rawon pode ver suas mensagens",
                    "Digite: `!cookies add 1`",
                    "Anexe o arquivo cookies.txt à sua mensagem e envie",
                    "Rawon confirmará que o cookie foi adicionado!"
                ]
            }
        },
        troubleshooting: {
            title: "🔧 Solução de Problemas",
            stillGettingErrors: {
                title: "Ainda recebendo erros \"Sign in to confirm you're not a bot\"?",
                steps: [
                    "Use `!cookies list` para verificar o status dos cookies",
                    "Se um cookie mostrar **Failed**, tente `!cookies reset` para tentar novamente",
                    "Adicione mais cookies de diferentes contas para redundância"
                ]
            },
            allCookiesFailed: {
                title: "Todos os cookies falharam?",
                steps: [
                    "Crie novas contas descartáveis",
                    "Exporte cookies novos",
                    "Adicione-os com `!cookies add <número>`"
                ]
            },
            accountSuspended: {
                title: "Conta foi suspensa?",
                steps: [
                    "Isso pode acontecer com uso intenso",
                    "Simplesmente crie uma nova conta descartável",
                    "Exporte novos cookies e adicione-os"
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
            title: "🔒 Notas de Segurança",
            warnings: [
                "⚠️ Nunca compartilhe seu arquivo de cookies com ninguém",
                "⚠️ Use uma conta descartável, NÃO sua conta principal",
                "⚠️ O arquivo de cookies contém dados de autenticação sensíveis"
            ]
        }
    },

    disclaimers: {
        title: "Avisos Legais",
        subtitle: "Por favor, leia com atenção antes de usar este bot.",
        warningBanner: "Informações legais importantes",
        copyright: {
            title: "Direitos Autorais, DMCA e Propriedade Intelectual",
            items: [
                "**Propriedade:** Qualquer propriedade intelectual usada, reproduzida ou exibida pelo bot não é de nossa propriedade, dos mantenedores ou de quaisquer contribuidores. Isso inclui, mas não se limita a, arquivos de áudio, vídeo e imagem usados nos comandos do bot.",
                "**Políticas de Provedores de Hospedagem:** Alguns provedores de hospedagem proíbem hospedar ou distribuir conteúdo protegido por DMCA. Isso inclui bots de música Discord que reproduzem música/vídeo protegido por direitos autorais. Faça deploy em tais plataformas por sua conta e risco.",
                "**Responsabilidade do Usuário:** Você é responsável por como usa este bot e qual conteúdo é reproduzido através dele."
            ]
        },
        code: {
            title: "Modificações de Código",
            items: [
                "**Licença:** Este bot é open source e pode ser modificado e redistribuído sob a licença **AGPL-3.0**.",
                "**Sem Garantia:** Conforme declarado na licença, não somos responsáveis por quaisquer danos ou perdas resultantes de modificar, redistribuir ou usar este código.",
                "**Atribuição:** Nunca alegue que este projeto é seu próprio trabalho original. Sempre forneça a atribuição adequada ao projeto original."
            ]
        }
    },

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

    common: {
        back: "Voltar",
        copy: "Copiar",
        default: "Padrão",
        required: "Obrigatório",
        optional: "Opcional",
        example: "Exemplo",
        learnMore: "Saiba Mais",

        language: "Idioma",
        tip: "Dica",
        warning: "Aviso",
        note: "Nota"
    }
};
