import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  BarChart, Bar, 
  AreaChart, Area, 
  XAxis, YAxis, 
  CartesianGrid, Tooltip, 
  ResponsiveContainer, 
  PieChart, Pie, Cell,
  Legend
} from 'recharts';
import { 
  TrendingUp, 
  Target, 
  ShieldCheck, 
  Download,
  IndianRupee,
  Clock,
  ArrowUpRight,
  Loader2
} from 'lucide-react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import { SparkEffect } from '../../components/ui/spark-effect';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { api } from '../../lib/api';

const EXCHANGE_RATE = 88.50;

const AnalyticsPage: React.FC = () => {
  const navigate = useNavigate();
  const userId = localStorage.getItem('ps_user_id');
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [walletBalance, setWalletBalance] = useState({ usdc: '0', algo: '0' });
  const [goals, setGoals] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (!userId) {
      navigate('/auth');
      return;
    }
    initializeData();
  }, [userId]);

  const initializeData = async () => {
    if (!userId) return;
    try {
      setIsLoading(true);
      const [user, balance, fetchedGoals, fetchedAnalytics] = await Promise.all([
        api.fetchUser(userId).catch(() => null),
        api.fetchWalletBalance(userId).catch(() => ({ usdc: '0', algo: '0' })),
        api.fetchGoals(userId).catch(() => []),
        api.fetchAnalytics(userId).catch(() => null)
      ]);
      
      setUserData(user);
      setWalletBalance(balance);
      setGoals(fetchedGoals);
      setAnalytics(fetchedAnalytics);
    } catch (err) {
      console.error("Error fetching analytics data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculations
  // Derived from Backend Analytics
  const metrics = analytics?.metrics || { 
    totalCapitalUsdc: 0, 
    totalYieldUsdc: 0, 
    avgProgress: 0, 
    goalCount: 0, 
    apy: 0 
  };

  const performanceData = analytics?.history || [];
  const distributionData = analytics?.distribution?.length > 0 
    ? analytics.distribution 
    : [{ name: 'Wallet Balance', value: Number(walletBalance.usdc) / 1000000, color: '#C0FF00' }];

  const totalInr = metrics.totalCapitalUsdc * EXCHANGE_RATE;
  const yieldInr = metrics.totalYieldUsdc * EXCHANGE_RATE;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  if (isLoading) {
    return (
      <DashboardLayout userData={userData}>
        <div className="flex flex-col items-center justify-center h-full min-h-[70vh] gap-4">
           <Loader2 className="animate-spin text-[#C0FF00]" size={48} />
           <p className="text-sm font-black text-white italic uppercase tracking-widest text-[#C0FF00]">Securing Financial Intelligence...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userData={userData}>
      <div className="relative min-h-[calc(100vh-64px)] w-full overflow-hidden">
        <SparkEffect />

        <motion.div 
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="relative z-10 max-w-7xl mx-auto space-y-10 pb-20"
        >
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <motion.div variants={itemVariants} className="space-y-1">
              <h1 className="text-4xl font-black text-white tracking-tight uppercase italic flex items-center gap-4">
                Savings <span className="text-[#C0FF00] not-italic">Analytics</span>
              </h1>
              <p className="text-sm text-gray-500 font-medium tracking-tight">Real-time performance tracking for your goal-based vaults.</p>
            </motion.div>
            <button className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/[0.05] border border-white/10 text-[0.7rem] font-bold text-white hover:bg-white/[0.1] transition-all uppercase tracking-widest">
              <Download size={14} /> Report Generation
            </button>
          </div>

          {/* Core Metrics */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
             {[
               { title: 'Total Capital', value: `₹${Math.round(totalInr).toLocaleString()}`, icon: IndianRupee, color: '#C0FF00', sub: `+${metrics.apy}% APY` },
               { title: 'Yield Generated', value: `₹${Math.round(yieldInr).toLocaleString()}`, icon: TrendingUp, color: '#BF5AF2', sub: 'Compound interest' },
               { title: 'Avg. Progress', value: `${metrics.avgProgress}%`, icon: Target, color: '#00F0FF', sub: `Across ${metrics.goalCount} active goals` },
               { title: 'Vault Security', value: 'Maximal', icon: ShieldCheck, color: '#F87171', sub: 'Verified on Algorand' },
             ].map((metric) => (
               <Card key={metric.title} className="bg-[#141C18] border-white/5 shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-1 h-full" style={{ background: metric.color }} />
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-gray-500 group-hover:text-white transition-all">
                        <metric.icon size={20} style={{ color: metric.color }} />
                      </div>
                      <span className="text-[0.6rem] font-black text-gray-600 uppercase tracking-widest">{metric.sub}</span>
                    </div>
                    <p className="text-[0.65rem] font-black text-gray-500 uppercase tracking-widest mb-1">{metric.title}</p>
                    <h3 className="text-2xl font-black text-white tracking-tight">{metric.value}</h3>
                  </CardContent>
               </Card>
             ))}
          </motion.div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Goal Distribution - Pie Chart */}
            <motion.div variants={itemVariants} className="lg:col-span-4">
               <Card className="h-full bg-[#141C18] border-white/5 shadow-2xl backdrop-blur-3xl">
                  <CardHeader>
                    <CardTitle className="text-lg font-black text-white uppercase tracking-tight">Fund Distribution</CardTitle>
                    <CardDescription className="text-xs text-gray-500 font-medium tracking-tight">Ratio of individual goal contributions in your total fund.</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[320px] flex items-center justify-center">
                    <div className="w-full h-full min-h-[280px]">
                      {isMounted && (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={distributionData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={85}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {distributionData.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={entry.color} opacity={0.8} />
                              ))}
                            </Pie>
                            <Tooltip 
                              contentStyle={{ background: '#0A0F0D', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                              itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                              formatter={(value: any) => [`$${Number(value).toFixed(2)} USDC`, 'Allocation']}
                            />
                            <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', color: '#666' }} />
                          </PieChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </CardContent>
               </Card>
            </motion.div>

            {/* Savings Over Time - Area Chart */}
            <motion.div variants={itemVariants} className="lg:col-span-8">
               <Card className="h-full bg-[#141C18] border-white/5 shadow-2xl backdrop-blur-3xl">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-lg font-black text-white uppercase tracking-tight">Portfolio Velocity</CardTitle>
                      <CardDescription className="text-xs text-gray-500 font-medium tracking-tight">Historical growth of your savings and yield earned (INR).</CardDescription>
                    </div>
                    <div className="flex gap-2">
                       <span className="flex items-center gap-1.5 text-[0.6rem] font-black text-[#C0FF00] uppercase tracking-widest"><div className="w-2 h-2 rounded-full bg-[#C0FF00]" /> Savings</span>
                       <span className="flex items-center gap-1.5 text-[0.6rem] font-black text-[#BF5AF2] uppercase tracking-widest"><div className="w-2 h-2 rounded-full bg-[#BF5AF2]" /> Yield</span>
                    </div>
                  </CardHeader>
                  <CardContent className="h-[320px] p-6 pt-2">
                     <div className="w-full h-full min-h-[280px]">
                        {isMounted && (
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={performanceData}>
                               <defs>
                                  <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                                     <stop offset="5%" stopColor="#C0FF00" stopOpacity={0.3}/>
                                     <stop offset="95%" stopColor="#C0FF00" stopOpacity={0}/>
                                  </linearGradient>
                               </defs>
                               <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                               <XAxis 
                                  dataKey="name" 
                                  axisLine={false} 
                                  tickLine={false} 
                                  tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 700 }}
                               />
                               <YAxis 
                                  axisLine={false} 
                                  tickLine={false} 
                                  tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 700 }}
                                  tickFormatter={(value) => `₹${Math.round(value/1000)}k`}
                               />
                               <Tooltip 
                                  contentStyle={{ background: '#0A0F0D', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                  itemStyle={{ color: '#C0FF00', fontWeight: 'bold' }}
                                  formatter={(value: any) => [`₹${Math.round(value).toLocaleString()}`, 'Value']}
                               />
                               <Area type="monotone" dataKey="savings" stroke="#C0FF00" fillOpacity={1} fill="url(#colorSavings)" strokeWidth={3} />
                               <Area type="monotone" dataKey="yield" stroke="#BF5AF2" fill="transparent" strokeWidth={2} strokeDasharray="5 5" />
                            </AreaChart>
                          </ResponsiveContainer>
                        )}
                     </div>
                  </CardContent>
               </Card>
            </motion.div>
          </div>

          {/* Bottom Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
             {/* Reward Performance - Bar Chart */}
             <motion.div variants={itemVariants}>
               <Card className="bg-[#141C18] border-white/5 shadow-2xl backdrop-blur-3xl">
                  <CardHeader>
                    <CardTitle className="text-lg font-black text-white uppercase tracking-tight">Reward Performance</CardTitle>
                    <CardDescription className="text-xs text-gray-500 font-medium tracking-tight">Monthly interest generation based on total capital timeline.</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px] p-6 pt-2">
                     <div className="w-full h-full min-h-[250px]">
                        {isMounted && (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={performanceData}>
                               <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                               <XAxis 
                                  dataKey="name" 
                                  axisLine={false} 
                                  tickLine={false} 
                                  tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 700 }}
                               />
                               <YAxis 
                                  axisLine={false} 
                                  tickLine={false} 
                                  tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 700 }}
                               />
                               <Tooltip 
                                  contentStyle={{ background: '#0A0F0D', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                  itemStyle={{ color: '#BF5AF2', fontWeight: 'bold' }}
                                  formatter={(value: any) => [`₹${Math.round(value).toLocaleString()}`, 'Yield']}
                               />
                               <Bar dataKey="yield" fill="#BF5AF2" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        )}
                     </div>
                  </CardContent>
               </Card>
             </motion.div>

             {/* Goal Completion Velocity */}
             <motion.div variants={itemVariants}>
               <Card className="bg-[#141C18] border-white/5 shadow-2xl backdrop-blur-3xl h-full">
                  <CardHeader>
                    <CardTitle className="text-lg font-black text-white uppercase tracking-tight">Vault Forecaster</CardTitle>
                    <CardDescription className="text-xs text-gray-500 font-medium tracking-tight">Estimated completion timelines for your active targets.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 pt-2 space-y-4">
                     {goals.length > 0 ? goals.map((goal: any) => {
                        const saved = Number(goal.currentBalance) / 1000000;
                        const target = Number(goal.targetAmount) / 1000000;
                        const progress = Math.min(100, Math.round((saved / target) * 100));
                        return (
                           <div key={goal.id} className="space-y-2">
                              <div className="flex justify-between items-end">
                                 <span className="text-xs font-black text-white uppercase tracking-tight flex items-center gap-2">
                                    <Target size={12} style={{ color: goal.colorHex || '#C0FF00' }} /> {goal.title}
                                 </span>
                                 <span className="text-[0.65rem] font-black text-gray-500 uppercase tracking-widest">{progress}% Complete</span>
                              </div>
                              <div className="h-1.5 w-full bg-white/5 border border-white/10 rounded-full overflow-hidden">
                                 <div 
                                    className="h-full rounded-full transition-all duration-1000 ease-out"
                                    style={{ background: goal.colorHex || '#C0FF00', width: `${progress}%` }}
                                 />
                              </div>
                              <div className="flex justify-between items-center text-gray-600">
                                 <span className="text-[0.55rem] font-bold uppercase tracking-tighter flex items-center gap-1">
                                    <Clock size={10} /> Forecast: {progress > 80 ? 'Final Stage' : 'Steady Growth'}
                                 </span>
                                 <span className="text-[0.55rem] font-bold text-[#C0FF00]/60 uppercase tracking-tighter flex items-center gap-1 italic">
                                    <ArrowUpRight size={10} /> Verified On-Chain
                                 </span>
                              </div>
                           </div>
                        );
                     }) : (
                        <div className="flex flex-col items-center justify-center py-16 text-center space-y-3 opacity-50">
                           <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-gray-600 font-black">?</div>
                           <p className="text-[0.6rem] font-black uppercase tracking-widest">No active vaults detected</p>
                        </div>
                     )}
                  </CardContent>
               </Card>
             </motion.div>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default AnalyticsPage;
