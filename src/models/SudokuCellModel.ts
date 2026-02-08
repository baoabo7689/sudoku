import { SolutionHintModel } from './SolutionHintModel';
import { SolutionStepModel } from './SolutionStepModel';
import { Technique } from './Technique';

// Model for a single Sudoku cell
export interface SudokuCellModel {
  row: number; // Row index (0-2)
  col: number; // Column index (0-2)
  initValue: number | null; // The initial value (given by the puzzle, or null if empty)
  solvedValue: number | null; // The value after solving (or null if not solved)
  possibleValues: boolean[]; // Possible values for this cell
  processedTechniques: Technique[]; // List of techniques that have been applied to this cell
  solutionSteps: SolutionStepModel[]; // Steps that led to the current solved value, if any

  isHint: boolean; // Whether this cell is a hint (given by the puzzle) or not
  isBlocked: boolean; // Whether this cell is blocked (part of the initial puzzle) or not

  addSolvedValue: (value: number | null) => SudokuCellModel;
  blockSolved: (blocked: boolean) => SudokuCellModel;
  blockInit: () => SudokuCellModel;
  reset: () => SudokuCellModel;
  preprocess: () => SudokuCellModel;
  showSolutionSteps: (translation: any, cellId: string) => string; // String representation of the solution steps
}

// Helper to create an empty cell
export function createEmptyCell(row: number, col: number): SudokuCellModel {
  const cell: SudokuCellModel = {
    row,
    col,
    initValue: null,
    solvedValue: null,
    possibleValues: Array(9).fill(true),
    solutionSteps: [],
    isHint: false,
    isBlocked: false,
    addSolvedValue: function (value: number | null) {
      return addSolvedValue(this, value);
    },
    blockSolved: function (blocked: boolean) {
      return blockSolved(this, blocked);
    },
    blockInit: function () {
      return blockInit(this);
    },
    reset: function () {
      return reset(this);
    },
    preprocess: function () {
      return preprocess(this);
    },
    processedTechniques: [],
    showSolutionSteps: function (translation: any, cellId: string) {
      return showSolutionSteps(this, translation, cellId);
    },
  };

  return cell;
}

// Sets the solved value for a cell
export function addSolvedValue(cell: SudokuCellModel, value: number | null): SudokuCellModel {
  // Only allow null or 1-9
  if (value !== null && (typeof value !== 'number' || value < 1 || value > 9)) {
    throw new Error('solvedValue must be 1-9 or null');
  }

  let newPossibleValues;
  if (value !== null) {
    // Set only the solved value to true, others to false
    newPossibleValues = Array(9).fill(false);
    newPossibleValues[value - 1] = true;
  } else {
    // Reset all possible values to true
    newPossibleValues = Array(9).fill(true);
  }

  cell.solvedValue = value;
  cell.possibleValues = newPossibleValues;
  cell.isHint = false; // Solved value is not a hint

  return { ...cell };
}

// Blocks or unblocks a cell if it has solvedValue
export function blockSolved(cell: SudokuCellModel, blocked: boolean): SudokuCellModel {
  if (cell.solvedValue === null) {
    return cell;
  }

  cell.isBlocked = blocked;
  return { ...cell };
}

// block initialization sets the initValue to the solvedValue if it's not null, otherwise leaves it unchanged
export function blockInit(cell: SudokuCellModel): SudokuCellModel {
  if (cell.solvedValue === null) {
    return cell;
  }

  cell.initValue = cell.solvedValue;
  return { ...cell };
}

export function reset(cell: SudokuCellModel): SudokuCellModel {
  if (cell.initValue) {
    return cell;
  }

  cell.processedTechniques = [];
  cell.solutionSteps = [];
  cell.isBlocked = false;

  return cell.addSolvedValue(null);
}

export function showSolutionSteps(cell: SudokuCellModel, translation: any, cellId: string): string {
  if (cell.solutionSteps.length === 0) {
    return translation.noSolutionSteps;
  }

  const message = cell.solutionSteps
    .map((step: SolutionStepModel) => {
      const techniqueMessage = `${translation.technique}: ${translation.techniques[step.technique]}`;
      const detailsMessage = step.hints
        .map((hint: SolutionHintModel) => `r${hint.row + 1}c${hint.col + 1}v${hint.value}`)
        .join(', ');
      return [techniqueMessage, ': ', detailsMessage].join('');
    })
    .join('\n');

  return [`${cellId}:`, message].join('\n');
}

export function preprocess(cell: SudokuCellModel): SudokuCellModel {
  cell.processedTechniques = [];
  cell.solutionSteps = [];
  cell.isHint = false;

  return { ...cell };
}
