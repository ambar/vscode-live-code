import bundle, {BundleOpts} from '../bundle'

describe('browser', () => {
  const opts: BundleOpts = {
    platform: 'browser',
    sourcemap: false,
    workspaceFolder: __dirname,
  }

  const cases = ['', 'export let x = 0']
  test.each(cases)('budnle %s', async (x) => {
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
})
