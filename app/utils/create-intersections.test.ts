import { describe, expect, test } from 'bun:test'
import {
  getTestsFromKey,
  getIndentFromKey,
  getFilterFromKey,
} from './create-intersections'
import { TestType } from './calculateIntersections'

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
    const mockVote = {
      testedA: true,
      testedB: true,
      testedC: true,
      testA: false,
      testB: false,
      testC: false,
    }

    // Test simple cases
    expect(getFilterFromKey('A')(mockVote)).toBe(true)
    expect(getFilterFromKey('AB')(mockVote)).toBe(true)
    expect(getFilterFromKey('ABC')(mockVote)).toBe(true)

    // Test exclusion cases
    expect(getFilterFromKey('B!A')({ ...mockVote, testedA: false })).toBe(true)
    expect(getFilterFromKey('B!A')({ ...mockVote, testedA: true })).toBe(false)
    expect(getFilterFromKey('BC!A')({ ...mockVote, testedA: false })).toBe(true)
    expect(getFilterFromKey('BC!A')({ ...mockVote, testedA: true })).toBe(false)
    expect(
      getFilterFromKey('C!A!B')({ ...mockVote, testedA: false, testedB: false })
    ).toBe(true)
    expect(getFilterFromKey('C!A!B')({ ...mockVote, testedA: true })).toBe(
      false
    )
  })
})
