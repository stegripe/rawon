import type { Translations } from "./en";

export const es: Translations = {
    nav: {
        home: "Inicio",
        docs: "Documentación",
        gettingStarted: "Primeros pasos",
        configuration: "Configuración",
        cookiesSetup: "Configuración de cookies",
        disclaimers: "Avisos legales",
        permissionCalculator: "Calculadora de permisos",
        links: "Enlaces"
    },

    home: {
        title: "Rawon",
        description:
            "Un bot de música (multi-) para Discord sencillo y potente, pensado para entornos de producción. Fácil de usar, sin necesidad de programar.",
        invite: "Invitar",
        inviteBot: "Invitar al bot",
        support: "Soporte",
        viewDocs: "Ver documentación"
    },

    gettingStarted: {
        title: "Primeros pasos",
        subtitle:
            "Pon Rawon en marcha en minutos con nuestra guía paso a paso.",
        features: {
            title: "✨ Funciones",
            items: [
                "🚀 Listo para producción, sin necesidad de programar",
                "📺 Canal de peticiones para una experiencia musical fluida",
                "🎶 Compatibilidad con YouTube, Spotify, SoundCloud y archivos directos",
                "🤖 Varias instancias del bot para distintos canales de voz",
                "⚡ Precaché inteligente de audio para una reproducción más suave",
                "🍪 Inicio de sesión con Google integrado mediante Puppeteer para gestionar cookies"
            ]
        },
        requirements: {
            title: "📋 Requisitos",
            nodeVersion: "**Node.js** versión `20.0.0` o superior",
            discordToken:
                "**Token de bot de Discord** (consíguelo en el [Portal para desarrolladores de Discord](https://discord.com/developers/applications))",
            optional: "**Opcional:** [FFmpeg](https://ffmpeg.org/) para el procesamiento de audio en instalaciones estándar (sin Docker) — Las imágenes de Docker incluyen FFmpeg"
        },
        standardSetup: {
            title: "💻 Instalación estándar (Node.js)",
            steps: [
                "Descarga e instala los requisitos anteriores",
                "Clona o descarga este repositorio",
                "Copia `.env.example` a `.env` y completa los valores obligatorios (como mínimo: `DISCORD_TOKEN`)",
                "Instala dependencias: `pnpm install`",
                "Compila el proyecto: `pnpm run build`",
                "Inicia el bot: `pnpm start`"
            ],
            requestChannel:
                "(Opcional) Cuando el bot esté en línea, configura un canal dedicado a la música:"
        },
        dockerSetup: {
            title: "🐳 Instalación con Docker (recomendada)",
            composeTitle: "Con Docker Compose",
            composeSteps: [
                "Crea un archivo `.env` con tu configuración (copia desde `.env.example`)",
                "(Opcional) Crea `dev.env` a partir de `dev.env.example` para ajustes adicionales",
                "Crea un archivo `docker-compose.yaml` (ver el ejemplo más abajo)",
                "Inicia el bot: `docker compose up -d`",
                "Consulta los registros: `docker logs -f rawon-bot`"
            ],
            runTitle: "Con docker run",
            volumeInfo: {
                title: "📁 Información sobre volúmenes",
                description: "El volumen `/app/cache` almacena:",
                items: [
                    "Binario de `yt-dlp` para la transmisión de audio",
                    "`data.*` con ajustes persistentes (canales de peticiones, estados del reproductor)",
                    "Archivos de audio en caché (si la caché de audio está activada)",
                    "Archivo de cookies y datos de perfil del inicio de sesión con Google (consulta [Configuración de cookies](/docs/cookies-setup))"
                ]
            },
            portInfo: {
                title: "🔌 Información de puertos",
                description:
                    "`DEVTOOLS_PORT` (predeterminado: `3000`) se usa para el proxy de depuración remota de Chrome DevTools. Es necesario para `!login start` si te conectas desde otro equipo. Define `DEVTOOLS_PORT` en `dev.env` para usar otro puerto y mapea en Docker Compose o en `docker run`."
            }
        },

        cookiesQuickStart: {
            title: "🍪 Cookies: solución rápida en hosting",
            description:
                "En servicios en la nube (AWS, GCP, Azure, Railway, etc.) puede aparecer **«Inicia sesión para confirmar que no eres un robot»**. Usa el flujo de inicio de sesión integrado:",
            steps: [
                "Ejecuta `!login start` en Discord",
                "Abre la URL de DevTools que te envía el bot y completa el inicio de sesión de Google en el navegador remoto",
                "Usa `!login status` para comprobar las cookies, o `!login logout` y luego `!login start` para renovarlas"
            ],
            tip: "💡 Usa una **cuenta de Google desechable**, no tu cuenta principal. Consulta la guía completa de [Configuración de cookies](/docs/cookies-setup) para más detalles."
        }
    },

    configuration: {
        title: "Configuración",
        subtitle: "Cómo encajan los archivos de configuración y las variables de entorno de Rawon.",
        overview: {
            title: "📄 Archivos de configuración",
            intro: "La configuración se reparte en varios archivos a propósito:",
            items: [
                "**`.env.example`** — Ajustes esenciales (tokens de Discord/Spotify, prefijo, IDs, actividades, etc.). Copia a **`.env`** y completa los valores.",
                "**`dev.env.example`** — Ajustes opcionales de desarrollo (prefijo/slash, sharding, puerto de DevTools para `!login`, ruta de Chromium, modo depuración). Copia a **`dev.env`** cuando lo necesites.",
                "**Comando `setup`** — Opciones propias del bot (color del embed, emojis de sí/no, splash, prefijo alternativo, volumen predeterminado, tipo de selección, caché de audio) se gestionan con el **comando `setup`** (solo desarrolladores) y se guardan en la base de datos. Usa `<prefijo>setup view` para listar los ajustes disponibles."
            ]
        },
        essential: {
            title: "⚡ Ajustes esenciales (`.env`)",
            description:
                "Valores de `.env.example`. Solo **`DISCORD_TOKEN`** es estrictamente obligatorio para ejecutar; añade Spotify, el token de letras y el resto según necesites.",
            discordToken: {
                name: "DISCORD_TOKEN",
                description:
                    "Token(s) de tu bot de Discord desde el [Portal para desarrolladores de Discord](https://discord.com/developers/applications). Usa tokens **separados por comas** para activar el modo multi-bot.",
                required: true
            },
            spotify: {
                name: "Spotify API",
                description:
                    "Define `SPOTIFY_CLIENT_ID` y `SPOTIFY_CLIENT_SECRET` desde [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard). **Obligatorio para el soporte de Spotify.**",
                required: false
            },
            stegripeLyrics: {
                name: "STEGRIPE_API_LYRICS_TOKEN",
                description:
                    "Necesario para un resultado preciso del comando **lyrics**. Ponte en contacto con el desarrollador para obtener acceso.",
                required: false
            },
            mainPrefix: {
                name: "MAIN_PREFIX",
                description: "Prefijo principal de comandos. Ejemplo: `!` significa que escribes `!play` para reproducir música",
                default: "!"
            },
            mainServer: {
                name: "MAIN_SERVER",
                description: "ID de tu servidor principal para registrar comandos slash más rápido. Déjalo vacío para comandos globales (la actualización puede tardar hasta una hora)",
                required: false
            },
            devs: {
                name: "DEVS",
                description: "IDs de usuario de los desarrolladores del bot (separados por comas). Los desarrolladores pueden usar comandos especiales, incluidos `setup` y las herramientas de `login`.",
                required: false
            },
            locale: {
                name: "LOCALE",
                description: "Idioma del bot para las respuestas",
                default: "en-US",
                options:
                    "en-US, es-ES, fr-FR, id-ID, zh-CN, zh-TW, uk-UA, vi-VN, pt-BR, ru-RU, ja-JP, tr-TR, ko-KR"
            },
            activityTypes: {
                name: "ACTIVITY_TYPES",
                description: "Tipos de actividad para cada entrada en `ACTIVITIES` (separados por comas). Debe coincidir el número con el de actividades",
                options: "PLAYING, WATCHING, LISTENING, COMPETING",
                default: "PLAYING"
            },
            activities: {
                name: "ACTIVITIES",
                description:
                    "Líneas de estado bajo el nombre del bot (separadas por comas). Marcadores: `{prefix}`, `{userCount}`, `{textChannelCount}`, `{serverCount}`, `{playingCount}`, `{username}`",
                required: false
            }
        },
        multiBot: {
            title: "🔄 Modo multi-bot",
            description:
                "El modo multi-bot es adaptable — **sin configuración extra**. Un token ejecuta un solo bot; los tokens **separados por comas** activan el multi-bot automáticamente.",
            example: "Ejemplo:",
            exampleCode: 'DISCORD_TOKEN="token1, token2, token3"',
            features: [
                "El **primer** token es el bot principal para comandos generales",
                "Cada bot sirve música a los usuarios en **su** canal de voz",
                "Si el bot principal no está en un servidor, el siguiente bot disponible puede hacerse cargo",
                "Cada bot necesita **su propia** aplicación de Discord"
            ]
        },
        developer: {
            title: "🛠️ Ajustes de desarrollo (`dev.env`)",
            description: "Tomados de `dev.env.example`. **Opcionales** — cámbialos solo si entiendes lo que hacen.",
            enablePrefix: {
                name: "ENABLE_PREFIX",
                description: "Activa o desactiva los comandos con prefijo (p. ej. `!play`)",
                default: "yes",
                options: "yes, no"
            },
            enableSlash: {
                name: "ENABLE_SLASH_COMMAND",
                description: "Activa o desactiva los comandos slash (p. ej. `/play`)",
                default: "yes",
                options: "yes, no"
            },
            enableSharding: {
                name: "ENABLE_SHARDING",
                description: "Activa el sharding para bots grandes (**solo modo con un token**)",
                default: "no",
                options: "yes, no"
            },
            devtoolsPort: {
                name: "DEVTOOLS_PORT",
                description:
                    "Puerto del proxy de depuración remota de Chrome DevTools. Lo usa `!login start` cuando DevTools se abre desde otro equipo. Predeterminado: `3000`",
                default: "3000"
            },
            chromiumPath: {
                name: "CHROMIUM_PATH",
                description: "Ruta a Chrome/Chromium para el inicio de sesión con Google. Déjalo vacío para detección automática",
                required: false
            },
            nodeEnv: {
                name: "NODE_ENV",
                description: "Modo del entorno de ejecución",
                default: "production",
                options: "production, development"
            },
            debugMode: {
                name: "DEBUG_MODE",
                description: "Registro detallado de depuración en la consola",
                default: "no",
                options: "yes, no"
            }
        }
    },

    cookiesSetup: {
        title: "Configuración de cookies",
        subtitle:
            "Soluciona «Inicia sesión para confirmar que no eres un robot» en hosting en la nube. Recomendado: el comando integrado **`!login`**.",
        why: {
            title: "¿Por qué necesito esto?",
            description:
                "Si alojas Rawon en proveedores como OVHcloud, AWS, GCP, Azure u otros servicios en la nube o VPS, puede que veas:",
            error: "Inicia sesión para confirmar que no eres un robot",
            explanation:
                "La plataforma suele bloquear peticiones desde IPs de centros de datos. Autenticarse con una **cuenta de Google** permite a Rawon obtener cookies válidas y evitar esa restricción."
        },
        loginMethod: {
            title: "Recomendado: comando `!login`",
            description:
                "La forma más sencilla de configurar las cookies es el flujo integrado **`!login`** (navegador real con Puppeteer):",
            benefits: [
                "✅ Abre un navegador real para el inicio de sesión de Google",
                "✅ Exporta las cookies y las guarda automáticamente",
                "✅ Cierra el navegador tras iniciar sesión — no queda en segundo plano",
                "✅ Persiste tras reinicios (volumen de Docker o carpeta `cache/`)"
            ]
        },
        commandUsage: {
            title: "Uso del comando"
        },
        quickStart: {
            title: "Inicio rápido",
            steps: [
                "Ejecuta `!login start` en Discord",
                "Abre en tu navegador local la **URL de DevTools** que envía el bot",
                "Completa el inicio de sesión de Google en la sesión **remota** del navegador",
                "Inicia sesión con una **cuenta de Google desechable** (no la principal)",
                "Al terminar, el bot guarda las cookies y cierra el navegador",
                "Listo: las peticiones siguientes usan la sesión guardada"
            ]
        },
        staleCookies: {
            title: "Si vuelven a aparecer comprobaciones del bot",
            description: "Las cookies pueden caducar cuando el proveedor las rota. Entonces:",
            steps: [
                "Ejecuta `!login logout` para borrar cookies y datos de perfil antiguos",
                "Ejecuta `!login start` e inicia sesión de nuevo para una sesión nueva"
            ]
        },
        prerequisites: {
            title: "Requisitos",
            items: [
                "Una **cuenta secundaria / desechable de Google** (**no** uses la cuenta principal)",
                "**Sin Docker:** Chrome o Chromium instalado en el servidor",
                "**Docker:** Chromium va incluido; mapea `DEVTOOLS_PORT` si te conectas a `!login` de forma remota (consulta [Configuración](/docs/configuration))"
            ]
        },
        docker: {
            title: "Docker",
            persistence:
                "Las cookies y el perfil persisten en el volumen con nombre **`rawon:/app/cache`** entre reinicios del contenedor.",
            chromium: "La imagen incluye Chromium, por lo que **`!login start`** funciona sin pasos extra en la imagen."
        },
        envVars: {
            title: "Variables de entorno (`dev.env`)",
            intro: "Ajustes opcionales (consulta `dev.env.example`):",
            dockerComposeHint:
                "En Docker, asegúrate de que `ports` en `docker-compose.yaml` exponga el puerto de DevTools, p. ej.:"
        },
        duration: {
            title: "¿Cuánto duran las cookies?",
            description:
                "Pueden caducar con el tiempo porque los proveedores rotan las sesiones. Suelen seguir siendo válidas mientras:",
            conditions: [
                "No cierres sesión de un modo que invalide la sesión",
                "No cambies la contraseña de la cuenta",
                "No revoques la sesión en la configuración de seguridad de la cuenta",
                "El proveedor no marque actividad sospechosa"
            ],
            footer: "Cuando expiren las cookies, ejecuta `!login logout` y luego de nuevo `!login start`."
        },
        troubleshooting: {
            title: "Solución de problemas",
            stillErrors: {
                title: "¿Sigues viendo «Inicia sesión para confirmar que no eres un robot»?",
                steps: [
                    "Usa `!login status` para revisar el estado del inicio de sesión y las cookies",
                    "Ejecuta `!login logout` y luego `!login start` para crear una sesión nueva"
                ]
            },
            browserWontStart: {
                title: "¿El navegador no arranca?",
                steps: [
                    "Revisa `!login status` para ver detalles del error",
                    "En servidor físico, instala Chrome/Chromium o define `CHROMIUM_PATH` en `dev.env`",
                    "En Docker, Chromium debería funcionar de serie con la imagen oficial"
                ]
            },
            accountSuspended: {
                title: "¿Cuenta suspendida?",
                steps: [
                    "Crea una nueva cuenta de Google desechable",
                    "Ejecuta `!login logout` para borrar la sesión antigua",
                    "Ejecuta `!login start` e inicia sesión con la cuenta nueva"
                ]
            }
        },
        manualAlternative: {
            title: "Alternativa: archivo de cookies manual",
            description:
                "Puedes colocar un archivo de cookies en **formato Netscape** en la ruta siguiente. El bot lo usará si existe; **`!login` sigue siendo lo recomendado** por ser más sencillo.",
            pathLabel: "Ruta"
        },
        security: {
            title: "Notas de seguridad",
            warningLabel: "AVISO",
            warnings: [
                "Usa una cuenta de Google **desechable** — **no** la principal",
                "La URL de DevTools da acceso a la sesión remota del navegador — **no la compartas públicamente**",
                "Los archivos de cookies contienen datos de autenticación **sensibles**"
            ]
        }
    },

    disclaimers: {
        title: "Avisos legales",
        subtitle: "Lee con atención antes de usar este bot.",
        warningBanner: "Información legal importante",
        copyright: {
            title: "Copyright, DMCA y propiedad intelectual",
            items: [
                "**Titularidad:** Cualquier propiedad intelectual utilizada, reproducida o mostrada por el bot **no nos pertenece** a nosotros, a los mantenedores ni a los colaboradores. Esto incluye, entre otros, archivos de audio, vídeo e imagen usados en los comandos del bot.",
                "**Políticas del proveedor de hosting:** Algunos proveedores prohíben alojar o distribuir contenido protegido por DMCA. Esto incluye bots de música en que reproducen música o vídeo con derechos de autor.\n- **Despliega en esas plataformas bajo tu propia responsabilidad**",
                "**Responsabilidad del usuario:** Eres responsable de cómo usas este bot y del contenido que se reproduce a través de él."
            ]
        },
        code: {
            title: "Modificaciones del código",
            items: [
                "**Licencia:** Este proyecto está bajo [Creative Commons Reconocimiento-NoComercial-SinDerivadas 4.0 Internacional (CC BY-NC-ND 4.0)](https://creativecommons.org/licenses/by-nc-nd/4.0/). El texto legal completo está en el archivo [`LICENSE`](https://github.com/stegripe/rawon/blob/main/LICENSE) del repositorio.",
                "**Sin garantía:** Como indica la licencia, **no somos responsables** de daños o pérdidas derivadas del uso de este código. Sigue los términos de la licencia sobre atribución, uso no comercial y restricciones al compartir material adaptado.",
                "**Atribución:** Nunca afirmes que este proyecto es obra tuya. Proporciona siempre la atribución adecuada al proyecto original."
            ]
        },
        licenseFooterPrefix: "Para el texto completo de la licencia, consulta en el repositorio",
        licenseLinkLabel: "LICENSE (CC BY-NC-ND 4.0)"
    },

    permissionCalculator: {
        title: "Calculadora de permisos",
        clientId: "ID de cliente",
        scope: "Ámbito",
        redirectUri: "URI de redirección",
        permissions: "Permisos",
        permissionsNote:
            "Los colores indican que el usuario de OAuth debe tener 2FA si el servidor lo exige",
        general: "General",
        voice: "Voz",
        text: "Texto",
        result: "Resultado",
        resultNote: "Este es el enlace para añadir el bot a tu servidor"
    },

    common: {
        back: "Volver",
        copy: "Copiar",
        default: "Predeterminado",
        required: "Obligatorio",
        optional: "Opcional",
        example: "Ejemplo",
        learnMore: "Más información",

        language: "Idioma",
        tip: "Consejo",
        warning: "Advertencia",
        note: "Nota"
    }
};
