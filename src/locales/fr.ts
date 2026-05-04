import type { Translations } from "./en";

export const fr: Translations = {
    nav: {
        home: "Accueil",
        docs: "Docs",
        gettingStarted: "Démarrer",
        configuration: "Configuration",
        cookiesSetup: "Config. cookies",
        disclaimers: "Mentions légales",
        permissionCalculator: "Calculateur de permissions",
        links: "Liens"
    },

    home: {
        title: "Rawon",
        description:
            "Un bot musical Discord simple et puissant, pensé pour vos besoins en production. Facile à utiliser, sans aucune ligne de code.",
        invite: "Inviter",
        inviteBot: "Inviter le bot",
        support: "Support",
        viewDocs: "Voir la doc"
    },

    gettingStarted: {
        title: "Pour commencer",
        subtitle:
            "Mettez Rawon en route en quelques minutes grâce à ce guide pas à pas.",
        features: {
            title: "✨ Fonctionnalités",
            items: [
                "🚀 Prêt pour la prod, sans développement",
                "📺 Canal de demandes pour une expérience musicale fluide",
                "🎶 YouTube, Spotify, SoundCloud et fichiers directs",
                "🤖 Plusieurs instances du bot pour différents salons vocaux",
                "⚡ Mise en cache audio intelligente pour une lecture plus fluide",
                "🍪 Connexion Google intégrée via Puppeteer pour les cookies"
            ]
        },
        requirements: {
            title: "📋 Prérequis",
            nodeVersion: "**Node.js** version `20.0.0` ou supérieure",
            discordToken:
                "**Jeton bot Discord** (obtenu sur le [portail développeur Discord](https://discord.com/developers/applications))",
            optional:
                "**Facultatif :** [FFmpeg](https://ffmpeg.org/) pour le traitement audio sur une installation standard (hors Docker) — les images Docker incluent FFmpeg"
        },
        standardSetup: {
            title: "💻 Installation standard (Node.js)",
            steps: [
                "Téléchargez et installez les prérequis ci-dessus",
                "Clonez ou téléchargez ce dépôt",
                "Copiez `.env.example` vers `.env` et renseignez les valeurs requises (au minimum : `DISCORD_TOKEN`)",
                "Installez les dépendances : `pnpm install`",
                "Compilez le projet : `pnpm run build`",
                "Démarrez le bot : `pnpm start`"
            ],
            requestChannel:
                "(Facultatif) Une fois le bot en ligne, configurez un salon musical dédié :"
        },
        dockerSetup: {
            title: "🐳 Docker (recommandé)",
            composeTitle: "Avec Docker Compose",
            composeSteps: [
                "Créez un fichier `.env` avec votre configuration (copiez depuis `.env.example`)",
                "(Facultatif) Créez `dev.env` à partir de `dev.env.example` pour des options supplémentaires",
                "Créez un fichier `docker-compose.yaml` (voir l’exemple ci-dessous)",
                "Démarrez le bot : `docker compose up -d`",
                "Consultez les journaux : `docker logs -f rawon-bot`"
            ],
            runTitle: "Avec docker run",
            volumeInfo: {
                title: "📁 Volumes",
                description: "Le volume `/app/cache` contient :",
                items: [
                    "Le binaire `yt-dlp` pour la diffusion audio",
                    "`data.*` pour les réglages persistants (canaux de demandes, états du lecteur)",
                    "Les fichiers audio mis en cache (si la mise en cache est activée)",
                    "Le fichier de cookies et les données de profil après connexion Google (voir [Config. cookies](/docs/cookies-setup))"
                ]
            },
            portInfo: {
                title: "🔌 Ports",
                description:
                    "`DEVTOOLS_PORT` (par défaut `3000`) sert de proxy de débogage distant Chrome DevTools. Nécessaire pour `!login start` si vous vous connectez depuis une autre machine. Définissez `DEVTOOLS_PORT` dans `dev.env` et mappez-le dans Docker Compose ou `docker run`."
            }
        },

        cookiesQuickStart: {
            title: "🍪 Cookies : solution rapide en hébergement",
            description:
                "Sur certains hébergeurs cloud (AWS, GCP, Azure, Railway, etc.), vous pouvez voir **« Sign in to confirm you're not a bot »**. Utilisez la procédure de connexion intégrée :",
            steps: [
                "Exécutez `!login start` sur Discord",
                "Ouvrez l’URL DevTools envoyée par le bot et terminez la connexion Google dans le navigateur distant",
                "Utilisez `!login status` pour vérifier les cookies, ou `!login logout` puis `!login start` pour rafraîchir"
            ],
            tip: "💡 Utilisez un **compte Google jetable**, pas votre compte principal. Voir le guide complet [Config. cookies](/docs/cookies-setup)."
        }
    },

    configuration: {
        title: "Configuration",
        subtitle:
            "Comment les fichiers de configuration et les variables d’environnement de Rawon s’articulent.",
        overview: {
            title: "📄 Fichiers de configuration",
            intro: "Les réglages sont répartis volontairement entre plusieurs fichiers :",
            items: [
                "**`.env.example`** — Réglages essentiels (jetons Discord/Spotify, préfixe, ID, activités, etc.). Copiez vers **`.env`** et complétez.",
                "**`dev.env.example`** — Options développeur facultatives (préfixe/slash, sharding, port DevTools pour `!login`, chemin Chromium, mode debug). Copiez vers **`dev.env`** si besoin.",
                "**Commande `setup`** — Options propres au bot (couleur des embeds, emojis oui/non, splash, préfixe alternatif, volume par défaut, type de sélection, cache audio) gérées via la commande **`setup`** (développeurs uniquement) et stockées en base. Utilisez `<prefix>setup view` pour lister les réglages."
            ]
        },
        essential: {
            title: "⚡ Réglages essentiels (`.env`)",
            description:
                "Valeurs issues de `.env.example`. Seul **`DISCORD_TOKEN`** est strictement requis pour démarrer ; ajoutez Spotify, le jeton paroles, etc. selon vos besoins.",
            discordToken: {
                name: "DISCORD_TOKEN",
                description:
                    "Jeton(s) du bot Discord depuis le [portail développeur Discord](https://discord.com/developers/applications). Jetons **séparés par des virgules** pour le mode multi-bot.",
                required: true
            },
            spotify: {
                name: "API Spotify",
                description:
                    "Définissez `SPOTIFY_CLIENT_ID` et `SPOTIFY_CLIENT_SECRET` depuis [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard). **Requis pour le support Spotify.**",
                required: false
            },
            stegripeLyrics: {
                name: "STEGRIPE_API_LYRICS_TOKEN",
                description:
                    "Requis pour des paroles précises avec la commande **lyrics**. Contactez le développeur pour l’accès.",
                required: false
            },
            mainPrefix: {
                name: "MAIN_PREFIX",
                description: "Préfixe principal des commandes. Ex. : `!` pour taper `!play`",
                default: "!"
            },
            mainServer: {
                name: "MAIN_SERVER",
                description:
                    "ID de votre serveur principal pour un enregistrement plus rapide des commandes slash. Laissez vide pour des commandes globales (mise à jour pouvant prendre jusqu’à une heure)",
                required: false
            },
            devs: {
                name: "DEVS",
                description:
                    "ID utilisateurs des développeurs du bot (séparés par des virgules). Accès aux commandes spéciales dont `setup` et les outils `login`.",
                required: false
            },
            locale: {
                name: "LOCALE",
                description: "Langue des réponses du bot",
                default: "en-US",
                options:
                    "en-US, es-ES, fr-FR, id-ID, zh-CN, zh-TW, uk-UA, vi-VN, pt-BR, ru-RU, ja-JP, tr-TR, ko-KR"
            },
            activityTypes: {
                name: "ACTIVITY_TYPES",
                description:
                    "Types d’activité pour chaque entrée dans `ACTIVITIES` (séparés par des virgules). Doit correspondre au nombre d’activités",
                options: "PLAYING, WATCHING, LISTENING, COMPETING",
                default: "PLAYING"
            },
            activities: {
                name: "ACTIVITIES",
                description:
                    "Lignes de statut sous le nom du bot (séparées par des virgules). Placeholders : `{prefix}`, `{userCount}`, `{textChannelCount}`, `{serverCount}`, `{playingCount}`, `{username}`",
                required: false
            }
        },
        multiBot: {
            title: "🔄 Mode multi-bot",
            description:
                "Le mode multi-bot est **sans configuration supplémentaire** : un jeton = un bot ; jetons **séparés par des virgules** = multi-bot automatique.",
            example: "Exemple :",
            exampleCode: 'DISCORD_TOKEN="token1, token2, token3"',
            features: [
                "Le **premier** jeton est le bot principal pour les commandes générales",
                "Chaque bot sert la musique aux utilisateurs **de son** salon vocal",
                "Si le bot principal n’est pas sur un serveur, le suivant disponible peut prendre le relais",
                "Chaque bot nécessite **sa propre** application Discord"
            ]
        },
        developer: {
            title: "🛠️ Réglages développeur (`dev.env`)",
            description:
                "Issus de `dev.env.example`. **Facultatif** — ne modifiez que si vous savez ce que vous faites.",
            enablePrefix: {
                name: "ENABLE_PREFIX",
                description: "Activer ou désactiver les commandes préfixées (ex. `!play`)",
                default: "yes",
                options: "yes, no"
            },
            enableSlash: {
                name: "ENABLE_SLASH_COMMAND",
                description: "Activer ou désactiver les commandes slash (ex. `/play`)",
                default: "yes",
                options: "yes, no"
            },
            enableSharding: {
                name: "ENABLE_SHARDING",
                description: "Sharding pour les gros bots (**mode un seul jeton uniquement**)",
                default: "no",
                options: "yes, no"
            },
            devtoolsPort: {
                name: "DEVTOOLS_PORT",
                description:
                    "Port du proxy de débogage distant Chrome DevTools. Utilisé par `!login start` depuis une autre machine. Défaut : `3000`",
                default: "3000"
            },
            chromiumPath: {
                name: "CHROMIUM_PATH",
                description:
                    "Chemin vers Chrome/Chromium pour la connexion Google. Laissez vide pour la détection automatique",
                required: false
            },
            nodeEnv: {
                name: "NODE_ENV",
                description: "Mode d’environnement d’exécution",
                default: "production",
                options: "production, development"
            },
            debugMode: {
                name: "DEBUG_MODE",
                description: "Journaux de debug verbeux dans la console",
                default: "no",
                options: "yes, no"
            }
        }
    },

    cookiesSetup: {
        title: "Configuration des cookies",
        subtitle:
            "Corriger « Sign in to confirm you're not a bot » en hébergement cloud. Recommandé : la commande **`!login`** intégrée.",
        why: {
            title: "Pourquoi c’est nécessaire ?",
            description:
                "Si vous hébergez Rawon chez OVHcloud, AWS, GCP, Azure ou un autre cloud/VPS, vous pouvez voir :",
            error: "Sign in to confirm you're not a bot",
            explanation:
                "Les plateformes bloquent souvent les IP de datacenters. S’authentifier avec un **compte Google** permet à Rawon d’obtenir des cookies valides et de contourner cette limite."
        },
        loginMethod: {
            title: "Recommandé : commande `!login`",
            description:
                "Le plus simple est le flux **`!login`** intégré (navigateur réel via Puppeteer) :",
            benefits: [
                "✅ Ouvre un vrai navigateur pour la connexion Google",
                "✅ Exporte et enregistre les cookies automatiquement",
                "✅ Ferme le navigateur après connexion — pas de processus orphelin",
                "✅ Persistant après redémarrage (volume Docker ou dossier `cache/`)"
            ]
        },
        commandUsage: {
            title: "Utilisation des commandes"
        },
        quickStart: {
            title: "Démarrage rapide",
            steps: [
                "Exécutez `!login start` sur Discord",
                "Ouvrez l’**URL DevTools** envoyée par le bot dans votre navigateur local",
                "Terminez la connexion Google dans la session **distante**",
                "Connectez-vous avec un **compte Google jetable** (pas le compte principal)",
                "À la fin, le bot enregistre les cookies et ferme le navigateur",
                "C’est prêt — les requêtes suivantes utilisent la session enregistrée"
            ]
        },
        staleCookies: {
            title: "Si les vérifications reviennent",
            description:
                "Les cookies peuvent expirer quand le fournisseur les fait tourner. Dans ce cas :",
            steps: [
                "Exécutez `!login logout` pour effacer les anciens cookies et le profil",
                "Exécutez `!login start` et reconnectez-vous pour une session neuve"
            ]
        },
        prerequisites: {
            title: "Prérequis",
            items: [
                "Un **compte Google secondaire / jetable** (n’utilisez **pas** votre compte principal)",
                "**Hors Docker :** Chrome ou Chromium installé sur la machine",
                "**Docker :** Chromium est inclus ; mappez `DEVTOOLS_PORT` si vous utilisez `!login` à distance (voir [Configuration](/docs/configuration))"
            ]
        },
        docker: {
            title: "Docker",
            persistence:
                "Les cookies et le profil persistent dans le volume nommé **`rawon:/app/cache`** entre les redémarrages du conteneur.",
            chromium:
                "L’image inclut Chromium : **`!login start`** fonctionne sans étape supplémentaire côté image."
        },
        envVars: {
            title: "Variables d’environnement (`dev.env`)",
            intro: "Réglages optionnels (voir `dev.env.example`) :",
            dockerComposeHint:
                "Sous Docker, exposez le port DevTools dans `ports` de `docker-compose.yaml`, par ex. :"
        },
        duration: {
            title: "Combien de temps durent les cookies ?",
            description:
                "Ils peuvent vieillir quand les sessions sont renouvelées. Ils restent en général valides tant que :",
            conditions: [
                "Vous ne vous déconnectez pas d’une manière qui invalide la session",
                "Vous ne changez pas le mot de passe du compte",
                "Vous ne révoquez pas la session dans la sécurité du compte",
                "Le fournisseur ne signale pas d’activité suspecte"
            ],
            footer:
                "Quand les cookies expirent : `!login logout` puis `!login start` à nouveau."
        },
        troubleshooting: {
            title: "Dépannage",
            stillErrors: {
                title: "Toujours « Sign in to confirm you're not a bot » ?",
                steps: [
                    "Utilisez `!login status` pour l’état de la connexion et des cookies",
                    "Exécutez `!login logout` puis `!login start` pour une session neuve"
                ]
            },
            browserWontStart: {
                title: "Le navigateur ne démarre pas ?",
                steps: [
                    "Consultez `!login status` pour le détail des erreurs",
                    "Sur machine physique, installez Chrome/Chromium ou définissez `CHROMIUM_PATH` dans `dev.env`",
                    "Sous Docker, Chromium devrait fonctionner avec l’image officielle"
                ]
            },
            accountSuspended: {
                title: "Compte suspendu ?",
                steps: [
                    "Créez un nouveau compte Google jetable",
                    "Exécutez `!login logout` pour effacer l’ancienne session",
                    "Exécutez `!login start` avec le nouveau compte"
                ]
            }
        },
        manualAlternative: {
            title: "Alternative : fichier cookies manuel",
            description:
                "Vous pouvez placer un fichier cookies au **format Netscape** au chemin indiqué. Le bot l’utilisera s’il est présent ; **`!login` reste recommandé** pour un flux plus simple.",
            pathLabel: "Chemin"
        },
        security: {
            title: "Sécurité",
            warningLabel: "AVERTISSEMENT",
            warnings: [
                "Utilisez un compte **jetable** — **pas** votre compte principal",
                "L’URL DevTools donne accès au navigateur distant — **ne la partagez pas publiquement**",
                "Les fichiers cookies contiennent des données **sensibles** d’authentification"
            ]
        }
    },

    disclaimers: {
        title: "Mentions légales",
        subtitle: "Veuillez lire attentivement avant d’utiliser ce bot.",
        warningBanner: "Informations juridiques importantes",
        copyright: {
            title: "Copyright, DMCA et propriété intellectuelle",
            items: [
                "**Propriété :** Toute propriété intellectuelle utilisée, lue ou affichée par le bot **n’appartient pas** aux mainteneurs ni aux contributeurs. Cela inclut notamment l’audio, la vidéo et les images utilisés par les commandes.",
                "**Politiques d’hébergeurs :** Certains hébergeurs interdisent l’hébergement ou la diffusion de contenus protégés par le DMCA, y compris les bots musicaux Discord.\n- **Vous déployez à vos risques sur ces plateformes**",
                "**Responsabilité utilisateur :** Vous êtes responsable de l’usage du bot et du contenu diffusé."
            ]
        },
        code: {
            title: "Modifications du code",
            items: [
                "**Licence :** Ce projet est sous [Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International (CC BY-NC-ND 4.0)](https://creativecommons.org/licenses/by-nc-nd/4.0/). Le texte complet est dans le fichier [`LICENSE`](https://github.com/stegripe/rawon/blob/main/LICENSE) du dépôt.",
                "**Aucune garantie :** Conformément à la licence, nous **ne sommes pas responsables** des dommages liés à l’usage de ce code. Respectez attribution, usage non commercial et restrictions sur le partage de versions adaptées.",
                "**Attribution :** Ne présentez pas ce projet comme votre œuvre originale. Attribuez toujours correctement le projet d’origine."
            ]
        },
        licenseFooterPrefix: "Texte complet de la licence dans le dépôt :",
        licenseLinkLabel: "LICENSE (CC BY-NC-ND 4.0)"
    },

    permissionCalculator: {
        title: "Calculateur de permissions",
        clientId: "ID client",
        scope: "Portée",
        redirectUri: "URI de redirection",
        permissions: "Permissions",
        permissionsNote:
            "En couleur : l’utilisateur OAuth doit activer l’A2F si le serveur l’exige",
        general: "Général",
        voice: "Vocal",
        text: "Texte",
        result: "Résultat",
        resultNote: "Lien à utiliser pour ajouter le bot à votre serveur"
    },

    common: {
        back: "Retour",
        copy: "Copier",
        default: "Par défaut",
        required: "Requis",
        optional: "Facultatif",
        example: "Exemple",
        learnMore: "En savoir plus",

        language: "Langue",
        tip: "Astuce",
        warning: "Avertissement",
        note: "Note"
    }
};
