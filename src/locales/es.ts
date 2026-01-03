export const es = {
    nav: {
        home: "Inicio",
        docs: "Docs",
        gettingStarted: "Comenzar",
        configuration: "Configuración",
        cookiesSetup: "Config. Cookies",

        permissionCalculator: "Calculadora de Permisos",
        links: "Enlaces"
    },

    home: {
        title: "Rawon",
        description:
            "Un bot de música de Discord simple pero potente, creado para cumplir tus deseos de producción. Fácil de usar, sin necesidad de código.",
        invite: "Invitar",
        support: "Soporte",
        viewDocs: "Ver Docs"
    },

    gettingStarted: {
        title: "Comenzar",
        subtitle:
            "Pon Rawon en funcionamiento en minutos con nuestra guía paso a paso.",
        features: {
            title: "✨ Características",
            items: [
                "🎮 Soporte de interacción (comandos slash y botones)",
                "📺 Canal de solicitud para una experiencia musical perfecta",
                "🚀 Listo para producción, sin necesidad de código",
                "🎵 Comandos básicos de música (play, pause, skip, queue, etc.)",
                "🌍 Soporte multilingüe (12 idiomas)",
                "🔄 Rotación multi-cookie para reproducción ininterrumpida",
                "⚡ Pre-caché de audio inteligente para reproducción más suave",
                "🎶 Soporte para múltiples plataformas de música (sitios de video, Spotify, SoundCloud)"
            ]
        },
        requirements: {
            title: "📋 Requisitos",
            nodeVersion: "**Node.js** versión `22.12.0` o superior",
            discordToken:
                "**Token de Bot de Discord** (obtén desde [Discord Developer Portal](https://discord.com/developers/applications))",
            optional: "**Opcional:** Credenciales de API de Spotify para soporte de Spotify"
        },
        standardSetup: {
            title: "💻 Configuración Estándar (Node.js)",
            steps: [
                "Descarga e instala **Node.js** versión `22.12.0` o superior",
                "Clona o descarga este repositorio",
                "Copia `.env_example` a `.env` y rellena los valores requeridos (mínimo: `DISCORD_TOKEN`)",
                "Instala dependencias: `pnpm install`",
                "Compila el proyecto: `pnpm run build`",
                "Inicia el bot: `pnpm start`"
            ],
            requestChannel:
                "(Opcional) Después de que el bot esté en línea, configura un canal de música dedicado:"
        },
        dockerSetup: {
            title: "🐳 Configuración Docker (Recomendado)",
            composeTitle: "Usando Docker Compose",
            composeSteps: [
                "Crea un archivo `.env` con tu configuración (copia de `.env_example`)",
                "Crea un archivo `docker-compose.yaml` (ver ejemplo abajo)",
                "Inicia el bot: `docker compose up -d`",
                "Ver logs: `docker logs -f rawon-bot`"
            ],
            runTitle: "Usando Docker Run",
            volumeInfo: {
                title: "📁 Información del Volumen",
                description: "El volumen `/app/cache` almacena:",
                items: [
                    "Binario `yt-dlp` para streaming de audio",
                    "`data.json` para configuraciones persistentes (canales de solicitud, estados del reproductor)",
                    "Archivos de audio en caché (si el caché de audio está habilitado)",
                    "Archivos de cookies para autenticación de plataforma de video"
                ]
            }
        },

        cookiesQuickStart: {
            title: "🍪 Inicio Rápido: Configuración de Cookies",
            description:
                "Si alojas en proveedores de nube (AWS, GCP, Azure, Railway, etc.), puedes obtener errores \"Sign in to confirm you're not a bot\". Corrígelo fácilmente con el comando cookies:",
            steps: [
                "Exporta cookies desde tu navegador (ver [guía de Configuración de Cookies](/docs/cookies-setup))",
                "En Discord, escribe: `!cookies add 1`",
                "Adjunta tu archivo `cookies.txt` al mensaje",
                "¡Listo! La cookie tiene efecto inmediato"
            ],
            tip: "💡 ¡Puedes agregar múltiples cookies para redundancia. Cuando una falla, Rawon cambia automáticamente a la siguiente!"
        }
    },

    configuration: {
        title: "Configuración",
        subtitle: "Configura Rawon según tus necesidades con estos ajustes.",
        essential: {
            title: "⚡ Configuración Esencial",
            description:
                "Estas son las configuraciones mínimas para ejecutar el bot. ¡Solo rellena tu **token de Discord** y listo!",
            discordToken: {
                name: "DISCORD_TOKEN",
                description:
                    "Tu token de bot de Discord desde [Discord Developer Portal](https://discord.com/developers/applications). ¡Esta es la **única configuración REQUERIDA**!",
                required: true
            },
            mainPrefix: {
                name: "MAIN_PREFIX",
                description: "Prefijo de comando principal. Ejemplo: `!` significa que escribes `!play` para reproducir música",
                default: "!"
            },
            mainServer: {
                name: "MAIN_SERVER",
                description: "ID de tu servidor principal para registro más rápido de comandos slash. Déjalo vacío para comandos globales (tarda hasta 1 hora en actualizar)",
                required: false
            },
            locale: {
                name: "LOCALE",
                description: "Idioma del bot - elige tu idioma preferido para las respuestas del bot",
                default: "en-US",
                options:
                    "en-US, es-ES, fr-FR, id-ID, zh-CN, zh-TW, uk-UA, vi-VN, pt-BR, ru-RU, ja-JP, tr-TR"
            },
            spotify: {
                name: "Spotify API",
                description:
                    "Para soporte de Spotify, obtén tus credenciales de [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard) y configura `SPOTIFY_CLIENT_ID` y `SPOTIFY_CLIENT_SECRET`"
            }
        },
        optional: {
            title: "🎨 Configuración Opcional",
            description: "Personaliza el comportamiento y apariencia de Rawon. ¡Todo esto es opcional - el bot funciona bien sin ellos!",
            altPrefix: {
                name: "ALT_PREFIX",
                description:
                    "Prefijos alternativos (separados por coma). Usa `{mention}` para permitir @bot como prefijo. Ejemplo: `{mention},r!` permite tanto `@Rawon play` como `r!play`",
                default: "{mention}"
            },
            activities: {
                name: "ACTIVITIES",
                description:
                    "Actividades de estado del bot mostradas bajo el nombre del bot (separadas por coma). Placeholders disponibles: `{prefix}`, `{userCount}`, `{textChannelCount}`, `{serverCount}`, `{playingCount}`, `{username}`"
            },
            activityTypes: {
                name: "ACTIVITY_TYPES",
                description: "Tipos de actividad para cada actividad arriba (separados por coma). Debe coincidir con el número de `ACTIVITIES`",
                options: "PLAYING, WATCHING, LISTENING, COMPETING"
            },
            embedColor: {
                name: "EMBED_COLOR",
                description: "Color de embed en hex (sin `#`). Este color aparece en todos los embeds de mensajes del bot",
                default: "22C9FF"
            },
            emojis: {
                name: "Emojis",
                description: "Personaliza emojis de éxito (`YES_EMOJI`) y error (`NO_EMOJI`) mostrados en respuestas del bot",
                defaults: "✅ / ❌"
            },
            musicSelection: {
                name: "MUSIC_SELECTION_TYPE",
                description: "Cómo se muestran los resultados de búsqueda. `message` muestra lista numerada, `selectmenu` muestra menú desplegable",
                options: "message, selectmenu",
                default: "message"
            },
            audioCache: {
                name: "ENABLE_AUDIO_CACHE",
                description:
                    "**[EXPERIMENTAL]** Cachea audio descargado para reproducción más rápida. Usa más espacio en disco pero acelera canciones frecuentes",
                default: "no"
            },
            requestChannelSplash: {
                name: "REQUEST_CHANNEL_SPLASH",
                description: "URL de imagen personalizada para el embed del reproductor del canal de solicitud",
                default: "https://cdn.stegripe.org/images/rawon_splash.png"
            }
        },
        developer: {
            title: "🛠️ Configuración de Desarrollador",
            description: "Configuraciones avanzadas para desarrolladores de bots. **¡Solo usa si sabes lo que haces!**",
            devs: {
                name: "DEVS",
                description: "IDs de desarrolladores del bot (separados por coma). Los desarrolladores pueden acceder a comandos especiales"
            },
            enablePrefix: {
                name: "ENABLE_PREFIX",
                description: "Habilitar/deshabilitar comandos con prefijo (como `!play`). Útil si solo quieres comandos slash",
                default: "yes",
                options: "yes, no"
            },
            enableSlash: {
                name: "ENABLE_SLASH_COMMAND",
                description: "Habilitar/deshabilitar comandos slash (como `/play`). Útil si solo quieres comandos con prefijo",
                default: "yes",
                options: "yes, no"
            },
            debugMode: {
                name: "DEBUG_MODE",
                description: "Habilitar logging de depuración para solución de problemas. Muestra logs detallados en consola",
                default: "no",
                options: "yes, no"
            }
        }
    },

    cookiesSetup: {
        title: "Configuración de Cookies",
        subtitle:
            "Corrige errores \"Sign in to confirm you're not a bot\" en proveedores de hosting. ¡Es más fácil de lo que piensas!",
        why: {
            title: "🤔 ¿Por qué necesito esto?",
            description:
                "Si estás alojando Rawon en proveedores de nube como OVHcloud, AWS, GCP, Azure, Railway, u otros servicios de hosting, podrías encontrar el error:",
            error: "Sign in to confirm you're not a bot",
            explanation:
                "Esto ocurre porque la plataforma de video bloquea solicitudes desde direcciones IP de centros de datos. Usando cookies de una cuenta conectada, puedes evitar esta restricción. ¡No te preocupes - es fácil de configurar!"
        },
        quickMethod: {
            title: "🚀 Método Fácil: Usando el Comando Cookies (Recomendado)",
            description: "La forma más fácil de gestionar cookies - ¡sin edición de archivos!",
            benefits: [
                "✅ Funciona instantáneamente - sin reinicio necesario",
                "✅ Soporta múltiples cookies con rotación automática",
                "✅ Cuando una cookie falla, el bot usa automáticamente la siguiente",
                "✅ Las cookies persisten después de reinicios del bot"
            ],
            commands: {
                title: "📝 Comandos Disponibles"
            },
            quickStart: {
                title: "⚡ Inicio Rápido (3 pasos)",
                steps: [
                    "Exporta cookies desde tu navegador (ver guía abajo)",
                    "En Discord, escribe: `!cookies add 1` y adjunta tu archivo cookies.txt",
                    "¡Listo! La cookie ahora está activa"
                ]
            },
            multiCookie: {
                title: "💡 Consejo Pro: Agrega Múltiples Cookies",
                description: "Agrega cookies de diferentes cuentas para mejor confiabilidad:"
            }
        },
        prerequisites: {
            title: "📋 Lo Que Necesitas",
            items: [
                "Una cuenta secundaria/desechable de plataforma de video (¡NUNCA uses tu cuenta principal!)",
                "Un navegador web (Chrome, Firefox o Edge)",
                "Una extensión de exportación de cookies (gratis en la tienda del navegador)"
            ]
        },
        steps: {
            title: "📖 Cómo Exportar Cookies",
            createAccount: {
                title: "Paso 1: Crear una Cuenta Desechable",
                steps: [
                    "Ve a la [página de registro de cuenta de la plataforma de video](https://accounts.google.com/signup)",
                    "Crea una cuenta NUEVA específicamente para este bot",
                    "⚠️ IMPORTANTE: ¡NUNCA uses tu cuenta personal/principal!"
                ]
            },
            login: {
                title: "Paso 2: Iniciar Sesión en la Plataforma de Video",
                steps: [
                    "Abre tu navegador",
                    "Ve al [sitio web de la plataforma de video](https://youtube.com)",
                    "Inicia sesión con tu cuenta desechable",
                    "Acepta los términos si se solicita"
                ]
            },
            extension: {
                title: "Paso 3: Instalar Extensión de Exportación de Cookies",
                chrome: "Para Chrome/Edge: Instala [**Get cookies.txt LOCALLY**](https://chromewebstore.google.com/detail/get-cookiestxt-locally/cclelndahbckbenkjhflpdbgdldlbecc) (recomendado) desde Chrome Web Store",
                firefox: "Para Firefox: Instala [**cookies.txt**](https://addons.mozilla.org/en-US/firefox/addon/cookies-txt/) desde Firefox Add-ons"
            },
            exportCookies: {
                title: "Paso 4: Exportar Cookies",
                steps: [
                    "Asegúrate de estar en el [sitio web de la plataforma de video](https://youtube.com)",
                    "Haz clic en el icono de la extensión de cookies en tu barra de herramientas",
                    "Haz clic en **Export** o **Export cookies for this site**",
                    "Guarda el archivo como `cookies.txt`"
                ]
            },
            upload: {
                title: "Paso 5: Agregar a Rawon",
                steps: [
                    "Ve a cualquier canal donde Rawon pueda ver tus mensajes",
                    "Escribe: `!cookies add 1`",
                    "Adjunta el archivo cookies.txt a tu mensaje y envía",
                    "¡Rawon confirmará que la cookie fue agregada!"
                ]
            }
        },
        troubleshooting: {
            title: "🔧 Solución de Problemas",
            stillGettingErrors: {
                title: "¿Sigues obteniendo errores \"Sign in to confirm you're not a bot\"?",
                steps: [
                    "Usa `!cookies list` para verificar el estado de las cookies",
                    "Si una cookie muestra **Failed**, intenta `!cookies reset` para reintentar",
                    "Agrega más cookies de diferentes cuentas para redundancia"
                ]
            },
            allCookiesFailed: {
                title: "¿Todas las cookies fallaron?",
                steps: [
                    "Crea nuevas cuentas desechables",
                    "Exporta cookies frescas",
                    "Agrégalas con `!cookies add <número>`"
                ]
            },
            accountSuspended: {
                title: "¿Cuenta suspendida?",
                steps: [
                    "Esto puede ocurrir con uso intenso",
                    "Simplemente crea una nueva cuenta desechable",
                    "Exporta nuevas cookies y agrégalas"
                ]
            }
        },
        duration: {
            title: "⏰ ¿Cuánto Duran las Cookies?",
            description:
                "¡Buenas noticias! Las cookies de plataforma de video NO expiran regularmente. Permanecen válidas mientras:",
            conditions: [
                "No cierres sesión de la plataforma de video en tu navegador",
                "No cambies la contraseña de tu cuenta",
                "No revoques la sesión desde configuración de cuenta",
                "La plataforma no detecte actividad sospechosa"
            ],
            tips: "¡En la práctica, las cookies pueden durar meses o incluso años! Solo configúralo una vez y olvídate."
        },
        security: {
            title: "🔒 Notas de Seguridad",
            warnings: [
                "⚠️ NUNCA compartas tu archivo de cookies con nadie",
                "⚠️ Usa una cuenta desechable, NO tu cuenta principal",
                "⚠️ El archivo de cookies contiene datos de inicio de sesión sensibles"
            ]
        }
    },



    permissionCalculator: {
        title: "Calculadora de Permisos",
        clientId: "ID de Cliente",
        scope: "Alcance",
        redirectUri: "URI de Redirección",
        permissions: "Permisos",
        permissionsNote:
            "Coloreado significa que el usuario OAuth necesita habilitar 2FA en su cuenta si el servidor requiere 2FA",
        general: "General",
        voice: "Voz",
        text: "Texto",
        result: "Resultado",
        resultNote: "Este es el enlace que puedes usar para agregar el bot a tu servidor"
    },

    common: {
        back: "Atrás",
        copy: "Copiar",
        default: "Predeterminado",
        required: "Requerido",
        optional: "Opcional",
        example: "Ejemplo",
        learnMore: "Saber Más",

        language: "Idioma",
        tip: "Consejo",
        warning: "Advertencia",
        note: "Nota"
    }
};
