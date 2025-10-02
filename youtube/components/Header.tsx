import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-slate-800/80 backdrop-blur-sm sticky top-0 z-20 shadow-lg">
      <div className="container mx-auto px-4 py-3">
        <h1 className="text-3xl font-bold text-cyan-400">
          Trend<span className="text-white">Hub</span>
        </h1>
      </div>
    </header>
  );
};

export default Header;
