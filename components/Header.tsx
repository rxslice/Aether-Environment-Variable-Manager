import React from 'react';

export default function Header() {
  return (
    <header className="flex items-center justify-between">
      <div>
        <h1 className="text-5xl font-bold text-[#F4F2ED] tracking-tighter font-display bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
          Aether
        </h1>
        <p className="text-gray-400">Environment Variable Manager</p>
      </div>
    </header>
  );
}