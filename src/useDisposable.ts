import { useLayoutEffect, useRef } from "react"

type TDisposable = () => void

const doNothingDisposer = () => {
    // empty
}

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
    const disposer = useRef<D | undefined>(undefined)
    const earlyDisposed = useRef(false)

    // we need to use layout effect since disposals need to be run synchronously
    useLayoutEffect(() => {
        return lazyCreateDisposer(false)
    }, inputs)

    const lazyCreateDisposer = (earlyDisposal: boolean) => {
        // ensure that we won't create a new disposer if it was early disposed
        if (earlyDisposed.current) {
            return doNothingDisposer
        }

        if (!disposer.current) {
            disposer.current = disposerGenerator()
        }
        return () => {
            if (typeof disposer.current === "function") {
                disposer.current()
            }
            disposer.current = undefined
            if (earlyDisposal) {
                earlyDisposed.current = true
            }
        }
    }

    return lazyCreateDisposer(true) as D
}
