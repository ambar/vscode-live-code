/* eslint-disable no-console */
import {execSync} from 'child_process'
import {builtinModules} from 'module'
import esbuild from 'esbuild'
import minimist from 'minimist'
import { type } from 'os'

const args = minimist(process.argv.slice(2), {
  string: ['outfile', 'format'],
  boolean: ['watch', 'sourcemap', 'minify'],
})

const main = async (/** @type {import('esbuild').BuildOptions} */ opts) => {
  opts = {...args, ...opts}
  const {metafile, errors} = await esbuild.build({
    bundle: true,
    metafile: true,
    entryPoints: opts._,
    outfile: opts.outfile,
    format: opts.format,
    platform: 'node',
    target: 'node12',
    external: builtinModules.concat(opts.external || []),
    minifySyntax: true,
    define: {
      'process.env.NODE_ENV': `'production'`,
    },
    watch: process.argv.includes('--watch')
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

if (!/nomain/.test(import.meta.url)) {
  main()
}

export default main
