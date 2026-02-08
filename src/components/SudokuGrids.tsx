import React from 'react';
import { SudokuGridModel } from '@/models/SudokuGridModel';

// Renders a 9x9 Sudoku value grid
export function SudokuValueGrid({
  grid,
  setGrid,
}: {
  grid: SudokuGridModel;
  setGrid: (g: SudokuGridModel) => void;
}) {
  // Render 9 rows, each with 9 columns, using global row/col, with textbox for each cell
  // Handler to update cell value using addSolvedValue
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    br: number,
    bc: number,
    r: number,
    c: number
  ) => {
    const val = e.target.value;
    if (val === '' || /^[1-9]$/.test(val)) {
      const newGrid: SudokuGridModel = grid.updateCellChange(
        br,
        bc,
        r,
        c,
        val === '' ? null : parseInt(val)
      );
      setGrid(newGrid);
    }
  };

  return (
    <div className="inline-block border-4 border-gray-700 bg-white">
      {Array.from({ length: 9 }).map((_, globalRow) => (
        <div className="flex" key={`row-${globalRow}`}>
          {Array.from({ length: 9 }).map((_, globalCol) => {
            const br = Math.floor(globalRow / 3);
            const bc = Math.floor(globalCol / 3);
            const r = globalRow % 3;
            const c = globalCol % 3;
            const cell = grid.blocks[br][bc].cells[r][c];
            const isInitCell = cell.initValue !== null;
            const isBlockedCell = cell.isBlocked;
            const isDisabledCell = isInitCell || isBlockedCell;
            const cellBackgroundClass = isInitCell
              ? 'bg-gray-200'
              : isBlockedCell
                ? 'bg-blue-100'
                : 'bg-gray-50';
            const cellTextClass = isInitCell
              ? 'text-gray-600 font-semibold cursor-not-allowed'
              : isBlockedCell
                ? 'text-blue-700 font-semibold cursor-not-allowed'
                : '';
            const borderRight =
              globalCol === 2 || globalCol === 5 ? 'border-r-4 border-r-gray-700' : '';
            const borderBottom =
              globalRow === 2 || globalRow === 5 ? 'border-b-4 border-b-gray-700' : '';
            const borderLeft = globalCol === 0 ? 'border-l-0' : '';
            const borderTop = globalRow === 0 ? 'border-t-0' : '';
            return (
              <div
                key={`cell-${globalRow}-${globalCol}`}
                className={`w-8 h-8 flex items-center justify-center border border-gray-300 text-lg ${cellBackgroundClass} ${borderRight} ${borderBottom} ${borderLeft} ${borderTop}`}
              >
                <input
                  type="text"
                  className={`w-full h-full text-center bg-transparent outline-none ${isDisabledCell ? cellTextClass : ''}`}
                  maxLength={1}
                  onChange={(e) => handleInputChange(e, br, bc, r, c)}
                  value={cell.solvedValue || ''}
                  disabled={isDisabledCell}
                />
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// Renders a 9x9 grid of 9-value textboxes for possible values
export function SudokuPossibleValuesGrid({
  grid,
  onCellInputClick,
  translations,
}: {
  grid: SudokuGridModel;
  onCellInputClick?: (message: string) => void;
  translations: any;
}) {
  // Render 9 rows, each with 9 columns, using global row/col
  return (
    <div className="inline-block border-4 border-gray-700 bg-white">
      {Array.from({ length: 9 }).map((_, globalRow) => (
        <div className="flex" key={`poss-row-${globalRow}`}>
          {Array.from({ length: 9 }).map((_, globalCol) => {
            const br = Math.floor(globalRow / 3);
            const bc = Math.floor(globalCol / 3);
            const r = globalRow % 3;
            const c = globalCol % 3;
            const cell = grid.blocks[br][bc].cells[r][c];
            const isInitCell = cell.initValue !== null;
            const isBlockedCell = cell.isBlocked;
            const isHintCell = cell.isHint;
            const cellBackgroundClass = isHintCell
              ? 'bg-orange-100'
              : isInitCell
                ? 'bg-gray-200'
                : isBlockedCell
                  ? 'bg-blue-100'
                  : 'bg-gray-50';
            const cellTextClass = isHintCell
              ? 'text-orange-700'
              : isInitCell
                ? 'text-gray-500 cursor-not-allowed'
                : isBlockedCell
                  ? 'text-blue-700 cursor-not-allowed'
                  : '';
            const borderRight =
              globalCol === 2 || globalCol === 5 ? 'border-r-4 border-r-gray-700' : '';
            const borderBottom =
              globalRow === 2 || globalRow === 5 ? 'border-b-4 border-b-gray-700' : '';
            const borderLeft = globalCol === 0 ? 'border-l-0' : '';
            const borderTop = globalRow === 0 ? 'border-t-0' : '';
            return (
              <div
                key={`poss-cell-${globalRow}-${globalCol}`}
                className={`w-10 h-10 border border-gray-300 ${cellBackgroundClass} flex items-center justify-center ${borderRight} ${borderBottom} ${borderLeft} ${borderTop}`}
              >
                <div
                  className="grid grid-cols-3 grid-rows-3 w-full h-full gap-px"
                  onClick={() =>
                    onCellInputClick?.(
                      cell.showSolutionSteps(translations, `r${globalRow + 1}c${globalCol + 1}`)
                    )
                  }
                >
                  {cell.possibleValues.map((v, i) => (
                    <input
                      key={i}
                      type="text"
                      className={`w-3 h-3 text-[10px] text-center border border-gray-200 bg-transparent p-0 m-0 ${cellTextClass}`}
                      value={v ? i + 1 : ''}
                      readOnly
                      disabled={isInitCell || isBlockedCell}
                      tabIndex={-1}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
