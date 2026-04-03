import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, Zap, Wallet, ArrowRight, ExternalLink, CreditCard, ShieldCheck, Loader2 } from 'lucide-react';
import { api } from '../../lib/api';
import { cn } from '../../lib/utils';
import toast from 'react-hot-toast';

interface FundAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onFunded?: () => void;
}

const FundAccountModal: React.FC<FundAccountModalProps> = ({ isOpen, onClose, userId, onFunded }) => {
  const [address, setAddress] = useState<string>('');
  const [balances, setBalances] = useState<{ algo: string; usdc: string }>({ algo: '0', usdc: '0' });
  const [loading, setLoading] = useState(true);
  const [purchaseStep, setPurchaseStep] = useState<'info' | 'payment' | 'processing' | 'success'>('info');
  const [purchaseAmount, setPurchaseAmount] = useState('1000');
  const [copied, setCopied] = useState(false);

  const fetchBalance = async () => {
    try {
      setLoading(true);
      const data = await api.fetchWalletBalance(userId);
      setAddress(data.address);
      setBalances({
        algo: (Number(data.algo) / 1_000_000).toFixed(2),
        usdc: (Number(data.usdc) / 1_000_000).toFixed(2)
      });
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && userId) {
      fetchBalance();
      setPurchaseStep('info');
    }
  }, [isOpen, userId]);

  const handleCopy = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    toast.success('Address copied');
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePurchase = async () => {
    try {
      setPurchaseStep('processing');
      // Simulated processing delay
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      const res = await api.purchaseUsdc(userId, parseFloat(purchaseAmount));
      
      setPurchaseStep('success');
      toast.success(`${purchaseAmount} USDC Delivered!`);
      fetchBalance();
      if (onFunded) onFunded();
    } catch (error: any) {
      toast.error(error.message || 'Purchase failed');
      setPurchaseStep('info');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/90 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-lg overflow-hidden bg-[#0A0F0D] border border-white/10 rounded-[2.5rem] shadow-2xl"
          >
            {/* Header */}
            <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#C0FF00]/10 flex items-center justify-center text-[#C0FF00]">
                    <Wallet size={20} />
                </div>
                <div>
                   <h2 className="text-xl font-black tracking-tight uppercase italic text-white leading-none">Vault <span className="text-[#C0FF00] not-italic">Refill</span></h2>
                   <p className="text-[0.6rem] font-bold text-gray-500 uppercase tracking-widest mt-1">Custodial Asset Bridge</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 bg-white/5 rounded-xl text-gray-500 hover:text-white transition-colors"
                disabled={purchaseStep === 'processing'}
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-8">
              <AnimatePresence mode="wait">
                {purchaseStep === 'info' && (
                  <motion.div 
                    key="info"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-8"
                  >
                    {/* Balances */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-5">
                            <p className="text-[0.6rem] text-gray-500 font-black uppercase tracking-widest mb-2">Portfolio USDC</p>
                            <p className="text-2xl font-black text-[#C0FF00] italic">${loading ? '...' : balances.usdc}</p>
                        </div>
                        <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-5">
                            <p className="text-[0.6rem] text-gray-500 font-black uppercase tracking-widest mb-2">Gas Token (ALGO)</p>
                            <p className="text-2xl font-black text-white italic">{loading ? '...' : balances.algo}A</p>
                        </div>
                    </div>

                    {/* QR and Address */}
                    <div className="flex items-center gap-6 p-6 bg-white/[0.03] border border-white/10 rounded-[2rem] group relative hover:border-[#C0FF00]/30 transition-all">
                        <div className="bg-white p-2 rounded-2xl shrink-0">
                            <img 
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${address}&bgcolor=ffffff&color=000000`} 
                                alt="QR"
                                className="w-20 h-20"
                            />
                        </div>
                        <div className="space-y-2 overflow-hidden flex-1">
                            <p className="text-[0.6rem] text-gray-500 font-black uppercase tracking-widest">Receive via Network</p>
                            <div className="flex items-center gap-2">
                                <code className="text-[0.65rem] text-gray-300 font-medium truncate">{address || 'Loading...'}</code>
                                <button onClick={handleCopy} className="p-1.5 bg-white/5 rounded-lg text-gray-400 hover:text-[#C0FF00]">
                                    {copied ? <Check size={14} /> : <Copy size={14} />}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Purchase Simulation Trigger */}
                    <div className="space-y-4 pt-4 border-t border-white/5">
                        <div className="flex justify-between items-center">
                           <h3 className="text-xs font-black text-white uppercase italic tracking-widest">Instant Purchase</h3>
                           <div className="flex items-center gap-1 text-[0.6rem] text-[#C0FF00]">
                              <ShieldCheck size={12} />
                              <span className="font-bold uppercase">LocalNet Demo Mode</span>
                           </div>
                        </div>
                        <Button 
                            onClick={() => setPurchaseStep('payment')}
                            className="w-full py-6 bg-[#C0FF00] text-black rounded-2xl font-black uppercase tracking-[0.2em] italic text-sm shadow-[0_0_50px_rgba(192,255,0,0.2)] hover:scale-[1.02] flex items-center justify-center gap-3"
                        >
                            <CreditCard size={20} /> Purchase USDC Assets <ArrowRight size={18} />
                        </Button>
                    </div>
                  </motion.div>
                )}

                {purchaseStep === 'payment' && (
                  <motion.div 
                    key="payment"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="space-y-4">
                        <label className="text-[0.65rem] font-black text-gray-400 uppercase tracking-widest ml-1">Simulated Card Details</label>
                        <div className="p-6 bg-gradient-to-br from-gray-800 to-gray-900 rounded-[2rem] border border-white/10 space-y-6 shadow-2xl relative overflow-hidden">
                           <div className="absolute top-0 right-0 w-32 h-32 bg-[#C0FF00]/10 blur-[50px] -mr-16 -mt-16" />
                           <div className="flex justify-between">
                              <Zap size={32} className="text-[#C0FF00] opacity-50" />
                              <p className="text-[0.6rem] font-black text-white/40 tracking-[0.5em] uppercase">PennyStalker Infinite</p>
                           </div>
                           <div className="space-y-4">
                              <p className="text-xl font-black text-white tracking-[0.2em]">••••  ••••  ••••  1337</p>
                              <div className="flex justify-between items-end">
                                 <div>
                                    <p className="text-[0.5rem] uppercase text-white/30 font-bold">Card Holder</p>
                                    <p className="text-[0.7rem] uppercase text-white font-black">DEMOS USER</p>
                                 </div>
                                 <div className="text-right">
                                    <p className="text-[0.5rem] uppercase text-white/30 font-bold">Expires</p>
                                    <p className="text-[0.7rem] uppercase text-white font-black">12 / 99</p>
                                 </div>
                              </div>
                           </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[0.65rem] font-black text-gray-400 uppercase tracking-widest ml-1">Amount (USDC)</label>
                        <input 
                            type="number"
                            value={purchaseAmount}
                            onChange={(e) => setPurchaseAmount(e.target.value)}
                            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 px-6 text-xl font-black text-white outline-none focus:border-[#C0FF00]/50"
                        />
                    </div>

                    <div className="flex gap-4 pt-4">
                        <Button 
                            onClick={() => setPurchaseStep('info')}
                            className="flex-1 py-4 bg-white/5 text-white font-black uppercase text-xs rounded-2xl border border-white/10 hover:bg-white/10"
                        >
                            Cancel
                        </Button>
                        <Button 
                            onClick={handlePurchase}
                            className="flex-[2] py-4 bg-[#C0FF00] text-black font-black uppercase text-xs rounded-2xl shadow-[0_0_30px_rgba(192,255,0,0.2)]"
                        >
                            Confirm Payment
                        </Button>
                    </div>
                  </motion.div>
                )}

                {purchaseStep === 'processing' && (
                  <motion.div 
                    key="processing"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="py-12 flex flex-col items-center text-center space-y-6"
                  >
                    <div className="relative">
                        <Loader2 className="text-[#C0FF00] animate-spin" size={80} strokeWidth={3} />
                        <ShieldCheck className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white animate-pulse" size={32} />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Securing Transaction</h3>
                        <p className="text-[0.6rem] font-bold text-gray-500 uppercase tracking-widest leading-relaxed max-w-[200px]">
                            Verifying payment through encrypted LocalNet bridge...
                        </p>
                    </div>
                  </motion.div>
                )}

                {purchaseStep === 'success' && (
                   <motion.div 
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="py-12 flex flex-col items-center text-center space-y-6"
                  >
                    <div className="w-24 h-24 bg-[#C0FF00]/10 border border-[#C0FF00] rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(192,255,0,0.3)]">
                        <ShieldCheck size={48} className="text-[#C0FF00]" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Assets Secured</h3>
                        <p className="text-xs text-gray-400 font-medium">
                            {purchaseAmount} USDC has been bridged to your custodial vault.
                        </p>
                    </div>
                    <Button 
                        onClick={onClose}
                        className="px-12 py-4 bg-[#C0FF00]/10 border border-[#C0FF00] text-[#C0FF00] font-black uppercase text-xs rounded-2xl hover:bg-[#C0FF00] hover:text-black transition-all"
                    >
                        Return to Dashboard
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default FundAccountModal;

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

const Button = ({ children, onClick, className, type = "button", disabled = false, ...props }: ButtonProps) => (
  <button 
    type={type}
    onClick={onClick}
    disabled={disabled}
    className={cn("transition-all duration-200 active:scale-95 disabled:opacity-50", className)}
    {...props}
  >
    {children}
  </button>
);
