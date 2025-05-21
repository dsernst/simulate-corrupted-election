import { $ } from 'bun'

const GRAY = '\x1b[90m'
const ORANGE = '\x1b[33m'
const RED = '\x1b[31m'
const RESET = '\x1b[0m'
const SLOW_THRESHOLD = 50

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

const getMs = (line: string) => {
  const match = line.match(/\[(\d+).(\d+)ms\]/)
  if (!match) return null
  return parseInt(match[1])
}

const slowTests = passing
  .filter((line) => {
    const ms = getMs(line)
    return ms && ms > SLOW_THRESHOLD
  })
  .sort((a, b) => (getMs(b) || 0) - (getMs(a) || 0))
  .map((l, i) => {
    // Adjust prefix
    let pretty = l
      .replace('(pass)', `${GRAY}${i + 1}.${RESET}`)
      .replace(/\[(\d+).(\d+)ms\]/, `${GRAY}[${RED}$1ms${GRAY}]${RESET}`)

    const pctOfTotal = ((getMs(l) || 0) / duration) * 100
    pretty += `\n   ${GRAY}(${pctOfTotal.toFixed(2)}%)${RESET}\n`

    return pretty
  })

console.log(
  `Found ${RED}${slowTests.length}${RESET} tests > ${ORANGE}${SLOW_THRESHOLD}ms${RESET}:\n`
)
slowTests.slice(0, 5).forEach((t) => console.log(t))

if (slowTests.length > 5) {
  console.log(`\n${GRAY}and ${slowTests.length - 5} more${RESET}`)
}
