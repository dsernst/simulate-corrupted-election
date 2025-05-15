import { describe, expect, test } from 'bun:test'
import {
  getTestsFromKey,
  getIndentFromKey,
  getFilterFromKey,
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
