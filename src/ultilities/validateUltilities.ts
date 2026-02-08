import type { SudokuGrid } from "@/models/SudokuGrid";

export type ValidationIssueType = 'rowDuplicate' | 'columnDuplicate' | 'blockDuplicate';

export interface ValidationIssue {
    type: ValidationIssueType;
    value: number;
    row: number;
    col: number;
    prevRow: number;
    prevCol: number;
}

export function validateRows(grid: SudokuGrid): ValidationIssue[] {
        const issues: ValidationIssue[] = [];

    for (let globalRow = 0; globalRow < 9; globalRow++) {
        const numbers: any[] = [];

        for (let globalCol = 0; globalCol < 9; globalCol++) {
            const blockRow = Math.floor(globalRow / 3);
            const blockCol = Math.floor(globalCol / 3);
            const rowInBlock = globalRow % 3;
            const colInBlock = globalCol % 3;


            const cell = grid.blocks[blockRow][blockCol].cells[rowInBlock][colInBlock];
            const value = cell.solvedValue;
            if (value === null) {
                continue;
            }

            if (!numbers[value]) {
                numbers[value] = { row: globalRow, col: globalCol };
                continue;
            }

                        const prevCell = numbers[value];
                        issues.push({
                            type: 'rowDuplicate',
                            value,
                            row: globalRow + 1,
                            col: globalCol + 1,
                            prevRow: prevCell.row + 1,
                            prevCol: prevCell.col + 1
                        });
        }
    }

        return issues;
}

export function validateColumns(grid: SudokuGrid): ValidationIssue[] {
     const issues: ValidationIssue[] = [];

    for (let globalCol = 0; globalCol < 9; globalCol++) {
        const numbers: any[] = [];

        for (let globalRow = 0; globalRow < 9; globalRow++) {
            const blockRow = Math.floor(globalRow / 3);
            const blockCol = Math.floor(globalCol / 3);
            const rowInBlock = globalRow % 3;
            const colInBlock = globalCol % 3;

            const cell = grid.blocks[blockRow][blockCol].cells[rowInBlock][colInBlock];
            const value = cell.solvedValue;
            if (value === null) {
                continue;
            }

            if (!numbers[value]) {
                numbers[value] = { row: globalRow, col: globalCol };
                continue;
            }

                        const prevCell = numbers[value];
                        issues.push({
                            type: 'columnDuplicate',
                            value,
                            row: globalRow + 1,
                            col: globalCol + 1,
                            prevRow: prevCell.row + 1,
                            prevCol: prevCell.col + 1
                        });
        }
    }

        return issues;
}

export function validateBlocks(grid: SudokuGrid): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    for (let blockRow = 0; blockRow < 3; blockRow++) {
        for (let blockCol = 0; blockCol < 3; blockCol++) {
            const numbers: Array<{ row: number; col: number } | undefined> = [];

            for (let rowInBlock = 0; rowInBlock < 3; rowInBlock++) {
                for (let colInBlock = 0; colInBlock < 3; colInBlock++) {
                    const globalRow = blockRow * 3 + rowInBlock;
                    const globalCol = blockCol * 3 + colInBlock;
                    const cell = grid.blocks[blockRow][blockCol].cells[rowInBlock][colInBlock];
                    const value = cell.solvedValue;

                    if (value === null) {
                        continue;
                    }

                    if (!numbers[value]) {
                        numbers[value] = { row: globalRow + 1, col: globalCol + 1 };
                        continue;
                    }

                    const prevCell = numbers[value]!;
                    issues.push({
                        type: 'blockDuplicate',
                        value,
                        row: globalRow + 1,
                        col: globalCol + 1,
                        prevRow: prevCell.row,
                        prevCol: prevCell.col
                    });
                }
            }
        }
    }

    return issues;
}

export function validateGrid(grid: SudokuGrid): ValidationIssue[] {
        const issues: ValidationIssue[] = [];
        issues.push(...validateBlocks(grid));
        issues.push(...validateRows(grid));
        issues.push(...validateColumns(grid));
        return issues;
}

export const validateUltilities = {
  validateGrid
};
