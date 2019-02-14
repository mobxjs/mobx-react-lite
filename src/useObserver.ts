import { Reaction, getDependencyTree, IDependencyTree } from "mobx"
import { useRef, useDebugValue } from "react"
import { isUsingStaticRendering } from "./staticRendering"
import { useForceUpdate, useUnmount } from "./utils"

export function useObserver<T>(fn: () => T, baseComponentName = "observed"): T {
    if (isUsingStaticRendering()) {
        return fn()
    }
    const forceUpdate = useForceUpdate()

    const reaction = useRef<Reaction | null>(null)
    if (!reaction.current) {
        reaction.current = new Reaction(`observer(${baseComponentName})`, () => {
            forceUpdate()
        })
    }

    useDebugValue(reaction, printDebugValue)

    useUnmount(() => {
        reaction.current!.dispose()
    })

    // render the original component, but have the
    // reaction track the observables, so that rendering
    // can be invalidated (see above) once a dependency changes
    let rendering!: T
    reaction.current.track(() => {
        rendering = fn()
    })
    return rendering
}

function printDebugValue(v: React.MutableRefObject<Reaction | null>) {
    if (!v.current) return "<unknown>"
    // not the nicest representation, and we would rather have an expandable object
    // hopefully that is added later to the devtools..
    const lines: string[] = []
    printDepTree(getDependencyTree(v.current), lines, 0)
    return lines.join("   ")
}

// from observable.ts in MobX
function printDepTree(tree: IDependencyTree, lines: string[], depth: number) {
    if (lines.length >= 1000) {
        lines.push("(and many more)")
        return
    }
    lines.push(`${new Array(depth).join("\t")}${tree.name}`)
    if (tree.dependencies) tree.dependencies.forEach(child => printDepTree(child, lines, depth + 1))
}
