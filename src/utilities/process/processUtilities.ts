import type { ProcessResultModel } from '@/models/ProcessResultModel';
import { type SudokuGridModel } from '@/models/SudokuGridModel';
import { Technique } from '@/models/Technique';
import { doBruteForce } from '@/utilities/process/bruteForce';
import { doScanningCrossHatching } from './scanningCrossHatching';
import { doLastFreeCellHiddenSingle } from './lastFreeCellHiddenSingle';
import { doNakedSingle } from './nakedSingle';
import { doNakedPairsTriples } from './nakedPairsTriples';
import { doHiddenPairsTriples } from './hiddenPairsTriples';
import { doPointingPairsTriples } from './pointingPairsTriples';
import { doLockedCandidates } from './lockedCandidates';
import { doXWing } from './xwing';
import { doXYWingWWing } from './xyWingWWing';
import { doSwordfish } from './swordfish';

const techniqueFunctions = {
  [Technique.ScanningCrossHatching]: doScanningCrossHatching,
  [Technique.LastFreeCellHiddenSingle]: doLastFreeCellHiddenSingle,
  [Technique.NakedSingle]: doNakedSingle,
  [Technique.NakedPairsTriples]: doNakedPairsTriples,
  [Technique.HiddenPairsTriples]: doHiddenPairsTriples,
  [Technique.PointingPairsTriples]: doPointingPairsTriples,
  [Technique.LockedCandidates]: doLockedCandidates,
  [Technique.XWing]: doXWing,
  [Technique.Swordfish]: doSwordfish,
  [Technique.XYWingWWing]: doXYWingWWing,
};

function deepCopyGrid(grid: SudokuGridModel): SudokuGridModel {
  return {
    ...grid,
    blocks: grid.blocks.map((blockRow) =>
      blockRow.map((block) => ({
        ...block,
        cells: block.cells.map((row) => row.map((cell) => ({ ...cell }))),
      }))
    ),
  };
}

function process(
  grid: SudokuGridModel,
  selectedTechniques: Technique[],
  translations: any
): ProcessResultModel {
  const techniqueNames = selectedTechniques.map(
    (technique) => translations.techniques[technique] ?? technique
  );
  const processedMessage = translations.processing.processedWithTechniques.replace(
    '{techniques}',
    techniqueNames.join(', ')
  );

  grid = grid.preprocess(); // Preprocess to update possible values before processing techniques

  if (selectedTechniques.includes(Technique.BruteForce)) {
    const solvedGrid = doBruteForce(grid);

    if (!solvedGrid) {
      return {
        grid,
        message: `${processedMessage}\n${translations.processing.noSolutionFound}`,
      };
    }

    return {
      grid: solvedGrid,
      message: processedMessage,
    };
  }

  let updateGrid = false;

  let maxTry = 100;

  while (maxTry--) {
    let isUnchanged = true;

    Object.entries(techniqueFunctions).forEach(([technique, func]) => {
      if (selectedTechniques.includes(technique as Technique)) {
        isUnchanged = func(grid) && isUnchanged;
      }
    });

    if (isUnchanged) {
      break;
    }

    updateGrid = true;
  }

  return {
    grid: updateGrid ? grid : deepCopyGrid(grid),
    message: processedMessage,
  };
}

export const processUtilities = {
  process,
};
