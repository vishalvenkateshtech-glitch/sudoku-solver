from flask import Flask, request, jsonify, render_template
from solver import solve, generate_puzzle, is_valid_board
import copy
import concurrent.futures

app = Flask(__name__)

VALID_DIFFICULTIES = {"easy", "medium", "hard"}
SOLVE_TIMEOUT_SECS = 5

# Module-level executor — stays alive for the lifetime of the process.
# Using a context manager (with ...) would block the caller until the thread
# finishes, defeating the timeout entirely.
_executor = concurrent.futures.ThreadPoolExecutor(max_workers=4)


def _parse_board(data):
    """
    Validate and return the board from request data.
    Returns (board, error_message).  error_message is None on success.
    """
    if not isinstance(data, dict) or "board" not in data:
        return None, "Missing 'board' key"

    board = data["board"]

    if not isinstance(board, list) or len(board) != 9:
        return None, "Board must be a 9-element list"

    for r, row in enumerate(board):
        if not isinstance(row, list) or len(row) != 9:
            return None, f"Row {r} must be a 9-element list"
        for c, cell in enumerate(row):
            if not isinstance(cell, int) or cell < 0 or cell > 9:
                return None, f"Invalid value at ({r},{c}): must be integer 0-9"

    return board, None


def _solve_with_timeout(board, timeout=SOLVE_TIMEOUT_SECS):
    """
    Run solve() in a thread and wait up to `timeout` seconds for a result.
    Returns (solved: bool, timed_out: bool).

    The executor is module-level so future.result(timeout=...) returns to the
    caller immediately on timeout, rather than blocking until the thread exits.
    """
    future = _executor.submit(solve, board)
    try:
        result = future.result(timeout=timeout)
        return result, False
    except concurrent.futures.TimeoutError:
        future.cancel()   # no-op if already running, but cleans up if still queued
        return False, True


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/solve", methods=["POST"])
def solve_sudoku():
    data = request.get_json(silent=True)
    if data is None:
        return jsonify({"error": "Request body must be valid JSON"}), 400

    board, err = _parse_board(data)
    if err:
        return jsonify({"error": err}), 400

    # Pre-flight: reject boards whose clues already contradict each other
    ok, reason = is_valid_board(board)
    if not ok:
        return jsonify({"error": f"Invalid puzzle: {reason}"}), 422

    solved, timed_out = _solve_with_timeout(board)

    if timed_out:
        return jsonify({"error": "Solver timed out — puzzle may be too complex"}), 408
    if not solved:
        return jsonify({"error": "This puzzle has no solution"}), 422

    return jsonify({"solution": board})


@app.route("/generate", methods=["POST"])
def generate():
    data = request.get_json(silent=True)
    if data is None:
        return jsonify({"error": "Request body must be valid JSON"}), 400

    difficulty = data.get("difficulty", "easy")
    if not isinstance(difficulty, str):
        return jsonify({"error": "'difficulty' must be a string"}), 400
    difficulty = difficulty.strip().lower()
    if difficulty not in VALID_DIFFICULTIES:
        return jsonify({
            "error": f"Invalid difficulty '{difficulty}'. Choose from: easy, medium, hard"
        }), 400

    try:
        puzzle = generate_puzzle(difficulty)
    except Exception:
        app.logger.exception("Puzzle generation failed")
        return jsonify({"error": "Failed to generate puzzle"}), 500

    solved_board = copy.deepcopy(puzzle)
    solved = solve(solved_board)
    if not solved:
        app.logger.error("Generated puzzle turned out unsolvable — this is a bug")
        return jsonify({"error": "Generated puzzle could not be solved"}), 500

    return jsonify({"puzzle": puzzle, "solution": solved_board})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)