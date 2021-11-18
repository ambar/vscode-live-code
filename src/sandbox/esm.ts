export const esm = (input: string) =>
  'data:text/javascript;charset=utf-8,' + encodeURIComponent(input)

export const exportFromGlobal = (
  name: string,
  ctx = 'globalThis',
  ctxObject: typeof globalThis | Window = globalThis
) => {
  const nsKeys = Object.keys(ctxObject[name])
    .filter((x) => x !== 'default')
    .join(',')
  return esm(`
    let x = ${ctx}.${name};
    let {${nsKeys}} = x;
    export {${nsKeys}};
    export default x
  `)
}
