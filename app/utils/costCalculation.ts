export interface TestCosts {
  testA: number
  testB: number
  testC: number
}

// Default cost function based on the example provided
const DEFAULT_TEST_COSTS: TestCosts = {
  testA: 0.1, // $0.10 per A test
  testB: 1.0, // $1.00 per B test
  testC: 20.0, // $20.00 per C test
}

export interface TestCounts {
  testA: string
  testB: string
  testC: string
}

/**
 * Calculate the total cost of running tests based on the number of tests and their costs
 * @param testCounts Object containing the number of tests to run for each type
 * @param costs Optional custom costs per test type. If not provided, uses DEFAULT_TEST_COSTS
 * @returns The total cost of running all tests
 */
export function calculateTotalCost(
  testCounts: TestCounts,
  costs: TestCosts = DEFAULT_TEST_COSTS
): number {
  let totalCost = 0

  // Convert string inputs to numbers and calculate cost for each test type
  for (const [testType, count] of Object.entries(testCounts)) {
    const numTests = parseInt(count) || 0
    totalCost += numTests * costs[testType as keyof TestCosts]
  }

  return totalCost
}

/**
 * Format a cost as a currency string
 * @param cost The cost to format
 * @returns Formatted cost string (e.g. "$1,234.56")
 */
export function formatCost(cost: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cost)
}
