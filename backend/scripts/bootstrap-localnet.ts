import algosdk from 'algosdk';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import * as algokit from '@algorandfoundation/algokit-utils';
// Use the .ts extension for tsx or omit it; tsx will resolve correctly
import { PennyStalkerClient } from '../src/lib/contracts/PennyStalkerClient.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initial configuration for LocalNet
const ALGOD_TOKEN = 'a'.repeat(64);
const ALGOD_SERVER = 'http://localhost';
const ALGOD_PORT = '4001';
const KMD_PORT = '4002';

const algodClient = new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_SERVER, ALGOD_PORT);
const kmdClient = new algosdk.Kmd(ALGOD_TOKEN, ALGOD_SERVER, KMD_PORT);
async function bootstrap() {
  console.log('🚀 Starting LocalNet Bootstrap for PennyStalker...\n');

  try {
    // 1. Get LocalNet Genesis Account (Dispenser) using algokit-utils
    console.log('📡 Getting LocalNet Dispenser Account via algokit...');
    const genesisWrapper = await algokit.getDispenserAccount(algodClient, kmdClient);
    const genesisAddr = String((genesisWrapper as any).account?.addr || genesisWrapper.addr);
    const genesisSk = (genesisWrapper as any).account?.sk || (genesisWrapper as any).sk;

    if (!genesisAddr) {
        throw new Error('No genesis addresses found using algokit.getDispenserAccount().');
    }

    console.log(`✅ Connected to LocalNet. Genesis account (Dispenser): ${genesisAddr}`);

    // 1. Setup Platform Master Account
    dotenv.config({ path: path.join(__dirname, '../../.env') });
    let platformAccount: algosdk.Account;
    const existingMnemonic = process.env.PLATFORM_MNEMONIC?.trim().replace(/"/g, '');

    if (existingMnemonic) {
      try {
        platformAccount = algosdk.mnemonicToSecretKey(existingMnemonic);
        console.log(`♻️ Using existing platform account from .env: ${platformAccount.addr.toString()}`);
      } catch (e) {
        console.warn('⚠️ Existing mnemonic in .env is invalid. Generating new one.');
        platformAccount = algosdk.generateAccount();
      }
    } else {
      platformAccount = algosdk.generateAccount();
      const newMnemonic = algosdk.secretKeyToMnemonic(platformAccount.sk);
      console.log(`✨ Generated new platform account: ${platformAccount.addr.toString()}`);
      console.log(`📝 Mnemonic: ${newMnemonic}`);
    }

    // 2. Fund Platform Account via algokit-utils ensuring it has 100 ALGO minimum
    console.log(`📡 Ensuring Platform Account is funded on LocalNet...`);
    console.log(`DEBUG: Funding address: ${platformAccount.addr.toString()}`);
    await algokit.transferAlgos({
      from: genesisWrapper,
      to: platformAccount.addr.toString(),
      amount: algokit.algos(100), // 100 ALGO is plenty for demo
    }, algodClient);

    // 3. Verify Funding Succeeded
    const accInfo = await algodClient.accountInformation(platformAccount.addr).do();
    console.log(`💰 Platform account funded. Current Balance: ${accInfo.amount} microAlgos`);
    if (BigInt(accInfo.amount) < 100_000n) { // Less than 0.1 ALGO
        throw new Error('CRITICAL: Account funding failed. Balance is not sufficient to create assets.');
    }

    // 4. Create Mock USDC Asset
    console.log('🪙 Creating Mock USDC Asset...');
    console.log('DEBUG: Asset Creator address:', platformAccount.addr.toString());
    const params = await algodClient.getTransactionParams().do();
    const usdcCreateTxn = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
        sender: platformAccount.addr.toString(),
        total: 10_000_000_000_000n, // 10M USDC
        decimals: 6,
        assetName: 'Mock USDC',
        unitName: 'USDC',
        assetURL: 'https://pennystalker.app',
        manager: platformAccount.addr.toString(),
        reserve: platformAccount.addr.toString(),
        freeze: platformAccount.addr.toString(),
        clawback: platformAccount.addr.toString(),
        defaultFrozen: false,
        suggestedParams: params,
    });
    const signedUsdc = usdcCreateTxn.signTxn(platformAccount.sk);
    const usdcResponse = await algodClient.sendRawTransaction(signedUsdc).do();
    const usdcTxId = (usdcResponse as any).txId || usdcResponse.txid;
    const ptx = await algosdk.waitForConfirmation(algodClient, usdcTxId, 4);
    // Asset index can be a number or string in v3 response
    const usdcAssetId = BigInt(ptx.assetIndex!);
    console.log(`✅ Mock USDC Created! Asset ID: ${usdcAssetId}`);

    // 5. Deploy PennyStalker Contract
    const signer = algosdk.makeBasicAccountTransactionSigner(platformAccount);
    const client = new PennyStalkerClient({
      algodClient,
      appId: 0n,
      sender: { addr: platformAccount.addr.toString(), signer },
    });

    console.log('🛠️ Deploying PennyStalker contract...');
    const appId = await client.deploy(usdcAssetId);
    console.log(`🎯 PennyStalker Deployed! App ID: ${appId}`);

    // 6. Fund the Application Account (MBR for Asset Opt-in)
    const appAddress = algosdk.getApplicationAddress(Number(appId)).toString();
    console.log(`📡 Funding PennyStalker App Address (${appAddress}) for USDC opt-in...`);
    await algokit.transferAlgos({
      from: genesisWrapper,
      to: appAddress,
      amount: algokit.algos(0.5), // 0.5 ALGO is more than enough for setup
    }, algodClient);

    // 7. Opt App into USDC
    console.log('🔗 Opting contract into USDC...');
    await client.optIntoUsdc(usdcAssetId);
    console.log('✅ Contract opted into USDC');

    // 8. Update .env files
    const envPath = path.join(__dirname, '../.env');
    const frontendEnvPath = path.join(__dirname, '../../frontend/.env');

    const envUpdates = {
        VITE_APP_ID: appId.toString(),
        VITE_USDC_ASSET_ID: usdcAssetId.toString(),
        PLATFORM_MNEMONIC: algosdk.secretKeyToMnemonic(platformAccount.sk),
        ALGOD_SERVER: ALGOD_SERVER,
        ALGOD_PORT: ALGOD_PORT,
        ALGOD_TOKEN: ALGOD_TOKEN,
        VITE_NETWORK: 'localnet'
    };

    const updateEnv = (p: string) => {
        let content = '';
        if (fs.existsSync(p)) {
            content = fs.readFileSync(p, 'utf8');
        }
        
        Object.entries(envUpdates).forEach(([key, value]) => {
            const regex = new RegExp(`^${key}=.*`, 'm');
            if (content.match(regex)) {
                content = content.replace(regex, `${key}=${value}`);
            } else {
                content += `\n${key}=${value}`;
            }
        });
        fs.writeFileSync(p, content.trim() + '\n');
    };

    updateEnv(envPath);
    console.log('📝 Backend .env updated.');
    
    // Update frontend VITE_ fields
    const frontendUpdates = Object.fromEntries(
        Object.entries(envUpdates).filter(([k]) => k.startsWith('VITE_'))
    );
    let frontendContent = fs.existsSync(frontendEnvPath) ? fs.readFileSync(frontendEnvPath, 'utf8') : '';
    Object.entries(frontendUpdates).forEach(([key, value]) => {
        const regex = new RegExp(`^${key}=.*`, 'm');
        if (frontendContent.match(regex)) {
            frontendContent = frontendContent.replace(regex, `${key}=${value}`);
        } else {
            frontendContent += `\n${key}=${value}`;
        }
    });
    fs.writeFileSync(frontendEnvPath, frontendContent.trim() + '\n');
    console.log('📝 Frontend .env updated.');

    console.log('\n✨ LocalNet Bootstrap Complete! ✨');
    console.log('Please restart your frontend and backend servers to apply changes.');

  } catch (error: any) {
    if (error.code === 'ECONNREFUSED' || error.message?.includes('fetch failed')) {
        console.error('\n❌ ERROR: Connection Refused.');
        console.error('👉 Ensure Docker is running and you have started LocalNet with:');
        console.error('   algokit localnet start');
    } else {
        console.error('\n❌ Bootstrap failed:', error);
    }
  }
}

bootstrap();
