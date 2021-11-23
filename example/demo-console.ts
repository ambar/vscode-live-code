console.warn(0)
console.info(1)
console.log(2)
console.error(3)
console.debug(4)

void (async () => {
  console.time('fn')
  await new Promise((r) => setTimeout(r, 10))
  console.info('fn:run')
  console.timeEnd('fn')
})()

console.info(
  new Map([
    ['a', 1],
    ['b', 2],
  ]),
  new Set([1, 2]),
  new TextEncoder().encode('xyz'),
  () => {}
)

console.dir({a: 1, b: 2})

setTimeout(() => {
  console.info('setTimeout')
}, 1000)

let count = 0
setInterval(() => {
  console.info('setInterval', count++)
}, 1000)
