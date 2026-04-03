import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

interface SavingsEvolutionProps {
  isEmpty?: boolean;
  activities?: any[];
}

const initialData = [
  { name: 'Jan', value: 0 },
  { name: 'Feb', value: 0 },
  { name: 'Mar', value: 0 },
  { name: 'Apr', value: 0 },
  { name: 'May', value: 0 },
  { name: 'Jun', value: 0 },
  { name: 'Jul', value: 0 },
];

const emptyData = [
  { name: 'Jan', value: 10 },
  { name: 'Feb', value: 15 },
  { name: 'Mar', value: 12 },
  { name: 'Apr', value: 25 },
  { name: 'May', value: 20 },
  { name: 'Jun', value: 35 },
  { name: 'Jul', value: 30 },
];

const SavingsEvolution: React.FC<SavingsEvolutionProps> = ({ isEmpty = false, activities = [] }) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  let chartData = emptyData;
  
  if (!isEmpty && activities.length > 0) {
    // Sort activities by timestamp safely
    const sorted = [...activities].sort((a, b) => new Date(a.timestamp || a.date).getTime() - new Date(b.timestamp || b.date).getTime());
    
    let balance = 0;
    const monthlyData: Record<string, number> = {};
    
    sorted.forEach(act => {
      const date = new Date(act.timestamp || act.date);
      const month = monthNames[date.getMonth()];
      
      const amt = Number(act.amount) || 0;
      if (act.type.toLowerCase() === 'deposit') balance += amt;
      if (act.type.toLowerCase() === 'withdrawal') balance -= amt;
      
      // Keep track of cumulative balance
      monthlyData[month] = balance;
    });

    // Backfill balance for months where no activity occurred
    let lastKnownBalance = 0;
    chartData = initialData.map(d => {
      if (monthlyData[d.name] !== undefined) {
        lastKnownBalance = monthlyData[d.name];
      }
      return {
        name: d.name,
        value: lastKnownBalance / 1000000 // Convert to base units for display
      };
    });
  }

  return (
    <Card className="col-span-full xl:col-span-8 bg-[#141C18] backdrop-blur-3xl border-white/5 shadow-2xl relative overflow-hidden">
      <CardHeader className="flex-row items-center justify-between pb-2 relative z-10">
        <div className="space-y-1">
          <CardTitle className="text-xl font-black tracking-tight flex items-center gap-2 text-white italic uppercase">
            Portfolio <span className={isEmpty ? "bg-gray-800 px-2 py-0.5 rounded text-[0.65rem] text-gray-400 not-italic" : "bg-[#C0FF00] px-2 py-0.5 rounded text-[0.65rem] text-black not-italic"}>
              {isEmpty ? "Inactive" : "Live"}
            </span>
          </CardTitle>
          <CardDescription className="text-xs text-gray-500 font-medium">
            {isEmpty ? "Growth tracking will begin after your first deposit." : "Growth of your total savings across all vaults over time."}
          </CardDescription>
        </div>
        {!isEmpty && (
          <div className="flex gap-2">
            {['1D', '1W', '1M', '1Y', 'All'].map((t) => (
              <button
                key={t}
                className={`px-3 py-1 rounded-lg text-[0.65rem] font-bold border border-white/10 transition-all ${t === '1M' ? 'bg-[#C0FF00] text-black border-transparent shadow-[0_0_15px_rgba(192,255,0,0.3)]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
              >
                {t}
              </button>
            ))}
          </div>
        )}
      </CardHeader>
      <CardContent className="p-0 relative h-[350px]">
        <div className="w-full h-full p-4 pt-0">
           {isMounted ? (
             <ResponsiveContainer width="99%" height="100%">
              <AreaChart 
                data={chartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={isEmpty ? "#333" : "#C0FF00"} stopOpacity={isEmpty ? 0.1 : 0.3} />
                    <stop offset="95%" stopColor={isEmpty ? "#333" : "#C0FF00"} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 700 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 700 }}
                  tickFormatter={(value) => isEmpty ? `₹0` : `₹${Math.round(value)}`}
                  domain={[0, isEmpty ? 100 : 'auto']}
                  dx={-0}
                />
                {!isEmpty && (
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(10, 15, 13, 0.95)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '12px',
                      padding: '12px',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                      backdropFilter: 'blur(10px)',
                      zIndex: 100
                    }}
                    labelStyle={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 900, marginBottom: 4, textTransform: 'uppercase' }}
                    itemStyle={{ color: '#C0FF00', fontSize: 14, fontWeight: 900 }}
                    formatter={(value: any) => [`₹${value.toLocaleString()}`, 'Balance']}
                  />
                )}
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={isEmpty ? "#333" : "#C0FF00"}
                  strokeWidth={isEmpty ? 1 : 3}
                  fillOpacity={1}
                  fill="url(#colorValue)"
                  animationDuration={2000}
                  isAnimationActive={!isEmpty}
                />
              </AreaChart>
            </ResponsiveContainer>
           ) : (
             <div className="w-full h-full bg-white/5 animate-pulse rounded-xl" />
           )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SavingsEvolution;
