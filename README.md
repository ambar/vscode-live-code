# Live Code

Interactive code playground.

## Features

- Automatically evaluate all top-level expressions
- Support multiple environments (browser/Node.js)
- Support TypeScript/JSX
- Support URL imports
- Support custom [paths](https://www.typescriptlang.org/tsconfig/#paths) in tsconfig or jsconfig

TODO:

- [ ] Show console logs
- [ ] Support Deno
- [ ] Run code block in Markdown/MDX
- [ ] Click-to-reveal source line

## Usage

Open _Command Palette_, choose `Live Code: Open Preview to the Side`, or simply click the preview button in the title, or use the shortcut `cmd` + `k l`.

![screenshot-1](./example/screenshot-1.png)

## Requirements

- [Node.js](https://nodejs.org/) v12+

## Extension Settings

```jsonc
{
  "liveCode.defaultPlatform": {
    "type": "string",
    "default": "browser",
    "description": "Set the execution environment of the preview",
    "enum": ["browser", "node"]
  },
  "liveCode.renderJSX": {
    "type": "boolean",
    "default": true,
    "description": "Wether to render JSX elements in the preview panel (browser platform only)"
  },
  "liveCode.showLineNumbers": {
    "type": "boolean",
    "default": true,
    "description": "Wether to show line numbers in the preview panel"
  }
}
```
