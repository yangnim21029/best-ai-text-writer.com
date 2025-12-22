import React from 'react';

interface ThresholdInputProps {
  value: string;
  onChange: (val: string) => void;
  onCommit: (val?: string) => void;
}

export const ThresholdInput: React.FC<ThresholdInputProps> = ({ value, onChange, onCommit }) => {
  const [localValue, setLocalValue] = React.useState(value);

  React.useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleCommit = () => {
    onCommit(localValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCommit();
    }
  };

  return (
    <input
      type="number"
      min="0"
      max="1"
      step="0.01"
      value={localValue}
      onChange={(e) => {
        setLocalValue(e.target.value);
        onChange(e.target.value);
      }}
      onBlur={handleCommit}
      onKeyDown={handleKeyDown}
      className="w-24 px-2 py-1 text-[11px] border border-gray-200 rounded-lg text-gray-800 shadow-inner"
    />
  );
};
