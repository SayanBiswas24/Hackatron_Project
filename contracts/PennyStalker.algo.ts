import {
  Contract,
  LocalState,
  GlobalState,
  BoxMap,
  uint64,
  bytes,
  Bytes,
  Txn,
  Global,
  itxn,
  gtxn,
  assert,
  op,
  Asset,
  clone,
  arc4
} from '@algorandfoundation/algorand-typescript';

export type GoalStruct = {
  name: string;
  targetAmount: uint64;
  currentBalance: uint64;
  deadline: uint64;
  status: uint64;
  dignitary: arc4.Address;
}

const STATUS_ACTIVE = 0 as uint64;
const STATUS_COMPLETED = 1 as uint64;
const STATUS_WITHDRAWN = 2 as uint64;

// Box key = keyPrefix('g', 1 byte) + sender.bytes(32) + op.itob(goalId)(8) = 41 bytes
const BOX_KEY_LEN = 41 as uint64;
// 4 x uint64 fields (32) + 1 x Address (32) = 64 bytes
const FIXED_FIELDS_BYTES = 64 as uint64;
// ARC-4 dynamic string header overhead
const STRING_HEADER_BYTES = 2 as uint64;
// Algorand MBR base cost per box (microAlgo)
const BOX_MBR_BASE = 2500 as uint64;
// Algorand MBR cost per byte (microAlgo)
const BOX_MBR_PER_BYTE = 400 as uint64;

export class PennyStalker extends Contract {
  usdcAsset = GlobalState<Asset>({ key: 'usdc' });

  nextGoalId = LocalState<uint64>({ key: 'next_id' });
  penaltyUntil = LocalState<uint64>({ key: 'penalty' });

  goals = BoxMap<bytes, GoalStruct>({ keyPrefix: 'g' });

  /**
   * Called once by the deployer to initialize the contract with the USDC asset.
   */
  createApplication(usdcAsset: Asset): void {
    this.usdcAsset.value = usdcAsset;
  }

  /**
   * Called by the platform deployer to opt the contract into USDC so it can receive tokens.
   */
  optIntoUsdc(): void {
    assert(Txn.sender === Global.creatorAddress, 'Must be creator');

    itxn.assetTransfer({
      xferAsset: this.usdcAsset.value,
      assetAmount: 0 as uint64,
      assetReceiver: Global.currentApplicationAddress,
      fee: 0 as uint64,
    }).submit();
  }

  /**
   * Called by a user to opt into the application and initialize their local state.
   */
  @arc4.abimethod({ allowActions: 'OptIn' })
  optInToApp(): void {
    this.nextGoalId(Txn.sender).value = 0 as uint64;
    this.penaltyUntil(Txn.sender).value = 0 as uint64;
  }

  /**
   * Creates a new savings goal backed by box storage.
   *
   * @param name         - A human-readable label for the goal (e.g., "New Car").
   * @param targetAmount - The USDC target in the asset's smallest unit (e.g. micro-USDC).
   * @param deadline     - A Unix timestamp after which the goal can be force-withdrawn.
   * @param mbrPay       - A payment transaction covering the Algorand Box MBR. This ALGO
   *                       is airdropped to the user's wallet by the platform on sign-up.
   * @returns The new goal's ID (used as a reference for future deposits / withdrawals).
   */
  createGoal(
    name: string,
    targetAmount: uint64,
    deadline: uint64,
    dignitary: arc4.Address,
    mbrPay: gtxn.PaymentTxn,
  ): uint64 {
    const currentId = this.nextGoalId(Txn.sender).value;
    const boxKey = Txn.sender.bytes.concat(op.itob(currentId));

    assert(!this.goals(boxKey).exists, 'Goal ID conflict');
    assert(deadline > Global.latestTimestamp, 'Deadline must be in the future');
    assert(targetAmount > (0 as uint64), 'Target amount must be greater than zero');

    // Compute MBR: base + (keyLen + valueLen) * perByte
    // value size = string header (2) + name bytes + 4 fixed uint64 fields (32)
    const nameLen = op.len(Bytes(name));
    const valueSize = (STRING_HEADER_BYTES + nameLen + FIXED_FIELDS_BYTES) as uint64;
    const requiredMbr = (BOX_MBR_BASE + BOX_MBR_PER_BYTE * (BOX_KEY_LEN + valueSize)) as uint64;

    assert(mbrPay.receiver === Global.currentApplicationAddress, 'MBR must be paid to the contract');
    assert(mbrPay.amount >= requiredMbr, 'Insufficient MBR payment for box storage');
    assert(mbrPay.sender === Txn.sender, 'MBR payer must match the caller');

    this.goals(boxKey).value = {
      name: name,
      targetAmount: targetAmount,
      currentBalance: 0 as uint64,
      deadline: deadline,
      status: STATUS_ACTIVE,
      dignitary: dignitary,
    };

    this.nextGoalId(Txn.sender).value = currentId + (1 as uint64);

    return currentId;
  }

  /**
   * Deposits USDC into a specific savings goal.
   *
   * @param goalId - The ID of the goal to deposit into.
   * @param axfer  - The asset transfer transaction sending USDC to this contract.
   */
  deposit(goalId: uint64, axfer: gtxn.AssetTransferTxn): void {
    assert(axfer.xferAsset === this.usdcAsset.value, 'Must deposit USDC');
    assert(axfer.assetReceiver === Global.currentApplicationAddress, 'Asset must be sent to the App');
    assert(axfer.sender === Txn.sender, 'Sender must match the depositor');

    const boxKey = Txn.sender.bytes.concat(op.itob(goalId));
    assert(this.goals(boxKey).exists, 'Goal not found');

    const goal = { ...this.goals(boxKey).value };
    assert(goal.status === STATUS_ACTIVE, 'Goal is no longer active');

    goal.currentBalance += axfer.assetAmount;

    if (goal.currentBalance >= goal.targetAmount) {
      goal.status = STATUS_COMPLETED;
    }

    this.goals(boxKey).value = clone(goal);
  }

  /**
   * Withdraws all USDC from a savings goal once it is completed or past its deadline.
   * Also refunds the box MBR back to the caller and deletes the box.
   *
   * @param goalId - The ID of the goal to withdraw from.
   */
  withdraw(goalId: uint64): void {
    const boxKey = Txn.sender.bytes.concat(op.itob(goalId));
    assert(this.goals(boxKey).exists, 'Goal not found');

    const goal = { ...this.goals(boxKey).value };
    assert(goal.status !== STATUS_WITHDRAWN, 'Already withdrawn');

    const isCompleted = goal.status === STATUS_COMPLETED;
    const isExpired = Global.latestTimestamp >= goal.deadline;
    assert(isCompleted || isExpired, 'Goal is not complete and deadline has not passed');

    const amountToSend = goal.currentBalance;
    assert(amountToSend > (0 as uint64), 'No funds to withdraw');

    // Recalculate box size to refund the exact MBR back to the user
    const nameLen = op.len(Bytes(goal.name));
    const valueSize = (STRING_HEADER_BYTES + nameLen + FIXED_FIELDS_BYTES) as uint64;
    const mbrRefund = (BOX_MBR_BASE + BOX_MBR_PER_BYTE * (BOX_KEY_LEN + valueSize)) as uint64;

    // Delete the box first to free the storage
    this.goals(boxKey).delete();

    // Transfer USDC back to user
    itxn.assetTransfer({
      xferAsset: this.usdcAsset.value,
      assetAmount: amountToSend,
      assetReceiver: Txn.sender,
      fee: 0 as uint64,
    }).submit();

    // Refund box MBR (ALGO) back to user
    itxn.payment({
      receiver: Txn.sender,
      amount: mbrRefund,
      fee: 0 as uint64,
    }).submit();
  }

  /**
   * Performs an emergency withdrawal with dual-authorization from the user and dignitary.
   * Release funds immediately regardless of deadline/target.
   * Triggers a 60-day incentive penalty for the user.
   *
   * @param goalId  - The ID of the goal.
   * @param auth - An app call from the dignitary authorizing the release.
   */
  emergencyWithdraw(goalId: uint64, auth: gtxn.ApplicationCallTxn): void {
    const boxKey = Txn.sender.bytes.concat(op.itob(goalId));
    assert(this.goals(boxKey).exists, 'Goal not found');

    const goal = { ...this.goals(boxKey).value };
    assert(goal.status !== STATUS_WITHDRAWN, 'Already withdrawn');

    // Verification: Atomic group must contain a call from the designated dignitary
    assert(auth.sender === goal.dignitary.native, 'Unauthorized dignitary');
    assert(auth.appId === Global.currentApplicationId, 'Invalid auth app');

    // Set 60-day penalty (60 * 24 * 3600 = 5,184,000 seconds)
    const penaltyDuration = 5184000 as uint64;
    this.penaltyUntil(Txn.sender).value = Global.latestTimestamp + penaltyDuration;

    const amountToSend = goal.currentBalance;
    assert(amountToSend > (0 as uint64), 'No funds to withdraw');

    const nameLen = op.len(Bytes(goal.name));
    const valueSize = (STRING_HEADER_BYTES + nameLen + FIXED_FIELDS_BYTES) as uint64;
    const mbrRefund = (BOX_MBR_BASE + BOX_MBR_PER_BYTE * (BOX_KEY_LEN + valueSize)) as uint64;

    this.goals(boxKey).delete();

    // Release USDC
    itxn.assetTransfer({
      xferAsset: this.usdcAsset.value,
      assetAmount: amountToSend,
      assetReceiver: Txn.sender,
      fee: 0 as uint64,
    }).submit();

    // Refund MBR
    itxn.payment({
      receiver: Txn.sender,
      amount: mbrRefund,
      fee: 0 as uint64,
    }).submit();
  }
}
