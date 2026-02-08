type SudokuValueGrid = (number | null)[][];

const GRID_SIZE = 9;
const BOX_SIZE = 3;
const EASY_GIVENS = 40;
const MEDIUM_GIVENS = 32;
const HARD_GIVENS = 26;

function shuffle(values: number[]): number[] {
  const result = [...values];

  for (let index = result.length - 1; index > 0; index--) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[randomIndex]] = [result[randomIndex], result[index]];
  }

  return result;
}

function isSafe(board: number[][], row: number, col: number, value: number): boolean {
  for (let index = 0; index < GRID_SIZE; index++) {
    if (board[row][index] === value || board[index][col] === value) {
      return false;
    }
  }

  const boxRowStart = Math.floor(row / BOX_SIZE) * BOX_SIZE;
  const boxColStart = Math.floor(col / BOX_SIZE) * BOX_SIZE;

  for (let rowOffset = 0; rowOffset < BOX_SIZE; rowOffset++) {
    for (let colOffset = 0; colOffset < BOX_SIZE; colOffset++) {
      if (board[boxRowStart + rowOffset][boxColStart + colOffset] === value) {
        return false;
      }
    }
  }

  return true;
}

function fillBoard(board: number[][]): boolean {
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      if (board[row][col] !== 0) {
        continue;
      }

      const candidates = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);

      for (const candidate of candidates) {
        if (!isSafe(board, row, col, candidate)) {
          continue;
        }

        board[row][col] = candidate;

        if (fillBoard(board)) {
          return true;
        }

        board[row][col] = 0;
      }

      return false;
    }
  }

  return true;
}

function generatePuzzle(givens: number): SudokuValueGrid {
  const solvedBoard = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0));
  fillBoard(solvedBoard);

  const puzzle: SudokuValueGrid = solvedBoard.map((row) => row.map((value) => value));
  const positions = shuffle(Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, index) => index));
  const removeCount = GRID_SIZE * GRID_SIZE - givens;

  for (let index = 0; index < removeCount; index++) {
    const position = positions[index];
    const row = Math.floor(position / GRID_SIZE);
    const col = position % GRID_SIZE;
    puzzle[row][col] = null;
  }

  return puzzle;
}

export const initUltilities = {
  random: (difficulty: 'easy' | 'medium' | 'hard') => {
    switch (difficulty) {
      case 'easy':
        return generatePuzzle(EASY_GIVENS);
      case 'medium':
        return generatePuzzle(MEDIUM_GIVENS);
      case 'hard':
        return generatePuzzle(HARD_GIVENS);
    }
  }
};
