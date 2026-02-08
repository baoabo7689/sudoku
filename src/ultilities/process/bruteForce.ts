import { type SudokuGrid } from "@/models/SudokuGrid";

function copyBoardToGrid(board: Array<Array<number | null>>, grid: SudokuGrid): SudokuGrid {
  for (let globalRow = 0; globalRow < 9; globalRow++) {
    for (let globalCol = 0; globalCol < 9; globalCol++) {
      const value = board[globalRow][globalCol];
      if (value === null) continue;

      const blockRow = Math.floor(globalRow / 3);
      const blockCol = Math.floor(globalCol / 3);
      const rowInBlock = globalRow % 3;
      const colInBlock = globalCol % 3;

      grid = grid.updateCellChange(blockRow, blockCol, rowInBlock, colInBlock, value);
    }
  }

  return grid;
}

export function doBruteForce(grid: SudokuGrid): SudokuGrid | null {
  const board: Array<Array<number | null>> = Array.from({ length: 9 }, (_, globalRow) =>
    Array.from({ length: 9 }, (_, globalCol) => {
      const blockRow = Math.floor(globalRow / 3);
      const blockCol = Math.floor(globalCol / 3);
      const rowInBlock = globalRow % 3;
      const colInBlock = globalCol % 3;

      return grid.blocks[blockRow][blockCol].cells[rowInBlock][colInBlock].solvedValue;
    })
  );

  const isValidPlacement = (row: number, col: number, value: number): boolean => {
    for (let currentCol = 0; currentCol < 9; currentCol++) {
      if (currentCol !== col && board[row][currentCol] === value) return false;
    }

    for (let currentRow = 0; currentRow < 9; currentRow++) {
      if (currentRow !== row && board[currentRow][col] === value) return false;
    }

    const startRow = Math.floor(row / 3) * 3;
    const startCol = Math.floor(col / 3) * 3;

    for (let rowOffset = 0; rowOffset < 3; rowOffset++) {
      for (let colOffset = 0; colOffset < 3; colOffset++) {
        const blockRow = startRow + rowOffset;
        const blockCol = startCol + colOffset;

        if (blockRow === row && blockCol === col) continue;
        if (board[blockRow][blockCol] === value) return false;
      }
    }

    return true;
  };

  const emptyCells: Array<{ row: number; col: number }> = [];
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] === null) emptyCells.push({ row, col });
    }
  }

  const lastTriedValues = Array<number>(emptyCells.length).fill(0);
  let currentIndex = 0;

  while (currentIndex >= 0 && currentIndex < emptyCells.length) {
    const { row, col } = emptyCells[currentIndex];
    board[row][col] = null;

    let isPlaced = false;
    for (let value = lastTriedValues[currentIndex] + 1; value <= 9; value++) {
      if (!isValidPlacement(row, col, value)) continue;

      board[row][col] = value;
      lastTriedValues[currentIndex] = value;
      currentIndex++;
      isPlaced = true;
      break;
    }

    if (!isPlaced) {
      lastTriedValues[currentIndex] = 0;
      currentIndex--;
    }
  }

  if (currentIndex < 0) return null;
  return copyBoardToGrid(board, grid);
}