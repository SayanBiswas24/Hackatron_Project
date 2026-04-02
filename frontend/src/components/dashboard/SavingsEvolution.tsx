import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';

const initialData = [
  { name: 'Jan', value: 40000 },
  { name: 'Feb', value: 35000 },
  { name: 'Mar', value: 55000 },
  { name: 'Apr', value: 45000 },
  { name: 'May', value: 75000 },
  { name: 'Jun', value: 92000 },
  { name: 'Jul', value: 124450 },
];

const emptyData = [
  { name: 'Jan', value: 0 },
  { name: 'Feb', value: 0 },
  { name: 'Mar', value: 0 },
  { name: 'Apr', value: 0 },
  { name: 'May', value: 0 },
  { name: 'Jun', value: 0 },
  { name: 'Jul', value: 0 },
];

interface SavingsEvolutionProps {
  isEmpty?: boolean;
}

const SavingsEvolution: React.FC<SavingsEvolutionProps> = ({ isEmpty = false }) => {
  const chartData = isEmpty ? emptyData : initialData;

  return (
    <Card className="col-span-full xl:col-span-8 bg-[#141C18] backdrop-blur-3xl border-white/5 shadow-2xl">
      <CardHeader className="flex-row items-center justify-between pb-2">
        <div className="space-y-1">
          <CardTitle className="text-xl font-black tracking-tight flex items-center gap-2">
            Portfolio <span className={isEmpty ? "bg-gray-800 px-2 py-0.5 rounded text-[0.65rem] text-gray-400" : "bg-[#C0FF00] px-2 py-0.5 rounded text-[0.65rem] text-black"}>
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
      <CardContent className="h-[350px] pt-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
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
              tickFormatter={(value) => isEmpty ? `₹0` : `₹${value / 1000}k`}
              domain={[0, isEmpty ? 100 : 'auto']}
              dx={-5}
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
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default SavingsEvolution;
