import { SudokuBlock, createEmptyBlock } from "./SudokuBlock";
import { validateUltilities } from "@/ultilities/validateUltilities";
import type { ValidationIssue } from "@/ultilities/validateUltilities";

// Model for a 9x9 Sudoku grid composed of 3x3 blocks
export interface SudokuGrid {
    blocks: SudokuBlock[][]; // 3x3 array of blocks,
    isBlockedInit: boolean; // Flag to indicate if the grid has been initialized with a puzzle
    updateCellChange: (blockRow: number, blockCol: number, row: number, col: number, value: number | null) => SudokuGrid;  
    blockInit: () => SudokuGrid;    
    validate: () => ValidationIssue[]; // Returns validation issues for the entire grid

    reset: () => SudokuGrid;  
    preprocess: () => SudokuGrid; // Returns a new grid with possible values preprocessed for all cells
  }

// Helper to create an empty 9x9 Sudoku grid (3x3 blocks)
export function createEmptySudokuGrid(): SudokuGrid {
    return {
        isBlockedInit: false,
        blocks: Array.from({ length: 3 }, (_, blockRow) =>
            Array.from({ length: 3 }, (_, blockCol) => createEmptyBlock(blockRow, blockCol))
        ),
        updateCellChange: function(blockRow: number, blockCol: number, row: number, col: number, value: number | null) {
            return updateCellChange(this, blockRow, blockCol, row, col, value);
        },
        blockInit: function () { return blockInit(this); },
        validate: function () { return validateUltilities.validateGrid(this); },
        reset: function () { return reset(this); },
        preprocess: function () { return preprocess(this); }
    };
}

// Returns a new grid with the cell at (blockRow, blockCol, row, col) updated to newValue
export function updateCellChange(grid: SudokuGrid, blockRow: number, blockCol: number, row: number, col: number, newValue: number | null): SudokuGrid {
    const newGrid: SudokuGrid = {
        ...grid,
        blocks: grid.blocks.map((blockRowArr, br) =>
            blockRowArr.map((block, bc) => {
                if (br === blockRow && bc === blockCol) {   
                    return block.updateCellChange(row, col, newValue);
                }
                return block; // Return unchanged blocks
            })
        )
    };

    return newGrid;
};  

export function blockInit(grid: SudokuGrid): SudokuGrid {
    const newGrid: SudokuGrid = {
        ...grid,
        isBlockedInit: true,
        blocks: grid.blocks.map((blockRowArr) =>
            blockRowArr.map((block) => { return block.blockInit(); })
        )
    };

    return newGrid;
};  

export function reset(grid: SudokuGrid): SudokuGrid {
    const newGrid: SudokuGrid = {
        ...grid,
        blocks: grid.blocks.map((blockRowArr) =>
            blockRowArr.map((block) => { return block.reset(); })
        )
    };

    return newGrid;
};  

export function preprocess(grid: SudokuGrid): SudokuGrid {
    const newGrid: SudokuGrid = {
        ...grid,
        blocks: grid.blocks.map((blockRowArr) =>
            blockRowArr.map((block) => { return block.preprocess(); })
        )
    };

    return newGrid;
};  