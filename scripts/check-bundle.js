/* Post-build guard: fail if the production bundle contains development-only
   React JSX runtime calls (jsxDEV), which would blank the page in production. */
const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '..', 'dist', 'assets');
const bad = fs.readdirSync(dir).filter((f) => f.endsWith('.js') && fs.readFileSync(path.join(dir, f), 'utf8').includes('jsxDEV'));
if (bad.length) {
  console.error(`✖ Production bundle contains jsxDEV (development JSX runtime) in: ${bad.join(', ')}`);
  process.exit(1);
}
console.log('✔ Bundle check passed: no development JSX runtime in dist/');
