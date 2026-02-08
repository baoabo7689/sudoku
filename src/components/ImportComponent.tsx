import { useEffect, useState } from 'react';

interface ImportComponentProps {
  isOpen: boolean;
  onClose: () => void;
  onLoad: (rawValue: string) => boolean;
  translations: any;
}

export default function ImportComponent({
  isOpen,
  onClose,
  onLoad,
  translations,
}: ImportComponentProps) {
  const [importValue, setImportValue] = useState('');

  useEffect(() => {
    if (isOpen) {
      setImportValue('');
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleLoad = () => {
    const isLoaded = onLoad(importValue);
    if (isLoaded) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-xl rounded-lg border border-gray-200 bg-white p-4 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{translations.interaction.import}</h3>
          <button className="btn-interaction" onClick={onClose}>
            {translations.interaction.cancel}
          </button>
        </div>
        <textarea
          className="mb-3 w-full min-h-[220px] resize-y rounded-md border border-gray-300 bg-gray-50 p-3 text-sm text-gray-700 outline-none"
          value={importValue}
          onChange={(e) => setImportValue(e.target.value)}
          placeholder={translations.interaction.importPlaceholder}
        />
        <div className="flex justify-end">
          <button className="btn-interaction" onClick={handleLoad}>
            {translations.interaction.load}
          </button>
        </div>
      </div>
    </div>
  );
}
