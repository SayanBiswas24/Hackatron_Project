import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Wallet, 
  Shield, 
  User, 
  Zap, 
  Check,
  ChevronRight,
  ExternalLink,
  DollarSign
} from 'lucide-react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import { SparkEffect } from '../../components/ui/spark-effect';
import { Card, CardContent } from '../../components/ui/card';
import { cn } from '../../lib/utils';
import { api } from '../../lib/api';
import { Loader2 } from 'lucide-react';

interface SettingToggleProps {
  enabled: boolean;
  onChange: (val: boolean) => void;
  color?: string;
}

const SettingToggle: React.FC<SettingToggleProps> = ({ enabled, onChange, color = '#C0FF00' }) => (
  <button 
    onClick={() => onChange(!enabled)}
    className={cn(
      "relative w-12 h-6 rounded-full transition-all duration-300",
      enabled ? "bg-opacity-100" : "bg-white/10"
    )}
    style={{ backgroundColor: enabled ? color : '' }}
  >
    <motion.div 
      animate={{ x: enabled ? 26 : 2 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className="absolute top-1 left-0 w-4 h-4 bg-white rounded-full shadow-lg"
    />
  </button>
);

interface SettingSectionProps {
  title: string;
  description: string;
  icon: React.ElementType;
  children: React.ReactNode;
}

const SettingSection: React.FC<SettingSectionProps> = ({ title, description, icon: Icon, children }) => (
  <div className="space-y-6">
    <div className="flex items-start gap-4">
      <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 text-gray-400">
        <Icon size={22} strokeWidth={1.5} />
      </div>
      <div>
        <h3 className="text-xl font-black text-white tracking-tight uppercase italic">{title}</h3>
        <p className="text-xs text-gray-500 font-medium tracking-tight mt-1">{description}</p>
      </div>
    </div>
    <Card className="bg-[#141C18]/50 border-white/5 shadow-2xl backdrop-blur-3xl overflow-hidden rounded-3xl">
      <CardContent className="p-0 divide-y divide-white/5">
        {children}
      </CardContent>
    </Card>
  </div>
);

interface SettingItemProps {
  label: string;
  description: string;
  children: React.ReactNode;
}

const SettingItem: React.FC<SettingItemProps> = ({ label, description, children }) => (
  <div className="flex items-center justify-between p-6 hover:bg-white/[0.02] transition-colors">
    <div className="space-y-1">
      <p className="text-sm font-black text-white uppercase tracking-wider">{label}</p>
      <p className="text-xs text-gray-500 font-medium tracking-tight pr-4">{description}</p>
    </div>
    <div className="flex-shrink-0">
      {children}
    </div>
  </div>
);

const SettingsPage: React.FC = () => {
  const [network, setNetwork] = useState<'Testnet' | 'Mainnet' | 'LocalNet'>('Testnet');
  const [autoCompounding, setAutoCompounding] = useState(true);
  const [blindSigning, setBlindSigning] = useState(false);
  const [mfa, setMfa] = useState(true);
  const [governanceEnabled, setGovernanceEnabled] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const userId = localStorage.getItem('ps_user_id');

  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId) return;
      try {
        setIsLoading(true);
        const data = await api.fetchUser(userId);
        setUserData(data);
        setGovernanceEnabled(data.governanceEnabled || false);
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUserData();
  }, [userId]);

  const handleSave = async () => {
    if (!userId) return;
    try {
      setIsSaving(true);
      await api.updateUser(userId, { governanceEnabled });
      // In a real app we'd show a success toast here
    } catch (error) {
      console.error("Error updating settings:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'UN';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <DashboardLayout>
      <div className="relative min-h-[calc(100vh-64px)] w-full overflow-hidden">
        <SparkEffect />

        <motion.div 
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="relative z-10 max-w-4xl mx-auto space-y-12 pb-20"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="space-y-2">
            <h1 className="text-4xl font-black text-white tracking-tight uppercase italic flex items-center gap-4">
              Vault <span className="text-[#C0FF00] not-italic">Settings</span>
            </h1>
            <p className="text-sm text-gray-500 font-medium tracking-tight">Configure your on-chain environment and goal-governance preferences.</p>
          </motion.div>

          {/* Wallet & On-Chain */}
          <motion.div variants={itemVariants}>
            <SettingSection 
              title="Wallet & Protocol" 
              description="Manage your Algorand connection and smart-contract facilitator settings."
              icon={Wallet}
            >
              <SettingItem 
                label="Primary Wallet" 
                description="Your connected Pera / Defly wallet address for all on-chain interactions."
              >
                <div className="flex items-center gap-3 bg-white/[0.03] border border-white/10 px-4 py-2 rounded-xl group cursor-pointer hover:border-[#C0FF00]/40 transition-all">
                  <span className="text-[0.7rem] font-black text-white font-mono tracking-tighter opacity-80 group-hover:opacity-100 transition-opacity">7A2B...4F8C</span>
                  <ExternalLink size={12} className="text-gray-500 group-hover:text-[#C0FF00]" />
                </div>
              </SettingItem>
              <SettingItem 
                label="Node Network" 
                description="Switch between active Algorand ecosystems for deployment and testing."
              >
                <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
                   {['Testnet', 'Mainnet'].map((net) => (
                     <button
                       key={net}
                       onClick={() => setNetwork(net as 'Testnet' | 'Mainnet' | 'LocalNet')}
                       className={cn(
                         "px-4 py-1.5 rounded-lg text-[0.6rem] font-black uppercase tracking-widest transition-all",
                         network === net ? "bg-[#C0FF00] text-black" : "text-gray-500 hover:text-white"
                       )}
                     >
                       {net}
                     </button>
                   ))}
                </div>
              </SettingItem>
              <SettingItem 
                label="Silent Messenger" 
                description="Status of your custodial message-facilitator for dual-wallet signature automation."
              >
                <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-lg">
                   <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                   <span className="text-[0.6rem] font-black text-green-400 uppercase tracking-widest italic">Operational</span>
                </div>
              </SettingItem>
            </SettingSection>
          </motion.div>

          {/* Vault Automation */}
          <motion.div variants={itemVariants}>
            <SettingSection 
              title="Savings Governance" 
              description="Personalize your goal-conditioned automation and reward preferences."
              icon={Zap}
            >
              <SettingItem 
                label="Default Settlement Asset" 
                description="Primary asset used for creating new goal-vaults (USDC recommended)."
              >
                <div className="flex items-center gap-2 text-white font-black text-xs uppercase tracking-widest">
                   <DollarSign size={14} className="text-green-400" /> USDC (Algorand)
                </div>
              </SettingItem>
              <SettingItem 
                label="Reward Auto-Compounding" 
                description="Automatically restake generated yield back into active goal vaults to maximize APY."
              >
                <SettingToggle enabled={autoCompounding} onChange={setAutoCompounding} />
              </SettingItem>
              <SettingItem 
                label="Algorand Governance Staking" 
                description="Enlist your vault funds for the Algorand Governance period to earn 5% APY rewards."
              >
                <SettingToggle enabled={governanceEnabled} onChange={setGovernanceEnabled} />
              </SettingItem>
              <SettingItem 
                label="Default Saving Frequency" 
                description="Pre-selected recurring deposit schedule for all new savings targets."
              >
                <button className="flex items-center gap-2 px-4 py-2 bg-white/[0.03] border border-white/10 rounded-xl text-xs font-black text-white hover:border-[#C0FF00]/40 transition-all uppercase tracking-widest">
                   Monthly Plan <ChevronRight size={14} className="text-gray-500" />
                </button>
              </SettingItem>
            </SettingSection>
          </motion.div>

          {/* Security & Privacy */}
          <motion.div variants={itemVariants}>
            <SettingSection 
              title="Shield & Security" 
              description="Configure on-chain signing protocols and session-layer protection."
              icon={Shield}
            >
              <SettingItem 
                label="Blind Signing Mode" 
                description="Allow facilitator to sign minor on-chain operations without direct Pera approval alerts."
              >
                <SettingToggle enabled={blindSigning} onChange={setBlindSigning} color="#BF5AF2" />
              </SettingItem>
              <SettingItem 
                label="Global Multi-Factor (MFA)" 
                description="Require secondary device verification for any cross-vault fund transfers over ₹5,000."
              >
                <SettingToggle enabled={mfa} onChange={setMfa} />
              </SettingItem>
              <SettingItem 
                label="Vault Privacy" 
                description="Mask goal names and balances on the overview dashboard for enhanced physical privacy."
              >
                <SettingToggle enabled={false} onChange={() => {}} />
              </SettingItem>
            </SettingSection>
          </motion.div>

          {/* Profile Details */}
          <motion.div variants={itemVariants}>
            <SettingSection 
              title="Identity & Account" 
              description="Manage your profile information and account-level identifiers."
              icon={User}
            >
              <SettingItem 
                label="Account Profile" 
                description="Update your display name, vault identifier, and account email."
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin text-[#C0FF00]" />
                    <span className="text-[0.6rem] font-black text-gray-500 uppercase tracking-widest">Decrypting Identity...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                        <p className="text-sm font-black text-white tracking-tight uppercase italic">{userData?.fullName || 'Anonymous User'}</p>
                        <p className="text-[0.6rem] text-gray-500 font-bold uppercase tracking-tighter">{userData?.email || 'N/A'}</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C0FF00] to-[#00F0FF] p-1 shadow-[0_0_15px_rgba(192,255,0,0.3)]">
                        <div className="w-full h-full bg-[#0A0F0D] rounded-lg flex items-center justify-center text-white font-black text-xs">
                          {userData ? getInitials(userData.fullName) : '??'}
                        </div>
                    </div>
                  </div>
                )}
              </SettingItem>
              <SettingItem 
                label="Danger Zone" 
                description="Actions related to account termination and vault liquidation."
              >
                <button className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-xs font-black text-red-400 hover:bg-red-500/20 transition-all uppercase tracking-widest">
                   Archive Vaults
                </button>
              </SettingItem>
            </SettingSection>
          </motion.div>

          {/* Save Button Floating */}
          <motion.div 
            variants={itemVariants}
            className="flex justify-center pt-4"
          >
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="px-12 py-5 bg-[#C0FF00] hover:brightness-110 text-black font-black text-sm uppercase tracking-widest rounded-2xl shadow-[0_0_40px_rgba(192,255,0,0.3)] transition-all active:scale-95 flex items-center gap-3 disabled:opacity-50"
            >
               {isSaving ? <Loader2 size={20} className="animate-spin" /> : <Check size={20} strokeWidth={4} />}
               {isSaving ? 'Synchronizing Opt-ins...' : 'Update All Protocols'}
            </button>
          </motion.div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;
