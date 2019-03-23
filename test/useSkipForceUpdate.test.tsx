import { observable, runInAction } from "mobx"
import * as React from "react"
import { useState } from "react"
import { cleanup, render } from "react-testing-library"
import { useObserver, useSkipForceUpdate } from "../src"

afterEach(cleanup)

describe("is used to make calls to force update skip re-renderings on demand", () => {
    it("does not over-rerender when an observable changes inside the component", () => {
        let renderCount = 0

        const TestComponent = () => {
            const [obs] = useState(() =>
                observable({
                    x: 0
                })
            )

            useSkipForceUpdate(() => {
                runInAction(() => {
                    if (obs.x < 2) {
                        obs.x++ // this should not queue another future update
                    }
                })
            })

            renderCount++

            return useObserver(() => <div>{obs.x}</div>)
        }

        const { container, rerender } = render(<TestComponent />)
        const div = container.querySelector("div")!
        // the first time it will be 1 since the reaction is not yet set
        expect(div.textContent).toBe("1")
        expect(renderCount).toBe(1)

        rerender(<TestComponent />)
        // 2 since we skipped the force update that would have made it re-render more times
        expect(div.textContent).toBe("2")
        expect(renderCount).toBe(2)
    })

    it("does over-rerender when an observable changes inside the component and it is not used", () => {
        let renderCount = 0

        const TestComponent = () => {
            const [obs] = useState(() =>
                observable({
                    x: 0
                })
            )

            runInAction(() => {
                if (obs.x < 2) {
                    obs.x++ // this should not queue another future update, but it will
                }
            })

            renderCount++

            return useObserver(() => <div>{obs.x}</div>)
        }

        const { container, rerender } = render(<TestComponent />)
        const div = container.querySelector("div")!
        // the first time it will be 1 since the reaction is not yet set
        expect(div.textContent).toBe("1")
        expect(renderCount).toBe(1)

        rerender(<TestComponent />)
        // now that the reaction is set it will re-render until it stabilizes
        expect(div.textContent).toBe("2")
        expect(renderCount).toBe(3)
    })
})
