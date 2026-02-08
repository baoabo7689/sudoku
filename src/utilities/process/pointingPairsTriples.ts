import { SudokuGridModel } from '@/models/SudokuGridModel';
import { SudokuCellModel } from '@/models/SudokuCellModel';
import { Technique } from '@/models/Technique';

interface CellRef {
  cell: SudokuCellModel;
  globalRow: number;
  globalCol: number;
}

function getBlockCells(grid: SudokuGridModel, blockRow: number, blockCol: number): CellRef[] {
  const cells: CellRef[] = [];

  for (let rowInBlock = 0; rowInBlock < 3; rowInBlock++) {
    for (let colInBlock = 0; colInBlock < 3; colInBlock++) {
      cells.push({
        cell: grid.blocks[blockRow][blockCol].cells[rowInBlock][colInBlock],
        globalRow: blockRow * 3 + rowInBlock,
        globalCol: blockCol * 3 + colInBlock,
      });
    }
  }

  return cells;
}

function buildHints(patternCells: CellRef[], candidate: number) {
  return patternCells.map(({ globalRow, globalCol }) => ({
    row: globalRow,
    col: globalCol,
    value: candidate,
  }));
}

function eliminateFromRowOutsideBlock(
  grid: SudokuGridModel,
  row: number,
  blockCol: number,
  candidate: number,
  hints: ReturnType<typeof buildHints>
): boolean {
  let changed = false;
  const blockColStart = blockCol * 3;
  const blockColEnd = blockColStart + 2;

  for (let globalCol = 0; globalCol < 9; globalCol++) {
    if (globalCol >= blockColStart && globalCol <= blockColEnd) {
      continue;
    }

    const targetBlockRow = Math.floor(row / 3);
    const targetBlockCol = Math.floor(globalCol / 3);
    const rowInBlock = row % 3;
    const colInBlock = globalCol % 3;
    const targetCell = grid.blocks[targetBlockRow][targetBlockCol].cells[rowInBlock][colInBlock];

    if (targetCell.solvedValue || !targetCell.possibleValues[candidate - 1]) {
      continue;
    }

    targetCell.possibleValues[candidate - 1] = false;
    targetCell.solutionSteps.push({
      technique: Technique.PointingPairsTriples,
      hints,
    });
    changed = true;
  }

  return changed;
}

function eliminateFromColOutsideBlock(
  grid: SudokuGridModel,
  col: number,
  blockRow: number,
  candidate: number,
  hints: ReturnType<typeof buildHints>
): boolean {
  let changed = false;
  const blockRowStart = blockRow * 3;
  const blockRowEnd = blockRowStart + 2;

  for (let globalRow = 0; globalRow < 9; globalRow++) {
    if (globalRow >= blockRowStart && globalRow <= blockRowEnd) {
      continue;
    }

    const targetBlockRow = Math.floor(globalRow / 3);
    const targetBlockCol = Math.floor(col / 3);
    const rowInBlock = globalRow % 3;
    const colInBlock = col % 3;
    const targetCell = grid.blocks[targetBlockRow][targetBlockCol].cells[rowInBlock][colInBlock];

    if (targetCell.solvedValue || !targetCell.possibleValues[candidate - 1]) {
      continue;
    }

    targetCell.possibleValues[candidate - 1] = false;
    targetCell.solutionSteps.push({
      technique: Technique.PointingPairsTriples,
      hints,
    });
    changed = true;
  }

  return changed;
}

export function _doPointingPairsTriples(grid: SudokuGridModel): boolean {
  let isUnchanged = true;

  for (let blockRow = 0; blockRow < 3; blockRow++) {
    for (let blockCol = 0; blockCol < 3; blockCol++) {
      const blockCells = getBlockCells(grid, blockRow, blockCol);

      for (let candidate = 1; candidate <= 9; candidate++) {
        const candidateCells = blockCells.filter(
          ({ cell }) => !cell.solvedValue && cell.possibleValues[candidate - 1]
        );

        if (candidateCells.length < 2 || candidateCells.length > 3) {
          continue;
        }

        const allInSameRow = candidateCells.every(
          ({ globalRow }) => globalRow === candidateCells[0].globalRow
        );
        const allInSameCol = candidateCells.every(
          ({ globalCol }) => globalCol === candidateCells[0].globalCol
        );
        const hints = buildHints(candidateCells, candidate);

        let changed = false;
        if (allInSameRow) {
          changed =
            eliminateFromRowOutsideBlock(
              grid,
              candidateCells[0].globalRow,
              blockCol,
              candidate,
              hints
            ) || changed;
        }

        if (allInSameCol) {
          changed =
            eliminateFromColOutsideBlock(
              grid,
              candidateCells[0].globalCol,
              blockRow,
              candidate,
              hints
            ) || changed;
        }

        isUnchanged = !changed && isUnchanged;
      }
    }
  }

  return isUnchanged;
}

export function doPointingPairsTriples(grid: SudokuGridModel): boolean {
  return true;
}
