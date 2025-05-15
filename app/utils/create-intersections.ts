import { TestType, VoteResult } from './calculateIntersections'

export interface Group {
  key: string
  filter: (v: VoteResult) => boolean
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

// Helper to create group objects
export const createGroup = (
  key: string,
  customFilter?: (v: VoteResult) => boolean
): Group => ({
  key,
  filter:
    customFilter ?? ((v) => getTestsFromKey(key).every((t) => v[`tested${t}`])),
})

// Define all groups with canonical keys
export const intersectionGroups: Group[] = [
  // Individual tests
  ...(['A', 'B', 'C'] as const).map((test) => createGroup(test)),

  // Two test overlaps
  createGroup('AB'),
  createGroup('B!A', (v) => Boolean(v.testedB && !v.testedA)),
  createGroup('BC'),
  createGroup('C!B', (v) => Boolean(v.testedC && !v.testedB)),

  // Three test overlaps
  createGroup('ABC'),
  createGroup('BC!A', (v) => Boolean(v.testedB && v.testedC && !v.testedA)),
  createGroup('AC!B', (v) => Boolean(v.testedA && v.testedC && !v.testedB)),
  createGroup('C!A!B', (v) => Boolean(v.testedC && !v.testedA && !v.testedB)),
]
