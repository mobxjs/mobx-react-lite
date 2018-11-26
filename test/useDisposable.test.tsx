import { observable, reaction } from "mobx"
import * as React from "react"
import { cleanup, render } from "react-testing-library"

import { observer, useDisposable } from "../src"

afterEach(cleanup)

test("reactions run and dispose properly", async () => {
    let reactions1 = 0
    let reactions2 = 0
    let renders = 0
    let reactionDisposerCalls = 0

    const store = observable({
        prop1: 0,
        prop2: 0
    })

    const Component = observer((props: { store: typeof store }) => {
        useDisposable(() => {
            const disposer = reaction(
                () => props.store.prop1,
                () => {
                    reactions1++
                }
            )

            return () => {
                reactionDisposerCalls++
                disposer()
            }
        })

        useDisposable(() => {
            const disposer = reaction(
                () => props.store.prop2,
                () => {
                    reactions2++
                }
            )

            return () => {
                reactionDisposerCalls++
                disposer()
            }
        })

        renders++
        return (
            <div>
                {props.store.prop1} {props.store.prop2}
            </div>
        )
    })

    const { rerender, unmount } = render(<Component store={store} />)
    expect(reactionDisposerCalls).toBe(0)
    expect(renders).toBe(1)
    expect(reactions1).toBe(0)
    expect(reactions2).toBe(0)

    store.prop1 = 1
    rerender(<Component store={store} />)
    expect(reactionDisposerCalls).toBe(0)
    expect(renders).toBe(2)
    expect(reactions1).toBe(1)
    expect(reactions2).toBe(0)

    store.prop2 = 1
    rerender(<Component store={store} />)
    expect(reactionDisposerCalls).toBe(0)
    expect(renders).toBe(3)
    expect(reactions1).toBe(1)
    expect(reactions2).toBe(1)

    unmount()
    expect(reactionDisposerCalls).toBe(2)
    expect(renders).toBe(3)
    expect(reactions1).toBe(1)
    expect(reactions2).toBe(1)
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
