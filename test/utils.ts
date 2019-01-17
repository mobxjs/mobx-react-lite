export async function withoutConsoleError(fn: () => Promise<void>) {
    // tslint:disable:no-console
    const original = console.error
    console.error = () => {
        // do nothing
    }

    try {
        await fn()
    } finally {
        console.error = original
    }
    // tslint:enable:no-console
}
