import { IReactionDisposer, observable, reaction } from "mobx"
import * as React from "react"
import { cleanup, render } from "react-testing-library"
import { observer, useObservableEffect } from "../src"

afterEach(cleanup)

test("useObservableEffect", async () => {
    let reactions1 = 0
    let reactions2 = 0
    let renders = 0
    let reactionDisposerCalls = 0

    const store = observable({
        prop1: 0,
        prop2: 0
    })

    const Component = observer((props: { store: typeof store }) => {
        useObservableEffect(() => {
            const disposer = reaction(
                () => props.store.prop1,
                () => {
                    reactions1++
                }
            )

            return (() => {
                reactionDisposerCalls++
                disposer()
            }) as IReactionDisposer
        })

        useObservableEffect(() => {
            const disposer = reaction(
                () => props.store.prop2,
                () => {
                    reactions2++
                }
            )

            return (() => {
                reactionDisposerCalls++
                disposer()
            }) as IReactionDisposer
        })

        renders++
        return (
            <div>
                `${props.store.prop1} ${props.store.prop2}`
            </div>
        )
    })

    const { rerender } = render(<Component store={store} />)
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

    rerender(<div />)
    expect(reactionDisposerCalls).toBe(2)
    expect(renders).toBe(3)
    expect(reactions1).toBe(1)
    expect(reactions2).toBe(1)
})
