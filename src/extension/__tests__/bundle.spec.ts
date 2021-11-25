/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import bundle, {BundleOpts} from '../bundle'

describe('browser', () => {
  const opts: BundleOpts = {
    platform: 'browser',
    sourcemap: false,
    workspaceFolder: __dirname,
  }

  const cases = ['', 'export let x = 0']
  test.each(cases)('bundle %s', async (x) => {
    expect(await bundle(x, opts)).toMatchSnapshot()
  })

  test('throw error if no workspace', async () => {
    await expect(bundle('', {platform: opts.platform})).rejects.toThrow(
      /Can not resolve/
    )
  })

  test('throw error if requiring core modules', async () => {
    await expect(bundle(`import fs from 'fs'`, opts)).rejects.toThrowError(
      /Could not resolve "fs"/
    )
  })

  test('transform NODE_ENV', async () => {
    const name = `process.env.NODE_ENV`
    expect(await bundle(`call(${name})`, opts)).toMatchObject({
      js: expect.stringContaining('call("development")'),
    })
  })

  test('donot preserve process.env.FOO', async () => {
    const name = `process.env.MY_VAR`
    expect(await bundle(`export let x = ${name}`, opts)).toMatchObject({
      js: expect.not.stringContaining(name),
    })
  })
})

describe('node', () => {
  const opts: BundleOpts = {
    platform: 'node',
    sourcemap: false,
    workspaceFolder: __dirname,
  }

  test('throw error if no workspace', async () => {
    await expect(bundle('', {platform: opts.platform})).rejects.toThrow(
      /Can not resolve/
    )
  })

  test('import core modules', async () => {
    expect(await bundle(`import fs from 'fs'`, opts)).toMatchObject({
      js: expect.stringContaining(`require("fs")`),
    })
  })

  test('transform NODE_ENV', async () => {
    const name = `process.env.NODE_ENV`
    expect(await bundle(`call(${name})`, opts)).toMatchObject({
      js: expect.stringContaining('call("development")'),
    })
  })

  test('preserve process.env.FOO', async () => {
    const name = `process.env.MY_VAR`
    expect(await bundle(`export let x = ${name}`, opts)).toMatchObject({
      js: expect.stringContaining(name),
    })
  })
})
