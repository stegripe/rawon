export const es = {
    // Navigation
    nav: {
        home: "Inicio",
        docs: "Docs",
        gettingStarted: "Comenzar",
        configuration: "Configuración",
        cookiesSetup: "Config. Cookies",
        disclaimers: "Avisos Legales",
        permissionCalculator: "Calculadora de Permisos",
        links: "Enlaces"
    },

    // Home page
    home: {
        title: "Rawon",
        description:
            "Un bot de música de Discord simple pero potente, creado para cumplir tus deseos de producción.",
        invite: "Invitar",
        support: "Soporte",
        viewDocs: "Ver Docs"
    },

    // Getting Started page
    gettingStarted: {
        title: "Comenzar",
        subtitle:
            "Pon Rawon en funcionamiento en minutos con nuestra guía paso a paso.",
        features: {
            title: "Características",
            items: [
                "Soporte de interacción (comandos slash y botones)",
                "Canal de solicitud para una experiencia musical perfecta",
                "Listo para producción, sin necesidad de código",
                "Configurable y fácil de usar",
                "Comandos básicos de música (play, pause, skip, queue, etc.)",
                "Soporte multilingüe"
            ]
        },
        requirements: {
            title: "Requisitos",
            nodeVersion: "Node.js versión 22.12.0 o superior",
            discordToken:
                "Token de Bot de Discord (obtén desde Discord Developer Portal)",
            optional: "Opcional: Credenciales de API de Spotify para soporte de Spotify"
        },
        standardSetup: {
            title: "Configuración Estándar (Node.js)",
            steps: [
                "Descarga e instala Node.js versión 22.12.0 o superior",
                "Clona o descarga este repositorio",
                "Copia .env_example a .env y rellena los valores requeridos (mínimo: DISCORD_TOKEN)",
                "Instala dependencias: pnpm install",
                "Compila el proyecto: pnpm run build",
                "Inicia el bot: pnpm start"
            ],
            requestChannel:
                "(Opcional) Después de que el bot esté en línea, configura un canal de música dedicado:"
        },
        dockerSetup: {
            title: "Configuración Docker (Recomendado)",
            composeTitle: "Usando Docker Compose",
            composeSteps: [
                "Crea un archivo .env con tu configuración (copia de .env_example)",
                "Crea un archivo docker-compose.yaml (ver ejemplo abajo)",
                "Inicia el bot: docker compose up -d",
                "Ver logs: docker logs -f rawon-bot"
            ],
            runTitle: "Usando Docker Run",
            volumeInfo: {
                title: "Información del Volumen",
                description: "El volumen /app/cache almacena:",
                items: [
                    "Binario yt-dlp para streaming de audio",
                    "data.json para configuraciones persistentes (canales de solicitud, estados del reproductor)",
                    "Archivos de audio en caché (si el caché de audio está habilitado)"
                ]
            }
        },
        railwaySetup: {
            title: "Despliegue en Railway",
            description:
                "Railway proporciona $5 de créditos gratuitos mensuales. Tu bot permanecerá en línea 24/7 mientras el uso se mantenga por debajo de $5.",
            warning: "IMPORTANTE: Lee los Avisos Legales antes de desplegar en Railway."
        }
    },

    // Configuration page
    configuration: {
        title: "Configuración",
        subtitle: "Configura Rawon según tus necesidades con estos ajustes.",
        essential: {
            title: "Configuración Esencial",
            description:
                "Estas son las configuraciones mínimas requeridas para ejecutar el bot.",
            discordToken: {
                name: "DISCORD_TOKEN",
                description:
                    "Tu token de bot de Discord desde Discord Developer Portal",
                required: true
            },
            mainPrefix: {
                name: "MAIN_PREFIX",
                description: "Prefijo de comando principal",
                default: "!"
            },
            mainServer: {
                name: "MAIN_SERVER",
                description: "ID de tu servidor principal para registro de comandos slash",
                required: false
            },
            locale: {
                name: "LOCALE",
                description: "Idioma del bot",
                default: "en-US",
                options:
                    "en-US, es-ES, fr-FR, id-ID, zh-CN, zh-TW, uk-UA, vi-VN, pt-BR, ru-RU, ja-JP, tr-TR"
            },
            spotify: {
                name: "Spotify API",
                description:
                    "Para soporte de Spotify, configura SPOTIFY_CLIENT_ID y SPOTIFY_CLIENT_SECRET"
            }
        },
        optional: {
            title: "Configuración Opcional",
            description: "Personaliza el comportamiento y apariencia de Rawon.",
            altPrefix: {
                name: "ALT_PREFIX",
                description:
                    "Prefijos alternativos (separados por coma). Usa {mention} para mención @bot",
                default: "{mention}"
            },
            activities: {
                name: "ACTIVITIES",
                description:
                    "Actividades de estado del bot (separadas por coma). Formatos: {prefix}, {userCount}, {textChannelCount}, {serverCount}, {playingCount}, {username}"
            },
            activityTypes: {
                name: "ACTIVITY_TYPES",
                description: "Tipos de actividad para cada actividad (separados por coma)",
                options: "PLAYING, WATCHING, LISTENING, COMPETING"
            },
            embedColor: {
                name: "EMBED_COLOR",
                description: "Color de embed en hex (sin #)",
                default: "22C9FF"
            },
            emojis: {
                name: "Emojis",
                description: "Personaliza emojis de éxito (YES_EMOJI) y error (NO_EMOJI)",
                defaults: "✅ / ❌"
            },
            musicSelection: {
                name: "MUSIC_SELECTION_TYPE",
                description: "Estilo de selección de música",
                options: "message, selectmenu",
                default: "message"
            },
            audioCache: {
                name: "ENABLE_AUDIO_CACHE",
                description:
                    "[EXPERIMENTAL] Cachea audio descargado para reproducción repetida más rápida",
                default: "no"
            }
        }
    },

    // Cookies Setup page
    cookiesSetup: {
        title: "Configuración de Cookies",
        subtitle:
            "Corrige errores 'Sign in to confirm you're not a bot' en proveedores de hosting.",
        why: {
            title: "¿Por qué necesito esto?",
            description:
                "Si estás alojando Rawon en proveedores de nube como OVHcloud, AWS, GCP, Azure, u otros servicios de hosting, podrías encontrar el error:",
            error: "Sign in to confirm you're not a bot",
            explanation:
                "Esto ocurre porque la plataforma bloquea solicitudes desde direcciones IP de centros de datos. Usando cookies de una cuenta conectada, puedes evitar esta restricción."
        },
        prerequisites: {
            title: "Requisitos Previos",
            items: [
                "Una cuenta secundaria/desechable (NO uses tu cuenta principal por seguridad)",
                "Un navegador web (Chrome, Firefox o Edge)",
                "Una extensión de exportación de cookies",
                "Para usuarios no-Docker: Runtime Deno JavaScript (requerido para resolución de firma yt-dlp)"
            ]
        },
        steps: {
            title: "Guía Paso a Paso",
            createAccount: {
                title: "Paso 1: Crear una Cuenta Desechable",
                steps: [
                    "Ve a Creación de Cuenta",
                    "Crea una nueva cuenta específicamente para este bot",
                    "Importante: NO uses tu cuenta personal/principal"
                ]
            },
            login: {
                title: "Paso 2: Iniciar Sesión en la Plataforma",
                steps: [
                    "Abre tu navegador",
                    "Ve a la plataforma (YouTube)",
                    "Inicia sesión con tu cuenta desechable",
                    "Acepta los términos si se solicita"
                ]
            },
            extension: {
                title: "Paso 3: Instalar Extensión de Exportación de Cookies",
                chrome: "Para Chrome/Edge: Instala 'Get cookies.txt LOCALLY' o 'cookies.txt'",
                firefox: "Para Firefox: Instala 'cookies.txt'"
            },
            exportCookies: {
                title: "Paso 4: Exportar Cookies",
                steps: [
                    "Asegúrate de estar en el sitio web de la plataforma",
                    "Haz clic en el icono de la extensión de cookies en tu barra de herramientas",
                    "Elige 'Export' o 'Export cookies for this site'",
                    "Guarda el archivo como cookies.txt"
                ]
            },
            upload: {
                title: "Paso 5: Subir a Tu Servidor",
                steps: [
                    "Crea una carpeta cache en tu directorio de Rawon si no existe",
                    "Sube el archivo cookies.txt a la carpeta cache",
                    "La ruta debe ser: ./cache/cookies.txt"
                ]
            },
            configure: {
                title: "Paso 6: Configurar Variable de Entorno",
                instruction: "Agrega esto a tu archivo .env:"
            },
            restart: {
                title: "Paso 7: Reiniciar Rawon",
                instruction: "Reinicia tu bot para aplicar los cambios."
            }
        },
        docker: {
            title: "Configuración Docker",
            description:
                "Si usas Docker, coloca tu archivo cookies.txt junto a tu archivo docker-compose.yaml y agrega el montaje de volumen."
        },
        duration: {
            title: "¿Cuánto Duran las Cookies?",
            description:
                "Buenas noticias: Las cookies de la plataforma NO expiran regularmente. Permanecerán válidas mientras:",
            conditions: [
                "No cierres sesión de la plataforma en tu navegador",
                "No cambies la contraseña de tu cuenta",
                "No revoques la sesión desde la configuración de cuenta",
                "La plataforma no detecte actividad sospechosa"
            ],
            tips: "En la práctica, las cookies pueden durar meses o incluso años si sigues las mejores prácticas."
        },
        security: {
            title: "Notas de Seguridad",
            warnings: [
                "Nunca compartas tu archivo de cookies con nadie",
                "Usa una cuenta desechable, NO tu cuenta principal",
                "El archivo de cookies contiene datos de autenticación sensibles",
                "Agrega cookies.txt a tu .gitignore para prevenir commits accidentales"
            ]
        }
    },

    // Disclaimers page
    disclaimers: {
        title: "Avisos Legales",
        subtitle: "Por favor lee cuidadosamente antes de usar este bot.",
        warningBanner: "Información legal importante",
        copyright: {
            title: "Derechos de Autor, DMCA y Propiedad Intelectual",
            items: [
                "Propiedad: Cualquier propiedad intelectual usada, reproducida o mostrada por el bot no es propiedad nuestra, de los mantenedores ni de los contribuidores. Esto incluye, pero no se limita a, archivos de audio, video e imagen usados en los comandos del bot.",
                "Políticas de Proveedores de Hosting: Algunos proveedores de hosting (como Railway) prohíben alojar o distribuir contenido protegido por DMCA. Esto incluye bots de música de Discord que reproducen música/video con derechos de autor. Despliega en estas plataformas bajo tu propio riesgo.",
                "Responsabilidad del Usuario: Eres responsable de cómo usas este bot y qué contenido se reproduce a través de él."
            ]
        },
        code: {
            title: "Modificaciones de Código",
            items: [
                "Licencia: Este bot es de código abierto y puede ser modificado y redistribuido bajo la licencia AGPL-3.0.",
                "Sin Garantía: Como se indica en la licencia, no somos responsables de ningún daño o pérdida resultante de modificar, redistribuir o usar este código.",
                "Atribución: Nunca reclames este proyecto como tu propio trabajo original. Siempre proporciona la atribución adecuada al proyecto original."
            ]
        }
    },

    // Permission Calculator page
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

    // Common
    common: {
        back: "Atrás",
        copy: "Copiar",
        default: "Predeterminado",
        required: "Requerido",
        optional: "Opcional",
        example: "Ejemplo",
        learnMore: "Saber Más",
        deployOnRailway: "Desplegar en Railway",
        language: "Idioma"
    }
};
