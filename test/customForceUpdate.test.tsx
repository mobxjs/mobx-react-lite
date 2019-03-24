import mockConsole from "jest-mock-console"
import { observable, runInAction } from "mobx"
import * as React from "react"
import { useCallback, useState } from "react"
import { cleanup, render } from "react-testing-library"
import { useForceUpdate, useObserver } from "../src"

afterEach(cleanup)

describe("is used to make calls to force update skip re-renderings on demand", () => {
    it("can be used to skip updates", () => {
        let skippingForceUpdate = 0

        function useSkipForceUpdate<T>(fn: () => T): T {
            skippingForceUpdate++
            try {
                return fn()
            } finally {
                skippingForceUpdate--
            }
        }

        function useCustomForceUpdate() {
            const update = useForceUpdate()

            return useCallback(() => {
                if (skippingForceUpdate === 0) {
                    update()
                }
            }, [])
        }

        let renderCount = 0

        function useObservableProps(props: { x: number }) {
            const [obs] = useState(() =>
                observable({
                    x: props.x
                })
            )

            useSkipForceUpdate(() => {
                runInAction(() => {
                    obs.x = props.x
                })
            })

            return obs
        }

        const TestComponent = (props: { x: number }) => {
            const obs = useObservableProps(props)

            renderCount++

            return useObserver(() => <div>{obs.x}</div>, undefined, useCustomForceUpdate)
        }

        const { container, rerender } = render(<TestComponent x={1} />)
        const div = container.querySelector("div")!
        // the first time it will be 1 since the reaction is not yet set
        expect(div.textContent).toBe("1")
        expect(renderCount).toBe(1)

        rerender(<TestComponent x={2} />)
        // 2 since we skipped the force update that would have made it re-render more times
        expect(div.textContent).toBe("2")
        expect(renderCount).toBe(2)
    })

    it("does over-rerender when an observable changes inside the component when it is not used", () => {
        let renderCount = 0

        function useObservableProps(props: { x: number }) {
            const [obs] = useState(() =>
                observable({
                    x: props.x
                })
            )

            runInAction(() => {
                obs.x = props.x
            })

            return obs
        }

        const TestComponent = (props: { x: number }) => {
            const obs = useObservableProps(props)

            renderCount++

            return useObserver(() => <div>{obs.x}</div>)
        }

        const { container, rerender } = render(<TestComponent x={1} />)
        const div = container.querySelector("div")!
        // the first time it will be 1 since the reaction is not yet set
        expect(div.textContent).toBe("1")
        expect(renderCount).toBe(1)

        rerender(<TestComponent x={2} />)
        // now that the reaction is set it will re-render until it stabilizes
        expect(div.textContent).toBe("2")
        expect(renderCount).toBe(3)
    })

    it("should not be possible to switch custom force update hooks on the fly", () => {
        function useCustomForceUpdate() {
            return useForceUpdate()
        }

        const TestComponent = (props: { custom: boolean }) => {
            return useObserver(
                () => <div />,
                undefined,
                props.custom ? useCustomForceUpdate : useForceUpdate
            )
        }

        const { rerender } = render(<TestComponent custom={false} />)
        const restoreConsole = mockConsole()
        try {
            expect(() => {
                rerender(<TestComponent custom={true} />)
            }).toThrow("a custom force update hook cannot be switched to another one once used")
        } finally {
            restoreConsole()
        }
    })
})
