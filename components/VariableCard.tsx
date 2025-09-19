import React, { useState, useEffect, useRef } from 'react';
import { EnvironmentVariable, VariableType } from '../types';
import ToggleSwitch from './ToggleSwitch';
import { CopyIcon, TrashIcon, CheckIcon, LinkIcon, MailIcon, KeyIcon, TextIcon, JwtIcon, EyeIcon, EyeSlashIcon } from './Icons';

interface VariableCardProps {
  variable: EnvironmentVariable;
  onUpdate: (updatedVar: Partial<Omit<EnvironmentVariable, 'id'>>) => void;
  onDelete: () => void;
  isFocused?: boolean;
  onFocusComplete?: () => void;
}

interface GlowInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  isMono?: boolean;
  hasError?: boolean;
}

const GlowInput = React.forwardRef<HTMLInputElement, GlowInputProps>(
  ({ isMono = false, hasError = false, ...props }, ref) => (
    <div className="group relative w-full">
      <input
        type="text"
        {...props}
        ref={ref}
        aria-invalid={hasError}
        className={`w-full bg-transparent placeholder:text-gray-400 py-2 outline-none disabled:cursor-not-allowed disabled:text-gray-400 ${isMono ? 'font-mono' : ''} ${props.className}`}
      />
      <div className={`absolute bottom-0 left-0 h-[1px] w-full ${hasError ? 'bg-red-300' : 'bg-gray-300'}`}></div>
      <div className={`absolute bottom-0 left-0 h-[1px] w-0 transition-all duration-300 group-focus-within:w-full ${hasError ? 'bg-red-500 shadow-[0_0_8px_0px_#ef4444]' : 'bg-[#FFC400] group-focus-within:shadow-[0_0_8px_0px_#FFC400]'}`}></div>
    </div>
  )
);
GlowInput.displayName = 'GlowInput';


const TypeIcon: React.FC<{type: VariableType; className?: string}> = ({type, className = "w-5 h-5 text-gray-400"}) => {
    switch(type) {
        case VariableType.URL: return <LinkIcon className={className} />;
        case VariableType.EMAIL: return <MailIcon className={className} />;
        case VariableType.AWS_KEY: return <KeyIcon className={className} />;
        case VariableType.JWT: return <JwtIcon className={className} />;
        case VariableType.GENERIC_SECRET: return <KeyIcon className={className} />;
        default: return <TextIcon className={className} />;
    }
}

const formatTypeName = (type: VariableType) => {
  return type
    .split('_')
    .map(word => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
};

const useClickOutside = (ref: React.RefObject<HTMLElement>, handler: () => void) => {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      handler();
    };
    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);
    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
};

const TypeSelector: React.FC<{
  selectedType: VariableType;
  onTypeChange: (type: VariableType) => void;
}> = ({ selectedType, onTypeChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  useClickOutside(dropdownRef, () => setIsOpen(false));

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <TypeIcon type={selectedType} className="w-5 h-5 text-gray-600" />
      </button>
      {isOpen && (
         <div className="absolute z-10 top-full mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 p-1">
          {Object.values(VariableType).map(type => (
            <button
              key={type}
              onClick={() => {
                onTypeChange(type);
                setIsOpen(false);
              }}
              className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100"
            >
              <TypeIcon type={type} className="w-5 h-5 text-gray-500" />
              <span>{formatTypeName(type)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const validateKey = (key: string): string | null => {
  if (!/^[A-Z0-9_]+$/.test(key) && key.trim() !== '') return 'Use uppercase, numbers, and underscores.';
  return null;
}


export default function VariableCard({ variable, onUpdate, onDelete, isFocused = false, onFocusComplete = () => {} }: VariableCardProps) {
  const [keyCopied, setKeyCopied] = useState(false);
  const [valueCopied, setValueCopied] = useState(false);
  const [isValueRevealed, setIsValueRevealed] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [keyError, setKeyError] = useState<string|null>(null);

  const keyInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isFocused && keyInputRef.current) {
      keyInputRef.current.focus();
      onFocusComplete();
    }
  }, [isFocused, onFocusComplete]);

  useEffect(() => {
    setKeyError(validateKey(variable.key));
  }, [variable.key]);

  const copyToClipboard = (text: string, type: 'key' | 'value') => {
    navigator.clipboard.writeText(text);
    if (type === 'key') setKeyCopied(true);
    else setValueCopied(true);
  };
  
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (keyCopied) timer = setTimeout(() => setKeyCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [keyCopied]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (valueCopied) timer = setTimeout(() => setValueCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [valueCopied]);

  useEffect(() => {
    if (confirmDelete) {
        const timer = setTimeout(() => setConfirmDelete(false), 3000);
        return () => clearTimeout(timer);
    }
  }, [confirmDelete]);

  const handleSecretToggle = (isSecret: boolean) => {
    onUpdate({ isSecret });
    if (!isSecret) {
        setIsValueRevealed(false);
    }
    if (isSecret && variable.type === VariableType.TEXT) {
      onUpdate({ isSecret, type: VariableType.GENERIC_SECRET });
    }
  }

  const handleDeleteClick = () => {
    if (confirmDelete) {
      onDelete();
    } else {
      setConfirmDelete(true);
    }
  }

  const canEditValue = !variable.isSecret || (variable.isSecret && isValueRevealed);
  const displayedValue = variable.isSecret && !isValueRevealed ? '•'.repeat(24) : variable.value;

  return (
    <div className="bg-white/60 border border-gray-200/80 rounded-lg p-4 backdrop-blur-sm shadow-[0_4px_6px_rgba(0,0,0,0.04)] hover:shadow-[0_7px_14px_rgba(0,0,0,0.05),_0_3px_6px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 transition-all duration-300" onMouseLeave={() => setConfirmDelete(false)}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-x-4">
        {/* Left Side: Type and Key */}
        <div className="w-full sm:w-1/3">
          <div className="flex items-center gap-3">
            <TypeSelector selectedType={variable.type} onTypeChange={(type) => onUpdate({ type })} />
            <GlowInput
              ref={keyInputRef}
              value={variable.key}
              placeholder="VARIABLE_KEY"
              onChange={e => onUpdate({ key: e.target.value.toUpperCase() })}
              className="font-semibold"
              hasError={!!keyError}
            />
            <button title="Copy Key" onClick={() => copyToClipboard(variable.key, 'key')} className="text-gray-400 hover:text-[#222831] transition-colors flex-shrink-0">
              {keyCopied ? <CheckIcon className="w-5 h-5 text-[#7D9D9C]" /> : <CopyIcon className="w-5 h-5" />}
            </button>
          </div>
          {keyError && <p className="text-xs text-red-600 ml-14 mt-1">{keyError}</p>}
        </div>
        
        {/* Right Side: Value and Actions */}
        <div className="w-full sm:w-2/3 mt-2 sm:mt-0">
          <div className="flex items-center gap-3">
            <GlowInput
              isMono
              value={displayedValue}
              placeholder="Variable Value"
              onChange={e => onUpdate({ value: e.target.value })}
              disabled={!canEditValue}
            />
            <div className="flex items-center gap-2 flex-shrink-0">
              {variable.isSecret && (
                <button title={isValueRevealed ? "Hide Value" : "Reveal Value"} onClick={() => setIsValueRevealed(!isValueRevealed)} className="text-gray-400 hover:text-[#222831] transition-colors">
                    {isValueRevealed ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                </button>
              )}
              <button title="Copy Value" onClick={() => copyToClipboard(variable.value, 'value')} className="text-gray-400 hover:text-[#222831] transition-colors">
                {valueCopied ? <CheckIcon className="w-5 h-5 text-[#7D9D9C]" /> : <CopyIcon className="w-5 h-5" />}
              </button>
              <ToggleSwitch checked={variable.isSecret} onChange={handleSecretToggle} />
              <button
                  title="Delete Variable"
                  onClick={handleDeleteClick}
                  className={`transition-colors p-1 rounded-md ${confirmDelete ? 'text-white bg-red-600' : 'text-gray-400 hover:text-red-600'}`}
              >
                <TrashIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
