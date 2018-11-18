import { ReactElement } from "react"

import { observer } from "./observer"

interface IObserverProps {
    children?(): ReactElement<any>
    render?(): ReactElement<any>
}

function ObserverComponent({ children, render }: IObserverProps) {
    const component = children || render
    if (typeof component === "undefined") {
        return null
    }
    return component()
}
ObserverComponent.propTypes = {
    children: ObserverPropsCheck,
    render: ObserverPropsCheck
}
ObserverComponent.displayName = "Observer"

export const Observer = observer(ObserverComponent)

function ObserverPropsCheck(
    props: { [k: string]: any },
    key: string,
    componentName: string,
    location: any,
    propFullName: string
) {
    const extraKey = key === "children" ? "render" : "children"
    const hasProp = typeof props[key] === "function"
    const hasExtraProp = typeof props[extraKey] === "function"
    if (hasProp && hasExtraProp) {
        return new Error(
            "MobX Observer: Do not use children and render in the same time in`" + componentName
        )
    }

    if (hasProp || hasExtraProp) {
        return null
    }
    return new Error(
        "Invalid prop `" +
            propFullName +
            "` of type `" +
            typeof props[key] +
            "` supplied to" +
            " `" +
            componentName +
            "`, expected `function`."
    )
}
