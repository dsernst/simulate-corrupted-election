import { describe, expect, it } from 'bun:test'

import {
  calculateTestRunCost,
  calculateTotalCost,
  calculateTotalTestRunsCost,
  formatCost,
} from '../costCalculation'

describe('costCalculation', () => {
  it('calculates total cost with default costs', () => {
    const testCounts = {
      testA: '1000', // 1000 A tests at $0.10 each = $100
      testB: '100', // 100 B tests at $1.00 each = $100
      testC: '10', // 10 C tests at $20.00 each = $200
    }

    const totalCost = calculateTotalCost(testCounts)
    expect(totalCost).toBe(430)
  })

  it('calculates total cost with custom costs', () => {
    const testCounts = {
      testA: '1000',
      testB: '100',
      testC: '10',
    }

    const customCosts = {
      testA: 0.03, // $0.03 per A test
      testB: 2.0, // $2.00 per B test
      testC: 50.0, // $50.00 per C test
    }

    const totalCost = calculateTotalCost(testCounts, customCosts)
    expect(totalCost).toBe(730) // (1000 * $0.03) + (100 * $2.00) + (10 * $50.00) = $730
  })

  it('handles empty or invalid test counts', () => {
    const testCounts = {
      testA: '',
      testB: 'invalid',
      testC: '0',
    }

    const totalCost = calculateTotalCost(testCounts)
    expect(totalCost).toBe(0)
  })

  it('formats costs as currency', () => {
    expect(formatCost(1234.56)).toBe('$1,234.56')
    expect(formatCost(0)).toBe('$0')
    expect(formatCost(0.1)).toBe('10¢')
    expect(formatCost(1000000)).toBe('$1,000,000')
    expect(formatCost(0.01)).toBe('1¢')
    expect(formatCost(1)).toBe('$1')
    expect(formatCost(1.5)).toBe('$1.50')
    expect(formatCost(1.05)).toBe('$1.05')
  })

  it('calculates cost of a test run', () => {
    const testRun = {
      testBreakdown: {
        testA: { count: 1000 },
        testB: { count: 100 },
        testC: { count: 10 },
      },
    }

    const runCost = calculateTestRunCost(testRun)
    expect(runCost).toBe(430)
  })

  it('calculates cost of a test run with custom costs', () => {
    const testRun = {
      testBreakdown: {
        testA: { count: 1000 },
        testB: { count: 100 },
        testC: { count: 10 },
      },
    }

    const customCosts = {
      testA: 0.03, // $0.03 per A test
      testB: 2.0, // $2.00 per B test
      testC: 50.0, // $50.00 per C test
    }

    const runCost = calculateTestRunCost(testRun, customCosts)
    expect(runCost).toBe(730) // (1000 * $0.03) + (100 * $2.00) + (10 * $50.00) = $730
  })

  it('calculates total cost of all test runs', () => {
    const testRuns = [
      {
        results: {
          testBreakdown: {
            testA: { count: 1000 },
            testB: { count: 100 },
            testC: { count: 10 },
          },
        },
      },
      {
        results: {
          testBreakdown: {
            testA: { count: 500 },
            testB: { count: 50 },
            testC: { count: 5 },
          },
        },
      },
    ]

    const totalCost = calculateTotalTestRunsCost(testRuns)
    expect(totalCost).toBe(645)
  })

  it('calculates total cost of all test runs with custom costs', () => {
    const testRuns = [
      {
        results: {
          testBreakdown: {
            testA: { count: 1000 },
            testB: { count: 100 },
            testC: { count: 10 },
          },
        },
      },
      {
        results: {
          testBreakdown: {
            testA: { count: 500 },
            testB: { count: 50 },
            testC: { count: 5 },
          },
        },
      },
    ]

    const customCosts = {
      testA: 0.03, // $0.03 per A test
      testB: 2.0, // $2.00 per B test
      testC: 50.0, // $50.00 per C test
    }

    const totalCost = calculateTotalTestRunsCost(testRuns, customCosts)
    expect(totalCost).toBe(1095) // ($30 + $200 + $500) + ($15 + $100 + $250) = $1,095
  })
})
