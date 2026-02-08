import { SolutionHintModel } from "./SolutionHintModel";
import { Technique } from "./Technique";

export interface SolutionStepModel {
  technique: Technique;
  hints: SolutionHintModel[]
}
