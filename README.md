<p align="center">
<img src="./logo.svg" />
<br />
<img src="https://img.shields.io/npm/v/jest-after-this" />
<img src="https://img.shields.io/github/workflow/status/illBeRoy/jest-after-this/Node.js%20CI" />
</p>

## About
`jest-after-this` is an extension to `jest` that gives you a new lifecycle hook: `afterThis`. This hook allows you to schedule code that will run after the current test is over. You can think about it as something similar to `afterEach`, except you use it dynamically from within the test, and you can use it for as many times as you need.

The benefits of this approach are:
1. You can use this to handle side effects after the test is over (e.g. delete temp test files, remove records from memory, and more)
2. It will always run after the test is over, even the test failed
3. Tests can now have unique side effects, without the need to handle them in an external `afterEach`

Here's a simple example of how to use `afterThis` in your tests:
```ts
import { afterThis } from 'jest-after-this';

it('should create random files', () => {
  const randomFile = createRandomFile(); // run some action with side effect
  afterThis(() => deleteRandomFile(randomFile)); // tell jest to clean side effect after this specific test

  ...
})
```

Here's another example of how `afterThis` can be used to create self-cleaning helper functions:
```ts
import { afterThis } from 'jest-after-this';
import fs from 'fs';

// this function creates side effects and schedules their cleanup
function createTempFileForTest(filename: string) {
  fs.writeFileSync(filename, 'hello');
  afterThis(() => fs.rmSync(filename));
}

// file1 is created in the test, and its cleanup is schedule to after the test
it('should create one file', () => {
  const file1 = createTempFileForTest('file1');
})

// you can run this function as many times as you want! each run schedules a cleanup!
it('should create two files', () => {
  const file2 = createTempFileForTest('file2');
  const file3 = createTempFileForTest('file3');
})
```

## Installation
Start by installing the package using npm:
```sh
npm install jest-after-this
```

Or by using yarn:
```sh
yarn add jest-after-this
```

## Usage
The package exports a single function called `afterThis`. Simply import and use this function in any jest test - it will work out of the box:

```ts
import { afterThis } from 'jest-after-this';
```

### Where to use
The `afterThis` hook can **only** be called from within a test function (defined using `it` or `test`). If it's used outside of one, it will throw an error.

### Async Handlers
`afterThis` supports async handlers, and will await on them.

### Order of Execution
After the test is over, the `afterThis` hook executes the given handlers in **reverse order**. This means that the following test:

```ts
import { afterThis } from 'jest-after-this';

it('should print stuff', () => {
  afterThis(() => console.log(1));
  afterThis(() => console.log(2));
  afterThis(() => console.log(3));
});
```

Will actually print:
```
3
2
1
```

Since the last handler is run first. This is similar to the order of execution of other lifecycle hooks (such as `before`, `after`, `beforeEach` and `afterEach`).

That said, `afterThis` has lower priority than `afterEach`. This means that the first `afterThis` handler will run after the last `afterEach` handler.
