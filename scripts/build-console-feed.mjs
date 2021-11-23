import path from 'path'
import {createRequire} from 'module'
import main from './build.mjs?nomain'

const root = path.resolve(new URL(path.dirname(import.meta.url)).pathname, '..')
const require = createRequire(import.meta.url)
const pkg = require('console-feed/package.json')
const outPkgDir = path.resolve(root, '.npm/console-feed')
const outPkg = require(path.resolve(outPkgDir,'package.json'))
const entry = ['console-feed/src']

main({
  _: entry,
  format: 'esm',
  external: Object.keys(pkg.dependencies),
  outfile: path.resolve(outPkgDir, outPkg.module),
})

main({
  _: entry,
  format: 'cjs',
  external: Object.keys(pkg.dependencies),
  outfile: path.resolve(outPkgDir, outPkg.main),
})
