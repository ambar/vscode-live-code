const timeMark = <T extends string>() => {
  const startTimes = new Map<T, number>()
  const values = new Map<T, number>()
  return {
    start(label: T) {
      startTimes.set(label, Date.now())
    },
    end(label: T) {
      const startTime = startTimes.get(label)
      if (!startTime) {
        throw new Error(`No label: ${label}`)
      }
      values.set(label, Date.now() - startTime)
    },
    print() {
      const result = [...values].map(([k, v]) => `${k} in ${v}ms`).join(', ')
      values.clear()
      return result
    },
  }
}

export default timeMark
