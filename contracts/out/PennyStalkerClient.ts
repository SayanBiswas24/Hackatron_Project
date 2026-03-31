/**
 * PennyStalkerClient.ts
 *
 * Strongly-typed TypeScript client for the PennyStalker smart contract.
 * Generated from: PennyStalker.arc32.json
 *
 * Usage:
 *   import { PennyStalkerClient } from './PennyStalkerClient'
 *   const client = new PennyStalkerClient({ algodClient, appId, sender })
 */

import algosdk, {
  Algodv2,
  AtomicTransactionComposer,
  makePaymentTxnWithSuggestedParamsFromObject,
  makeAssetTransferTxnWithSuggestedParamsFromObject,
  ABIMethod,
  ABIContract,
  TransactionWithSigner,
} from 'algosdk';
import { Buffer } from 'buffer';
import CONTRACT_ARC32 from './PennyStalker.arc32.json' with { type: 'json' };

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PennyStalkerClientConfig {
  /** Algod client connected to the target network */
  algodClient: Algodv2;
  /** The deployed application ID. Pass 0 to deploy fresh. */
  appId: bigint;
  /** The signer account for all transactions */
  sender: {
    addr: string;
    signer: algosdk.TransactionSigner;
  };
}

export interface CreateGoalParams {
  /** Human-readable label, e.g. "New Car" */
  name: string;
  /**
   * USDC target in the asset's smallest unit (micro-USDC).
   * 1 USDC = 1_000_000 micro-USDC on Testnet (6 decimals).
   */
  targetAmountMicroUsdc: bigint;
  /** Unix timestamp (seconds) after which the goal can be force-withdrawn */
  deadlineUnixSec: bigint;
  /**
   * microAlgo MBR amount to send.
   * Formula: 2500 + 400 * (41 + 2 + name_byte_len + 32)
   * Use the exported helper `calcGoalMbr(name)` to compute this.
   */
  mbrMicroAlgo: bigint;
}

export interface DepositParams {
  /** Goal ID returned from createGoal */
  goalId: bigint;
  /** USDC asset ID on Testnet */
  usdcAssetId: bigint;
  /** Amount of micro-USDC to deposit */
  amountMicroUsdc: bigint;
}

// ─── MBR Helper ──────────────────────────────────────────────────────────────

/**
 * Calculates the exact microAlgo MBR required to create a box for a goal.
 *
 * @param name - The goal name string (UTF-8)
 * @returns microAlgo amount to include in the MBR payment transaction
 */
export function calcGoalMbr(name: string): bigint {
  const nameByteLen = BigInt(new TextEncoder().encode(name).byteLength);
  // Box key = 'g' (1) + sender_addr (32) + goal_id_uint64 (8) = 41 bytes
  const boxKeyLen = 41n;
  // Box value = ARC-4 string header (2) + name bytes + 4x uint64 (32)
  const boxValueLen = 2n + nameByteLen + 32n;
  return 2500n + 400n * (boxKeyLen + boxValueLen);
}

// ─── Client ──────────────────────────────────────────────────────────────────

export class PennyStalkerClient {
  private algod: Algodv2;
  private appId: bigint;
  private sender: { addr: string; signer: algosdk.TransactionSigner };
  private contract: ABIContract;

  constructor(config: PennyStalkerClientConfig) {
    this.algod = config.algodClient;
    this.appId = config.appId;
    this.sender = config.sender;
    this.contract = new ABIContract(CONTRACT_ARC32.contract as algosdk.ABIContractParams);
  }

  private getMethod(name: string): ABIMethod {
    const method = this.contract.methods.find((m: ABIMethod) => m.name === name);
    if (!method) throw new Error(`Method '${name}' not found in ABI`);
    return method;
  }

  private async getSuggestedParams() {
    return this.algod.getTransactionParams().do();
  }

  // ─── Deployment ────────────────────────────────────────────────────────────

  /**
   * Deploys the PennyStalker contract and initializes it with the USDC Asset ID.
   * Only called once by the platform deployer.
   *
   * @param usdcAssetId - The Testnet USDC Asset ID (e.g. 10458941)
   * @returns The new Application ID
   */
  async deploy(usdcAssetId: bigint): Promise<bigint> {
    const sp = await this.getSuggestedParams();

    const approvalSource = Buffer.from(CONTRACT_ARC32.source.approval, 'base64').toString('utf8');
    const clearSource = Buffer.from(CONTRACT_ARC32.source.clear, 'base64').toString('utf8');

    const approvalCompiled = await this.algod.compile(approvalSource).do();
    const clearCompiled = await this.algod.compile(clearSource).do();

    const approvalProgram = Buffer.from(approvalCompiled.result, 'base64');
    const clearProgram = Buffer.from(clearCompiled.result, 'base64');

    const atc = new AtomicTransactionComposer();
    atc.addMethodCall({
      appID: 0,
      method: this.getMethod('createApplication'),
      methodArgs: [usdcAssetId],
      sender: this.sender.addr,
      signer: this.sender.signer,
      suggestedParams: sp,
      approvalProgram,
      clearProgram,
      numGlobalByteSlices: CONTRACT_ARC32.state.global.num_byte_slices,
      numGlobalInts: CONTRACT_ARC32.state.global.num_uints,
      numLocalByteSlices: CONTRACT_ARC32.state.local.num_byte_slices,
      numLocalInts: CONTRACT_ARC32.state.local.num_uints,
      onComplete: algosdk.OnApplicationComplete.NoOpOC,
    });

    const result = await atc.execute(this.algod, 4);
    const appId = BigInt(result.methodResults[0].txInfo!.applicationIndex!);
    this.appId = appId;
    return appId;
  }

  // ─── Admin ─────────────────────────────────────────────────────────────────

  /**
   * Opts the contract account into the USDC asset so it can receive tokens.
   * Only callable by the deployer. Must be called right after deployment.
   * The contract must hold at least 0.1 ALGO to cover the asset opt-in MBR.
   */
  async optIntoUsdc(usdcAssetId: bigint): Promise<void> {
    const sp = await this.getSuggestedParams();
    const atc = new AtomicTransactionComposer();
    atc.addMethodCall({
      appID: Number(this.appId),
      method: this.getMethod('optIntoUsdc'),
      methodArgs: [],
      sender: this.sender.addr,
      signer: this.sender.signer,
      suggestedParams: { ...sp, fee: 2000, flatFee: true }, // covers inner txn fee
      appForeignAssets: [Number(usdcAssetId)],
    });
    await atc.execute(this.algod, 4);
  }

  // ─── User ──────────────────────────────────────────────────────────────────

  /**
   * Opts a user into the application, initializing their local state.
   * This must be called before a user can create savings goals.
   */
  async optInToApp(): Promise<void> {
    const sp = await this.getSuggestedParams();
    const atc = new AtomicTransactionComposer();
    atc.addMethodCall({
      appID: Number(this.appId),
      method: this.getMethod('optInToApp'),
      methodArgs: [],
      sender: this.sender.addr,
      signer: this.sender.signer,
      suggestedParams: sp,
      onComplete: algosdk.OnApplicationComplete.OptInOC,
    });
    await atc.execute(this.algod, 4);
  }

  /**
   * Creates a new savings goal for the calling user.
   * The platform pre-funds the user's wallet with ALGO to cover this MBR.
   *
   * @returns The newly created goal ID (uint64)
   */
  async createGoal(params: CreateGoalParams): Promise<bigint> {
    const sp = await this.getSuggestedParams();
    const appAddress = algosdk.getApplicationAddress(Number(this.appId));

    // Build the MBR payment transaction (grouped with the app call)
    const mbrPayTxn = makePaymentTxnWithSuggestedParamsFromObject({
      sender: this.sender.addr,
      receiver: appAddress,
      amount: params.mbrMicroAlgo,
      suggestedParams: sp,
    });
    const mbrPayWithSigner: TransactionWithSigner = {
      txn: mbrPayTxn,
      signer: this.sender.signer,
    };

    const atc = new AtomicTransactionComposer();
    atc.addMethodCall({
      appID: Number(this.appId),
      method: this.getMethod('createGoal'),
      methodArgs: [params.name, params.targetAmountMicroUsdc, params.deadlineUnixSec, mbrPayWithSigner],
      sender: this.sender.addr,
      signer: this.sender.signer,
      suggestedParams: sp,
      // Declare box access for the new goal. Box key = address bytes + goal ID uint64
      boxes: [
        {
          appIndex: 0,
          name: new Uint8Array([
            ...Buffer.from('g'),
            ...algosdk.decodeAddress(this.sender.addr).publicKey,
            // Box ID will be the next ID (0 for first goal) - we use a placeholder
            // The contract handles the exact key; we just declare the access budget
            0, 0, 0, 0, 0, 0, 0, 0,
          ]),
        },
      ],
    });

    const result = await atc.execute(this.algod, 4);
    return BigInt(result.methodResults[0].returnValue as number);
  }

  /**
   * Deposits USDC into a specific savings goal.
   * Sends an atomic group: asset transfer + app call.
   *
   * @param params - Deposit parameters
   */
  async deposit(params: DepositParams): Promise<void> {
    const sp = await this.getSuggestedParams();
    const appAddress = algosdk.getApplicationAddress(Number(this.appId));

    const axferTxn = makeAssetTransferTxnWithSuggestedParamsFromObject({
      sender: this.sender.addr,
      receiver: appAddress,
      assetIndex: Number(params.usdcAssetId),
      amount: params.amountMicroUsdc,
      suggestedParams: sp,
    });
    const axferWithSigner: TransactionWithSigner = {
      txn: axferTxn,
      signer: this.sender.signer,
    };

    const boxKey = new Uint8Array([
      ...Buffer.from('g'),
      ...algosdk.decodeAddress(this.sender.addr).publicKey,
      ...algosdk.encodeUint64(params.goalId),
    ]);

    const atc = new AtomicTransactionComposer();
    atc.addMethodCall({
      appID: Number(this.appId),
      method: this.getMethod('deposit'),
      methodArgs: [params.goalId, axferWithSigner],
      sender: this.sender.addr,
      signer: this.sender.signer,
      suggestedParams: sp,
      boxes: [{ appIndex: 0, name: boxKey }],
      appForeignAssets: [Number(params.usdcAssetId)],
    });

    await atc.execute(this.algod, 4);
  }

  /**
   * Withdraws USDC from a completed or expired goal.
   * Refunds the box MBR (ALGO) back to the user and deletes the box.
   *
   * @param goalId - The ID of the goal to withdraw from
   */
  async withdraw(goalId: bigint): Promise<void> {
    const sp = await this.getSuggestedParams();

    const boxKey = new Uint8Array([
      ...Buffer.from('g'),
      ...algosdk.decodeAddress(this.sender.addr).publicKey,
      ...algosdk.encodeUint64(goalId),
    ]);

    const atc = new AtomicTransactionComposer();
    atc.addMethodCall({
      appID: Number(this.appId),
      method: this.getMethod('withdraw'),
      methodArgs: [goalId],
      sender: this.sender.addr,
      signer: this.sender.signer,
      // Extra fee budget: 2 inner txns (asset transfer + payment)
      suggestedParams: { ...sp, fee: 3000, flatFee: true },
      boxes: [{ appIndex: 0, name: boxKey }],
      appForeignAssets: [Number(await this.getUsdcAssetId())],
    });

    await atc.execute(this.algod, 4);
  }

  // ─── Read Helpers ──────────────────────────────────────────────────────────

  /**
   * Fetches the current next goal ID for a given account.
   * This tells you how many goals the user has created in total.
   */
  async getNextGoalId(accountAddr: string): Promise<bigint> {
    const accountInfo = await this.algod
      .accountApplicationInformation(accountAddr, Number(this.appId))
      .do();
    const locals = accountInfo.appLocalState?.keyValue ?? [];
    const entry = locals.find(
      (kv) => Buffer.from(kv.key).toString('utf8') === 'next_id',
    );
    return entry ? BigInt(entry.value.uint) : 0n;
  }

  /**
   * Fetches the USDC asset ID stored in the contract's global state.
   */
  async getUsdcAssetId(): Promise<bigint> {
    const appInfo = await this.algod
      .getApplicationByID(Number(this.appId))
      .do();
    const globals = appInfo.params.globalState ?? [];
    const entry = globals.find(
      (kv) => Buffer.from(kv.key).toString('utf8') === 'usdc',
    );
    return entry ? BigInt(entry.value.uint) : 0n;
  }
}
