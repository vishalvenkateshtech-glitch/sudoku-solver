import random
import copy


# ── Board validation ──────────────────────────────────────────────────────────

def is_valid_board(board):
    for row in range(9):
        seen = set()
        for col in range(9):
            v = board[row][col]
            if v == 0: continue
            if v in seen: return False, f"Duplicate {v} in row {row}"
            seen.add(v)
    for col in range(9):
        seen = set()
        for row in range(9):
            v = board[row][col]
            if v == 0: continue
            if v in seen: return False, f"Duplicate {v} in column {col}"
            seen.add(v)
    for br in range(3):
        for bc in range(3):
            seen = set()
            for i in range(3):
                for j in range(3):
                    v = board[br*3+i][bc*3+j]
                    if v == 0: continue
                    if v in seen: return False, f"Duplicate {v} in box ({br},{bc})"
                    seen.add(v)
    return True, None


# ── Core helpers ──────────────────────────────────────────────────────────────

def is_valid(board, row, col, num):
    for i in range(9):
        if board[row][i] == num: return False
    for i in range(9):
        if board[i][col] == num: return False
    sr, sc = row - row % 3, col - col % 3
    for i in range(3):
        for j in range(3):
            if board[sr+i][sc+j] == num: return False
    return True


def _candidates(board, row, col):
    used = set()
    for i in range(9): used.add(board[row][i])
    for i in range(9): used.add(board[i][col])
    sr, sc = row - row % 3, col - col % 3
    for i in range(3):
        for j in range(3):
            used.add(board[sr+i][sc+j])
    return [n for n in range(1, 10) if n not in used]


def _find_mrv(board):
    """Return the empty cell with the fewest valid candidates (MRV heuristic)."""
    best = None
    best_count = 10
    for r in range(9):
        for c in range(9):
            if board[r][c] == 0:
                count = len(_candidates(board, r, c))
                if count == 0:
                    return r, c, []        # dead end — no candidates at all
                if count < best_count:
                    best_count = count
                    best = (r, c, _candidates(board, r, c))
    return best   # None if board is full


def solve(board):
    """Deterministic solver with MRV. Mutates board. Returns True if solved."""
    cell = _find_mrv(board)
    if cell is None:
        return True   # no empty cells — solved
    row, col, candidates = cell
    if not candidates:
        return False  # dead end
    for num in candidates:
        board[row][col] = num
        if solve(board):
            return True
        board[row][col] = 0
    return False


def solve_random(board):
    """MRV solver with shuffled candidates — for random full-board generation."""
    cell = _find_mrv(board)
    if cell is None:
        return True
    row, col, candidates = cell
    if not candidates:
        return False
    random.shuffle(candidates)
    for num in candidates:
        board[row][col] = num
        if solve_random(board):
            return True
        board[row][col] = 0
    return False


# ── Unique-solution check ─────────────────────────────────────────────────────

def _count_solutions(board, limit=2):
    """Count solutions up to limit using MRV — stops early once limit is hit."""
    cell = _find_mrv(board)
    if cell is None:
        return 1      # complete solution found
    row, col, candidates = cell
    if not candidates:
        return 0      # dead end
    count = 0
    for num in candidates:
        board[row][col] = num
        count += _count_solutions(board, limit)
        board[row][col] = 0
        if count >= limit:
            return count
    return count


def has_unique_solution(board):
    return _count_solutions(copy.deepcopy(board), limit=2) == 1


# ── Board generation ──────────────────────────────────────────────────────────

def generate_full_board():
    board = [[0] * 9 for _ in range(9)]
    solve_random(board)
    return board


def generate_puzzle(difficulty="easy"):
    board = generate_full_board()

    # Lower hard cap to 50 — uniqueness checks get expensive beyond this
    targets = {"easy": 35, "medium": 45, "hard": 50}
    target_removals = targets[difficulty]

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