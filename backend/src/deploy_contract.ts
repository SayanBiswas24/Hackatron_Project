import algosdk from 'algosdk';
import dotenv from 'dotenv';
import { algodClient } from './lib/blockchain';
import { PennyStalkerClient } from './lib/contracts/PennyStalkerClient';
import CONTRACT_ARC32 from './lib/contracts/PennyStalker.arc32.json';

dotenv.config();

/**
 * DEPLOYMENT SCRIPT: PennyStalker Smart Contract (Testnet)
 * 
 * Uses the strongly-typed PennyStalkerClient to:
 * 1. Deploy the contract.
 * 2. Fund the contract account with initial ALGO (for MBR).
 * 3. Opt the contract into the USDC asset.
 */
async function deploy() {
    try {
        const mnemonic = process.env.PLATFORM_MNEMONIC;
        if (!mnemonic) throw new Error('PLATFORM_MNEMONIC not set in .env');

        const creator = algosdk.mnemonicToSecretKey(mnemonic);
        const sender = {
            addr: creator.addr.toString(),
            signer: algosdk.makeBasicAccountTransactionSigner(creator),
        };

        const usdcAssetId = BigInt(process.env.VITE_USDC_ASSET_ID || '10458941');

        console.log(`🚀 Starting deployment from: ${sender.addr}`);

        const client = new PennyStalkerClient({
            algodClient,
            appId: 0n,
            sender
        });

        // 1. Deploy
        console.log('⏳ Deploying contract (Compiling TEAL & Creating App)...');
        const appId = await client.deploy(usdcAssetId);
        console.log(`✅ PennyStalker Deployed! APP_ID: ${appId}`);

        // 2. Fund the App Account for MBR
        const appAddr = algosdk.getApplicationAddress(Number(appId));
        console.log(`💰 Funding App Address (${appAddr}) with 0.5 ALGO for MBR...`);

        const params = await algodClient.getTransactionParams().do();
        const fundTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
            sender: sender.addr,
            receiver: appAddr,
            amount: 500_000,
            suggestedParams: params
        });

        const signedFund = fundTxn.signTxn(creator.sk);
        await algodClient.sendRawTransaction(signedFund).do();
        await algosdk.waitForConfirmation(algodClient, fundTxn.txID(), 4);

        // 3. Opt into USDC
        console.log('🔗 Opting the App into USDC Asset...');
        await client.optIntoUsdc(usdcAssetId);
        console.log('✅ App successfully initialized and opted into USDC.');

        console.log('\n--- CONFIGURATION UPDATE REQUIRED ---');
        console.log(`Add this to your .env files:`);
        console.log(`VITE_APP_ID=${appId}`);
        console.log('------------------------------------');

    } catch (error: any) {
        console.error('❌ Deployment failed:', error.message || error);
        process.exit(1);
    }
}

deploy();
