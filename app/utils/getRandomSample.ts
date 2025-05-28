import { MT19937 } from './mt19937'

/** Gets a random sample of `n` unique elements from `array` using the provided PRNG. */
export function getRandomSample<T>(array: T[], n: number, mt: MT19937): T[] {
  const ratio = n / array.length

  if (ratio < 0.5) return getRandomSampleCustom(array, n, mt)

  return getRandomSampleViaFisherYates(array, n, mt)
}

/** Only picks up to `n` unique elements from `array` using the provided PRNG.
    Fast when `n` is < 50% of `array.length`. */
export function getRandomSampleCustom<T>(
  array: T[],
  n: number,
  mt: MT19937
): T[] {
  const randomSample = new Set<T>()

  while (randomSample.size < n) {
    const randomIndex = Math.floor(mt.random() * array.length)
    const choice = array[randomIndex]

    // Keep if unique
    if (!randomSample.has(choice)) randomSample.add(choice)
  }

  return [...randomSample]
}

/** First shuffles `array` using Fisher-Yates in-place swap. Then returns a random sample of `n` elements.
    Fast when `n` is > 50% of `array.length`. */
export function getRandomSampleViaFisherYates<T>(
  arr: T[],
  n: number,
  mt: MT19937
): T[] {
  // Fisher-Yates shuffle for reproducible random sampling
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(mt.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a.slice(0, n)
}
