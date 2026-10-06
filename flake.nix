{
  description = "Vicinae extension that picks colors from the screen with KDE's color picker";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";

  outputs = { self, nixpkgs }:
    let
      forAllSystems = nixpkgs.lib.genAttrs [ "x86_64-linux" "aarch64-linux" ];
    in
    {
      packages = forAllSystems (system:
        let
          pkgs = nixpkgs.legacyPackages.${system};
        in
        {
          # The derivation name becomes the folder under ~/.local/share/vicinae/extensions
          default = pkgs.buildNpmPackage {
            name = "kde-color-picker";
            src = self;
            npmDeps = pkgs.importNpmLock { npmRoot = self; };
            npmConfigHook = pkgs.importNpmLock.npmConfigHook;
            buildPhase = "npm run build -- --out=$out";
            dontNpmInstall = true;
          };
        });
    };
}
