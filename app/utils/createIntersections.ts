import { TestType, VoteResult } from './calculateIntersections'

export interface Group {
  key: string
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
  // For each group size, add all-positives first, then all negatives (sorted alphabetically)
  for (let i = 1; i <= tests.length; i++) {
    const combinations = generateCombinations(tests, i)
    // Collect all-positives
    const positives = combinations.map((combination) => combination.join(''))
    groups.push(...positives)
    // Collect all negatives (for i >= 2)
    if (i >= 2) {
      const allNegations: string[] = []
      for (const combination of combinations) {
        const negations = generateNegations(combination)
        allNegations.push(...negations)
      }
      allNegations.sort() // Sort alphabetically
      groups.push(...allNegations)
    }
  }
  return groups
}

// Memoize filter functions to avoid recreating them, only 19 possible
const filterCache = new Map<string, (v: VoteResult) => boolean>()

/** Derive filter function from key: 'B!A' -> (v) => v.testedB && !v.testedA */
export function getFilterFromKey(key: string): (v: VoteResult) => boolean {
  // Use cached filter if available
  if (filterCache.has(key)) return filterCache.get(key)!

  const included = getTestsFromKey(key)

  // excluded = allLetters - included
  const allLetters = key.replaceAll('!', '').split('') as TestType[]
  const excluded = allLetters.filter((letter) => !included.includes(letter))

  // Precompute property access paths to avoid string interpolation
  const includedPaths = included.map((t) => `tested${t}` as keyof VoteResult)
  const excludedPaths = excluded.map((t) => `tested${t}` as keyof VoteResult)

  /** Fast filter function: exit as soon as possible */
  const filter = (v: VoteResult) => {
    for (const path of includedPaths) if (!v[path]) return false
    for (const path of excludedPaths) if (v[path]) return false
    return true
  }

  // Cache the filter function
  filterCache.set(key, filter)

  return filter
}

/** Derive indent level from key: 'A' -> 0, 'AB' -> 1, 'AB!C' -> 2 */
export function getIndentFromKey(key: string): number {
  return key.replaceAll('!', '').length - 1
}

/** Derive tests from key: 'AB!C' -> ['A', 'B'] */
export function getTestsFromKey(key: string): TestType[] {
  // Remove any !X parts, then split remaining letters
  return key.replace(/![A-Z]/g, '').split('') as TestType[]
}

// Define all groups with canonical keys
export const intersectionGroups = generateIntersectingGroups(['A', 'B', 'C'])
