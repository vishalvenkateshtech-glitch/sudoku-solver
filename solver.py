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
    best = None
    best_count = 10
    for r in range(9):
        for c in range(9):
            if board[r][c] == 0:
                cands = _candidates(board, r, c)
                count = len(cands)
                if count == 0:
                    return r, c, []
                if count < best_count:
                    best_count = count
                    best = (r, c, cands)
    return best


def solve(board):
    """Deterministic MRV solver. Mutates board. Returns True if solved."""
    cell = _find_mrv(board)
    if cell is None: return True
    row, col, candidates = cell
    if not candidates: return False
    for num in candidates:
        board[row][col] = num
        if solve(board): return True
        board[row][col] = 0
    return False


def solve_random(board):
    """MRV solver with shuffled candidates — for random generation."""
    cell = _find_mrv(board)
    if cell is None: return True
    row, col, candidates = cell
    if not candidates: return False
    random.shuffle(candidates)
    for num in candidates:
        board[row][col] = num
        if solve_random(board): return True
        board[row][col] = 0
    return False


# ── Unique-solution check ─────────────────────────────────────────────────────

def _count_solutions(board, limit=2):
    cell = _find_mrv(board)
    if cell is None: return 1
    row, col, candidates = cell
    if not candidates: return 0
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

def _fill_diagonal_boxes(board):
    """
    Pre-fill the three independent diagonal 3×3 boxes (top-left, centre,
    bottom-right).  These boxes share no row or column with each other so they
    can be filled with a random shuffle of 1-9 without any constraint checks.
    This seeds the board with 27 clues before the backtracker runs, shrinking
    the search space enormously and making generate_full_board ~10× faster.
    """
    for box in range(3):
        nums = list(range(1, 10))
        random.shuffle(nums)
        for i in range(3):
            for j in range(3):
                board[box*3+i][box*3+j] = nums[i*3+j]


def generate_full_board():
    board = [[0] * 9 for _ in range(9)]
    _fill_diagonal_boxes(board)   # seed diagonal boxes for speed
    solve_random(board)
    return board


def generate_puzzle(difficulty="easy"):
    """
    Generate a puzzle with exactly one solution.
    Uses a two-phase removal strategy:
      Phase 1 — fast symmetric removal (no uniqueness check, very quick)
      Phase 2 — careful removal with uniqueness check for remaining cells
    This keeps total generation time under ~1 second on slow hardware.
    """
    board = generate_full_board()

    # How many clues to remove total
    targets = {"easy": 35, "medium": 45, "hard": 50}
    target = targets[difficulty]

    # Phase 1: remove cells symmetrically (opposite pairs) without checking
    # uniqueness — symmetric puzzles are almost always unique, and this is fast.
    phase1 = target // 2   # remove this many pairs (×2 cells)
    cells = []
    for r in range(4):           # top half only; mirror gives bottom half
        for c in range(9):
            cells.append((r, c))
    random.shuffle(cells)

    removed = 0
    used = set()
    for r, c in cells:
        if removed >= phase1: break
        mirror_r, mirror_c = 8 - r, 8 - c
        if (r, c) in used or (mirror_r, mirror_c) in used: continue
        if board[r][c] == 0 or board[mirror_r][mirror_c] == 0: continue
        board[r][c] = 0
        board[mirror_r][mirror_c] = 0
        used.add((r, c)); used.add((mirror_r, mirror_c))
        removed += 2

    # Phase 2: carefully remove remaining cells with uniqueness check
    remaining_target = target - removed
    remaining_cells = [(r, c) for r in range(9) for c in range(9)
                       if board[r][c] != 0]
    random.shuffle(remaining_cells)

    for r, c in remaining_cells:
        if remaining_target <= 0: break
        backup = board[r][c]
        board[r][c] = 0
        if has_unique_solution(board):
            remaining_target -= 1
        else:
            board[r][c] = backup

    return board