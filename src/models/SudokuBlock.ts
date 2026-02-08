import { createEmptyCell, SudokuCell } from "./SudokuCell";

// Model for a 3x3 block of Sudoku cells
export interface SudokuBlock {
  blockRow: number; // Block's row index (0-2)
  blockCol: number; // Block's column index (0-2)
  cells: SudokuCell[][]; // 3x3 array of cells,
  updateCellChange: (row: number, col: number, value: number | null) => SudokuBlock;  
  blockInit: () => SudokuBlock;
  reset: () => SudokuBlock;
  preprocess: () => SudokuBlock;
}

// Helper to create an empty 3x3 block
export function createEmptyBlock(blockRow: number, blockCol: number): SudokuBlock {
  return {
    blockRow,
    blockCol,
    cells: Array.from({ length: 3 }, (_, r) =>
      Array.from({ length: 3 }, (_, c) => createEmptyCell(r, c))
    ),  
    updateCellChange: function(row: number, col: number, value: number | null) {
      return updateCellChange(this, row, col, value);
    },
    blockInit: function () { return blockInit(this); },
    reset: function () { return reset(this); },
    preprocess: function () { return preprocess(this); }    
  };
}

// Returns a new block with the cell at (row, col) replaced by newCell
export function updateCellChange(block: SudokuBlock, row: number, col: number, value: number | null): SudokuBlock {
  return {
    ...block,
    cells: block.cells.map((rowArr, r) =>
      rowArr.map((c, cIdx) => {
        if (r === row && cIdx === col) {  
          return c.addSolvedValue(value);  
        }

        return c; // Return unchanged cells
      })
    )
  };  
}

// Returns a new block with the cell at (row, col) replaced by newCell
export function blockInit(block: SudokuBlock): SudokuBlock {
  return {
    ...block,
    cells: block.cells.map((rowArr) =>
      rowArr.map((c) => { return c.blockInit(); })
    )
  };  
}

export function reset(block: SudokuBlock): SudokuBlock {
  return {
    ...block,
    cells: block.cells.map((rowArr) =>
      rowArr.map((c) => { return c.reset(); })
    )
  };  
}

export function preprocess(block: SudokuBlock): SudokuBlock {
  return {
    ...block,
    cells: block.cells.map((rowArr) =>
      rowArr.map((c) => { return c.preprocess(); })
    )
  };  
}
