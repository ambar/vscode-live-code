import {Message} from 'console-feed/src/definitions/Console'
import {create} from '../../utils/promise'
import * as nodeVM from '../nodeVM'
import transform from '../transform'

test('empty', async () => {
  expect(await nodeVM.runInNewContext(transform(``))).toMatchInlineSnapshot(`
    Object {
      "logs": Array [],
      "result": Array [],
    }
  `)
})

test('expression', async () => {
  expect(await nodeVM.runInNewContext(transform(`0`))).toMatchInlineSnapshot(`
    Object {
      "logs": Array [],
      "result": Array [
        Array [
          "0",
          Object {
            "column": 0,
            "line": 1,
          },
        ],
      ],
    }
  `)
})

test('no access to local scope', async () => {
  expect(
    await nodeVM.runInNewContext(
      transform(`[typeof vm, typeof format, typeof result]`)
    )
  ).toMatchInlineSnapshot(`
    Object {
      "logs": Array [],
      "result": Array [
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
      ],
    }
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
    Object {
      "logs": Array [],
      "result": Array [
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
      ],
    }
  `)
})

test('console', async () => {
  const [done, resolve] = create()
  const workerRef: nodeVM.RunOpts['workerRef'] = {current: null}
  const logsList: Message[][] = []
  const updates = 2
  let calls = 0
  const onUpdate = jest.fn(({logs}) => {
    logsList.push(logs)
    calls += 1
    if (calls === updates) {
      resolve(void 0)
    }
  })
  expect(
    await nodeVM.runInNewContext(
      transform(`
        console.log(new Map);
        console.info('foo');
        console.time('label')
        console.timeEnd('label')

        void (async () => {
          console.time('fn')
          await new Promise(r => setTimeout(r, 10))
          console.info('fn:run')
          console.timeEnd('fn')
        })()
      `),
      {workerRef, onUpdate}
    )
  ).toMatchObject({logs: []})

  await done
  expect(onUpdate).toBeCalledTimes(updates)

  const last = logsList[logsList.length - 1]
  expect(last.length).toBe(5)
  const logString = JSON.stringify(last)
  expect(logString).toContain('foo')
  expect(logString).toContain('[[Map]]')
  expect(logString).toContain('ms')

  const onExit = jest.fn()
  workerRef.current!.on('exit', onExit)
  await workerRef.current!.terminate()
  expect(onExit).toBeCalled()
})
