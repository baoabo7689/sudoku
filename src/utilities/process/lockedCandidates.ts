import { SudokuGridModel } from '@/models/SudokuGridModel';
import { SudokuCellModel } from '@/models/SudokuCellModel';
import { Technique } from '@/models/Technique';

interface CellRef {
  cell: SudokuCellModel;
  globalRow: number;
  globalCol: number;
}

function getRowCells(grid: SudokuGridModel, row: number): CellRef[] {
  const cells: CellRef[] = [];

  for (let globalCol = 0; globalCol < 9; globalCol++) {
    const blockRow = Math.floor(row / 3);
    const blockCol = Math.floor(globalCol / 3);
    const rowInBlock = row % 3;
    const colInBlock = globalCol % 3;

    cells.push({
      cell: grid.blocks[blockRow][blockCol].cells[rowInBlock][colInBlock],
      globalRow: row,
      globalCol,
    });
  }

  return cells;
}

function getColCells(grid: SudokuGridModel, col: number): CellRef[] {
  const cells: CellRef[] = [];

  for (let globalRow = 0; globalRow < 9; globalRow++) {
    const blockRow = Math.floor(globalRow / 3);
    const blockCol = Math.floor(col / 3);
    const rowInBlock = globalRow % 3;
    const colInBlock = col % 3;

    cells.push({
      cell: grid.blocks[blockRow][blockCol].cells[rowInBlock][colInBlock],
      globalRow,
      globalCol: col,
    });
  }

  return cells;
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

function areHintsEqual(
  firstHints: ReturnType<typeof buildHints>,
  secondHints: ReturnType<typeof buildHints>
): boolean {
  if (firstHints.length !== secondHints.length) {
    return false;
  }

  const sortKey = (hint: { row: number; col: number; value: number }) =>
    `${hint.row}-${hint.col}-${hint.value}`;

  const normalizedFirst = [...firstHints].sort((left, right) =>
    sortKey(left).localeCompare(sortKey(right))
  );
  const normalizedSecond = [...secondHints].sort((left, right) =>
    sortKey(left).localeCompare(sortKey(right))
  );

  return normalizedFirst.every((hint, index) => {
    const candidateHint = normalizedSecond[index];
    return (
      hint.row === candidateHint.row &&
      hint.col === candidateHint.col &&
      hint.value === candidateHint.value
    );
  });
}

function appendSolutionStepIfMissing(
  cell: SudokuCellModel,
  hints: ReturnType<typeof buildHints>
): void {
  const duplicatedStep = cell.solutionSteps.some(
    (step) => step.technique === Technique.LockedCandidates && areHintsEqual(step.hints, hints)
  );

  if (duplicatedStep) {
    return;
  }

  cell.solutionSteps.push({
    technique: Technique.LockedCandidates,
    hints,
  });
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
    appendSolutionStepIfMissing(targetCell, hints);
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
    appendSolutionStepIfMissing(targetCell, hints);
    changed = true;
  }

  return changed;
}

function eliminateFromBlockOutsideRow(
  grid: SudokuGridModel,
  blockRow: number,
  blockCol: number,
  row: number,
  candidate: number,
  hints: ReturnType<typeof buildHints>
): boolean {
  let changed = false;

  for (let rowInBlock = 0; rowInBlock < 3; rowInBlock++) {
    for (let colInBlock = 0; colInBlock < 3; colInBlock++) {
      const globalRow = blockRow * 3 + rowInBlock;
      if (globalRow === row) {
        continue;
      }

      const targetCell = grid.blocks[blockRow][blockCol].cells[rowInBlock][colInBlock];
      if (targetCell.solvedValue || !targetCell.possibleValues[candidate - 1]) {
        continue;
      }

      targetCell.possibleValues[candidate - 1] = false;
      appendSolutionStepIfMissing(targetCell, hints);
      changed = true;
    }
  }

  return changed;
}

function eliminateFromBlockOutsideCol(
  grid: SudokuGridModel,
  blockRow: number,
  blockCol: number,
  col: number,
  candidate: number,
  hints: ReturnType<typeof buildHints>
): boolean {
  let changed = false;

  for (let rowInBlock = 0; rowInBlock < 3; rowInBlock++) {
    for (let colInBlock = 0; colInBlock < 3; colInBlock++) {
      const globalCol = blockCol * 3 + colInBlock;
      if (globalCol === col) {
        continue;
      }

      const targetCell = grid.blocks[blockRow][blockCol].cells[rowInBlock][colInBlock];
      if (targetCell.solvedValue || !targetCell.possibleValues[candidate - 1]) {
        continue;
      }

      targetCell.possibleValues[candidate - 1] = false;
      appendSolutionStepIfMissing(targetCell, hints);
      changed = true;
    }
  }

  return changed;
}

function applyPointingLockedCandidates(grid: SudokuGridModel): boolean {
  let changed = false;

  for (let blockRow = 0; blockRow < 3; blockRow++) {
    for (let blockCol = 0; blockCol < 3; blockCol++) {
      const blockCells = getBlockCells(grid, blockRow, blockCol);

      for (let candidate = 1; candidate <= 9; candidate++) {
        const candidateCells = blockCells.filter(
          ({ cell }) => !cell.solvedValue && cell.possibleValues[candidate - 1]
        );

        if (candidateCells.length < 2) {
          continue;
        }

        const allInSameRow = candidateCells.every(
          ({ globalRow }) => globalRow === candidateCells[0].globalRow
        );
        const allInSameCol = candidateCells.every(
          ({ globalCol }) => globalCol === candidateCells[0].globalCol
        );

        if (!allInSameRow && !allInSameCol) {
          continue;
        }

        const hints = buildHints(candidateCells, candidate);

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
      }
    }
  }

  return changed;
}

function applyClaimingLockedCandidates(grid: SudokuGridModel): boolean {
  let changed = false;

  for (let row = 0; row < 9; row++) {
    const rowCells = getRowCells(grid, row);
    const blockRow = Math.floor(row / 3);

    for (let candidate = 1; candidate <= 9; candidate++) {
      const candidateCells = rowCells.filter(
        ({ cell }) => !cell.solvedValue && cell.possibleValues[candidate - 1]
      );
      if (candidateCells.length < 2) {
        continue;
      }

      const firstBlockCol = Math.floor(candidateCells[0].globalCol / 3);
      const allInSameBlock = candidateCells.every(
        ({ globalCol }) => Math.floor(globalCol / 3) === firstBlockCol
      );

      if (!allInSameBlock) {
        continue;
      }

      const hints = buildHints(candidateCells, candidate);
      changed =
        eliminateFromBlockOutsideRow(grid, blockRow, firstBlockCol, row, candidate, hints) ||
        changed;
    }
  }

  for (let col = 0; col < 9; col++) {
    const colCells = getColCells(grid, col);
    const blockCol = Math.floor(col / 3);

    for (let candidate = 1; candidate <= 9; candidate++) {
      const candidateCells = colCells.filter(
        ({ cell }) => !cell.solvedValue && cell.possibleValues[candidate - 1]
      );
      if (candidateCells.length < 2) {
        continue;
      }

      const firstBlockRow = Math.floor(candidateCells[0].globalRow / 3);
      const allInSameBlock = candidateCells.every(
        ({ globalRow }) => Math.floor(globalRow / 3) === firstBlockRow
      );

      if (!allInSameBlock) {
        continue;
      }

      const hints = buildHints(candidateCells, candidate);
      changed =
        eliminateFromBlockOutsideCol(grid, firstBlockRow, blockCol, col, candidate, hints) ||
        changed;
    }
  }

  return changed;
}

export function _doLockedCandidates(grid: SudokuGridModel): boolean {
  let isUnchanged = true;

  let changed = false;
  changed = applyPointingLockedCandidates(grid) || changed;
  changed = applyClaimingLockedCandidates(grid) || changed;
  isUnchanged = !changed && isUnchanged;

  return isUnchanged;
}

export function doLockedCandidates(grid: SudokuGridModel): boolean {
  return true;
}
