import fg from 'fast-glob'
import path from 'path'
import {promises as fs} from 'fs'

const config = [
  {
    from: 'node_modules/shiki',
    to: 'out/shiki',
    patterns: [
      'dist/onigasm.wasm',
      'languages/javascript.tmLanguage.json',
      'themes/*.json',
    ],
  },
  {
    from: 'node_modules/@vscode/webview-ui-toolkit',
    to: 'out/@vscode/webview-ui-toolkit',
    patterns: ['dist/toolkit.js'],
  },
]

void (async () => {
  for (const {from, to, patterns} of config) {
    const files = await fg(patterns, {cwd: from})
    await Promise.all(
      files.map(async (x) => {
        const src = path.resolve(from, x)
        const dest = path.resolve(to, x)
        await fs.mkdir(path.dirname(dest), {recursive: true})
        await fs.copyFile(src, dest)
      })
    )
  }
})()
