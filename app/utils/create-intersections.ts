import { VoteResult } from './calculateIntersections'

export interface Group {
  key: string
  indentLevel: number
  tests: ('A' | 'B' | 'C')[]
  filter: (v: VoteResult) => boolean
}

// Helper to create group objects
export const createGroup = (
  key: string,
  indentLevel: number,
  tests: ('A' | 'B' | 'C')[],
  customFilter?: (v: VoteResult) => boolean
): Group => ({
  key,
  indentLevel,
  tests,
  filter: customFilter ?? ((v) => tests.every((t) => v[`tested${t}`])),
})

// Define all groups with canonical keys
export const intersectionGroups: Group[] = [
  // Individual tests
  ...(['A', 'B', 'C'] as const).map((test) => createGroup(test, 0, [test])),

  // Two test overlaps
  createGroup('AB', 1, ['A', 'B']),
  createGroup('B!A', 1, ['B'], (v) => Boolean(v.testedB && !v.testedA)),
  createGroup('BC', 1, ['B', 'C']),
  createGroup('C!B', 1, ['C'], (v) => Boolean(v.testedC && !v.testedB)),

  // Three test overlaps
  createGroup('ABC', 2, ['A', 'B', 'C']),
  createGroup('BC!A', 2, ['B', 'C'], (v) =>
    Boolean(v.testedB && v.testedC && !v.testedA)
  ),
  createGroup('AC!B', 2, ['A', 'C'], (v) =>
    Boolean(v.testedA && v.testedC && !v.testedB)
  ),
  createGroup('C!A!B', 2, ['C'], (v) =>
    Boolean(v.testedC && !v.testedA && !v.testedB)
  ),
]
