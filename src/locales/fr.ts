export const fr = {
    // Navigation
    nav: {
        home: "Accueil",
        docs: "Docs",
        gettingStarted: "Démarrer",
        configuration: "Configuration",
        cookiesSetup: "Config. Cookies",
        disclaimers: "Mentions Légales",
        permissionCalculator: "Calculateur Permissions",
        links: "Liens"
    },

    // Home page
    home: {
        title: "Rawon",
        description:
            "Un bot musical Discord simple mais puissant, conçu pour répondre à vos besoins de production.",
        invite: "Inviter",
        support: "Support",
        viewDocs: "Voir Docs"
    },

    // Getting Started page
    gettingStarted: {
        title: "Démarrer",
        subtitle: "Mettez Rawon en marche en quelques minutes avec notre guide étape par étape.",
        features: {
            title: "Fonctionnalités",
            items: [
                "🎮 ",
                "Support des interactions (commandes slash et boutons)",
                "Canal de requêtes pour une expérience musicale fluide",
                "Prêt pour la production, sans codage requis",
                "Configurable et facile à utiliser",
                "Commandes musicales de base (play, pause, skip, queue, etc.)",
                "Support multilingue"
            ]
        },
        requirements: {
            title: "Prérequis",
            nodeVersion: "Node.js version 22.12.0 ou supérieure",
            discordToken: "Token Bot Discord (obtenir depuis Discord Developer Portal)",
            optional: "Optionnel: Identifiants API Spotify pour le support Spotify"
        },
        standardSetup: {
            title: "Installation Standard (Node.js)",
            steps: [
                "Téléchargez et installez Node.js version 22.12.0 ou supérieure",
                "Clonez ou téléchargez ce dépôt",
                "Copiez .env_example vers .env et remplissez les valeurs requises (minimum: DISCORD_TOKEN)",
                "Installez les dépendances: pnpm install",
                "Compilez le projet: pnpm run build",
                "Démarrez le bot: pnpm start"
            ],
            requestChannel: "(Optionnel) Après que le bot soit en ligne, configurez un canal musical dédié:"
        },
        dockerSetup: {
            title: "Installation Docker (Recommandé)",
            composeTitle: "Avec Docker Compose",
            composeSteps: [
                "Créez un fichier .env avec votre configuration (copiez depuis .env_example)",
                "Créez un fichier docker-compose.yaml (voir exemple ci-dessous)",
                "Démarrez le bot: docker compose up -d",
                "Voir les logs: docker logs -f rawon-bot"
            ],
            runTitle: "Avec Docker Run",
            volumeInfo: {
                title: "Information sur le Volume",
                description: "Le volume /app/cache stocke:",
                items: [
                    "Binaire yt-dlp pour le streaming audio",
                    "data.json pour les paramètres persistants (canaux de requêtes, états du lecteur)",
                    "Fichiers audio en cache (si le cache audio est activé)"
                ]
            }
        },
        railwaySetup: {
            title: "Déploiement Railway",
            description:
                "Railway offre 5$ de crédits gratuits mensuels. Votre bot restera en ligne 24/7 tant que l'utilisation reste sous 5$.",
            warning: "IMPORTANT: Lisez les Mentions Légales avant de déployer sur Railway."
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
        title: "Configuration",
        subtitle: "Configurez Rawon selon vos besoins avec ces paramètres.",
        essential: {
            title: "Paramètres Essentiels",
            description: "Ce sont les paramètres minimum requis pour exécuter le bot.",
            discordToken: {
                name: "DISCORD_TOKEN",
                description: "Votre token de bot Discord depuis Discord Developer Portal",
                required: true
            },
            mainPrefix: {
                name: "MAIN_PREFIX",
                description: "Préfixe de commande principal",
                default: "!"
            },
            mainServer: {
                name: "MAIN_SERVER",
                description: "ID de votre serveur principal pour l'enregistrement des commandes slash",
                required: false
            },
            locale: {
                name: "LOCALE",
                description: "Langue du bot",
                default: "en-US",
                options: "en-US, es-ES, fr-FR, id-ID, zh-CN, zh-TW, uk-UA, vi-VN, pt-BR, ru-RU, ja-JP, tr-TR"
            },
            spotify: {
                name: "Spotify API",
                description: "Pour le support Spotify, définissez SPOTIFY_CLIENT_ID et SPOTIFY_CLIENT_SECRET"
            }
        },
        optional: {
            title: "Paramètres Optionnels",
            description: "Personnalisez le comportement et l'apparence de Rawon.",
            altPrefix: {
                name: "ALT_PREFIX",
                description: "Préfixes alternatifs (séparés par virgule). Utilisez {mention} pour la mention @bot",
                default: "{mention}"
            },
            activities: {
                name: "ACTIVITIES",
                description:
                    "Activités de statut du bot (séparées par virgule). Formats: {prefix}, {userCount}, {textChannelCount}, {serverCount}, {playingCount}, {username}"
            },
            activityTypes: {
                name: "ACTIVITY_TYPES",
                description: "Types d'activité pour chaque activité (séparés par virgule)",
                options: "PLAYING, WATCHING, LISTENING, COMPETING"
            },
            embedColor: {
                name: "EMBED_COLOR",
                description: "Couleur d'embed en hex (sans #)",
                default: "22C9FF"
            },
            emojis: {
                name: "Emojis",
                description: "Personnalisez les emojis de succès (YES_EMOJI) et d'échec (NO_EMOJI)",
                defaults: "✅ / ❌"
            },
            musicSelection: {
                name: "MUSIC_SELECTION_TYPE",
                description: "Style de sélection musicale",
                options: "message, selectmenu",
                default: "message"
            },
            audioCache: {
                name: "ENABLE_AUDIO_CACHE",
                description: "[EXPÉRIMENTAL] Cache audio téléchargé pour une lecture répétée plus rapide",
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
        title: "Configuration des Cookies",
        subtitle: "Corrigez les erreurs 'Sign in to confirm you're not a bot' sur les hébergeurs.",
        why: {
            title: "Pourquoi ai-je besoin de ceci?",
            description:
                "Si vous hébergez Rawon sur des fournisseurs cloud comme OVHcloud, AWS, GCP, Azure, ou autres services d'hébergement, vous pourriez rencontrer l'erreur:",
            error: "Sign in to confirm you're not a bot",
            explanation:
                "Cela se produit parce que la plateforme bloque les requêtes provenant d'adresses IP de centres de données. En utilisant les cookies d'un compte connecté, vous pouvez contourner cette restriction."
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
            title: "Prérequis",
            items: [
                "Un compte secondaire/jetable (N'utilisez PAS votre compte principal pour des raisons de sécurité)",
                "Un navigateur web (Chrome, Firefox ou Edge)",
                "Une extension d'export de cookies",
                "Pour les utilisateurs non-Docker: Runtime Deno JavaScript (requis pour la résolution de signature yt-dlp)"
            ]
        },
        steps: {
            title: "Guide Étape par Étape",
            createAccount: {
                title: "Étape 1: Créer un Compte Jetable",
                steps: [
                    "Allez sur la page de création de compte",
                    "Créez un nouveau compte spécifiquement pour ce bot",
                    "Important: N'utilisez PAS votre compte personnel/principal"
                ]
            },
            login: {
                title: "Étape 2: Se Connecter à la Plateforme",
                steps: [
                    "Ouvrez votre navigateur",
                    "Allez sur la plateforme (YouTube)",
                    "Connectez-vous avec votre compte jetable",
                    "Acceptez les conditions si demandé"
                ]
            },
            extension: {
                title: "Étape 3: Installer l'Extension d'Export de Cookies",
                chrome: "Pour Chrome/Edge: Installez 'Get cookies.txt LOCALLY' ou 'cookies.txt'",
                firefox: "Pour Firefox: Installez 'cookies.txt'"
            },
            exportCookies: {
                title: "Étape 4: Exporter les Cookies",
                steps: [
                    "Assurez-vous d'être sur le site web de la plateforme",
                    "Cliquez sur l'icône de l'extension cookies dans votre barre d'outils",
                    "Choisissez 'Export' ou 'Export cookies for this site'",
                    "Enregistrez le fichier sous cookies.txt"
                ]
            },
            upload: {
                title: "Étape 5: Téléverser sur Votre Serveur",
                steps: [
                    "Créez un dossier cache dans votre répertoire Rawon s'il n'existe pas",
                    "Téléversez le fichier cookies.txt dans le dossier cache",
                    "Le chemin devrait être: ./cache/cookies.txt"
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
            title: "Combien de temps durent les Cookies?",
            description:
                "Bonne nouvelle: Les cookies de la plateforme N'expirent PAS régulièrement. Ils resteront valides tant que:",
            conditions: [
                "Vous ne vous déconnectez pas de la plateforme dans votre navigateur",
                "Vous ne changez pas le mot de passe de votre compte",
                "Vous ne révoquez pas la session depuis les paramètres du compte",
                "La plateforme ne détecte pas d'activité suspecte"
            ],
            tips: "En pratique, les cookies peuvent durer des mois voire des années si vous suivez les bonnes pratiques."
        },
        security: {
            title: "Notes de Sécurité",
            warnings: [
                "Ne partagez jamais votre fichier de cookies avec qui que ce soit",
                "Utilisez un compte jetable, PAS votre compte principal",
                "Le fichier de cookies contient des données d'authentification sensibles",
                "Ajoutez cookies.txt à votre .gitignore pour éviter les commits accidentels"
            ]
        }
    },

    // Disclaimers page
    disclaimers: {
        title: "Mentions Légales",
        subtitle: "Veuillez lire attentivement avant d'utiliser ce bot.",
        warningBanner: "Informations légales importantes",
        copyright: {
            title: "Droits d'Auteur, DMCA et Propriété Intellectuelle",
            items: [
                "Propriété: Toute propriété intellectuelle utilisée, jouée ou affichée par le bot n'est pas notre propriété, ni celle des mainteneurs ou des contributeurs. Cela inclut, mais ne se limite pas aux fichiers audio, vidéo et image utilisés dans les commandes du bot.",
                "Politiques des Hébergeurs: Certains hébergeurs (comme Railway) interdisent l'hébergement ou la distribution de contenu protégé par DMCA. Cela inclut les bots musicaux Discord qui jouent de la musique/vidéo protégée par le droit d'auteur. Déployez sur de telles plateformes à vos propres risques.",
                "Responsabilité de l'Utilisateur: Vous êtes responsable de la façon dont vous utilisez ce bot et du contenu qui est joué à travers lui."
            ]
        },
        code: {
            title: "Modifications du Code",
            items: [
                "Licence: Ce bot est open source et peut être modifié et redistribué sous la licence AGPL-3.0.",
                "Aucune Garantie: Comme indiqué dans la licence, nous ne sommes pas responsables des dommages ou pertes résultant de la modification, redistribution ou utilisation de ce code.",
                "Attribution: Ne prétendez jamais que ce projet est votre propre travail original. Fournissez toujours une attribution appropriée au projet original."
            ]
        }
    },

    // Permission Calculator page
    permissionCalculator: {
        title: "Calculateur de Permissions",
        clientId: "ID Client",
        scope: "Portée",
        redirectUri: "URI de Redirection",
        permissions: "Permissions",
        permissionsNote:
            "Coloré signifie que l'utilisateur OAuth doit activer le 2FA sur son compte si le serveur requiert le 2FA",
        general: "Général",
        voice: "Voix",
        text: "Texte",
        result: "Résultat",
        resultNote: "C'est le lien que vous pouvez utiliser pour ajouter le bot à votre serveur"
    },

    // Common
    common: {
        back: "Retour",
        copy: "Copier",
        default: "Par défaut",
        required: "Requis",
        optional: "Optionnel",
        example: "Exemple",
        learnMore: "En savoir plus",
        deployOnRailway: "Déployer sur Railway",
        language: "Langue",
        tip: "Tip",
        warning: "Warning",
        note: "Note"
    }
};
