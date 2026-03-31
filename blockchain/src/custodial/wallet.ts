import algosdk from 'algosdk';
import { algorandClient, TESTNET_USDC_ASSET_ID } from '../config';
import { encryptSecretKey, decryptSecretKey, EncryptedKeyPayload } from '../crypto/encryption';

export interface CustodialAccountData {
    address: string;
    encryptedPayload: EncryptedKeyPayload;
}

/**
 * Silently generates a new Algorand Account.
 * Encrypts the secret key using AES-256-GCM.
 * The backend should store this returned payload securely against the user's DB record.
 */
export function generateCustodialAccount(): CustodialAccountData {
    const account = algosdk.generateAccount();
    const encryptedPayload = encryptSecretKey(account.sk);
    
    return {
        address: account.addr.toString(),
        encryptedPayload
    };
}

/**
 * Reconstructs the Algorand Account object from the database's encrypted payload.
 */
export function restoreCustodialAccount(payload: EncryptedKeyPayload): algosdk.Account {
    const sk = decryptSecretKey(payload);
    const publicKey = sk.slice(32);
    const addrString = algosdk.encodeAddress(publicKey);
    
    return {
        addr: algosdk.Address.fromString(addrString),
        sk
    };
}

/**
 * Opts the Custodial Account into USDC by submitting a 0-value asset transfer to itself.
 * Uses algokit-utils for simplified interaction.
 */
export async function optInToUSDC(userAccount: algosdk.Account): Promise<string> {
    const result = await algorandClient.send.assetOptIn({
        assetId: TESTNET_USDC_ASSET_ID,
        sender: userAccount.addr.toString(),
        signer: {
            addr: userAccount.addr,
            signer: algosdk.makeBasicAccountTransactionSigner(userAccount)
        }
    });
    
    return result.txIds[0];
}

/**
 * Retrieves full account information (including balances) for the given address.
 */
export async function getCustodialBalance(address: string) {
    const accountInfo = await algorandClient.account.getInformation(address);
    return accountInfo;
}
