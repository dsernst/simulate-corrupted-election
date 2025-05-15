import { describe, expect, test } from 'bun:test'
import { getTestsFromKey } from './create-intersections'

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
})
