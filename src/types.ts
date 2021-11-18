export type Platform = 'browser' | 'node'

export type AppConfig = {
  timestamp?: number
  distPath: string
  entries: Record<string, string>
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyFunction<T = any> = (...args: any[]) => T
