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

function buildHints(corners: Array<{ row: number; col: number }>, candidate: number) {
  return corners.map(({ row, col }) => ({
    row,
    col,
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
    (step) => step.technique === Technique.XWing && areHintsEqual(step.hints, hints)
  );

  if (duplicatedStep) {
    return;
  }

  cell.solutionSteps.push({
    technique: Technique.XWing,
    hints,
  });
}

function applyRowBasedXWing(grid: SudokuGridModel): boolean {
  let changed = false;

  for (let candidate = 1; candidate <= 9; candidate++) {
    const rowPairsByCols = new Map<string, number[]>();

    for (let row = 0; row < 9; row++) {
      const cols = getRowCandidateCols(grid, row, candidate);
      if (cols.length !== 2) {
        continue;
      }

      const key = `${cols[0]}-${cols[1]}`;
      if (!rowPairsByCols.has(key)) {
        rowPairsByCols.set(key, []);
      }

      rowPairsByCols.get(key)!.push(row);
    }

    rowPairsByCols.forEach((rows, colsKey) => {
      if (rows.length < 2) {
        return;
      }

      const [colA, colB] = colsKey.split('-').map(Number);

      for (let first = 0; first < rows.length - 1; first++) {
        for (let second = first + 1; second < rows.length; second++) {
          const rowA = rows[first];
          const rowB = rows[second];
          const hints = buildHints(
            [
              { row: rowA, col: colA },
              { row: rowA, col: colB },
              { row: rowB, col: colA },
              { row: rowB, col: colB },
            ],
            candidate
          );

          for (let row = 0; row < 9; row++) {
            if (row === rowA || row === rowB) {
              continue;
            }

            [colA, colB].forEach((col) => {
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
        }
      }
    });
  }

  return changed;
}

function applyColBasedXWing(grid: SudokuGridModel): boolean {
  let changed = false;

  for (let candidate = 1; candidate <= 9; candidate++) {
    const colPairsByRows = new Map<string, number[]>();

    for (let col = 0; col < 9; col++) {
      const rows = getColCandidateRows(grid, col, candidate);
      if (rows.length !== 2) {
        continue;
      }

      const key = `${rows[0]}-${rows[1]}`;
      if (!colPairsByRows.has(key)) {
        colPairsByRows.set(key, []);
      }

      colPairsByRows.get(key)!.push(col);
    }

    colPairsByRows.forEach((cols, rowsKey) => {
      if (cols.length < 2) {
        return;
      }

      const [rowA, rowB] = rowsKey.split('-').map(Number);

      for (let first = 0; first < cols.length - 1; first++) {
        for (let second = first + 1; second < cols.length; second++) {
          const colA = cols[first];
          const colB = cols[second];
          const hints = buildHints(
            [
              { row: rowA, col: colA },
              { row: rowA, col: colB },
              { row: rowB, col: colA },
              { row: rowB, col: colB },
            ],
            candidate
          );

          for (let col = 0; col < 9; col++) {
            if (col === colA || col === colB) {
              continue;
            }

            [rowA, rowB].forEach((row) => {
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
        }
      }
    });
  }

  return changed;
}

export function _doXWing(grid: SudokuGridModel): boolean {
  let isUnchanged = true;

  let changed = false;
  changed = applyRowBasedXWing(grid) || changed;
  changed = applyColBasedXWing(grid) || changed;
  isUnchanged = !changed && isUnchanged;

  return isUnchanged;
}

export function doXWing(grid: SudokuGridModel): boolean {
  return true;
}
