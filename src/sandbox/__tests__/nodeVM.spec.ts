import * as nodeVM from '../nodeVM'
import transform from '../transform'

test('empty', async () => {
  expect(await nodeVM.runInNewContext(transform(``))).toMatchInlineSnapshot(
    `Array []`
  )
})

test('expression', async () => {
  expect(await nodeVM.runInNewContext(transform(`0`))).toMatchInlineSnapshot(`
    Array [
      Array [
        "0",
        Object {
          "column": 0,
          "line": 1,
        },
      ],
    ]
  `)
})

test('no access to local scope', async () => {
  expect(
    await nodeVM.runInNewContext(
      transform(`[typeof vm, typeof format, typeof result]`)
    )
  ).toMatchInlineSnapshot(`
    Array [
      Array [
        "Array [
      \\"undefined\\",
      \\"undefined\\",
      \\"undefined\\",
    ]",
        Object {
          "column": 0,
          "line": 1,
        },
      ],
    ]
  `)
})

test('reject', async () => {
  await expect(nodeVM.runInNewContext(transform(`a`))).rejects.toThrow(
    /a is not defined/
  )
})

test('__filename', async () => {
  expect(
    await nodeVM.runInNewContext(transform(`[require, typeof __filename]`))
  ).toMatchInlineSnapshot(`
    Array [
      Array [
        "Array [
      [Function require],
      \\"string\\",
    ]",
        Object {
          "column": 0,
          "line": 1,
        },
      ],
    ]
  `)
})
