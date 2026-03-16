let grid = document.getElementById("grid");

let solution      = null;
let timerInterval = null;
let startTime     = null;
let puzzle        = null;
let solved        = false;
let currentDifficulty = null;   // ← track current difficulty for New Game

// ── API base URL ──────────────────────────────────────────────────────────────
// In production (Vercel) this is injected at build time via NEXT_PUBLIC_ or
// a simple replacement in vercel.json.  Locally it's empty so relative paths
// work as before.
const API_BASE = (typeof __API_BASE__ !== 'undefined' && __API_BASE__)
    ? __API_BASE__
    : '';

// ── Dark mode ─────────────────────────────────────────────────────────────────
function toggleTheme() {
    const isDark = document.body.classList.toggle('dark');
    document.getElementById('themeIcon').textContent = isDark ? '☀' : '☾';
    localStorage.setItem('sudoku-theme', isDark ? 'dark' : 'light');
}

// Restore saved preference
(function initTheme() {
    const saved = localStorage.getItem('sudoku-theme');
    if (saved === 'dark') {
        document.body.classList.add('dark');
        document.getElementById('themeIcon').textContent = '☀';
    }
})();

// ── Undo / Redo ────────────────────────────────────────────────────────────────
let undoStack = [];
let redoStack = [];

function pushUndo(index, oldVal, newVal) {
    undoStack.push({ index, oldVal, newVal });
    redoStack = [];
}

function undo() {
    if (!undoStack.length) return;
    const { index, oldVal } = undoStack.pop();
    const cells = document.querySelectorAll('.cell');
    redoStack.push({ index, oldVal, newVal: cells[index].value });
    cells[index].value = oldVal;
    validateCell(cells[index], index);
}

function redo() {
    if (!redoStack.length) return;
    const { index, newVal } = redoStack.pop();
    const cells = document.querySelectorAll('.cell');
    undoStack.push({ index, oldVal: cells[index].value, newVal });
    cells[index].value = newVal;
    validateCell(cells[index], index);
}

// ── Mistake highlighting ───────────────────────────────────────────────────────
function validateCell(input, index) {
    if (!solution) return;
    const row = Math.floor(index / 9);
    const col = index % 9;
    const val = input.value ? parseInt(input.value) : 0;
    if (val === 0) {
        input.classList.remove('mistake');
    } else if (val !== solution[row][col]) {
        input.classList.add('mistake');
    } else {
        input.classList.remove('mistake');
    }
}

// ── Highlight related cells + same number ─────────────────────────────────────
function highlightRelated(index) {
    const cells  = document.querySelectorAll('.cell');
    const row    = Math.floor(index / 9);
    const col    = index % 9;
    const boxRow = Math.floor(row / 3);
    const boxCol = Math.floor(col / 3);
    const selVal = cells[index].value;

    cells.forEach((cell, idx) => {
        const r = Math.floor(idx / 9);
        const c = idx % 9;
        const related  = r === row || c === col ||
                         (Math.floor(r / 3) === boxRow && Math.floor(c / 3) === boxCol);
        const sameNum  = selVal !== '' && cell.value === selVal && idx !== index;

        cell.classList.toggle('highlight',         related && !sameNum);
        cell.classList.toggle('same-num',          sameNum && !related);
        cell.classList.toggle('same-num-related',  sameNum && related);
    });
}

// ── Build the 9×9 grid ────────────────────────────────────────────────────────
for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
        const input = document.createElement("input");
        input.type      = "text";
        input.maxLength = 1;
        input.className = "cell";
        input.setAttribute('inputmode', 'none');   // suppress mobile keyboard — use numpad

        input.oninput = function () {
            const oldVal = this.dataset.prev || '';
            this.value = this.value.trim().replace(/[^1-9]/g, '').slice(0, 1);
            const cells = Array.from(document.querySelectorAll('.cell'));
            const idx   = cells.indexOf(this);
            pushUndo(idx, oldVal, this.value);
            this.dataset.prev = this.value;
            validateCell(this, idx);
            updateNumPadActive(this.value);
            highlightRelated(idx);
            checkCompletion();
        };

        input.onfocus = function () {
            const cells = Array.from(document.querySelectorAll('.cell'));
            cells.forEach(c => c.classList.remove('selected'));
            this.classList.add('selected');
            highlightRelated(cells.indexOf(this));
            updateNumPadActive(this.value);
        };

        input.onmousedown = function () {
            const cells = Array.from(document.querySelectorAll('.cell'));
            cells.forEach(c => c.classList.remove('selected'));
            this.classList.add('selected');
            highlightRelated(cells.indexOf(this));
        };

        input.onkeydown = function (e) {
            if (e.key.startsWith('Arrow')) {
                e.preventDefault();
                const cells = Array.from(document.querySelectorAll('.cell'));
                let idx     = cells.indexOf(this);
                if      (e.key === 'ArrowLeft'  && idx % 9 > 0) idx--;
                else if (e.key === 'ArrowRight' && idx % 9 < 8) idx++;
                else if (e.key === 'ArrowUp'    && idx >= 9)    idx -= 9;
                else if (e.key === 'ArrowDown'  && idx < 72)    idx += 9;
                cells[idx].focus();
                cells.forEach(c => c.classList.remove('selected'));
                cells[idx].classList.add('selected');
                highlightRelated(idx);
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'z')                      { e.preventDefault(); undo(); }
            if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) { e.preventDefault(); redo(); }
        };

        if (j % 3 === 0 && j !== 0) input.classList.add("left-border");
        if (i % 3 === 0 && i !== 0) input.classList.add("top-border");

        grid.appendChild(input);
    }
}

// ── Number pad (phone layout 3×4) ─────────────────────────────────────────────
// Row 1: 1 2 3
// Phone keypad layout:
// 1 2 3
// 4 5 6
// 7 8 9
// _ ⌫ _
function buildNumPad() {
    const pad = document.getElementById("numpad");
    pad.innerHTML = '';

    // Rows 1–3: digits 1–9
    [1, 2, 3, 4, 5, 6, 7, 8, 9].forEach(n => {
        const btn       = document.createElement("button");
        btn.textContent = n;
        btn.className   = "num-btn";
        btn.dataset.num = n;
        btn.onclick     = () => numPadInput(n);
        pad.appendChild(btn);
    });

    // Row 4: spacer | ⌫ | spacer
    const spacerL    = document.createElement("div");
    spacerL.className = "num-spacer";
    pad.appendChild(spacerL);

    const eraseBtn       = document.createElement("button");
    eraseBtn.innerHTML   = "⌫";
    eraseBtn.className   = "num-btn erase-btn";
    eraseBtn.onclick     = () => numPadInput(null);
    pad.appendChild(eraseBtn);

    const spacerR    = document.createElement("div");
    spacerR.className = "num-spacer";
    pad.appendChild(spacerR);
}

function numPadInput(num) {
    const selected = document.querySelector('.cell.selected');
    if (!selected || selected.readOnly) return;
    const cells  = Array.from(document.querySelectorAll('.cell'));
    const idx    = cells.indexOf(selected);
    const oldVal = selected.value;
    selected.value = num !== null ? String(num) : '';
    selected.dataset.prev = selected.value;
    pushUndo(idx, oldVal, selected.value);
    validateCell(selected, idx);
    updateNumPadActive(selected.value);
    highlightRelated(idx);
    checkCompletion();
}

function updateNumPadActive(val) {
    document.querySelectorAll('.num-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.num === val);
    });
}

buildNumPad();

// ── Difficulty badge ──────────────────────────────────────────────────────────
function setDifficultyBadge(level) {
    const badge = document.getElementById('difficulty-badge');
    badge.textContent = level ? level.charAt(0).toUpperCase() + level.slice(1) : '';

    // highlight active diff button
    document.querySelectorAll('.diff-btn').forEach(btn => {
        btn.classList.toggle('active-diff', btn.textContent.toLowerCase() === level);
    });
}

// ── Hint system ───────────────────────────────────────────────────────────────
function giveHint() {
    if (!solution) {
        showMessage("Generate a puzzle first!");
        return;
    }
    const cells = document.querySelectorAll('.cell');
    const empty = [];
    cells.forEach((cell, idx) => {
        if (!cell.readOnly && cell.value === '') empty.push(idx);
    });
    if (!empty.length) {
        showMessage("No empty cells left!");
        return;
    }
    const idx  = empty[Math.floor(Math.random() * empty.length)];
    const row  = Math.floor(idx / 9);
    const col  = idx % 9;
    cells[idx].value    = solution[row][col];
    cells[idx].readOnly = true;
    cells[idx].classList.add('hint-cell');
    cells[idx].classList.remove('mistake');
    checkCompletion();
}

// ── Solve ─────────────────────────────────────────────────────────────────────
async function solveSudoku() {
    const inputs = document.querySelectorAll(".cell");
    const board  = [];

    for (let i = 0; i < 9; i++) {
        board[i] = [];
        for (let j = 0; j < 9; j++) {
            const val = inputs[i * 9 + j].value;
            board[i][j] = val ? parseInt(val) : 0;
        }
    }

    try {
        document.getElementById("solveBtn").disabled = true;

        const response = await fetch(`${API_BASE}/solve`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ board })
        });

        if (!response.ok) {
            const err = await response.json();
            alert("Error: " + err.error);
            document.getElementById("solveBtn").disabled = false;
            return;
        }

        const data = await response.json();
        solution   = data.solution;

        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                inputs[i * 9 + j].value    = solution[i][j];
                inputs[i * 9 + j].readOnly = true;
                inputs[i * 9 + j].classList.remove('mistake');
            }
        }
        solved = true;

    } catch (error) {
        alert("Network error: " + error.message);
        document.getElementById("solveBtn").disabled = false;
    }
}

// ── Clear & Reset ─────────────────────────────────────────────────────────────
function clearBoard() {
    const inputs = document.querySelectorAll(".cell");
    inputs.forEach(cell => {
        cell.value = "";
        cell.readOnly = false;
        cell.dataset.prev = '';
        cell.classList.remove("clue", "selected", "highlight", "mistake", "hint-cell");
    });

    stopTimer();
    document.getElementById("solveBtn").disabled = false;
    document.getElementById("timer").textContent = "00:00";
    showMessage('');
    window.puzzle      = null;
    solution           = null;
    solved             = false;
    currentDifficulty  = null;
    undoStack          = [];
    redoStack          = [];
    setDifficultyBadge(null);
}

function resetPuzzle() {
    if (solved) {
        showMessage("Cannot reset after solving — use Clear Board.");
        return;
    }
    if (!window.puzzle) {
        showMessage("No puzzle to reset!");
        return;
    }

    const inputs = document.querySelectorAll(".cell");
    inputs.forEach((cell, index) => {
        const row = Math.floor(index / 9);
        const col = index % 9;
        if (window.puzzle[row][col] === 0) {
            cell.value = "";
            cell.dataset.prev = '';
            cell.classList.remove("clue", "mistake", "hint-cell");
        }
        cell.classList.remove("selected", "highlight");
    });

    stopTimer();
    document.getElementById("solveBtn").disabled = false;
    document.getElementById("timer").textContent = "00:00";
    showMessage('');
    undoStack = [];
    redoStack = [];
}

// ── New Game ──────────────────────────────────────────────────────────────────
// Regenerates a fresh puzzle at the same difficulty — no full clear needed.
function newGame() {
    if (!currentDifficulty) {
        showMessage("Choose a difficulty first!");
        return;
    }
    generatePuzzle(currentDifficulty);
}

// ── Generate ──────────────────────────────────────────────────────────────────
async function generatePuzzle(level) {
    try {
        const response = await fetch(`${API_BASE}/generate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ difficulty: level })
        });

        if (!response.ok) {
            const err = await response.json();
            alert("Error generating puzzle: " + err.error);
            return;
        }

        const data     = await response.json();
        puzzle         = data.puzzle;
        solution       = data.solution;
        window.puzzle  = puzzle;
        solved         = false;
        currentDifficulty = level;
        undoStack      = [];
        redoStack      = [];

        stopTimer();
        document.getElementById("solveBtn").disabled = false;
        document.getElementById("timer").textContent = "00:00";
        showMessage('');
        setDifficultyBadge(level);

        const inputs = document.querySelectorAll(".cell");
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                const value = puzzle[i][j];
                const input = inputs[i * 9 + j];
                input.value    = value === 0 ? "" : value;
                input.dataset.prev = input.value;
                input.readOnly = value !== 0;
                input.classList.remove('mistake', 'hint-cell', 'selected', 'highlight');
                if (value !== 0) input.classList.add("clue");
                else             input.classList.remove("clue");
            }
        }
    } catch (error) {
        alert("Network error: " + error.message);
    }
}

// ── Timer ─────────────────────────────────────────────────────────────────────
function startTimer() {
    if (!window.puzzle) {
        showMessage("Generate a puzzle first!");
        return;
    }
    if (startTime) return;

    startTime    = Date.now();
    timerInterval = setInterval(updateTimer, 1000);
    lockPuzzle();
    document.getElementById("solveBtn").disabled = true;
    showMessage("Timer started — fill the puzzle!");
    solved = false;
}

function stopTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = null;
    startTime     = null;
}

function lockPuzzle() {
    const inputs = document.querySelectorAll(".cell");
    inputs.forEach((input, index) => {
        const row = Math.floor(index / 9);
        const col = index % 9;
        if (window.puzzle[row][col] !== 0) input.readOnly = true;
    });
}

function updateTimer() {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const min     = Math.floor(elapsed / 60);
    const sec     = elapsed % 60;
    document.getElementById("timer").textContent =
        `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}

function checkCompletion() {
    if (!startTime) return;
    const inputs = document.querySelectorAll(".cell");
    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
            const val = inputs[i * 9 + j].value;
            if (!val || parseInt(val) !== solution[i][j]) return;
        }
    }
    stopTimer();
    const elapsed = Math.floor((Date.now() - (startTime || Date.now())) / 1000);
    const min = Math.floor(elapsed / 60);
    const sec = elapsed % 60;
    showMessage(`🎉 Solved in ${min}:${sec.toString().padStart(2, '0')}!`);
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function showMessage(text) {
    document.getElementById("message").textContent = text;
}