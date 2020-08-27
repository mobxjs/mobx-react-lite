import { useDeprecated } from "./utils"
import { observable, runInAction } from "mobx"
import { useState } from "react"

export function useAsObservableSource<TSource>(current: TSource): TSource {
    if ("production" !== process.env.NODE_ENV)
        useDeprecated(
            "[mobx-react-lite] 'useAsObservableSource' is deprecated, please store the values directly in an observable, for example by using 'useObservable', and sync with 'useEffect' when needed"
        )
    const [res] = useState(() => observable(current, {}, { deep: false }))
    runInAction(() => {
        Object.assign(res, current)
    })
    return res
}
