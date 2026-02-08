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

function getAllUnsolvedCellRefs(grid: SudokuGridModel): CellRef[] {
  const cells: CellRef[] = [];

  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const cellRef = getCellRef(grid, row, col);
      if (!cellRef.cell.solvedValue) {
        cells.push(cellRef);
      }
    }
  }

  return cells;
}

function getCandidates(cell: SudokuCellModel): number[] {
  const candidates: number[] = [];

  for (let candidate = 1; candidate <= 9; candidate++) {
    if (cell.possibleValues[candidate - 1]) {
      candidates.push(candidate);
    }
  }

  return candidates;
}

function getCandidateCount(cell: SudokuCellModel): number {
  return cell.possibleValues.filter((isPossible) => isPossible).length;
}

function sameCell(first: CellRef, second: CellRef): boolean {
  return first.globalRow === second.globalRow && first.globalCol === second.globalCol;
}

function areInSameBlock(first: CellRef, second: CellRef): boolean {
  return (
    Math.floor(first.globalRow / 3) === Math.floor(second.globalRow / 3) &&
    Math.floor(first.globalCol / 3) === Math.floor(second.globalCol / 3)
  );
}

function canSee(first: CellRef, second: CellRef): boolean {
  if (sameCell(first, second)) {
    return false;
  }

  return (
    first.globalRow === second.globalRow ||
    first.globalCol === second.globalCol ||
    areInSameBlock(first, second)
  );
}

function buildHints(patternCells: Array<{ cellRef: CellRef; candidates: number[] }>) {
  const hintMap = new Map<string, { row: number; col: number; value: number }>();

  patternCells.forEach(({ cellRef, candidates }) => {
    candidates.forEach((candidate) => {
      const key = `${cellRef.globalRow}-${cellRef.globalCol}-${candidate}`;
      if (!hintMap.has(key)) {
        hintMap.set(key, {
          row: cellRef.globalRow,
          col: cellRef.globalCol,
          value: candidate,
        });
      }
    });
  });

  return Array.from(hintMap.values());
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
    (step) => step.technique === Technique.XYWingWWing && areHintsEqual(step.hints, hints)
  );

  if (duplicatedStep) {
    return;
  }

  cell.solutionSteps.push({
    technique: Technique.XYWingWWing,
    hints,
  });
}

function eliminateCandidateFromCommonSeenCells(
  allCells: CellRef[],
  watchedCells: CellRef[],
  candidate: number,
  hints: ReturnType<typeof buildHints>
): boolean {
  let changed = false;

  allCells.forEach((targetRef) => {
    if (watchedCells.some((watchedCell) => sameCell(targetRef, watchedCell))) {
      return;
    }

    const seesAllWatchedCells = watchedCells.every((watchedCell) => canSee(targetRef, watchedCell));
    if (!seesAllWatchedCells) {
      return;
    }

    if (!targetRef.cell.possibleValues[candidate - 1]) {
      return;
    }

    if (getCandidateCount(targetRef.cell) <= 1) {
      return;
    }

    targetRef.cell.possibleValues[candidate - 1] = false;
    appendSolutionStepIfMissing(targetRef.cell, hints);
    changed = true;
  });

  return changed;
}

function applyXYWing(grid: SudokuGridModel): boolean {
  let changed = false;
  const allCells = getAllUnsolvedCellRefs(grid);
  const bivalueCells = allCells.filter(({ cell }) => getCandidates(cell).length === 2);

  bivalueCells.forEach((pivot) => {
    const pivotCandidates = getCandidates(pivot.cell);
    const [firstPivotCandidate, secondPivotCandidate] = pivotCandidates;

    const firstSidePincers = bivalueCells.filter((cellRef) => {
      if (sameCell(cellRef, pivot) || !canSee(cellRef, pivot)) {
        return false;
      }

      const candidates = getCandidates(cellRef.cell);
      return candidates.includes(firstPivotCandidate) && !candidates.includes(secondPivotCandidate);
    });

    const secondSidePincers = bivalueCells.filter((cellRef) => {
      if (sameCell(cellRef, pivot) || !canSee(cellRef, pivot)) {
        return false;
      }

      const candidates = getCandidates(cellRef.cell);
      return candidates.includes(secondPivotCandidate) && !candidates.includes(firstPivotCandidate);
    });

    firstSidePincers.forEach((firstPincer) => {
      const firstPincerCandidates = getCandidates(firstPincer.cell);
      const sharedCandidate = firstPincerCandidates.find(
        (candidate) => candidate !== firstPivotCandidate
      );

      if (!sharedCandidate || sharedCandidate === secondPivotCandidate) {
        return;
      }

      secondSidePincers.forEach((secondPincer) => {
        if (sameCell(firstPincer, secondPincer)) {
          return;
        }

        if (canSee(firstPincer, secondPincer)) {
          return;
        }

        const secondPincerCandidates = getCandidates(secondPincer.cell);
        if (!secondPincerCandidates.includes(sharedCandidate)) {
          return;
        }

        const hints = buildHints([
          { cellRef: pivot, candidates: pivotCandidates },
          { cellRef: firstPincer, candidates: firstPincerCandidates },
          { cellRef: secondPincer, candidates: secondPincerCandidates },
        ]);

        changed =
          eliminateCandidateFromCommonSeenCells(
            allCells,
            [firstPincer, secondPincer],
            sharedCandidate,
            hints
          ) || changed;
      });
    });
  });

  return changed;
}

function getCombinations(values: number[]): number[][] {
  const combinations: number[][] = [];

  for (let first = 0; first < values.length - 1; first++) {
    for (let second = first + 1; second < values.length; second++) {
      combinations.push([values[first], values[second]]);
    }
  }

  return combinations;
}

function applyXYZWing(grid: SudokuGridModel): boolean {
  let changed = false;
  const allCells = getAllUnsolvedCellRefs(grid);
  const bivalueCells = allCells.filter(({ cell }) => getCandidates(cell).length === 2);
  const trivalueCells = allCells.filter(({ cell }) => getCandidates(cell).length === 3);

  trivalueCells.forEach((pivot) => {
    const pivotCandidates = getCandidates(pivot.cell);
    const candidatePairs = getCombinations(pivotCandidates);

    candidatePairs.forEach(([firstPivotCandidate, secondPivotCandidate]) => {
      const sharedCandidate = pivotCandidates.find(
        (candidate) => candidate !== firstPivotCandidate && candidate !== secondPivotCandidate
      );

      if (!sharedCandidate) {
        return;
      }

      const firstExpectedSet = [firstPivotCandidate, sharedCandidate].sort(
        (left, right) => left - right
      );
      const secondExpectedSet = [secondPivotCandidate, sharedCandidate].sort(
        (left, right) => left - right
      );

      const firstPincers = bivalueCells.filter((cellRef) => {
        if (sameCell(cellRef, pivot) || !canSee(cellRef, pivot)) {
          return false;
        }

        const candidates = getCandidates(cellRef.cell).sort((left, right) => left - right);
        return candidates[0] === firstExpectedSet[0] && candidates[1] === firstExpectedSet[1];
      });

      const secondPincers = bivalueCells.filter((cellRef) => {
        if (sameCell(cellRef, pivot) || !canSee(cellRef, pivot)) {
          return false;
        }

        const candidates = getCandidates(cellRef.cell).sort((left, right) => left - right);
        return candidates[0] === secondExpectedSet[0] && candidates[1] === secondExpectedSet[1];
      });

      firstPincers.forEach((firstPincer) => {
        const firstPincerCandidates = getCandidates(firstPincer.cell);

        secondPincers.forEach((secondPincer) => {
          if (sameCell(firstPincer, secondPincer)) {
            return;
          }

          const secondPincerCandidates = getCandidates(secondPincer.cell);
          const hints = buildHints([
            { cellRef: pivot, candidates: pivotCandidates },
            { cellRef: firstPincer, candidates: firstPincerCandidates },
            { cellRef: secondPincer, candidates: secondPincerCandidates },
          ]);

          changed =
            eliminateCandidateFromCommonSeenCells(
              allCells,
              [pivot, firstPincer, secondPincer],
              sharedCandidate,
              hints
            ) || changed;
        });
      });
    });
  });

  return changed;
}

export function _doXYWingWWing(grid: SudokuGridModel): boolean {
  let isUnchanged = true;

  let changed = false;
  changed = applyXYWing(grid) || changed;
  changed = applyXYZWing(grid) || changed;
  isUnchanged = !changed && isUnchanged;

  return isUnchanged;
}

export function doXYWingWWing(grid: SudokuGridModel): boolean {
  return true;
}
