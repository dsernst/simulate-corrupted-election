import { describe, expect, it } from 'bun:test'

import { Simulator } from '../simulator'

/** This seed has 11k votes: quite small, for faster tests. */
export const SMALL_SEED = 689696

describe('Even test distribution', () => {
  it('should split B tests 50/50 between A and !A tested votes', () => {
    let simulator = new Simulator(SMALL_SEED)

    // Run A tests first
    simulator = simulator.test('a300')
    expect(simulator.testRuns[0].results.testBreakdown.testA.count).toBe(300)

    // Then run B tests
    simulator = simulator.test('b300')
    expect(simulator.testRuns[1].results.testBreakdown.testB.count).toBe(300)

    // Get intersections
    const intersections = simulator.getIntersections()
    const get = (key: string) => intersections.find((g) => g.key === key)

    // Verify B tests are split roughly 50/50
    const AB = get('AB')?.tested ?? 0
    const onlyB = get('B!A')?.tested ?? 0
    expect(Math.abs(AB - onlyB)).toBeLessThanOrEqual(2) // Allow for some randomness
  })

  it('should split C tests 25/25/25/25 across A/B combinations', () => {
    let simulator = new Simulator(SMALL_SEED)

    // Run A and B tests first
    simulator = simulator.test('a100b100')
    expect(simulator.testRuns[0].results.testBreakdown.testA.count).toBe(100)
    expect(simulator.testRuns[0].results.testBreakdown.testB.count).toBe(100)

    // Then run C tests
    simulator = simulator.test('c100')
    expect(simulator.testRuns[1].results.testBreakdown.testC.count).toBe(100)

    // Get intersections
    const intersections = simulator.getIntersections()
    const get = (key: string) => intersections.find((g) => g.key === key)

    // Get the intersection counts for C tests
    const ABC = get('ABC')?.tested ?? 0
    const AC = get('AC!B')?.tested ?? 0
    const BC = get('BC!A')?.tested ?? 0
    const C = get('C!A!B')?.tested ?? 0
    const totalC = ABC + AC + BC + C

    // Confirm tests ran
    expect(totalC).toBeGreaterThan(75)

    // Each quadrant should be roughly 25%
    const expected = totalC * 0.25
    const tolerance = totalC / 10 // Allow 10% deviation
    ;[ABC, AC, BC, C].forEach((subset) => {
      expect(Math.abs(subset - expected)).toBeLessThanOrEqual(tolerance)
    })
  })
})

describe('C test distribution edge cases', () => {
  it('should not throw or hang when testC is not divisible by 4', () => {
    // Try a range of C test counts not divisible by 4
    for (let c = 1; c <= 5; c++) {
      let simulator = new Simulator(SMALL_SEED)
      expect(() => {
        simulator = simulator.test(`a10b10c${c}`)
        const lastRun = simulator.testRuns[simulator.testRuns.length - 1]
        // The total number of C tests should match the request or be capped by available votes
        expect(lastRun.results.testBreakdown.testC.count).toBeLessThanOrEqual(c)
      }).not.toThrow()
    }
  })

  it('should distribute all C tests even if not divisible by 4', () => {
    let simulator = new Simulator(SMALL_SEED)
    simulator = simulator.test('a30b30c19')

    const lastRun = simulator.testRuns[simulator.testRuns.length - 1]
    // Should not hang and should assign all 19 C tests
    expect(lastRun.results.testBreakdown.testC.count).toBe(19)
  })
})
