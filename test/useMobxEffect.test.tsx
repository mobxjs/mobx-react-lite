import { reaction } from "mobx"
import * as React from "react"
import { observer, useMobxEffect, useObservableProps } from "../src"
import { asyncReactDOMRender, createTestRoot } from "./index"

const testRoot = createTestRoot()

test("useMobxEffect", async () => {
    let reactions1 = 0
    let reactions2 = 0
    let renders = 0

    const Component = observer((nonObsProps: { prop1?: number; prop2?: number }) => {
        const props = useObservableProps(nonObsProps, "shallow")

        useMobxEffect(() =>
            reaction(
                () => props.prop1,
                () => {
                    reactions1++
                }
            )
        )

        useMobxEffect(() =>
            reaction(
                () => props.prop2,
                () => {
                    reactions2++
                }
            )
        )

        renders++
        return null
    })

    await asyncReactDOMRender(<Component />, testRoot)
    expect(renders).toBe(1)
    expect(reactions1).toBe(0)
    expect(reactions2).toBe(0)

    await asyncReactDOMRender(<Component prop1={1} />, testRoot)
    expect(renders).toBe(2)
    expect(reactions1).toBe(1)
    expect(reactions2).toBe(0)

    await asyncReactDOMRender(<Component prop2={1} />, testRoot)
    expect(renders).toBe(3)
    expect(reactions1).toBe(2)
    expect(reactions2).toBe(1)
})
