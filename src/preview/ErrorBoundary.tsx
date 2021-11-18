import React from 'react'

type Props = {
  renderError?(e: Error): React.ReactNode
}

type State = {
  error: null | Error
}

export default class ErrorBoundary extends React.Component<Props, State> {
  state = {error: null}

  static getDerivedStateFromError(error: Error) {
    return {error}
  }

  componentDidCatch(error: Error, errorInfo: unknown) {
    // eslint-disable-next-line no-console
    console.error(error, errorInfo)
  }

  render() {
    const {renderError, children} = this.props
    const {error} = this.state
    if (error) {
      return <>{renderError ? renderError(error) : (error as Error).message}</>
    }

    return children
  }
}
