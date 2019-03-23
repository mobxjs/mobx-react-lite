import { observable, runInAction } from "mobx"
import * as React from "react"
import { useState } from "react"
import { cleanup, render } from "react-testing-library"
import { useObserver, useSkipForceUpdate } from "../src"

afterEach(cleanup)

describe("is used to make calls to force update skip re-renderings on demand", () => {
    it("does not over-rerender when an observable changes inside the component", () => {
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

            return useObserver(() => <div>{obs.x}</div>)
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

    it("does over-rerender when an observable changes inside the component and it is not used", () => {
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
