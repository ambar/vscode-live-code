export const of = <T>(value: Promise<T>) => {
  return value
    .then((r) => <const>[null, r])
    .catch((err: unknown) => <const>[err, void 0])
}

export const create = () => {
  let args: Parameters<ConstructorParameters<typeof Promise>[0]>
  const promise = new Promise((..._) => (args = _))
  return [promise, ...args!] as const
}
