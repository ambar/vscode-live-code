import * as React from 'react'
import * as ReactDOM from 'react-dom'
import {exportFromGlobal} from './esm'

// re-export to browser VM
globalThis.React = React
globalThis.ReactDOM = ReactDOM

const injectImportMap = ({parent, document, window}: Window) => {
  Object.assign(window, {
    React: parent.React,
    ReactDOM: parent.ReactDOM,
  })
  const importMap = {
    imports: {
      react: exportFromGlobal('React', 'parent', parent),
      'react-dom': exportFromGlobal('ReactDOM', 'parent', parent),
    },
  }
  const im = document.createElement('script')
  im.type = 'importmap'
  im.textContent = JSON.stringify(importMap)
  document.head.append(im)
}

export default injectImportMap
