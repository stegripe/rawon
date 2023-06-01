const WithPWA = require("next-pwa");

const isProd = process.env.NODE_ENV === "production";

module.exports = WithPWA({
    dest: "public",
    register: true,
    skipWaiting: true
})({
    output: isProd ? "export" : "standalone",
    reactStrictMode: true,
    swcMinify: true,
    modularizeImports: {
        "@mui/icons-material/?(((\\w*)?/?)*)": {
            transform: "@mui/icons-material/{{ matches.[1] }}/{{member}}"
        }
    },
    assetPrefix: isProd ? "https://rawon.clytage.org" : "",
    images: {
        unoptimized: true
    }
});
