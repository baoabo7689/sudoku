import type { SudokuGrid } from "@/models/SudokuGrid";

export interface ProcessResultModel {
  grid: SudokuGrid;
  message: string;
}
