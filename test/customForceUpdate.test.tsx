import { observable, runInAction } from "mobx"
import * as React from "react"
import { useCallback, useState } from "react"
import { cleanup, render } from "react-testing-library"
import { useObserver } from "../src"

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
            const [, setTick] = useState(0)

            const update = useCallback(() => {
                if (skippingForceUpdate === 0) {
                    setTick(tick => tick + 1)
                }
            }, [])

            return update
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
})
