export enum Technique {
  BruteForce = 'bruteForce',
  ScanningCrossHatching = 'scanningCrossHatching',
  LastFreeCellHiddenSingle = 'lastFreeCellHiddenSingle',
  NakedSingle = 'nakedSingle',
  NakedPairsTriples = 'nakedPairsTriples',
  HiddenPairsTriples = 'hiddenPairsTriples',
  PointingPairsTriples = 'pointingPairsTriples',
  LockedCandidates = 'lockedCandidates',
  XWing = 'xWing',
  Swordfish = 'swordfish',
  XYWingWWing = 'xyWingWWing'
}

export const techniques: Technique[] = [
  Technique.BruteForce,
  Technique.ScanningCrossHatching,
  Technique.LastFreeCellHiddenSingle,
  Technique.NakedSingle,
  Technique.NakedPairsTriples,
  Technique.HiddenPairsTriples,
  Technique.PointingPairsTriples,
  Technique.LockedCandidates,
  Technique.XWing,
  Technique.Swordfish,
  Technique.XYWingWWing
];