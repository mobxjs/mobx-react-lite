import "./assertEnvironment"

import { unstable_batchedUpdates as batch } from "./utils/reactBatchedUpdates"
import { observerBatching } from "./observerBatching"

observerBatching(batch)

export { isUsingStaticRendering, useStaticRendering } from "./staticRendering"
export { observer, IObserverOptions } from "./observer"
export { useObserver, ForceUpdateHook, IUseObserverOptions } from "./useObserver"
export { Observer } from "./ObserverComponent"
export { useForceUpdate } from "./utils"
export { useAsObservableSource } from "./useAsObservableSource"
export { useLocalStore } from "./useLocalStore"
export { useQueuedForceUpdate, useQueuedForceUpdateBlock } from "./useQueuedForceUpdate"
export { isObserverBatched, observerBatching } from "./observerBatching"
