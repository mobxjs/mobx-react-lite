import "./assertEnvironment"

import { unstable_batchedUpdates as batch } from "./utils/reactBatchedUpdates"
import { observerBatching } from "./observerBatching"

observerBatching(batch)

export { isUsingStaticRendering, useStaticRendering } from "./staticRendering"
export { observer, IObserverOptions } from "./observer"
export { Observer } from "./ObserverComponent"
export { useObservable } from "./useObservable"
export { observerBatching } from "./observerBatching"
