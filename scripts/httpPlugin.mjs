import defaultFetch from 'node-fetch'

// fix 418 timeout bug in esm.sh (when using default UA or Electron/Code UA):
// https://github.com/alephjs/esm.sh#specify-esm-target
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91 Safari/537.36'

// https://esbuild.github.io/plugins/#http-plugin
const httpPlugin = ({fetch = defaultFetch} = {}) => {
  return {
    name: 'http',
    setup(build) {
      build.onResolve({filter: /^https?:\/\//}, (args) => ({
        path: args.path,
        namespace: 'http-url',
      }))

      // Make sure to keep the newly resolved URL in the "http-url" namespace
      // so imports inside it will also be resolved as URLs recursively.
      build.onResolve({filter: /.*/, namespace: 'http-url'}, (args) => ({
        path: new URL(args.path, args.importer).toString(),
        namespace: 'http-url',
      }))

      build.onLoad({filter: /.*/, namespace: 'http-url'}, async (args) => {
        const contents = await fetch(args.path, {
          headers: {'user-agent': UA},
        }).then((r) => r.text())
        return {contents}
      })
    },
  }
}

export default httpPlugin
