import * as mobx from "mobx"
import * as React from "react"
import { observer, useComputed, useObservableProps, UseObservablePropsMode } from "../src"
import { asyncReactDOMRender, createTestRoot } from "./index"

const testRoot = createTestRoot()

function toJson(val: any): string {
    if (val instanceof Map) {
        return JSON.stringify([...val])
    }
    return JSON.stringify(val)
}

const Container = observer((props: any) => {
    return props.renderStore.get()()
})

const renderFnStore = mobx.observable.box<() => React.ReactElement<any> | null>(() => {
    return null
})

function doTest(options: UseObservablePropsMode<any>) {
    describe(`options: ${JSON.stringify(options)}`, async () => {
        const shallow = options === "shallow"

        let computedCalls: string[] = []
        let renders = 0

        beforeEach(() => {
            computedCalls = []
            renders = 0
        })

        function ComponentClass(nonObsProps: any) {
            const props = useObservableProps(nonObsProps, options)

            const computedWithProp1 = useComputed(() => {
                const prop1Value = props.prop1
                computedCalls.push("prop1: " + toJson(prop1Value))
                return prop1Value
            })

            const computedWithProp2 = useComputed(() => {
                const prop2Value = props.prop2
                computedCalls.push("prop2: " + toJson(prop2Value))
                return prop2Value
            })

            const deepComputed = useComputed(() => {
                const prop3Value = props.prop3 && props.prop3.x
                computedCalls.push("prop3.x: " + toJson(prop3Value))
                return prop3Value
            })

            const computedComponent = useComputed(() => {
                const value = props.componentProp
                computedCalls.push("componentProp: " + toJson(!!value))
                return value
            })

            // render
            const p1 = computedWithProp1
            toJson(p1) // just to deeply read it
            const p2 = computedWithProp2
            const deepC = deepComputed
            const str = `${p1} ${p2} ${deepC}`

            renders++
            return computedComponent || props.children || str
        }

        const Component = observer(ComponentClass)

        it("initial state", async () => {
            await asyncReactDOMRender(<Container renderStore={renderFnStore} />, testRoot)
            renderFnStore.set(() => {
                return <Component prop1={1} />
            })
            expect(computedCalls).toEqual([
                "prop1: 1",
                "prop2: undefined",
                "prop3.x: undefined",
                "componentProp: false"
            ])
            expect(renders).toBe(1)
        })

        it("prop1 changed from 1 to 2, prop2 is untouched", async () => {
            renderFnStore.set(() => {
                return <Component prop1={2} />
            })
            expect(computedCalls).toEqual(["prop1: 2"])
            expect(renders).toBe(1)
        })

        it("props untouched, unobserved property added", async () => {
            renderFnStore.set(() => {
                return <Component prop1={2} unused={10} />
            })
            expect(computedCalls).toEqual([])
            expect(renders).toBe(1) // TODO: wish this could be optimized to avoid the unecessary re-render
        })

        it("props untouched, unobserved property removed", async () => {
            renderFnStore.set(() => {
                return <Component prop1={2} />
            })
            expect(computedCalls).toEqual([])
            expect(renders).toBe(1) // TODO: wish this could be optimized to avoid the unecessary re-render
        })

        it("prop1 is untouched, prop2 appears", async () => {
            renderFnStore.set(() => {
                return <Component prop1={2} prop2={1} />
            })
            expect(computedCalls).toEqual(["prop2: 1"])
            expect(renders).toBe(1)
        })

        it("prop1 is untouched, prop2 changes from 1 to 2", async () => {
            renderFnStore.set(() => {
                return <Component prop1={2} prop2={2} />
            })
            expect(computedCalls).toEqual(["prop2: 2"])
            expect(renders).toBe(1)
        })

        it("prop2 is untouched, prop1 changes from 2 to 1", async () => {
            renderFnStore.set(() => {
                return <Component prop1={1} prop2={2} />
            })
            expect(computedCalls).toEqual(["prop1: 1"])
            expect(renders).toBe(1)
        })

        it("nothing changed - no recalc", async () => {
            renderFnStore.set(() => {
                return <Component prop1={1} prop2={2} />
            })
            expect(computedCalls).toEqual([])
            expect(renders).toBe(0) // no re-render needed
        })

        it("prop1 disappear, prop2 is untouched", async () => {
            renderFnStore.set(() => {
                return <Component prop2={2} />
            })
            expect(computedCalls).toEqual(["prop1: undefined"])
            expect(renders).toBe(1)
        })

        it("if we replace prop2 to prop1, both computeds should be recalculated", async () => {
            renderFnStore.set(() => {
                return <Component prop1={2} />
            })
            expect(computedCalls).toEqual(["prop1: 2", "prop2: undefined"])
            expect(renders).toBe(1)
        })

        it("remove prop1 should only recalc prop1", async () => {
            renderFnStore.set(() => {
                return <Component />
            })
            expect(computedCalls).toEqual(["prop1: undefined"])
            expect(renders).toBe(1)
        })

        it("correctly catch prop1 appearing after disappearing", async () => {
            renderFnStore.set(() => {
                return <Component prop1={2} />
            })
            expect(computedCalls).toEqual(["prop1: 2"])
            expect(renders).toBe(1)
        })

        it("swap again - all recalculated", async () => {
            renderFnStore.set(() => {
                return <Component prop2={2} />
            })
            expect(computedCalls).toEqual(["prop1: undefined", "prop2: 2"])
            expect(renders).toBe(1)
        })

        it("remove all", async () => {
            renderFnStore.set(() => {
                return <Component />
            })
            expect(computedCalls).toEqual(["prop2: undefined"])
            expect(renders).toBe(1)
        })

        // already observable objects
        const dp = mobx.observable({})

        it("(obs object) deep prop with empty object", async () => {
            renderFnStore.set(() => {
                return <Component prop3={dp} />
            })
            expect(computedCalls).toEqual(["prop3.x: undefined"])
            expect(renders).toBe(1) // TODO: wish this could be optimized to avoid the unecessary re-render
        })

        it("(obs object) deep prop with value set", async () => {
            mobx.set(dp, "x", 5)
            renderFnStore.set(() => {
                return <Component prop3={dp} />
            })
            expect(computedCalls).toEqual(["prop3.x: 5"])
            expect(renders).toBe(1)
        })

        it("(obs object) deep prop with value removed", async () => {
            mobx.remove(dp, "x")
            renderFnStore.set(() => {
                return <Component prop3={dp} />
            })
            expect(computedCalls).toEqual(["prop3.x: undefined"])
            expect(renders).toBe(1)
        })

        // non observable objects
        it("(new obj) deep prop with empty object", async () => {
            renderFnStore.set(() => {
                return <Component prop3={{}} />
            })
            expect(computedCalls).toEqual(["prop3.x: undefined"])
            expect(renders).toBe(1) // TODO: wish this could be optimized to avoid the unecessary re-render
        })

        it("(new obj) deep prop with value set", async () => {
            renderFnStore.set(() => {
                return <Component prop3={{ x: 5, y: { z: [6] }, m: new Map([[1, 2]]) }} />
            })
            expect(computedCalls).toEqual(["prop3.x: 5"])
            expect(renders).toBe(1)
        })

        it("(new obj) deep prop with value set to the same one as before", async () => {
            renderFnStore.set(() => {
                return <Component prop3={{ x: 5, y: { z: [6] }, m: new Map([[1, 2]]) }} />
            })
            expect(computedCalls).toEqual(shallow ? ["prop3.x: 5"] : [])
            expect(renders).toBe(1) // TODO: wish this could be optimized to avoid the unecessary re-render
        })

        it("(new obj) deep prop with value removed", async () => {
            renderFnStore.set(() => {
                return <Component prop3={{}} />
            })
            expect(computedCalls).toEqual(["prop3.x: undefined"])
            expect(renders).toBe(1)
        })

        // component and children
        it("passing a component works", async () => {
            let innerRenders = 0
            function InnerC() {
                innerRenders++
                return null
            }
            renderFnStore.set(() => {
                return <Component componentProp={<InnerC />} />
            })
            expect(innerRenders).toBe(1)
            expect(computedCalls).toEqual(["prop3.x: undefined", "componentProp: true"])
            expect(renders).toBe(1)
        })

        it("passing a children component works", async () => {
            let innerRenders = 0
            function InnerC() {
                innerRenders++
                return null
            }
            renderFnStore.set(() => {
                return (
                    <Component>
                        <InnerC />
                    </Component>
                )
            })
            expect(innerRenders).toBe(1)
            expect(computedCalls).toEqual(["componentProp: false"])
            expect(renders).toBe(1)
        })

        // array
        it("array", async () => {
            renderFnStore.set(() => {
                return <Component prop1={[1, 2]} />
            })
            expect(computedCalls).toEqual(["prop1: [1,2]"])
            expect(renders).toBe(1)
        })

        it("array (same)", async () => {
            renderFnStore.set(() => {
                return <Component prop1={[1, 2]} />
            })
            expect(computedCalls).toEqual(shallow ? ["prop1: [1,2]"] : [])
            expect(renders).toBe(1) // TODO: shallow ? 1 : 0 -  wish this could be optimized to avoid the unecessary re-render
        })

        it("array (mutate)", async () => {
            renderFnStore.set(() => {
                return <Component prop1={[1, 3]} />
            })
            expect(computedCalls).toEqual(["prop1: [1,3]"])
            expect(renders).toBe(1)
        })

        it("array (add item)", async () => {
            renderFnStore.set(() => {
                return <Component prop1={[1, 2, 3]} />
            })
            expect(computedCalls).toEqual(["prop1: [1,2,3]"])
            expect(renders).toBe(1)
        })

        it("array (remove item)", async () => {
            renderFnStore.set(() => {
                return <Component prop1={[1, 2]} />
            })
            expect(computedCalls).toEqual(["prop1: [1,2]"])
            expect(renders).toBe(1)
        })

        // map
        it("map", async () => {
            renderFnStore.set(() => {
                return <Component prop1={new Map([[1, 1], [2, 2]])} />
            })
            expect(computedCalls).toEqual(
                shallow ? ["prop1: [[1,1],[2,2]]"] : ['prop1: {"1":1,"2":2}']
            )
            expect(renders).toBe(1)
        })

        it("map (same)", async () => {
            renderFnStore.set(() => {
                return <Component prop1={new Map([[1, 1], [2, 2]])} />
            })
            expect(computedCalls).toEqual(shallow ? ["prop1: [[1,1],[2,2]]"] : [])
            expect(renders).toBe(1) // TODO: shallow ? 1 : 0 -  wish this could be optimized to avoid the unecessary re-render
        })

        it("map (mutate)", async () => {
            renderFnStore.set(() => {
                return <Component prop1={new Map([[1, 1], [3, 3]])} />
            })
            expect(computedCalls).toEqual(
                shallow ? ["prop1: [[1,1],[3,3]]"] : ['prop1: {"1":1,"3":3}']
            )
            expect(renders).toBe(1)
        })

        it("map (add item)", async () => {
            renderFnStore.set(() => {
                return <Component prop1={new Map([[1, 1], [2, 2], [3, 3]])} />
            })
            expect(computedCalls).toEqual(
                shallow ? ["prop1: [[1,1],[2,2],[3,3]]"] : ['prop1: {"1":1,"2":2,"3":3}']
            )
            expect(renders).toBe(1)
        })

        it("map (remove item)", async () => {
            renderFnStore.set(() => {
                return <Component prop1={new Map([[1, 1], [2, 2]])} />
            })
            expect(computedCalls).toEqual(
                shallow ? ["prop1: [[1,1],[2,2]]"] : ['prop1: {"1":1,"2":2}']
            )
            expect(renders).toBe(1)
        })
    })
}

doTest("shallow")
doTest("deep")
