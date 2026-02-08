import { SudokuGridModel } from '@/models/SudokuGridModel';
import { SudokuCellModel } from '@/models/SudokuCellModel';
import { Technique } from '@/models/Technique';

interface CellRef {
  cell: SudokuCellModel;
  globalRow: number;
  globalCol: number;
}

function getCellRef(grid: SudokuGridModel, globalRow: number, globalCol: number): CellRef {
  const blockRow = Math.floor(globalRow / 3);
  const blockCol = Math.floor(globalCol / 3);
  const rowInBlock = globalRow % 3;
  const colInBlock = globalCol % 3;

  return {
    cell: grid.blocks[blockRow][blockCol].cells[rowInBlock][colInBlock],
    globalRow,
    globalCol,
  };
}

function getCandidateCount(cell: SudokuCellModel): number {
  return cell.possibleValues.filter((isPossible) => isPossible).length;
}

function getRowCandidateCols(grid: SudokuGridModel, row: number, candidate: number): number[] {
  const cols: number[] = [];

  for (let col = 0; col < 9; col++) {
    const { cell } = getCellRef(grid, row, col);
    if (!cell.solvedValue && cell.possibleValues[candidate - 1]) {
      cols.push(col);
    }
  }

  return cols;
}

function getColCandidateRows(grid: SudokuGridModel, col: number, candidate: number): number[] {
  const rows: number[] = [];

  for (let row = 0; row < 9; row++) {
    const { cell } = getCellRef(grid, row, col);
    if (!cell.solvedValue && cell.possibleValues[candidate - 1]) {
      rows.push(row);
    }
  }

  return rows;
}

function getTriples(indexes: number[]): [number, number, number][] {
  const triples: [number, number, number][] = [];

  for (let first = 0; first < indexes.length - 2; first++) {
    for (let second = first + 1; second < indexes.length - 1; second++) {
      for (let third = second + 1; third < indexes.length; third++) {
        triples.push([indexes[first], indexes[second], indexes[third]]);
      }
    }
  }

  return triples;
}

function buildHints(
  baseIndexes: number[],
  coverIndexes: number[],
  candidate: number,
  isRowBased: boolean
) {
  const hints: Array<{ row: number; col: number; value: number }> = [];

  baseIndexes.forEach((baseIndex) => {
    coverIndexes.forEach((coverIndex) => {
      const row = isRowBased ? baseIndex : coverIndex;
      const col = isRowBased ? coverIndex : baseIndex;

      hints.push({
        row,
        col,
        value: candidate,
      });
    });
  });

  return hints;
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
    (step) => step.technique === Technique.Swordfish && areHintsEqual(step.hints, hints)
  );

  if (duplicatedStep) {
    return;
  }

  cell.solutionSteps.push({
    technique: Technique.Swordfish,
    hints,
  });
}

function applyRowBasedSwordfish(grid: SudokuGridModel): boolean {
  let changed = false;

  for (let candidate = 1; candidate <= 9; candidate++) {
    const eligibleRows: Array<{ row: number; cols: number[] }> = [];

    for (let row = 0; row < 9; row++) {
      const cols = getRowCandidateCols(grid, row, candidate);
      if (cols.length >= 2 && cols.length <= 3) {
        eligibleRows.push({ row, cols });
      }
    }

    const rowTriples = getTriples(eligibleRows.map((item) => item.row));

    rowTriples.forEach(([rowA, rowB, rowC]) => {
      const colsA = eligibleRows.find((item) => item.row === rowA)?.cols ?? [];
      const colsB = eligibleRows.find((item) => item.row === rowB)?.cols ?? [];
      const colsC = eligibleRows.find((item) => item.row === rowC)?.cols ?? [];

      const coverCols = Array.from(new Set([...colsA, ...colsB, ...colsC])).sort(
        (left, right) => left - right
      );
      if (coverCols.length !== 3) {
        return;
      }

      const hints = buildHints([rowA, rowB, rowC], coverCols, candidate, true);

      for (let row = 0; row < 9; row++) {
        if (row === rowA || row === rowB || row === rowC) {
          continue;
        }

        coverCols.forEach((col) => {
          const { cell } = getCellRef(grid, row, col);

          if (cell.solvedValue || !cell.possibleValues[candidate - 1]) {
            return;
          }

          if (getCandidateCount(cell) <= 1) {
            return;
          }

          cell.possibleValues[candidate - 1] = false;
          appendSolutionStepIfMissing(cell, hints);
          changed = true;
        });
      }
    });
  }

  return changed;
}

function applyColBasedSwordfish(grid: SudokuGridModel): boolean {
  let changed = false;

  for (let candidate = 1; candidate <= 9; candidate++) {
    const eligibleCols: Array<{ col: number; rows: number[] }> = [];

    for (let col = 0; col < 9; col++) {
      const rows = getColCandidateRows(grid, col, candidate);
      if (rows.length >= 2 && rows.length <= 3) {
        eligibleCols.push({ col, rows });
      }
    }

    const colTriples = getTriples(eligibleCols.map((item) => item.col));

    colTriples.forEach(([colA, colB, colC]) => {
      const rowsA = eligibleCols.find((item) => item.col === colA)?.rows ?? [];
      const rowsB = eligibleCols.find((item) => item.col === colB)?.rows ?? [];
      const rowsC = eligibleCols.find((item) => item.col === colC)?.rows ?? [];

      const coverRows = Array.from(new Set([...rowsA, ...rowsB, ...rowsC])).sort(
        (left, right) => left - right
      );
      if (coverRows.length !== 3) {
        return;
      }

      const hints = buildHints([colA, colB, colC], coverRows, candidate, false);

      for (let col = 0; col < 9; col++) {
        if (col === colA || col === colB || col === colC) {
          continue;
        }

        coverRows.forEach((row) => {
          const { cell } = getCellRef(grid, row, col);

          if (cell.solvedValue || !cell.possibleValues[candidate - 1]) {
            return;
          }

          if (getCandidateCount(cell) <= 1) {
            return;
          }

          cell.possibleValues[candidate - 1] = false;
          appendSolutionStepIfMissing(cell, hints);
          changed = true;
        });
      }
    });
  }

  return changed;
}

export function _doSwordfish(grid: SudokuGridModel): boolean {
  let isUnchanged = true;

  let changed = false;
  changed = applyRowBasedSwordfish(grid) || changed;
  changed = applyColBasedSwordfish(grid) || changed;
  isUnchanged = !changed && isUnchanged;

  return isUnchanged;
}

export function doSwordfish(grid: SudokuGridModel): boolean {
  return true;
}
