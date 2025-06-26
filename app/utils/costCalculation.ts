export interface TestCosts {
  testA: number
  testB: number
  testC: number
}

// Default cost function based on the example provided
export const DEFAULT_TEST_COSTS: TestCosts = {
  testA: 0.03, // $0.03 per A test
  testB: 2, // $2.00 per B test
  testC: 20, // $20.00 per C test
}

export interface TestCounts {
  testA: string
  testB: string
  testC: string
}

/**
 * Calculate the cost of a single test run
 * @param testRun The test run results containing the number of tests run
 * @param costs Optional custom costs per test type. If not provided, uses DEFAULT_TEST_COSTS
 * @returns The cost of this test run
 */
export function calculateTestRunCost(
  testRun: { testBreakdown: { [key: string]: { count: number } } },
  costs: TestCosts = DEFAULT_TEST_COSTS
): number {
  let runCost = 0

  for (const [testType, test] of Object.entries(testRun.testBreakdown)) {
    const cost = costs[testType as keyof TestCosts]
    runCost += test.count * cost
  }

  return runCost
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
 * Calculate the total cost of all test runs
 * @param testRuns Array of test runs
 * @param costs Optional custom costs per test type. If not provided, uses DEFAULT_TEST_COSTS
 * @returns The total cost of all test runs
 */
export function calculateTotalTestRunsCost(
  testRuns: {
    results: { testBreakdown: { [key: string]: { count: number } } }
  }[],
  costs: TestCosts = DEFAULT_TEST_COSTS
): number {
  return testRuns.reduce((total, run) => {
    return (
      total +
      calculateTestRunCost({ testBreakdown: run.results.testBreakdown }, costs)
    )
  }, 0)
}

/**
 * Format a cost as a currency string
 * @param cost The cost to format
 * @returns Formatted cost string (e.g. "$1,234" or "$1,234.56")
 */
export function formatCost(cost: number): string {
  if (cost && cost < 1) return (cost * 100).toLocaleString() + '¢'

  // If the number has any decimal places, show exactly 2
  const hasDecimals = cost % 1 !== 0
  return new Intl.NumberFormat('en-US', {
    currency: 'USD',
    maximumFractionDigits: 2,
    minimumFractionDigits: hasDecimals ? 2 : 0,
    style: 'currency',
  }).format(cost)
}
