var path = require("path")
var filesize = require("rollup-plugin-filesize")
var typescript = require("rollup-plugin-typescript2")
var commonjs = require("rollup-plugin-commonjs")
var resolve = require("rollup-plugin-node-resolve")
var terser = require("rollup-plugin-terser").terser
var alias = require("rollup-plugin-alias")
var replace = require("rollup-plugin-replace")

var { rollup } = require("rollup")

var emptyModulePath = path.resolve(__dirname, "empty.js")

function getExternals(target) {
    switch (target) {
        case "browser":
            return ["react", "mobx", "react-dom"]
        case "native":
            return ["react", "mobx", "react-native"]
        case "custom":
            return ["react", "mobx"]
    }
}

function getAliases(target) {
    switch (target) {
        case "browser":
            return { "react-native": emptyModulePath }
        case "native":
            return { "react-dom": emptyModulePath }
        case "custom":
            return { "react-native": emptyModulePath, "react-dom": emptyModulePath }
    }
}

function build(target, mode, filename) {
    var plugins = [
        replace({
            // for depencencies such as react-is
            "process.env.NODE_ENV": JSON.stringify("production")
        }),
        alias({ "react-native": emptyModulePath }),
        typescript({
            tsconfig: "tsconfig.build.json",
            clean: true,
            check: true,
            useTsconfigDeclarationDir: true
        }),
        resolve({
            module: true,
            main: true
        }),
        commonjs()
    ]

    if (mode.endsWith(".min")) {
        plugins.push(terser())
    }

    plugins.push(filesize())

    return rollup({
        input: "src/index.ts",
        external: getExternals(target),
        plugins: plugins
    })
        .then(function(bundle) {
            var options = {
                file: path.resolve(__dirname, "dist", filename),
                format: mode.endsWith(".min") ? mode.slice(0, -".min".length) : mode,
                globals: {
                    react: "React",
                    "react-dom": "ReactDOM",
                    "react-native": "ReactNative",
                    mobx: "mobx"
                },
                name: "mobxReactLite",
                exports: "named"
            }

            return bundle.write(options)
        })
        .catch(function(reason) {
            console.error(reason)
            process.exit(-1)
        })
}

const main = async () => {
    await build("browser", "umd", "index.js")
    await build("browser", "umd.min", "index.min.js")
    await build("browser", "es", "index.module.js")
    await build("native", "cjs", "native.js")
    await build("custom", "umd", "custom.js")
    await build("custom", "es", "custom.module.js")
}

main()
