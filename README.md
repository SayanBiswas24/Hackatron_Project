# Goal-Based Piggy Bank — Algorand Blockchain

> A decentralized savings vault built on Algorand where users create goal-based savings plans, deposit USDC, and withdraw only when predefined conditions are met — enforced entirely on-chain.

Built for **Hackatron 3.0, BIT Sindri** — Algorand Blockchain Track 3.

---

## Table of Contents

- [Overview](#overview)
- [Problem Statement](#problem-statement)
- [How It Works](#how-it-works)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Smart Contract](#smart-contract)
- [Wallet Types](#wallet-types)
- [USDC & Stability](#usdc--stability)
- [Staking & Yield](#staking--yield)
- [Tinyman DEX Integration](#tinyman-dex-integration)
- [Auto-Deposit Automation](#auto-deposit-automation)
- [Revenue Model](#revenue-model)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
- [Target Audience](#target-audience)
- [Competitive Advantages](#competitive-advantages)
- [Known Limitations](#known-limitations)
- [Roadmap](#roadmap)

---

## Overview

Most Indians who earn a regular salary have `₹0` in savings — not because they cannot afford to save, but because there is no structural friction stopping them from spending what they intend to save. Existing apps like Jupiter Pots and Fi Money let users withdraw their "goal savings" the next day with zero consequence. The lock is purely psychological.

This project solves that with a blockchain-enforced savings vault. When a user deposits USDC into a goal, the smart contract holds those funds and **only releases them when the goal target is reached or the deadline passes**. No early access. No exceptions. The rule is enforced by code on the Algorand blockchain — not by willpower, and not by a company policy that can change.

---

## Problem Statement

Users often struggle to save consistently for specific goals like rent, travel, or gadgets due to lack of structure and accountability. Existing tools do not provide goal-wise tracking with enforced saving discipline.

**Solution:** A multi-goal savings vault on Algorand where users can:
- Create goals with targets and deadlines
- Deposit USDC into goal-specific vaults
- Track progress on-chain in real time
- Withdraw **only** when conditions are met — enforced by smart contract logic

---

## How It Works

### The User Journey

**1. Sign Up**
The user visits the platform and either connects a Pera Wallet or creates a custodial account with email and password. For custodial accounts, the backend silently generates an Algorand keypair and encrypts the private key using AES-256 before storing it in Supabase. The user never sees seed phrases or wallet addresses.

**2. Wallet Funding**
A platform treasury wallet sends 0.2 ALGO to every new wallet to cover the Minimum Balance Requirement (MBR) for box storage and transaction fees. The platform also auto opts-in the wallet to USDC so the user never has to search for or manually add the asset.

**3. Goal Creation**
The user enters a goal name, category (Travel / Emergency / Gadgets / General), a target amount in INR, and a deadline date. The frontend fetches the live USD/INR rate from CoinGecko and converts the INR target to USDC. For example, ₹5,000 ÷ ₹83.50 = 59.88 USDC. The `createGoal()` ABI method is called on the smart contract, which creates a box entry keyed by `wallet_address + goal_id`. The goal is stored entirely on-chain with status ACTIVE and saved = 0.

**4. Auto-Deposit Setup**
After creating a goal, the user sets a monthly deposit amount in INR and a preferred day of the month. The schedule is stored in Supabase. A `pg_cron` job fires daily at 9am UTC and checks which schedules are due. For custodial users, the Edge Function signs and broadcasts the transaction automatically — the user does nothing. For Pera Wallet users, a reminder email with a deep link is sent to trigger one-tap approval.

**5. Monthly Deposit Cycle**
Each deposit is an atomic transaction group containing two transactions: a USDC AssetTransfer to the app account address, and a `deposit()` app call. The smart contract verifies the grouped payment, updates the box storage (`saved += amount`, `deposit_count++`), and checks if the target has been reached. If `saved >= target`, status is automatically set to COMPLETED.

**6. Completion and Withdrawal**
When status is COMPLETED (or the deadline has passed), the withdraw button becomes active on the dashboard. The user calls `withdraw()`, and the smart contract sends USDC back via an inner transaction directly to the user's wallet. The box is deleted, and the MBR is refunded.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    React Frontend (Vite + TypeScript)    │
│  Pera Wallet connect │ Custodial login │ INR/USDC display│
│  algokit-utils-ts   │ @perawallet/connect │ supabase-js  │
└────────────┬───────────────────────────┬────────────────┘
             │                           │
     ┌───────▼──────┐           ┌────────▼───────┐
     │   Supabase   │           │ Algorand Testnet│
     │  Auth (email)│           │ AlgoNode RPC   │
     │  Encrypted   │           │ Pera signs txns│
     │  wallet keys │           │ Indexer: history│
     │  pg_cron jobs│           └────────┬───────┘
     │  Edge Fns    │                    │
     └──────────────┘           ┌────────▼───────┐
                                │  Smart Contract │
                                │  Puya-TS        │
                                │  Box storage    │
                                │  USDC ASA       │
                                │  ABI methods    │
                                └────────────────┘
```

**Data flow principle:** Supabase stores user identity and schedule metadata only. All money logic — balances, conditions, withdrawals — lives on-chain in the smart contract. Supabase never touches funds.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Smart contract | Puya-TS (TypeScript → AVM bytecode) |
| Frontend | React 18 + Vite + TypeScript |
| Backend / Auth | Supabase (Auth, Postgres, Edge Functions, pg_cron) |
| Algorand SDK | algokit-utils-ts, algosdk |
| Wallet (self-custody) | Pera Wallet + `@perawallet/connect` |
| Wallet (custodial) | Supabase Edge Function signs transactions |
| Savings asset | USDC (ASA ID 31566704 mainnet / mock ASA on testnet) |
| Staking yield | Folks Finance xALGO liquid staking |
| DEX swap | Tinyman V2 (ALGO → USDC conversion) |
| Price feed | CoinGecko API (USD/INR live rate) |
| Testing | Vitest + AlgoKit sandbox (local Algorand node) |
| Deployment | AlgoKit CLI → Algorand Testnet |

---

## Smart Contract

Written in **Puya-TS** and compiled to Algorand AVM bytecode. Deployed as an Algorand Application.

### Goal Struct (stored in box storage)

```typescript
class Goal extends arc4.Struct<{
  name:     arc4.Str       // Goal name e.g. "Europe Trip"
  target:   arc4.UInt64   // Target in microUSDC
  deadline: arc4.UInt64   // Unix timestamp
  saved:    arc4.UInt64   // Current saved microUSDC
  status:   arc4.UInt64   // 0=ACTIVE 1=COMPLETED 2=EXPIRED
  deposits: arc4.UInt64   // Deposit count (gamification)
  category: arc4.UInt64   // 0=General 1=Travel 2=Emergency 3=Gadgets
}> {}
```

**Box key:** `wallet_address_bytes (32) + goal_id_bytes (8)` — this gives every user their own isolated namespace with no cross-user access possible.

### ABI Methods

| Method | Description |
|---|---|
| `bootstrap(usdcId)` | One-time setup — opts contract into USDC, called by deployer |
| `createGoal(name, target, deadline, category)` | Creates a new goal box, returns goal_id |
| `deposit(goalId, payIndex)` | Verifies atomic USDC payment, updates saved amount |
| `withdraw(goalId)` | Checks conditions, sends USDC via inner txn, deletes box |
| `getGoal(wallet, goalId)` | Read-only — returns full Goal struct |
| `setPause(paused)` | Admin only — emergency stop |

### On-chain Enforcement Logic

```
ALLOW withdrawal if:
  status == COMPLETED (saved >= target)
  OR
  current_timestamp > deadline (expired — refund whatever was saved)

DENY if:
  status == ACTIVE AND timestamp <= deadline
```

This logic runs on the Algorand blockchain. It cannot be overridden by the platform, the developer, or any third party.

### Atomic Transaction Group (deposit)

Every deposit requires two transactions grouped atomically:

- **Txn 0:** USDC AssetTransfer from user → app account
- **Txn 1:** `deposit(goalId, payIndex)` app call

The contract verifies Txn 0 is in the same group, confirms the asset is USDC, confirms the receiver is the app account, and only then updates the box. If either transaction fails, both revert — no partial state is possible.

---

## Wallet Types

### Pera Wallet (self-custody)

The user installs Pera Wallet (iOS/Android/browser extension) and connects it to the platform. Every transaction requires explicit approval in Pera Wallet. The user's private key never leaves Pera Wallet — the platform never has access to it. This is the most secure option.

Auto-deposits are not fully automatic for Pera users — the platform sends a reminder email with a deep link that opens Pera Wallet directly to the approval screen. One tap to approve.

### Custodial Wallet (email signup)

The user signs up with email and password. The platform generates an Algorand keypair on the backend. The private key is encrypted with AES-256 before being stored in Supabase. Signing happens inside a Supabase Edge Function — the raw private key never leaves the server and is never sent to the browser.

Auto-deposits are fully automatic for custodial users — the Edge Function signs and broadcasts transactions on schedule with no user action required.

**Export anytime:** Users can go to Settings → Export Wallet to receive their 25-word mnemonic phrase. They can then import it into Pera Wallet and take full self-custody, ending their dependency on the platform entirely.

### Why users can trust the custodial model

- The platform holds the **key**, not the **funds**. USDC is in the smart contract, not in Supabase.
- The smart contract's `withdraw()` method can only send USDC back to the wallet that originally deposited it. The platform backend cannot redirect funds to itself.
- The platform's encryption key and database are separate systems — a database breach alone does not expose usable private keys.
- Every transaction is publicly visible on the Algorand explorer. Users can verify their balance independently at any time.

---

## USDC & Stability

User funds are stored in **USDC** — not ALGO. USDC is a regulated stablecoin issued by Circle, always worth exactly $1. This eliminates the primary concern users have about blockchain savings: cryptocurrency volatility.

| Asset | Volatility | Used for |
|---|---|---|
| USDC | ~3–5% USD/INR per year | User savings in goal vaults |
| ALGO | 30–80% per year | Platform treasury, transaction fees |

**INR display:** The frontend fetches the live USD/INR rate from CoinGecko every 60 seconds and converts all USDC amounts to INR for display. The smart contract only stores and understands USDC (microUSDC = 1/1,000,000 USDC). INR is a frontend display layer only.

**Testnet:** On Algorand testnet, a mock USDC ASA is deployed with identical decimal structure (6 decimals). The codebase uses an environment variable `VITE_USDC_ASSET_ID` to switch between testnet mock and mainnet real USDC.

---

## Staking & Yield

The platform's **treasury ALGO** (held for operational purposes — funding new wallets, paying fees) is staked via **Folks Finance xALGO** liquid staking. This earns approximately 5–8% APR in ALGO.

**Critical distinction:** User USDC in goal vaults is never staked or used in any DeFi protocol. Only the platform's own treasury ALGO is staked. User funds have zero exposure to staking risk.

### How xALGO works

When the treasury deposits ALGO into Folks Finance, it receives xALGO tokens. xALGO appreciates in value relative to ALGO as staking rewards accumulate. There is no lock-up — xALGO can be redeemed for ALGO at any time. The protocol charges a 10% fee on staking rewards only.

### No slashing risk

Algorand's Pure Proof-of-Stake does not use slashing. Unlike Ethereum staking, there is no mechanism by which the protocol can confiscate staked ALGO as punishment. The worst case is a period of no rewards — principal is always safe.

---

## Tinyman DEX Integration

Staking yield comes back as ALGO. To distribute it to users as a USDC savings bonus, the platform swaps ALGO → USDC on **Tinyman V2**, Algorand's primary AMM-based decentralized exchange.

### Monthly yield distribution flow

```
Treasury ALGO staked in Folks Finance
          ↓
Accumulates as xALGO yield (~25 ALGO/month on 5,000 ALGO treasury)
          ↓
Unstake xALGO → ALGO
          ↓
Keep 30% in treasury (operational reserve)
          ↓
Swap 70% ALGO → USDC on Tinyman
  (atomic 3-txn group: pay + swap call + receive)
  (0.5% slippage protection via minUsdcOut parameter)
          ↓
Distribute USDC proportionally to active goals
  (weighted by each goal's saved amount)
          ↓
Each user's goal vault receives a small USDC bonus
```

### Slippage protection

Every Tinyman swap includes a `minUsdcOut` parameter. If the pool cannot provide at least this amount of USDC (due to price movement or low liquidity), the entire transaction group reverts automatically. No partial swaps are possible.

### Price guard

The distribution Edge Function checks if ALGO has dropped more than 10% in the last 24 hours before executing a swap. If it has, the swap is deferred to the next cycle to avoid selling at a temporarily depressed price.

---

## Auto-Deposit Automation

### Custodial users — fully automatic

```
pg_cron fires daily at 09:00 UTC
    ↓
Edge Function checks auto_deposit_schedules
where day_of_month = today AND is_active = true
    ↓
Fetches live USD/INR rate
Converts monthly INR amount → microUSDC
    ↓
Checks wallet USDC balance
    ↓
If sufficient: builds atomic group, signs with stored key, broadcasts
If insufficient: sends "top up" email, increments failure_count
    ↓
Updates next_run_at to same day next month
```

### Pera Wallet users — reminder + approval

The platform cannot sign on behalf of Pera users since it never has their private key. Instead, on the scheduled day the platform sends an email with a deep link that opens Pera Wallet directly to the pre-built transaction for one-tap approval.

### Failure handling

After 3 consecutive failures (insufficient USDC balance), the schedule is automatically paused and the user is notified. They can reactivate it from the dashboard after topping up their wallet.

---

## Revenue Model

The platform earns revenue from two independent sources:

### 1. Withdrawal fee (primary)

A 1% fee is deducted from the withdrawal amount when a goal is completed or expires.

| Scenario | User deposits | Withdrawal amount | Platform fee |
|---|---|---|---|
| Goal completed | $50 × 10 months = $500 | $495 | $5.00 ≈ ₹417 |
| Partial (7 deposits) | $50 × 7 = $350 | $346.50 | $3.50 ≈ ₹292 |
| No deposits | $0 | $0 | $0 |

### 2. Treasury staking yield (passive)

Independent of user activity. 5,000 ALGO in treasury at 6% APR earns approximately 25 ALGO per month. At ₹14/ALGO that is ₹350/month passively. 70% is distributed to users as USDC bonus; 30% is retained as platform revenue.

### Revenue at scale

| Users | Monthly withdrawal fees | Monthly staking revenue | Total monthly |
|---|---|---|---|
| 100 | ~₹4,170 | ~₹105 | ~₹4,275 |
| 500 | ~₹20,850 | ~₹350 | ~₹21,200 |
| 1,000 | ~₹41,700 | ~₹700 | ~₹42,400 |

Assumptions: average $500 goal, 10-month completion, 1% withdrawal fee, 5,000 ALGO treasury.

---

## Project Structure

```
piggybank/
├── contracts/
│   ├── piggybank.algo.ts          # Puya-TS smart contract
│   └── artifacts/                 # Compiled TEAL + ABI (auto-generated)
│       ├── piggybank.approval.teal
│       ├── piggybank.clear.teal
│       └── PiggyBankClient.ts     # Auto-generated ABI client
│
├── scripts/
│   └── deploy-mock-usdc.ts        # Deploy testnet mock USDC ASA
│
├── tests/
│   └── piggybank.test.ts          # Vitest contract tests (local sandbox)
│
├── supabase/
│   ├── migrations/
│   │   ├── 001_init.sql           # custodial_wallets, goal_cache tables
│   │   └── 002_automation.sql     # auto_deposit_schedules, yield_bonuses
│   └── functions/
│       ├── sign-txn/              # Signs transactions for custodial users
│       │   └── index.ts
│       ├── setup-wallet/          # Encrypts + stores new wallet key
│       │   └── index.ts
│       ├── auto-deposit/          # pg_cron triggered monthly deposits
│       │   └── index.ts
│       └── distribute-yield/      # Tinyman swap + USDC bonus distribution
│           └── index.ts
│
├── frontend/
│   ├── src/
│   │   ├── context/
│   │   │   └── WalletContext.tsx   # Global wallet state (Pera + custodial)
│   │   ├── hooks/
│   │   │   ├── useAuth.ts          # Supabase auth state
│   │   │   ├── useGoals.ts         # Fetch goals from chain via box storage
│   │   │   └── useRates.ts         # Live USD/INR rate with 60s refresh
│   │   ├── lib/
│   │   │   ├── supabase.ts         # Supabase client singleton
│   │   │   ├── algorand.ts         # algodClient, rate helpers, conversions
│   │   │   ├── contract.ts         # All ABI method calls + atomic groups
│   │   │   └── tinyman.ts          # Tinyman swap helpers
│   │   ├── components/
│   │   │   ├── WalletChoice.tsx    # Landing: Pera vs custodial selector
│   │   │   ├── GoalCard.tsx        # Single goal with progress bar
│   │   │   ├── GoalDashboard.tsx   # All goals list
│   │   │   ├── CreateGoalModal.tsx # Goal creation form
│   │   │   ├── DepositModal.tsx    # Deposit flow with INR→USDC display
│   │   │   └── WithdrawButton.tsx  # Enabled only when conditions met
│   │   └── App.tsx
│   ├── .env                        # Frontend environment variables
│   └── vite.config.ts
│
├── .env                            # Root environment variables
└── package.json
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- Python 3.12+
- Docker Desktop (running)
- AlgoKit CLI

### 1. Install dependencies

```bash
# Install AlgoKit
pip install algokit
algokit --version

# Start local Algorand node (requires Docker)
algokit localnet start
algokit localnet status   # should show "Running"

# Install Supabase CLI
npm install -g supabase

# Clone and install
git clone https://github.com/your-username/piggybank-algorand
cd piggybank-algorand
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 2. Compile the smart contract

```bash
npx puya-ts contracts/piggybank.algo.ts
# Output: contracts/artifacts/
```

### 3. Run tests on local sandbox

```bash
algokit localnet start
npx vitest run
# All tests must pass before proceeding to testnet
```

### 4. Deploy mock USDC and the contract

```bash
# Generate a deployer wallet
algokit generate wallet

# Fund it at https://bank.testnet.algorand.network/

# Deploy mock USDC ASA (testnet only)
npx ts-node scripts/deploy-mock-usdc.ts
# Note the ASA ID printed — add to .env as VITE_USDC_ASSET_ID

# Deploy smart contract
algokit deploy --network testnet
# Note the App ID printed — add to .env as VITE_APP_ID
```

### 5. Set up Supabase

```bash
supabase login
supabase init
supabase link --project-ref your-project-ref

# Apply database migrations
supabase db push

# Deploy Edge Functions
supabase functions deploy sign-txn
supabase functions deploy setup-wallet
supabase functions deploy auto-deposit
supabase functions deploy distribute-yield

# Set secrets
supabase secrets set ENCRYPTION_KEY=your-32-char-secret
supabase secrets set TREASURY_ADDRESS=your-treasury-address
supabase secrets set TREASURY_PRIVATE_KEY=your-encrypted-key
supabase secrets set APP_ID=your-app-id
supabase secrets set USDC_ASSET_ID=your-usdc-asset-id
supabase secrets set ALGOD_SERVER=https://testnet-api.algonode.cloud
```

### 6. Start the frontend

```bash
cd frontend
npm run dev
# Opens at http://localhost:5173
```

---

## Environment Variables

### Root `.env`

```bash
ALGOD_SERVER=https://testnet-api.algonode.cloud
ALGOD_TOKEN=
APP_ID=12345678
USDC_ASSET_ID=99999999
DEPLOYER_MNEMONIC=twenty five words here
TREASURY_ADDRESS=ABC...XYZ
TREASURY_PRIVATE_KEY=encrypted-key-here
ENCRYPTION_KEY=32-char-aes-256-key
```

### Frontend `frontend/.env`

```bash
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...
VITE_ALGOD_SERVER=https://testnet-api.algonode.cloud
VITE_APP_ID=12345678
VITE_USDC_ASSET_ID=99999999
```

---

## Deployment

### Testnet (current)

The project is deployed on Algorand Testnet using AlgoNode's free RPC endpoint. All USDC is a mock ASA with identical decimal structure to mainnet USDC. Testnet ALGO is freely available from the Algorand testnet faucet.

### Mainnet considerations

Before mainnet deployment:
- Replace mock USDC ASA ID with `31566704` (Circle's mainnet USDC)
- Replace Tinyman testnet pool addresses with mainnet equivalents
- Replace Folks Finance testnet app ID with mainnet app ID
- Obtain legal review — holding user funds (even via smart contract) may require regulatory compliance depending on jurisdiction
- Add a security audit of the smart contract

---

## Target Audience

**Primary:** Young salaried professionals aged 22–32 earning ₹25,000–₹80,000/month in Tier 1 and Tier 2 Indian cities. Digitally native, UPI-first, saving for specific lifestyle goals (travel, gadgets, emergency fund) but lacking structural discipline.

**Secondary:** College students and freshers (18–24) with stipends or first salaries, forming financial habits for the first time and highly comfortable with digital products.

**Not targeted:** Rural/unbanked population (no smartphone access to crypto infrastructure), upper class (already have wealth managers and FDs), users who need INR insurance (DICGC does not cover crypto-based products).

---

## Competitive Advantages

| Feature | This platform | Jupiter / Fi | Jar | Ethereum PiggyBank |
|---|---|---|---|---|
| Hard on-chain withdrawal lock | Yes | No | No | Yes |
| USDC stablecoin (no volatility) | Yes | INR (native) | Gold (±10%) | Yes |
| No crypto knowledge needed | Yes (custodial) | Yes | Yes | No (MetaMask) |
| Self-custody option | Yes (Pera) | No | No | Yes |
| Monthly auto-deposit | Yes | Yes | Yes | No |
| Transaction fees per deposit | < ₹0.03 | Zero | Zero | ₹150–500 (gas) |
| India-focused INR display | Yes | Yes | Yes | No |
| Yield bonus to users | Yes (USDC via Tinyman) | Mutual funds | Gold returns | No |

**Core differentiation:** The only platform combining blockchain-enforced savings lock + USDC stability + no crypto knowledge required + India-first INR UX + yield distribution via liquid staking.

---

## Known Limitations

**Bank-to-USDC gap:** The platform cannot debit a user's bank account directly. Users must acquire USDC from an exchange (WazirX, CoinDCX) and send it to their wallet. This is a regulatory infrastructure constraint — not a technical one. A production integration with Transak (licensed INR → USDC on-ramp with UPI support) would close this gap.

**Pera Wallet automation:** Auto-deposits for Pera Wallet users require manual one-tap approval per deposit. Full automation is only possible for custodial wallet users since Pera's private key never touches the platform's servers. This is a deliberate security property, not a bug.

**No RBI/SEBI regulation:** Unlike Jupiter (Federal Bank) or Jar (SEBI-regulated gold), this platform is not regulated by Indian financial authorities. User funds are not insured by DICGC. This is disclosed clearly in the UI.

**ALGO price risk on yield:** The staking yield and Tinyman swap introduce ALGO price dependency on the yield bonus amount. The user's core USDC savings are unaffected — only the bonus varies. A 20% ALGO price drop results in 20% less USDC bonus, not 20% less savings.

**Testnet only:** This project is a proof of concept deployed on Algorand Testnet. No real funds should be deposited.

---

## Roadmap

**Phase 1 — Current (Hackathon)**
- Smart contract with full goal lifecycle on Algorand Testnet
- Custodial + Pera Wallet support
- USDC savings with INR display
- Monthly auto-deposit via Supabase pg_cron
- Treasury staking via Folks Finance xALGO
- Tinyman ALGO→USDC swap for yield distribution

**Phase 2 — Post-hackathon**
- Mainnet deployment with real USDC
- Transak UPI on-ramp integration
- Early withdrawal penalty (configurable 1–10%)
- Goal sharing — invite friends to contribute to your goal
- Push notifications (mobile PWA)
- Multiple goal templates (Emergency Fund, Travel, Education)

**Phase 3 — Production**
- Legal and regulatory review
- Security audit of smart contract
- SEBI/RBI regulatory consultation
- iOS and Android native apps
- Multiple stablecoin support (USDT, EURC)
- Social savings — group goals with shared contribution tracking

---

## Developer Resources

- [Algorand Developer Documentation](https://developer.algorand.org)
- [AlgoBharat Developer Portal](https://algobharat.in/devportal/)
- [Puya-TS Documentation](https://github.com/algorandfoundation/puya-ts)
- [AlgoKit Documentation](https://github.com/algorandfoundation/algokit-cli)
- [Supabase Documentation](https://supabase.com/docs)
- [Tinyman V2 Documentation](https://docs.tinyman.org)
- [Folks Finance xALGO Documentation](https://docs.folks.finance/functionalities/xalgo-liquid-staking)
- [AlgoNode RPC (free Algorand node)](https://algonode.io)
- [Algorand Testnet Faucet](https://bank.testnet.algorand.network)
- [Pera Wallet](https://perawallet.app)

---

## License

MIT License — see LICENSE file for details.

---

*Built with Algorand, Puya-TS, Supabase, React, and Tinyman for Hackatron 3.0, BIT Sindri.*
