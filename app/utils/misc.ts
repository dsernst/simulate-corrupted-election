/** Map object values -> new object, via `fn(val, key)` */
export const mapObject = <T, U>(
  obj: Record<string, T>,
  fn: (value: T, key: string) => U
): Record<string, U> =>
  Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, fn(v, k)]))
