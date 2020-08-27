# mobx-react-lite

[![CircleCI](https://circleci.com/gh/mobxjs/mobx-react-lite.svg?style=svg)](https://circleci.com/gh/mobxjs/mobx-react-lite)[![Coverage Status](https://coveralls.io/repos/github/mobxjs/mobx-react-lite/badge.svg)](https://coveralls.io/github/mobxjs/mobx-react-lite)[![NPM downloads](https://img.shields.io/npm/dm/mobx-react-lite.svg?style=flat)](https://npmjs.com/package/mobx-react-lite)[![Minzipped size](https://img.shields.io/bundlephobia/minzip/mobx-react-lite.svg)](https://bundlephobia.com/result?p=mobx-react-lite)

[![TypeScript](https://badges.frapsoft.com/typescript/code/typescript.svg?v=101)](https://github.com/ellerbrock/typescript-badges/)[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://github.com/prettier/prettier)

[![Join the chat at https://gitter.im/mobxjs/mobx](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/mobxjs/mobx?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

[![NPM](https://nodei.co/npm/mobx-react-lite.png)](https://www.npmjs.com/package/mobx-react-lite)

**You need React version 16.8.0 and above**

This is a lighter version of [mobx-react](https://github.com/mobxjs/mobx-react) which supports React **functional components only** and as such makes the library slightly faster and smaller (_only 1.5kB gzipped_). In fact `mobx-react@6` has this library as a dependency and builds on top of it.

The library does not include any Provider/inject utilities as they can be fully replaced with [React Context](https://mobx-react.js.org/recipes-context). Check out [the migration guide](https://mobx-react.js.org/recipes-migration).

Class based components **are not supported** except using `<Observer>` directly in class `render` method. If you want to transition existing projects from classes to hooks, use [mobx-react 6+](https://github.com/mobxjs/mobx-react).

See more at [the libraries overview](https://mobx-react.js.org/libraries).

## User Guide 👉 https://mobx-react.js.org

The site contains various examples and recipes for using MobX in React world. Feel free to contribute. The API reference of this package follows 👇.

## API reference ⚒

### **`<Observer>{renderFn}</Observer>`** _([user guide](https://mobx-react.js.org/observer-component))_

Is a React component, which applies observer to an anonymous region in your component.

### **`observer<P>(baseComponent: FunctionComponent<P>, options?: IObserverOptions): FunctionComponent<P>`** _([user guide](https://mobx-react.js.org/observer-hoc))_

```ts
interface IObserverOptions {
    // Pass true to wrap the inner component with React.forwardRef.
    // It's false by the default.
    forwardRef?: boolean
}
```

The observer converts a component into a reactive component, which tracks which observables are used automatically and re-renders the component when one of these values changes.

### **`useObserver<T>(fn: () => T, baseComponentName = "observed", options?: IUseObserverOptions): T`** _([user guide](https://mobx-react.js.org/observer-hook))_

```ts
interface IUseObserverOptions {
    // optional custom hook that should make a component re-render (or not) upon changes
    useForceUpdate: () => () => void
}
```

It allows you to use an observer like behaviour, but still allowing you to optimize the component in any way you want (e.g. using memo with a custom areEqual, using forwardRef, etc.) and to declare exactly the part that is observed (the render phase).

### **`useLocalStore<T, S>(initializer: () => T, source?: S): T`** _([user guide](https://mobx-react.js.org/state-local))_

Local observable state can be introduced by using the useLocalStore hook, that runs its initializer function once to create an observable store and keeps it around for a lifetime of a component.

### **`useAsObservableSource<T>(source: T): T`** _([user guide](https://mobx-react.js.org/state-outsourcing))_

The useAsObservableSource hook can be used to turn any set of values into an observable object that has a stable reference (the same object is returned every time from the hook).

## Observer batching

_Note: configuring observer batching is only needed when using `mobx-react-lite` 2.0.* or 2.1.*. From 2.2 onward it will be configured automatically based on the availability of react-dom / react-native packages_

[Check out the elaborate explanation](https://github.com/mobxjs/mobx-react/pull/787#issuecomment-573599793).

In short without observer batching the React doesn't guarantee the order component rendering in some cases. We highly recommend that you configure batching to avoid these random surprises.

Import one of these before any React rendering is happening, typically `index.js/ts`. For Jest tests you can utilize [setupFilesAfterEnv](https://jestjs.io/docs/en/configuration#setupfilesafterenv-array).

**React DOM:**

> import 'mobx-react-lite/batchingForReactDom'

**React Native:**

> import 'mobx-react-lite/batchingForReactNative'

### Opt-out

To opt-out from batching in some specific cases, simply import the following to silence the warning.

> import 'mobx-react-lite/batchingOptOut'

### Custom batched updates

Above imports are for a convenience to utilize standard versions of batching. If you for some reason have customized version of batched updates, you can do the following instead.

```js
import { observerBatching } from "mobx-react-lite"
observerBatching(customBatchedUpdates)
```
