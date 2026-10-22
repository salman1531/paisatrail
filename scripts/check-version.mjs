import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const pkg=JSON.parse(await readFile(new URL('../package.json',import.meta.url),'utf8'));
const lock=JSON.parse(await readFile(new URL('../package-lock.json',import.meta.url),'utf8'));
assert.match(pkg.version,/^\d+\.\d+\.\d+(?:-preview\.\d+)?$/,'Use a numbered release or preview');
assert.equal(lock.version,pkg.version,'Update the root lockfile version');
assert.equal(lock.packages[''].version,pkg.version,'Update the package lock entry');
assert((await readFile(new URL('../CHANGELOG.md',import.meta.url),'utf8')).includes('## '+pkg.version+' — '),'Add this release to CHANGELOG.md');
console.log('Release metadata checked: '+pkg.version);
