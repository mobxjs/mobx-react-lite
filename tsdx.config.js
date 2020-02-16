module.exports = {
    rollup(config, options) {
        return {
            ...config,
            output: {
                ...config.output,
                globals: {
                    react: "React",
                    mobx: "mobx"
                }
            }
        }
    }
}
