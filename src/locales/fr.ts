export const fr = {
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

    home: {
        title: "Rawon",
        description:
            "Un bot musical Discord simple mais puissant, conçu pour répondre à vos besoins de production.",
        invite: "Inviter",
        support: "Support"
    },

    gettingStarted: {
        title: "Démarrer",
        subtitle: "Mettez Rawon en marche en quelques minutes avec notre guide étape par étape.",
        features: {
            title: "Fonctionnalités",
            items: [
                "Support des interactions (commandes slash et boutons)",
                "Canal de requêtes pour une expérience musicale fluide",
                "Prêt pour la production, sans codage requis",
                "Commandes musicales de base (play, pause, skip, queue, etc.)",
                "Support multilingue"
            ]
        },
        requirements: {
            title: "Prérequis",
            nodeVersion: "**Node.js** version `22.12.0` ou supérieure",
            discordToken: "**Token Bot Discord** (obtenir depuis [Discord Developer Portal](https://discord.com/developers/applications))",
            optional: "**Optionnel:** Identifiants API Spotify pour le support Spotify"
        },
        standardSetup: {
            title: "Installation Standard (Node.js)",
            steps: [
                "Téléchargez et installez **Node.js** version `22.12.0` ou supérieure",
                "Clonez ou téléchargez ce dépôt",
                "Copiez `.env_example` vers `.env` et remplissez les valeurs requises (minimum: `DISCORD_TOKEN`)",
                "Installez les dépendances: `pnpm install`",
                "Compilez le projet: `pnpm run build`",
                "Démarrez le bot: `pnpm start`"
            ],
            requestChannel: "(Optionnel) Après que le bot soit en ligne, configurez un canal musical dédié:"
        },
        dockerSetup: {
            title: "Installation Docker (Recommandé)",
            composeTitle: "Avec Docker Compose",
            composeSteps: [
                "Créez un fichier `.env` avec votre configuration (copiez depuis `.env_example`)",
                "Créez un fichier `docker-compose.yaml` (voir exemple ci-dessous)",
                "Démarrez le bot: `docker compose up -d`",
                "Voir les logs: `docker logs -f rawon-bot`"
            ],
            runTitle: "Avec Docker Run",
            volumeInfo: {
                title: "Information sur le Volume",
                description: "Le volume `/app/cache` stocke:",
                items: [
                    "Binaire `yt-dlp` pour le streaming audio",
                    "`data.json` pour les paramètres persistants (canaux de requêtes, états du lecteur)",
                    "Fichiers audio en cache (si le cache audio est activé)"
                ]
            }
        },

        cookiesQuickStart: {
            title: "🍪 Démarrage Rapide : Configuration des Cookies",
            description:
                "Si vous hébergez sur des fournisseurs cloud (AWS, GCP, Azure, Railway, etc.), vous pouvez obtenir des erreurs \"Sign in to confirm you're not a bot\". Corrigez-les facilement avec la commande cookies :",
            steps: [
                "Exportez les cookies depuis votre navigateur (voir le [guide Config. Cookies](/docs/cookies-setup))",
                "Dans Discord, tapez : `!cookies add 1`",
                "Joignez votre fichier `cookies.txt` au message",
                "Terminé ! Le cookie prend effet immédiatement"
            ],
            tip: "💡 Vous pouvez ajouter plusieurs cookies pour la redondance. Quand l'un échoue, Rawon passe automatiquement au suivant !"
        }
    },

    configuration: {
        title: "Configuration",
        subtitle: "Configurez Rawon selon vos besoins avec ces paramètres.",
        essential: {
            title: "Paramètres Essentiels",
            description: "Ce sont les paramètres minimum requis pour exécuter le bot. Remplissez simplement votre **token Discord** et c'est prêt !",
            discordToken: {
                name: "DISCORD_TOKEN",
                description: "Votre token de bot Discord depuis [Discord Developer Portal](https://discord.com/developers/applications). C'est le **seul paramètre REQUIS** !",
                required: true
            },
            mainPrefix: {
                name: "MAIN_PREFIX",
                description: "Préfixe de commande principal. Exemple: `!` signifie que vous tapez `!play` pour jouer de la musique",
                default: "!"
            },
            mainServer: {
                name: "MAIN_SERVER",
                description: "ID de votre serveur principal pour l'enregistrement des commandes slash",
                required: false
            },
            locale: {
                name: "LOCALE",
                description: "Langue du bot - choisissez votre langue préférée pour les réponses du bot",
                default: "en-US",
                options: "en-US, es-ES, fr-FR, id-ID, zh-CN, zh-TW, uk-UA, vi-VN, pt-BR, ru-RU, ja-JP, tr-TR"
            },
            spotify: {
                name: "Spotify API",
                description: "Pour le support Spotify, obtenez vos identifiants sur [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard) et définissez `SPOTIFY_CLIENT_ID` et `SPOTIFY_CLIENT_SECRET`"
            }
        },
        optional: {
            title: "Paramètres Optionnels",
            description: "Personnalisez le comportement et l'apparence de Rawon. Tous ces paramètres sont optionnels - le bot fonctionne bien sans eux !",
            altPrefix: {
                name: "ALT_PREFIX",
                description: "Préfixes alternatifs (séparés par virgule). Utilisez `{mention}` pour la mention @bot. Exemple: `{mention},r!` permet `@Rawon play` et `r!play`",
                default: "{mention}"
            },
            activities: {
                name: "ACTIVITIES",
                description:
                    "Activités de statut du bot (séparées par virgule). Formats: `{prefix}`, `{userCount}`, `{textChannelCount}`, `{serverCount}`, `{playingCount}`, `{username}`"
            },
            activityTypes: {
                name: "ACTIVITY_TYPES",
                description: "Types d'activité pour chaque activité (séparés par virgule). Doit correspondre au nombre de `ACTIVITIES`",
                options: "PLAYING, WATCHING, LISTENING, COMPETING"
            },
            embedColor: {
                name: "EMBED_COLOR",
                description: "Couleur d'embed en hex (sans `#`). Cette couleur apparaît sur tous les embeds du bot",
                default: "22C9FF"
            },
            emojis: {
                name: "Emojis",
                description: "Personnalisez les emojis de succès (`YES_EMOJI`) et d'échec (`NO_EMOJI`)",
                defaults: "✅ / ❌"
            },
            musicSelection: {
                name: "MUSIC_SELECTION_TYPE",
                description: "Style de sélection musicale. `message` affiche une liste numérotée, `selectmenu` affiche un menu déroulant",
                options: "message, selectmenu",
                default: "message"
            },
            audioCache: {
                name: "ENABLE_AUDIO_CACHE",
                description: "**[EXPÉRIMENTAL]** Cache audio téléchargé pour une lecture répétée plus rapide",
                default: "no"
            },
            requestChannelSplash: {
                name: "REQUEST_CHANNEL_SPLASH",
                description: "URL d'image personnalisée pour l'embed du lecteur du canal de requêtes",
                default: "https://cdn.stegripe.org/images/rawon_splash.png"
            }
        },
        developer: {
            title: "🛠️ Paramètres Développeur",
            description: "Paramètres avancés pour les développeurs de bots. **N'utilisez que si vous savez ce que vous faites !**",
            devs: {
                name: "DEVS",
                description: "IDs des développeurs du bot (séparés par virgule). Les développeurs peuvent accéder aux commandes spéciales"
            },
            enablePrefix: {
                name: "ENABLE_PREFIX",
                description: "Activer/désactiver les commandes avec préfixe (comme `!play`). Utile si vous ne voulez que les commandes slash",
                default: "yes",
                options: "yes, no"
            },
            enableSlash: {
                name: "ENABLE_SLASH_COMMAND",
                description: "Activer/désactiver les commandes slash (comme `/play`). Utile si vous ne voulez que les commandes avec préfixe",
                default: "yes",
                options: "yes, no"
            },
            debugMode: {
                name: "DEBUG_MODE",
                description: "Activer les logs de débogage pour le dépannage. Affiche des logs détaillés dans la console",
                default: "no",
                options: "yes, no"
            }
        }
    },

    cookiesSetup: {
        title: "Configuration des Cookies",
        subtitle: "Corrigez les erreurs \"Sign in to confirm you're not a bot\" sur les hébergeurs.",
        why: {
            title: "Pourquoi ai-je besoin de ceci?",
            description:
                "Si vous hébergez Rawon sur des fournisseurs cloud comme OVHcloud, AWS, GCP, Azure, ou autres services d'hébergement, vous pourriez rencontrer l'erreur:",
            error: "Sign in to confirm you're not a bot",
            explanation:
                "Cela se produit parce que la plateforme bloque les requêtes provenant d'adresses IP de centres de données. En utilisant les cookies d'un compte connecté, vous pouvez contourner cette restriction."
        },

        quickMethod: {
            title: "🚀 Méthode Facile : Utiliser la Commande Cookies (Recommandé)",
            description: "La façon la plus simple de gérer les cookies - sans édition de fichiers !",
            benefits: [
                "✅ Fonctionne instantanément - pas de redémarrage nécessaire",
                "✅ Supporte plusieurs cookies avec rotation automatique",
                "✅ Quand un cookie échoue, le bot utilise automatiquement le suivant",
                "✅ Les cookies persistent après le redémarrage du bot"
            ],
            commands: {
                title: "📝 Commandes Disponibles",
                add: "`!cookies add <numéro>` - Ajouter un cookie (joindre le fichier cookies.txt à votre message)",

            },
            quickStart: {
                title: "⚡ Démarrage Rapide (3 étapes)",
                steps: [
                    "Exportez les cookies depuis votre navigateur (voir guide ci-dessous)",
                    "Dans Discord, tapez : `!cookies add 1` et joignez votre fichier cookies.txt",
                    "Terminé ! Le cookie est maintenant actif"
                ]
            },
            multiCookie: {
                title: "💡 Astuce Pro : Ajouter Plusieurs Cookies",
                description: "Ajoutez des cookies de différents comptes pour une meilleure fiabilité :"
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
                    "Allez sur la [page de création de compte](https://accounts.google.com/signup)",
                    "Créez un nouveau compte spécifiquement pour ce bot",
                    "⚠️ Important: N'utilisez JAMAIS votre compte personnel/principal!"
                ]
            },
            login: {
                title: "Étape 2: Se Connecter à la Plateforme Vidéo",
                steps: [
                    "Ouvrez votre navigateur",
                    "Allez sur [la plateforme vidéo](https://youtube.com)",
                    "Connectez-vous avec votre compte jetable",
                    "Acceptez les conditions si demandé"
                ]
            },
            extension: {
                title: "Étape 3: Installer l'Extension d'Export de Cookies",
                chrome: "Pour Chrome/Edge: Installez [**Get cookies.txt LOCALLY**](https://chromewebstore.google.com/detail/get-cookiestxt-locally/cclelndahbckbenkjhflpdbgdldlbecc) (recommandé) depuis Chrome Web Store",
                firefox: "Pour Firefox: Installez [**cookies.txt**](https://addons.mozilla.org/en-US/firefox/addon/cookies-txt/) depuis Firefox Add-ons"
            },
            exportCookies: {
                title: "Étape 4: Exporter les Cookies",
                steps: [
                    "Assurez-vous d'être sur [le site de la plateforme vidéo](https://youtube.com)",
                    "Cliquez sur l'icône de l'extension cookies dans votre barre d'outils",
                    "Choisissez **Export** ou **Export cookies for this site**",
                    "Enregistrez le fichier sous `cookies.txt`"
                ]
            },
            upload: {
                title: "Étape 5: Ajouter à Rawon",
                steps: [
                    "Allez dans un canal où Rawon peut voir vos messages",
                    "Tapez: `!cookies add 1`",
                    "Joignez le fichier cookies.txt à votre message et envoyez",
                    "Rawon confirmera que le cookie a été ajouté!"
                ]
            }
        },
        troubleshooting: {
            title: "🔧 Dépannage",
            stillGettingErrors: {
                title: "Vous avez toujours des erreurs \"Sign in to confirm you're not a bot\" ?",
                steps: [
                    "Utilisez `!cookies list` pour vérifier le statut des cookies",
                    "Si un cookie affiche **Failed**, essayez `!cookies reset` pour réessayer",
                    "Ajoutez plus de cookies de différents comptes pour la redondance"
                ]
            },
            allCookiesFailed: {
                title: "Tous les cookies ont échoué ?",
                steps: [
                    "Créez de nouveaux comptes jetables",
                    "Exportez de nouveaux cookies",
                    "Ajoutez-les avec `!cookies add <numéro>`"
                ]
            },
            accountSuspended: {
                title: "Compte suspendu ?",
                steps: [
                    "Cela peut arriver avec une utilisation intensive",
                    "Créez simplement un nouveau compte jetable",
                    "Exportez de nouveaux cookies et ajoutez-les"
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
            title: "🔒 Notes de Sécurité",
            warnings: [
                "⚠️ Ne partagez jamais votre fichier de cookies avec qui que ce soit",
                "⚠️ Utilisez un compte jetable, PAS votre compte principal",
                "⚠️ Le fichier de cookies contient des données d'authentification sensibles"
            ]
        }
    },

    disclaimers: {
        title: "Mentions Légales",
        subtitle: "Veuillez lire attentivement avant d'utiliser ce bot.",
        warningBanner: "Informations légales importantes",
        copyright: {
            title: "Droits d'Auteur, DMCA et Propriété Intellectuelle",
            items: [
                "**Propriété:** Toute propriété intellectuelle utilisée, jouée ou affichée par le bot n'est pas notre propriété, ni celle des mainteneurs ou des contributeurs. Cela inclut, mais ne se limite pas aux fichiers audio, vidéo et image utilisés dans les commandes du bot.",
                "**Politiques des Hébergeurs:** Certains hébergeurs interdisent l'hébergement ou la distribution de contenu protégé par DMCA. Cela inclut les bots musicaux Discord qui jouent de la musique/vidéo protégée par le droit d'auteur. Déployez sur de telles plateformes à vos propres risques.",
                "**Responsabilité de l'Utilisateur:** Vous êtes responsable de la façon dont vous utilisez ce bot et du contenu qui est joué à travers lui."
            ]
        },
        code: {
            title: "Modifications du Code",
            items: [
                "**Licence:** Ce bot est open source et peut être modifié et redistribué sous la licence **AGPL-3.0**.",
                "**Aucune Garantie:** Comme indiqué dans la licence, nous ne sommes pas responsables des dommages ou pertes résultant de la modification, redistribution ou utilisation de ce code.",
                "**Attribution:** Ne prétendez jamais que ce projet est votre propre travail original. Fournissez toujours une attribution appropriée au projet original."
            ]
        }
    },

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

    common: {
        back: "Retour",
        copy: "Copier",
        default: "Par défaut",
        required: "Requis",
        optional: "Optionnel",
        example: "Exemple",
        learnMore: "En savoir plus",

        language: "Langue",
        tip: "Astuce",
        warning: "Avertissement",
        note: "Note"
    }
};
