import { it } from 'bun:test'

import {
  getRandomSampleCustom,
  getRandomSampleViaFisherYates,
} from '../getRandomSample'
import { MT19937 } from '../mt19937'

it('benchmarks getRandomSample techniques', () => {
  const arraySize = 100_000
  const ratios = [0.0001, 0.1, 0.25, 0.5, 0.6, 0.75, 0.9]
  const trials = 2
  const mt = new MT19937(0)
  const array = Array.from({ length: arraySize }, (_, i) => i)

  console.log('ratio\tSet-based\tFisher-Yates\tDiff')

  for (const ratio of ratios) {
    const n = Math.floor(ratio * arraySize)
    let timeCustom = 0
    let timeFisherYates = 0

    for (let i = 0; i < trials; i++) {
      mt.seed(i)

      timeCustom += time(() => getRandomSampleCustom(array, n, mt)).time

      mt.seed(i)
      timeFisherYates += time(() =>
        getRandomSampleViaFisherYates(array, n, mt)
      ).time
    }

    console.log(
      `${ratio}\t${(timeCustom / trials).toFixed(1)}ms\t\t${(
        timeFisherYates / trials
      ).toFixed(1)}ms\t\t${(timeCustom / timeFisherYates).toFixed(3)}x`
    )
  }
})

function time<T>(fn: () => T): { result: T; time: number } {
  const start = performance.now()
  const result = fn()
  const end = performance.now()
  return { result, time: end - start }
}
