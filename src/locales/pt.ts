import type { Translations } from "./en";

export const pt: Translations = {
    nav: {
        home: "Início",
        docs: "Documentação",
        gettingStarted: "Primeiros passos",
        configuration: "Configuração",
        cookiesSetup: "Configuração de cookies",
        disclaimers: "Avisos legais",
        permissionCalculator: "Calculadora de permissões",
        links: "Links"
    },

    home: {
        title: "Rawon",
        description:
            "Um bot de música (multi-) para Discord simples e poderoso, pensado para uso em produção. Fácil de usar, sem precisar programar.",
        invite: "Convidar",
        inviteBot: "Convidar o bot",
        support: "Suporte",
        viewDocs: "Ver documentação"
    },

    gettingStarted: {
        title: "Primeiros passos",
        subtitle:
            "Coloque o Rawon no ar em poucos minutos com nosso guia passo a passo.",
        features: {
            title: "✨ Recursos",
            items: [
                "🚀 Pronto para produção, sem precisar programar",
                "📺 Canal de pedidos para uma experiência musical mais fluida",
                "🎶 Suporte a YouTube, Spotify, SoundCloud e arquivos diretos",
                "🤖 Várias instâncias do bot para canais de voz diferentes",
                "⚡ Pré-cache inteligente de áudio para uma reprodução mais suave",
                "🍪 Login com Google integrado via Puppeteer para gerenciar cookies"
            ]
        },
        requirements: {
            title: "📋 Requisitos",
            nodeVersion: "**Node.js** versão `20.0.0` ou superior",
            discordToken:
                "**Token do bot do Discord** (obtenha no [Portal de desenvolvedores do Discord](https://discord.com/developers/applications))",
            optional: "**Opcional:** [FFmpeg](https://ffmpeg.org/) para processamento de áudio em instalações padrão (sem Docker) — As imagens Docker já incluem FFmpeg"
        },
        standardSetup: {
            title: "💻 Instalação padrão (Node.js)",
            steps: [
                "Baixe e instale os pré-requisitos acima",
                "Clone ou baixe este repositório",
                "Copie `.env.example` para `.env` e preencha os valores obrigatórios (no mínimo: `DISCORD_TOKEN`)",
                "Instale as dependências: `pnpm install`",
                "Compile o projeto: `pnpm run build`",
                "Inicie o bot: `pnpm start`"
            ],
            requestChannel:
                "(Opcional) Depois que o bot estiver online, configure um canal dedicado à música:"
        },
        dockerSetup: {
            title: "🐳 Instalação com Docker (recomendada)",
            composeTitle: "Com Docker Compose",
            composeSteps: [
                "Crie um arquivo `.env` com sua configuração (copie de `.env.example`)",
                "(Opcional) Crie `dev.env` a partir de `dev.env.example` para ajustes adicionais",
                "Crie um arquivo `docker-compose.yaml` (veja o exemplo abaixo)",
                "Inicie o bot: `docker compose up -d`",
                "Veja os logs: `docker logs -f rawon-bot`"
            ],
            runTitle: "Com docker run",
            volumeInfo: {
                title: "📁 Informações sobre volumes",
                description: "O volume `/app/cache` armazena:",
                items: [
                    "Binário do `yt-dlp` para streaming de áudio",
                    "`data.*` com configurações persistentes (canais de pedidos, estados do player)",
                    "Arquivos de áudio em cache (se o cache de áudio estiver ativado)",
                    "Arquivo de cookies e dados de perfil do login Google (veja [Configuração de cookies](/docs/cookies-setup))"
                ]
            },
            portInfo: {
                title: "🔌 Informações de porta",
                description:
                    "`DEVTOOLS_PORT` (padrão: `3000`) é usado para o proxy de depuração remota do Chrome DevTools. É necessário para `!login start` quando você se conecta de outra máquina. Defina `DEVTOOLS_PORT` em `dev.env` para usar outra porta e mapeie no Docker Compose ou no `docker run`."
            }
        },

        cookiesQuickStart: {
            title: "🍪 Cookies: solução rápida em hospedagem",
            description:
                "Em provedores na nuvem (AWS, GCP, Azure, Railway etc.) pode aparecer **\"Faça login para confirmar que você não é um robô\"**. Use o fluxo de login integrado:",
            steps: [
                "Execute `!login start` no Discord",
                "Abra a URL do DevTools que o bot enviar e conclua o login Google no navegador remoto",
                "Use `!login status` para verificar os cookies, ou `!login logout` e depois `!login start` para renovar"
            ],
            tip: "💡 Use uma **conta Google descartável**, não a conta principal. Veja o guia completo em [Configuração de cookies](/docs/cookies-setup) para mais detalhes."
        }
    },

    configuration: {
        title: "Configuração",
        subtitle:
            "Como os arquivos de configuração e as variáveis de ambiente do Rawon se encaixam.",
        overview: {
            title: "📄 Arquivos de configuração",
            intro: "As configurações são divididas em vários arquivos de propósito:",
            items: [
                "**`.env.example`** — Configurações essenciais (tokens Discord/Spotify, prefixo, IDs, atividades etc.). Copie para **`.env`** e preencha os valores.",
                "**`dev.env.example`** — Configurações opcionais de desenvolvimento (ativar prefixo/slash, sharding, porta DevTools para `!login`, caminho do Chromium, modo debug). Copie para **`dev.env`** quando precisar.",
                "**Comando `setup`** — Opções específicas do bot (cor do embed, emojis de sim/não, splash, prefixo alternativo, volume padrão, tipo de seleção, cache de áudio) são gerenciadas pelo **comando `setup`** (somente desenvolvedores) e salvas no banco. Use `<prefixo>setup view` para listar as opções disponíveis."
            ]
        },
        essential: {
            title: "⚡ Configurações essenciais (`.env`)",
            description:
                "Valores de `.env.example`. Somente **`DISCORD_TOKEN`** é estritamente obrigatório para rodar; adicione Spotify, token de letras e o restante conforme precisar.",
            discordToken: {
                name: "DISCORD_TOKEN",
                description:
                    "Token(s) do seu bot no [Portal de desenvolvedores do Discord](https://discord.com/developers/applications). Use tokens **separados por vírgula** para ativar o modo multi-bot.",
                required: true
            },
            spotify: {
                name: "Spotify API",
                description:
                    "Defina `SPOTIFY_CLIENT_ID` e `SPOTIFY_CLIENT_SECRET` em [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard). **Obrigatório para suporte ao Spotify.**",
                required: false
            },
            stegripeLyrics: {
                name: "STEGRIPE_API_LYRICS_TOKEN",
                description:
                    "Necessário para saída precisa do comando **lyrics**. Entre em contato com o desenvolvedor para obter acesso.",
                required: false
            },
            mainPrefix: {
                name: "MAIN_PREFIX",
                description:
                    "Prefixo principal dos comandos. Exemplo: `!` significa que você digita `!play` para tocar música",
                default: "!"
            },
            mainServer: {
                name: "MAIN_SERVER",
                description:
                    "ID do seu servidor principal para registro mais rápido de comandos slash. Deixe vazio para comandos globais (a atualização pode levar até uma hora)",
                required: false
            },
            devs: {
                name: "DEVS",
                description:
                    "IDs de usuário dos desenvolvedores do bot (separados por vírgula). Desenvolvedores podem usar comandos especiais, incluindo `setup` e ferramentas de `login`.",
                required: false
            },
            locale: {
                name: "LOCALE",
                description: "Idioma do bot nas respostas",
                default: "en-US",
                options:
                    "en-US, es-ES, fr-FR, id-ID, zh-CN, zh-TW, uk-UA, vi-VN, pt-BR, ru-RU, ja-JP, tr-TR, ko-KR"
            },
            activityTypes: {
                name: "ACTIVITY_TYPES",
                description:
                    "Tipos de atividade para cada entrada em `ACTIVITIES` (separados por vírgula). Deve coincidir com o número de atividades",
                options: "PLAYING, WATCHING, LISTENING, COMPETING",
                default: "PLAYING"
            },
            activities: {
                name: "ACTIVITIES",
                description:
                    "Linhas de status abaixo do nome do bot (separadas por vírgula). Placeholders: `{prefix}`, `{userCount}`, `{textChannelCount}`, `{serverCount}`, `{playingCount}`, `{username}`",
                required: false
            }
        },
        multiBot: {
            title: "🔄 Modo multi-bot",
            description:
                "O modo multi-bot é adaptativo — **sem configuração extra**. Um token executa um único bot; tokens **separados por vírgula** ativam o multi-bot automaticamente.",
            example: "Exemplo:",
            exampleCode: 'DISCORD_TOKEN="token1, token2, token3"',
            features: [
                "O **primeiro** token é o bot principal para comandos gerais",
                "Cada bot atende música aos usuários no **seu** canal de voz",
                "Se o bot principal não estiver em um servidor, o próximo bot disponível pode assumir",
                "Cada bot precisa da **própria** aplicação no Discord"
            ]
        },
        developer: {
            title: "🛠️ Configurações de desenvolvimento (`dev.env`)",
            description:
                "De `dev.env.example`. **Opcionais** — altere só se souber o que está fazendo.",
            enablePrefix: {
                name: "ENABLE_PREFIX",
                description: "Ativa ou desativa comandos com prefixo (ex.: `!play`)",
                default: "yes",
                options: "yes, no"
            },
            enableSlash: {
                name: "ENABLE_SLASH_COMMAND",
                description: "Ativa ou desativa comandos slash (ex.: `/play`)",
                default: "yes",
                options: "yes, no"
            },
            enableSharding: {
                name: "ENABLE_SHARDING",
                description:
                    "Ativa sharding para bots grandes (**somente modo com um token**)",
                default: "no",
                options: "yes, no"
            },
            devtoolsPort: {
                name: "DEVTOOLS_PORT",
                description:
                    "Porta do proxy de depuração remota do Chrome DevTools. Usada por `!login start` quando o DevTools é aberto de outra máquina. Padrão: `3000`",
                default: "3000"
            },
            chromiumPath: {
                name: "CHROMIUM_PATH",
                description:
                    "Caminho para Chrome/Chromium no login Google. Deixe vazio para detecção automática",
                required: false
            },
            nodeEnv: {
                name: "NODE_ENV",
                description: "Modo do ambiente de execução",
                default: "production",
                options: "production, development"
            },
            debugMode: {
                name: "DEBUG_MODE",
                description: "Logs de debug verbosos no console",
                default: "no",
                options: "yes, no"
            }
        }
    },

    cookiesSetup: {
        title: "Configuração de cookies",
        subtitle:
            "Corrija \"Faça login para confirmar que você não é um robô\" em hospedagem na nuvem. Recomendado: o comando integrado **`!login`**.",
        why: {
            title: "Por que preciso disso?",
            description:
                "Se você hospeda o Rawon em provedores como OVHcloud, AWS, GCP, Azure ou outros hosts na nuvem/VPS, pode ver:",
            error: "Faça login para confirmar que você não é um robô",
            explanation:
                "A plataforma costuma bloquear requisições vindas de IPs de datacenter. Autenticar com uma **conta Google** permite ao Rawon obter cookies válidos e contornar essa restrição."
        },
        loginMethod: {
            title: "Recomendado: comando `!login`",
            description:
                "A forma mais simples de configurar cookies é o fluxo integrado **`!login`** (navegador real via Puppeteer):",
            benefits: [
                "✅ Abre um navegador real para login Google",
                "✅ Exporta cookies e salva automaticamente",
                "✅ Fecha o navegador após o login — sem navegador em segundo plano",
                "✅ Persiste após reinícios (volume Docker ou pasta `cache/`)"
            ]
        },
        commandUsage: {
            title: "Uso do comando"
        },
        quickStart: {
            title: "Início rápido",
            steps: [
                "Execute `!login start` no Discord",
                "Abra no seu navegador local a **URL do DevTools** que o bot enviar",
                "Conclua o login Google na sessão **remota** do navegador",
                "Entre com uma **conta Google descartável** (não a principal)",
                "Ao terminar, o bot salva os cookies e fecha o navegador",
                "Pronto — as próximas requisições usam a sessão salva"
            ]
        },
        staleCookies: {
            title: "Se as verificações do bot voltarem",
            description:
                "Os cookies podem ficar inválidos quando o provedor os rotaciona. Então:",
            steps: [
                "Execute `!login logout` para limpar cookies e dados de perfil antigos",
                "Execute `!login start` e faça login de novo para uma sessão nova"
            ]
        },
        prerequisites: {
            title: "Pré-requisitos",
            items: [
                "Uma **conta Google secundária / descartável** (**não** use a conta principal)",
                "**Sem Docker:** Chrome ou Chromium instalado no host",
                "**Docker:** Chromium já incluso; mapeie `DEVTOOLS_PORT` se conectar ao `!login` remotamente (veja [Configuração](/docs/configuration))"
            ]
        },
        docker: {
            title: "Docker",
            persistence:
                "Cookies e dados de perfil persistem no volume nomeado **`rawon:/app/cache`** entre reinícios do contêiner.",
            chromium:
                "A imagem inclui Chromium, então **`!login start`** funciona sem passos extras no lado da imagem."
        },
        envVars: {
            title: "Variáveis de ambiente (`dev.env`)",
            intro: "Ajustes opcionais (veja `dev.env.example`):",
            dockerComposeHint:
                "No Docker, garanta que `ports` em `docker-compose.yaml` exponha a porta do DevTools, por exemplo:"
        },
        duration: {
            title: "Por quanto tempo os cookies duram?",
            description:
                "Podem ficar inválidos com o tempo porque os provedores rotacionam sessões. Em geral continuam válidos enquanto:",
            conditions: [
                "Você não encerrar sessão de modo que invalide a sessão",
                "Você não alterar a senha da conta",
                "Você não revogar a sessão nas configurações de segurança da conta",
                "O provedor não sinalizar atividade suspeita"
            ],
            footer:
                "Quando os cookies expirarem, execute `!login logout` e depois `!login start` de novo."
        },
        troubleshooting: {
            title: "Solução de problemas",
            stillErrors: {
                title: "Ainda vê \"Faça login para confirmar que você não é um robô\"?",
                steps: [
                    "Use `!login status` para inspecionar o estado do login e dos cookies",
                    "Execute `!login logout` e depois `!login start` para criar uma sessão nova"
                ]
            },
            browserWontStart: {
                title: "O navegador não inicia?",
                steps: [
                    "Veja `!login status` para detalhes do erro",
                    "Em bare metal, instale Chrome/Chromium ou defina `CHROMIUM_PATH` em `dev.env`",
                    "No Docker, o Chromium deve funcionar de imediato com a imagem oficial"
                ]
            },
            accountSuspended: {
                title: "Conta suspensa?",
                steps: [
                    "Crie uma nova conta Google descartável",
                    "Execute `!login logout` para apagar a sessão antiga",
                    "Execute `!login start` e entre com a nova conta"
                ]
            }
        },
        manualAlternative: {
            title: "Alternativa: arquivo de cookies manual",
            description:
                "Você pode colocar um arquivo de cookies em **formato Netscape** no caminho abaixo. O bot usará se existir; **`!login` continua recomendado** por ser mais simples.",
            pathLabel: "Caminho"
        },
        security: {
            title: "Notas de segurança",
            warningLabel: "AVISO",
            warnings: [
                "Use uma conta Google **descartável** — **não** a principal",
                "A URL do DevTools dá acesso à sessão remota do navegador — **não compartilhe publicamente**",
                "Arquivos de cookies contêm dados de autenticação **sensíveis**"
            ]
        }
    },

    disclaimers: {
        title: "Avisos legais",
        subtitle: "Leia com atenção antes de usar este bot.",
        warningBanner: "Informações legais importantes",
        copyright: {
            title: "Copyright, DMCA e propriedade intelectual",
            items: [
                "**Titularidade:** Qualquer propriedade intelectual usada, reproduzida ou exibida pelo bot **não nos pertence** a nós, aos mantenedores nem aos colaboradores. Isso inclui, entre outros, arquivos de áudio, vídeo e imagem usados nos comandos do bot.",
                "**Políticas do provedor de hospedagem:** Alguns provedores proíbem hospedar ou distribuir conteúdo protegido por DMCA. Isso inclui bots de música no Discord que reproduzem música/vídeo com direitos autorais.\n- **Faça deploy nessas plataformas por sua conta e risco**",
                "**Responsabilidade do usuário:** Você é responsável por como usa este bot e pelo conteúdo reproduzido por meio dele."
            ]
        },
        code: {
            title: "Modificações no código",
            items: [
                "**Licença:** Este projeto está sob [Creative Commons Atribuição-NãoComercial-SemDerivações 4.0 Internacional (CC BY-NC-ND 4.0)](https://creativecommons.org/licenses/by-nc-nd/4.0/). O texto legal completo está no arquivo [`LICENSE`](https://github.com/stegripe/rawon/blob/main/LICENSE) do repositório.",
                "**Sem garantia:** Conforme a licença, **não somos responsáveis** por danos ou prejuízos decorrentes do uso deste código. Siga os termos da licença sobre atribuição, uso não comercial e restrições ao compartilhar material adaptado.",
                "**Atribuição:** Nunca declare este projeto como obra original sua. Sempre forneça atribuição adequada ao projeto original."
            ]
        },
        licenseFooterPrefix: "Para o texto completo da licença, veja no repositório",
        licenseLinkLabel: "LICENSE (CC BY-NC-ND 4.0)"
    },

    permissionCalculator: {
        title: "Calculadora de permissões",
        clientId: "ID do cliente",
        scope: "Escopo",
        redirectUri: "URI de redirecionamento",
        permissions: "Permissões",
        permissionsNote:
            "Colorido indica que o usuário OAuth precisa ativar 2FA na conta se o servidor exigir 2FA",
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
        learnMore: "Saiba mais",

        language: "Idioma",
        tip: "Dica",
        warning: "Aviso",
        note: "Observação"
    }
};
