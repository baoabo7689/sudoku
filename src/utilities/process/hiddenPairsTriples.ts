import { SudokuGridModel } from '@/models/SudokuGridModel';
import { SudokuCellModel } from '@/models/SudokuCellModel';
import { Technique } from '@/models/Technique';

interface CellRef {
  cell: SudokuCellModel;
  globalRow: number;
  globalCol: number;
}

function getCandidates(cell: SudokuCellModel): number[] {
  return cell.possibleValues
    .map((isPossible, index) => (isPossible ? index + 1 : 0))
    .filter((value) => value > 0);
}

function buildHints(patternCells: CellRef[], candidates: number[]) {
  return patternCells.flatMap(({ globalRow, globalCol }) =>
    candidates.map((value) => ({
      row: globalRow,
      col: globalCol,
      value,
    }))
  );
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
    (step) => step.technique === Technique.HiddenPairsTriples && areHintsEqual(step.hints, hints)
  );

  if (duplicatedStep) {
    return;
  }

  cell.solutionSteps.push({
    technique: Technique.HiddenPairsTriples,
    hints,
  });
}

function getCellKey(cellRef: CellRef): string {
  return `${cellRef.globalRow}-${cellRef.globalCol}`;
}

function hasCandidateOutsidePattern(
  houseCells: CellRef[],
  patternKeys: Set<string>,
  candidate: number
): boolean {
  return houseCells.some((cellRef) => {
    if (cellRef.cell.solvedValue || patternKeys.has(getCellKey(cellRef))) {
      return false;
    }

    return cellRef.cell.possibleValues[candidate - 1];
  });
}

function buildCandidateMap(houseCells: CellRef[]): Map<number, CellRef[]> {
  const candidateMap = new Map<number, CellRef[]>();

  for (let candidate = 1; candidate <= 9; candidate++) {
    candidateMap.set(candidate, []);
  }

  houseCells.forEach((cellRef) => {
    if (cellRef.cell.solvedValue) {
      return;
    }

    getCandidates(cellRef.cell).forEach((candidate) => {
      candidateMap.get(candidate)!.push(cellRef);
    });
  });

  return candidateMap;
}

function generateNumberCombinations(size: number): number[][] {
  const combinations: number[][] = [];

  if (size === 2) {
    for (let first = 1; first <= 8; first++) {
      for (let second = first + 1; second <= 9; second++) {
        combinations.push([first, second]);
      }
    }
    return combinations;
  }

  for (let first = 1; first <= 7; first++) {
    for (let second = first + 1; second <= 8; second++) {
      for (let third = second + 1; third <= 9; third++) {
        combinations.push([first, second, third]);
      }
    }
  }

  return combinations;
}

function applyHiddenSet(houseCells: CellRef[], size: 2 | 3): boolean {
  const candidateMap = buildCandidateMap(houseCells);
  const combinations = generateNumberCombinations(size);
  let changed = false;

  combinations.forEach((combination) => {
    const patternCellMap = new Map<string, CellRef>();
    let isValidCombination = true;

    for (const candidate of combination) {
      const cells = candidateMap
        .get(candidate)!
        .filter(({ cell }) => cell.possibleValues[candidate - 1]);

      if (cells.length < 2 || cells.length > size) {
        isValidCombination = false;
        break;
      }

      cells.forEach((cellRef) => {
        patternCellMap.set(`${cellRef.globalRow}-${cellRef.globalCol}`, cellRef);
      });
    }

    if (!isValidCombination) {
      return;
    }

    if (patternCellMap.size !== size) {
      return;
    }

    const patternCells = [...patternCellMap.values()];
    const patternKeys = new Set(patternCells.map((cellRef) => getCellKey(cellRef)));
    const allowedCandidates = new Set(combination);
    const hints = buildHints(patternCells, combination);

    const isPatternStillValid = patternCells.every(({ cell }) =>
      combination.some((candidate) => cell.possibleValues[candidate - 1])
    );

    if (!isPatternStillValid) {
      return;
    }

    const hasUnsafeLockedCandidate = patternCells.some(({ cell }) =>
      getCandidates(cell).some(
        (candidate) =>
          !allowedCandidates.has(candidate) &&
          !hasCandidateOutsidePattern(houseCells, patternKeys, candidate)
      )
    );

    if (hasUnsafeLockedCandidate) {
      return;
    }

    patternCells.forEach(({ cell }) => {
      const currentCandidates = getCandidates(cell);
      const removableCandidates = currentCandidates.filter(
        (candidate) =>
          !allowedCandidates.has(candidate) &&
          hasCandidateOutsidePattern(houseCells, patternKeys, candidate)
      );

      if (
        removableCandidates.length === 0 ||
        removableCandidates.length >= currentCandidates.length
      ) {
        return;
      }

      let removedAnyCandidate = false;
      removableCandidates.forEach((candidate) => {
        cell.possibleValues[candidate - 1] = false;
        removedAnyCandidate = true;
        changed = true;
      });

      if (removedAnyCandidate) {
        appendSolutionStepIfMissing(cell, hints);
      }
    });
  });

  return changed;
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

function getBoxCells(grid: SudokuGridModel, blockRow: number, blockCol: number): CellRef[] {
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

export function _doHiddenPairsTriples(grid: SudokuGridModel): boolean {
  let isUnchanged = true;

  for (let row = 0; row < 9; row++) {
    const houseCells = getRowCells(grid, row);
    const changed = applyHiddenSet(houseCells, 2) || applyHiddenSet(houseCells, 3);
    isUnchanged = !changed && isUnchanged;
  }

  for (let col = 0; col < 9; col++) {
    const houseCells = getColCells(grid, col);
    const changed = applyHiddenSet(houseCells, 2) || applyHiddenSet(houseCells, 3);
    isUnchanged = !changed && isUnchanged;
  }

  for (let blockRow = 0; blockRow < 3; blockRow++) {
    for (let blockCol = 0; blockCol < 3; blockCol++) {
      const houseCells = getBoxCells(grid, blockRow, blockCol);
      const changed = applyHiddenSet(houseCells, 2) || applyHiddenSet(houseCells, 3);
      isUnchanged = !changed && isUnchanged;
    }
  }

  return isUnchanged;
}

export function doHiddenPairsTriples(grid: SudokuGridModel): boolean {
  return true;
}
