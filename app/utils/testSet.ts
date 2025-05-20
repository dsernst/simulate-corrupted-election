export interface TestSet {
  testA: string
  testB: string
  testC: string
}

/**
 * Converts a shorthand string into a TestSet object.
 * Examples:
 * 'a500' -> { testA: '500', testB: '', testC: '' }
 * 'a500b500' -> { testA: '500', testB: '500', testC: '' }
 * @param shorthand The shorthand string to convert
 * @returns A TestSet object with the parsed values
 */
export function testSet(shorthand: string): TestSet {
  const result: TestSet = {
    testA: '',
    testB: '',
    testC: '',
  }

  // Regular expression to match patterns like 'a500', 'b500', 'c500'
  const pattern = /([abc])(\d+)/g
  let match

  while ((match = pattern.exec(shorthand)) !== null) {
    const [, test, count] = match
    switch (test) {
      case 'a':
        result.testA = count
        break
      case 'b':
        result.testB = count
        break
      case 'c':
        result.testC = count
        break
    }
  }

  return result
}
