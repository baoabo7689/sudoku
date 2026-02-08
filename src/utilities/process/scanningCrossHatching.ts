import { SudokuCellModel } from '@/models/SudokuCellModel';
import { SudokuGridModel } from '@/models/SudokuGridModel';
import { Technique } from '@/models/Technique';

function canPlaceValue(
  grid: SudokuGridModel,
  targetRow: number,
  targetCol: number,
  value: number
): boolean {
  for (let col = 0; col < 9; col++) {
    if (col === targetCol) {
      continue;
    }

    const blockRow = Math.floor(targetRow / 3);
    const blockCol = Math.floor(col / 3);
    const rowInBlock = targetRow % 3;
    const colInBlock = col % 3;
    const cell = grid.blocks[blockRow][blockCol].cells[rowInBlock][colInBlock];
    if (cell.solvedValue === value) {
      return false;
    }
  }

  for (let row = 0; row < 9; row++) {
    if (row === targetRow) {
      continue;
    }

    const blockRow = Math.floor(row / 3);
    const blockCol = Math.floor(targetCol / 3);
    const rowInBlock = row % 3;
    const colInBlock = targetCol % 3;
    const cell = grid.blocks[blockRow][blockCol].cells[rowInBlock][colInBlock];
    if (cell.solvedValue === value) {
      return false;
    }
  }

  const targetBlockRow = Math.floor(targetRow / 3);
  const targetBlockCol = Math.floor(targetCol / 3);
  const block = grid.blocks[targetBlockRow][targetBlockCol];

  for (let rowInBlock = 0; rowInBlock < 3; rowInBlock++) {
    for (let colInBlock = 0; colInBlock < 3; colInBlock++) {
      const globalRow = targetBlockRow * 3 + rowInBlock;
      const globalCol = targetBlockCol * 3 + colInBlock;

      if (globalRow === targetRow && globalCol === targetCol) {
        continue;
      }

      const cell = block.cells[rowInBlock][colInBlock];
      if (cell.solvedValue === value) {
        return false;
      }
    }
  }

  return true;
}

function markScanningCrossHatching(
  grid: SudokuGridModel,
  cell: SudokuCellModel,
  globalRow: number,
  globalCol: number
): boolean {
  let isUnchanged = true;

  const valueToMark = cell.solvedValue!;
  for (var col = 0; col < 9; col++) {
    if (col === globalCol) {
      continue;
    }

    const blockRow = Math.floor(globalRow / 3);
    const blockCol = Math.floor(col / 3);
    const rowInBlock = globalRow % 3;
    const colInBlock = col % 3;
    const currentCell = grid.blocks[blockRow][blockCol].cells[rowInBlock][colInBlock];
    if (currentCell.solvedValue || !currentCell.possibleValues[valueToMark - 1]) {
      continue;
    }

    currentCell.possibleValues[valueToMark - 1] = false;
    currentCell.solutionSteps.push({
      technique: Technique.ScanningCrossHatching,
      hints: [
        {
          row: globalRow,
          col: globalCol,
          value: valueToMark,
        },
      ],
    });

    isUnchanged = false;
  }

  for (var row = 0; row < 9; row++) {
    if (row === globalRow) {
      continue;
    }
    const blockRow = Math.floor(row / 3);
    const blockCol = Math.floor(globalCol / 3);
    const rowInBlock = row % 3;
    const colInBlock = globalCol % 3;
    const currentCell = grid.blocks[blockRow][blockCol].cells[rowInBlock][colInBlock];
    if (currentCell.solvedValue || !currentCell.possibleValues[valueToMark - 1]) {
      continue;
    }

    currentCell.possibleValues[valueToMark - 1] = false;
    currentCell.solutionSteps.push({
      technique: Technique.ScanningCrossHatching,
      hints: [
        {
          row: globalRow,
          col: globalCol,
          value: valueToMark,
        },
      ],
    });

    isUnchanged = false;
  }

  const currentBlockRow = Math.floor(globalRow / 3);
  const currentBlockCol = Math.floor(globalCol / 3);
  const block = grid.blocks[currentBlockRow][currentBlockCol];
  block.cells.forEach((row) => {
    row.forEach((currentCell) => {
      if (currentCell.row === cell.row || currentCell.col === cell.col) {
        return;
      }

      if (currentCell.solvedValue || !currentCell.possibleValues[valueToMark - 1]) {
        return;
      }

      currentCell.possibleValues[valueToMark - 1] = false;
      currentCell.solutionSteps.push({
        technique: Technique.ScanningCrossHatching,
        hints: [
          {
            row: globalRow,
            col: globalCol,
            value: valueToMark,
          },
        ],
      });

      isUnchanged = false;
    });
  });

  return isUnchanged;
}

function preScanningCrossHatching(grid: SudokuGridModel): boolean {
  let isUnchanged = true;

  for (let globalRow = 0; globalRow < 9; globalRow++) {
    for (let globalCol = 0; globalCol < 9; globalCol++) {
      const blockRow = Math.floor(globalRow / 3);
      const blockCol = Math.floor(globalCol / 3);
      const rowInBlock = globalRow % 3;
      const colInBlock = globalCol % 3;
      const cell = grid.blocks[blockRow][blockCol].cells[rowInBlock][colInBlock];

      if (!cell.solvedValue || cell.processedTechniques.includes(Technique.ScanningCrossHatching)) {
        continue;
      }

      cell.processedTechniques.push(Technique.ScanningCrossHatching);
      isUnchanged = markScanningCrossHatching(grid, cell, globalRow, globalCol) && isUnchanged;
    }
  }

  return isUnchanged;
}

export function doScanningCrossHatching(grid: SudokuGridModel): boolean {
  let isUnchanged = preScanningCrossHatching(grid);

  for (let value = 1; value <= 9; value++) {
    for (let globalRow = 0; globalRow < 9; globalRow++) {
      let position: SudokuCellModel | null = null;
      let positionCol = -1;

      for (let globalCol = 0; globalCol < 9; globalCol++) {
        const blockRow = Math.floor(globalRow / 3);
        const blockCol = Math.floor(globalCol / 3);
        const rowInBlock = globalRow % 3;
        const colInBlock = globalCol % 3;
        const cell = grid.blocks[blockRow][blockCol].cells[rowInBlock][colInBlock];

        if (cell.solvedValue === value) {
          position = null;
          break;
        }

        if (!cell.possibleValues[value - 1]) {
          continue;
        }

        if (position) {
          position = null;
          positionCol = -1;
          break;
        }

        position = cell;
        positionCol = globalCol;
      }

      if (position && !position.solvedValue && canPlaceValue(grid, globalRow, positionCol, value)) {
        position.addSolvedValue(value);
        isUnchanged = false;
      }
    }
  }

  for (let value = 1; value <= 9; value++) {
    for (let globalCol = 0; globalCol < 9; globalCol++) {
      let position: SudokuCellModel | null = null;
      let positionRow = -1;
      for (let globalRow = 0; globalRow < 9; globalRow++) {
        const blockRow = Math.floor(globalRow / 3);
        const blockCol = Math.floor(globalCol / 3);
        const rowInBlock = globalRow % 3;
        const colInBlock = globalCol % 3;
        const cell = grid.blocks[blockRow][blockCol].cells[rowInBlock][colInBlock];

        if (cell.solvedValue === value) {
          position = null;
          break;
        }

        if (!cell.possibleValues[value - 1]) {
          continue;
        }

        if (position) {
          position = null;
          positionRow = -1;
          break;
        }

        position = cell;
        positionRow = globalRow;
      }

      if (position && !position.solvedValue && canPlaceValue(grid, positionRow, globalCol, value)) {
        position.addSolvedValue(value);
        isUnchanged = false;
      }
    }
  }

  for (let value = 1; value <= 9; value++) {
    for (let blockRow = 0; blockRow < 3; blockRow++) {
      for (let blockCol = 0; blockCol < 3; blockCol++) {
        const block = grid.blocks[blockRow][blockCol];
        let position: SudokuCellModel | null = null;
        let matchCount = 0;
        let shouldSkip = false;
        let positionGlobalRow = -1;
        let positionGlobalCol = -1;

        for (let i = 0; i < block.cells.length; i++) {
          const cr = block.cells[i];
          for (var j = 0; j < cr.length; j++) {
            const cell = cr[j];
            if (cell.solvedValue === value) {
              shouldSkip = true;
              break;
            }

            if (!cell.possibleValues[value - 1]) {
              continue;
            }

            position = cell;
            positionGlobalRow = blockRow * 3 + i;
            positionGlobalCol = blockCol * 3 + j;
            matchCount++;
          }

          if (shouldSkip) {
            break;
          }
        }

        if (
          !shouldSkip &&
          matchCount == 1 &&
          position &&
          !position.solvedValue &&
          canPlaceValue(grid, positionGlobalRow, positionGlobalCol, value)
        ) {
          position.addSolvedValue(value);
          isUnchanged = false;
        }
      }
    }
  }

  return isUnchanged;
}
