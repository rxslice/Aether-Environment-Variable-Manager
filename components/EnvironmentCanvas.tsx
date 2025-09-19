import React, { useState, useMemo, useRef } from 'react';
import { Project, Profile, EnvironmentVariable } from '../types';
import VariableCard from './VariableCard';
import { PlusIcon, SearchIcon, ClipboardIcon, CheckIcon, ImportIcon, ExportIcon } from './Icons';

type ImportDiff = {
  newVars: { key: string, value: string }[];
  updatedVars: { key: string, value: string, oldValue: string }[];
}

interface ImportModalProps {
  diff: ImportDiff;
  onConfirm: () => void;
  onCancel: () => void;
}

const ImportModal: React.FC<ImportModalProps> = ({ diff, onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-gray-800">Confirm Import</h2>
        <p className="text-gray-600 mt-1 mb-4">Review the changes from your .env file before importing.</p>
        
        {diff.newVars.length > 0 && (
          <div>
            <h3 className="font-semibold text-green-700">New Variables ({diff.newVars.length})</h3>
            <ul className="text-sm bg-green-50 border border-green-200 rounded-md p-2 mt-1 max-h-40 overflow-y-auto">
              {diff.newVars.map(v => <li key={v.key} className="font-mono">{v.key}=...</li>)}
            </ul>
          </div>
        )}

        {diff.updatedVars.length > 0 && (
          <div className="mt-4">
            <h3 className="font-semibold text-blue-700">Updated Variables ({diff.updatedVars.length})</h3>
             <ul className="text-sm bg-blue-50 border border-blue-200 rounded-md p-2 mt-1 max-h-40 overflow-y-auto">
              {diff.updatedVars.map(v => <li key={v.key} className="font-mono">{v.key}=... (was: ...)</li>)}
            </ul>
          </div>
        )}
        
        {(diff.newVars.length === 0 && diff.updatedVars.length === 0) && (
            <p className="text-gray-500 text-center py-8">No new or updated variables found to import.</p>
        )}

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onCancel} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
          <button onClick={onConfirm} disabled={diff.newVars.length === 0 && diff.updatedVars.length === 0} className="px-4 py-2 bg-[#7D9D9C] text-white rounded-md hover:bg-[#6b8b8a] disabled:opacity-50">Confirm Import</button>
        </div>
      </div>
    </div>
  )
}


interface EnvironmentCanvasProps {
  project: Project;
  profile: Profile;
  onVariableChange: (profileId: string, varId: string, updatedVar: Partial<Omit<EnvironmentVariable, 'id'>>) => void;
  onAddVariable: (profileId: string) => void;
  onDeleteVariable: (profileId: string, varId: string) => void;
  onImportVariables: (profileId: string, importedVars: {key: string, value: string}[]) => void;
  focusedVarId: string | null;
  onFocusComplete: () => void;
}

export default function EnvironmentCanvas({ project, profile, onVariableChange, onAddVariable, onDeleteVariable, onImportVariables, focusedVarId, onFocusComplete }: EnvironmentCanvasProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [importDiff, setImportDiff] = useState<ImportDiff | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredVariables = useMemo(() => {
    if (!searchTerm) {
      return profile.variables;
    }
    return profile.variables.filter(v =>
      v.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (!v.isSecret && v.value.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [profile.variables, searchTerm]);

  const handleCopyAll = () => {
    const textToCopy = filteredVariables
      .map(v => `${v.key}=${v.value}`)
      .join('\n');
    navigator.clipboard.writeText(textToCopy);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };
  
  const handleExport = () => {
    const content = profile.variables
      .map(v => `${v.key}=${v.value}`)
      .join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name}.${profile.name}.env`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const lines = content.split('\n');
      const importedVars: {key: string, value: string}[] = [];
      lines.forEach(line => {
        const trimmedLine = line.trim();
        if (trimmedLine && !trimmedLine.startsWith('#')) {
          const [key, ...valueParts] = trimmedLine.split('=');
          if (key) {
             importedVars.push({ key: key.trim(), value: valueParts.join('=').trim() });
          }
        }
      });
      
      const existingVars = new Map(profile.variables.map(v => [v.key, v.value]));
      const diff: ImportDiff = { newVars: [], updatedVars: [] };
      importedVars.forEach(v => {
        if (!existingVars.has(v.key)) {
          diff.newVars.push(v);
        } else if (existingVars.get(v.key) !== v.value) {
          diff.updatedVars.push({ ...v, oldValue: existingVars.get(v.key)! });
        }
      });
      setImportDiff(diff);
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset file input
  }

  const confirmImport = () => {
    if (!importDiff) return;
    const allVars = [...importDiff.newVars, ...importDiff.updatedVars];
    onImportVariables(profile.id, allVars);
    setImportDiff(null);
  }

  return (
    <>
    {importDiff && <ImportModal diff={importDiff} onConfirm={confirmImport} onCancel={() => setImportDiff(null)} />}
    <div className="bg-[#F4F2ED] text-[#222831] rounded-xl p-6 lg:p-8 h-full border border-white/20 backdrop-blur-sm bg-opacity-80"
      style={{
        boxShadow: '0 8px 32px rgba(0,0,0,0.1), inset 0 2px 4px rgba(0,0,0,0.05)',
      }}
    >
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{project.name}</h2>
          <p className="text-lg text-gray-500 capitalize">{profile.name} Environment ({profile.variables.length} variables)</p>
        </div>
        <div className="flex items-center flex-wrap gap-3">
          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".env" />
          <button 
            onClick={handleImportClick}
            className="flex items-center gap-2 bg-gray-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-gray-600 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-gray-500 focus:ring-opacity-50 shadow-lg shadow-gray-500/20"
          >
            <ImportIcon className="w-5 h-5" /> Import .env
          </button>
          <button 
            onClick={handleExport}
            disabled={profile.variables.length === 0}
            className="flex items-center gap-2 bg-gray-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-gray-600 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-gray-500 focus:ring-opacity-50 shadow-lg shadow-gray-500/20 disabled:opacity-50"
          >
            <ExportIcon className="w-5 h-5" /> Export .env
          </button>
          <button 
            onClick={handleCopyAll}
            disabled={filteredVariables.length === 0}
            className="flex items-center gap-2 bg-[#5F7470] text-white font-semibold py-2 px-4 rounded-lg hover:bg-[#4d5e5b] transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-[#5F7470] focus:ring-opacity-50 shadow-lg shadow-[#5F7470]/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
          >
            {isCopied ? <CheckIcon className="w-5 h-5" /> : <ClipboardIcon className="w-5 h-5" />}
            {isCopied ? 'Copied!' : 'Copy All'}
          </button>
          <button 
            onClick={() => onAddVariable(profile.id)}
            className="flex items-center gap-2 bg-[#7D9D9C] text-white font-semibold py-2 px-4 rounded-lg hover:bg-[#6b8b8a] transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-[#7D9D9C] focus:ring-opacity-50 shadow-lg shadow-[#7D9D9C]/20"
          >
            <PlusIcon className="w-5 h-5" />
            Add Variable
          </button>
        </div>
      </div>

      <div className="mb-6">
        <div className="relative group">
          <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none transition-colors group-focus-within:text-gray-600" />
          <input
            type="text"
            placeholder="Filter by key or value..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-white/60 border border-gray-300/80 rounded-lg pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-[#FFC400] focus:border-[#FFC400] focus:outline-none transition-all hover:shadow-md focus:shadow-lg focus:bg-white/80"
            aria-label="Filter variables"
          />
        </div>
      </div>

      <div className="space-y-4">
        {filteredVariables.map(variable => (
          <VariableCard 
            key={variable.id}
            variable={variable}
            onUpdate={(updatedVar) => onVariableChange(profile.id, variable.id, updatedVar)}
            onDelete={() => onDeleteVariable(profile.id, variable.id)}
            isFocused={variable.id === focusedVarId}
            onFocusComplete={onFocusComplete}
          />
        ))}
        {profile.variables.length > 0 && filteredVariables.length === 0 && (
           <div className="text-center py-12 bg-gray-50/50 rounded-lg">
            <p className="text-gray-600 font-semibold text-lg">No variables found.</p>
            <p className="text-gray-400 text-sm mt-1">Try adjusting your search filter.</p>
          </div>
        )}
        {profile.variables.length === 0 && (
          <div className="text-center py-12 bg-gray-50/50 rounded-lg">
            <p className="text-gray-600 font-semibold text-lg">This environment is empty.</p>
            <p className="text-gray-400 text-sm mt-1">Click "Add Variable" or "Import" to get started.</p>
          </div>
        )}
      </div>
    </div>
    </>
  );
}