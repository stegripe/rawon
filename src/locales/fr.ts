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
            },
            configure: {
                title: "Étape 6: Configurer la Variable d'Environnement",
                instruction: "Ajoutez ceci à votre fichier .env:"
            },
            restart: {
                title: "Étape 7: Redémarrer Rawon",
                instruction: "Redémarrez votre bot pour appliquer les changements."
            }
        },
        docker: {
            title: "Configuration Docker",
            description:
                "Si vous utilisez Docker, placez votre fichier cookies.txt à côté de votre fichier docker-compose.yaml et ajoutez le montage de volume."
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
        language: "Langue"
    }
};
