#!/usr/bin/env Rscript
# R example for calling the Election Simulator CLI

library(jsonlite)

#' Call the simulator CLI with JSON input and return the result
#'
#' @param input_data A list containing the input data to send to the CLI
#' @return A list containing the JSON response from the CLI, or NULL if error
call_simulator_cli <- function(input_data) {
  # Get the path to the CLI script
  cli_path <- file.path(dirname(dirname(getwd())), "cli.ts")

  tryCatch({
    # Convert input to JSON string
    input_json <- toJSON(input_data, auto_unbox = TRUE)

    # Call the CLI with JSON input via stdin
    result <- system2(
      "npx",
      args = c("tsx", cli_path),
      input = input_json,
      stdout = TRUE,
      stderr = TRUE
    )

    # Parse the JSON response
    return(fromJSON(result))

  }, error = function(e) {
    cat("Error calling CLI:", e$message, "\n")
    return(NULL)
  })
}

#' Main function demonstrating usage of the simulator CLI from R
main <- function() {
  cat("=== Election Simulator R Example ===\n\n")

  # Example 1: Generate an election
  cat("1. Generating election with seed 12345...\n")
  election_result <- call_simulator_cli(list(
    command = "election",
    seed = 12345
  ))

  if (!is.null(election_result)) {
    cat("Election generated successfully!\n")
    cat("Seed:", election_result$seed, "\n")
    cat("Total votes:", election_result$election$totalVotes, "\n")
    cat("Compromised votes:", election_result$election$compromisedVotes, "\n")
    cat("Compromised percentage:", round(election_result$election$compromisedPercentage, 2), "%\n")
    cat("\n")
  }

  # Example 2: Run tests on the election
  cat("2. Running tests on the election...\n")
  test_result <- call_simulator_cli(list(
    command = "run-tests",
    seed = 12345,
    tests = "a500b100c50"
  ))

  if (!is.null(test_result)) {
    cat("Tests completed successfully!\n")
    cat("Total compromises seen:", test_result$totalCompromisesSeen, "\n")
    cat("Number of test runs:", length(test_result$testRuns), "\n")
    cat("\n")
  }

  # Example 3: Get intersection statistics
  cat("3. Calculating intersection statistics...\n")
  intersection_result <- call_simulator_cli(list(
    command = "intersections",
    seed = 12345,
    tests = "a500b100c50"
  ))

  if (!is.null(intersection_result)) {
    cat("Intersections calculated successfully!\n")
    cat("Number of intersection groups:", length(intersection_result$intersections), "\n")
    for (intersection in intersection_result$intersections) {
      cat("  ", intersection$key, ": ", length(intersection$compromises), " compromises\n", sep = "")
    }
    cat("\n")
  }

  # Example 4: Full simulation
  cat("4. Running full simulation...\n")
  full_result <- call_simulator_cli(list(
    command = "full-simulation",
    seed = 12345,
    tests = "a500b100c50"
  ))

  if (!is.null(full_result)) {
    cat("Full simulation completed successfully!\n")
    cat("Election:", full_result$election$totalVotes, "total votes\n")
    cat("Tests:", full_result$tests, "\n")
    cat("Test runs:", length(full_result$testRuns), "\n")
    cat("Intersections:", length(full_result$intersections), "\n")
    cat("Confusion matrices:", length(full_result$confusionMatrices), "\n")
    cat("\n")
  }

  # Example 5: Batch processing with different seeds
  cat("5. Batch processing with different seeds...\n")
  seeds <- c(100, 200, 300, 400, 500)
  results <- list()

  for (i in seq_along(seeds)) {
    seed <- seeds[i]
    cat("  Processing seed", seed, "...\n")

    result <- call_simulator_cli(list(
      command = "election",
      seed = seed
    ))

    if (!is.null(result)) {
      results[[i]] <- result$election$compromisedPercentage
    }
  }

  if (length(results) > 0) {
    cat("Batch processing completed!\n")
    cat("Average compromised percentage:", round(mean(unlist(results)), 2), "%\n")
    cat("Range:", round(min(unlist(results)), 2), "% -", round(max(unlist(results)), 2), "%\n")
  }
}

# Run the main function if this script is executed directly
if (!interactive()) {
  main()
}