import { type MT19937 } from './mt19937'
import { type TestEffectiveness } from './simTests'

/** Generate effectiveness rates for tests A and B based on MT19937 instance */
export function pickErrorRates(mt: MT19937): TestEffectiveness {
  return {
    testA: {
      falseCleanRate: 0.2 + mt.random() * 0.4, // between [0.2, 0.6] (20% to 60% chance of missing compromised votes)
      falseCompromisedRate: 0.05 + mt.random() * 0.15, // between [0.05, 0.2] (5% to 20% chance of false alarm)
    },
    testB: {
      falseCleanRate: 0.05 + mt.random() * 0.2, // between [0.05, 0.25] (5% to 25% chance of missing compromised votes)
      falseCompromisedRate: 0.02 + mt.random() * 0.08, // between [0.02, 0.1] (2% to 10% chance of false alarm)
    },
    testC: {
      falseCleanRate: 0, // Perfect detection of compromised votes
      falseCompromisedRate: 0, // Perfect detection of clean votes
    },
  }
}
