import { TestRun } from './calculateIntersections'
import { SimulationResults, calculateTestResults } from './simulation'
import { MT19937 } from './mt19937'

// Simplified test request type for URL storage
export type TestRequest = {
  testA: string
  testB: string
  testC: string
}

// Helper to parse test configuration from URL
export function parseTestConfig(testsParam: string | null): TestRequest[] {
  if (!testsParam) return []

  // Format: "a10-c5-b20" where each value is prefixed with its type
  return testsParam.split('-').map((testGroup) => {
    const request: TestRequest = { testA: '', testB: '', testC: '' }
    // Each test group can have multiple values with type prefixes
    const parts = testGroup.split('.')
    for (const part of parts) {
      if (!part) continue
      const type = part[0]
      const value = part.slice(1)
      if (type === 'a') request.testA = value
      else if (type === 'b') request.testB = value
      else if (type === 'c') request.testC = value
    }
    return request
  })
}

// Helper to serialize test configuration for URL
export function serializeTestConfig(testRequests: TestRequest[]): string {
  // Convert each test request to a list of values with type prefixes
  return testRequests
    .map((req) => {
      const parts = []
      if (req.testA) parts.push(`a${req.testA}`)
      if (req.testB) parts.push(`b${req.testB}`)
      if (req.testC) parts.push(`c${req.testC}`)
      return parts.join('.')
    })
    .filter(Boolean)
    .join('-')
}

// Generate test runs from requests
export function generateTestRuns(
  testRequests: TestRequest[],
  simulation: SimulationResults,
  seed: number
): TestRun[] {
  if (testRequests.length === 0) return []

  const mt = new MT19937(seed)
  return testRequests.map((request, index) => {
    const results = calculateTestResults(
      request,
      simulation.compromisedVotes,
      simulation.totalVotes,
      mt
    )
    return {
      id: index + 1,
      results,
      timestamp: new Date(), // Use current time for all runs
    }
  })
}

// Get initial state from URL parameters
export function getInitialState(searchParams: URLSearchParams) {
  const seedParam = searchParams.get('seed')
  const seed = seedParam
    ? parseInt(seedParam, 10)
    : Math.floor(Math.random() * 1000000)
  const testRequests = parseTestConfig(searchParams.get('tests'))

  return {
    seed,
    testRequests,
  }
}

// Create URL parameters from state
export function createUrlParams(
  seed: number,
  testRequests: TestRequest[]
): URLSearchParams {
  const params = new URLSearchParams()
  params.set('seed', seed.toString())
  if (testRequests.length > 0) {
    params.set('tests', serializeTestConfig(testRequests))
  }
  return params
}
