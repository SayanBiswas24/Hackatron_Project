import algosdk from 'algosdk';
import { decrypt } from './crypto';
import { PennyStalkerClient } from './contracts/PennyStalkerClient';

// Network connection settings - dynamically loaded from environment
const ALGOD_TOKEN = process.env.ALGOD_TOKEN || '';
const ALGOD_SERVER = process.env.ALGOD_SERVER || 'https://testnet-api.algonode.cloud';
const ALGOD_PORT = process.env.ALGOD_PORT || '';

export const algodClient = new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_SERVER, ALGOD_PORT);

// The IDs are now dynamic - set these in your .env based on the active network
export const APP_ID = BigInt(process.env.VITE_APP_ID || '0');
export const USDC_ASSET_ID = BigInt(process.env.VITE_USDC_ASSET_ID || '10458941'); // Defaults to Circle USDC on Testnet

/**
 * Creates a PennyStalker contract client for a specific user.
 * 
 * @param encryptedMnemonic - The user's encrypted mnemonic from the database
 * @returns An initialized PennyStalkerClient that signs for the user
 */
export function getCustodialClient(encryptedMnemonic: string): PennyStalkerClient {
  const mnemonic = decrypt(encryptedMnemonic);
  const account = algosdk.mnemonicToSecretKey(mnemonic);
  const signer = algosdk.makeBasicAccountTransactionSigner(account);

  return new PennyStalkerClient({
    algodClient,
    appId: APP_ID,
    sender: {
      addr: account.addr.toString(),
      signer,
    },
  });
}

/**
 * Creates a PennyStalker contract client for the platform master account.
 * Used for administrative tasks like opting the app into USDC.
 */
export function getPlatformClient(): PennyStalkerClient {
  const mnemonic = process.env.PLATFORM_MNEMONIC;
  if (!mnemonic) throw new Error('PLATFORM_MNEMONIC not set');

  const account = algosdk.mnemonicToSecretKey(mnemonic);
  const signer = algosdk.makeBasicAccountTransactionSigner(account);

  return new PennyStalkerClient({
    algodClient,
    appId: APP_ID,
    sender: {
      addr: account.addr.toString(),
      signer,
    },
  });
}

/**
 * Fetches the USDC balance of a given address.
 */
export async function getUsdcBalance(address: string): Promise<bigint> {
  try {
    const info = await algodClient.accountAssetInformation(address, Number(USDC_ASSET_ID)).do();
    return BigInt(info['asset-holding'].amount);
  } catch (e: any) {
    if (e.status === 404) return 0n; // Not opted in or literally 0
    throw e;
  }
}

/**
 * Utility to check if a custodial account has enough ALGO for operations.
 */
export async function getAlgoBalance(address: string): Promise<bigint> {
  const info = await algodClient.accountInformation(address).do();
  return BigInt(info.amount);
}

/**
 * Airdrops USDC to a specific address from the platform master account.
 * Used for both simulating purchases (LocalNet) and faucets (Testnet).
 */
export async function airdropUsdc(toAddress: string, amountUsdc: number = 1000): Promise<string> {
  const platformMnemonic = process.env.PLATFORM_MNEMONIC;
  if (!platformMnemonic) {
    throw new Error('PLATFORM_MNEMONIC not set');
  }

  const platformAccount = algosdk.mnemonicToSecretKey(platformMnemonic);
  const params = await algodClient.getTransactionParams().do();

  // amountUsdc is in whole units, convert to microUSDC (6 decimals)
  const amount = BigInt(amountUsdc * 1_000_000);

  const txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
    sender: platformAccount.addr.toString(),
    receiver: toAddress,
    assetIndex: Number(USDC_ASSET_ID),
    amount,
    suggestedParams: params,
  });

  const signedTxn = txn.signTxn(platformAccount.sk);
  const response = await algodClient.sendRawTransaction(signedTxn).do();
  const txId = response.txid;

  console.log(`🪙 Sending ${amountUsdc} USDC to ${toAddress}. TxID: ${txId}`);
  
  // Wait for confirmation - shorter for LocalNet if possible, but 4 is safe default
  const waitRounds = ALGOD_SERVER.includes('localhost') ? 1 : 4;
  await algosdk.waitForConfirmation(algodClient, txId, waitRounds);

  return txId;
}

/**
 * Airdrops ALGO to a specific address from the platform master account.
 */
export async function airdropAlgo(toAddress: string): Promise<string> {
  const platformMnemonic = process.env.PLATFORM_MNEMONIC;
  if (!platformMnemonic) {
    throw new Error('PLATFORM_MNEMONIC not set in environment.');
  }

  const platformAccount = algosdk.mnemonicToSecretKey(platformMnemonic);
  const params = await algodClient.getTransactionParams().do();

  // 0.5 ALGO = 500,000 microAlgos
  const amount = 500_000;

  const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    sender: platformAccount.addr.toString(),
    receiver: toAddress,
    amount,
    suggestedParams: params,
  });

  const signedTxn = txn.signTxn(platformAccount.sk);
  const response = await algodClient.sendRawTransaction(signedTxn).do();
  const txId = response.txid;

  console.log(`💸 Sending 0.5 ALGO to ${toAddress}. TxID: ${txId}`);

  const waitRounds = ALGOD_SERVER.includes('localhost') ? 1 : 4;
  await algosdk.waitForConfirmation(algodClient, txId, waitRounds);

  return txId;
}
