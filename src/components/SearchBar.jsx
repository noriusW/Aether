import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { processAetherQuery } from '../utils/smartSearch';

const SearchBar = ({ onSearch, t }) => {
  const [tempSearch, setTempSearch] = useState('');

  const handleSearch = (e) => {
    if (e.key === 'Enter' || e.type === 'click') {
      const a = processAetherQuery(tempSearch);
      onSearch(a.sc_query);
    }
  };

  return (
    <div className="relative w-80 group">
      <div className="absolute inset-0 bg-white/5 rounded-2xl blur-md opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
      <div className="relative flex items-center bg-black/20 border border-white/5 rounded-2xl px-4 py-3.5 transition-all group-focus-within:bg-black/40 group-focus-within:border-white/10 backdrop-blur-md">
        <Search size={16} className="text-white/30 mr-3 cursor-pointer hover:text-white transition-colors" onClick={handleSearch} />
        <input 
          value={tempSearch} 
          onChange={(e) => setTempSearch(e.target.value)} 
          onKeyDown={handleSearch} 
          placeholder={t.search_placeholder} 
          className="bg-transparent border-none outline-none text-sm text-white/90 w-full placeholder-white/20" 
        />
      </div>
    </div>
  );
};

export default React.memo(SearchBar);
