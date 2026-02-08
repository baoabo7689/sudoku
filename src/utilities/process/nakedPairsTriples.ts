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

function isSubset(values: number[], allowed: Set<number>): boolean {
  return values.every((value) => allowed.has(value));
}

function eliminateFromHouse(
  houseCells: CellRef[],
  patternCells: CellRef[],
  candidates: number[]
): boolean {
  const allowed = new Set(candidates);
  const isPatternStillValid = patternCells.every(({ cell }) => {
    if (cell.solvedValue) {
      return false;
    }

    const currentCandidates = getCandidates(cell);
    return (
      currentCandidates.length >= 2 &&
      currentCandidates.length <= candidates.length &&
      isSubset(currentCandidates, allowed)
    );
  });

  if (!isPatternStillValid) {
    return false;
  }

  const patternKey = new Set(
    patternCells.map(({ globalRow, globalCol }) => `${globalRow}-${globalCol}`)
  );
  const hints = buildHints(patternCells, candidates);
  let changed = false;

  houseCells.forEach(({ cell, globalRow, globalCol }) => {
    if (cell.solvedValue || patternKey.has(`${globalRow}-${globalCol}`)) {
      return;
    }

    const currentCandidates = getCandidates(cell);
    if (currentCandidates.length <= 1) {
      return;
    }

    const removableCandidates = candidates.filter(
      (candidate) => cell.possibleValues[candidate - 1]
    );
    if (
      removableCandidates.length === 0 ||
      removableCandidates.length >= currentCandidates.length
    ) {
      return;
    }

    removableCandidates.forEach((candidate) => {
      cell.possibleValues[candidate - 1] = false;
      cell.solutionSteps.push({
        technique: Technique.NakedPairsTriples,
        hints,
      });
      changed = true;
    });
  });

  return changed;
}

function applyNakedPairs(houseCells: CellRef[]): boolean {
  const pairs = new Map<string, CellRef[]>();

  houseCells.forEach((cellRef) => {
    if (cellRef.cell.solvedValue) {
      return;
    }

    const candidates = getCandidates(cellRef.cell);
    if (candidates.length !== 2) {
      return;
    }

    const key = candidates.join('-');
    if (!pairs.has(key)) {
      pairs.set(key, []);
    }

    pairs.get(key)!.push(cellRef);
  });

  let changed = false;
  pairs.forEach((patternCells, key) => {
    if (patternCells.length !== 2) {
      return;
    }

    const candidates = key.split('-').map(Number);
    const candidateSet = new Set(candidates);
    const isStillPair = patternCells.every(({ cell }) => {
      if (cell.solvedValue) {
        return false;
      }

      const currentCandidates = getCandidates(cell);
      return currentCandidates.length === 2 && isSubset(currentCandidates, candidateSet);
    });

    if (!isStillPair) {
      return;
    }

    changed = eliminateFromHouse(houseCells, patternCells, candidates) || changed;
  });

  return changed;
}

function applyNakedTriples(houseCells: CellRef[]): boolean {
  const unresolved = houseCells.filter(({ cell }) => {
    if (cell.solvedValue) {
      return false;
    }

    const candidateCount = getCandidates(cell).length;
    return candidateCount >= 2 && candidateCount <= 3;
  });

  let changed = false;

  for (let first = 0; first < unresolved.length - 2; first++) {
    for (let second = first + 1; second < unresolved.length - 1; second++) {
      for (let third = second + 1; third < unresolved.length; third++) {
        const patternCells = [unresolved[first], unresolved[second], unresolved[third]];
        const candidateSet = new Set<number>();
        const candidateLists = patternCells.map(({ cell }) => getCandidates(cell));

        if (candidateLists.some((candidates) => candidates.length < 2 || candidates.length > 3)) {
          continue;
        }

        candidateLists.forEach((candidates) => {
          candidates.forEach((candidate) => candidateSet.add(candidate));
        });

        if (candidateSet.size !== 3) {
          continue;
        }

        changed = eliminateFromHouse(houseCells, patternCells, [...candidateSet]) || changed;
      }
    }
  }

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

export function _doNakedPairsTriples(grid: SudokuGridModel): boolean {
  let isUnchanged = true;

  for (let row = 0; row < 9; row++) {
    const houseCells = getRowCells(grid, row);
    const changed = applyNakedPairs(houseCells) || applyNakedTriples(houseCells);
    isUnchanged = !changed && isUnchanged;
  }

  for (let col = 0; col < 9; col++) {
    const houseCells = getColCells(grid, col);
    const changed = applyNakedPairs(houseCells) || applyNakedTriples(houseCells);
    isUnchanged = !changed && isUnchanged;
  }

  for (let blockRow = 0; blockRow < 3; blockRow++) {
    for (let blockCol = 0; blockCol < 3; blockCol++) {
      const houseCells = getBoxCells(grid, blockRow, blockCol);
      const changed = applyNakedPairs(houseCells) || applyNakedTriples(houseCells);
      isUnchanged = !changed && isUnchanged;
    }
  }

  return isUnchanged;
}

export function doNakedPairsTriples(grid: SudokuGridModel): boolean {
  return true;
}
