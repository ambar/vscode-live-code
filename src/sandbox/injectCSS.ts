const injectCSS = ({document}: Window, css?: string) => {
  if (!css) {
    return () => {
      // noop
    }
  }
  const style = document.createElement('style')
  style.textContent = css
  document.head.appendChild(style)
  return () => {
    style.remove()
  }
}

export default injectCSS
