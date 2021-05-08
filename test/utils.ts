import fs from 'fs';
import path from 'path';
import dedent from 'dedent';
import execa from 'execa';

const TEMP_DIR = './tmp';
const JEST_AFTER_THIS_IMPORT_PATH = path.resolve(__dirname, '..', 'src');

export const cleanTempDir = () => {
  fs.rmSync(TEMP_DIR, { recursive: true, force: true });
  fs.mkdirSync(TEMP_DIR);
};

export const testFile = (contents: string) => {
  return tsFile(contents, 'spec.ts');
};

export const tsFile = (contents: string, ext = 'ts') => {
  const contentsWithNormalizedImport = contents.replace(
    /import[ ]+((\{[ ]*){0,1}([^ ]+)([ ]*\}){0,1})[ ]+from[ ]+'jest-after-this'/g,
    `import $1 from '${JEST_AFTER_THIS_IMPORT_PATH}'`
  );

  const fileName = path.join(
    TEMP_DIR,
    `${Math.random().toString(16).split('.').pop()}.${ext}`
  );

  fs.writeFileSync(fileName, dedent(contentsWithNormalizedImport));

  return fileName;
};

export const runJest = (testFile: string) => {
  return npx(['jest', '--testMatch', '**/*.spec.ts', '--', testFile]);
};

export const runNode = (nodeFile: string) => {
  return npx(['ts-node', nodeFile]);
};

const npx = async (argv: string[]) => {
  const results = await execa('npx', argv, {
    reject: false,
    stdio: 'pipe',
  });

  return {
    exitCode: results.exitCode,
    stdout: results.stdout,
    stderr: results.stderr,
  };
};
