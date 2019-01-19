export function productionMode(fn: () => void) {
    const oldNodeEnv = process.env.NODE_ENV
    process.env.NODE_ENV = "production"

    try {
        fn()
    } finally {
        process.env.NODE_ENV = oldNodeEnv
    }
}
