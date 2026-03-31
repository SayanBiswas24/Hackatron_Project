import { describe, test, expect, beforeAll } from 'vitest';
import * as algokit from '@algorandfoundation/algokit-utils';
import algosdk from 'algosdk';
import { PennyStalkerClient, calcGoalMbr } from './out/PennyStalkerClient.js';

describe('PennyStalker End-to-End', () => {
  const localnet = algokit.AlgorandClient.defaultLocalNet();
  let deployer: any; // Type is complex in algokit-utils v9, using any for tests or narrowing later
  let user: any;
  let usdcId: bigint;
  let appId: bigint;
  let deployerClient: PennyStalkerClient;
  let userClient: PennyStalkerClient;

  beforeAll(async () => {
    // 1. Setup accounts on LocalNet
    deployer = await localnet.account.random();
    user = await localnet.account.random();
    const dispenser = await algokit.getDispenserAccount(localnet.client.algod, localnet.client.kmd);
    localnet.account.setSigner(dispenser.addr, dispenser.signer);

    // Fund them from the LocalNet dispenser
    await localnet.send.payment({
      sender: dispenser.addr,
      receiver: deployer.addr,
      amount: algokit.algo(100),
    });
    await localnet.send.payment({
      sender: dispenser.addr,
      receiver: user.addr,
      amount: algokit.algo(100),
    });

    // 2. Create a dummy USDC asset
    const assetResult = await localnet.send.assetCreate({
      sender: deployer.addr,
      total: 1_000_000_000n,
      decimals: 6,
    });
    usdcId = BigInt(assetResult.confirmation.assetIndex!);

    // 3. Initialize the Deployer Client
    deployerClient = new PennyStalkerClient({
      algodClient: localnet.client.algod,
      appId: 0n,
      sender: {
        addr: deployer.addr.toString(),
        signer: deployer.signer,
      },
    });

    // 4. Deploy and fund contract
    appId = await deployerClient.deploy(usdcId);
    const appAddr = algosdk.getApplicationAddress(Number(appId));
    await localnet.send.payment({
      sender: (await algokit.getDispenserAccount(localnet.client.algod, localnet.client.kmd)).addr,
      receiver: appAddr.toString(),
      amount: algokit.algo(1),
    });
    await deployerClient.optIntoUsdc(usdcId);

    // 5. Initialize User Client
    userClient = new PennyStalkerClient({
      algodClient: localnet.client.algod,
      appId: appId,
      sender: {
        addr: user.addr.toString(),
        signer: user.signer,
      },
    });
  });

  test('User can opt-in and create a goal', async () => {
    await userClient.optInToApp();
    
    const goalName = 'New Bike';
    const target = 100_000_000n; // 100 USDC
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600); // 1 hour
    const mbr = calcGoalMbr(goalName);

    const goalId = await userClient.createGoal({
      name: goalName,
      targetAmountMicroUsdc: target,
      deadlineUnixSec: deadline,
      mbrMicroAlgo: mbr,
    });

    expect(goalId).toBe(0n);
    expect(await userClient.getNextGoalId(user.addr.toString())).toBe(1n);
  });

  test('User can deposit USDC into a goal', async () => {
    // 1. User opts into USDC
    await localnet.send.assetOptIn({
      sender: user.addr,
      assetId: usdcId,
    });

    // 2. Give user some USDC
    await localnet.send.assetTransfer({
      sender: deployer.addr,
      receiver: user.addr,
      assetId: usdcId,
      amount: 200_000_000n,
    });

    // 3. Deposit 10 USDC
    await userClient.deposit({
      goalId: 0n,
      usdcAssetId: usdcId,
      amountMicroUsdc: 10_000_000n,
    });
  });

  test('User can withdraw once completed or expired', async () => {
    // 1. Complete the goal (deposit remaining 90 USDC)
    await userClient.deposit({
      goalId: 0n,
      usdcAssetId: usdcId,
      amountMicroUsdc: 90_000_000n,
    });

    // 2. Record balances before withdrawal
    const beforeInfo = await localnet.account.getInformation(user.addr);
    const beforeAlgos = BigInt(beforeInfo.balance.microAlgo);

    // 3. Execute withdrawal
    await userClient.withdraw(0n);

    // 4. Record balances after
    const afterInfo = await localnet.account.getInformation(user.addr);
    const afterAlgos = BigInt(afterInfo.balance.microAlgo);

    // 5. Verify USDC returned
    const userUsdc = afterInfo.assets?.find(a => BigInt(a.assetId) === usdcId)?.amount;
    expect(BigInt(userUsdc ?? 0)).toBeGreaterThanOrEqual(100_000_000n);

    // 6. Verify MBR Refunded
    expect(afterAlgos).toBeGreaterThan(beforeAlgos);
  });

  test('Should fetch global USDC state', async () => {
    const assetId = await userClient.getUsdcAssetId();
    expect(assetId).toBe(usdcId);
  });
});
