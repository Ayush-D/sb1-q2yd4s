import React, { useState, useEffect, RefObject } from 'react';

interface CodeInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder: string;
  disabled: boolean;
  inputRef?: RefObject<HTMLTextAreaElement>;
}

const CodeInput: React.FC<CodeInputProps> = ({ value, onChange, onSubmit, placeholder, disabled, inputRef }) => {
  const [rows, setRows] = useState(1);

  useEffect(() => {
    adjustTextareaHeight();
  }, [value]);

  const adjustTextareaHeight = () => {
    if (inputRef?.current) {
      const textarea = inputRef.current;
      const lineHeight = 24; // Increased line height
      const minRows = 1;
      const maxRows = 5;

      textarea.style.height = 'auto';
      const newRows = Math.min(
        Math.max(minRows, Math.floor(textarea.scrollHeight / lineHeight)),
        maxRows
      );
      textarea.style.height = `${newRows * lineHeight}px`;
      setRows(newRows);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className="relative border rounded-lg focus-within:ring-2 focus-within:ring-blue-500 bg-white shadow-sm">
      <textarea
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        className="w-full p-3 bg-transparent resize-none outline-none rounded-lg"
        style={{
          color: '#2D3748',
          fontFamily: "'Inter', 'Segoe UI', 'Roboto', sans-serif",
          fontSize: '16px',
          lineHeight: '24px',
          minHeight: '48px',
          maxHeight: '120px',
          overflowY: rows >= 5 ? 'auto' : 'hidden',
          transition: 'all 0.2s ease',
        }}
      />
    </div>
  );
};

export default CodeInput;