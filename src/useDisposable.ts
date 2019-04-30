import { useEffect, useRef } from "react"

type TDisposable = () => void

const doNothingDisposer = () => {
    // empty
}

let warned = false

/**
 * Adds an observable effect (reaction, autorun, or anything else that returns a disposer) that will be registered upon component creation and disposed upon unmounting.
 * Returns the generated disposer for early disposal.
 *
 * @export
 * @template D
 * @param {() => D} disposerGenerator A function that returns the disposer of the wanted effect.
 * @param {ReadonlyArray<any>} [inputs=[]] If you want the effect to be automatically re-created when some variable(s) are changed then pass them in this array.
 * @returns {D}
 */
export function useDisposable<D extends TDisposable>(
    disposerGenerator: () => D,
    inputs: ReadonlyArray<any> = []
): D {
    if (process.env.NODE_ENV !== "production" && !warned) {
        warned = true
        // tslint:disable-next-line: no-console
        console.warn(
            "[mobx-react-lite] useDisposable has been deprecated. Use React.useEffect instead."
        )
    }
    const disposerRef = useRef<D | null>(null)
    const earlyDisposedRef = useRef(false)

    useEffect(() => {
        return lazyCreateDisposer(false)
    }, inputs)

    function lazyCreateDisposer(earlyDisposal: boolean) {
        // ensure that we won't create a new disposer if it was early disposed
        if (earlyDisposedRef.current) {
            return doNothingDisposer
        }

        if (!disposerRef.current) {
            const newDisposer = disposerGenerator()

            if (typeof newDisposer !== "function") {
                const error = new Error("generated disposer must be a function")
                if (process.env.NODE_ENV !== "production") {
                    throw error
                } else {
                    // tslint:disable-next-line:no-console
                    console.error(error)
                    return doNothingDisposer
                }
            }

            disposerRef.current = newDisposer
        }
        return () => {
            if (disposerRef.current) {
                disposerRef.current()
                disposerRef.current = null
            }
            if (earlyDisposal) {
                earlyDisposedRef.current = true
            }
        }
    }

    return lazyCreateDisposer(true) as D
}
