import { observable } from "mobx"
import * as React from "react"
import { act, cleanup, render } from "@testing-library/react"
import { IUseObserverOptions, useForceUpdate, useObserver } from "../src"

afterEach(cleanup)

it("a custom force update method can be used", () => {
    let x = 0

    function useCustomForceUpdate() {
        const update = useForceUpdate()
        return () => {
            x++
            update()
        }
    }
    const opts: IUseObserverOptions = {
        useForceUpdate: useCustomForceUpdate
    }

    const obs = observable.box(0)

    const TestComponent = () => {
        return useObserver(() => <div>{obs.get()}</div>, undefined, opts)
    }

    render(<TestComponent />)
    expect(x).toBe(0)
    act(() => {
        obs.set(1) // the custom force update should be called here
    })
    expect(x).toBe(1)
})
