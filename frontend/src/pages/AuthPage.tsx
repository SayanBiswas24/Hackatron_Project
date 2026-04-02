import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import ShaderBackground from '../components/ui/ShaderBackground';
import {
  Eye,
  EyeOff,
  Wallet,
  Mail,
  Lock,
  User,
  ArrowLeft,
  Zap,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { api } from '../lib/api';

/* ─── Types ─────────────────────────────── */
type Mode = 'signin' | 'signup';

/* ─── Input Field component ─────────────── */
const Field = ({
  id,
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  icon,
  toggle,
  onToggle,
}: {
  id: string;
  label: string;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  icon: React.ReactNode;
  toggle?: boolean;
  onToggle?: () => void;
}) => (
  <div className="flex flex-col gap-1.5">
    <label htmlFor={id} className="text-xs font-semibold uppercase tracking-widest text-gray-300">
      {label}
    </label>
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neon-lime opacity-70">
        {icon}
      </span>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-white/10 bg-[#1A241F] px-10 py-3 text-sm text-white placeholder-gray-400 outline-none transition-all duration-200 focus:border-neon-lime/50 focus:bg-[#1F2B25] focus:ring-1 focus:ring-neon-lime/20 backdrop-blur-sm"
      />
      {toggle && (
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-neon-lime transition-colors"
        >
          {type === 'password' ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      )}
    </div>
  </div>
);

/* ─── Auth Page ──────────────────────────── */
export default function AuthPage() {
  const [mode, setMode] = useState<Mode>('signup');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const cardRef = useRef<HTMLDivElement>(null);

  /* Sign-up fields */
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  /* Sign-in fields */
  const [siEmail, setSiEmail] = useState('');
  const [siPassword, setSiPassword] = useState('');

  /* Card entrance animation */
  useEffect(() => {
    if (cardRef.current) {
      gsap.fromTo(
        cardRef.current,
        { y: 60, opacity: 0, scale: 0.96 },
        { y: 0, opacity: 1, scale: 1, duration: 1.4, ease: 'power4.out', delay: 0.2 }
      );
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (mode === 'signup') {
        if (password !== confirm) {
           setError("Passwords do not match");
           setIsLoading(false);
           return;
        }

        const res = await api.signup({
          fullName,
          email,
          password
        });
        
        localStorage.setItem('ps_user_id', res.userId);
        setSubmitted(true);
        // New users always go to onboarding
        setTimeout(() => navigate('/onboarding'), 2200);
      } else {
        const res = await api.signin({
          email: siEmail,
          password: siPassword
        });

        localStorage.setItem('ps_user_id', res.userId);
        setSubmitted(true);
        // Existing users go to dashboard if onboarding is complete, otherwise onboarding
        const target = res.onboardingComplete ? '/dashboard' : '/onboarding';
        setTimeout(() => navigate(target), 2200);
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
      setIsLoading(false);
    }
  };

  const formVariants = {
    initial: { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' as const } },
    exit: { opacity: 0, y: -14, transition: { duration: 0.3 } },
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#0A0F0D]">
      {/* Same WebGL background as Hero */}
      <ShaderBackground />

      {/* Back to home */}
      <button
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 z-50 flex items-center gap-2 text-sm text-gray-400 hover:text-neon-lime transition-colors duration-200 group"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        Back to home
      </button>

      {/* Brand mark */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2">
        <div
          className="flex flex-col items-center justify-center px-3 py-1.5 rounded-md font-black leading-none"
          style={{ background: '#C0FF00', color: '#000' }}
        >
          <span style={{ fontSize: '1.1rem', letterSpacing: '-0.5px' }}>PENNY</span>
          <span style={{ fontSize: '0.52rem', letterSpacing: '2.5px' }}>STALKER</span>
        </div>
      </div>

      {/* Glass card */}
      <div
        ref={cardRef}
        className="relative z-10 w-full max-w-md mx-4 rounded-3xl border border-white/10 bg-[#141C18] backdrop-blur-xl shadow-2xl overflow-hidden"
        style={{ boxShadow: '0 0 80px rgba(192,255,0,0.05), 0 25px 60px rgba(0,0,0,0.5)' }}
      >
        {/* Top neon accent line */}
        <div className="h-px w-full" style={{ background: 'linear-gradient(90deg, transparent, #C0FF00, transparent)' }} />

        <div className="px-8 py-10">
          {/* Toggle buttons */}
          <div className="flex rounded-xl border border-white/10 bg-[#1A241F] p-1 mb-8">
            {(['signup', 'signin'] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setSubmitted(false); }}
                className="relative flex-1 py-2.5 text-sm font-semibold rounded-lg transition-colors duration-200 z-10"
                style={{ color: mode === m ? '#000' : 'rgba(255,255,255,0.45)' }}
              >
                {mode === m && (
                  <motion.div
                    layoutId="tab-pill"
                    className="absolute inset-0 rounded-lg"
                    style={{ background: '#C0FF00' }}
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
                <span className="relative z-10">
                  {m === 'signup' ? 'Sign Up' : 'Sign In'}
                </span>
              </button>
            ))}
          </div>

          {/* Success State */}
          <AnimatePresence mode="wait">
            {submitted ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-4 py-12 text-center"
              >
                <CheckCircle size={52} className="text-neon-lime" />
                <h2 className="text-2xl font-bold text-white">
                  {mode === 'signup' ? 'Vault Created!' : 'Welcome Back!'}
                </h2>
                <p className="text-sm text-gray-400">
                  {mode === 'signup'
                    ? 'Your Penny Stalker account is ready. Redirecting…'
                    : 'Authenticated successfully. Redirecting…'}
                </p>
              </motion.div>
            ) : (

              /* ── Sign Up ── */
              mode === 'signup' ? (
                <motion.form
                  key="signup"
                  variants={formVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  onSubmit={handleSubmit}
                  className="flex flex-col gap-4"
                >
                  <div className="mb-1">
                    <h2 className="text-2xl font-extrabold text-white tracking-tight">
                      Create your <span style={{ color: '#C0FF00' }}>vault</span>
                    </h2>
                    <p className="text-xs text-gray-400 mt-1">Start saving on Algorand today — no bank needed.</p>
                  </div>

                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold"
                    >
                      {error}
                    </motion.div>
                  )}

                  <Field
                    id="fullName" label="Full Name" placeholder="Satoshi Nakamoto"
                    value={fullName} onChange={setFullName}
                    icon={<User size={15} />}
                  />
                  <Field
                    id="email" label="Email Address" type="email" placeholder="satoshi@algorand.io"
                    value={email} onChange={setEmail}
                    icon={<Mail size={15} />}
                  />
                  <Field
                    id="password" label="Password" type={showPass ? 'text' : 'password'}
                    placeholder="Min. 8 characters"
                    value={password} onChange={setPassword}
                    icon={<Lock size={15} />}
                    toggle onToggle={() => setShowPass(!showPass)}
                  />
                  <Field
                    id="confirm" label="Confirm Password" type={showConfirm ? 'text' : 'password'}
                    placeholder="Repeat password"
                    value={confirm} onChange={setConfirm}
                    icon={<Lock size={15} />}
                    toggle onToggle={() => setShowConfirm(!showConfirm)}
                  />

                  {/* Perks reminder */}
                  <ul className="flex flex-col gap-1.5 my-1">
                    {[
                      '3.3s Algorand finalisation',
                      'Non-custodial, your keys',
                      'Goal-based savings vaults',
                    ].map((t) => (
                      <li key={t} className="flex items-center gap-2 text-xs text-gray-400">
                        <Zap size={11} className="text-neon-lime shrink-0" />
                        {t}
                      </li>
                    ))}
                  </ul>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="mt-2 w-full rounded-xl py-3 font-bold text-sm text-black transition-all duration-200 hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    style={{ background: '#C0FF00', boxShadow: '0 0 24px rgba(192,255,0,0.25)' }}
                  >
                    {isLoading ? <Loader2 size={18} className="animate-spin" /> : null}
                    {isLoading ? 'Processing...' : 'Create My Vault →'}
                  </button>

                  <p className="text-center text-xs text-gray-400 mt-1">
                    Already have an account?{' '}
                    <button type="button" onClick={() => setMode('signin')} className="text-neon-lime hover:underline">
                      Sign in
                    </button>
                  </p>
                </motion.form>
              ) : (

                /* ── Sign In ── */
                <motion.form
                  key="signin"
                  variants={formVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  onSubmit={handleSubmit}
                  className="flex flex-col gap-4"
                >
                  <div className="mb-1">
                    <h2 className="text-2xl font-extrabold text-white tracking-tight">
                      Welcome <span style={{ color: '#C0FF00' }}>back</span>
                    </h2>
                    <p className="text-xs text-gray-400 mt-1">Access your vaults and savings dashboard.</p>
                  </div>

                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold"
                    >
                      {error}
                    </motion.div>
                  )}

                  <Field
                    id="si-email" label="Email Address" type="email" placeholder="satoshi@algorand.io"
                    value={siEmail} onChange={setSiEmail}
                    icon={<Mail size={15} />}
                  />
                  <Field
                    id="si-password" label="Password" type={showPass ? 'text' : 'password'}
                    placeholder="Your password"
                    value={siPassword} onChange={setSiPassword}
                    icon={<Lock size={15} />}
                    toggle onToggle={() => setShowPass(!showPass)}
                  />

                  <div className="flex justify-end -mt-1">
                    <button type="button" className="text-xs text-gray-400 hover:text-neon-lime transition-colors">
                      Forgot password?
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="mt-2 w-full rounded-xl py-3 font-bold text-sm text-black transition-all duration-200 hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    style={{ background: '#C0FF00', boxShadow: '0 0 24px rgba(192,255,0,0.25)' }}
                  >
                    {isLoading ? <Loader2 size={18} className="animate-spin" /> : null}
                    {isLoading ? 'Accessing...' : 'Enter My Vault →'}
                  </button>

                  <div className="relative my-1">
                    <hr className="border-white/10" />
                    <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#0A0F0D] px-3 text-xs text-gray-500">
                      or connect directly
                    </span>
                  </div>

                  <button
                    type="button"
                    className="flex items-center justify-center gap-2 w-full rounded-xl border border-white/10 bg-[#1A241F] py-3 text-sm text-white hover:border-neon-lime/40 hover:bg-[#232F28] transition-all duration-200"
                  >
                    <Wallet size={15} className="text-neon-lime" />
                    Connect Pera Wallet
                  </button>

                  <p className="text-center text-xs text-gray-400 mt-1">
                    New to Penny Stalker?{' '}
                    <button type="button" onClick={() => setMode('signup')} className="text-neon-lime hover:underline">
                      Create a vault
                    </button>
                  </p>
                </motion.form>
              )
            )}
          </AnimatePresence>
        </div>

        {/* Bottom neon accent line */}
        <div className="h-px w-full" style={{ background: 'linear-gradient(90deg, transparent, rgba(192,255,0,0.3), transparent)' }} />
      </div>
    </div>
  );
}
