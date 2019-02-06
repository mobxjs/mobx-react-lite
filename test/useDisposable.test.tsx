import mockConsole from "jest-mock-console"
import { observable, reaction } from "mobx"
import * as React from "react"
import { cleanup, render } from "react-testing-library"

import { observer, useDisposable } from "../src"
import { productionMode } from "./utils"

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
    expect(reactions1Created).toBe(1)
    expect(reaction1DisposerCalls).toBe(0)
    expect(reactions2Created).toBe(1)
    expect(reaction2DisposerCalls).toBe(0)
    expect(renders).toBe(1)
    expect(reactions1).toBe(0)
    expect(reactions2).toBe(0)

    store.prop1 = 1
    rerender(<Component store={store} />)
    expect(reactions1Created).toBe(1)
    expect(reaction1DisposerCalls).toBe(0)
    expect(reactions2Created).toBe(1)
    expect(reaction2DisposerCalls).toBe(0)
    expect(renders).toBe(2)
    expect(reactions1).toBe(1)
    expect(reactions2).toBe(0)

    store.prop2 = 1
    rerender(<Component store={store} />)
    expect(reactions1Created).toBe(1)
    expect(reaction1DisposerCalls).toBe(0)
    expect(reactions2Created).toBe(1)
    expect(reaction2DisposerCalls).toBe(0)
    expect(renders).toBe(3)
    expect(reactions1).toBe(1)
    expect(reactions2).toBe(1)

    // early dispose one of them, it shouldn't be re-created when one of the dependent inputs change
    firstReaction()
    expect(reactions1Created).toBe(1)
    expect(reaction1DisposerCalls).toBe(1) // early disposal
    expect(reactions2Created).toBe(1)
    expect(reaction2DisposerCalls).toBe(0) // this one is not early disposed

    rerender(<Component store={store} a={1} />)
    expect(reactions1Created).toBe(1) // depends on a, but was early disposed, so it should not increment
    expect(reaction1DisposerCalls).toBe(1)
    expect(reactions2Created).toBe(2) // depends on a, so it gets re-created
    expect(reaction2DisposerCalls).toBe(1)
    expect(renders).toBe(4)
    expect(reactions1).toBe(1)
    expect(reactions2).toBe(1)

    unmount()
    expect(reactions1Created).toBe(1)
    expect(reaction1DisposerCalls).toBe(1)
    expect(reactions2Created).toBe(2)
    expect(reaction2DisposerCalls).toBe(2)
    expect(renders).toBe(4)
    expect(reactions1).toBe(1)
    expect(reactions2).toBe(1)
})

test("disposer needs to be a function or else throws/console.error", async () => {
    const error = "generated disposer must be a function"

    const Component1 = observer(() => {
        useDisposable(() => {
            return undefined as any
        })
        return <div>test</div>
    })

    const Component2 = observer(() => {
        useDisposable(() => {
            return "string" as any
        })
        return <div>test</div>
    })

    const restoreConsole = mockConsole()
    // tslint:disable-next-line:no-console
    const mockConsoleError = console.error as jest.Mock<{}>

    expect(() => {
        render(<Component1 />)
    }).toThrow(error)

    expect(() => {
        render(<Component2 />)
    }).toThrow(error)

    productionMode(() => {
        mockConsoleError.mockClear()
        render(<Component1 />)
        expect(mockConsoleError.mock.calls[0][0].message).toEqual(error)

        mockConsoleError.mockClear()
        render(<Component2 />)
        expect(mockConsoleError.mock.calls[0][0].message).toEqual(error)
    })
    restoreConsole()
})
