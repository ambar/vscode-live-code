import type {EvaluationResult, ExpContext} from './types'

const createContext = () => {
  const iframe = document.createElement('iframe')
  iframe.hidden = true
  return {
    run(fn: (win: Window) => void) {
      iframe.onload = () => {
        fn(iframe.contentWindow!)
      }
      document.body.appendChild(iframe)
    },
    dispose() {
      iframe.remove()
    },
  }
}

type RunOpts = {
  modules?: boolean
  setup?(g: Window | typeof globalThis): void | (() => void)
}

export type CallbackParams = [err: null | Error, values?: EvaluationResult[]]

/**
 * Create an `iframe` to compile and run code
 */
export const runInNewContext = (
  code: string,
  {modules = true, setup}: RunOpts = {}
) => {
  let ctx: ReturnType<typeof createContext>
  let teardown: void | (() => void)
  const dispose = () => {
    teardown?.()
    ctx?.dispose()
  }

  const run = (callback: (...args: CallbackParams) => void) => {
    ctx = createContext()
    ctx.run((global) => {
      teardown = setup?.(global)
      const values: EvaluationResult[] = []
      Object.assign(global, {
        __onexpression__: (r: unknown, loc: ExpContext) => {
          values.push([r, loc])
        },
        __onexpressionend__: () => {
          callback(null, values)
        },
      })

      // https://mdn.io/ErrorEvent
      // https://mdn.io/GlobalEventHandlers/onerror#Notes
      global.addEventListener('error', (e) => {
        e.preventDefault()
        callback(e.error || new Error(e.message)) // Safari returns null
      })

      const {document} = global
      const script = document.createElement('script')
      if (modules) {
        script.type = 'module'
      }
      script.textContent = code
      document.body.appendChild(script)
      script.remove()
    })
  }

  // async
  if (modules) {
    const promisify = <T extends (...args: any[]) => void>(fn: T) =>
      new Promise<Parameters<T>[1]>((resolve, reject) =>
        fn((err: Parameters<T>[0], data: Parameters<T>[1]) => {
          err ? reject(err) : resolve(data)
        })
      )
    return {values: promisify(run), dispose}
  }

  // sync
  let values: CallbackParams
  try {
    run((err, data) => {
      values = [err, data]
    })
  } catch (err) {
    values = [err as Error]
  }
  return {values: values!, dispose}
}
