{ pkgs }: {
    deps = [
        pkgs.python38
        pkgs.ffmpeg.bin
        pkgs.yarn
        pkgs.esbuild
        pkgs.nodejs-18_x

        pkgs.nodePackages.typescript
        pkgs.nodePackages.typescript-language-server
    ];
}
