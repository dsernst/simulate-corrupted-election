import { TestType, VoteResult } from './calculateIntersections'

export interface Group {
  key: string
  indentLevel: number
  filter: (v: VoteResult) => boolean
}

/** Derive tests from key: 'AB!C' -> ['A', 'B'] */
export function getTestsFromKey(key: string): TestType[] {
  // Remove any !X parts, then split remaining letters
  return key.replace(/![A-Z]/g, '').split('') as TestType[]
}

// Helper to create group objects
export const createGroup = (
  key: string,
  indentLevel: number,
  customFilter?: (v: VoteResult) => boolean
): Group => ({
  key,
  indentLevel,
  filter:
    customFilter ?? ((v) => getTestsFromKey(key).every((t) => v[`tested${t}`])),
})

// Define all groups with canonical keys
export const intersectionGroups: Group[] = [
  // Individual tests
  ...(['A', 'B', 'C'] as const).map((test) => createGroup(test, 0)),

  // Two test overlaps
  createGroup('AB', 1),
  createGroup('B!A', 1, (v) => Boolean(v.testedB && !v.testedA)),
  createGroup('BC', 1),
  createGroup('C!B', 1, (v) => Boolean(v.testedC && !v.testedB)),

  // Three test overlaps
  createGroup('ABC', 2),
  createGroup('BC!A', 2, (v) => Boolean(v.testedB && v.testedC && !v.testedA)),
  createGroup('AC!B', 2, (v) => Boolean(v.testedA && v.testedC && !v.testedB)),
  createGroup('C!A!B', 2, (v) =>
    Boolean(v.testedC && !v.testedA && !v.testedB)
  ),
]
