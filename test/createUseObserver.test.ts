// @ts-ignore
import plugin from "babel-plugin-macros"
// @ts-ignore
import pluginTester from "babel-plugin-tester"

pluginTester({
    plugin,
    snapshot: true,
    babelOptions: { filename: __filename },
    tests: [
        `
      import {useObserver} from '../src/macro'
      import {useObservable, useComputed} from '../src';

      export const MyComponent = (props) => {
        useObserver();
        const foo = useObservable({foo: 1});
        const bar = useComputed(() => foo.foo + 1);
        return null;
      };

      export const MyComponent2 = (props) => {
        // a comment
        useObserver();
        const foo = useObservable({foo: 1});
        return null;
      };

      export const MyComponent3 = (props) => {
        useObserver();
        return null;
      };

      export const MyComponent4 = (props) => {
        useObserver('baseComponentName');
        return null;
      };

      export const MyComponent5 = (props) => {
        useObserver('baseComponentName', { useForceUpdate: true });
        return null;
      };
      
      `
    ]
})
