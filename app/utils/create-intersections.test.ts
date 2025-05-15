import { describe, expect, test } from 'bun:test'
import {
  getTestsFromKey,
  getIndentFromKey,
  getFilterFromKey,
  generateIntersectingGroups,
} from './create-intersections'
import { TestType, VoteResult } from './calculateIntersections'

type Key = string
type Indent = number
type Tests = TestType[]

describe('intersection groups', () => {
  const testCases: [Key, Indent, Tests][] = [
    // Individual tests
    ['A', 0, ['A']],
    ['B', 0, ['B']],
    ['C', 0, ['C']],

    // Two test combinations
    ['AB', 1, ['A', 'B']],
    ['B!A', 1, ['B']],
    ['BC', 1, ['B', 'C']],
    ['C!B', 1, ['C']],

    // Three test combinations
    ['ABC', 2, ['A', 'B', 'C']],
    ['BC!A', 2, ['B', 'C']],
    ['AC!B', 2, ['A', 'C']],
    ['C!A!B', 2, ['C']],
  ]

  test('should derive tests from key correctly', () => {
    testCases.forEach(([key, , tests]) => {
      expect(getTestsFromKey(key)).toEqual(tests)
    })
  })

  test('should derive indent level from key correctly', () => {
    testCases.forEach(([key, indent]) => {
      expect(getIndentFromKey(key)).toBe(indent)
    })
  })

  test('should derive filter function from key correctly', () => {
    type WasTested = [number, number, number]
    type ShouldPass = boolean
    const cases: [Key, WasTested, ShouldPass][] = [
      // Simple cases
      ['A', [1, 0, 1], true],
      ['AB', [1, 1, 1], true],
      ['ABC', [1, 1, 1], true],
      ['ABC', [1, 1, 0], false],

      // Exclusion cases
      ['B!A', [0, 1, 1], true],
      ['B!A', [1, 1, 1], false],
      ['BC!A', [0, 1, 1], true],
      ['BC!A', [1, 1, 1], false],
      ['C!A!B', [0, 0, 1], true],
      ['C!A!B', [1, 1, 1], false],
    ]

    /** Convert compressed [1, 0, 1] -> { testedA: true, testedB: false, testedC: true } */
    function mockVoteFromWasTested(wasTested: WasTested): VoteResult {
      return {
        testedA: !!wasTested[0],
        testedB: !!wasTested[1],
        testedC: !!wasTested[2],
        testA: undefined,
        testB: undefined,
        testC: undefined,
      }
    }

    // Run all our test cases
    for (const [key, wasTested, shouldPass] of cases) {
      const label = [key, wasTested, shouldPass].join()
      const filterFunc = getFilterFromKey(key)
      const mockVote = mockVoteFromWasTested(wasTested)
      expect(filterFunc(mockVote), label).toBe(shouldPass)
    }
  })
})

describe('generateIntersectionGroups', () => {
  const groups = generateIntersectingGroups(['A', 'B', 'C'] as TestType[])

  test('generates all expected combinations', () => {
    // Single tests
    const singleTests = ['A', 'B', 'C']
    singleTests.forEach((test) => {
      expect(groups).toContain(test)
    })

    // Two tests (both positive)
    const twoTests = ['AB', 'BC', 'AC']
    twoTests.forEach((test) => {
      expect(groups).toContain(test)
    })

    // Two tests (one negative)
    const twoTestsNegated = ['A!B', 'A!C', 'B!A', 'B!C', 'C!A', 'C!B']
    twoTestsNegated.forEach((test) => {
      expect(groups).toContain(test)
    })

    // Three tests (all positive)
    expect(groups).toContain('ABC')

    // Three tests (one negative)
    const threeTestsNegated = ['AB!C', 'AC!B', 'BC!A']
    threeTestsNegated.forEach((test) => {
      expect(groups).toContain(test)
    })

    // Three tests (two negative)
    const threeTestsTwoNegated = ['A!B!C', 'B!A!C', 'C!A!B']
    threeTestsTwoNegated.forEach((test) => {
      expect(groups).toContain(test)
    })

    // Verify we have the expected number of combinations
    // 3 single + 3 double positive + 6 double negative + 1 triple positive + 3 triple one negative + 3 triple two negative
    expect(groups.length).toBe(19)
  })

  test('orders all-positive before negative for two-test and three-test groups', () => {
    // Helper to get indices for group names
    const getIndex = (name: string) => groups.indexOf(name)

    // Two-test groups
    const twoPositives = ['AB', 'AC', 'BC'].map(getIndex)
    const twoNegatives = ['A!B', 'A!C', 'B!A', 'B!C', 'C!A', 'C!B'].map(
      getIndex
    )
    expect(Math.max(...twoPositives)).toBeLessThan(Math.min(...twoNegatives))

    // Three-test groups
    const threePositive = getIndex('ABC')
    const threeNegatives = [
      'AB!C',
      'AC!B',
      'BC!A',
      'A!B!C',
      'B!A!C',
      'C!A!B',
    ].map(getIndex)
    expect(threePositive).toBeLessThan(Math.min(...threeNegatives))
  })
})
