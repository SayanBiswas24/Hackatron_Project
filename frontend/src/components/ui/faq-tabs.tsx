import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { cn } from '../../lib/utils';

export const FAQ = ({ 
  title = "FAQs",
  subtitle = "Frequently Asked Questions",
  categories,
  faqData,
  className,
  ...props 
}: any) => {
  const categoryKeys = Object.keys(categories);
  const [selectedCategory, setSelectedCategory] = useState(categoryKeys[0]);

  return (
    <section 
      className={cn(
        "relative overflow-hidden px-4 py-20 text-white mx-auto max-w-7xl w-full bg-white/[0.02] border border-white/10 rounded-3xl backdrop-blur-md my-8 md:px-12",
        className
      )}
      {...props}
    >
      <FAQHeader title={title} subtitle={subtitle} />
      <FAQTabs 
        categories={categories}
        selected={selectedCategory} 
        setSelected={setSelectedCategory} 
      />
      <FAQList 
        faqData={faqData}
        selected={selectedCategory} 
      />
    </section>
  );
};

const FAQHeader = ({ title, subtitle }: any) => (
  <div className="relative z-10 flex flex-col items-center justify-center text-center">
    <span className="mb-4 text-neon-lime font-mono uppercase tracking-widest text-sm font-semibold">
      {subtitle}
    </span>
    <h2 className="mb-12 text-4xl md:text-5xl font-extrabold tracking-tight">{title}</h2>
    
    {/* Background glow effect for neon aesthetics */}
    <span className="absolute -top-[150px] left-[50%] z-0 h-[300px] w-[500px] -translate-x-[50%] rounded-full bg-neon-lime/10 blur-[100px] pointer-events-none" />
  </div>
);

const FAQTabs = ({ categories, selected, setSelected }: any) => (
  <div className="relative z-10 flex flex-wrap items-center justify-center gap-4 mb-4">
    {Object.entries(categories).map(([key, label]: any) => (
      <button
        key={key}
        onClick={() => setSelected(key)}
        className={cn(
          "relative overflow-hidden whitespace-nowrap rounded-full border px-6 py-2.5 text-sm font-semibold transition-all duration-300",
          selected === key
            ? "border-neon-lime text-black"
            : "border-white/10 bg-white/5 text-gray-400 hover:text-white hover:border-white/20"
        )}
      >
        <span className="relative z-10">{label}</span>
        <AnimatePresence>
          {selected === key && (
            <motion.span
              initial={{ y: "100%" }}
              animate={{ y: "0%" }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.4, ease: "backOut" }}
              className="absolute inset-0 z-0 bg-neon-lime"
            />
          )}
        </AnimatePresence>
      </button>
    ))}
  </div>
);

const FAQList = ({ faqData, selected }: any) => (
  <div className="mx-auto mt-8 max-w-5xl relative z-10">
    <AnimatePresence mode="wait">
      {Object.entries(faqData).map(([category, questions]: any) => {
        if (selected === category) {
          return (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: "backOut" }}
              className="space-y-4"
            >
              {questions.map((faq: any, index: number) => (
                <FAQItem key={index} {...faq} />
              ))}
            </motion.div>
          );
        }
        return null;
      })}
    </AnimatePresence>
  </div>
);

const FAQItem = ({ question, answer }: any) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      animate={isOpen ? "open" : "closed"}
      className={cn(
        "rounded-2xl border transition-all duration-300",
        isOpen ? "bg-white/[0.06] border-white/20" : "bg-white/[0.02] border-white/10 hover:bg-white/[0.04]"
      )}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between gap-4 p-5 text-left focus:outline-none"
      >
        <span
          className={cn(
            "text-lg font-medium transition-colors duration-300",
            isOpen ? "text-neon-lime" : "text-gray-200"
          )}
        >
          {question}
        </span>
        <motion.span
          variants={{
            open: { rotate: "45deg" },
            closed: { rotate: "0deg" },
          }}
          transition={{ duration: 0.3, ease: "backOut" }}
        >
          <Plus
            className={cn(
              "h-5 w-5 transition-colors duration-300",
              isOpen ? "text-neon-lime" : "text-gray-400"
            )}
          />
        </motion.span>
      </button>
      <motion.div
        initial={false}
        animate={{ 
          height: isOpen ? "auto" : "0px", 
          opacity: isOpen ? 1 : 0
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="overflow-hidden px-5"
      >
        <p className="text-gray-300 leading-relaxed pb-5">{answer}</p>
      </motion.div>
    </motion.div>
  );
};

const FAQDemo = () => {
  const categories = {
    "smart-contracts": "Smart Contracts",
    "vaults": "Trustless Vaults", 
    "security": "Security & Audits",
    "yields": "Yield Compounding"
  };

  const faqData = {
    "smart-contracts": [
      {
        question: "How do the Smart Contracts control my funds?",
        answer: "Penny Stalker utilizes highly-optimized PyTeal/TEALScript Algorand smart contracts. Once you deposit ALGO, the contract logic algorithmically locks it completely independent of human control until your goal timestamp is met."
      },
      {
        question: "Why Algorand over Ethereum?",
        answer: "Algorand provides absolute finality in under 3.3 seconds with transaction fees costing fractions of a penny. For a savings dApp processing micro-deposits constantly, Ethereum gas fees would instantly obliterate your yields."
      },
      {
        question: "Can I cancel a contract halfway through?",
        answer: "No. The entire point of Penny Stalker is disciplined saving. Our contracts lack backdoors or 'emergency withdrawal' logic before the timestamp executes. This mathematically forces you to meet your goal."
      }
    ],
    "vaults": [
      {
        question: "What is a Trustless Vault?",
        answer: "A trustless vault means neither the Penny Stalker team, nor anyone else on the planet, has the cryptographic keys to access your deposited ALGO. You do not have to 'trust' us—you trust the open-source blockchain math."
      },
      {
        question: "Is there a minimum deposit limit?",
        answer: "No! True to our name, you can literally stalk pennies. The minimum deposit size is 0.001 ALGO allowing you to route tiny fractions of yields perpetually into your vaults."
      },
      {
        question: "Can I have multiple Vaults?",
        answer: "Yes, you can initialize an unlimited number of Application IDs. You can have one vault locking for a 3-year house downpayment, and another unlocking in 6 months for a vacation."
      }
    ],
    "security": [
      {
        question: "Are the contracts audited?",
        answer: "Yes, our core TEAL contracts have undergone rigorous third-party auditing to ensure resistance against re-entrancy, underflow/overflow, and state manipulation attacks commonly seen in DeFi."
      },
      {
        question: "What wallet architectures are supported?",
        answer: "Penny Stalker integrates deeply with Pera Wallet, Defly, and generic WalletConnect 2.0. We never store your keys locally—transactions are exclusively signed directly on your device."
      },
      {
        question: "What happens if the Penny Stalker frontend goes down?",
        answer: "Your funds are natively on-chain on Algorand. Even if our domain is seized or deleted, you can still execute your unlocks manually via goal-seeker or any generic Algorand block explorer interface."
      }
    ],
    "yields": [
      {
        question: "How does the native compounding work?",
        answer: "Because you maintain custody over your vault, your ALGO participates natively in Algorand Governance routing. We automatically restake Governance rewards directly back into your locked vault principal."
      },
      {
        question: "Are there platform fees?",
        answer: "We take a flat 0.1% performance fee strictly on the generated yield (not your principal stack) when you finally execute an unlock transaction. This funds frontend maintenance and further protocol audits."
      }
    ]
  };

  return (
    <div className="w-full">
      <FAQ 
        title="Protocol Knowledge Base"
        subtitle="Uncover the Architecture"
        categories={categories}
        faqData={faqData}
      />
    </div>
  );
};

export default FAQDemo;
