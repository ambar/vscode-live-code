import React from 'react'

// https://github.com/microsoft/vscode-webview-ui-toolkit
type VSCodeElement<
  T = HTMLElement,
  P = React.HTMLAttributes
> = React.DetailedHTMLProps<P<T>, T>

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'vscode-badge': VSCodeElement
      'vscode-button': VSCodeElement
      'vscode-checkbox': VSCodeElement
      'vscode-data-grid': VSCodeElement
      'vscode-data-grid-cell': VSCodeElement
      'vscode-data-grid-row': VSCodeElement
      'vscode-divider': VSCodeElement
      'vscode-dropdown': VSCodeElement
      'vscode-link': VSCodeElement
      'vscode-option': VSCodeElement
      'vscode-panels': VSCodeElement
      'vscode-panel-tab': VSCodeElement
      'vscode-panel-view': VSCodeElement
      'vscode-progress-ring': VSCodeElement
      'vscode-radio': VSCodeElement
      'vscode-radio-group': VSCodeElement
      'vscode-tag': VSCodeElement
      'vscode-text-area': VSCodeElement
      'vscode-text-field': VSCodeElement
    }
  }
}
