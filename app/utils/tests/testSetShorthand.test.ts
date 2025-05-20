import { describe, expect, it } from 'bun:test'
import { testSetShorthand } from '../testSetShorthand'

describe('testSetShorthand', () => {
  it('should convert single test shorthand', () => {
    expect(testSetShorthand('a500')).toEqual({
      testA: '500',
      testB: '',
      testC: '',
    })
  })

  it('should convert two test shorthand', () => {
    expect(testSetShorthand('a500b500')).toEqual({
      testA: '500',
      testB: '500',
      testC: '',
    })
  })

  it('should convert all three tests shorthand', () => {
    expect(testSetShorthand('a500b500c500')).toEqual({
      testA: '500',
      testB: '500',
      testC: '500',
    })
  })

  it('should handle different order of tests', () => {
    expect(testSetShorthand('b500a500')).toEqual({
      testA: '500',
      testB: '500',
      testC: '',
    })
  })

  it('should handle empty string', () => {
    expect(testSetShorthand('')).toEqual({
      testA: '',
      testB: '',
      testC: '',
    })
  })

  it('should handle invalid input gracefully', () => {
    expect(testSetShorthand('invalid')).toEqual({
      testA: '',
      testB: '',
      testC: '',
    })
  })

  it('should handle different numbers', () => {
    expect(testSetShorthand('a100b200c300')).toEqual({
      testA: '100',
      testB: '200',
      testC: '300',
    })
  })
})
