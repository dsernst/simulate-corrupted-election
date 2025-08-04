#!/usr/bin/env node

import { Simulator } from './app/utils/simulator'
import packageJson from './package.json'

interface CLIInput {
  command:
    | 'confusion-matrices'
    | 'election'
    | 'full-simulation'
    | 'intersections'
    | 'run-tests'
  seed?: number
  tests?: string
}

interface CLIOutput {
  data?: unknown
  error?: string
  success: boolean
}

function main() {
  const input = parseArgs()

  // If we're reading from stdin, the command will be handled in parseArgs
  if (process.stdin.isTTY === false) {
    return
  }

  const result = runCommand(input)

  if (result.success) {
    console.log(JSON.stringify(result.data, null, 2))
  } else {
    console.error(JSON.stringify(result, null, 2))
    process.exit(1)
  }
}

function parseArgs(): CLIInput {
  const args = process.argv.slice(2)

  // Check if input is coming from stdin (JSON format)
  if (!process.stdin.isTTY) {
    let input = ''
    process.stdin.setEncoding('utf8')
    process.stdin.on('data', (chunk) => {
      input += chunk
    })
    process.stdin.on('end', () => {
      try {
        const parsed = JSON.parse(input.trim())
        const result = runCommand(parsed)
        if (result.success) {
          console.log(JSON.stringify(result.data, null, 2))
        } else {
          console.error(JSON.stringify(result, null, 2))
          process.exit(1)
        }
      } catch (error) {
        console.error('Error parsing JSON input:', error)
        process.exit(1)
      }
    })
    return { command: 'election' } // Placeholder, will be overridden
  }

  // Parse command line arguments
  const command = args[0] as CLIInput['command']
  if (!command) {
    printUsage()
    process.exit(0)
  }

  const input: CLIInput = { command }

  for (let i = 1; i < args.length; i += 2) {
    const flag = args[i]
    const value = args[i + 1]

    if (flag === '--seed') {
      input.seed = parseInt(value)
    } else if (flag === '--tests') {
      input.tests = value
    }
  }

  return input
}

function printUsage() {
  console.log(`
Election Simulator CLI v${packageJson.version.replace(/\.0$/, '')}

Usage: simulator <command> [options]

Commands:
  election              - Generate election results for a seed
  run-tests             - Run tests on an election
  intersections         - Calculate intersection statistics
  confusion-matrices    - Calculate confusion matrices
  full-simulation       - Run complete simulation with all outputs

Options:
  --seed <number>       - Random seed (default: random)
  --tests <string>      - Test configuration (e.g., "a500b100c50")

Examples:
  simulator election --seed 12345
  simulator run-tests --seed 12345 --tests "a500b100"
  simulator full-simulation --seed 12345 --tests "a500b100c50"

Input format (for programmatic use):
  echo '{"command": "election", "seed": 12345}' | simulator
`)
}

function runCommand(input: CLIInput): CLIOutput {
  try {
    const simulator = new Simulator(input.seed, input.tests || '')

    switch (input.command) {
      case 'confusion-matrices':
        if (!input.tests) {
          return {
            error:
              'Tests configuration required for confusion-matrices command',
            success: false,
          }
        }
        return {
          data: {
            confusionMatrices: simulator.getConfusionMatrices(),
            seed: simulator.seed,
            tests: input.tests,
          },
          success: true,
        }

      case 'election':
        return {
          data: {
            election: simulator.election,
            seed: simulator.seed,
          },
          success: true,
        }

      case 'full-simulation':
        if (!input.tests) {
          return {
            error: 'Tests configuration required for full-simulation command',
            success: false,
          }
        }
        return {
          data: {
            confusionMatrices: simulator.getConfusionMatrices(),
            election: simulator.election,
            intersections: simulator.getIntersections(),
            seed: simulator.seed,
            testRuns: simulator.testRuns,
            tests: input.tests,
            totalCompromisesSeen: simulator.totalCompromisesSeen,
          },
          success: true,
        }

      case 'intersections':
        if (!input.tests) {
          return {
            error: 'Tests configuration required for intersections command',
            success: false,
          }
        }
        return {
          data: {
            intersections: simulator.getIntersections(),
            seed: simulator.seed,
            tests: input.tests,
          },
          success: true,
        }

      case 'run-tests':
        if (!input.tests) {
          return {
            error: 'Tests configuration required for run-tests command',
            success: false,
          }
        }
        return {
          data: {
            seed: simulator.seed,
            testRuns: simulator.testRuns,
            tests: input.tests,
            totalCompromisesSeen: simulator.totalCompromisesSeen,
          },
          success: true,
        }

      default:
        return {
          error: `Unknown command: ${input.command}`,
          success: false,
        }
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : String(error),
      success: false,
    }
  }
}

// Handle stdin input
if (!process.stdin.isTTY) {
  parseArgs() // This will set up stdin handling
} else {
  main()
}
