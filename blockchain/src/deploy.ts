/**
 * deploy.ts
 *
 * One-time Testnet deployment script for the PennyStalker smart contract.
 *
 * Steps performed:
 *  1. Load the DEPLOYER account from the environment (mnemonic stored in .env)
 *  2. Deploy the contract calling `createApplication` with the Testnet USDC Asset ID
 *  3. Fund the contract's application address with a small ALGO balance so it
 *     can afford the USDC asset opt-in MBR (0.1 ALGO minimum)
 *  4. Opt the contract into USDC so it can receive deposits
 *  5. Print the deployed App ID — save this in your .env as VITE_APP_ID
 *
 * Usage:
 *   npx ts-node --esm src/deploy.ts
 *   (or via: node --loader ts-node/esm src/deploy.ts)
 *
 * Prerequisites:
 *   DEPLOYER_MNEMONIC=<25-word mnemonic>  in .env
 *   The deployer account must be funded on Testnet.
 *   Use https://testnet.algoexplorer.io/dispenser to fund it.
 */

import 'dotenv/config';
import algosdk from 'algosdk';
import { algorandClient, TESTNET_USDC_ASSET_ID } from './config/index.js';
import CONTRACT_ARC32 from '../../contracts/out/PennyStalker.arc32.json' assert { type: 'json' };
import {
  AtomicTransactionComposer,
  ABIContract,
  ABIMethod,
  makePaymentTxnWithSuggestedParamsFromObject,
} from 'algosdk';

// ─── Load deployer account from mnemonic ─────────────────────────────────────

function loadDeployer(): algosdk.Account {
  const mnemonic = process.env.DEPLOYER_MNEMONIC;
  if (!mnemonic) {
    throw new Error('DEPLOYER_MNEMONIC is not set in .env');
  }
  return algosdk.mnemonicToSecretKey(mnemonic);
}

// ─── Main deployment flow ─────────────────────────────────────────────────────

async function deploy() {
  const deployer = loadDeployer();
  const algod = algorandClient.client.algod;
  console.log(`\n🚀 Deployer address: ${deployer.addr.toString()}`);

  const sp = await algod.getTransactionParams().do();
  const signer = algosdk.makeBasicAccountTransactionSigner(deployer);
  const contract = new ABIContract(CONTRACT_ARC32.contract as algosdk.ABIContractParams);

  const getMethod = (name: string): ABIMethod => {
    const m = contract.methods.find((m) => m.name === name);
    if (!m) throw new Error(`Method '${name}' not found`);
    return m;
  };

  // ── Step 1: Deploy the contract ───────────────────────────────────────────

  console.log('\n📦 Deploying PennyStalker contract ...');

  const approvalProgram = Buffer.from(CONTRACT_ARC32.source.approval, 'base64');
  const clearProgram = Buffer.from(CONTRACT_ARC32.source.clear, 'base64');

  const atcDeploy = new AtomicTransactionComposer();
  atcDeploy.addMethodCall({
    appID: 0,
    method: getMethod('createApplication'),
    // Pass the numeric Testnet USDC Asset ID
    methodArgs: [TESTNET_USDC_ASSET_ID],
    sender: deployer.addr.toString(),
    signer,
    suggestedParams: sp,
    approvalProgram,
    clearProgram,
    numGlobalByteSlices: CONTRACT_ARC32.state.global.num_byte_slices,
    numGlobalInts: CONTRACT_ARC32.state.global.num_uints,
    numLocalByteSlices: CONTRACT_ARC32.state.local.num_byte_slices,
    numLocalInts: CONTRACT_ARC32.state.local.num_uints,
    onComplete: algosdk.OnApplicationComplete.NoOpOC,
  });

  const deployResult = await atcDeploy.execute(algod, 4);
  const appId = Number(deployResult.methodResults[0].txInfo!['application-index']);
  const appAddress = algosdk.getApplicationAddress(appId);

  console.log(`✅ Contract deployed!`);
  console.log(`   App ID:      ${appId}`);
  console.log(`   App Address: ${appAddress}`);

  // ── Step 2: Fund the contract's app address for asset opt-in MBR ─────────

  console.log('\n💰 Funding app address with 0.2 ALGO for MBR...');

  const fundTxn = makePaymentTxnWithSuggestedParamsFromObject({
    sender: deployer.addr.toString(),
    receiver: appAddress,
    amount: 200_000, // 0.2 ALGO in microAlgo — covers asset opt-in MBR
    suggestedParams: sp,
  });

  const signedFundTxn = fundTxn.signTxn(deployer.sk);
  await algod.sendRawTransaction(signedFundTxn).do();
  await algosdk.waitForConfirmation(algod, fundTxn.txID().toString(), 4);
  console.log(`✅ App address funded.`);

  // ── Step 3: Opt the contract into USDC ────────────────────────────────────

  console.log('\n🔗 Opting contract into USDC...');

  const atcOptIn = new AtomicTransactionComposer();
  atcOptIn.addMethodCall({
    appID: appId,
    method: getMethod('optIntoUsdc'),
    methodArgs: [],
    sender: deployer.addr.toString(),
    signer,
    // Fee covers the inner asset transfer txn
    suggestedParams: { ...sp, fee: 2000, flatFee: true },
  });

  await atcOptIn.execute(algod, 4);
  console.log(`✅ Contract opted into USDC (Asset ID: ${TESTNET_USDC_ASSET_ID})`);

  // ── Done ──────────────────────────────────────────────────────────────────

  console.log('\n🎉 Deployment complete!');
  console.log('   Add the following to your .env file:\n');
  console.log(`   VITE_APP_ID=${appId}`);
  console.log(`   VITE_APP_ADDRESS=${appAddress}\n`);
}

deploy().catch((err) => {
  console.error('\n❌ Deployment failed:', err.message ?? err);
  process.exit(1);
});
