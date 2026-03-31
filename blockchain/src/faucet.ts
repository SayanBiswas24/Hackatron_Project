/**
 * faucet.ts
 *
 * Platform sign-up faucet for Testnet.
 *
 * When a new user signs up and connects their wallet (or we create a custodial
 * wallet for them), we call `airdropSignupAlgo` to send them a small amount of
 * ALGO from a dedicated platform "faucet" account. This ALGO is used exclusively
 * to cover Box Storage MBR fees when they create savings goals.
 *
 * Faucet account setup:
 *   - Generate a fresh Algorand account on Testnet.
 *   - Fund it via https://testnet.algoexplorer.io/dispenser (free Testnet ALGO).
 *   - Store its mnemonic in `.env` as FAUCET_MNEMONIC.
 *
 * ALGO amounts (all on Testnet — zero real value):
 *   - Sign-up airdrop:  0.5 ALGO (500_000 microAlgo)
 *   - This comfortably covers ~4-5 goal creations with names up to ~60 chars.
 *
 * Usage (from your Express / Next.js API route):
 *   import { airdropSignupAlgo } from '../blockchain/src/faucet'
 *   const txId = await airdropSignupAlgo(userWalletAddress)
 */

import algosdk, { makePaymentTxnWithSuggestedParamsFromObject } from 'algosdk';
import { algorandClient } from './config/index.js';

// ─── Constants ────────────────────────────────────────────────────────────────

/**
 * microAlgo to send on sign-up.
 * 500_000 = 0.5 ALGO — enough to cover ~4 goal creations with typical names.
 */
export const SIGNUP_AIRDROP_AMOUNT = 500_000n;

/**
 * Minimum ALGO balance Algorand requires every account to hold (0.1 ALGO).
 * The actual airdrop is SIGNUP_AIRDROP_AMOUNT ON TOP of this.
 */
const MIN_BALANCE = 100_000n;

// ─── Faucet account loader ────────────────────────────────────────────────────

/**
 * Loads the platform faucet account from FAUCET_MNEMONIC in .env.
 * Called lazily so the module can be imported without env vars set.
 */
function loadFaucetAccount(): algosdk.Account {
  const mnemonic = process.env.FAUCET_MNEMONIC;
  if (!mnemonic) {
    throw new Error(
      'FAUCET_MNEMONIC is not set in .env — ' +
        'generate an account, fund it on Testnet, and store its mnemonic.',
    );
  }
  return algosdk.mnemonicToSecretKey(mnemonic);
}

// ─── Core faucet logic ────────────────────────────────────────────────────────

/**
 * Sends a one-time ALGO airdrop to a new user's wallet on Testnet.
 *
 * Call this from your sign-up API endpoint right after the user connects
 * their wallet (Pera + custodial) for the first time.
 *
 * @param recipientAddress - The receiving wallet address (Pera or custodial)
 * @returns The transaction ID of the airdrop payment
 *
 * @throws If FAUCET_MNEMONIC is not configured
 * @throws If the faucet account is underfunded
 */
export async function airdropSignupAlgo(recipientAddress: string): Promise<string> {
  const faucet = loadFaucetAccount();
  const algod = algorandClient.client.algod;

  // Check faucet balance before proceeding
  const faucetInfo = await algorandClient.account.getInformation(faucet.addr.toString());
  const faucetBalance = BigInt(faucetInfo.balance.microAlgo);
  const required = SIGNUP_AIRDROP_AMOUNT + MIN_BALANCE + 1000n; // +1000 for txn fee
  if (faucetBalance < required) {
    throw new Error(
      `Platform faucet is low on funds! ` +
        `Balance: ${faucetBalance} microAlgo, Required: ${required} microAlgo. ` +
        `Please top up the faucet account at https://testnet.algoexplorer.io/dispenser`,
    );
  }

  const sp = await algod.getTransactionParams().do();

  const airdropTxn = makePaymentTxnWithSuggestedParamsFromObject({
    sender: faucet.addr.toString(),
    receiver: recipientAddress,
    amount: SIGNUP_AIRDROP_AMOUNT,
    note: new TextEncoder().encode('PennyStalker sign-up airdrop (Testnet)'),
    suggestedParams: sp,
  });

  const signedTxn = airdropTxn.signTxn(faucet.sk);
  await algod.sendRawTransaction(signedTxn).do();
  const txId = airdropTxn.txID().toString();
  await algosdk.waitForConfirmation(algod, txId, 4);

  console.log(
    `[Faucet] Airdropped ${SIGNUP_AIRDROP_AMOUNT} microAlgo ` +
      `to ${recipientAddress} | TxID: ${txId}`,
  );

  return txId;
}

/**
 * Checks the current balance of the platform faucet account.
 * Useful for monitoring dashboards.
 *
 * @returns Balance in microAlgo
 */
export async function getFaucetBalance(): Promise<bigint> {
  const faucet = loadFaucetAccount();
  const info = await algorandClient.account.getInformation(faucet.addr.toString());
  return BigInt(info.balance.microAlgo);
}

/**
 * Returns the faucet account's public address.
 * Safe to expose publicly — it is a read-only identifier.
 */
export function getFaucetAddress(): string {
  const faucet = loadFaucetAccount();
  return faucet.addr.toString();
}
