import { SudokuBlockModel, createEmptyBlock } from './SudokuBlockModel';
import { validateUtilities } from '@/utilities/validateUtilities';
import type { ValidationIssue } from '@/utilities/validateUtilities';

// Model for a 9x9 Sudoku grid composed of 3x3 blocks
export interface SudokuGridModel {
  blocks: SudokuBlockModel[][]; // 3x3 array of blocks,
  isBlockedInit: boolean; // Flag to indicate if the grid has been initialized with a puzzle
  isBlocked: boolean; // Flag to indicate if solved cells are currently blocked
  updateCellChange: (
    blockRow: number,
    blockCol: number,
    row: number,
    col: number,
    value: number | null
  ) => SudokuGridModel;
  blockSolved: (blocked: boolean) => SudokuGridModel;
  blockInit: () => SudokuGridModel;
  validate: () => ValidationIssue[]; // Returns validation issues for the entire grid
  export: () => string; // Returns a 9-line string; unsolved cells are represented as '_'

  reset: () => SudokuGridModel;
  preprocess: () => SudokuGridModel; // Returns a new grid with possible values preprocessed for all cells
}

// Helper to create an empty 9x9 Sudoku grid (3x3 blocks)
export function createEmptySudokuGrid(): SudokuGridModel {
  return {
    isBlockedInit: false,
    isBlocked: false,
    blocks: Array.from({ length: 3 }, (_, blockRow) =>
      Array.from({ length: 3 }, (_, blockCol) => createEmptyBlock(blockRow, blockCol))
    ),
    updateCellChange: function (
      blockRow: number,
      blockCol: number,
      row: number,
      col: number,
      value: number | null
    ) {
      return updateCellChange(this, blockRow, blockCol, row, col, value);
    },
    blockSolved: function (blocked: boolean) {
      return blockSolved(this, blocked);
    },
    blockInit: function () {
      return blockInit(this);
    },
    validate: function () {
      return validateUtilities.validateGrid(this);
    },
    export: function () {
      return exportGrid(this);
    },
    reset: function () {
      return reset(this);
    },
    preprocess: function () {
      return preprocess(this);
    },
  };
}

// Returns a new grid with the cell at (blockRow, blockCol, row, col) updated to newValue
export function updateCellChange(
  grid: SudokuGridModel,
  blockRow: number,
  blockCol: number,
  row: number,
  col: number,
  newValue: number | null
): SudokuGridModel {
  const newGrid: SudokuGridModel = {
    ...grid,
    blocks: grid.blocks.map((blockRowArr, br) =>
      blockRowArr.map((block, bc) => {
        if (br === blockRow && bc === blockCol) {
          return block.updateCellChange(row, col, newValue);
        }
        return block; // Return unchanged blocks
      })
    ),
  };

  return newGrid;
}

export function blockSolved(grid: SudokuGridModel, blocked: boolean): SudokuGridModel {
  const newGrid: SudokuGridModel = {
    ...grid,
    isBlocked: blocked,
    blocks: grid.blocks.map((blockRowArr) =>
      blockRowArr.map((block) => {
        return block.blockSolved(blocked);
      })
    ),
  };

  return newGrid;
}

export function blockInit(grid: SudokuGridModel): SudokuGridModel {
  const newGrid: SudokuGridModel = {
    ...grid,
    isBlockedInit: true,
    blocks: grid.blocks.map((blockRowArr) =>
      blockRowArr.map((block) => {
        return block.blockInit();
      })
    ),
  };

  return newGrid;
}

export function reset(grid: SudokuGridModel): SudokuGridModel {
  const newGrid: SudokuGridModel = {
    ...grid,
    isBlockedInit: false,
    isBlocked: false,
    blocks: grid.blocks.map((blockRowArr) =>
      blockRowArr.map((block) => {
        return block.reset();
      })
    ),
  };

  return newGrid;
}

export function preprocess(grid: SudokuGridModel): SudokuGridModel {
  const newGrid: SudokuGridModel = {
    ...grid,
    blocks: grid.blocks.map((blockRowArr) =>
      blockRowArr.map((block) => {
        return block.preprocess();
      })
    ),
  };

  return newGrid;
}

export function exportGrid(grid: SudokuGridModel): string {
  const rows = Array.from({ length: 9 }, (_, globalRow) =>
    Array.from({ length: 9 }, (_, globalCol) => {
      const blockRow = Math.floor(globalRow / 3);
      const blockCol = Math.floor(globalCol / 3);
      const rowInBlock = globalRow % 3;
      const colInBlock = globalCol % 3;
      const value = grid.blocks[blockRow][blockCol].cells[rowInBlock][colInBlock].solvedValue;

      return value === null ? '_' : value.toString();
    }).join(' ')
  );

  return rows.join('\n');
}
