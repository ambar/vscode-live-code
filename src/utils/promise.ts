export const of = <T>(value: Promise<T>) => {
  return value
    .then((r) => <const>[null, r])
    .catch((err: unknown) => <const>[err, void 0])
}
