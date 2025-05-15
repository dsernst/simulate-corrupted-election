import { describe, expect, test } from 'bun:test'
import { getTestsFromKey, getIndentFromKey } from './create-intersections'

describe('intersection groups', () => {
  test('should derive tests from key correctly', () => {
    // Test individual tests
    expect(getTestsFromKey('A')).toEqual(['A'])
    expect(getTestsFromKey('B')).toEqual(['B'])
    expect(getTestsFromKey('C')).toEqual(['C'])

    // Test two test combinations
    expect(getTestsFromKey('AB')).toEqual(['A', 'B'])
    expect(getTestsFromKey('B!A')).toEqual(['B'])
    expect(getTestsFromKey('BC')).toEqual(['B', 'C'])
    expect(getTestsFromKey('C!B')).toEqual(['C'])

    // Test three test combinations
    expect(getTestsFromKey('ABC')).toEqual(['A', 'B', 'C'])
    expect(getTestsFromKey('BC!A')).toEqual(['B', 'C'])
    expect(getTestsFromKey('AC!B')).toEqual(['A', 'C'])
    expect(getTestsFromKey('C!A!B')).toEqual(['C'])
  })

  test('should derive indent level from key correctly', () => {
    // Individual tests should have level 0
    expect(getIndentFromKey('A')).toBe(0)
    expect(getIndentFromKey('B')).toBe(0)
    expect(getIndentFromKey('C')).toBe(0)

    // Two test combinations should have level 1
    expect(getIndentFromKey('AB')).toBe(1)
    expect(getIndentFromKey('B!A')).toBe(1)
    expect(getIndentFromKey('BC')).toBe(1)
    expect(getIndentFromKey('C!B')).toBe(1)

    // Three test combinations should have level 2
    expect(getIndentFromKey('ABC')).toBe(2)
    expect(getIndentFromKey('BC!A')).toBe(2)
    expect(getIndentFromKey('AC!B')).toBe(2)
    expect(getIndentFromKey('C!A!B')).toBe(2)
  })
})
