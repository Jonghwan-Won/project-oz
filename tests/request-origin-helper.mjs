import { readFileSync } from 'node:fs';
import ts from 'typescript';
export function loadRequestOrigin(siteUrl = 'http://localhost') {
  const code = ts.transpileModule(
    readFileSync(
      new URL('../src/server/request-origin.ts', import.meta.url),
      'utf8',
    ),
    { compilerOptions: { module: ts.ModuleKind.CommonJS } },
  ).outputText;
  const exports = {};
  new Function('require', 'exports', 'process', code)(() => ({}), exports, {
    env: { BETTER_AUTH_URL: siteUrl },
  });
  return exports;
}
