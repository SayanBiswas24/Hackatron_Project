# Goal-Based Piggy Bank on Algorand: Research & Architecture Document

## 1. Problem Statement & Objective
**Problem:** Users often struggle to save consistently for specific goals like rent, travel, or gadgets due to lack of structure and accountability. Existing tools do not provide goal-wise tracking with enforced saving discipline.
**Objective:** Build a multi-goal savings vault on Algorand where users can create goals, deposit funds, track progress, and withdraw only when predefined conditions are met.

## 2. Core Features & Scope
*   **Create Multiple Goals:** Define a target amount and a timeline (deadline).
*   **Deposit Funds:** Deposit ALGO into goal-specific vaults to securely manage funds.
*   **Track Progress:** Monitor both amount saved and percentage towards the target.
*   **Status Indicators:** Goal status tracking (Active / Completed / Expired).
*   **Conditional Withdrawals:** Allow withdrawals only when conditions are met (e.g., target reached or deadline passed), enforced on-chain.

## 3. Recommended Additional Features
To create a more robust and engaging product, consider these value-adding features:
*   **Gamification & Milestone Rewards:** Mint an underlying NFT badge (using ARC-19 or ARC-69) or assign reputational points when a goal is successfully achieved to motivate consistent saving.
*   **Emergency Interventions (Early Withdrawals):** Allow users to withdraw before meeting the deadline or target, but incur a protocol fee/penalty. This penalty can be sent to a treasury or donated.
*   **Yield Generation (DeFi Integration):** Since the ALGO is locked, integrate with lending protocols (like Folks Finance) to earn yield on the deposited ALGO. This accelerates the saving process.
*   **Multi-sig Shared Goals:** Allow couples or groups to contribute together towards a common goal (e.g., "Group Vacation") using an application account that tallies contributions from multiple senders.

## 4. Algorand Technical Architecture & Implementation
The application should use **AlgoKit** and **Puya (Algorand Python) / TEALScript** to write the smart contract, taking advantage of modern AVM features.

### State Management
*   **Local State vs. Box Storage:** Since a user can have *multiple* goals and Local State is highly limited, **Box Storage** is the optimal choice. It allows dynamic, unbounded storage.
*   **Box Storage Design:**
    *   **Box Key:** `/Address (32 bytes)/ + /Goal ID (8 bytes)/`
    *   **Box Value Structure:**
        *   `Target Amount` (uint64)
        *   `Current Balance` (uint64)
        *   `Deadline` (uint64 - UNIX timestamp)
        *   `Status` (uint8 - 0: Active, 1: Completed, 2: Expired, 3: Withdrawn)
*   **Global State:** Keep track of a global counter for `Next Goal ID` (if not using random/sequential client-side IDs) and total protocol TVL.

### Account Model
*   Funds will be locked in the **Smart Contract Application Account** (escrow).
*   The application account must be funded with the Minimum Balance Requirement (MBR) for every new box created (MBR = 2500 microAlgos + 400 microAlgos per byte of the box). It is best practice to have the user pay this MBR during the `create_goal` method.

### ABI Methods (Smart Contract Interface)
*   `create_goal(target_amount: uint64, deadline: uint64, mbr_payment: pay) -> uint64`
    *   Verifies the `mbr_payment` covers the box cost.
    *   Allocates a new box with the initial goal data.
*   `deposit(goal_id: uint64, payment: pay) -> void`
    *   Requires a `pay` transaction to the Application Account.
    *   Reads the box, adds the payment amount to `Current Balance`, and writes back to the box.
*   `withdraw(goal_id: uint64) -> void`
    *   Reads the box. Fails if `Current Balance < Target Amount` AND `Current time < Deadline`.
    *   Uses an `InnerTxn` (Type: `pay`) to send the `Current Balance` back to the user.
    *   Marks status as `Completed` or `Withdrawn` and potentially deletes the box to refund the MBR to the user.

## 5. UI/UX & Design System Research
To ensure the app looks premium and creates a "wow" factor, use a "Dynamic Glassmorphism" aesthetic that invokes a feeling of modern FinTech and Web3 security. Avoid generic flat designs.

### Color Combinations
**Light Mode (Clean, Trustworthy, Pastel Highlights):**
*   **Background:** `#F9FAFB` (Off-white / Cool Gray) with subtle, blurred pastel gradient orbs in the background (cyan and light purple).
*   **Card Background:** `rgba(255, 255, 255, 0.7)` with `backdrop-filter: blur(12px)` (Glass effect).
*   **Primary Accent:** `#2E28D4` (Algorand Purple) or sleek black for buttons.
*   **Secondary/Success:** `#10B981` (Emerald Green for savings progress).
*   **Text Primary:** `#111827` (Gray 900).

**Dark Mode (Premium, Vibrant, "Wow" Factor - Highly Recommended):**
*   **Background:** `#0B0F19` (Deep Navy / Almost Black) with a smooth, dark radial gradient.
*   **Card Background:** `rgba(31, 41, 55, 0.4)` with a `1px solid rgba(255, 255, 255, 0.1)` border and heavy background-blur.
*   **Primary Accent:** `#00E4FF` (Algorand Vibrant Cyan) to make buttons and active elements glow.
*   **Secondary Accent (Gradients):** `#B829FF` (Neon Purple) used in progress bars via `linear-gradient(90deg, #00E4FF, #B829FF)`.
*   **Secondary/Success:** `#34D399` (Soft Neon Green).
*   **Text Primary:** `#F9FAFB` (White) and `#9CA3AF` (Gray for subtext).

### Typography
*   Use modern sans-serif fonts like **Inter**, **Outfit**, or **Plus Jakarta Sans**. They provide excellent readability for numbers and balances while maintaining a geometric, tech-forward feel.

### Dynamic Design Principles (Micro-animations)
1.  **Progress Rings & Bars:** When the dashboard loads, the savings progress should gracefully animate from 0% to the current percentage.
2.  **Hover States:** Cards representing individual goals should slightly scale up (`transform: translateY(-4px) scale(1.01)`) and increase their drop-shadow glow on hover, making the interface organic and interactive.
3.  **Milestone Celebrations:** Implement a lightweight confetti animation or a satisfying glowing checkmark bounce when a goal reaches 100%.
4.  **Number Counters:** The "Total Saved" or ALGO balances should linearly cycle/count up to the final value upon page load rather than appearing statically.
