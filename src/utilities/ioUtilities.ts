import { createEmptySudokuGrid, SudokuGridModel } from '@/models/SudokuGridModel';

type ImportGridResult =
  | {
      success: true;
      grid: SudokuGridModel;
    }
  | {
      success: false;
    };

export const ioUtilities = {
  importGrid(rawValue: string): ImportGridResult {
    const values = rawValue.match(/[1-9_0.]/g) || [];

    if (values.length !== 81) {
      return { success: false };
    }

    let newGrid = createEmptySudokuGrid();

    for (let index = 0; index < values.length; index++) {
      const token = values[index];

      if (token === '_' || token === '0' || token === '.') {
        continue;
      }

      const globalRow = Math.floor(index / 9);
      const globalCol = index % 9;
      const blockRow = Math.floor(globalRow / 3);
      const blockCol = Math.floor(globalCol / 3);
      const rowInBlock = globalRow % 3;
      const colInBlock = globalCol % 3;

      newGrid = newGrid.updateCellChange(
        blockRow,
        blockCol,
        rowInBlock,
        colInBlock,
        parseInt(token, 10)
      );
    }

    return {
      success: true,
      grid: newGrid,
    };
  },
};
