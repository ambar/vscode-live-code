const {workerData, parentPort} = require('worker_threads')
const {format} = require('pretty-format')
const Hook =
  process.env.NODE_ENV === 'test'
    ? require('../../.npm/console-feed').Hook
    : require('console-feed/src/Hook').default
const vm = require('vm')

const {code, filename} = workerData
const result = []
const logs = []

// console-feed uses `setTimeout` in Hook function
const batchedUpdate = batch(() => {
  parentPort.postMessage({
    type: 'update',
    data: {result, logs: filterDuplicateTimeLogs(logs)},
  })
}, setTimeout)

/**
 * TODO (console-feed):
 * - support Symbol (Encode/Decode)
 * - support console.dir
 */
Hook(
  console,
  (encoded) => {
    if (process.env.NODE_ENV === 'test') {
      logs.push(...encoded.map((x) => ({...x, id: '__id__'})))
    } else {
      logs.push(...encoded)
    }
    batchedUpdate()
  },
  true
)

Object.assign(globalThis, {
  __onexpression__(r, loc) {
    result.push([format(r), loc])
  },
  __onexpressionend__() {
    parentPort.postMessage({type: 'result', data: {result, logs}})
  },
})

// https://nodejs.org/api/globals.html#global-objects
const globalObjects = {module, exports, require, __dirname, __filename}
vm.runInThisContext(
  `(({module, exports, require, __dirname, __filename}) => { ${code} })`,
  {filename}
)(globalObjects)

function batch(fn, scheduleFn) {
  let pending = false
  let pendingArgs = []
  let promise = null
  return (...args) => {
    pendingArgs.push(args)
    if (!pending) {
      pending = true
      promise = new Promise((resolve) => {
        scheduleFn(() => {
          const fnArgs = pendingArgs
          pending = false
          pendingArgs = []
          resolve(fn(fnArgs))
        })
      })
    }
    return promise
  }
}

/*
// FIXME: it's a bug in console-feed
{
  id: '',
  method: 'log',
  data: [ '%s: %s', 'fn', '10.943ms' ]
},
{
  id: ''
  method: 'log',
  data: [ 'fn: 10ms' ],
}
*/
function filterDuplicateTimeLogs(logs) {
  return logs.filter((x, i) => {
    const prev = logs[i - 1]
    if (
      prev &&
      x.method === 'log' &&
      prev.method === x.method &&
      prev.data?.[0] === '%s: %s' &&
      prev.data?.[2].endsWith('ms') &&
      x.data?.[0].startsWith(prev.data[1])
    ) {
      return false
    }
    return true
  })
}
