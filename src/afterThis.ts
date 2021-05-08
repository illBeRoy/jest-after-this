export type AfterThisCallback = (() => unknown) | (() => Promise<unknown>);

export function afterThis(fn: AfterThisCallback) {
  if (!isJest()) {
    throw new Error(
      'The afterThis function can only be called in a jest test file.'
    );
  }

  if (!expect.getState().currentTestName) {
    throw new Error('You can only use afterThis inside a test!');
  }

  pendingAfterThis.callbackStack.push(fn);
}

const pendingAfterThis = {
  callbackStack: [] as AfterThisCallback[],
  cleanCallbackStack() {
    this.callbackStack = [];
  },
};

async function handlePendingAfterThis() {
  const reverseCallbacks = [...pendingAfterThis.callbackStack].reverse();

  for (const cb of reverseCallbacks) {
    await cb();
  }

  pendingAfterThis.cleanCallbackStack();
}

function isJest() {
  return typeof jest !== 'undefined' && typeof afterEach === 'function';
}

if (isJest()) {
  afterEach(handlePendingAfterThis);
}
