import {
    action,
    isObservable,
    isObservableArray,
    isObservableMap,
    isObservableObject,
    observable,
    remove,
    set
} from "mobx"
import { useMemo } from "react"

type LocalObservables = WeakMap<any, boolean>

const EMPTY_OBJECT = {}

export type UseObservablePropsMode<P> =
    | "shallow" // the reference is not changed and the props (primitives, objects, maps and arrays) are turned into a shallowly observable object
    | "deep" // the reference is not changed and props (primitives, objects, maps and arrays) are turned into a deeply observable object
    | {
          deepProps: Array<keyof P> // like 'shallow', except some properties are turned into deep observables 'opt-in'
      }

export function useObservableProps<P>(props: P, mode: UseObservablePropsMode<P>): P {
    const obsProps = useMemo(() => {
        return toObservablePropsAction(mode)
    }, [])

    obsProps.update(props)
    return obsProps.get()
}

function toObservableProps<P>(
    mode: UseObservablePropsMode<P>
): {
    get: (() => P)
    update: (props: P) => void
} {
    let isDeepProp: (pname: string) => boolean
    if (mode === "deep") {
        isDeepProp = () => true
    } else if (mode === "shallow") {
        isDeepProp = () => false
    } else {
        // convert array to object so lookup is faster
        const deepProps: { [pname: string]: boolean } = {}
        ;(mode.deepProps as string[]).forEach(propName => {
            deepProps[propName] = true
        })

        isDeepProp = propName => deepProps[propName]
    }

    // keeps track of which observable comes from props and which were generated locally
    const localObservables = new WeakMap()

    const observed = observable.object<P>({} as any, undefined, { deep: false })
    localObservables.set(observed, true)

    const update = action((unobserved: P) => {
        updateObservableObject(observed, unobserved || EMPTY_OBJECT, isDeepProp, localObservables)
    })

    return {
        get: () => observed,
        update
    }
}

const toObservablePropsAction = action(toObservableProps)

function updateObservableValue(oldV: any, newV: any, localObservables: LocalObservables) {
    if (isObservable(newV)) {
        return newV
    }
    if (Array.isArray(newV)) {
        return updateObservableArray(oldV, newV, localObservables)
    }
    if (isPlainObject(newV)) {
        return updateObservableObject(oldV, newV, undefined, localObservables)
    }
    if (newV instanceof Map) {
        return updateObservableMap(oldV, newV, localObservables)
    }
    return newV
}

function updateObservableArray(oldArr: any, newArr: any[], localObservables: LocalObservables) {
    if (!isObservableArray(oldArr) || !localObservables.has(oldArr)) {
        oldArr = observable.array([], { deep: false })
        localObservables.set(oldArr, true)
    }

    // add/update items
    const len = newArr.length
    oldArr.length = len
    for (let i = 0; i < len; i++) {
        const oldValue = oldArr[i]
        const newValue = newArr[i]

        if (oldValue !== newValue) {
            set(oldArr, i, updateObservableValue(oldValue, newValue, localObservables))
        }
    }

    return oldArr
}

function updateObservableMap(
    oldMap: any,
    newMap: Map<any, any>,
    localObservables: LocalObservables
) {
    if (!isObservableMap(oldMap) || !localObservables.has(oldMap)) {
        oldMap = observable.map({}, { deep: false })
        localObservables.set(oldMap, true)
    }

    const oldMapKeysToRemove = new Set(oldMap.keys())

    // add/update props
    newMap.forEach((newValue, propName) => {
        oldMapKeysToRemove.delete(propName)
        const oldValue = oldMap.get(propName)

        if (oldValue !== newValue) {
            set(oldMap, propName, updateObservableValue(oldValue, newValue, localObservables))
        }
    })

    // remove missing props
    oldMapKeysToRemove.forEach(propName => {
        remove(oldMap, propName)
    })

    return oldMap
}

function updateObservableObject(
    oldObj: any,
    newObj: any,
    isDeepProp: undefined | ((pname: string) => boolean),
    localObservables: LocalObservables
) {
    if (!isObservableObject(oldObj) || !localObservables.has(oldObj)) {
        oldObj = observable.object({}, undefined, { deep: false })
        localObservables.set(oldObj, true)
    }

    const oldObjKeysToRemove = new Set(Object.keys(oldObj))

    // add/update props
    Object.keys(newObj).forEach(propName => {
        oldObjKeysToRemove.delete(propName)
        const maybeNewValue = newObj[propName]
        const oldValue = oldObj[propName]

        const newValue =
            isDeepProp && !isDeepProp(propName)
                ? maybeNewValue
                : updateObservableValue(oldValue, maybeNewValue, localObservables)

        if (oldValue !== newValue) {
            set(oldObj, propName, newValue)
        }
    })

    // remove missing props
    oldObjKeysToRemove.forEach(propName => {
        remove(oldObj, propName)
    })

    return oldObj
}

export function isPlainObject(value: any): value is object {
    if (value === null || typeof value !== "object") {
        return false
    }
    const proto = Object.getPrototypeOf(value)
    return proto === Object.prototype || proto === null
}
