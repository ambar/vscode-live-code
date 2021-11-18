/* eslint-disable no-console */
import minimist from 'minimist'
import {execSync} from 'child_process'
import {builtinModules} from 'module'
import esbuild from 'esbuild'

const args = minimist(process.argv.slice(2), {
  string: ['outfile'],
  boolean: ['watch', 'sourcemap', 'minify'],
})

const main = async () => {
  const {metafile, errors} = await esbuild.build({
    bundle: true,
    entryPoints: {
      extension: './src/extension.ts',
      nodeWorker: './src/sandbox/nodeWorker.js',
    },
    outdir: 'out',
    format: 'cjs',
    target: 'node12',
    platform: 'node',
    sourcemap: args.sourcemap,
    minify: args.minify,
    metafile: true,
    external: ['esbuild', 'vscode'].concat(builtinModules),
    define: {
      global: 'globalThis',
      'process.env.NODE_ENV': `'production'`,
    },
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
    plugins: [],
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
