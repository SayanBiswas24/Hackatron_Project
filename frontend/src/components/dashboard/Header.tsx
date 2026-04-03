import React from 'react';
import { Search, Bell, User, ChevronDown, Wallet } from 'lucide-react';

interface HeaderProps {
  userData?: any;
}

const Header: React.FC<HeaderProps> = ({ userData }) => {
  const truncAddress = (addr: string) => {
    if (!addr) return 'Unconnected';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <header className="h-16 flex items-center justify-between px-8 border-b border-white/10 bg-[#0E1411] backdrop-blur-md">
      <div className="flex-1 flex items-center gap-4">
        <div className="relative group w-full max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#C0FF00] transition-colors" />
          <input 
            type="text" 
            placeholder="Search goals, transactions, or help..."
            className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-white placeholder-gray-500 outline-none focus:bg-white/[0.05] focus:border-[#C0FF00]/50 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        {/* Network Status */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[0.65rem] font-bold text-green-400 uppercase tracking-wider">LocalNet Beta</span>
        </div>

        {/* Notifications */}
        <button className="relative p-2 rounded-xl text-gray-400 hover:bg-white/[0.05] hover:text-[#C0FF00] transition-all group">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-[#C0FF00] rounded-full border-2 border-[#0A0F0D]" />
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-3 pl-6 border-l border-white/10 group cursor-pointer">
          <div className="flex flex-col items-end">
            <span className="text-sm font-bold text-white group-hover:text-[#C0FF00] transition-colors">
              {userData?.displayName || 'Satoshi'}
            </span>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/[0.05] border border-white/10">
              <Wallet size={10} className="text-[#C0FF00]" />
              <span className="text-[0.65rem] font-medium text-gray-400">
                {truncAddress(userData?.walletAddress)}
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C0FF00]/40 to-[#C0FF00]/10 border border-white/10 flex items-center justify-center font-bold text-black border-white/20 group-hover:scale-105 transition-transform overflow-hidden shadow-xl">
             <User size={22} className="text-black" />
          </div>
          <ChevronDown size={14} className="text-gray-500 group-hover:text-white transition-colors" />
        </div>
      </div>
    </header>
  );
};

export default Header;
