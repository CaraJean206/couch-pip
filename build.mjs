// Bundles src/index.tsx into dist/index.js the way @decky/rollup does:
// React, react-dom and @decky/ui come from globals that Decky Loader
// provides inside Steam, everything else is bundled.
//
//   node build.mjs            (needs esbuild and react-icons resolvable)
//
// If you have the normal toolchain, `pnpm i && pnpm build` with
// @decky/rollup works too.
import { build } from "esbuild";
import { readFileSync } from "fs";

const { version } = JSON.parse(readFileSync("package.json", "utf8"));

const globals = {
    react: "SP_REACT",
    "react-dom": "SP_REACTDOM",
    "react/jsx-runtime": "SP_JSX",
    "@decky/ui": "DFL",
};

const deckyGlobals = {
    name: "decky-globals",
    setup(b) {
        const filter = new RegExp(`^(${Object.keys(globals).map((k) => k.replace(/[/@.-]/g, "\\$&")).join("|")})$`);
        b.onResolve({ filter }, (args) => ({ path: args.path, namespace: "decky-global" }));
        b.onLoad({ filter: /.*/, namespace: "decky-global" }, (args) => ({
            contents: `module.exports = window.${globals[args.path]};`,
            loader: "js",
        }));
    },
};

await build({
    entryPoints: ["src/index.tsx"],
    outfile: "dist/index.js",
    bundle: true,
    format: "esm",
    target: "chrome109",
    jsx: "automatic",
    minify: false,
    sourcemap: false,
    legalComments: "none",
    nodePaths: (process.env.NODE_PATH || "").split(":").filter(Boolean),
    plugins: [deckyGlobals],
    define: { "process.env.NODE_ENV": '"production"', __VERSION__: JSON.stringify(version) },
    logLevel: "info",
});
