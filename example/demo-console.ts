console.warn(0)
console.info(1)
console.log(2)
console.error(3)
console.debug(3)

void ((...args) => {
  console.time('fn')
  console.info('fn', args)
  console.timeEnd('fn')
})('a', 'b')
console.log({a: 1, b: 2, f: () => {}})
console.dir({a: 1, b: 2})

setInterval(() => {
  console.log({a: 1, b: 2})
}, 500)
