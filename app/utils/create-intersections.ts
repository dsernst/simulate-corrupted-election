import { TestType, VoteResult } from './calculateIntersections'

export interface Group {
  key: string
}

/** Derive tests from key: 'AB!C' -> ['A', 'B'] */
export function getTestsFromKey(key: string): TestType[] {
  // Remove any !X parts, then split remaining letters
  return key.replace(/![A-Z]/g, '').split('') as TestType[]
}

/** Derive indent level from key: 'A' -> 0, 'AB' -> 1, 'AB!C' -> 2 */
export function getIndentFromKey(key: string): number {
  return key.replaceAll('!', '').length - 1
}

/** Derive filter function from key: 'B!A' -> (v) => v.testedB && !v.testedA */
export function getFilterFromKey(key: string): (v: VoteResult) => boolean {
  const included = getTestsFromKey(key)

  // Get all letters in the key
  const allLetters = key.replaceAll('!', '').split('') as TestType[]
  // Then subtract `included`, to get `excluded`
  const excluded = allLetters.filter((letter) => !included.includes(letter))

  return (v: VoteResult) =>
    included.every((t) => v[`tested${t}`]) &&
    excluded.every((t) => !v[`tested${t}`])
}

// Define all groups with canonical keys
export const intersectionGroups = [
  // Individual tests
  ...['A', 'B', 'C'],

  // Two test combinations
  ...['AB', 'B!A', 'BC', 'C!B'],

  // Three test combinations
  ...['ABC', 'BC!A', 'AC!B', 'C!A!B'],
]
