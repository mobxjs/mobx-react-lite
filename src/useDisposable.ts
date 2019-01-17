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
    const disposerRef = useRef<D | undefined>(undefined)
    const earlyDisposedRef = useRef(false)

    // we need to use layout effect since disposals need to be run synchronously
    useLayoutEffect(() => {
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
                throw new Error("generated disposer must be a function")
            }
            disposerRef.current = newDisposer
        }
        return () => {
            if (disposerRef.current) {
                disposerRef.current()
                disposerRef.current = undefined
            }
            if (earlyDisposal) {
                earlyDisposedRef.current = true
            }
        }
    }

    return lazyCreateDisposer(true) as D
}
