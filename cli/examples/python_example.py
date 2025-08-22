#!/usr/bin/env python3
"""
Python example for calling the Election Simulator CLI
"""

import json
import subprocess
import sys
from pathlib import Path

def call_simulator_cli(input_data):
    """
    Call the simulator CLI with JSON input and return the result

    Args:
        input_data (dict): The input data to send to the CLI

    Returns:
        dict: The JSON response from the CLI
    """
    # Get the path to the CLI script
    cli_path = Path(__file__).parent.parent / "simulator"

    try:
        # Convert input to JSON string
        input_json = json.dumps(input_data)

        # Call the CLI with JSON input via stdin
        result = subprocess.run(
            [str(cli_path)],
            input=input_json,
            text=True,
            capture_output=True,
            check=True
        )

        # Parse the JSON response
        return json.loads(result.stdout)

    except subprocess.CalledProcessError as e:
        print(f"CLI Error: {e.stderr}", file=sys.stderr)
        return None
    except json.JSONDecodeError as e:
        print(f"JSON Error: {e}", file=sys.stderr)
        return None

def main():
    """Example usage of the simulator CLI from Python"""

    print("=== Election Simulator Python Example ===\n")

    # Example 1: Generate an election
    print("1. Generating election with seed 12345...")
    election_result = call_simulator_cli({
        "command": "election",
        "seed": 12345
    })

    if election_result:
        print(f"Election generated successfully!")
        print(f"Seed: {election_result['seed']}")
        print(f"Total votes: {election_result['election']['totalVotes']}")
        print(f"Compromised votes: {election_result['election']['compromisedVotes']}")
        print(f"Compromised percentage: {election_result['election']['compromisedPercentage']:.2f}%")
        print()

    # Example 2: Run tests on the election
    print("2. Running tests on the election...")
    test_result = call_simulator_cli({
        "command": "run-tests",
        "seed": 12345,
        "tests": "a500b100c50"
    })

    if test_result:
        print(f"Tests completed successfully!")
        print(f"Total compromises seen: {test_result['totalCompromisesSeen']}")
        print(f"Number of test runs: {len(test_result['testRuns'])}")
        print()

    # Example 3: Get intersection statistics
    print("3. Calculating intersection statistics...")
    intersection_result = call_simulator_cli({
        "command": "intersections",
        "seed": 12345,
        "tests": "a500b100c50"
    })

    if intersection_result:
        print(f"Intersections calculated successfully!")
        print(f"Number of intersection groups: {len(intersection_result['intersections'])}")
        for intersection in intersection_result['intersections']:
            print(f"  {intersection['key']}: {len(intersection['compromises'])} compromises")
        print()

    # Example 4: Full simulation
    print("4. Running full simulation...")
    full_result = call_simulator_cli({
        "command": "full-simulation",
        "seed": 12345,
        "tests": "a500b100c50"
    })

    if full_result:
        print(f"Full simulation completed successfully!")
        print(f"Election: {full_result['election']['totalVotes']} total votes")
        print(f"Tests: {full_result['tests']}")
        print(f"Test runs: {len(full_result['testRuns'])}")
        print(f"Intersections: {len(full_result['intersections'])}")
        print(f"Confusion matrices: {len(full_result['confusionMatrices'])}")
        print()

if __name__ == "__main__":
    main()