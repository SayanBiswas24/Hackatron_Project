# Goal-Based Piggy Bank on Algorand: Research & Architecture Document

## 1. Problem Statement & Objective
**Problem:** Users often struggle to save consistently for specific goals like rent, travel, or gadgets due to lack of structure and accountability. Existing tools do not provide goal-wise tracking with enforced saving discipline.
**Objective:** Build a multi-goal savings vault on Algorand where users can create goals, deposit funds, track progress, and withdraw only when predefined conditions are met.

## 2. Core Features & Scope
*   **Create Multiple Goals:** Define a target amount and a timeline (deadline).
*   **Deposit Funds:** Deposit USDC into goal-specific vaults to securely manage funds.
*   **Track Progress:** Monitor both amount saved and percentage towards the target.
*   **Status Indicators:** Goal status tracking (Active / Completed / Expired).
*   **Conditional Withdrawals:** Allow withdrawals only when conditions are met (e.g., target reached or deadline passed), enforced on-chain.
*   **Asset focus:** Shift from ALGO to USDC for stability.

## 3. Wallet Integration Strategy
To maximize accessibility, the platform will support two distinct wallet experiences:

### A. Pera Wallet (Standard Web3)
*   **Target User:** Existing Algorand users and crypto-natives.
*   **Implementation:** Use `@txnlab/use-wallet` for a unified connection interface.
*   **UX Flow:** Standard QR code / App-to-App connection. Provides maximum security and self-custody.

### B. Silent Custodial Wallet (Social/Web2 Logic)
*   **Target User:** Newcomers who don't want to manage mnemonics or deal with wallet popups for every action.
*   **Recommended Tool:** **Magic Link** (via `@magic-ext/algorand`) or **Web3Auth**.
*   **UX Flow:** 
    1. User logs in via Email or Social (Google).
    2. A secure, non-custodial wallet is created in the background (MPC/TEE).
    3. The application can sign "low-risk" transactions (like deposits) with minimal friction, providing a "silent" experience.
*   **Implementation Note:** Magic Link treats the user's email as an identifier and derives an Algorand address. The app interacts with it via a custom signer that conforms to the `algosdk` signing interface.

## 4. USDC Implementation (Testnet)
To avoid volatility, the project will use **Circle USDC** on the Algorand Testnet.

*   **Asset ID (Testnet):** `10458941`
*   **Decimals:** 6 (1 USDC = 1,000,000 units).
*   **Requirement: Opt-in:**
    *   Every user account (Wallet or Silent) must **Opt-in** to USDC before they can receive or hold it.
    *   The Smart Contract (Application Account) must also be opted-in to the USDC asset.

### Simplified Transaction Flow
To ensure a premium UX, the user should never have to manually select an asset or search for USDC.
1.  **Pre-selected Asset:** The UI will strictly display USDC balances. The "Deposit" button will automatically construct an `AssetTransferTxn` with X-Asset-ID set to `10458941`.
2.  **Automated Opt-in:** If the app detects the user has not opted into USDC, the "Deposit" flow should first prompt/perform a one-time Opt-in transaction.
3.  **Transaction Logic:**
    *   **Deposit:** User sends X amount of USDC to the Smart Contract.
    *   **Withdrawal:** Smart Contract sends USDC back to the user via an `Inner Transaction` (type: `axfer`).

## 5. Algorand Technical Architecture (Updated)
The application will use **AlgoKit** and **Puya (Algorand Python)**.

### State Management (Box Storage)
*   **Box Key:** `/Address (32 bytes)/ + /Goal ID (8 bytes)/`
*   **Box Value Structure:**
    *   `Target Amount` (uint64 - in USDC units)
    *   `Current Balance` (uint64 - in USDC units)
    *   `Deadline` (uint64 - UNIX timestamp)
    *   `Status` (uint8)

### Smart Contract Methods (Refined)
*   **`create_goal`**: Same as before, but initialized with a target in USDC.
*   **`deposit(goal_id: uint64, axfer: asset_transfer)`**:
    *   Verify `axfer.asset_receiver == Global.current_application_address`.
    *   Verify `axfer.xfer_asset == 10458941`.
    *   Update box state with `axfer.asset_amount`.
*   **`withdraw(goal_id: uint64)`**:
    *   Verify conditions (deadline/target).
    *   Execute `itxn.AssetTransfer` with `xfer_asset: 10458941` and `asset_amount` from the box balance.

## 6. UI/UX & Design System
Use a **"Dark Mode Neon"** aesthetic with high-contrast USDC indicators.

### Visual Cues for USDC
*   Use the official USDC Blue (`#2775CA`) for accents related to money.
*   Display balances as `$XX.XX` instead of raw units to maintain a familiar FinTech feel.

### Dynamic Design Principles
1.  **Wallet Selection Overlay:** A premium, blurred modal with two clear choices: "Connect Pera" vs "Continue with Email (Silent)".
2.  **Zero-Configuration Deposits:** When a user clicks "Deposit" on a goal, the asset is already locked to USDC. Clicking confirm triggers the wallet signature immediately.
3.  **Smooth Opt-in Onboarding:** If a user needs to opt-in, use a progress stepper: `Opting in to USDC...` -> `Confirming transaction...` -> `Success`.

## 7. Next Steps & Research
*   [ ] Set up `@txnlab/use-wallet` with Pera and Magic Link providers.
*   [ ] Write the USDC-specific Puya contract.
*   [ ] Create a utility for automatic Testnet USDC funding (Faucet link discovery).
*   [ ] Prototype the "Silent" login flow to ensure it doesn't break the user flow with unnecessary popups.
