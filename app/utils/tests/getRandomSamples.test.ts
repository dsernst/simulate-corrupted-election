import { it } from 'bun:test'

import {
  getRandomSampleCustom,
  getRandomSampleViaFisherYates,
} from '../getRandomSample'
import { MT19937 } from '../mt19937'

it('benchmarks getRandomSample techniques', () => {
  // This test is for tuning the getRandomSample crossover point
  // It takes 2min to run, so we disable, except for when we want to run it again

  // The observed result is that both `bun` and Safari, at nearly all >300k array lengths (where sampling time begins to matter), "crossover" around a ratio of 0.6.
  // Below that, the our "custom" Set based method is faster.
  // Above that, doing an in-place Fisher-Yates, then taking a slice is faster.

  return

  const arraySizes = [1e4, 1e5, 3.3e5, 6.6e5, 1e6, 3.3e6, 6.6e6, 1e7] // 10k -> 10M

  for (const arraySize of arraySizes) {
    console.log(`\nArray size: ${arraySize}`)

    const ratios = [0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]
    const trials = 3
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
  }
})

function time<T>(fn: () => T): { result: T; time: number } {
  const start = performance.now()
  const result = fn()
  const end = performance.now()
  return { result, time: end - start }
}
