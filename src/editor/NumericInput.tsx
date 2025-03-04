import React, { useState, useEffect, KeyboardEvent, FocusEvent } from 'react';

interface NumericInputProps {
  value: string;
  onChange: (value: string) => void;
  step?: number;
}

function NumericInput({ 
  value, 
  onChange,
  step = 1 
}: NumericInputProps) {
  const [localValue, setLocalValue] = useState<string>(value);
  const [prevNumericValue, setPrevNumericValue] = useState<number>(Number(value));
  
  // Sync local state when prop value changes
  useEffect(() => {
    setLocalValue(value);
    setPrevNumericValue(Number(value));
  }, [value]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    // Only update local state if valid number or empty
    if (!isNaN(Number(newValue)) || newValue.trim().length === 0) {
      setLocalValue(newValue);
      
      // Check if this was likely an increment/decrement from spinner buttons
      const newNumericValue = Number(newValue);
      if (!isNaN(newNumericValue) && !isNaN(prevNumericValue)) {
        const diff = newNumericValue - prevNumericValue;
        
        // If the change is exactly one step value, commit immediately
        if (Math.abs(diff) === step) {
          onChange(newValue);
        }
      }
      
      setPrevNumericValue(newNumericValue);
    }
  };
  
  const commitValue = () => {
    if (localValue !== '' && localValue !== value) {
      onChange(localValue);
    } else if (localValue === '') {
      // Reset to previous value if empty
      setLocalValue(value);
    }
  };
  
  const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
    commitValue();
  };
  
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      commitValue();
      e.currentTarget.blur();
    }
  };
  
  return (
    <input
      type="number"
      value={localValue}
      onChange={handleChange}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      step={step}
    />
  );
}

export default NumericInput;