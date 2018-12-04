const path = require("path")

module.exports = {
    entry: "./src/main",

    output: {
        path: path.join(__dirname, "public"),
        filename: "[name].bundle.js",
        chunkFilename: "[name].chunk.js"
    },

    resolve: {
        extensions: [".js", ".ts", ".tsx"]
    },

    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: ["ts-loader"]
            }
        ]
    },

    mode: "development",

    devServer: {
        contentBase: path.join(__dirname, "public"),
        compress: true,
        disableHostCheck: true,
        host: "0.0.0.0",
        port: 9000
    },

    devtool: "inline-source-map"
}
