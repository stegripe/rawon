const WithPWA = require("next-pwa");

module.exports = WithPWA({
    dest: "public",
    register: true,
    skipWaiting: true
})({
    reactStrictMode: true,
    swcMinify: true,
    modularizeImports: {
        "@mui/icons-material/?(((\\w*)?/?)*)": {
            transform: "@mui/icons-material/{{ matches.[1] }}/{{member}}"
        }
    },
    redirects: async () => [
        {
            source: "/discord",
            destination: "https://clytage.org/discord",
            permanent: true
        },
        {
            source: "/github",
            destination: "https://github.com/clytage/rawon",
            permanent: true
        },
        {
            source: "/clytage",
            destination: "https://clytage.org",
            permanent: true
        }
    ]
});
