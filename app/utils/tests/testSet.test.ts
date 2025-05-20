import { describe, expect, it } from 'bun:test'
import { testSet } from '../testSet'

describe('testSet', () => {
  it('should convert single test shorthand', () => {
    expect(testSet('a500')).toEqual({
      testA: '500',
      testB: '',
      testC: '',
    })
  })

  it('should convert two test shorthand', () => {
    expect(testSet('a500b500')).toEqual({
      testA: '500',
      testB: '500',
      testC: '',
    })
  })

  it('should convert all three tests shorthand', () => {
    expect(testSet('a500b500c500')).toEqual({
      testA: '500',
      testB: '500',
      testC: '500',
    })
  })

  it('should handle different order of tests', () => {
    expect(testSet('b500a500')).toEqual({
      testA: '500',
      testB: '500',
      testC: '',
    })
  })

  it('should handle empty string', () => {
    expect(testSet('')).toEqual({
      testA: '',
      testB: '',
      testC: '',
    })
  })

  it('should handle invalid input gracefully', () => {
    expect(testSet('invalid')).toEqual({
      testA: '',
      testB: '',
      testC: '',
    })
  })

  it('should handle different numbers', () => {
    expect(testSet('a100b200c300')).toEqual({
      testA: '100',
      testB: '200',
      testC: '300',
    })
  })
})
