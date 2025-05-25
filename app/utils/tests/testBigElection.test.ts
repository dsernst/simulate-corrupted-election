import { expect, it } from 'bun:test'

import { Simulator } from '../simulator'

const BIG_SEED = 790006 // 2m total_votes

const msSince = (startDate: Date) => new Date().getTime() - startDate.getTime()

it('it can simulate big elections quickly', () => {
  const initStart = new Date()
  // Initialize election
  const s = new Simulator(BIG_SEED)
  const { totalVotes } = s.election
  const initDuration = msSince(initStart)

  expect(totalVotes).toBe(2_028_787)
  // Initializes in less than 5ms
  expect(initDuration).toBeLessThan(10)

  // Simulate 1k A tests
  const firstSetStart = new Date()
  s.test('a1000')
  const firstSetDuration = msSince(firstSetStart)
  expect(s.get('A').compromises[0]).toBe(486) // Confirm it ran, checking against known compromises

  // Web GUI does it in ~300ms
  expect(firstSetDuration).toBeGreaterThan(10) // getting ~15ms
  expect(firstSetDuration).toBeLessThan(500)
  // console.log({ firstSetDuration })
})
