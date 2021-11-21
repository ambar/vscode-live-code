/** @jsx jsx */
import {jsx} from '@emotion/react'
import React, {useState, useMemo, useEffect, useCallback} from 'react'
import {render} from 'react-dom'
import * as prettyFormat from 'pretty-format'
import isPromise from 'is-promise'
import type {EvaluationResult, ExpContext} from './sandbox/types'
import {runInNewContext, CallbackParams} from './sandbox/browserVM'
import injectImportMap from './sandbox/injectImportMap'
import {IsDarkModeProvider, useIsDarkMode} from './preview/darkMode'
import ErrorBoundary from './preview/ErrorBoundary'
import Inspector from './preview/Inspector'
import {StyledConsole, Hook, Unhook, Message} from './preview/console'
import {AppConfig, AnyFunction, Platform} from './types'
import timeMark from './utils/timeMark'
import {of} from './utils/promise'

// https://code.visualstudio.com/api/extension-guides/webview#persistence
const vscode = acquireVsCodeApi()
const emptyValue = {
  values: [null, void 0],
  dispose() {}, // eslint-disable-line @typescript-eslint/no-empty-function
}

const useLiveCode = (code?: string) => {
  const [logs, setLogs] = useState<Message[]>([])
  const [asyncValues, setValues] = useState<CallbackParams | []>([])

  const {values, dispose} = useMemo(() => {
    if (!code) {
      return emptyValue
    }
    return runInNewContext(code, {
      setup: (window: Window) => {
        injectImportMap(window)
        Hook(window.console, (x) => setLogs((s) => s.concat(x)), false)
        return () => {
          setLogs([])
          Unhook(window.console)
        }
      },
    })
  }, [code])

  useEffect(() => dispose, [dispose])

  const isAsync = isPromise(values)
  useEffect(() => {
    void (async () => {
      if (isAsync) {
        const timer = timeMark<'browserVM'>()
        timer.start('browserVM')
        setValues(await of(values))
        timer.end('browserVM')
        vscode.postMessage({type: 'timeMark', data: timer.print()})
      }
    })()
  }, [isAsync, values])

  return [isAsync ? asyncValues : values, logs] as const
}

const inspectPromise: prettyFormat.Plugin = {
  test: isPromise,
  serialize(array, config, indentation, depth, refs, printer) {
    // TODO: inspect settled value
    return 'Promise'
  },
}

const safeCall = <T,>(fn: AnyFunction<T>, fallback: AnyFunction<T>) => {
  try {
    return fn()
  } catch (e) {
    return fallback(e)
  }
}

const prettyPrint = (obj: unknown) =>
  prettyFormat.format(obj, {
    min: true,
    printFunctionName: true,
    plugins: [inspectPromise],
  })

declare global {
  function acquireVsCodeApi(): {
    postMessage(data: unknown): void
    getState(): any
    setState(data: unknown): void
  }
}

type Data = {
  platform: Platform
  error?: unknown
  code?: string
  result?: [string, ExpContext][]
  config: {
    defaultPlatform: Platform
    renderJSX: boolean
    showLineNumbers: boolean
  }
}

const appConfig = JSON.parse(
  document.getElementById('js-appConfig')?.textContent ?? `{}`
) as AppConfig
Object.assign(globalThis, {appConfig})

const memoize = <T extends AnyFunction<unknown>>(
  fn: T,
  keyFn = (...args: Parameters<T>) => String(args[0])
) => {
  const cache = new Map<string, unknown>()
  return ((...args: Parameters<T>) => {
    const key = keyFn(...args)
    if (cache.has(key)) {
      return cache.get(key)!
    }
    const value = fn(...args)
    cache.set(key, value)
    return value
  }) as T
}

const loadshiki = import('shiki').then((shiki) => {
  shiki.setCDN(appConfig.distPath + '/shiki/')
  return shiki
})

const getHighlighter = memoize(async (isDarkMode: boolean) => {
  const shiki = await loadshiki
  return shiki.getHighlighter({
    // TODO: map to `[data-vscode-theme-name]`
    theme: isDarkMode ? 'github-dark' : 'github-light',
    langs: ['js'],
  })
})

const PrettyHighlighter: React.FC<{text: string}> = ({text}) => {
  const isDarkMode = useIsDarkMode()
  const [html, setHtml] = useState<string>(' ')
  useEffect(() => {
    void getHighlighter(isDarkMode).then((highlighter) => {
      setHtml(highlighter.codeToHtml(text, 'js'))
    })
  }, [text, isDarkMode])

  return <div dangerouslySetInnerHTML={{__html: html}} />
}

type PreviewProps = {
  config: Data['config']
  values?: EvaluationResult[]
  stringifiedValues?: [string, ExpContext][]
  inspect?: boolean
}
const Preview: React.FC<PreviewProps> = ({
  values,
  stringifiedValues,
  config,
  inspect = false,
}) => {
  const result = values || stringifiedValues

  const notifyReveal = useCallback((loc: ExpContext) => {
    vscode.postMessage({
      type: 'revealLine',
      data: {line: loc.line, column: loc.column},
    })
  }, [])

  if (!result?.length) {
    return null
  }

  return (
    <table>
      <tbody>
        {result.map(([r, loc], i) => (
          <tr key={i}>
            <td
              data-line-number={loc.line}
              css={{
                paddingLeft: 10,
                paddingRight: 10,
                color: '#858585',
                textAlign: 'right',
                verticalAlign: 'top',
              }}
              title={`Line ${loc.line}, Column ${loc.column}`}
              hidden={!config.showLineNumbers}
              onClick={() => notifyReveal(loc)}
            >
              <span css={{userSelect: 'none'}}>
                {loc.line}
                {(result[i - 1]?.[1].line === loc.line ||
                  result[i + 1]?.[1].line === loc.line) && (
                  <small>,{loc.column}</small>
                )}
              </span>
            </td>
            <td
              css={{verticalAlign: 'top'}}
              onDoubleClick={() => notifyReveal(loc)}
            >
              <ErrorBoundary renderError={prettyPrint}>
                {inspect ? (
                  config.renderJSX && React.isValidElement(r) ? (
                    r
                  ) : (
                    <Inspector data={r} expandLevel={1} showNonenumerable />
                  )
                ) : (
                  <PrettyHighlighter text={r as string} />
                )}
              </ErrorBoundary>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

const App = () => {
  const [isLoading, setIsLoading] = useState(true)
  const previousState = vscode.getState() as {data: Data}
  const [data, setData] = useState<Data>(previousState?.data ?? '')
  const [[error, values], logs] = useLiveCode(
    data.platform === 'browser' ? data.code : void 0
  )

  useEffect(() => {
    document.getElementById('splash')?.remove()
    vscode.postMessage({type: 'ready'})
    const handleMessge = (event: MessageEvent) => {
      const message = event.data
      if (message.type === 'code') {
        setIsLoading(false)
        setData(message.data)
        vscode.setState({data: message.data})
      } else if (message.type === 'codeReload') {
        vscode.setState({data: message.data})
        vscode.postMessage({type: 'requestReload'})
      } else if (message.type === 'configChange') {
        setData((data) => {
          const newData = {
            ...data,
            config: {...data.config, ...message.data},
          }
          vscode.setState({data: newData})
          return newData
        })
      }
    }
    window.addEventListener('message', handleMessge)
    return () => {
      window.removeEventListener('message', handleMessge)
    }
  }, [])

  if (isLoading) {
    return (
      <div
        css={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <vscode-progress-ring />
      </div>
    )
  }

  let content: React.ReactNode

  if (data.error) {
    content = <>{data.error}</>
  } else if (data.result) {
    content = <Preview config={data.config} stringifiedValues={data.result} />
  } else if (error) {
    content = <>{prettyPrint(error)}</>
  } else if (values) {
    content = <Preview config={data.config} values={values} inspect />
  }

  return (
    <div
      css={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        height: '100%',
        fontFamily: 'var(--vscode-editor-font-family)',
        fontSize: 'var(--vscode-editor-font-size)',
      }}
    >
      <style>{`
        .shiki {
          margin: 0;
          background: inherit!important;
        }
        .shiki, .shiki code {
          font-family: inherit;
        }
      `}</style>
      {/* <div>
        <vscode-radio-group>
          <label slot="label">Build Target</label>
          <vscode-radio value="web" checked>
            web
          </vscode-radio>
          <vscode-radio value="node">
            node
          </vscode-radio>
        </vscode-radio-group>
      </div> */}
      <pre
        css={{
          width: '100%',
          height: '100%',
          margin: 0,
          padding: 10,
          whiteSpace: 'pre-line',
          lineHeight: 1.5,
          boxSizing: 'border-box',
          // overflow: 'auto',
          // WebkitOverflowScrolling: 'auto',
        }}
      >
        {content}
      </pre>
      {/* TODO: filter console calls in preview, which returns `undefined` */}
      {logs.length > 0 && <StyledConsole logs={logs} />}
    </div>
  )
}

render(
  <IsDarkModeProvider>
    <App />
  </IsDarkModeProvider>,
  document.getElementById('app')
)
