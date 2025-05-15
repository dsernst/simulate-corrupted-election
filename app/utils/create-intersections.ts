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

/**
 * Generates all possible intersection groups for a given set of tests.
 * For example, with tests ['A', 'B', 'C'], it generates:
 * - Single tests: A, B, C
 * - Two tests (both positive): AB, BC, AC
 * - Two tests (one negative): A!B, A!C, B!A, B!C, C!A, C!B
 * - Three tests (all positive): ABC
 * - Three tests (one negative): AB!C, AC!B, BC!A
 * - Three tests (two negative): A!B!C, B!A!C, C!A!B
 */
export function generateIntersectingGroups(tests: TestType[]): string[] {
  /**
   * Generates all possible combinations of k items from an array.
   * For example, with items ['A', 'B', 'C'] and k=2, it returns:
   * [['A', 'B'], ['A', 'C'], ['B', 'C']]
   */
  function generateCombinations<T>(items: T[], k: number): T[][] {
    if (k === 0) return [[]]
    if (items.length === 0) return []

    const [first, ...rest] = items
    // Include first item in combinations of size k-1
    const withFirst = generateCombinations(rest, k - 1).map((combo) => [
      first,
      ...combo,
    ])
    // Exclude first item and get combinations of size k
    const withoutFirst = generateCombinations(rest, k)

    return [...withFirst, ...withoutFirst]
  }

  /**
   * Generates all possible ways to negate one or more tests in a combination.
   * For example, with tests ['A', 'B', 'C'], it generates:
   * - One negative: A!B, A!C, B!A, B!C, C!A, C!B
   * - Two negative: A!B!C, B!A!C, C!A!B
   * Note: Negated tests always come after positive tests
   */
  function generateNegations(tests: TestType[]): string[] {
    const negations: string[] = []

    // Generate all possible subsets of tests to negate
    // For each subset size from 1 to n-1
    for (let i = 1; i < tests.length; i++) {
      const subsets = generateCombinations(tests, i)

      for (const subset of subsets) {
        // Split tests into positive and negative
        const positive = tests.filter((test) => !subset.includes(test))
        const negative = subset

        // Combine them with positive tests first, then negative
        const result = [
          ...positive,
          ...negative.map((test) => `!${test}`),
        ].join('')
        negations.push(result)
      }
    }

    return negations
  }

  const groups: string[] = []

  // Generate combinations of increasing size (1 to n tests)
  for (let i = 1; i <= tests.length; i++) {
    // Get all possible combinations of i tests
    const combinations = generateCombinations(tests, i)

    for (const combination of combinations) {
      // Add the positive combination (e.g., 'AB' for tests A and B)
      groups.push(combination.join(''))

      // For combinations of 2 or more tests, generate negative variations
      // e.g., for 'AB' we generate 'A!B' and 'B!A'
      if (i >= 2) {
        const negations = generateNegations(combination)
        groups.push(...negations)
      }
    }
  }

  return groups
}

// Define all groups with canonical keys
export const intersectionGroups = generateIntersectingGroups([
  'A',
  'B',
  'C',
] as TestType[])
