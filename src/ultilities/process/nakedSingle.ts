import { SudokuGrid } from "@/models/SudokuGrid";
import { Technique } from "@/models/Technique";

export function doNakedSingle(grid: SudokuGrid): boolean {
  let isUnchanged = true;

  for (let globalRow = 0; globalRow < 9; globalRow++) {
    for (let globalCol = 0; globalCol < 9; globalCol++) {
      const blockRow = Math.floor(globalRow / 3);
      const blockCol = Math.floor(globalCol / 3);
      const rowInBlock = globalRow % 3;
      const colInBlock = globalCol % 3;
      const cell = grid.blocks[blockRow][blockCol].cells[rowInBlock][colInBlock];
      
      if (cell.solvedValue) {
        continue;
      }

      const possibilityCount = cell.possibleValues.filter(value => value).length;
      if(possibilityCount > 1) {
        continue;
      }
      
      const value = cell.possibleValues.indexOf(true) + 1;
      cell.solvedValue = value;
      cell.isHint = true;
      cell.solutionSteps.push({
        technique: Technique.NakedSingle,
        hints: []
      });

      isUnchanged = false;
    }
  }

  return isUnchanged;
}
