import mockConsole from "jest-mock-console"
import * as mobx from "mobx"
import * as React from "react"
import { act, cleanup, render } from "react-testing-library"

import ReactDOM from "react-dom"
import { useObserver } from "../src"
import { resetCleanupScheduleForTests } from "../src/useObserver"

afterEach(cleanup)

test("uncommitted observing components should not attempt state changes", () => {
    const store = mobx.observable({ count: 0 })

    const TestComponent = () => useObserver(() => <div>{store.count}</div>)

    // Render our observing component wrapped in StrictMode
    const rendering = render(
        <React.StrictMode>
            <TestComponent />
        </React.StrictMode>
    )

    // That will have caused our component to have been rendered
    // more than once, but when we unmount it'll only unmount once.
    rendering.unmount()

    // Trigger a change to the observable. If the reactions were
    // not disposed correctly, we'll see some console errors from
    // React StrictMode because we're calling state mutators to
    // trigger an update.
    const restoreConsole = mockConsole()
    try {
        act(() => {
            store.count++
        })

        // Check to see if any console errors were reported.
        // tslint:disable-next-line: no-console
        expect(console.error).not.toHaveBeenCalled()
    } finally {
        restoreConsole()
    }
})

test("observable changes before first commit are not lost", () => {
    const store = mobx.observable({ value: "initial" })

    const TestComponent = () => useObserver(() => <div>{store.value}</div>)

    // Render our observing component wrapped in StrictMode, but using
    // raw ReactDOM.render (not react-testing-library render) because we
    // don't want the useEffect calls to have run just yet...
    const rootNode = document.createElement("div")
    ReactDOM.render(
        <React.StrictMode>
            <TestComponent />
        </React.StrictMode>,
        rootNode
    )

    // Change our observable. This is happening between the initial render of
    // our component and its initial commit, so it isn't fully mounted yet.
    // We want to ensure that the change isn't lost.
    store.value = "changed"

    act(() => {
        // no-op
    })

    expect(rootNode.textContent).toBe("changed")
})

test("uncommitted components should not leak observations", async () => {
    resetCleanupScheduleForTests()

    jest.useFakeTimers()

    const store = mobx.observable({ count1: 0, count2: 0 })

    // Track whether counts are observed
    let count1IsObserved = false
    let count2IsObserved = false
    mobx.onBecomeObserved(store, "count1", () => (count1IsObserved = true))
    mobx.onBecomeUnobserved(store, "count1", () => (count1IsObserved = false))
    mobx.onBecomeObserved(store, "count2", () => (count2IsObserved = true))
    mobx.onBecomeUnobserved(store, "count2", () => (count2IsObserved = false))

    const TestComponent1 = () => useObserver(() => <div>{store.count1}</div>)
    const TestComponent2 = () => useObserver(() => <div>{store.count2}</div>)

    // Render, then remove only #2
    const rendering = render(
        <React.StrictMode>
            <TestComponent1 />
            <TestComponent2 />
        </React.StrictMode>
    )
    rendering.rerender(
        <React.StrictMode>
            <TestComponent1 />
        </React.StrictMode>
    )

    // Allow any reaction-disposal cleanup timers to run
    jest.runAllTimers()

    // count1 should still be being observed by Component1,
    // but count2 should have had its reaction cleaned up.
    expect(count1IsObserved).toBeTruthy()
    expect(count2IsObserved).toBeFalsy()
})
