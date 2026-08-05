const { spawnSync } = require('node:child_process');
const path = require('node:path');

const args = process.argv.slice(2);
const defaultTests = ['tests/eligibility-validation.test.ts', 'tests/flow-separation.test.ts'];
const testArgs = args.length > 0 ? args : defaultTests;

const result = spawnSync(process.execPath, ['--require', 'tsconfig-paths/register', '--require', 'ts-node/register/transpile-only', '--test', ...testArgs], {
  cwd: path.resolve(__dirname, '..'),
  stdio: 'inherit',
  env: {
    ...process.env,
    TS_NODE_COMPILER_OPTIONS: JSON.stringify({ module: 'commonjs', moduleResolution: 'node' })
  }
});

process.exit(result.status ?? 1);
