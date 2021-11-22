import path from 'path'
import type {ExpContext} from './types'
import {Worker} from 'worker_threads'

const workerPath = path.resolve(__dirname, 'nodeWorker.js')

export type RunOpts = {
  filename?: string
  workerRef?: {current: Worker | null}
}

// use ESM: https://github.com/nodejs/node/issues/30682
export const runInNewContext = async (
  code: string,
  {filename, workerRef}: RunOpts = {}
) => {
  return new Promise<[string, ExpContext][]>((resolve, reject) => {
    const worker = new Worker(workerPath, {
      // canot use `eval: true` due to scope bug in `vm.runInThisContext`
      workerData: {code, filename},
    })
    if (workerRef) {
      workerRef.current = worker
    }
    worker.on('message', (e) => {
      if (e.type === 'result') {
        resolve(e.data)
      }
    })
    worker.on('error', reject)
    worker.on('exit', () => {
      if (workerRef) {
        workerRef.current = null
      }
    })
  })
}
