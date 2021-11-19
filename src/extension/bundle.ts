import path from 'path'
import type * as Esbuild from 'esbuild'
import {fetchBuilder, MemoryCache} from 'node-fetch-cache'
// @ts-expect-error ESM
import httpPlugin from '../../scripts/httpPlugin.mjs'

const fetch = fetchBuilder.withCache(new MemoryCache())

const loaderMap: Record<string, Esbuild.Loader> = {
  '.js': 'jsx',
  '.jsx': 'jsx',
  '.ts': 'ts',
  '.tsx': 'tsx',
}

// https://github.com/evanw/esbuild/issues/337#issuecomment-706765332
const externalGlobalPlugin = (map: Record<string, string>): Esbuild.Plugin => {
  return {
    name: 'externalGlobal',
    setup(build) {
      for (const [key, value] of Object.entries(map)) {
        const filter = RegExp(`^${key}$`)
        build.onResolve({filter}, (args) => ({
          path: args.path,
          namespace: 'externalGlobal',
        }))

        build.onLoad({filter, namespace: 'externalGlobal'}, () => {
          const contents = `module.exports = globalThis.${value}`
          return {contents}
        })
      }
    },
  }
}

export const bundle = async (
  input: string,
  filename: string,
  platform: Esbuild.Platform
) => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const esbuild = require('esbuild') as typeof Esbuild
  const workingDir = path.dirname(filename)
  const outfile = '<bundle>.js'
  const isWeb = platform === 'browser'
  const isNode = platform === 'node'
  const result = await esbuild.build({
    bundle: true,
    write: false,
    stdin: {
      loader: loaderMap[path.extname(filename)] || 'jsx',
      contents: input,
      resolveDir: workingDir,
      sourcefile: filename,
    },
    absWorkingDir: workingDir,
    outfile,
    platform,
    sourcemap: 'inline',
    format: isWeb ? 'esm' : 'cjs',
    // ensure there is only one copy of React, see https://reactjs.org/warnings/invalid-hook-call-warning.html#duplicate-react
    // external: isWeb ? ['react', 'react-dom'] : [],
    plugins: [
      isNode && httpPlugin({fetch}),
      isWeb && externalGlobalPlugin({react: 'React', 'react-dom': 'ReactDOM'}),
    ].filter(Boolean),
  })
  const outputs = result.outputFiles
  const js = outputs.find((x) => x.path.endsWith('.js'))
  const css = outputs.find((x) => x.path.endsWith('.css'))
  return {js, css}
}
