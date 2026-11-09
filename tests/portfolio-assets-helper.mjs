import { readFileSync } from 'node:fs';
import ts from 'typescript';
/** src/server/portfolio-assets.ts를 주어진 환경 변수로 불러온다. */
export function loadPortfolioAssets(env = {}) {
  const code = ts.transpileModule(
    readFileSync(
      new URL('../src/server/portfolio-assets.ts', import.meta.url),
      'utf8',
    ),
    { compilerOptions: { module: ts.ModuleKind.CommonJS } },
  ).outputText;
  const exports = {};
  new Function('require', 'exports', 'process', code)(() => ({}), exports, {
    env,
  });
  return exports;
}
