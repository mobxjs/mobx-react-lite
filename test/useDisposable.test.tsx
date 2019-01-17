import { observable, reaction } from "mobx"
import * as React from "react"
import { cleanup, render } from "react-testing-library"

import { observer, useDisposable } from "../src"

afterEach(cleanup)

test("reactions run and dispose properly", async () => {
    let reactions1Created = 0
    let reactions2Created = 0
    let reactions1 = 0
    let reactions2 = 0
    let renders = 0
    let reaction1DisposerCalls = 0
    let reaction2DisposerCalls = 0

    const store = observable({
        prop1: 0,
        prop2: 0
    })

    let firstReaction!: () => void

    const Component = observer((props: { store: typeof store; a?: number }) => {
        firstReaction = useDisposable(
            () => {
                reactions1Created++
                const disposer = reaction(
                    () => props.store.prop1,
                    () => {
                        reactions1++
                    }
                )

                return () => {
                    reaction1DisposerCalls++
                    disposer()
                }
            },
            [props.a]
        )

        useDisposable(
            () => {
                reactions2Created++
                const disposer = reaction(
                    () => props.store.prop2,
                    () => {
                        reactions2++
                    }
                )

                return () => {
                    reaction2DisposerCalls++
                    disposer()
                }
            },
            [props.a]
        )

        renders++
        return (
            <div>
                {props.store.prop1} {props.store.prop2} {props.a}
            </div>
        )
    })

    const { rerender, unmount } = render(<Component store={store} />)
    expect(reaction1DisposerCalls).toBe(0)
    expect(reaction2DisposerCalls).toBe(0)
    expect(renders).toBe(1)
    expect(reactions1).toBe(0)
    expect(reactions2).toBe(0)
    expect(reactions1Created).toBe(1)
    expect(reactions2Created).toBe(1)

    store.prop1 = 1
    rerender(<Component store={store} />)
    expect(reaction1DisposerCalls).toBe(0)
    expect(reaction2DisposerCalls).toBe(0)
    expect(renders).toBe(2)
    expect(reactions1).toBe(1)
    expect(reactions2).toBe(0)
    expect(reactions1Created).toBe(1)
    expect(reactions2Created).toBe(1)

    store.prop2 = 1
    rerender(<Component store={store} />)
    expect(reaction1DisposerCalls).toBe(0)
    expect(reaction2DisposerCalls).toBe(0)
    expect(renders).toBe(3)
    expect(reactions1).toBe(1)
    expect(reactions2).toBe(1)
    expect(reactions1Created).toBe(1)
    expect(reactions2Created).toBe(1)

    // early dispose one of them, it shouldn't be re-created when one of the dependent inputs change
    firstReaction()
    expect(reaction1DisposerCalls).toBe(1) // early disposal
    expect(reaction2DisposerCalls).toBe(0) // this one is not early disposed

    rerender(<Component store={store} a={1} />)
    expect(reaction1DisposerCalls).toBe(1) // depends on a, but was early disposed, so it should not increment
    expect(reaction2DisposerCalls).toBe(1) // depends on a, so it gets re-created
    expect(renders).toBe(4)
    expect(reactions1).toBe(1)
    expect(reactions2).toBe(1)
    expect(reactions1Created).toBe(1)
    expect(reactions2Created).toBe(2)

    unmount()
    expect(reaction1DisposerCalls).toBe(1)
    expect(reaction2DisposerCalls).toBe(2)
    expect(renders).toBe(4)
    expect(reactions1).toBe(1)
    expect(reactions2).toBe(1)
    expect(reactions1Created).toBe(1)
    expect(reactions2Created).toBe(2)
})

test("disposer needs to be a function", async () => {
    let renders = 0

    const Component = observer(() => {
        useDisposable(() => {
            return undefined as any
        })

        useDisposable(() => {
            return "I am not a disposer" as any
        })

        renders++
        return <div>test</div>
    })

    const { unmount } = render(<Component />)
    expect(renders).toBe(1)

    unmount()
    expect(renders).toBe(1)
})
