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
  expect(s.get('A').compromises[0]).toBe(467) // Confirming it ran, by checking against known compromises for this seed + test combo.

  // Web GUI does it in ~2500ms
  expect(firstSetDuration).toBeGreaterThan(500) // getting ~600ms
  expect(firstSetDuration).toBeLessThan(2600)
})
