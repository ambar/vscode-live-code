const {workerData, parentPort} = require('worker_threads')
const {format} = require('pretty-format')
const vm = require('vm')

const {code, filename} = workerData
const result = []
Object.assign(globalThis, {
  __onexpression__(r, loc) {
    result.push([format(r), loc])
  },
  __onexpressionend__() {
    parentPort.postMessage({type: 'result', data: result})
  },
})

// https://nodejs.org/api/globals.html#global-objects
const globalObjects = {module, exports, require, __dirname, __filename}
vm.runInThisContext(
  `(({module, exports, require, __dirname, __filename}) => { ${code} })`,
  {filename}
)(globalObjects)
