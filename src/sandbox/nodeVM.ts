import path from 'path'
import type {ExpContext} from './types'
import {Worker} from 'worker_threads'

const workerPath = path.resolve(__dirname, 'nodeWorker.js')

export type RunOpts = {
  filename?: string
  workerRef?: {current: Worker | null}
  onUpdate?: (r: Result) => void
}

type Result = {
  result: [string, ExpContext][]
  logs: []
}

type WorkerMessage =
  | {type: 'result'; data: Result}
  | {type: 'update'; data: Result}

// use ESM: https://github.com/nodejs/node/issues/30682
export const runInNewContext = async (
  code: string,
  {filename, workerRef, onUpdate}: RunOpts = {}
) => {
  return new Promise<Result>((resolve, reject) => {
    const worker = new Worker(workerPath, {
      // canot use `eval: true` due to scope bug in `vm.runInThisContext`
      workerData: {code, filename},
    })
    if (workerRef) {
      workerRef.current = worker
    }
    worker.on('message', (e) => {
      const {type, data} = e as WorkerMessage
      if (type === 'result') {
        resolve(data)
      } else if (type === 'update') {
        onUpdate?.(data)
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
