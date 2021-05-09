import { cleanTempDir, tsFile, runJest, runNode, testFile } from './utils';

describe('afterThis dynamic teardown hook', () => {
  beforeEach(() => cleanTempDir());

  it('should run the handler passed to afterThis', async () => {
    const randomNumber = Math.random();

    const test = testFile(`
      import { afterThis } from 'jest-after-this';

      it('should log randomNumber', () => {
        afterThis(() => {
          console.log('random number is: ${randomNumber}');
        });
      });
    `);

    const results = await runJest(test);
    expect(results.stdout).toMatch(`random number is: ${randomNumber}`);
  });

  it('should run afterThis after the test is finished', async () => {
    const test = testFile(`
      import { afterThis } from 'jest-after-this';

      it('should print "test" and then "afterThis"', () => {
        afterThis(() => {
          console.log('afterThis');
        });

        console.log('test')
      });
    `);

    const results = await runJest(test);
    expect(results.stdout.indexOf('test')).toBeLessThanOrEqual(
      results.stdout.indexOf('afterThis')
    );
  });

  it('should run afterThis handlers in reverse register order', async () => {
    const test = testFile(`
      import { afterThis } from 'jest-after-this';

      it('should print "i was registered last..." before "I was registered first..."', () => {
        afterThis(() => {
          console.log('I was registered first and will leave last');
        });

        afterThis(() => {
          console.log('I was registered last and will leave first');
        });
      });
    `);

    const results = await runJest(test);
    expect(
      results.stdout.indexOf('I was registered last and will leave first')
    ).toBeLessThanOrEqual(
      results.stdout.indexOf('I was registered first and will leave last')
    );
  });

  it('should run afterThis only after the relevant test', async () => {
    const test = testFile(`
      import { afterThis } from 'jest-after-this';

      it('should print "first test" then "first afterThis"', () => {
        afterThis(() => {
          console.log('first afterThis');
        });

        console.log("first test");
      });

      it('should print "second test" then "second afterThis", but not "first afterThis" because we did not register it here', () => {
        afterThis(() => {
          console.log('second afterThis');
        });

        console.log("second test");
      });
    `);

    const results = await runJest(test);

    expect(results.stdout.indexOf('first test')).toBeLessThanOrEqual(
      results.stdout.indexOf('first afterThis')
    );
    expect(results.stdout.lastIndexOf('first afterThis')).toBeLessThanOrEqual(
      results.stdout.indexOf('second test')
    );
    expect(results.stdout.lastIndexOf('second test')).toBeLessThanOrEqual(
      results.stdout.indexOf('second afterThis')
    );
  });

  it('should await upon async afterThis handlers', async () => {
    const test = testFile(`
      import { afterThis } from 'jest-after-this';

      it('should print "this is async afterThis" and only then "this is sync afterThis"', () => {
        afterThis(() => {
          console.log('this is sync afterThis');
        });

        afterThis(async () => {
          await new Promise(res => setTimeout(res, 100));
          console.log('this is async afterThis');
        });
      });
    `);

    const results = await runJest(test);

    expect(results.stdout).toMatch('this is async afterThis');
    expect(
      results.stdout.indexOf('this is async afterThis')
    ).toBeLessThanOrEqual(results.stdout.indexOf('this is sync afterThis'));
  });

  it('should run afterThis handlers after afterEach handlers', async () => {
    const test = testFile(`
      import { afterThis } from 'jest-after-this';

      afterEach(() => {
        console.log('this should run first');
      })

      it('should print "this should run first" and then "this should run last"', () => {
        afterThis(() => {
          console.log('this should run last');
        });
      });
    `);

    const results = await runJest(test);
    expect(results.stdout.indexOf('this should run first')).toBeLessThanOrEqual(
      results.stdout.indexOf('this should run last')
    );
  });

  it('should throw if not used inside a test context', async () => {
    const test = testFile(`
      import { afterThis } from 'jest-after-this';

      describe('this is not a test', () => {
        it('should never run this test actually', () => {});

        afterThis(() => {
          console.log('this should throw');
        });
      });
    `);

    const results = await runJest(test);

    expect(results.exitCode).not.toBe(0);
    expect(results.stderr).toMatch('You can only use afterThis inside a test');
  });

  it('should throw if not used inside a test or describe context', async () => {
    const test = testFile(`
      import { afterThis } from 'jest-after-this';

      describe('this is not a test', () => {
        it('should never run this test actually', () => {});
      });

      afterThis(() => {
        console.log('this should throw');
      });
    `);

    const results = await runJest(test);
    expect(results.exitCode).not.toBe(0);
    expect(results.stderr).toMatch('You can only use afterThis inside a test');
  });

  it('should throw if not used inside a jest test file', async () => {
    const file = tsFile(`
      import { afterThis } from 'jest-after-this';

      afterThis(() => {
        console.log('this should throw');
      });
    `);

    const results = await runNode(file);
    expect(results.exitCode).not.toBe(0);
    expect(results.stderr).toMatch(
      'The afterThis function can only be called in a jest test file'
    );
  });

  it('should not throw if you are only importing, but not using afterThis in a non-jest file', async () => {
    const file = tsFile(`
      import { afterThis } from 'jest-after-this';
      console.log(afterThis);
    `);

    const results = await runNode(file);
    expect(results.exitCode).toBe(1);
  });
});
