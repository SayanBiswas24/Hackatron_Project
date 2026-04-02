import React from 'react';
import { IndianRupee, TrendingUp, Target, ShieldCheck, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { GlowCard } from '../ui/spotlight-card';
import { cn } from '../../lib/utils';

const StatCard = ({
  title,
  value,
  icon: Icon,
  trend,
  trendValue,
  isPositive,
  color,
  glowColor = 'lime',
}: {
  title: string;
  value: string;
  icon: any;
  trend?: string;
  trendValue?: string;
  isPositive?: boolean;
  color?: string;
  glowColor?: 'lime' | 'cyan' | 'purple' | 'red' | 'orange';
}) => (
  <GlowCard glowColor={glowColor} customSize className="group w-full">
    <div
      className="absolute -right-8 -top-8 w-32 h-32 rounded-full blur-[80px] transition-all duration-700 opacity-20 group-hover:opacity-40"
      style={{ background: color || '#C0FF00' }}
    />
    <div className="p-6 relative z-10 flex flex-col gap-4">
      <div className="flex justify-between items-start">
        <div className="p-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-gray-400 group-hover:text-[#C0FF00] group-hover:border-[#C0FF00]/30 transition-all duration-300">
          <Icon size={22} strokeWidth={1.5} />
        </div>
        <div className="p-1 px-2.5 rounded-full bg-[#C0FF00]/10 border border-[#C0FF00]/10 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <span className="text-[0.65rem] font-bold text-[#C0FF00] tracking-wider uppercase">Live</span>
          <div className="w-1.5 h-1.5 rounded-full bg-[#C0FF00] animate-pulse" />
        </div>
      </div>

      <div>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">{title}</p>
        <div className="flex items-baseline gap-2">
          <h3 className="text-3xl font-black text-white tracking-tight">{value}</h3>
          {trendValue && (
            <div className={cn(
              "flex items-center gap-0.5 text-[0.7rem] font-bold px-1.5 py-0.5 rounded-md",
              isPositive ? "text-green-400 bg-green-400/10" : "text-red-400 bg-red-400/10"
            )}>
              {isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
              {trendValue}
            </div>
          )}
        </div>
        {trend && <p className="text-[0.65rem] text-gray-500 mt-1 font-medium italic">{trend}</p>}
      </div>
    </div>
  </GlowCard>
);

interface StatsGridProps {
  totalSaved?: number;
  activeGoals?: number;
  totalYield?: number;
  isEmpty?: boolean;
}

const StatsGrid: React.FC<StatsGridProps> = ({
  totalSaved = 124450,
  activeGoals = 3,
  totalYield = 10240,
  isEmpty = false
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title="Total Safe Savings"
        value={isEmpty ? "₹0.00" : `₹${totalSaved.toLocaleString()}`}
        icon={IndianRupee}
        trendValue={isEmpty ? undefined : "12.4%"}
        isPositive={true}
        color="#C0FF00"
        glowColor="lime"
      />
      <StatCard
        title="Active Goals"
        value={isEmpty ? "00" : String(activeGoals).padStart(2, '0')}
        icon={Target}
        trend={isEmpty ? "Setup your first target" : "2 goals near completion"}
        color="#00F0FF"
        glowColor="cyan"
      />
      <StatCard
        title="Projected Yield"
        value={isEmpty ? "₹0.00" : `₹${totalYield.toLocaleString()}`}
        icon={TrendingUp}
        trendValue={isEmpty ? undefined : "8.4% APY"}
        isPositive={true}
        color="#BF5AF2"
        glowColor="purple"
      />
      <StatCard
        title="Protection Level"
        value={isEmpty ? "Active" : "Maximal"}
        icon={ShieldCheck}
        trend={isEmpty ? "Awaiting first deposit" : "Quant-verified security"}
        color="#FF3B30"
        glowColor="red"
      />
    </div>
  );
};

export default StatsGrid;
