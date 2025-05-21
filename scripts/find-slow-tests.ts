import { $ } from 'bun'

const SLOW_THRESHOLD = 50

// ANSI color codes
const GRAY = '\x1b[90m'
const ORANGE = '\x1b[33m'
const RED = '\x1b[31m'
const GREEN = '\x1b[32m'
const RESET = '\x1b[0m'

// Run tests and capture output
const startTime = Date.now()
const { stderr } = await $`bun test`.quiet() // test results are in stderr, not stdout
const endTime = Date.now()
const duration = endTime - startTime

// Parse results into array of passing tests
const lines = stderr.toString().split('\n')
const passing = lines.filter((line) => line.includes('(pass)'))
console.log(
  `${passing.length} passing tests: ${GRAY}${duration}ms total${RESET}\n`
)

// Helper to extract test duration from line
const getMs = (line: string) => {
  const match = line.match(/\[(\d+).(\d+)ms\]/)
  if (!match) return null
  return parseInt(match[1])
}

// Process results
const slowTests = passing
  .filter((line) => {
    const ms = getMs(line)
    return ms && ms > SLOW_THRESHOLD
  })
  .sort((a, b) => (getMs(b) || 0) - (getMs(a) || 0)) // Sort slowest-to-fastest
  .map((l, i) => {
    // Adjust prefix
    let pretty = l
      .replace('(pass)', `${GRAY}${i + 1}.${RESET}`)
      .replace(/\[(\d+).(\d+)ms\]/, `${GRAY}[${RED}$1ms${GRAY}]${RESET}`)

    // Add this tests contribution % to total test time
    const pctOfTotal = ((getMs(l) || 0) / duration) * 100
    pretty += `\n   ${GRAY}(${pctOfTotal.toFixed(2)}%)${RESET}\n`

    return pretty
  })

// Print results
const hasSlowTests = slowTests.length > 0
console.log(
  `Found ${hasSlowTests ? RED : GREEN}${
    slowTests.length
  }${RESET} tests > ${ORANGE}${SLOW_THRESHOLD}ms${RESET}:\n`
)
slowTests.slice(0, 5).forEach((t) => console.log(t))

// Print if results were truncated
if (slowTests.length > 5) {
  console.log(`\n${GRAY}and ${slowTests.length - 5} more${RESET}`)
}

// Non-zero exit code if there were slow tests
if (hasSlowTests) process.exit(1)
