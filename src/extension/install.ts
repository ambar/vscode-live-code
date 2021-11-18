import path from 'path'
import {exec} from 'child_process'
import {promisify} from 'util'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFunction<T = void> = (...args: any[]) => T

const safeCall = <T>(fn: AnyFunction<T>, fallback: AnyFunction<T>) => {
  try {
    return fn()
  } catch (e) {
    return fallback(e)
  }
}

const command = promisify(exec)

/**
 * Install the right package which cannot be bundled
 */
export default async function install(pkgFile: string, onInstall: AnyFunction) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const pkg = require(pkgFile) as {dependencies?: Record<string, string>}
  const dependencies = Object.keys({...pkg.dependencies})
  const cwd = path.dirname(pkgFile)
  const isInstalled = () =>
    safeCall(
      () => dependencies.every((x) => require.resolve(x)),
      () => false
    )
  if (isInstalled()) {
    return
  }
  onInstall()
  let err: unknown
  await command('yarn --prod', {cwd}).catch((e) => {
    err = e
  })
  if (isInstalled()) {
    return
  }
  await command('npm i --prod', {cwd}).catch((e) => {
    err = e
  })
  if (isInstalled()) {
    return
  }
  return Promise.reject(err)
}
