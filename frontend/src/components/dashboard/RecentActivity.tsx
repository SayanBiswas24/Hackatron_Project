import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { ArrowUpRight, ArrowDownRight, Zap, Search, Filter } from 'lucide-react';
import { cn } from '../../lib/utils';
import EmptyState from './EmptyState';

const initialActivities = [
  {
    id: 1,
    type: 'deposit',
    name: 'Monthly Savings',
    amount: 15000,
    date: '2 hours ago',
    status: 'completed',
    goal: 'New Car'
  },
  {
    id: 2,
    type: 'deposit',
    name: 'Top Up',
    amount: 2500,
    date: 'Yesterday',
    status: 'completed',
    goal: 'Emergency Fund'
  },
  {
    id: 3,
    type: 'withdrawal',
    name: 'Service Fee',
    amount: 45,
    date: '24 Mar 2026',
    status: 'completed',
    goal: 'Main Vault'
  },
  {
    id: 4,
    type: 'goal_creation',
    name: 'Trip to Ladakh',
    amount: 0,
    date: '22 Mar 2026',
    status: 'active',
    goal: 'Trip to Ladakh'
  },
  {
    id: 5,
    type: 'deposit',
    name: 'Bonus Deposit',
    amount: 5000,
    date: '18 Mar 2026',
    status: 'completed',
    goal: 'New Car'
  },
];

export interface Activity {
  id: number;
  type: 'deposit' | 'withdrawal' | 'goal_creation';
  name: string;
  amount: number;
  date: string;
  status: string;
  goal: string;
}

const RecentActivity: React.FC<{ activities?: Activity[] }> = ({ activities = initialActivities as Activity[] }) => {
  const isEmpty = activities.length === 0;

  return (
    <Card className="col-span-full xl:col-span-4 bg-[#141C18] backdrop-blur-3xl border-white/5 shadow-2xl">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div className="space-y-1 text-white">
          <CardTitle className="text-xl font-black tracking-tight flex items-center gap-2">
            History <span className="bg-white/5 border border-white/10 px-2 py-0.5 rounded text-[0.65rem] text-gray-400 font-bold">Latest {String(activities.length).padStart(2, '0')}</span>
          </CardTitle>
          <CardDescription className="text-[0.65rem] text-gray-500 font-medium">Your recent vault activities and smart-contract events.</CardDescription>
        </div>
        {!isEmpty && (
          <div className="flex gap-2">
            <button className="p-2 rounded-lg bg-white/5 border border-white/10 text-gray-500 hover:text-white transition-all">
              <Filter size={14} />
            </button>
            <button className="p-2 rounded-lg bg-white/5 border border-white/10 text-gray-500 hover:text-white transition-all">
              <Search size={14} />
            </button>
          </div>
        )}
      </CardHeader>
      <CardContent className="pt-4 px-2">
        {isEmpty ? (
          <div className="py-12">
            <EmptyState type="activity" />
          </div>
        ) : (
          <div className="space-y-1">
            {activities.map((activity, idx) => (
              <div
                key={activity.id}
                className={cn(
                  "flex items-center justify-between p-3 rounded-xl transition-all duration-300 hover:bg-white/[0.03] group",
                  idx !== activities.length - 1 && "border-b border-white/[0.03]"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2 rounded-lg border flex items-center justify-center transition-all group-hover:scale-110",
                    activity.type === 'deposit' ? "bg-green-500/10 border-green-500/20 text-green-400" :
                      activity.type === 'withdrawal' ? "bg-red-500/10 border-red-500/20 text-red-400" :
                        "bg-[#C0FF00]/10 border-[#C0FF00]/20 text-[#C0FF00]"
                  )}>
                    {activity.type === 'deposit' ? <ArrowUpRight size={16} /> :
                      activity.type === 'withdrawal' ? <ArrowDownRight size={16} /> :
                        <Zap size={16} />}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white group-hover:text-[#C0FF00] transition-colors">{activity.name}</h4>
                    <p className="text-[0.65rem] text-gray-500 font-medium">{activity.goal} • {activity.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn(
                    "text-sm font-black tracking-tight",
                    activity.type === 'deposit' ? "text-green-400" :
                      activity.type === 'withdrawal' ? "text-red-400" :
                        "text-white"
                  )}>
                    {activity.type === 'deposit' ? '+' : activity.type === 'withdrawal' ? '-' : ''}
                    {activity.amount > 0 ? `₹${activity.amount.toLocaleString()}` : 'NEW'}
                  </p>
                  <div className="flex items-center gap-1 justify-end">
                    <div className="w-1 h-1 rounded-full bg-green-400" />
                    <span className="text-[0.6rem] font-bold text-gray-500 uppercase tracking-tighter uppercase">{activity.status}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {!isEmpty && (
          <button className="w-full mt-4 py-3 rounded-xl bg-white/[0.05] border border-white/10 text-[0.65rem] font-black text-gray-400 hover:bg-white/[0.08] hover:text-white hover:border-white/20 transition-all uppercase tracking-widest">
            View Full Audit Trail
          </button>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentActivity;
