# Election Simulator CLI

This CLI allows you to run the election simulator from any programming language that can execute shell commands and parse JSON.

## Installation

Make sure you have Node.js installed, then install dependencies:

```bash
npm install
```

## Usage

### Command Line Interface

The CLI supports both command-line arguments and JSON input via stdin.

#### Command Line Arguments

```bash
# Generate an election
simulator election --seed 12345

# Run tests on an election
simulator run-tests --seed 12345 --tests "a500b100c50"

# Get intersection statistics
simulator intersections --seed 12345 --tests "a500b100c50"

# Get confusion matrices
simulator confusion-matrices --seed 12345 --tests "a500b100c50"

# Run full simulation
simulator full-simulation --seed 12345 --tests "a500b100c50"
```

#### JSON Input via stdin

```bash
# Generate an election
echo '{"command": "election", "seed": 12345}' | simulator

# Run tests
echo '{"command": "run-tests", "seed": 12345, "tests": "a500b100c50"}' | simulator

# Full simulation
echo '{"command": "full-simulation", "seed": 12345, "tests": "a500b100c50"}' | simulator
```

## Available Commands

- `election` - Generate election results for a given seed
- `run-tests` - Run tests on an election (requires `tests` parameter)
- `intersections` - Calculate intersection statistics (requires `tests` parameter)
- `confusion-matrices` - Calculate confusion matrices (requires `tests` parameter)
- `full-simulation` - Run complete simulation with all outputs (requires `tests` parameter)

## Parameters

- `seed` (optional) - Random seed for reproducible results (default: random)
- `tests` (required for most commands) - Test configuration string (e.g., "a500b100c50")

## Test Configuration Format

The `tests` parameter uses a shorthand format:

- `a500` = 500 Test A samples
- `b100` = 100 Test B samples
- `c50` = 50 Test C samples
- Combine with hyphens: `a500b100c50`

## Integration Examples

### Python

```python
import json
import subprocess

def call_simulator(input_data):
    input_json = json.dumps(input_data)
    result = subprocess.run(
        ["simulator"],
        input=input_json,
        text=True,
        capture_output=True,
        check=True
    )
    return json.loads(result.stdout)

# Example usage
result = call_simulator({
    "command": "election",
    "seed": 12345
})
print(f"Compromised percentage: {result['election']['compromisedPercentage']}%")
```

### R

```r
library(jsonlite)

call_simulator <- function(input_data) {
  input_json <- toJSON(input_data, auto_unbox = TRUE)
  result <- system2("simulator", input = input_json, stdout = TRUE)
  return(fromJSON(result))
}

# Example usage
result <- call_simulator(list(
  command = "election",
  seed = 12345
))
cat("Compromised percentage:", result$election$compromisedPercentage, "%\n")
```

### JavaScript/Node.js

```javascript
const { spawn } = require('child_process')

function callSimulator(inputData) {
  return new Promise((resolve, reject) => {
    const child = spawn('simulator')
    let output = ''

    child.stdout.on('data', (data) => {
      output += data.toString()
    })

    child.on('close', (code) => {
      if (code === 0) {
        resolve(JSON.parse(output))
      } else {
        reject(new Error(`CLI exited with code ${code}`))
      }
    })

    child.stdin.write(JSON.stringify(inputData))
    child.stdin.end()
  })
}

// Example usage
callSimulator({
  command: 'election',
  seed: 12345,
}).then((result) => {
  console.log(
    `Compromised percentage: ${result.election.compromisedPercentage}%`
  )
})
```

### Julia

```julia
using JSON3
using Base.Process

function call_simulator(input_data)
    input_json = JSON3.write(input_data)
    cmd = `simulator`
    result = read(cmd, String; input=input_json)
    return JSON3.read(result)
end

# Example usage
result = call_simulator(Dict(
    "command" => "election",
    "seed" => 12345
))
println("Compromised percentage: $(result.election.compromisedPercentage)%")
```

## Output Format

All commands return JSON output with the following structure:

```json
{
  "success": true,
  "data": {
    // Command-specific data
  }
}
```

### Election Command Output

```json
{
  "seed": 12345,
  "election": {
    "totalVotes": 1500000,
    "winnerVotes": 800000,
    "runnerUpVotes": 600000,
    "otherVotes": 100000,
    "compromisedVotes": 75000,
    "compromisedPercentage": 5.0
  }
}
```

### Full Simulation Output

```json
{
  "seed": 12345,
  "tests": "a500b100c50",
  "election": {
    /* election data */
  },
  "testRuns": [
    /* test run data */
  ],
  "intersections": [
    /* intersection statistics */
  ],
  "confusionMatrices": [
    /* confusion matrices */
  ],
  "totalCompromisesSeen": 42
}
```

## Error Handling

Errors are returned in the same JSON format:

```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

## Examples Directory

See the `examples/` directory for complete working examples in Python and R.

## Performance Notes

- The simulator uses caching for better performance on repeated operations
- For batch processing, consider using different seeds for each simulation
- The CLI is designed to be stateless - each call is independent
