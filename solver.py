import random
import copy


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
    """Standard deterministic solver (used for the /solve endpoint)."""
    for row in range(9):
        for col in range(9):
            if board[row][col] == 0:
                for num in range(1, 10):
                    if is_valid(board, row, col, num):
                        board[row][col] = num
                        if solve(board):
                            return True
                        board[row][col] = 0
                return False
    return True


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
    Count solutions up to `limit`.  Stops as soon as it finds `limit` solutions
    so we never waste time exploring beyond what we need to know.
    Returns the count found (0, 1, or 2).
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
    return 1   # no empty cell found → this is a complete solution


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
    Generate a puzzle that is guaranteed to have exactly one solution.

    Strategy: start from a full board, shuffle all cell positions, then try
    removing each cell.  After every removal we check uniqueness; if the
    puzzle would become ambiguous we put the value back and skip that cell.
    We keep going until we've removed the target number of clues or exhausted
    all cells.
    """
    board = generate_full_board()

    targets = {"easy": 35, "medium": 45, "hard": 55}
    target_removals = targets.get(difficulty, 35)

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
            board[row][col] = backup   # restore — removing this cell breaks uniqueness

    return board