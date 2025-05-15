import { describe, expect, test } from 'bun:test'
import { getTestsFromKey, getIndentFromKey } from './create-intersections'
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
})
