import algosdk from 'algosdk';
import dotenv from 'dotenv';
import path from 'path';

// Load env from the backend directory
dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const ALGOD_SERVER = 'https://testnet-api.algonode.cloud';
const USDC_ASSET_ID = 10458941;

async function checkMasterBalance() {
  const mnemonic = process.env.PLATFORM_MNEMONIC;
  if (!mnemonic) {
    console.error('❌ Error: PLATFORM_MNEMONIC not set in backend/.env');
    return;
  }

  try {
    const account = algosdk.mnemonicToSecretKey(mnemonic);
    const address = account.addr.toString();
    const client = new algosdk.Algodv2('', ALGOD_SERVER, '');

    console.log(`\n🔍 Checking Master Account: ${address}\n`);

    // Check ALGO
    const accountInfo = await client.accountInformation(address).do();
    const algoBalance = accountInfo.amount / 1_000_000;
    console.log(`🔹 ALGO Balance: ${algoBalance.toLocaleString()} ALGO`);

    // Check USDC
    const assets = accountInfo.assets || [];
    const usdcAsset = assets.find((a: any) => a['asset-id'] === USDC_ASSET_ID);
    const usdcBalance = usdcAsset ? usdcAsset.amount / 1_000_000 : 0;
    
    console.log(`🪙 USDC Balance: ${usdcBalance.toLocaleString()} USDC (Asset ID: ${USDC_ASSET_ID})`);

    if (algoBalance < 1) {
        console.log('\n⚠️ WARNING: ALGO balance is low. This account needs ALGO to pay for transaction fees.');
        console.log(`👉 Visit: https://bank.testnet.algorand.network/ to fund ${address}`);
    }

    if (usdcBalance < 1000) {
        console.log('\n⚠️ WARNING: USDC balance is low. The platform faucet will fail.');
        console.log(`👉 Visit: https://faucet.circle.com/ to fund ${address} (Choose Algorand Testnet)`);
    }

    if (!usdcAsset) {
        console.log('\n⚠️ WARNING: This account is NOT opted-in to USDC. It cannot receive USDC yet.');
    }

  } catch (error: any) {
    console.error('❌ Error checking balance:', error.message);
  }
}

checkMasterBalance();
