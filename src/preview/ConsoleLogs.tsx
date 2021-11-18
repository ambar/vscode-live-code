import React, {useState, useEffect} from 'react'
// console-feed only has CJS export
import {Console, Hook, Unhook} from 'console-feed/src/index'

const ConsoleLogs: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([])

  useEffect(() => {
    Hook(window.console, (log) => setLogs((x) => [...x, log]), false)
    return () => {
      Unhook(window.console)
    }
  }, [])

  return <Console logs={logs} variant="dark" />
}

export default ConsoleLogs
