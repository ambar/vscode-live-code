import React, {useState, useEffect, createContext, useContext} from 'react'

// https://github.com/microsoft/vscode/issues/7589#issuecomment-226129243
const getIsDarkMode = () => document.body.classList.contains('vscode-dark')

const useIsDarkModeInternal = () => {
  const [isDarkMode, setIsDarkMode] = useState(getIsDarkMode())

  useEffect(() => {
    const mo = new MutationObserver(([change]) => {
      if (change.type === 'attributes' && change.attributeName === 'class') {
        setIsDarkMode(getIsDarkMode())
      }
    })
    mo.observe(document.body, {attributes: true, attributeFilter: ['class']})
    return () => {
      mo.disconnect()
    }
  }, [])

  return isDarkMode
}

const IsDarkModeContext = createContext<boolean>(false)

export const useIsDarkMode = () => {
  return useContext(IsDarkModeContext)
}

export const IsDarkModeProvider: React.FC = ({children}) => {
  const value = useIsDarkModeInternal()
  return (
    <IsDarkModeContext.Provider value={value}>
      {children}
    </IsDarkModeContext.Provider>
  )
}
