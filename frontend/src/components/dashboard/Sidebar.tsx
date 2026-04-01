import React from 'react';
import { Home, Target, Clock, BarChart3, Settings, LogOut, Zap } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { icon: Home, label: 'Overview', path: '/dashboard' },
    { icon: Target, label: 'My Goals', path: '/dashboard/goals' },
    { icon: Clock, label: 'Transactions', path: '/dashboard/transactions' },
    { icon: BarChart3, label: 'Analytics', path: '/dashboard/analytics' },
    { icon: Settings, label: 'Settings', path: '/dashboard/settings' },
  ];

  return (
    <aside className="w-64 bg-[#121814] border-r border-white/10 flex flex-col h-screen transition-all duration-300 backdrop-blur-xl">
      {/* Brand */}
      <div className="p-6 mb-4">
        <div
          className="flex flex-col items-center justify-center px-4 py-2 rounded-xl border border-black/20 font-black cursor-pointer hover:brightness-110 transition-all duration-200"
          style={{ background: '#C0FF00', color: '#000' }}
          onClick={() => navigate('/')}
        >
          <span className="text-lg tracking-tighter leading-none">PENNY</span>
          <span className="text-[0.55rem] tracking-[0.2em] leading-none mt-0.5">STALKER</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-2">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                isActive
                  ? "bg-[#C0FF00] text-black font-bold shadow-[0_0_20px_rgba(192,255,0,0.2)]"
                  : "text-gray-400 hover:bg-white/[0.05] hover:text-white"
              )}
            >
              <item.icon size={20} className={cn(isActive ? "text-black" : "text-gray-500 group-hover:text-[#C0FF00]")} />
              <span className="text-sm">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Upgrade or Info Card */}
      <div className="px-4 mb-6">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-white/[0.05] to-transparent border border-white/10 relative overflow-hidden group">
          <div className="absolute -top-4 -right-4 w-12 h-12 bg-[#C0FF00]/10 rounded-full blur-2xl group-hover:bg-[#C0FF00]/20 transition-all duration-500" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-[#C0FF00]/20">
                <Zap size={14} className="text-[#C0FF00]" />
              </div>
              <span className="text-xs font-bold text-white">Boost Yield</span>
            </div>
            <p className="text-[0.7rem] text-gray-400 leading-relaxed mb-3">
              Stake your savings to earn up to 8.4% APY rewards.
            </p>
            <button className="w-full py-2 bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 rounded-lg text-[0.7rem] font-bold text-white transition-all">
              Learn More
            </button>
          </div>
        </div>
      </div>

      {/* Logout */}
      <div className="p-4 border-t border-white/10">
        <button
          onClick={() => navigate('/')}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 group"
        >
          <LogOut size={20} className="group-hover:translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Log out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
