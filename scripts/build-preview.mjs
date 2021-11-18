/* eslint-disable no-console */
import minimist from 'minimist'
import NodeModulesPolyfills from '@esbuild-plugins/node-modules-polyfill'
import {fetchBuilder, FileSystemCache} from 'node-fetch-cache'
import esbuild from 'esbuild'
import {execSync} from 'child_process'
import httpPlugin from './httpPlugin.mjs'

const fetch = fetchBuilder.withCache(new FileSystemCache())

const args = minimist(process.argv.slice(2), {
  string: ['outfile'],
  boolean: ['watch', 'sourcemap', 'minify'],
})

/**
 * build Preview:
 * - multiple ESM entries
 * - generate common chunks (TODO)
 */
const main = async () => {
  const {errors, metafile} = await esbuild.build({
    platform: 'browser',
    // format: 'esm',
    // splitting: true,
    entryPoints: {
      preview: 'src/preview.tsx',
      // '@vscode/webview-ui-toolkit': '@vscode/webview-ui-toolkit',
      // 'react@16': 'https://esm.sh/react@16',
      // 'react-dom@16': 'https://esm.sh/react-dom@16',
      // 'react@17': 'https://esm.sh/react@17',
      // 'react-dom@17': 'https://esm.sh/react-dom@17',
      // 'react@18': 'https://esm.sh/react@18',
      // 'react-dom@18': 'https://esm.sh/react-dom@18',
    },
    outdir: 'out',
    outfile: args.outfile,
    sourcemap: args.sourcemap ? 'inline' : false,
    minify: args.minify,
    bundle: true,
    metafile: true,
    define: {
      global: 'globalThis',
    },
    external: ['esbuild', 'vscode'],
    plugins: [httpPlugin({fetch}), NodeModulesPolyfills.default()],
    watch: args.watch
      ? {
          onRebuild(err) {
            console.info('[watch] build finished')
            if (err && err.errors) {
              console.error(esbuild.formatMessages(err.errors))
            }
          },
        }
      : false,
  })

  if (errors.length) {
    throw new Error(esbuild.formatMessages(errors))
  } else {
    const outputs = Object.keys(metafile.outputs)
    execSync(`echo 'build finished:' && wc -c ${outputs.join(' ')}`, {
      stdio: 'inherit',
    })
  }
}

main()
