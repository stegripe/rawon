(() => {
var exports = {};
exports.id = 888;
exports.ids = [888];
exports.modules = {

/***/ 6453:
/***/ ((module) => {

// Exports
module.exports = {
	"style": {"fontFamily":"'__Poppins_687492', '__Poppins_Fallback_687492'","fontStyle":"normal"},
	"className": "__className_687492"
};


/***/ }),

/***/ 5358:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  "default": () => (/* reexport */ MyApp)
});

// EXTERNAL MODULE: ./node_modules/react/jsx-runtime.js
var jsx_runtime = __webpack_require__(5893);
// EXTERNAL MODULE: ./node_modules/next/font/google/target.css?{"path":"src/pages/_app.tsx","import":"Poppins","arguments":[{"weight":["100","200","300","400","500","600","700","800","900"],"subsets":["latin"]}],"variableName":"poppins"}
var _app_tsx_import_Poppins_arguments_weight_100_200_300_400_500_600_700_800_900_subsets_latin_variableName_poppins_ = __webpack_require__(6453);
var _app_tsx_import_Poppins_arguments_weight_100_200_300_400_500_600_700_800_900_subsets_latin_variableName_poppins_default = /*#__PURE__*/__webpack_require__.n(_app_tsx_import_Poppins_arguments_weight_100_200_300_400_500_600_700_800_900_subsets_latin_variableName_poppins_);
;// CONCATENATED MODULE: external "styled-jsx/style"
const style_namespaceObject = require("styled-jsx/style");
var style_default = /*#__PURE__*/__webpack_require__.n(style_namespaceObject);
// EXTERNAL MODULE: external "@mui/icons-material/ExpandLessRounded"
var ExpandLessRounded_ = __webpack_require__(7892);
var ExpandLessRounded_default = /*#__PURE__*/__webpack_require__.n(ExpandLessRounded_);
// EXTERNAL MODULE: external "@mui/icons-material/ExpandMoreRounded"
var ExpandMoreRounded_ = __webpack_require__(4666);
var ExpandMoreRounded_default = /*#__PURE__*/__webpack_require__.n(ExpandMoreRounded_);
;// CONCATENATED MODULE: external "@mui/icons-material/MenuRounded"
const MenuRounded_namespaceObject = require("@mui/icons-material/MenuRounded");
var MenuRounded_default = /*#__PURE__*/__webpack_require__.n(MenuRounded_namespaceObject);
// EXTERNAL MODULE: external "@mui/material"
var material_ = __webpack_require__(5692);
// EXTERNAL MODULE: ./node_modules/next/image.js
var next_image = __webpack_require__(5675);
var image_default = /*#__PURE__*/__webpack_require__.n(next_image);
// EXTERNAL MODULE: ./node_modules/next/link.js
var next_link = __webpack_require__(1664);
var link_default = /*#__PURE__*/__webpack_require__.n(next_link);
;// CONCATENATED MODULE: external "next/router"
const router_namespaceObject = require("next/router");
// EXTERNAL MODULE: external "react"
var external_react_ = __webpack_require__(6689);
;// CONCATENATED MODULE: ./src/components/NavigationBar.tsx









const NavigationItems = [
    {
        name: "Home",
        path: "/"
    },
    {
        name: "Permission Calculator",
        path: "/permission-calculator"
    },
    {
        name: "Script Generator",
        path: "/script-generator"
    }
];
const ExternalLinks = [
    {
        name: "Discord",
        path: "/discord"
    },
    {
        name: "Github",
        path: "/github"
    },
    {
        name: "Clytage",
        path: "/clytage"
    }
];
const NavigationBar = ()=>{
    const router = (0,router_namespaceObject.useRouter)();
    const [isDrawerOpen, setDrawerOpen] = (0,external_react_.useState)(false);
    const [isLinksOpen, setLinksOpen] = (0,external_react_.useState)(false);
    const [anchorEl, setAnchorEl] = (0,external_react_.useState)(null);
    const open = Boolean(anchorEl);
    const handleClick = (event)=>{
        setAnchorEl(event.currentTarget);
    };
    const handleClose = ()=>{
        setAnchorEl(null);
    };
    const ToggleDrawer = ()=>{
        setDrawerOpen((open)=>!open);
    };
    const ToggleLinks = ()=>{
        setLinksOpen((open)=>!open);
    };
    return /*#__PURE__*/ (0,jsx_runtime.jsxs)(jsx_runtime.Fragment, {
        children: [
            /*#__PURE__*/ (0,jsx_runtime.jsxs)(material_.Container, {
                fixed: true,
                className: `${router.pathname === "/" ? "fixed left-[50%] -translate-x-[50%]" : "sticky"} top-0 z-50 flex h-20 w-full items-center justify-between bg-primary px-5 pt-0`,
                children: [
                    /*#__PURE__*/ (0,jsx_runtime.jsxs)("div", {
                        className: "flex items-center gap-1",
                        children: [
                            /*#__PURE__*/ jsx_runtime.jsx("div", {
                                className: "relative aspect-square h-auto w-12",
                                children: /*#__PURE__*/ jsx_runtime.jsx((image_default()), {
                                    src: "/icons/icon-512x512.png",
                                    fill: true,
                                    alt: "rawon.jpg"
                                })
                            }),
                            /*#__PURE__*/ jsx_runtime.jsx(material_.Typography, {
                                className: "text-center font-sans text-xl font-medium capitalize text-third",
                                children: "rawon"
                            })
                        ]
                    }),
                    /*#__PURE__*/ jsx_runtime.jsx(material_.IconButton, {
                        id: "drawerToggleButton",
                        onClick: ToggleDrawer,
                        className: "p-0 md:hidden",
                        children: /*#__PURE__*/ jsx_runtime.jsx((MenuRounded_default()), {
                            className: "text-4xl"
                        })
                    }),
                    /*#__PURE__*/ (0,jsx_runtime.jsxs)("div", {
                        className: "hidden gap-1 md:flex",
                        children: [
                            /*#__PURE__*/ jsx_runtime.jsx("div", {
                                className: "flex gap-1",
                                children: NavigationItems.map((item, index)=>/*#__PURE__*/ jsx_runtime.jsx((link_default()), {
                                        href: item.path,
                                        className: "text-inherit no-underline",
                                        children: /*#__PURE__*/ jsx_runtime.jsx(material_.Button, {
                                            id: item.name,
                                            color: "inherit",
                                            className: "justify-start p-0 px-4 py-1 font-sans text-lg capitalize text-third",
                                            children: item.name
                                        })
                                    }, index))
                            }),
                            /*#__PURE__*/ (0,jsx_runtime.jsxs)("div", {
                                className: "flex flex-col gap-1",
                                children: [
                                    /*#__PURE__*/ jsx_runtime.jsx(material_.Button, {
                                        id: "links",
                                        onClick: handleClick,
                                        color: "inherit",
                                        className: "justify-start p-0 px-4 py-1 font-sans text-lg capitalize text-third",
                                        children: "Links"
                                    }),
                                    /*#__PURE__*/ jsx_runtime.jsx(material_.Popover, {
                                        id: "__next",
                                        open: open,
                                        anchorEl: anchorEl,
                                        onClose: handleClose,
                                        anchorOrigin: {
                                            vertical: "bottom",
                                            horizontal: "center"
                                        },
                                        transformOrigin: {
                                            vertical: "top",
                                            horizontal: "center"
                                        },
                                        sx: {
                                            "& .MuiPopover-paper": {
                                                backgroundColor: "#FFF3D1"
                                            }
                                        },
                                        children: /*#__PURE__*/ jsx_runtime.jsx("div", {
                                            className: "flex flex-col p-2",
                                            children: ExternalLinks.map((item, index)=>/*#__PURE__*/ jsx_runtime.jsx((link_default()), {
                                                    href: item.path,
                                                    passHref: true,
                                                    legacyBehavior: true,
                                                    children: /*#__PURE__*/ jsx_runtime.jsx("a", {
                                                        target: "_blank",
                                                        rel: "noreferrer",
                                                        children: /*#__PURE__*/ jsx_runtime.jsx(material_.Button, {
                                                            id: item.name,
                                                            onClick: handleClose,
                                                            color: "inherit",
                                                            className: "w-full justify-start p-0 px-4 py-1 font-sans capitalize text-third",
                                                            children: item.name
                                                        })
                                                    })
                                                }, index))
                                        })
                                    })
                                ]
                            })
                        ]
                    })
                ]
            }),
            /*#__PURE__*/ jsx_runtime.jsx(material_.Drawer, {
                id: "__next",
                anchor: "left",
                open: isDrawerOpen,
                onClose: ToggleDrawer,
                PaperProps: {
                    sx: {
                        backgroundColor: "#FFF3D1"
                    }
                },
                children: /*#__PURE__*/ (0,jsx_runtime.jsxs)(material_.Container, {
                    fixed: true,
                    className: "flex h-full w-full flex-col items-center p-0 text-third",
                    children: [
                        /*#__PURE__*/ jsx_runtime.jsx((link_default()), {
                            href: "/",
                            className: "flex w-full p-3 text-inherit no-underline",
                            children: /*#__PURE__*/ (0,jsx_runtime.jsxs)("div", {
                                className: "flex items-center gap-1",
                                children: [
                                    /*#__PURE__*/ jsx_runtime.jsx("div", {
                                        className: "relative aspect-square h-auto w-12",
                                        children: /*#__PURE__*/ jsx_runtime.jsx((image_default()), {
                                            src: "/icons/icon-512x512.png",
                                            fill: true,
                                            alt: "rawon.jpg"
                                        })
                                    }),
                                    /*#__PURE__*/ jsx_runtime.jsx(material_.Typography, {
                                        className: "mt-2 text-center font-sans text-xl font-medium capitalize text-third",
                                        children: "rawon"
                                    })
                                ]
                            })
                        }),
                        /*#__PURE__*/ jsx_runtime.jsx(material_.Divider, {
                            className: "mb-4 w-full"
                        }),
                        /*#__PURE__*/ jsx_runtime.jsx("div", {
                            className: "flex w-full flex-col gap-1",
                            children: NavigationItems.map((item, index)=>/*#__PURE__*/ jsx_runtime.jsx((link_default()), {
                                    href: item.path,
                                    onClick: ToggleDrawer,
                                    className: "w-full text-inherit no-underline",
                                    children: /*#__PURE__*/ jsx_runtime.jsx(material_.Button, {
                                        id: item.name,
                                        color: "inherit",
                                        className: "w-full justify-start p-0 px-8 py-1 font-sans text-lg capitalize",
                                        children: item.name
                                    })
                                }, index))
                        }),
                        /*#__PURE__*/ jsx_runtime.jsx(material_.Divider, {
                            className: "m-4 w-full"
                        }),
                        /*#__PURE__*/ (0,jsx_runtime.jsxs)("div", {
                            className: "flex w-full flex-col gap-1",
                            children: [
                                /*#__PURE__*/ jsx_runtime.jsx(material_.Button, {
                                    id: "generalPermissionButton",
                                    color: "inherit",
                                    endIcon: isLinksOpen ? /*#__PURE__*/ jsx_runtime.jsx((ExpandLessRounded_default()), {
                                        className: "text-xl text-third"
                                    }) : /*#__PURE__*/ jsx_runtime.jsx((ExpandMoreRounded_default()), {
                                        className: "text-xl text-third"
                                    }),
                                    onClick: ToggleLinks,
                                    className: "w-full justify-between px-8 font-sans text-lg font-medium capitalize",
                                    children: "Links"
                                }),
                                /*#__PURE__*/ jsx_runtime.jsx(material_.Collapse, {
                                    in: isLinksOpen,
                                    children: /*#__PURE__*/ jsx_runtime.jsx("div", {
                                        className: "flex w-full flex-col gap-1",
                                        children: ExternalLinks.map((item, index)=>/*#__PURE__*/ jsx_runtime.jsx((link_default()), {
                                                href: item.path,
                                                passHref: true,
                                                legacyBehavior: true,
                                                children: /*#__PURE__*/ jsx_runtime.jsx("a", {
                                                    target: "_blank",
                                                    rel: "noreferrer",
                                                    children: /*#__PURE__*/ jsx_runtime.jsx(material_.Button, {
                                                        id: item.name,
                                                        color: "inherit",
                                                        className: "w-full justify-start p-0 px-8 py-1 font-sans capitalize text-third",
                                                        children: item.name
                                                    })
                                                })
                                            }, index))
                                    })
                                })
                            ]
                        })
                    ]
                })
            })
        ]
    });
};

// EXTERNAL MODULE: ./src/styles/index.scss
var styles = __webpack_require__(7195);
;// CONCATENATED MODULE: external "next-seo"
const external_next_seo_namespaceObject = require("next-seo");
;// CONCATENATED MODULE: external "next/head"
const head_namespaceObject = require("next/head");
var head_default = /*#__PURE__*/__webpack_require__.n(head_namespaceObject);
;// CONCATENATED MODULE: ./src/pages/_app.tsx








const theme = (0,material_.createTheme)({
    palette: {
        background: {
            default: "#FFF3D1"
        }
    }
});
function MyApp({ Component , pageProps  }) {
    return /*#__PURE__*/ (0,jsx_runtime.jsxs)(jsx_runtime.Fragment, {
        children: [
            jsx_runtime.jsx((style_default()), {
                id: "234c9b3bcdd0e02a",
                dynamic: [
                    (_app_tsx_import_Poppins_arguments_weight_100_200_300_400_500_600_700_800_900_subsets_latin_variableName_poppins_default()).style.fontFamily
                ],
                children: `:root{--font-poppins:${(_app_tsx_import_Poppins_arguments_weight_100_200_300_400_500_600_700_800_900_subsets_latin_variableName_poppins_default()).style.fontFamily}}`
            }),
            /*#__PURE__*/ (0,jsx_runtime.jsxs)((head_default()), {
                children: [
                    /*#__PURE__*/ jsx_runtime.jsx("meta", {
                        charSet: "utf-8",
                        className: style_default().dynamic([
                            [
                                "234c9b3bcdd0e02a",
                                [
                                    (_app_tsx_import_Poppins_arguments_weight_100_200_300_400_500_600_700_800_900_subsets_latin_variableName_poppins_default()).style.fontFamily
                                ]
                            ]
                        ])
                    }),
                    /*#__PURE__*/ jsx_runtime.jsx("meta", {
                        httpEquiv: "X-UA-Compatible",
                        content: "IE=edge",
                        className: style_default().dynamic([
                            [
                                "234c9b3bcdd0e02a",
                                [
                                    (_app_tsx_import_Poppins_arguments_weight_100_200_300_400_500_600_700_800_900_subsets_latin_variableName_poppins_default()).style.fontFamily
                                ]
                            ]
                        ])
                    }),
                    /*#__PURE__*/ jsx_runtime.jsx("meta", {
                        name: "viewport",
                        content: "width=device-width,initial-scale=1,minimum-scale=1,maximum-scale=1,user-scalable=no",
                        className: style_default().dynamic([
                            [
                                "234c9b3bcdd0e02a",
                                [
                                    (_app_tsx_import_Poppins_arguments_weight_100_200_300_400_500_600_700_800_900_subsets_latin_variableName_poppins_default()).style.fontFamily
                                ]
                            ]
                        ])
                    }),
                    /*#__PURE__*/ jsx_runtime.jsx("meta", {
                        name: "theme-color",
                        content: "#FFF3D1",
                        className: style_default().dynamic([
                            [
                                "234c9b3bcdd0e02a",
                                [
                                    (_app_tsx_import_Poppins_arguments_weight_100_200_300_400_500_600_700_800_900_subsets_latin_variableName_poppins_default()).style.fontFamily
                                ]
                            ]
                        ])
                    }),
                    /*#__PURE__*/ jsx_runtime.jsx("link", {
                        rel: "manifest",
                        href: "/manifest.webmanifest",
                        className: style_default().dynamic([
                            [
                                "234c9b3bcdd0e02a",
                                [
                                    (_app_tsx_import_Poppins_arguments_weight_100_200_300_400_500_600_700_800_900_subsets_latin_variableName_poppins_default()).style.fontFamily
                                ]
                            ]
                        ])
                    })
                ]
            }),
            /*#__PURE__*/ jsx_runtime.jsx(external_next_seo_namespaceObject.DefaultSeo, {
                title: "Rawon - A simple powerful Discord music bot built to fulfill your production desires.",
                description: "A simple powerful Discord music bot built to fulfill your production desires. Easy to use, with no coding required.",
                additionalLinkTags: [
                    {
                        rel: "icon",
                        type: "image/png",
                        href: "/icons/icon-512x512.png",
                        sizes: "16x16"
                    }
                ],
                openGraph: {
                    type: "website",
                    url: "rawon.clytage.org",
                    title: "Rawon",
                    siteName: "rawon.clytage.og",
                    description: "A simple powerful Discord music bot built to fulfill your production desires. Easy to use, with no coding required.",
                    images: [
                        {
                            url: "/icons/icon-512x512.png",
                            width: 512,
                            height: 512,
                            alt: "Rawon Logo"
                        }
                    ]
                },
                additionalMetaTags: [
                    {
                        name: "keywords",
                        content: "discord, bot"
                    },
                    {
                        name: "robots",
                        content: "index, follow"
                    },
                    {
                        name: "author",
                        content: "Clytage"
                    }
                ]
            }),
            /*#__PURE__*/ (0,jsx_runtime.jsxs)(material_.ThemeProvider, {
                theme: theme,
                children: [
                    /*#__PURE__*/ jsx_runtime.jsx(material_.CssBaseline, {}),
                    /*#__PURE__*/ jsx_runtime.jsx(NavigationBar, {}),
                    /*#__PURE__*/ jsx_runtime.jsx(Component, {
                        ...pageProps,
                        className: style_default().dynamic([
                            [
                                "234c9b3bcdd0e02a",
                                [
                                    (_app_tsx_import_Poppins_arguments_weight_100_200_300_400_500_600_700_800_900_subsets_latin_variableName_poppins_default()).style.fontFamily
                                ]
                            ]
                        ]) + " " + (pageProps && pageProps.className != null && pageProps.className || "")
                    })
                ]
            })
        ]
    });
}

;// CONCATENATED MODULE: ./node_modules/next/dist/build/webpack/loaders/next-route-loader.js?page=%2F_app&absolutePagePath=private-next-pages%2F_app.tsx&preferredRegion=!

        // Next.js Route Loader
        
        
    

/***/ }),

/***/ 7195:
/***/ (() => {



/***/ }),

/***/ 7892:
/***/ ((module) => {

"use strict";
module.exports = require("@mui/icons-material/ExpandLessRounded");

/***/ }),

/***/ 4666:
/***/ ((module) => {

"use strict";
module.exports = require("@mui/icons-material/ExpandMoreRounded");

/***/ }),

/***/ 5692:
/***/ ((module) => {

"use strict";
module.exports = require("@mui/material");

/***/ }),

/***/ 3918:
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/shared/lib/amp-context.js");

/***/ }),

/***/ 5732:
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/shared/lib/amp-mode.js");

/***/ }),

/***/ 3280:
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/shared/lib/app-router-context.js");

/***/ }),

/***/ 2796:
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/shared/lib/head-manager-context.js");

/***/ }),

/***/ 4486:
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/shared/lib/image-blur-svg.js");

/***/ }),

/***/ 744:
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/shared/lib/image-config-context.js");

/***/ }),

/***/ 5843:
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/shared/lib/image-config.js");

/***/ }),

/***/ 9552:
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/shared/lib/image-loader");

/***/ }),

/***/ 4964:
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/shared/lib/router-context.js");

/***/ }),

/***/ 1751:
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/shared/lib/router/utils/add-path-prefix.js");

/***/ }),

/***/ 3938:
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/shared/lib/router/utils/format-url.js");

/***/ }),

/***/ 1109:
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/shared/lib/router/utils/is-local-url.js");

/***/ }),

/***/ 8854:
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/shared/lib/router/utils/parse-path.js");

/***/ }),

/***/ 3297:
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/shared/lib/router/utils/remove-trailing-slash.js");

/***/ }),

/***/ 7782:
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/shared/lib/router/utils/resolve-href.js");

/***/ }),

/***/ 2470:
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/shared/lib/side-effect.js");

/***/ }),

/***/ 9232:
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/shared/lib/utils.js");

/***/ }),

/***/ 618:
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/shared/lib/utils/warn-once.js");

/***/ }),

/***/ 6689:
/***/ ((module) => {

"use strict";
module.exports = require("react");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, [893,664,636,675], () => (__webpack_exec__(5358)));
module.exports = __webpack_exports__;

})();