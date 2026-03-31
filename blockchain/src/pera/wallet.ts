import { NetworkId, WalletId, WalletManager } from '@txnlab/use-wallet';

/**
 * Configures the WalletManager specifically optimized for the Pera Wallet on Algorand Testnet.
 * 
 * This object can be imported by the React frontend (or other web frameworks) 
 * to initialize the <WalletProvider> without redefining the network setup.
 */
export const peraWalletManager = new WalletManager({
    wallets: [
        WalletId.PERA
    ],
    defaultNetwork: NetworkId.TESTNET
});
