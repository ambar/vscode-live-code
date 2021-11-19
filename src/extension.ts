/* eslint-disable no-console */
import path from 'path'
import * as prettyFormat from 'pretty-format'
import * as vscode from 'vscode'
import type {Platform, AnyFunction} from './types'
import bundle from './extension/bundle'
import install from './extension/install'
import timeMark from './extension/timeMark'
import getWebviewContent from './extension/getWebviewContent'
import transform from './sandbox/transform'
import * as nodeVM from './sandbox/nodeVM'
import type {ExpContext} from './sandbox/types'

const NAME = 'Live Code'
const output = vscode.window.createOutputChannel(NAME)

const channelLog: AnyFunction<void> = (...args) => {
  // eslint-disable-next-line no-console
  console.log(...args)
  output.appendLine(
    args
      .map((x) =>
        typeof x === 'object' ? prettyFormat.format(x, {min: true}) : String(x)
      )
      .join(' ')
  )
}
const log: AnyFunction<void> = (...args) => {
  channelLog(new Date().toJSON(), 'extension', ...args)
}

const jsLanguageIds = [
  'javascript',
  'javascriptreact',
  'typescript',
  'typescriptreact',
]

const platformTitleMap: Record<Platform, string> = {
  node: 'Node.js',
  browser: 'browser',
}

const distDir = __dirname
// FIXME: change to fsPath map
const documentPanelMap = new Map<vscode.TextDocument, vscode.WebviewPanel>()
// const documentPanelMap = new WeakMap<vscode.TextDocument, vscode.WebviewPanel>()
const panelConfigMap = new WeakMap<
  vscode.WebviewPanel,
  {
    currentPlatform: Platform
  }
>()
let installPromise: ReturnType<typeof install>
let itsContext: vscode.ExtensionContext | null

export function activate(context: vscode.ExtensionContext) {
  itsContext = context
  log(`${NAME} is now active!`)
  installPromise = install(path.resolve(__dirname, '../package.json'), () =>
    log('installing on first use')
  )
  installPromise.catch(log)

  void vscode.commands.executeCommand(
    'setContext',
    'liveCode.supportedLanguageIds',
    jsLanguageIds
  )

  vscode.workspace.onDidChangeConfiguration(() => {
    for (const [, panel] of documentPanelMap) {
      void panel.webview.postMessage({
        type: 'configChange',
        data: {...vscode.workspace.getConfiguration('liveCode')},
      })
    }
  })

  vscode.workspace.onDidChangeTextDocument(
    debounce((e) => {
      void processDocument(e.document, false)
    }, 300)
  )

  vscode.workspace.onDidCloseTextDocument((doc) => {
    if (!documentPanelMap.get(doc)) {
      documentPanelMap.delete(doc)
    }
  })

  context.subscriptions.push(
    // TODO: unregister if no panel is showing
    vscode.commands.registerCommand('liveCode.changePlatform', async () => {
      const entry = [...documentPanelMap].find(([, x]) => x.active)
      if (!entry) {
        return
      }
      const [document, panel] = entry
      const {currentPlatform} = panelConfigMap.get(panel)!
      const items: vscode.QuickPickItem[] = [
        {
          label: 'node',
          description: 'Node.js',
        },
        {
          label: 'browser',
          description: 'Web browser (VS Code built in)',
        },
      ]
      const result = await vscode.window.showQuickPick(
        items.map((x) => ({
          ...x,
          description: `${x.description as string}${
            x.label === currentPlatform ? ' - Current' : ''
          }`,
        })),
        {
          placeHolder: 'Change platform in current preivew of Live Code',
        }
      )
      if (result) {
        panelConfigMap.set(panel, {
          ...panelConfigMap.get(panel),
          currentPlatform: result.label as Platform,
        })
        void processDocument(document)
      }
    }),
    vscode.commands.registerCommand('liveCode.reloadPreview', () => {
      log('existingPanel reload')
      const doc = vscode.window.activeTextEditor?.document
      if (!doc) {
        return
      }
      const panel = documentPanelMap.get(doc)
      if (panel) {
        setWebviewContent(panel.webview)
        return
      }
    }),
    vscode.commands.registerCommand('liveCode.openPreviewToSide', () => {
      const doc = vscode.window.activeTextEditor?.document
      if (!doc) {
        return
      }
      const existingPanel = documentPanelMap.get(doc)
      if (existingPanel) {
        existingPanel.reveal()
        return
      }
      const panel = vscode.window.createWebviewPanel(
        'liveCode.preview',
        '',
        vscode.ViewColumn.Beside,
        {
          enableScripts: true,
        }
      )
      documentPanelMap.set(doc, panel)
      panelConfigMap.set(panel, {currentPlatform: getDefaultPlatform()})
      setPanelTitleAndIcon(panel, doc)
      setWebviewContent(panel.webview)
      panel.webview.onDidReceiveMessage((e: {type: string; data: unknown}) => {
        log('onDidReceiveMessage', e)
        if (e.type === 'ready') {
          void processDocument(doc)
        } else if (e.type === 'revealLine') {
          revealSourceLine(e.data)
        } else if (e.type === 'requestReload') {
          void vscode.commands.executeCommand('liveCode.reloadPreview')
        }
      })
      const setIsPreviewFocus = (value: boolean) => {
        void vscode.commands.executeCommand(
          'setContext',
          'liveCode.isPreviewFocus',
          value
        )
      }
      setIsPreviewFocus(true)
      panel.onDidChangeViewState((e) => {
        setIsPreviewFocus(e.webviewPanel.active)
      })
      panel.onDidDispose(() => {
        setIsPreviewFocus(false)
        documentPanelMap.delete(doc)
        panelConfigMap.delete(panel)
      })
    })
  )
}

export function deactivate() {
  itsContext = null
  documentPanelMap.clear()
}

const prettyPrint = (obj: unknown) =>
  prettyFormat.format(obj, {
    min: true,
    printFunctionName: true,
  })

const of = <T>(value: Promise<T>) => {
  return value
    .then((r) => <const>[null, r])
    .catch((err: unknown) => <const>[err, void 0])
}

async function processDocument(
  document: vscode.TextDocument,
  shouldReload = false
) {
  const panel = documentPanelMap.get(document)
  if (!panel) {
    return
  }
  await installPromise
  const {currentPlatform} = panelConfigMap.get(panel)!
  setPanelTitleAndIcon(panel, document)
  let error: unknown
  let code: string | void
  let result: [string, ExpContext][] | void
  const timer = timeMark<'bundle' | 'nodeVM' | 'postMessage'>()
  timer.start('bundle')
  ;[error, code] = await of(
    bundleDocument(document, currentPlatform).then((r) => {
      // TODO: render .css
      return r?.js
    })
  )
  timer.end('bundle')
  if (code && currentPlatform === 'node') {
    timer.start('nodeVM')
    ;[error, result] = await of(
      nodeVM.runInNewContext(code, {filename: document.uri.fsPath})
    )
    timer.end('nodeVM')
  }
  timer.start('postMessage')
  await panel.webview.postMessage({
    type: shouldReload ? 'codeReload' : 'code',
    // data should be serialized
    data: {
      platform: currentPlatform,
      config: {...vscode.workspace.getConfiguration('liveCode')},
      result,
      code,
      error: error && prettyPrint(error),
    },
  })
  timer.end('postMessage')
  log(timer.print())
}

function debounce<T extends AnyFunction<void>>(fn: T, wait: number) {
  let timer: number | undefined
  return function () {
    if (timer) {
      clearTimeout(timer)
    }
    // eslint-disable-next-line prefer-rest-params
    timer = setTimeout(fn.apply.bind(fn, void 0, arguments), wait)
  } as T
}

function setPanelTitleAndIcon(
  panel: vscode.WebviewPanel,
  document: vscode.TextDocument
) {
  const {currentPlatform} = panelConfigMap.get(panel)!
  panel.title =
    `Preview` +
    (document ? ' ' + path.basename(document.uri.fsPath) : '') +
    ` in ${platformTitleMap[currentPlatform]}`
  const iconMap = {
    browser: 'electron',
    node: 'node',
  }
  panel.iconPath = vscode.Uri.joinPath(
    itsContext!.extensionUri,
    `images/${
      iconMap[currentPlatform as keyof typeof iconMap] ?? 'electron'
    }.svg`
  )
}

function getWebviewUri(webview: vscode.Webview, ...args: string[]) {
  return webview.asWebviewUri(vscode.Uri.file(path.resolve(...args))).toString()
}

function setWebviewContent(webview: vscode.Webview) {
  const getUri = getWebviewUri.bind(null, webview, distDir)
  webview.html = getWebviewContent({
    timestamp: Date.now(),
    distPath: getUri(distDir),
    entries: {
      preview: getUri('preview.js'),
      webviewUiToolkit: getUri('@vscode/webview-ui-toolkit/dist/toolkit.js'),
      // webviewUiToolkit: getUri('@vscode/webview-ui-toolkit.js'),
      react: getUri('react@17.js'),
      reactDOM: getUri('react-dom@17.js'),
    },
  })
}

function getDefaultPlatform() {
  const config = vscode.workspace.getConfiguration('liveCode')
  return (config.get('defaultPlatform') ?? 'browser') as Platform
}

function bundleDocument(document: vscode.TextDocument, platform: Platform) {
  return bundle(transform(document.getText()), {
    platform,
    filename: document.isUntitled ? undefined : document.uri.fsPath,
    workspaceFolder: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath,
  })
}

function revealSourceLine(loc: {line: number; column: number}) {
  const entry = [...documentPanelMap].find(([, x]) => x.active)
  if (!entry) {
    return
  }
  const [document] = entry
  const editor = vscode.window.visibleTextEditors.find(
    (x) => x.document === document
  )

  if (editor) {
    revealRange(editor)
  } else {
    void vscode.workspace
      .openTextDocument(document.uri.fsPath)
      .then(vscode.window.showTextDocument)
      .then(revealRange)
  }

  function revealRange(editor: vscode.TextEditor) {
    const start = new vscode.Position(loc.line, loc.column)
    editor.revealRange(
      new vscode.Range(start, start),
      vscode.TextEditorRevealType.InCenterIfOutsideViewport
    )
  }
}
