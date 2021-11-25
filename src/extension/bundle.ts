import path from 'path'
import type * as Esbuild from 'esbuild'
import {fetchBuilder, MemoryCache} from 'node-fetch-cache'
// @ts-expect-error ESM
import httpPlugin from '../../scripts/httpPlugin.mjs'

const fetch = fetchBuilder.withCache(new MemoryCache())
const defaultNodeEnv = 'development'
const defaultBrowserProcessEnv = {}
const loaderMap: Record<string, Esbuild.Loader> = {
  '.js': 'jsx',
  '.jsx': 'jsx',
  '.ts': 'ts',
  '.tsx': 'tsx',
}
// loader map for untitled files
const languageIdLoaderMap: Record<string, Esbuild.Loader> = {
  javascript: 'js',
  javascriptreact: 'jsx',
  typescript: 'ts',
  typescriptreact: 'tsx',
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

export type BundleOpts = {
  platform: Esbuild.Platform
  sourcemap?: Esbuild.BuildOptions['sourcemap']
  filename?: string
  workspaceFolder?: string
  languageId?: string
}

/**
 * Bundle code in the editor
 */
export default async function bundle(
  input: string,
  {
    filename,
    workspaceFolder,
    platform,
    languageId,
    sourcemap = 'inline',
  }: BundleOpts
) {
  if (!filename && !workspaceFolder) {
    throw new Error('Can not resolve `filename` or `workspaceFolder`')
  }
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const esbuild = require('esbuild') as typeof Esbuild
  const workingDir = filename ? path.dirname(filename) : workspaceFolder
  const outfile = '<bundle>.js'
  const isWeb = platform === 'browser'
  const isNode = platform === 'node'
  const result = await esbuild.build({
    bundle: true,
    write: false,
    stdin: {
      loader:
        (filename && loaderMap[path.extname(filename)]) ||
        (languageId && languageIdLoaderMap[languageId]) ||
        'jsx',
      contents: input,
      resolveDir: workingDir,
      sourcefile: filename ?? '<Untitled>',
    },
    absWorkingDir: workingDir,
    outfile,
    platform,
    sourcemap,
    format: isWeb ? 'esm' : 'cjs',
    logLevel: 'silent',
    define: {
      // use `development` for better debug info
      'process.env.NODE_ENV': JSON.stringify(defaultNodeEnv),
      ...(isWeb && {
        'process.env': JSON.stringify(defaultBrowserProcessEnv),
      }),
    },
    // ensure there is only one copy of React, see https://reactjs.org/warnings/invalid-hook-call-warning.html#duplicate-react
    // external: isWeb ? ['react', 'react-dom'] : [],
    plugins: [
      isNode && httpPlugin({fetch}),
      isWeb && externalGlobalPlugin({react: 'React', 'react-dom': 'ReactDOM'}),
    ].filter(Boolean),
  })
  const outputs = result.outputFiles
  const js = outputs.find((x) => x.path.endsWith('.js'))?.text
  const css = outputs.find((x) => x.path.endsWith('.css'))?.text
  return {js, css}
}
