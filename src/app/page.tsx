'use client';

import { useLanguage } from '@/context/LanguageContext';

import { useEffect, useState } from 'react';
import { createEmptySudokuGrid } from '@/models/SudokuGridModel';
import { SudokuValueGrid, SudokuPossibleValuesGrid } from '@/components/SudokuGrids';
import ImportComponent from '@/components/ImportComponent';
import { initUtilities } from '@/utilities/initUtilities';
import { ioUtilities } from '@/utilities/ioUtilities';
import { processUtilities } from '@/utilities/process/processUtilities';
import { Technique, techniques } from '@/models/Technique';
import Select, { MultiValue } from 'react-select';

type TechniqueOption = {
  value: Technique | '__all__';
  label: string;
};

const SELECT_ALL_VALUE = '__all__' as const;

export default function HomePage() {
  const { translations } = useLanguage();
  const [grid, setGrid] = useState(() => createEmptySudokuGrid());
  const [message, setMessage] = useState('');
  const [selectedTechniques, setSelectedTechniques] = useState<Technique[]>([Technique.BruteForce]);
  const [isImportOpen, setIsImportOpen] = useState(false);

  const formatValidationMessage = (issue: ReturnType<typeof grid.validate>[number]) => {
    const template = translations.validation[issue.type] as string;

    return template
      .replace('{value}', String(issue.value))
      .replace('{row}', String(issue.row))
      .replace('{col}', String(issue.col))
      .replace('{prevRow}', String(issue.prevRow))
      .replace('{prevCol}', String(issue.prevCol));
  };

  const getValidationMessage = (targetGrid = grid) => {
    const validationIssues = targetGrid.validate();

    if (validationIssues.length === 0) {
      return translations.validation.noErrors;
    }

    return validationIssues.map(formatValidationMessage).join('\n');
  };

  const handleValidate = () => {
    setMessage(getValidationMessage());
  };

  const handleExport = () => {
    setMessage(grid.export());
  };

  const handleImport = (rawValue: string) => {
    const importResult = ioUtilities.importGrid(rawValue);

    if (!importResult.success) {
      setMessage(translations.interaction.importInvalidFormat);
      return false;
    }

    setGrid(importResult.grid.blockInit());
    setMessage(translations.interaction.importLoaded);
    return true;
  };

  useEffect(() => {
    setMessage(getValidationMessage());
  }, [translations]);

  const handleRandom = (difficulty: 'easy' | 'medium' | 'hard') => {
    let values = initUtilities.random(difficulty);
    let newGrid = createEmptySudokuGrid();

    for (let globalRow = 0; globalRow < 9; globalRow++) {
      for (let globalCol = 0; globalCol < 9; globalCol++) {
        const value = values[globalRow][globalCol];
        if (value === null) {
          continue;
        }

        const blockRow = Math.floor(globalRow / 3);
        const blockCol = Math.floor(globalCol / 3);
        const rowInBlock = globalRow % 3;
        const colInBlock = globalCol % 3;

        newGrid = newGrid.updateCellChange(blockRow, blockCol, rowInBlock, colInBlock, value);
      }
    }

    newGrid = newGrid.blockInit();
    setGrid(newGrid);
  };

  const handleRandomEasy = () => {
    handleRandom('easy');
  };
  const handleRandomMedium = () => {
    handleRandom('medium');
  };
  const handleRandomHard = () => {
    handleRandom('hard');
  };
  const handleBlockInit = () => {
    !grid.isBlockedInit && setGrid(grid.blockInit());
  };
  const handleToggleBlockSolved = () => {
    setGrid(grid.blockSolved(!grid.isBlocked));
  };
  const blockSolvedButtonText = grid.isBlocked
    ? translations.interaction.unblockSolved
    : translations.interaction.blockSolved;
  const handleReset = () => {
    setGrid(grid.reset());
  };
  const techniqueOptions: TechniqueOption[] = [
    {
      value: SELECT_ALL_VALUE,
      label: translations.interaction.selectAll,
    },
    ...techniques.map((technique) => ({
      value: technique,
      label: translations.techniques[technique],
    })),
  ];

  const selectedTechniqueOptions = techniqueOptions.filter(
    (option) =>
      option.value !== SELECT_ALL_VALUE && selectedTechniques.includes(option.value as Technique)
  );

  const handleTechniqueChange = (selectedOptions: MultiValue<TechniqueOption>) => {
    const hasSelectAll = selectedOptions.some((option) => option.value === SELECT_ALL_VALUE);

    if (hasSelectAll) {
      const isAllSelected = selectedTechniques.length === techniques.length;
      setSelectedTechniques(isAllSelected ? [] : [...techniques]);
      return;
    }

    setSelectedTechniques(selectedOptions.map((option) => option.value as Technique));
  };

  const handleProcess = () => {
    const validationIssues = grid.validate();

    if (validationIssues.length > 0) {
      setMessage(getValidationMessage());
      return;
    }

    const processedResult = processUtilities.process(grid, selectedTechniques, translations);
    setGrid(processedResult.grid);
    setMessage(processedResult.message);
  };

  return (
    <main className="min-h-screen items-center justify-center bg-gradient-to-br from-blue-100 via-white to-pink-100">
      <section className="w-full shadow-xl bg-white border border-gray-200 pl-6">
        {/* Init Block */}
        <div className="mt-3 mb-3">
          <span className="flex gap-4">
            <span className="label-interaction">
              <h2 className="text-2xl font-bold tracking-tight drop-shadow">
                {translations.interaction.initTitle}
              </h2>
            </span>
            <button
              className="btn-interaction"
              title={translations.interaction.randomEasy}
              onClick={handleRandomEasy}
            >
              {translations.interaction.randomEasy}
            </button>
            <button
              className="btn-interaction"
              title={translations.interaction.randomMedium}
              onClick={handleRandomMedium}
            >
              {translations.interaction.randomMedium}
            </button>
            <button
              className="btn-interaction"
              title={translations.interaction.randomHard}
              onClick={handleRandomHard}
            >
              {translations.interaction.randomHard}
            </button>
            <button
              className="btn-interaction"
              title={translations.interaction.import}
              onClick={() => setIsImportOpen(true)}
            >
              {translations.interaction.import}
            </button>
            <button
              className="btn-interaction"
              title={translations.interaction.manual}
              onClick={() => setGrid(createEmptySudokuGrid())}
            >
              {translations.interaction.manual}
            </button>
          </span>
        </div>
        {/* Functional Block */}
        <div className="mb-3">
          <span className="flex gap-4">
            <span className="label-interaction">
              <h2 className="text-2xl font-bold tracking-tight drop-shadow">
                {translations.interaction.functionalTitle}
              </h2>
            </span>
            <button
              className="btn-interaction"
              title={translations.interaction.blockInit}
              onClick={handleBlockInit}
            >
              {translations.interaction.blockInit}
            </button>
            <button
              className="btn-interaction"
              title={translations.interaction.reset}
              onClick={handleReset}
            >
              {translations.interaction.reset}
            </button>
            <button
              className="btn-interaction"
              title={translations.interaction.validate}
              onClick={handleValidate}
            >
              {translations.interaction.validate}
            </button>
            <button
              className="btn-interaction"
              title={translations.interaction.export}
              onClick={handleExport}
            >
              {translations.interaction.export}
            </button>
            <button
              className="btn-interaction"
              title={blockSolvedButtonText}
              onClick={handleToggleBlockSolved}
            >
              {blockSolvedButtonText}
            </button>
          </span>
        </div>
        {/* Solve Block */}
        <div className="mb-3">
          <span className="flex gap-4">
            <span className="label-interaction">
              <h2 className="text-2xl font-bold tracking-tight drop-shadow">
                {translations.interaction.techniquesTitle}
              </h2>
            </span>
            <div className="min-w-[320px]">
              <Select
                isMulti
                options={techniqueOptions}
                value={selectedTechniqueOptions}
                onChange={handleTechniqueChange}
                closeMenuOnSelect={false}
                className="ddl-solutions"
                classNamePrefix="ddl-solutions"
              />
            </div>
            <button className="btn-interaction" onClick={handleProcess}>
              {translations.interaction.process}
            </button>
          </span>
        </div>
      </section>
      <section className="w-full shadow-xl bg-white border border-gray-200 pl-6">
        {/* Sudoku Grids Section */}
        <div className="flex flex-col md:flex-row gap-8 mt-8 mb-8 items-start justify-center">
          <div>
            <h3 className="text-lg font-semibold mb-2">{translations.grids.sudokuValueTitle}</h3>
            <SudokuValueGrid grid={grid} setGrid={setGrid} />
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">{translations.grids.possibleValuesTitle}</h3>
            <SudokuPossibleValuesGrid
              grid={grid}
              translations={translations}
              onCellInputClick={setMessage}
            />
          </div>
          <div className="w-full max-w-md">
            <h3 className="text-lg font-semibold mb-2">{translations.validation.messageTitle}</h3>
            <textarea
              className="w-full min-h-[380px] resize-y rounded-md border border-gray-300 bg-gray-50 p-3 text-sm text-gray-700 outline-none"
              value={message}
              readOnly
              placeholder={translations.validation.messagePlaceholder}
            />
          </div>
        </div>
      </section>
      <ImportComponent
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onLoad={handleImport}
        translations={translations}
      />
    </main>
  );
}
