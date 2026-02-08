# Sudoku

## Overview

This project is a Sudoku web app built with Next.js (App Router) + React + TypeScript + Tailwind CSS.  
The app supports manual input, random puzzle generation, import/export, validation, candidate visualization, and multi-technique solving.

At runtime, state is managed by a model tree:

- `SudokuGridModel` (9x9)
- `SudokuBlockModel` (3x3 blocks)
- `SudokuCellModel` (single cell with value/candidates/steps)

The UI is localized (`en`, `vi`) via `LanguageContext` and i18n dictionaries.

## Tech Stack

- Next.js `13.4.x` (`output: 'export'`)
- React `18`
- TypeScript `5`
- Tailwind CSS `3`
- `react-select`, `lucide-react`, `react-flagkit`

## Scripts

- `yarn dev`: Run development server
- `yarn build`: Build Next.js app
- `yarn export`: Export static site
- `yarn start`: Start production server
- `yarn format`: Format all files with Prettier
- `yarn format:check`: Check formatting
- `yarn test`: Placeholder (no tests yet)

## Runtime Flow

1. User creates puzzle via manual input, random generation, or import.
2. `blockInit()` can freeze initial values.
3. `validate()` checks row/column/block duplicates.
4. `processUtilities.process()` applies selected solving techniques.
5. UI shows solved values, candidate grid, and per-cell solution-step messages.
6. `export()` outputs puzzle as 9 lines (`_` for empty).

## Code Summary (All Source Files)

### `src/app`

- `src/app/layout.tsx`: Root app layout, loads global styles, wraps app with `LanguageProvider`, and renders the shared header.
- `src/app/page.tsx`: Main Sudoku page; owns grid/message state and actions for random/import/manual/block/reset/validate/export/process.
- `src/app/help/page.tsx`: Help page showing localized Sudoku rules and technique explanations.

### `src/components`

- `src/components/Header.tsx`: Top navigation with title, language switch, contact, and help buttons.
- `src/components/LanguageButton.tsx`: Language selector dropdown (`en` / `vi`) with open/close and click-outside logic.
- `src/components/HelpButton.tsx`: Help page navigation icon/button.
- `src/components/ContactButton.tsx`: External contact link using `NEXT_PUBLIC_CONTACT_URL`.
- `src/components/ImportComponent.tsx`: Import modal for pasting puzzle text and invoking load/cancel callbacks.
- `src/components/SudokuGrids.tsx`: Renders Sudoku value grid and candidate grid, including cell blocking/disable and hint coloring.

### `src/context`

- `src/context/LanguageContext.tsx`: Provides current language, translation object, and setter via React context.

### `src/i18n`

- `src/i18n/index.ts`: Locale helper utilities, localStorage persistence, and translation resolver.
- `src/i18n/en.ts`: English translation strings (headers, interactions, validation, help, techniques).
- `src/i18n/vi.ts`: Vietnamese translation strings.

### `src/models`

- `src/models/Technique.ts`: Technique enum and selectable technique list.
- `src/models/ProcessResultModel.ts`: Result shape used by process pipeline (`grid`, `message`).
- `src/models/SolutionHintModel.ts`: Hint model (`row`, `col`, `value`) used in solution steps.
- `src/models/SolutionStepModel.ts`: Solution step model (`technique`, `hints`).
- `src/models/SudokuCellModel.ts`: Cell-level state and operations (set value, block, reset, preprocess, render solution-step text).
- `src/models/SudokuBlockModel.ts`: Block-level wrapper around 3x3 cells with update/block/reset/preprocess operations.
- `src/models/SudokuGridModel.ts`: Grid-level API (update cell, block solved/init, validate, reset, preprocess, export) and flags (`isBlockedInit`, `isBlocked`).

### `src/utilities`

- `src/utilities/initUtilities.ts`: Random puzzle generation by difficulty.
- `src/utilities/ioUtilities.ts`: Import parser for puzzle text (`1-9`, `_`, `0`, `.` support).
- `src/utilities/validateUtilities.ts`: Validation engine for duplicate values in rows, columns, and blocks.

### `src/utilities/process`

- `src/utilities/process/processUtilities.ts`: Main orchestrator that runs selected techniques and returns process result.
- `src/utilities/process/bruteForce.ts`: Backtracking solver, converts model to matrix and writes solved values back.
- `src/utilities/process/scanningCrossHatching.ts`: Candidate elimination/scanning logic and row/column/block placement checks.
- `src/utilities/process/lastFreeCellHiddenSingle.ts`: Placeholder for last-free-cell/hidden-single strategy.
- `src/utilities/process/nakedSingle.ts`: Solves cells that have exactly one candidate and records hint metadata.
- `src/utilities/process/nakedPairsTriples.ts`: Naked pairs/triples logic (contains internal implementation scaffold).
- `src/utilities/process/hiddenPairsTriples.ts`: Hidden pairs/triples logic (contains internal implementation scaffold).
- `src/utilities/process/pointingPairsTriples.ts`: Pointing pairs/triples logic (contains internal implementation scaffold).
- `src/utilities/process/lockedCandidates.ts`: Locked candidates logic (contains internal implementation scaffold).
- `src/utilities/process/xwing.ts`: X-Wing logic (contains internal implementation scaffold).
- `src/utilities/process/swordfish.ts`: Swordfish logic (contains internal implementation scaffold).
- `src/utilities/process/xyWingWWing.ts`: XY-Wing/W-Wing logic (contains internal implementation scaffold).

## Notes

- Utility folder and file naming now uses `utilities` consistently.
- Some advanced strategies include scaffold/internal logic that may be partially wired depending on current exports.
- `next.config.js` is configured for static export and base path support.
