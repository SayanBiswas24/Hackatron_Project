import { AlgorandClient } from '@algorandfoundation/algokit-utils';

// Standard Algorand Client pointing to TestNet nodes
export const algorandClient = AlgorandClient.testNet();

// The asset ID for Circle USDC on ALGORAND TESTNET
export const TESTNET_USDC_ASSET_ID = 10458941n;

// For older algosdk functions that require number
export const TESTNET_USDC_ASSET_ID_NUMBER = 10458941;
