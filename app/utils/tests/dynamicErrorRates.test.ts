import { describe, expect, it } from 'bun:test'

import { pickErrorRates } from '../dynamicErrorRates'
import { MT19937 } from '../mt19937'

describe('dynamic error rates', () => {
  it('should generate effectiveness rates within expected ranges', () => {
    const mt = new MT19937(12345)
    const effectiveness = pickErrorRates(mt)

    type Range = [number, number]
    const expected: Record<
      string,
      { falseCleanRate: Range; falseCompromisedRate: Range }
    > = {
      testA: { falseCleanRate: [0.2, 0.6], falseCompromisedRate: [0.05, 0.2] },
      testB: {
        falseCleanRate: [0.05, 0.25],
        falseCompromisedRate: [0.02, 0.1],
      },
      testC: { falseCleanRate: [0, 0], falseCompromisedRate: [0, 0] },
    }

    const errorTypes = ['falseCleanRate', 'falseCompromisedRate'] as const

    Object.entries(effectiveness).forEach(([key, testEffectiveness]) => {
      errorTypes.forEach((errorType) => {
        expect(testEffectiveness[errorType]).toBeGreaterThanOrEqual(
          expected[key][errorType][0]
        )
        expect(testEffectiveness[errorType]).toBeLessThanOrEqual(
          expected[key][errorType][1]
        )
      })
    })
  })

  it('should generate consistent effectiveness rates for same seeds', () => {
    const mt = new MT19937(12345)
    const mt2 = new MT19937(12345)

    expect(pickErrorRates(mt)).toEqual(pickErrorRates(mt2))
  })

  it('should generate different effectiveness rates for different seeds', () => {
    const mt1 = new MT19937(12345)
    const mt2 = new MT19937(54321)

    const effectiveness1 = pickErrorRates(mt1)
    const effectiveness2 = pickErrorRates(mt2)

    // Different seeds should produce different effectiveness rates
    expect(effectiveness1.testA.falseCleanRate).not.toBe(
      effectiveness2.testA.falseCleanRate
    )
    expect(effectiveness1.testA.falseCompromisedRate).not.toBe(
      effectiveness2.testA.falseCompromisedRate
    )
    expect(effectiveness1.testB.falseCleanRate).not.toBe(
      effectiveness2.testB.falseCleanRate
    )
    expect(effectiveness1.testB.falseCompromisedRate).not.toBe(
      effectiveness2.testB.falseCompromisedRate
    )
  })
})
