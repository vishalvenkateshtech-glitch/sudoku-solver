# Sudoku Solver

A comprehensive web-based Sudoku application built with **Python, Flask, and JavaScript**. Features an interactive 9×9 grid with puzzle generation, solving, timer functionality, and advanced user experience features.

---

## Features

### Core Functionality

* **Manual Puzzle Entry**: Enter Sudoku puzzles manually in the interactive grid
* **Instant Solving**: Solve puzzles instantly using an optimized backtracking algorithm
* **Puzzle Generation**: Generate random puzzles with three difficulty levels (Easy, Medium, Hard)
* **Solution Validation**: Ensures generated puzzles have exactly one unique solution

### User Experience

* **Interactive Grid**: Click cells to select, use arrow keys for navigation
* **Visual Feedback**: Selected cells highlight with related row/column/box guidance
* **Input Validation**: Only accepts valid digits (1-9) with automatic filtering
* **Cell Locking**: Generated clues are locked to prevent modification
* **Visual Distinction**: Clues appear in blue, user inputs in black

### Advanced Features

* **Timer Mode**: Start timer for challenge mode, tracks solving time
* **Error Handling**: Comprehensive validation and user-friendly error messages
* **Responsive Design**: Clean, modern interface with CSS Grid layout
* **Keyboard Navigation**: Full arrow key support for grid navigation

---

## Tech Stack

Backend

* Python 3.x
* Flask (web framework)
* Custom backtracking solver

Frontend

* HTML5
* CSS3 (Grid layout, responsive design)
* Vanilla JavaScript (ES6+)

Algorithm

* Backtracking with constraint satisfaction
* Random puzzle generation with uniqueness validation

---

## How It Works

1. **Puzzle Generation**: Select difficulty to generate a random puzzle with unique solution
2. **Manual Entry**: Click cells and enter numbers (1-9) or leave blank
3. **Timer Challenge**: Click "Start" to begin timed solving session
4. **Navigation**: Use mouse clicks or arrow keys to move around the grid
5. **Visual Aids**: Selected cells highlight entire row, column, and 3×3 box
6. **Solving**: Click "Solve" for instant solution or solve manually with timer
7. **Validation**: Real-time input filtering and comprehensive error checking

---

## Project Structure

```
Sudoku Solver/
│
├─ solver.py              # Core backtracking algorithm & puzzle generation
├─ test_solver.py         # Unit tests for solver functionality
├─ app.py                 # Flask backend with API endpoints
├─ README.MD              # This file
│
├─ templates/
│   └─ index.html         # Main web interface
│
└─ static/
    ├─ style.css          # Grid styling & responsive design
    └─ app.js             # Frontend logic & user interactions
```

---

## Installation & Setup

1. **Clone or download** the project

2. **Install dependencies**:

   ```bash
   pip install flask
   ```

3. **Run the application**:

   ```bash
   python app.py
   ```

4. **Open in browser**:

   http://127.0.0.1:5000

## Usage Guide

### Basic Solving

1. Enter numbers in the grid (leave blanks empty)
2. Click **Solve** for instant solution
3. Use **Clear Board** to reset

### Puzzle Generation

1. Click **Easy/Medium/Hard** to generate random puzzle
2. Clues (given numbers) appear in blue and are locked
3. Fill in the blanks manually

### Timer Challenge

1. Generate or enter a puzzle
2. Click **Start** to begin timer
3. Solve manually - timer stops when complete
4. Use **Reset Puzzle** to try again (keeps same clues)

### Navigation

* **Mouse**: Click any cell to select

* **Keyboard**: Use arrow keys to move selection
* **Visual**: Selected cell + related cells highlight automatically

---

## API Endpoints

### `GET /`

Returns the main web interface

### `POST /solve`

Solves a provided Sudoku puzzle

**Request Body:**

```json
{
  "board": [[int...], ...]  // 9x9 array, 0 for empty cells
}
```

**Response:**

```json
{
  "solution": [[int...], ...]  // Solved 9x9 array
}
```

**Error Responses:**

* `400`: Invalid board format, unsolvable puzzle
* `500`: Solver crashed

### `POST /generate`

Generates a random Sudoku puzzle

**Request Body:**

```json
{
  "difficulty": "easy|medium|hard"
}
```

**Response:**

```json
{
  "puzzle": [[int...], ...],    // Puzzle with some cells filled
  "solution": [[int...], ...]   // Complete solution
}
```

---

## Testing

Run the test suite:

```bash
python test_solver.py
```

This validates the solver algorithm and puzzle generation.

---

## Algorithm Details

### Backtracking Solver

* **Time Complexity**: O(1) for typical puzzles (9!^9 worst case, but optimized)

* **Space Complexity**: O(1) (fixed 9x9 grid)
* **Average Performance**: ~0.03 seconds per solve

### Puzzle Generation

1. Generate complete valid solution
2. Remove numbers randomly while ensuring uniqueness
3. Validate each removal maintains single solution
4. Difficulty based on number of removed cells

### Validation

* **Row/Column/Box constraints**: Standard Sudoku rules

* **Uniqueness**: Generated puzzles have exactly one solution
* **Input filtering**: Real-time validation prevents invalid entries

---

## Development Progress

### Phase 1: Core Algorithm

* Backtracking solver implementation
* Basic test suite
* Performance optimization

### Phase 2: Web Backend

* ✅ Flask API setup
* ✅ JSON communication
* ✅ Error handling & validation

### Phase 3: Frontend Interface

* ✅ Interactive grid with CSS Grid
* ✅ Real-time input validation
* ✅ Visual feedback system

### Phase 4: Advanced Features

* Random puzzle generation with uniqueness
* Timer functionality
* Keyboard navigation
* Cell highlighting system
* Responsive design improvements

### Phase 5: Polish & UX

* Visual distinction (clues vs user input)
* Cell locking mechanism
* Comprehensive error handling
* Professional code organization

---

## Contributing

This project demonstrates modern web development practices with:

* Clean separation of concerns
* Comprehensive error handling
* User experience focus
* Algorithmic optimization
* Responsive design principles

For educational purposes or further development, feel free to extend with features like:

* Puzzle difficulty analysis
* Hint system
* Multiplayer modes
* Mobile app adaptation

---

Built using Python, Flask, and vanilla JavaScript
