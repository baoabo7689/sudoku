import type { SudokuGridModel } from '@/models/SudokuGridModel';

export interface ProcessResultModel {
  grid: SudokuGridModel;
  message: string;
}
