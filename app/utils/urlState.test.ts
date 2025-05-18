import { describe, expect, test } from 'bun:test'
import {
  parseTestConfig,
  serializeTestConfig,
  generateTestRuns,
  getInitialState,
  createUrlParams,
  type TestRequest,
} from './urlState'
import { SimulationResults } from './simulation'

describe('URL State Utilities', () => {
  describe('parseTestConfig', () => {
    test('handles empty input', () => {
      expect(parseTestConfig(null)).toEqual([])
      expect(parseTestConfig('')).toEqual([])
    })

    test('parses single test request', () => {
      expect(parseTestConfig('a10')).toEqual([
        { testA: '10', testB: '', testC: '' },
      ])
      expect(parseTestConfig('b20')).toEqual([
        { testA: '', testB: '20', testC: '' },
      ])
      expect(parseTestConfig('c5')).toEqual([
        { testA: '', testB: '', testC: '5' },
      ])
    })

    test('parses multiple test types in one request', () => {
      expect(parseTestConfig('a10.c5')).toEqual([
        { testA: '10', testB: '', testC: '5' },
      ])
      expect(parseTestConfig('a10.b20.c5')).toEqual([
        { testA: '10', testB: '20', testC: '5' },
      ])
    })

    test('parses multiple test requests', () => {
      expect(parseTestConfig('a10-b20')).toEqual([
        { testA: '10', testB: '', testC: '' },
        { testA: '', testB: '20', testC: '' },
      ])
      expect(parseTestConfig('a10.c5-b20-a1')).toEqual([
        { testA: '10', testB: '', testC: '5' },
        { testA: '', testB: '20', testC: '' },
        { testA: '1', testB: '', testC: '' },
      ])
    })
  })

  describe('serializeTestConfig', () => {
    test('handles empty input', () => {
      expect(serializeTestConfig([])).toBe('')
    })

    test('serializes single test request', () => {
      const requests: TestRequest[] = [{ testA: '10', testB: '', testC: '' }]
      expect(serializeTestConfig(requests)).toBe('a10')
    })

    test('serializes multiple test types in one request', () => {
      const requests: TestRequest[] = [{ testA: '10', testB: '20', testC: '5' }]
      expect(serializeTestConfig(requests)).toBe('a10.b20.c5')
    })

    test('serializes multiple test requests', () => {
      const requests: TestRequest[] = [
        { testA: '10', testB: '', testC: '5' },
        { testA: '', testB: '20', testC: '' },
        { testA: '1', testB: '', testC: '' },
      ]
      expect(serializeTestConfig(requests)).toBe('a10.c5-b20-a1')
    })
  })

  describe('roundtrip serialization', () => {
    test('preserves test requests through serialization', () => {
      const requests: TestRequest[] = [
        { testA: '10', testB: '20', testC: '5' },
        { testA: '1', testB: '', testC: '' },
      ]
      const serialized = serializeTestConfig(requests)
      const parsed = parseTestConfig(serialized)
      expect(parsed).toEqual(requests)
    })
  })

  describe('getInitialState', () => {
    test('generates random seed when none provided', () => {
      const params = new URLSearchParams()
      const { seed } = getInitialState(params)
      expect(typeof seed).toBe('number')
      expect(seed).toBeGreaterThanOrEqual(0)
      expect(seed).toBeLessThan(1000000)
    })

    test('uses provided seed', () => {
      const params = new URLSearchParams()
      params.set('seed', '12345')
      const { seed } = getInitialState(params)
      expect(seed).toBe(12345)
    })

    test('parses test requests from URL', () => {
      const params = new URLSearchParams()
      params.set('tests', 'a10.c5-b20')
      const { testRequests } = getInitialState(params)
      expect(testRequests).toEqual([
        { testA: '10', testB: '', testC: '5' },
        { testA: '', testB: '20', testC: '' },
      ])
    })
  })

  describe('createUrlParams', () => {
    test('creates URL parameters with seed', () => {
      const params = createUrlParams(12345, [])
      expect(params.get('seed')).toBe('12345')
      expect(params.get('tests')).toBeNull()
    })

    test('includes test requests in URL', () => {
      const requests: TestRequest[] = [{ testA: '10', testB: '20', testC: '5' }]
      const params = createUrlParams(12345, requests)
      expect(params.get('seed')).toBe('12345')
      expect(params.get('tests')).toBe('a10.b20.c5')
    })
  })

  describe('generateTestRuns', () => {
    test('generates test runs with correct IDs', () => {
      const simulation: SimulationResults = {
        winnerVotes: 1000,
        runnerUpVotes: 500,
        otherVotes: 100,
        totalVotes: 1600,
        compromisedVotes: 100,
        compromisedPercentage: 6.25,
        seed: 12345,
      }
      const requests: TestRequest[] = [
        { testA: '10', testB: '', testC: '' },
        { testA: '', testB: '20', testC: '' },
      ]
      const runs = generateTestRuns(requests, simulation, 12345)
      expect(runs).toHaveLength(2)
      expect(runs[0].id).toBe(1)
      expect(runs[1].id).toBe(2)
      expect(runs[0].timestamp).toBeInstanceOf(Date)
      expect(runs[1].timestamp).toBeInstanceOf(Date)
    })

    test('generates consistent results with same seed', () => {
      const simulation: SimulationResults = {
        winnerVotes: 1000,
        runnerUpVotes: 500,
        otherVotes: 100,
        totalVotes: 1600,
        compromisedVotes: 100,
        compromisedPercentage: 6.25,
        seed: 12345,
      }
      const requests: TestRequest[] = [{ testA: '10', testB: '', testC: '' }]
      const runs1 = generateTestRuns(requests, simulation, 12345)
      const runs2 = generateTestRuns(requests, simulation, 12345)

      // Compare everything except timestamps
      expect(runs1.length).toBe(runs2.length)
      runs1.forEach((run1, i) => {
        const run2 = runs2[i]
        expect(run1.id).toBe(run2.id)
        expect(run1.results).toEqual(run2.results)
        expect(run1.timestamp).toBeInstanceOf(Date)
        expect(run2.timestamp).toBeInstanceOf(Date)
      })
    })
  })
})
