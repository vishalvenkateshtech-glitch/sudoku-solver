import random
import copy


# ── Board validation ──────────────────────────────────────────────────────────

def is_valid_board(board):
    """
    Return (True, None) if the board's given clues are self-consistent,
    (False, reason) otherwise.  Does NOT check whether the puzzle is solvable.
    """
    for row in range(9):
        seen = set()
        for col in range(9):
            v = board[row][col]
            if v == 0:
                continue
            if v in seen:
                return False, f"Duplicate {v} in row {row}"
            seen.add(v)

    for col in range(9):
        seen = set()
        for row in range(9):
            v = board[row][col]
            if v == 0:
                continue
            if v in seen:
                return False, f"Duplicate {v} in column {col}"
            seen.add(v)

    for br in range(3):
        for bc in range(3):
            seen = set()
            for i in range(3):
                for j in range(3):
                    v = board[br * 3 + i][bc * 3 + j]
                    if v == 0:
                        continue
                    if v in seen:
                        return False, f"Duplicate {v} in box ({br},{bc})"
                    seen.add(v)

    return True, None


# ── Core helpers ──────────────────────────────────────────────────────────────

def is_valid(board, row, col, num):
    # Row
    for i in range(9):
        if board[row][i] == num:
            return False
    # Column
    for i in range(9):
        if board[i][col] == num:
            return False
    # 3×3 box
    sr, sc = row - row % 3, col - col % 3
    for i in range(3):
        for j in range(3):
            if board[sr + i][sc + j] == num:
                return False
    return True


def solve(board):
    """
    Deterministic backtracking solver.
    Mutates `board` in-place.
    Returns True if solved, False if no solution exists.
    """
    for row in range(9):
        for col in range(9):
            if board[row][col] == 0:
                for num in range(1, 10):
                    if is_valid(board, row, col, num):
                        board[row][col] = num
                        if solve(board):
                            return True
                        board[row][col] = 0
                return False   # no number worked → unsolvable from here
    return True                # no empty cell → fully solved


def solve_random(board):
    """Backtracker that tries digits in random order — used for generation."""
    for row in range(9):
        for col in range(9):
            if board[row][col] == 0:
                nums = list(range(1, 10))
                random.shuffle(nums)
                for num in nums:
                    if is_valid(board, row, col, num):
                        board[row][col] = num
                        if solve_random(board):
                            return True
                        board[row][col] = 0
                return False
    return True


# ── Unique-solution check ─────────────────────────────────────────────────────

def _count_solutions(board, limit=2):
    """
    Count solutions up to `limit`, stopping early once reached.
    Returns the count (0, 1, or `limit`).
    """
    for row in range(9):
        for col in range(9):
            if board[row][col] == 0:
                count = 0
                for num in range(1, 10):
                    if is_valid(board, row, col, num):
                        board[row][col] = num
                        count += _count_solutions(board, limit)
                        board[row][col] = 0
                        if count >= limit:
                            return count
                return count
    return 1   # no empty cell → complete solution


def has_unique_solution(board):
    """Return True only if the puzzle has exactly one solution."""
    return _count_solutions(copy.deepcopy(board), limit=2) == 1


# ── Board generation ──────────────────────────────────────────────────────────

def generate_full_board():
    board = [[0] * 9 for _ in range(9)]
    solve_random(board)
    return board


def generate_puzzle(difficulty="easy"):
    """
    Generate a puzzle guaranteed to have exactly one solution.

    Removes cells one at a time in random order; skips any removal that would
    create a second solution.  Stops when the target clue count is reached or
    all cells have been tried.
    """
    board = generate_full_board()

    targets = {"easy": 35, "medium": 45, "hard": 55}
    target_removals = targets[difficulty]   # KeyError impossible — validated in app.py

    cells = [(r, c) for r in range(9) for c in range(9)]
    random.shuffle(cells)

    removed = 0
    for row, col in cells:
        if removed >= target_removals:
            break

        backup = board[row][col]
        board[row][col] = 0

        if has_unique_solution(board):
            removed += 1
        else:
            board[row][col] = backup

    return board