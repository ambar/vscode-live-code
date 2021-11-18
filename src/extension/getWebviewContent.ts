import {AppConfig} from '../types'

export default function getWebviewContent(appConfig: AppConfig) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Live Code</title>
    <script type="json" id="js-appConfig">${JSON.stringify(appConfig)}</script>
    <script type="importmapx">
    {
      "imports": {
        "react": "${appConfig.entries.react}",
        "react-dom": "${appConfig.entries.reactDOM}"
      }
    }
    </script>
    <script type="modulex">
      import * as React from 'react'
      import * as ReactDOM from 'react-dom'
      // re-export to browser VM
      globalThis.React = React
      globalThis.ReactDOM = React
    </script>
    <script type="module" src="${appConfig.entries.webviewUiToolkit}"></script>
    <style>
      html, body, #app, #splash {
        height: 100%;
      }
      body {
        padding: 0;
      }
      #splash {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    </style>
</head>
<body>
    <div id="splash"><vscode-progress-ring /></div>
    <div id="app"></div>
    <script src="${appConfig.entries.preview}"></script>
    <!--<script src="${appConfig.entries.preview}" type="module"></script>-->
</body>
</html>`
}
