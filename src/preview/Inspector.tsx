import React, {useState, useEffect} from 'react'
import * as ri from 'react-inspector'
import {useIsDarkMode} from './darkMode'

// https://github.com/storybookjs/react-inspector/blob/master/src/styles/themes/chromeDark.js
const baseStyles = {
  // inherit style from web view
  BASE_FONT_FAMILY: 'inherit',
  BASE_FONT_SIZE: 'inherit',
  BASE_LINE_HEIGHT: 'inherit',
  BASE_BACKGROUND_COLOR: 'inherit',
  TREENODE_FONT_FAMILY: 'inherit',
  TREENODE_FONT_SIZE: 'inherit',
  TREENODE_LINE_HEIGHT: 'inherit',
}
const darkTheme = {...ri.chromeDark, ...baseStyles}
const lightTheme = {...ri.chromeLight, ...baseStyles}

const useInspectorTheme = () => {
  const isDarkMode = useIsDarkMode()
  const [theme, setTheme] = useState(isDarkMode ? darkTheme : lightTheme)

  useEffect(() => {
    setTheme(isDarkMode ? darkTheme : lightTheme)
  }, [isDarkMode])

  return theme
}

// TODO: inspect settled value of Promise
const Inspector: React.FC<ri.InspectorProps> = (props) => {
  return <ri.Inspector {...props} theme={useInspectorTheme()} />
}

export default Inspector
