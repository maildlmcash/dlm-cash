# DLM Cash — Deposit & Withdrawal Workflow

## Overview

- **Per-user deposit wallet**: Each user gets a unique EVM address (generated at registration). This is a **deposit-only** address; funds are swept to the main pool.
- **Multi-chain**: Supported networks (e.g. Sepolia, BSC, Polygon) each have a token address; deposit detection and sweeps are per-network.
- **Internal (ledger) balance**: When a deposit is confirmed, the user is credited **internal USDT** (off-chain balance in DB). This is the “random USDT” / ledger balance.
- **Withdrawals**: User requests withdrawal → internal balance is debited → main pool sends on-chain USDT to the user’s destination address.

---

## 1. User wallet generation

- **Where**: `authController.register`
- **How**: `generateEvmWallet()` (from `evmWallet.ts`) creates address + private key. Address stored in `User.depositWalletAddress`, encrypted private key in `User.depositWalletPrivateKey`.
- **Usage**: Shown to user as “Your deposit address”; they send USDT (any supported chain) to this address.

---

## 2. Deposit detection & confirmation

Two paths:

### A. By transaction hash (RPC — no Etherscan delay)

- **When**: Client sends `POST /user/deposit-wallet/check` with body `{ txHash, network }` (e.g. right after MetaMask confirms).
- **Flow**: `checkDeposits` → `processTransferByTxHash(txHash, userId, depositWalletAddress, network)` in `blockchainMonitor.ts`.
- **Logic**: RPC `getTransactionReceipt(txHash)` → find ERC20 `Transfer` log to user’s deposit wallet → parse amount (with token decimals from contract) → build `TransferEvent` → `processTransfer(...)`.

### B. By explorer API (bulk / catch-up)

- **When**: Same endpoint without `txHash`, or scheduled `monitorAllDeposits()`.
- **Flow**: `monitorUserDeposits(userId, depositWalletAddress)` → for each active network, `fetchTokenTransfersFromExplorer(walletAddress, networkKey)` (Etherscan/BSCScan etc. `tokentx`) → filter incoming transfers → for each, `processTransfer(transfer, userId)`.

### processTransfer (shared)

- If `DepositWalletTransaction` already exists for `txHash`: update pending status; if status is CONFIRMED and not yet credited → `creditUserBalance(...)`.
- If new: create `DepositWalletTransaction` (with `network`, `tokenAddress`), mark pending as CONFIRMED; if amount &lt; 100 USDT → auto-credit via `creditUserBalance`; else status PENDING (admin approval).

---

## 3. Fund consolidation (sweep to main wallet)

- **Where**: `fundSweeper.ts` (Sepolia single-chain) and `fundSweeperMultiChain.ts` (multi-chain).
- **How**: For each user with a deposit wallet, read token balance on-chain; if above minimum, sign from user’s deposit wallet (decrypted key) and transfer token to the **pool contract** (main storage). Create `DepositWalletTransaction` with `credited: true` if not already created by monitor.
- **Result**: User’s deposit address does not hold funds long-term; funds sit in the pool contract.

---

## 4. Internal balance credit

- **Where**: `creditUserBalance(depositTxId, userId, amount)` in `blockchainMonitor.ts`.
- **Steps**: Apply platform fee → credit user’s USDT wallet (create if needed) with amount after fee → create `Transaction` (type DEPOSIT, `txId` = blockchain `txHash`) → mark `DepositWalletTransaction` as credited → write `BlockchainTransactionLog` (DEPOSIT_CREDIT) for reconciliation.

---

## 5. Withdrawal (user transfer)

- **Request**: User calls create withdrawal (amount, destination, network). Balance check on internal USDT (or ROI/SALARY/BREAKDOWN per wallet type).
- **Auto (e.g. &lt; 100 USDT)**: `withdrawFromPool(destination, amountAfterFee, network)` from pool contract → store `txHash` on withdrawal and transaction → log `BlockchainTransactionLog` (WITHDRAW_SEND).
- **Manual (e.g. ≥ 100 USDT)**: Withdrawal stays PENDING; admin approves → same pool withdrawal and logging.

---

## 6. Transaction ID logging & reconciliation

- **DepositWalletTransaction**: `txHash`, `network`, `tokenAddress`, `amount`, `credited`, `platformFee`.
- **Transaction**: `txId` = blockchain `txHash` for completed deposits/withdrawals.
- **BlockchainTransactionLog**: Every on-chain credit/send: `txHash`, `action` (DEPOSIT_CREDIT | WITHDRAW_SEND), `userId`, `amount`, `currency`, `network`, `relatedType`, `relatedId`. Use for audit and mapping external tx IDs to internal records.

---

## Apply DB migration

```bash
cd server && npx prisma migrate dev
```

This creates the `BlockchainTransactionLog` table if not already applied.
