# Blockchain Deposit Monitoring

This system automatically monitors and credits USDT deposits across multiple blockchain networks.

## How It Works

1. **User sends tUSDT** to their deposit wallet address (visible in the frontend)
2. **Scheduler runs every 2 minutes** (`*/2 * * * *`) to check for new transactions
3. **Blockchain explorer APIs** fetch incoming transactions for each user's deposit wallet
4. **Transactions are verified** and stored in `DepositWalletTransaction` table
5. **User's USDT wallet** is automatically credited with the deposit amount
6. **Transaction record** is created for audit trail

## Supported Networks

Currently configured for:
- **Sepolia Testnet** (for testing) - tUSDT at `0x379D44df8fd761B888693764EE83e38Fe2fAD988`
- **Ethereum Mainnet** - USDT at `0xdAC17F958D2ee523a2206206994597C13D831ec7`
- **BSC (Binance Smart Chain)** - USDT at `0x55d398326f99059fF775485246999027B3197955`
- **Polygon** - USDT at `0xc2132D05D31c914a87C6611C10748AEb04B58e8F`

## Setup

### 1. Get Blockchain Explorer API Keys

You need API keys from blockchain explorers to monitor transactions:

- **Etherscan** (for Ethereum & Sepolia): https://etherscan.io/apis
- **BscScan** (for BSC): https://bscscan.com/apis
- **PolygonScan** (for Polygon): https://polygonscan.com/apis

### 2. Configure Environment Variables

Add these to your `.env` file:

```bash
# Blockchain Explorer API Keys
ETHERSCAN_API_KEY=your-etherscan-api-key
BSCSCAN_API_KEY=your-bscscan-api-key
POLYGONSCAN_API_KEY=your-polygonscan-api-key

# Scheduler (optional - defaults to every 2 minutes)
BLOCKCHAIN_MONITORING_CRON=*/2 * * * *

# RPC URLs (optional - uses public nodes by default)
SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
ETHEREUM_RPC_URL=https://ethereum-rpc.publicnode.com
BSC_RPC_URL=https://bsc-rpc.publicnode.com
POLYGON_RPC_URL=https://polygon-bor-rpc.publicnode.com
```

### 3. Start the Server

The blockchain monitoring scheduler starts automatically when the server starts:

```bash
npm run dev
```

You should see:
```
⏰ Schedulers initialized (ROI, Salary, Blockchain Monitoring)
```

## API Endpoints

### User Endpoints

#### Check Deposits Manually
```http
POST /api/user/deposit-wallet/check
Authorization: Bearer <token>
```

Response:
```json
{
  "success": true,
  "message": "Successfully processed 2 new deposits",
  "data": {
    "processed": 2
  }
}
```

#### Get Deposit Transactions
```http
GET /api/user/deposit-wallet/transactions?page=1&limit=20
Authorization: Bearer <token>
```

Response:
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "uuid",
        "txHash": "0x...",
        "amount": "100.00",
        "tokenSymbol": "USDT",
        "blockTimestamp": "2025-12-21T10:00:00Z",
        "credited": true,
        "creditedAt": "2025-12-21T10:02:00Z"
      }
    ],
    "page": 1,
    "limit": 20,
    "total": 5
  }
}
```

### Admin Endpoints

#### Trigger Manual Blockchain Monitoring
```http
POST /api/admin/blockchain/monitor
Authorization: Bearer <token>
```

This manually triggers the blockchain monitoring for all users (useful for testing).

## Testing

### 1. Get Test ETH & tUSDT

For Sepolia testnet:
1. Get test ETH: https://sepoliafaucet.com/
2. Get your tUSDT contract at: `0x379D44df8fd761B888693764EE83e38Fe2fAD988`

### 2. Send Test Deposit

1. Connect your wallet to Sepolia testnet
2. Go to the Wallet page in the frontend
3. Click "Deposit tUSDT"
4. Use the "Direct Payment" tab
5. Enter amount and click "Send tUSDT Now"
6. Confirm transaction in MetaMask

### 3. Wait for Monitoring

The system will automatically detect your deposit within 2 minutes. You can also:
- Click "Check Now" button in the frontend
- Or call the manual check API endpoint

### 4. Verify Crediting

Check that:
1. Transaction appears in "Recent Deposits" with "✓ Credited" status
2. Your USDT wallet balance increased
3. A transaction record was created

## Database Schema

### DepositWalletTransaction
```prisma
model DepositWalletTransaction {
  id              String   @id @default(uuid())
  user            User     @relation(fields: [userId], references: [id])
  userId          String
  txHash          String   @unique
  fromAddress     String
  toAddress       String   // User's deposit wallet
  amount          Decimal  @db.Decimal(65,18)
  tokenSymbol     String   @default("USDT")
  blockNumber     BigInt
  blockTimestamp  DateTime
  status          String   @default("CONFIRMED")
  credited        Boolean  @default(false)
  creditedAt      DateTime?
  createdAt       DateTime @default(now())
}
```

## Architecture

```
Frontend (User)
    |
    | 1. Send tUSDT to deposit wallet
    ↓
Blockchain Network (Sepolia/Ethereum/BSC/Polygon)
    |
    | 2. Transaction confirmed
    ↓
Blockchain Explorer API
    |
    | 3. Scheduler fetches transactions (every 2 min)
    ↓
blockchainMonitor.ts
    |
    | 4. Verify and store transaction
    ↓
Database (DepositWalletTransaction)
    |
    | 5. Credit user's USDT wallet
    ↓
Wallet Balance Updated
    |
    | 6. Create transaction record
    ↓
Transaction History
```

## Files Modified/Created

### Backend
- `src/utils/blockchainMonitor.ts` - Core monitoring logic
- `src/schedulers/jobs/blockchainMonitoring.ts` - Scheduler job
- `src/schedulers/index.ts` - Added blockchain monitoring scheduler
- `src/controllers/walletController.ts` - Added checkDeposits endpoint
- `src/controllers/adminController.ts` - Added admin monitoring endpoint
- `src/routes/walletRoutes.ts` - Added /deposit-wallet/check route
- `src/routes/adminRoutes.ts` - Added /blockchain/monitor route

### Frontend
- `src/services/userApi.ts` - Added checkDeposits() method
- `src/components/user/Wallet.tsx` - Added deposit transaction display and check button

### Database
- `prisma/schema.prisma` - DepositWalletTransaction model (already existed)

## Troubleshooting

### Deposits not being detected

1. **Check API keys**: Make sure your blockchain explorer API keys are valid
2. **Check network**: Verify you're sending to the correct network (Sepolia for testing)
3. **Check token contract**: Ensure you're sending the correct token (tUSDT for Sepolia)
4. **Check scheduler**: Look for "🔄 Starting blockchain deposit check..." in logs
5. **Manual check**: Try clicking "Check Now" or calling the API manually

### Transactions found but not credited

1. **Check transaction status**: Must be "CONFIRMED" status
2. **Check database**: Look in `DepositWalletTransaction` table
3. **Check errors**: Look for error messages in console logs
4. **Check wallet**: Verify user has a USDT wallet created

### Performance Issues

- Default check interval: 2 minutes
- Adjust `BLOCKCHAIN_MONITORING_CRON` in .env to reduce frequency
- Consider implementing WebSocket monitoring for real-time updates

## Going to Mainnet

When ready to deploy to mainnet:

1. Update `.env` to use mainnet RPC URLs
2. Update contract addresses in `blockchainMonitor.ts` (already configured)
3. Update frontend `wagmi.ts` to use mainnet chains
4. Update frontend `Wallet.tsx` to show "USDT" instead of "tUSDT"
5. Test thoroughly on testnet first!

## Security Considerations

- API keys are stored in environment variables (never commit)
- Duplicate transactions are prevented by unique txHash
- Only incoming transfers to user's wallet are processed
- User wallet balances are updated in database transactions (atomic)
- Blockchain explorer APIs are rate-limited (typically 5 calls/second)
