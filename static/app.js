let grid = document.getElementById("grid");

let solution          = null;
let timerInterval     = null;
let startTime         = null;
let pausedElapsed     = 0;        // ms accumulated before a pause
let paused            = false;
let puzzle            = null;
let solved            = false;
let currentDifficulty = null;

const API_BASE = '__API_BASE__';

// ── Onboarding ────────────────────────────────────────────────────────────────
function dismissOnboarding() {
    document.getElementById('onboarding').classList.add('onboarding-hidden');
    localStorage.setItem('sudoku-seen', '1');
}
document.getElementById('onboarding').addEventListener('click', function(e) {
    if (e.target === this) dismissOnboarding();
});
(function initOnboarding() {
    if (localStorage.getItem('sudoku-seen'))
        document.getElementById('onboarding').classList.add('onboarding-hidden');
})();

// ── Dark mode ─────────────────────────────────────────────────────────────────
function toggleTheme() {
    const isDark = document.body.classList.toggle('dark');
    document.getElementById('themeIcon').textContent = isDark ? '☀' : '☾';
    localStorage.setItem('sudoku-theme', isDark ? 'dark' : 'light');
}
(function initTheme() {
    if (localStorage.getItem('sudoku-theme') === 'dark') {
        document.body.classList.add('dark');
        document.getElementById('themeIcon').textContent = '☀';
    }
})();

// ── Undo / Redo ───────────────────────────────────────────────────────────────
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

// ── Mistake highlighting ──────────────────────────────────────────────────────
function validateCell(input, index) {
    if (!solution) return;
    const val = input.value ? parseInt(input.value) : 0;
    if (val === 0)                                  input.classList.remove('mistake');
    else if (val !== solution[Math.floor(index/9)][index%9]) input.classList.add('mistake');
    else                                            input.classList.remove('mistake');
}

// ── Highlight related + same number ──────────────────────────────────────────
function highlightRelated(index) {
    const cells  = document.querySelectorAll('.cell');
    const row    = Math.floor(index / 9);
    const col    = index % 9;
    const boxRow = Math.floor(row / 3);
    const boxCol = Math.floor(col / 3);
    const selVal = cells[index].value;

    cells.forEach((cell, idx) => {
        const r = Math.floor(idx / 9), c = idx % 9;
        const related = r === row || c === col ||
                        (Math.floor(r/3) === boxRow && Math.floor(c/3) === boxCol);
        const sameNum = selVal !== '' && cell.value === selVal && idx !== index;
        cell.classList.toggle('highlight',        related && !sameNum);
        cell.classList.toggle('same-num',         sameNum && !related);
        cell.classList.toggle('same-num-related', sameNum && related);
    });
}

// ── Build 9×9 grid ────────────────────────────────────────────────────────────
for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
        const input = document.createElement("input");
        input.type      = "text";
        input.maxLength = 1;
        input.className = "cell";
        // Allow normal keyboard typing — no inputmode suppression

        input.oninput = function () {
            if (paused) { this.value = this.dataset.prev || ''; return; }
            const oldVal = this.dataset.prev || '';
            this.value = this.value.trim().replace(/[^1-9]/g, '').slice(0, 1);
            const cells = Array.from(document.querySelectorAll('.cell'));
            const idx   = cells.indexOf(this);
            pushUndo(idx, oldVal, this.value);
            this.dataset.prev = this.value;
            validateCell(this, idx);
            highlightRelated(idx);
            checkCompletion();
        };

        input.onfocus = function () {
            if (paused) { this.blur(); return; }
            const cells = Array.from(document.querySelectorAll('.cell'));
            cells.forEach(c => c.classList.remove('selected'));
            this.classList.add('selected');
            highlightRelated(cells.indexOf(this));
        };

        input.onmousedown = function () {
            const cells = Array.from(document.querySelectorAll('.cell'));
            cells.forEach(c => c.classList.remove('selected'));
            this.classList.add('selected');
            highlightRelated(cells.indexOf(this));
        };

        input.onkeydown = function (e) {
            if (paused) { e.preventDefault(); return; }
            if (e.key.startsWith('Arrow')) {
                e.preventDefault();
                const cells = Array.from(document.querySelectorAll('.cell'));
                let idx = cells.indexOf(this);
                if      (e.key === 'ArrowLeft'  && idx % 9 > 0) idx--;
                else if (e.key === 'ArrowRight' && idx % 9 < 8) idx++;
                else if (e.key === 'ArrowUp'    && idx >= 9)    idx -= 9;
                else if (e.key === 'ArrowDown'  && idx < 72)    idx += 9;
                cells[idx].focus();
                cells.forEach(c => c.classList.remove('selected'));
                cells[idx].classList.add('selected');
                highlightRelated(idx);
            }
            // Delete / Backspace clears cell
            if ((e.key === 'Delete' || e.key === 'Backspace') && !this.readOnly) {
                e.preventDefault();
                const cells = Array.from(document.querySelectorAll('.cell'));
                const idx   = cells.indexOf(this);
                const oldVal = this.value;
                this.value = '';
                this.dataset.prev = '';
                pushUndo(idx, oldVal, '');
                validateCell(this, idx);
                highlightRelated(idx);
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'z')                                    { e.preventDefault(); undo(); }
            if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) { e.preventDefault(); redo(); }
        };

        if (j % 3 === 0 && j !== 0) input.classList.add("left-border");
        if (i % 3 === 0 && i !== 0) input.classList.add("top-border");
        grid.appendChild(input);
    }
}

// ── Hint ──────────────────────────────────────────────────────────────────────
function giveHint() {
    if (!solution) { showMessage("Generate a puzzle first!"); return; }
    const cells = document.querySelectorAll('.cell');
    const empty = [];
    cells.forEach((cell, idx) => { if (!cell.readOnly && cell.value === '') empty.push(idx); });
    if (!empty.length) { showMessage("No empty cells left!"); return; }
    const idx  = empty[Math.floor(Math.random() * empty.length)];
    cells[idx].value    = solution[Math.floor(idx/9)][idx%9];
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
            const val = inputs[i*9+j].value;
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
        for (let i = 0; i < 9; i++)
            for (let j = 0; j < 9; j++) {
                inputs[i*9+j].value    = solution[i][j];
                inputs[i*9+j].readOnly = true;
                inputs[i*9+j].classList.remove('mistake');
            }
        solved = true;
    } catch (error) {
        alert("Network error: " + error.message);
        document.getElementById("solveBtn").disabled = false;
    }
}

// ── Clear & Reset ─────────────────────────────────────────────────────────────
function clearBoard() {
    document.querySelectorAll(".cell").forEach(cell => {
        cell.value = "";
        cell.readOnly = false;
        cell.dataset.prev = '';
        cell.classList.remove("clue","selected","highlight","mistake","hint-cell","same-num","same-num-related");
    });
    stopTimer();
    setPauseUI(false);
    document.getElementById("solveBtn").disabled = false;
    document.getElementById("timer").textContent = "00:00";
    document.getElementById("pauseBtn").style.display = "none";
    showMessage('');
    window.puzzle = null; puzzle = null; solution = null; solved = false;
    currentDifficulty = null;
    undoStack = []; redoStack = [];
    setDifficultyBadge(null);
}

function resetPuzzle() {
    if (solved)          { showMessage("Cannot reset after solving — use Clear Board."); return; }
    if (!window.puzzle)  { showMessage("No puzzle to reset!"); return; }
    document.querySelectorAll(".cell").forEach((cell, index) => {
        if (window.puzzle[Math.floor(index/9)][index%9] === 0) {
            cell.value = ""; cell.dataset.prev = '';
            cell.classList.remove("clue","mistake","hint-cell");
        }
        cell.classList.remove("selected","highlight","same-num","same-num-related");
    });
    stopTimer();
    setPauseUI(false);
    document.getElementById("solveBtn").disabled = false;
    document.getElementById("timer").textContent = "00:00";
    showMessage('');
    undoStack = []; redoStack = [];
    // Auto-restart timer
    autoStartTimer();
}

// ── New Game ──────────────────────────────────────────────────────────────────
function newGame() {
    if (!currentDifficulty) { showMessage("Choose a difficulty first!"); return; }
    generatePuzzle(currentDifficulty);
}

// ── Generate ──────────────────────────────────────────────────────────────────
async function generatePuzzle(level) {
    // Show loading state immediately so user knows something is happening
    showMessage("Generating puzzle…");
    document.querySelectorAll('.diff-btn').forEach(b => b.disabled = true);

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
        const data = await response.json();
        puzzle = data.puzzle; solution = data.solution;
        window.puzzle = puzzle; solved = false;
        currentDifficulty = level;
        undoStack = []; redoStack = [];

        stopTimer(); setPauseUI(false);
        document.getElementById("solveBtn").disabled = false;
        document.getElementById("timer").textContent = "00:00";
        document.getElementById("pauseBtn").style.display = "";
        showMessage('');
        setDifficultyBadge(level);

        const inputs = document.querySelectorAll(".cell");
        for (let i = 0; i < 9; i++)
            for (let j = 0; j < 9; j++) {
                const value = puzzle[i][j];
                const input = inputs[i*9+j];
                input.value = value === 0 ? "" : value;
                input.dataset.prev = input.value;
                input.readOnly = value !== 0;
                input.classList.remove('mistake','hint-cell','selected','highlight','same-num','same-num-related');
                value !== 0 ? input.classList.add("clue") : input.classList.remove("clue");
            }

        // Auto-start timer
        autoStartTimer();

    } catch (error) {
        alert("Network error: " + error.message);
    } finally {
        document.querySelectorAll('.diff-btn').forEach(b => b.disabled = false);
    }
}

// ── Timer ─────────────────────────────────────────────────────────────────────
function autoStartTimer() {
    stopTimer();
    pausedElapsed = 0;
    paused = false;
    startTime = Date.now();
    timerInterval = setInterval(updateTimer, 1000);
    lockPuzzle();
    solved = false;
}

function stopTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = null; startTime = null;
}

function lockPuzzle() {
    document.querySelectorAll(".cell").forEach((input, index) => {
        if (window.puzzle && window.puzzle[Math.floor(index/9)][index%9] !== 0)
            input.readOnly = true;
    });
}

function updateTimer() {
    if (paused) return;
    const elapsed = pausedElapsed + Math.floor((Date.now() - startTime) / 1000);
    const min = Math.floor(elapsed / 60);
    const sec = elapsed % 60;
    document.getElementById("timer").textContent =
        `${min.toString().padStart(2,'0')}:${sec.toString().padStart(2,'0')}`;
}

// ── Pause ─────────────────────────────────────────────────────────────────────
function togglePause() {
    if (!startTime && !paused) return;   // no active game
    paused = !paused;
    setPauseUI(paused);
    if (paused) {
        // accumulate elapsed before pausing
        pausedElapsed += Math.floor((Date.now() - startTime) / 1000);
        startTime = null;
    } else {
        // resume
        startTime = Date.now();
    }
}

function setPauseUI(isPaused) {
    document.getElementById('pause-overlay').style.display = isPaused ? 'flex' : 'none';
    document.getElementById('pauseBtn').textContent = isPaused ? '▶' : '⏸';
    document.getElementById('pauseBtn').title = isPaused ? 'Resume' : 'Pause';
}

function checkCompletion() {
    if (!startTime && !paused) return;
    const inputs = document.querySelectorAll(".cell");
    for (let i = 0; i < 9; i++)
        for (let j = 0; j < 9; j++) {
            const val = inputs[i*9+j].value;
            if (!val || parseInt(val) !== solution[i][j]) return;
        }
    const elapsed = pausedElapsed + Math.floor((Date.now() - (startTime || Date.now())) / 1000);
    stopTimer();
    setPauseUI(false);
    const min = Math.floor(elapsed/60), sec = elapsed%60;
    showMessage(`🎉 Solved in ${min}:${sec.toString().padStart(2,'0')}!`);
}

// ── Difficulty badge ──────────────────────────────────────────────────────────
function setDifficultyBadge(level) {
    document.getElementById('difficulty-badge').textContent =
        level ? level.charAt(0).toUpperCase() + level.slice(1) : '';
    document.querySelectorAll('.diff-btn').forEach(btn =>
        btn.classList.toggle('active-diff', btn.textContent.toLowerCase() === level));
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function showMessage(text) {
    document.getElementById("message").textContent = text;
}