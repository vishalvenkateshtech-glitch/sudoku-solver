import os
import copy
import concurrent.futures
import sys

# Sudoku backtracking needs deeper recursion than Python's default 1000
sys.setrecursionlimit(10000)

from flask import Flask, request, jsonify
from flask_cors import CORS
from solver import solve, generate_puzzle, is_valid_board

app = Flask(__name__)

# CORS — set ALLOWED_ORIGIN in Render env vars, e.g. https://your-app.vercel.app
ALLOWED_ORIGIN = os.environ.get("ALLOWED_ORIGIN", "*")
CORS(app, resources={r"/*": {"origins": ALLOWED_ORIGIN}})

VALID_DIFFICULTIES  = {"easy", "medium", "hard"}
SOLVE_TIMEOUT_SECS  = 5


def _parse_board(data):
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
                return None, f"Invalid value at ({r},{c}): must be integer 0–9"
    return board, None


def _solve_with_timeout(board, timeout=SOLVE_TIMEOUT_SECS):
    with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
        future = executor.submit(solve, board)
        try:
            result = future.result(timeout=timeout)
            return result, False
        except concurrent.futures.TimeoutError:
            return False, True


@app.route("/health")
def health():
    return jsonify({"status": "ok"})


@app.route("/solve", methods=["POST"])
def solve_sudoku():
    data = request.get_json(silent=True)
    if data is None:
        return jsonify({"error": "Request body must be valid JSON"}), 400

    board, err = _parse_board(data)
    if err:
        return jsonify({"error": err}), 400

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
    if not solve(solved_board):
        app.logger.error("Generated puzzle turned out unsolvable — this is a bug")
        return jsonify({"error": "Generated puzzle could not be solved"}), 500

    return jsonify({"puzzle": puzzle, "solution": solved_board})


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)