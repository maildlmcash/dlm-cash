import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useSendTransaction, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { parseUnits, encodeFunctionData } from 'viem';
import { sepolia } from 'wagmi/chains';
import { QRCodeSVG } from 'qrcode.react';
import { IndianRupee, TrendingUp, Briefcase, Gift, Info, ArrowDownToLine, ArrowUpFromLine, RefreshCw } from 'lucide-react';
import { userApi } from '../../services/userApi';
import { showToast } from '../../utils/toast';
import LoadingSpinner from '../common/LoadingSpinner';
import AnimatedButton from '../common/AnimatedButton';
import AnimatedInput from '../common/AnimatedInput';
import GlassCard from '../common/GlassCard';

interface Wallet {
  id: string;
  type: string;
  balance: string;
  pending: string;
  currency: string;
  locked: boolean;
}

const Wallet = () => {
  const navigate = useNavigate();
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDepositPanel, setShowDepositPanel] = useState(false);
  const [showWithdrawPanel, setShowWithdrawPanel] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [activeModal, setActiveModal] = useState<'deposit-inr' | 'deposit-usdt' | 'withdraw-inr' | 'withdraw-usdt' | 'withdraw-roi' | 'withdraw-salary' | null>(null);
  const [processing, setProcessing] = useState(false);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [selectedBankAccount, setSelectedBankAccount] = useState<string>('');
  const [upiAccounts, setUpiAccounts] = useState<any[]>([]);
  const [selectedUpiAccount, setSelectedUpiAccount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'BANK' | 'UPI'>('BANK');
  const [transactionId, setTransactionId] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [depositThreshold, setDepositThreshold] = useState<number>(0);
  const [rejectedDeposits, setRejectedDeposits] = useState<any[]>([]);
  const [retryingDepositId, setRetryingDepositId] = useState<string | null>(null);
  const [currencyRate, setCurrencyRate] = useState<number>(83.0);
  const [depositWalletAddress, setDepositWalletAddress] = useState<string>('');
  const [showDepositWalletModal, setShowDepositWalletModal] = useState(false);
  const [depositTab, setDepositTab] = useState<'manual' | 'direct'>('manual');
  const [usdtDepositAmount, setUsdtDepositAmount] = useState<string>('');
  const [depositTransactions, setDepositTransactions] = useState<any[]>([]);
  const [checkingDeposits, setCheckingDeposits] = useState(false);
  const [userBankAccounts, setUserBankAccounts] = useState<any[]>([]);
  const [selectedUserBankAccount, setSelectedUserBankAccount] = useState<string>('');
  const [withdrawalAddress, setWithdrawalAddress] = useState('');
  const [platformFeeSettings, setPlatformFeeSettings] = useState({
    minDepositUSDT: 10,
    minWithdrawalUSDT: 10,
    depositFeePercent: 0,
    withdrawalFeePercent: 0,
  });
  const [pendingDepositsCount, setPendingDepositsCount] = useState<{ inr: number; usdt: number }>({
    inr: 0,
    usdt: 0,
  });
  const [pendingDepositsAmount, setPendingDepositsAmount] = useState<{ inr: number; usdt: number }>({
    inr: 0,
    usdt: 0,
  });
  const [pendingTransactions, setPendingTransactions] = useState<any[]>([]);
  const [directReferralIncome, setDirectReferralIncome] = useState<number>(0);
  const [roiFromInvestments, setRoiFromInvestments] = useState<number>(0);
  const [depositNetworks, setDepositNetworks] = useState<any[]>([]);
  const [withdrawNetworks, setWithdrawNetworks] = useState<any[]>([]);
  const [selectedDepositNetwork, setSelectedDepositNetwork] = useState<string>('SEPOLIA');
  const [selectedWithdrawNetwork, setSelectedWithdrawNetwork] = useState<string>('');
  const [redeemingWallet, setRedeemingWallet] = useState<string | null>(null);

  // tUSDT contract address
  const TUSDT_ADDRESS = '0x379D44df8fd761B888693764EE83e38Fe2fAD988' as const;

  // Wagmi hooks
  const { address, isConnected, chain } = useAccount();
  const { data: txHash, sendTransaction, isPending: isSending, error: txError } = useSendTransaction();
  const { isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // Read tUSDT decimals
  const { data: tokenDecimals } = useReadContract({
    address: TUSDT_ADDRESS,
    abi: [
      {
        name: 'decimals',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ type: 'uint8' }],
      },
    ],
    functionName: 'decimals',
    query: {
      enabled: isConnected && chain?.id === sepolia.id,
    },
  });

  // Read tUSDT balance
  const { refetch: refetchBalance } = useReadContract({
    address: TUSDT_ADDRESS,
    abi: [
      {
        name: 'balanceOf',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'account', type: 'address' }],
        outputs: [{ type: 'uint256' }],
      },
    ],
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: isConnected && !!address && chain?.id === sepolia.id,
    },
  });

  // Show transaction errors
  useEffect(() => {
    if (txError) {
      console.error('Transaction error details:', txError);
      showToast.error(txError.message || 'Transaction failed');
    }
  }, [txError]);

  // Track when user confirms transaction (txHash is generated)
  useEffect(() => {
    if (txHash && !isConfirmed && usdtDepositAmount) {
      const amount = parseFloat(usdtDepositAmount);
      if (amount > 0) {
        // Create pending transaction immediately when txHash is available
        console.log('📝 Creating pending transaction:', txHash);
        userApi.createPendingDeposit({
          txHash,
          amount,
          network: selectedDepositNetwork,
        }).then(response => {
          if (response.success) {
            console.log('✅ Pending transaction created');
            showToast.success('Transaction sent! Tracking your deposit...');
            loadPendingTransactions();
          }
        }).catch(error => {
          console.error('❌ Failed to create pending transaction:', error);
        });
      }
    }
  }, [txHash, isConfirmed, usdtDepositAmount]);

  // Load networks for deposit and withdrawal
  const loadNetworks = async () => {
    try {
      const depositResponse = await userApi.getDepositEnabledNetworks();
      if (depositResponse.success && depositResponse.data) {
        const networks = depositResponse.data as any[];
        setDepositNetworks(networks);
        if (networks.length > 0) {
          setSelectedDepositNetwork(networks[0].network);
        }
      }

      const withdrawResponse = await userApi.getWithdrawEnabledNetworks();
      if (withdrawResponse.success && withdrawResponse.data) {
        const networks = withdrawResponse.data as any[];
        setWithdrawNetworks(networks);
        if (networks.length > 0) {
          setSelectedWithdrawNetwork(networks[0].network);
        }
      }
    } catch (error) {
      console.error('Failed to load networks:', error);
    }
  };

  useEffect(() => {
    loadAllWallets();
    loadBankAccounts();
    loadUpiAccounts();
    loadDepositSettings();
    loadPlatformFeeSettings();
    loadRejectedDeposits();
    loadPendingDeposits();
    loadNetworks();
    loadCurrencyRate();
    loadDepositWallet();
    loadDepositTransactions();
    loadPendingTransactions();
    loadDirectReferralIncome();
  }, []);

  useEffect(() => {
    if (activeModal === 'withdraw-inr' || activeModal === 'withdraw-roi' || activeModal === 'withdraw-salary') {
      loadUserBankAccounts();
    }
  }, [activeModal]);

  useEffect(() => {
    if (isConfirmed && txHash) {
      // Transaction confirmed - reload pending transactions
      showToast.success('Deposit transaction confirmed! Your balance will be updated shortly.');
      setUsdtDepositAmount('');
      loadAllWallets();
      loadDepositTransactions();
      loadPendingTransactions();
      // Force reload to reset transaction state
      setTimeout(() => {
        refetchBalance();
      }, 2000);
    }
  }, [isConfirmed, txHash]);

  const loadAllWallets = async () => {
    try {
      setLoading(true);
      const walletTypes = ['INR', 'USDT', 'ROI', 'SALARY', 'BREAKDOWN'];
      const walletPromises = walletTypes.map(type => userApi.getWalletByType(type));
      const responses = await Promise.all(walletPromises);
      
      const loadedWallets = responses
        .map((response) => {
          if (response.success && response.data) {
            return response.data as Wallet;
          }
          return null;
        })
        .filter((w): w is Wallet => w !== null);
      
      setWallets(loadedWallets);
    } catch (error) {
      showToast.error('Failed to load wallets');
    } finally {
      setLoading(false);
    }
  };

  const loadBankAccounts = async () => {
    try {
      const response = await userApi.getActiveBankAccounts();
      if (response.success && response.data) {
        setBankAccounts(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error('Error loading bank accounts:', error);
    }
  };

  const loadUpiAccounts = async () => {
    try {
      const response = await userApi.getActiveUpiAccounts();
      if (response.success && response.data) {
        setUpiAccounts(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error('Error loading UPI accounts:', error);
    }
  };

  const loadUserBankAccounts = async () => {
    try {
      const response = await userApi.getUserBankAccounts();
      if (response.success && response.data) {
        setUserBankAccounts(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error('Error loading user bank accounts:', error);
    }
  };

  const loadDepositSettings = async () => {
    try {
      const response = await userApi.getDepositSettings();
      if (response.success && response.data) {
        setDepositThreshold((response.data as any).autoCreditThreshold || 0);
      }
    } catch (error) {
      console.error('Error loading deposit settings:', error);
    }
  };

  const loadPlatformFeeSettings = async () => {
    try {
      const response = await userApi.getPlatformFeeSettings();
      if (response.success && response.data) {
        const data = response.data as any;
        setPlatformFeeSettings({
          minDepositUSDT: data.minDepositUSDT || 10,
          minWithdrawalUSDT: data.minWithdrawalUSDT || 10,
          depositFeePercent: data.depositFeePercent || 0,
          withdrawalFeePercent: data.withdrawalFeePercent || 0,
        });
      }
    } catch (error) {
      console.error('Error loading platform fee settings:', error);
    }
  };

  const loadRejectedDeposits = async () => {
    try {
      const response = await userApi.getDeposits({ status: 'REJECTED', limit: 10 });
      if (response.success && response.data) {
        const data = response.data as any;
        const deposits = Array.isArray(data) ? data : data.data || [];
        const retryableDeposits = deposits.filter((d: any) => (d.rejectionCount || 0) < 2);
        setRejectedDeposits(retryableDeposits);
      }
    } catch (error) {
      console.error('Error loading rejected deposits:', error);
    }
  };

  const loadDirectReferralIncome = async () => {
    try {
      // Load dashboard stats for direct referral income
      const dashboardResponse = await userApi.getDashboardStats();
      if (dashboardResponse.success && dashboardResponse.data) {
        const data = dashboardResponse.data as any;
        setDirectReferralIncome(parseFloat(data.directReferralIncome || '0'));
      }

      // Load ROI income data for accurate total ROI earned
      const roiResponse = await userApi.getROIIncome({ page: 1, limit: 1, type: 'ROI' });
      if (roiResponse.success && roiResponse.data) {
        const roiData = roiResponse.data as any;
        setRoiFromInvestments(parseFloat(roiData.totals?.roi || '0'));
      }
    } catch (error) {
      console.error('Error loading direct referral income:', error);
    }
  };

  const loadPendingDeposits = async () => {
    try {
      const response = await userApi.getDeposits({ status: 'PENDING', limit: 100 });
      if (response.success && response.data) {
        const data = response.data as any;
        const deposits = Array.isArray(data) ? data : data.data || [];
        
        // Count and sum pending deposits by currency
        const inrDeposits = deposits.filter((d: any) => d.currency === 'INR');
        const usdtDeposits = deposits.filter((d: any) => d.currency === 'USDT');
        
        const inrAmount = inrDeposits.reduce((sum: number, d: any) => sum + parseFloat(d.amount || '0'), 0);
        const usdtAmount = usdtDeposits.reduce((sum: number, d: any) => sum + parseFloat(d.amount || '0'), 0);
        
        setPendingDepositsCount({
          inr: inrDeposits.length,
          usdt: usdtDeposits.length,
        });
        
        setPendingDepositsAmount({
          inr: inrAmount,
          usdt: usdtAmount,
        });
      }
    } catch (error) {
      console.error('Error loading pending deposits:', error);
    }
  };

  const loadCurrencyRate = async () => {
    try {
      const response = await userApi.getCurrencyRate();
      if (response.success && response.data) {
        const rate = (response.data as any).rate;
        if (rate) {
          setCurrencyRate(parseFloat(rate));
        }
      }
    } catch (error) {
      console.error('Error loading currency rate:', error);
    }
  };

  const loadDepositWallet = async () => {
    try {
      const response = await userApi.getDepositWallet();
      if (response.success && response.data) {
        const data = response.data as any;
        setDepositWalletAddress(data.address || '');
      }
    } catch (error) {
      console.error('Error loading deposit wallet:', error);
    }
  };

  const loadDepositTransactions = async () => {
    try {
      const response = await userApi.getDepositWalletTransactions({ limit: 5 });
      if (response.success && response.data) {
        const data = response.data as any;
        setDepositTransactions(data.data || []);
      }
    } catch (error) {
      console.error('Error loading deposit transactions:', error);
    }
  };

  const loadPendingTransactions = async () => {
    try {
      const response = await userApi.getPendingDeposits();
      if (response.success && response.data) {
        setPendingTransactions(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error('Error loading pending transactions:', error);
    }
  };

  // Helper function to calculate deposit amounts with fees
  const calculateDepositAmounts = (enteredAmount: number) => {
    const fee = (enteredAmount * platformFeeSettings.depositFeePercent) / 100;
    const amountToBeCredited = enteredAmount - fee;
    return { fee, amountToBeCredited };
  };

  // Helper function to calculate withdrawal amounts with fees
  const calculateWithdrawalAmounts = (requestedAmount: number) => {
    const fee = (requestedAmount * platformFeeSettings.withdrawalFeePercent) / 100;
    const amountToReceive = requestedAmount - fee;
    return { fee, amountToReceive };
  };

  // Get minimum deposit in INR based on USDT setting
  const getMinDepositINR = () => {
    return platformFeeSettings.minDepositUSDT * currencyRate;
  };

  // Get minimum withdrawal in INR based on USDT setting
  const getMinWithdrawalINR = () => {
    return platformFeeSettings.minWithdrawalUSDT * currencyRate;
  };

  const handleCheckDeposits = async () => {
    setCheckingDeposits(true);
    try {
      const response = await userApi.checkDeposits();
      if (response.success) {
        showToast.success(response.message || 'Deposits checked successfully');
        // Reload wallet balances and transactions
        await loadAllWallets();
        await loadDepositTransactions();
      } else {
        showToast.error(response.error || 'Failed to check deposits');
      }
    } catch (error) {
      showToast.error('An error occurred while checking deposits');
    } finally {
      setCheckingDeposits(false);
    }
  };

  const handleWalletDeposit = async () => {
    if (!usdtDepositAmount || parseFloat(usdtDepositAmount) <= 0) {
      showToast.error('Please enter a valid amount');
      return;
    }

    const depositAmt = parseFloat(usdtDepositAmount);

    // Check minimum deposit
    if (depositAmt < platformFeeSettings.minDepositUSDT) {
      showToast.error(`Minimum deposit amount is ${platformFeeSettings.minDepositUSDT} USDT`);
      return;
    }

    if (!depositWalletAddress) {
      showToast.error('Deposit wallet address not loaded');
      return;
    }

    if (!isConnected || !address) {
      showToast.error('Please connect your wallet first');
      return;
    }

    try {
      // Calculate platform fee (will be deducted by backend from received amount)
      const depositFee = (depositAmt * platformFeeSettings.depositFeePercent) / 100;
      const amountAfterFee = depositAmt - depositFee;

      // Use token decimals from contract, fallback to 6 for custom tUSDT
      const decimals = Number(tokenDecimals ?? 6);
      const amount = parseUnits(depositAmt.toFixed(decimals), decimals);

      console.log('🔍 Transaction Details:');
      console.log('  Decimals:', decimals);
      console.log('  Deposit Amount:', depositAmt);
      console.log('  Platform Fee (will be deducted):', depositFee);
      console.log('  Amount you will receive:', amountAfterFee);
      console.log('  Amount to send (base units):', amount.toString());

      // Encode transfer function call
      const transferData = encodeFunctionData({
        abi: [{
          name: 'transfer',
          type: 'function',
          stateMutability: 'nonpayable',
          inputs: [
            { name: 'to', type: 'address' },
            { name: 'amount', type: 'uint256' }
          ],
          outputs: [{ type: 'bool' }]
        }],
        functionName: 'transfer',
        args: [depositWalletAddress as `0x${string}`, amount]
      });

      // Send transaction via MetaMask
      sendTransaction({
        to: TUSDT_ADDRESS,
        data: transferData,
      });
    } catch (error: any) {
      console.error('Transaction error:', error);
      showToast.error(error?.message || 'Failed to send transaction');
    }
  };

  const getWalletByType = (type: string): Wallet | undefined => {
    return wallets.find(w => w.type === type);
  };

  const getTotalBalance = (): number => {
    const walletBalance = wallets
      .filter(w => w.type !== 'BREAKDOWN')
      .reduce((sum, w) => {
        const balance = parseFloat(w.balance || '0');
        // Convert USDT to INR using current rate
        if (w.type === 'USDT') {
          return sum + (balance * currencyRate);
        }
        return sum + balance;
      }, 0);
    
    // Add direct referral income (in USDT) converted to INR
    const directReferralInINR = directReferralIncome * currencyRate;
    
    return walletBalance + directReferralInINR;
  };

  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      showToast.error('Please enter a valid amount');
      return;
    }

    const amount = parseFloat(depositAmount);
    const isINR = activeModal === 'deposit-inr';
    const isUSDT = activeModal === 'deposit-usdt';

    // Check minimum deposit amounts
    if (isINR) {
      const minDepositINR = getMinDepositINR();
      if (amount < minDepositINR) {
        showToast.error(`Minimum deposit amount is ₹${minDepositINR.toFixed(2)}`);
        return;
      }
    }

    if (isINR) {
      if (paymentMethod === 'BANK') {
        if (!selectedBankAccount) {
          showToast.error('Please select a bank account');
          return;
        }
        
        if (depositThreshold > 0 && amount >= depositThreshold) {
          if (!transactionId || !screenshot) {
            showToast.error('Transaction ID and payment screenshot are required for deposits above threshold');
            return;
          }
        }
      } else if (paymentMethod === 'UPI') {
        if (!selectedUpiAccount) {
          showToast.error('Please select a UPI account');
          return;
        }
        if (amount > 100000) {
          showToast.error('UPI payment maximum amount is ₹1,00,000');
          return;
        }
        if (!transactionId && !screenshot) {
          showToast.error('Please provide either transaction ID or payment screenshot');
          return;
        }
      }
    }

    setProcessing(true);
    try {
      const formData = new FormData();
      formData.append('amount', depositAmount);
      formData.append('currency', isINR ? 'INR' : 'USDT');
      formData.append('method', isUSDT ? 'BLOCKCHAIN' : 'MANUAL');
      
      if (retryingDepositId) {
        formData.append('depositId', retryingDepositId);
      }
      
      if (isINR) {
        formData.append('paymentMethod', paymentMethod);
        
        if (paymentMethod === 'BANK' && selectedBankAccount) {
          formData.append('bankAccountId', selectedBankAccount);
        } else if (paymentMethod === 'UPI' && selectedUpiAccount) {
          formData.append('upiAccountId', selectedUpiAccount);
        }
      }
      
      if (transactionId) {
        formData.append('txId', transactionId);
      }
      
      if (screenshot) {
        formData.append('proof', screenshot);
      }

      const response = await userApi.createDeposit(formData);

      if (response.success) {
        showToast.success('Deposit request created successfully');
        closeModal();
        loadAllWallets();
        loadRejectedDeposits();
        loadPendingDeposits();
      } else {
        showToast.error(response.error || 'Failed to create deposit');
      }
    } catch (error) {
      showToast.error('An error occurred');
    } finally {
      setProcessing(false);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      showToast.error('Please enter a valid amount');
      return;
    }

    const amount = parseFloat(withdrawAmount);

    let walletType: string;
    let currency: string;
    let method: string;

    switch (activeModal) {
      case 'withdraw-inr':
        walletType = 'INR';
        currency = 'INR';
        method = 'BANK';
        break;
      case 'withdraw-usdt':
        walletType = 'USDT';
        currency = 'USDT';
        method = 'TRC20';
        break;
      case 'withdraw-roi':
        walletType = 'ROI';
        currency = 'INR';
        method = 'BANK';
        break;
      case 'withdraw-salary':
        walletType = 'SALARY';
        currency = 'INR';
        method = 'BANK';
        break;
      default:
        return;
    }

    // Check minimum withdrawal amounts
    if (currency === 'USDT') {
      if (amount < platformFeeSettings.minWithdrawalUSDT) {
        showToast.error(`Minimum withdrawal amount is ${platformFeeSettings.minWithdrawalUSDT} USDT`);
        return;
      }
    } else if (currency === 'INR') {
      const minWithdrawalINR = getMinWithdrawalINR();
      if (amount < minWithdrawalINR) {
        showToast.error(`Minimum withdrawal amount is ₹${minWithdrawalINR.toFixed(2)}`);
        return;
      }
    }

    // Validate bank details for INR withdrawals
    if (method === 'BANK') {
      if (!selectedUserBankAccount) {
        showToast.error('Please select a bank account');
        return;
      }
    }

    // Validate withdrawal address for USDT
    if (currency === 'USDT') {
      if (!withdrawalAddress) {
        showToast.error('Please enter a withdrawal address');
        return;
      }
      // Basic Ethereum address validation
      if (!/^0x[a-fA-F0-9]{40}$/.test(withdrawalAddress)) {
        showToast.error('Invalid Ethereum address format');
        return;
      }
    }

    setProcessing(true);
    try {
      // Get selected bank account details if INR withdrawal
      let bankDetails = undefined;
      if (method === 'BANK' && selectedUserBankAccount) {
        const selectedAccount = userBankAccounts.find(acc => acc.id === selectedUserBankAccount);
        if (selectedAccount) {
          bankDetails = {
            accountName: selectedAccount.accountName,
            accountNumber: selectedAccount.accountNumber,
            ifscCode: selectedAccount.ifscCode,
            bankName: selectedAccount.bankName,
            branchName: selectedAccount.branchName || '',
          };
        }
      }

      const response = await userApi.createWithdrawal({
        amount: parseFloat(withdrawAmount),
        currency,
        method,
        walletType: ['ROI', 'SALARY'].includes(walletType) ? walletType : undefined,
        destination: method === 'BANK' && bankDetails ? JSON.stringify(bankDetails) : undefined,
        bankDetails: method === 'BANK' ? bankDetails : undefined,
        withdrawalAddress: currency === 'USDT' ? withdrawalAddress : undefined,
        network: currency === 'USDT' ? selectedWithdrawNetwork : undefined,
      });

      if (response.success) {
        showToast.success(response.message || 'Withdrawal request created successfully');
        closeModal();
        loadAllWallets();
      } else {
        showToast.error(response.error || 'Failed to create withdrawal');
      }
    } catch (error) {
      showToast.error('An error occurred');
    } finally {
      setProcessing(false);
    }
  };

  const closeModal = () => {
    setActiveModal(null);
    setDepositAmount('');
    setWithdrawAmount('');
    setPaymentMethod('BANK');
    setSelectedBankAccount('');
    setSelectedUpiAccount('');
    setTransactionId('');
    setScreenshot(null);
    setRetryingDepositId(null);
    setWithdrawalAddress('');
    setSelectedUserBankAccount('');
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const formatCurrency = (amount: string | number, currency: string = 'INR') => {
    const num = typeof amount === 'string' ? parseFloat(amount || '0') : amount;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency === 'USDT' ? 'USD' : 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const handleRedeem = async (walletType: 'ROI' | 'SALARY' | 'BREAKDOWN', amount: number) => {
    if (amount <= 0) {
      showToast.error('No funds available to redeem');
      return;
    }

    setRedeemingWallet(walletType);
    try {
      const response = await userApi.redeemToUSDT({
        fromWalletType: walletType,
        amount,
      });

      if (response.success) {
        showToast.success(response.message || 'Funds redeemed successfully to USDT wallet');
        await loadAllWallets();
        await loadDirectReferralIncome();
      } else {
        showToast.error(response.error || 'Failed to redeem funds');
      }
    } catch (error) {
      showToast.error('An error occurred while redeeming funds');
    } finally {
      setRedeemingWallet(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const inrWallet = getWalletByType('INR');
  const usdtWallet = getWalletByType('USDT');
  const roiWallet = getWalletByType('ROI');
  const salaryWallet = getWalletByType('SALARY');
  const breakdownWallet = getWalletByType('BREAKDOWN');
  const totalBalance = getTotalBalance();

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-3"
      >
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1">
            My Wallets
          </h1>
          <p className="text-gray-600 text-xs sm:text-sm">Manage your account balances and transactions</p>
        </div>
        <div className="flex items-center gap-4">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl px-5 py-2.5 shadow-sm flex items-center justify-center h-[42px]"
          >
            <div className="text-center">
              <p className="text-xs text-gray-600 font-medium uppercase tracking-wider mb-0.5">Current Rate</p>
              <div className="flex items-center gap-1.5 justify-center">
                <span className="text-base font-bold text-gray-900">₹{currencyRate.toFixed(2)}</span>
                <span className="text-xs text-gray-600">/USDT</span>
              </div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="h-[42px]"
          >
            <ConnectButton />
          </motion.div>
        </div>
      </motion.div>

      {/* Rejected Deposits Section */}
      {rejectedDeposits.length > 0 && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <GlassCard className="border-red-200 bg-red-50">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span>⚠️</span>
              <span>Rejected Deposits - Retry Available</span>
            </h3>
            <div className="space-y-3">
              {rejectedDeposits.map((deposit, index) => (
                <motion.div
                  key={deposit.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  className="bg-white rounded-xl p-4 border border-red-200"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-gray-900 font-semibold text-lg">
                        {formatCurrency(deposit.amount, deposit.currency)}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        Rejected {new Date(deposit.updatedAt || deposit.createdAt).toLocaleDateString()}
                      </p>
                      {deposit.rejectionCount > 0 && (
                        <p className="text-xs text-orange-600 mt-1">
                          Rejection count: {deposit.rejectionCount}/2
                        </p>
                      )}
                    </div>
                    <AnimatedButton
                      onClick={() => {
                        setRetryingDepositId(deposit.id);
                        setDepositAmount(deposit.amount);
                        setSelectedBankAccount(deposit.bankAccountId || '');
                        setTransactionId(deposit.txId || '');
                        setActiveModal('deposit-inr');
                      }}
                      size="sm"
                    >
                      Retry Deposit
                    </AnimatedButton>
                  </div>
                </motion.div>
              ))}
            </div>
          </GlassCard>
        </motion.div>
      )}

      {/* Total Balance Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <GlassCard className="bg-gradient-to-br from-blue-50 via-purple-50 to-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-2 font-medium uppercase tracking-wider">Total Account Balance</p>
              <motion.h2
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="text-5xl font-bold text-gray-900"
              >
                {formatCurrency(totalBalance, 'INR')}
              </motion.h2>
              <p className="text-xs text-gray-500 mt-2">Excluding breakdown wallet</p>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-3">
              <AnimatedButton
                onClick={() => setShowDepositPanel(true)}
                variant="primary"
                size="md"
                className="font-bold"
              >
                <ArrowDownToLine className="w-4 h-4 mr-2 inline" />
                Deposit
              </AnimatedButton>
              <AnimatedButton
                onClick={() => setShowWithdrawPanel(true)}
                variant="secondary"
                size="md"
                className="font-bold"
              >
                <ArrowUpFromLine className="w-4 h-4 mr-2 inline" />
                Withdraw
              </AnimatedButton>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Wallet Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <GlassCard>
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Wallet Summary</h3>
          <div className="space-y-4">
            {/* INR Wallet */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <IndianRupee className="w-6 h-6 text-yellow-700" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-gray-600 font-medium">INR Deposited</p>
                    
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(inrWallet?.balance || '0', 'INR')}
                  </p>
                </div>
              </div>
              {(pendingDepositsAmount.inr > 0 || (inrWallet && parseFloat(inrWallet.pending) > 0)) && (
                <div className="flex items-center gap-6">
                  {pendingDepositsAmount.inr > 0 && (
                    <div className="text-right">
                      <p className="text-xs text-gray-600">Pending Deposits</p>
                      <p className="text-sm font-semibold text-green-600">
                        {formatCurrency(pendingDepositsAmount.inr.toString(), 'INR')}
                      </p>
                    </div>
                  )}
                  {inrWallet && parseFloat(inrWallet.pending) > 0 && (
                    <div className="text-right">
                      <p className="text-xs text-gray-600">Pending Withdrawals</p>
                      <p className="text-sm font-semibold text-orange-600">
                        {formatCurrency(inrWallet.pending, 'INR')}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>

            {/* USDT Wallet */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.45 }}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center p-2">
                  <img src="https://cryptologos.cc/logos/tether-usdt-logo.svg?v=040" alt="USDT" className="w-8 h-8" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-gray-600 font-medium">tUSDT Deposited (Testnet)</p>
                    {pendingDepositsCount.usdt > 0 && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        {pendingDepositsCount.usdt} pending
                      </span>
                    )}
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(usdtWallet?.balance || '0', 'USDT')}
                  </p>
                </div>
              </div>
              {((pendingTransactions.length > 0 || pendingDepositsAmount.usdt > 0) || (usdtWallet && parseFloat(usdtWallet.pending) > 0)) && (
                <div className="flex items-center gap-6">
                  {(pendingTransactions.length > 0 || pendingDepositsAmount.usdt > 0) && (
                    <div className="text-right">
                      <p className="text-xs text-gray-600">Pending Deposits</p>
                      <p className="text-sm font-semibold text-green-600">
                        {formatCurrency(
                          (
                            pendingTransactions.reduce((sum, tx) => sum + parseFloat(tx.amount || '0'), 0) +
                            pendingDepositsAmount.usdt
                          ).toString(),
                          'USDT'
                        )}
                      </p>
                    </div>
                  )}
                  {usdtWallet && parseFloat(usdtWallet.pending) > 0 && (
                    <div className="text-right">
                      <p className="text-xs text-gray-600">Pending Withdrawals</p>
                      <p className="text-sm font-semibold text-orange-600">
                        {formatCurrency(usdtWallet.pending, 'USDT')}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>

            {/* ROI Wallet */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-700" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">ROI Wallet (USDT)</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency((roiWallet?.balance || '0'), 'USDT')}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Total Earned: {formatCurrency(roiFromInvestments.toString(), 'USDT')}</p>
                </div>
              </div>
              {roiWallet && parseFloat(roiWallet.balance) > 0 && (
                <AnimatedButton
                  onClick={() => handleRedeem('ROI', parseFloat(roiWallet.balance))}
                  disabled={redeemingWallet === 'ROI'}
                  size="sm"
                  className="whitespace-nowrap"
                >
                  {redeemingWallet === 'ROI' ? 'Redeeming...' : '💰 Redeem'}
                </AnimatedButton>
              )}
            </motion.div>

            {/* Salary Wallet */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.55 }}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-blue-700" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Salary Wallet (USDT)</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(salaryWallet?.balance || '0', 'USDT')}
                  </p>
                </div>
              </div>
              {salaryWallet && parseFloat(salaryWallet.balance) > 0 && (
                <AnimatedButton
                  onClick={() => handleRedeem('SALARY', parseFloat(salaryWallet.balance))}
                  disabled={redeemingWallet === 'SALARY'}
                  size="sm"
                  className="whitespace-nowrap"
                >
                  {redeemingWallet === 'SALARY' ? 'Redeeming...' : '💰 Redeem'}
                </AnimatedButton>
              )}
            </motion.div>

            {/* Direct Referral Income */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Gift className="w-6 h-6 text-purple-700" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Direct Referral Income</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(directReferralIncome.toString(), 'USDT')}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    ≈ {formatCurrency((directReferralIncome * currencyRate).toString(), 'INR')}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Breakdown Wallet */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.65 }}
              className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border border-orange-200"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <RefreshCw className="w-6 h-6 text-orange-700" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Breakdown Wallet (USDT)</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(breakdownWallet?.balance || '0', 'USDT')}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Early termination payouts (80% of investment)
                  </p>
                </div>
              </div>
              {breakdownWallet && parseFloat(breakdownWallet.balance) > 0 && (
                <AnimatedButton
                  onClick={() => handleRedeem('BREAKDOWN', parseFloat(breakdownWallet.balance))}
                  disabled={redeemingWallet === 'BREAKDOWN'}
                  size="sm"
                  className="whitespace-nowrap"
                >
                  {redeemingWallet === 'BREAKDOWN' ? 'Redeeming...' : '💰 Redeem'}
                </AnimatedButton>
              )}
            </motion.div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Deposit Side Panel */}
      <AnimatePresence>
        {showDepositPanel && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 z-[60]"
              onClick={() => setShowDepositPanel(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed right-0 top-0 h-full w-full sm:w-96 bg-white shadow-2xl z-[70] overflow-y-auto"
            >
              <div className="p-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
                <h2 className="text-lg font-bold text-gray-900">Deposit</h2>
                <button
                  onClick={() => setShowDepositPanel(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
              <div className="p-4 space-y-3">
                <button
                  onClick={() => {
                    setShowDepositPanel(false);
                    setActiveModal('deposit-inr');
                  }}
                  className="w-full text-left p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all border border-gray-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                      <IndianRupee className="w-5 h-5 text-yellow-700" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Deposit with INR</div>
                      <div className="text-sm text-gray-500">Deposit using bank transfer or UPI</div>
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => {
                    setShowDepositPanel(false);
                    setShowDepositWalletModal(true);
                  }}
                  className="w-full text-left p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all border border-gray-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center p-1.5">
                      <img src="https://cryptologos.cc/logos/tether-usdt-logo.svg?v=040" alt="USDT" className="w-full h-full" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Deposit Crypto</div>
                      <div className="text-sm text-gray-500">Deposit tUSDT via blockchain</div>
                    </div>
                  </div>
                </button>
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Info className="w-5 h-5 text-blue-700" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 mb-1">Deposit Instructions</div>
                      <div className="text-sm text-gray-600">Choose INR for bank/UPI deposits or Crypto for blockchain deposits. Minimum deposit: ₹{getMinDepositINR().toFixed(0)}</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Withdraw Side Panel */}
      <AnimatePresence>
        {showWithdrawPanel && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 z-[60]"
              onClick={() => setShowWithdrawPanel(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed right-0 top-0 h-full w-full sm:w-96 bg-white shadow-2xl z-[70] overflow-y-auto"
            >
              <div className="p-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
                <h2 className="text-lg font-bold text-gray-900">Withdraw</h2>
                <button
                  onClick={() => setShowWithdrawPanel(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
              <div className="p-4 space-y-3">
                <button
                  onClick={() => {
                    setShowWithdrawPanel(false);
                    setActiveModal('withdraw-inr');
                  }}
                  disabled={!inrWallet || parseFloat(inrWallet.balance) === 0 || inrWallet.locked}
                  className="w-full text-left p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                      <IndianRupee className="w-5 h-5 text-yellow-700" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Withdraw INR</div>
                      <div className="text-sm text-gray-500">Withdraw to your bank account</div>
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => {
                    setShowWithdrawPanel(false);
                    setActiveModal('withdraw-usdt');
                  }}
                  disabled={!usdtWallet || parseFloat(usdtWallet.balance) === 0 || usdtWallet.locked}
                  className="w-full text-left p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center p-1.5">
                      <img src="https://cryptologos.cc/logos/tether-usdt-logo.svg?v=040" alt="USDT" className="w-full h-full" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Withdraw tUSDT</div>
                      <div className="text-sm text-gray-500">Withdraw to blockchain address</div>
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => {
                    setShowWithdrawPanel(false);
                    setActiveModal('withdraw-roi');
                  }}
                  disabled={!roiWallet || parseFloat(roiWallet.balance) === 0 || roiWallet.locked}
                  className="w-full text-left p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-purple-700" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Withdraw ROI</div>
                      <div className="text-sm text-gray-500">Withdraw your ROI earnings</div>
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => {
                    setShowWithdrawPanel(false);
                    setActiveModal('withdraw-salary');
                  }}
                  disabled={!salaryWallet || parseFloat(salaryWallet.balance) === 0 || salaryWallet.locked}
                  className="w-full text-left p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Briefcase className="w-5 h-5 text-blue-700" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Withdraw Salary</div>
                      <div className="text-sm text-gray-500">Withdraw your salary income</div>
                    </div>
                  </div>
                </button>
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Info className="w-5 h-5 text-blue-700" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 mb-1">Withdrawal Info</div>
                      <div className="text-sm text-gray-600">Choose your withdrawal method. Minimum withdrawal: ₹{getMinWithdrawalINR().toFixed(0)}</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Deposit Modal */}
      <AnimatePresence>
        {(activeModal === 'deposit-inr' || activeModal === 'deposit-usdt') && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                closeModal();
              }
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="bg-white backdrop-blur-xl border-2 border-gray-200 rounded-2xl shadow-2xl w-[90%] sm:w-[85%] md:w-[75%] lg:w-[500px] xl:w-[550px] 2xl:w-[600px] max-h-[85vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-white backdrop-blur-xl border-b border-gray-200 px-6 py-4 rounded-t-2xl z-10">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-gray-900">
                    {retryingDepositId ? '🔄 Retry Deposit' : `💰 Deposit ${activeModal === 'deposit-inr' ? 'INR' : 'USDT'}`}
                  </h3>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={closeModal}
                    className="text-gray-600 hover:text-gray-900 transition-colors text-2xl leading-none w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100"
                  >
                    ×
                  </motion.button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-5">
                {retryingDepositId && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-warning/20 border border-warning/50 rounded-xl p-4"
                  >
                    <p className="text-sm text-warning flex items-center gap-2">
                      <span>⚠️</span>
                      <span>Please update transaction ID and payment screenshot for this deposit.</span>
                    </p>
                  </motion.div>
                )}

                {activeModal === 'deposit-inr' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        💳 Payment Method <span className="text-red-600">*</span>
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setPaymentMethod('BANK');
                            setSelectedUpiAccount('');
                          }}
                          className={`px-4 py-3 rounded-xl border-2 transition-all ${
                            paymentMethod === 'BANK'
                              ? 'border-blue-500 bg-blue-50 text-blue-700 font-semibold'
                              : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                          }`}
                        >
                          🏦 Bank Transfer
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPaymentMethod('UPI');
                            setSelectedBankAccount('');
                          }}
                          className={`px-4 py-3 rounded-xl border-2 transition-all ${
                            paymentMethod === 'UPI'
                              ? 'border-blue-500 bg-blue-50 text-blue-700 font-semibold'
                              : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                          }`}
                        >
                          📱 UPI
                        </button>
                      </div>
                    </div>
                  </>
                )}
                
                <AnimatedInput
                  label="💵 Amount"
                  type="number"
                  value={depositAmount}
                  onChange={(e) => {
                    setDepositAmount(e.target.value);
                    const amount = parseFloat(e.target.value) || 0;
                    if (depositThreshold > 0 && amount < depositThreshold) {
                      setTransactionId('');
                      setScreenshot(null);
                    }
                  }}
                  placeholder="Enter amount"
                />

                {/* UPI Amount Limit Error */}
                {activeModal === 'deposit-inr' && paymentMethod === 'UPI' && depositAmount && parseFloat(depositAmount) > 100000 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 border border-red-200 rounded-xl p-4"
                  >
                    <p className="text-sm text-red-700 flex items-center gap-2">
                      <span>⚠️</span>
                      <span className="font-semibold">UPI payment maximum amount is ₹1,00,000</span>
                    </p>
                  </motion.div>
                )}

                {/* Fee Calculation Display for INR Deposits */}
                {activeModal === 'deposit-inr' && depositAmount && parseFloat(depositAmount) > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2"
                  >
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700">Amount Paid:</span>
                      <span className="font-semibold text-gray-900">₹{parseFloat(depositAmount).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700">Platform Fee ({platformFeeSettings.depositFeePercent}%):</span>
                      <span className="font-semibold text-red-600">- ₹{calculateDepositAmounts(parseFloat(depositAmount)).fee.toFixed(2)}</span>
                    </div>
                    <div className="border-t border-blue-300 pt-2 flex justify-between">
                      <span className="text-gray-900 font-semibold">Amount to be Credited:</span>
                      <span className="font-bold text-green-600 text-lg">₹{calculateDepositAmounts(parseFloat(depositAmount)).amountToBeCredited.toFixed(2)}</span>
                    </div>
                  </motion.div>
                )}

                {activeModal === 'deposit-inr' && paymentMethod === 'BANK' && bankAccounts.length > 0 && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        🏦 Select Bank Account <span className="text-red-600">*</span>
                      </label>
                      <select
                        value={selectedBankAccount}
                        onChange={(e) => setSelectedBankAccount(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer"
                      >
                        <option value="">Select a bank account</option>
                        {bankAccounts.map((account) => (
                          <option key={account.id} value={account.id}>
                            {account.accountName} - {account.accountNumber} ({account.bankName})
                          </option>
                        ))}
                      </select>
                    </div>

                    {selectedBankAccount && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-200">
                      
                        <h4 className="text-sm font-semibold text-blue-600 mb-3 flex items-center gap-2">
                          <span>📋</span>
                          <span>Bank Account Details</span>
                        </h4>
                        {(() => {
                          const account = bankAccounts.find((a) => a.id === selectedBankAccount);
                          return account ? (
                            <div className="text-sm text-gray-900 space-y-2">
                              <p><span className="text-gray-600">Account Name:</span> {account.accountName}</p>
                              <p><span className="text-gray-600">Account Number:</span> {account.accountNumber}</p>
                              <p><span className="text-gray-600">IFSC:</span> {account.ifscCode}</p>
                              <p><span className="text-gray-600">Bank:</span> {account.bankName}</p>
                              {account.branchName && <p><span className="text-gray-600">Branch:</span> {account.branchName}</p>}
                              {account.upiId && <p><span className="text-gray-600">UPI ID:</span> {account.upiId}</p>}
                            </div>
                          ) : null;
                        })()}
                      </motion.div>
                    )}

                    {selectedBankAccount && (() => {
                      const amount = parseFloat(depositAmount) || 0;
                      const requiresVerification = depositThreshold > 0 && amount >= depositThreshold;
                      
                      return (
                        <>
                          {requiresVerification && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="bg-warning/20 border border-warning/50 rounded-xl p-4"
                            >
                              <p className="text-sm text-warning flex items-start gap-2">
                                <span className="text-lg">⚠️</span>
                                <span>
                                  Deposits of ₹{depositThreshold.toLocaleString()} or above require transaction ID and payment screenshot for manual verification.
                                </span>
                              </p>
                            </motion.div>
                          )}
                          {!requiresVerification && depositThreshold > 0 && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="bg-success/20 border border-success/50 rounded-xl p-3"
                            >
                              <p className="text-sm text-success flex items-center gap-2">
                                <span>✓</span>
                                <span>Deposits below ₹{depositThreshold.toLocaleString()} will be automatically credited to your wallet.</span>
                              </p>
                            </motion.div>
                          )}
                          <AnimatedInput
                            label={`🔑 Transaction ID${requiresVerification ? '' : ' '}`}
                            type="text"
                            value={transactionId}
                            onChange={(e) => setTransactionId(e.target.value)}
                            placeholder="Enter transaction ID"
                          />
                          <div>
                            <label className="block text-sm font-medium text-gray-900 mb-2">
                              📸 Payment Screenshot {requiresVerification && <span className="text-red-600">*</span>}
                            </label>
                            <p className="text-xs text-gray-600 mb-2">Upload screenshot of bank transfer confirmation</p>
                            <div className="relative">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    setScreenshot(file);
                                  }
                                }}
                                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 file:cursor-pointer"
                              />
                            </div>
                            {screenshot && (
                              <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-xs text-green-600 mt-2 flex items-center gap-1">
                              
                                <span>✓</span>
                                <span>Selected: {screenshot.name}</span>
                              </motion.p>
                            )}
                          </div>
                        </>
                      );
                    })()}
                  </>
                )}

                {activeModal === 'deposit-inr' && paymentMethod === 'UPI' && upiAccounts.length > 0 && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        📱 Select UPI Account <span className="text-red-600">*</span>
                      </label>
                      <select
                        value={selectedUpiAccount}
                        onChange={(e) => setSelectedUpiAccount(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer"
                      >
                        <option value="">Select a UPI account</option>
                        {upiAccounts.map((account) => (
                          <option key={account.id} value={account.id}>
                            {account.displayName} - {account.upiId}
                          </option>
                        ))}
                      </select>
                    </div>

                    {selectedUpiAccount && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-200"
                      >
                        <h4 className="text-sm font-semibold text-blue-600 mb-3 flex items-center gap-2">
                          <span>📱</span>
                          <span>UPI Payment Details</span>
                        </h4>
                        {(() => {
                          const account = upiAccounts.find((a) => a.id === selectedUpiAccount);
                          console.log('🔍 Selected UPI Account:', account);
                          console.log('🔍 QR Code URL:', account?.qrCodeUrl);
                          console.log('🔍 BACKEND_URL:', BACKEND_URL);
                          const fullQrUrl = account?.qrCodeUrl 
                            ? (account.qrCodeUrl.startsWith('http') ? account.qrCodeUrl : `${BACKEND_URL}${account.qrCodeUrl}`)
                            : null;
                          console.log('🔍 Full QR URL:', fullQrUrl);
                          
                          return account ? (
                            <div className="space-y-3">
                              <div className="text-sm text-gray-900 space-y-2">
                                <p><span className="text-gray-600">UPI ID:</span> <span className="font-mono font-semibold">{account.upiId}</span></p>
                                <p className="text-xs text-gray-600">Use this UPI ID to make payment or scan the QR code below</p>
                              </div>
                              {account.qrCodeUrl ? (
                                <div className="bg-white p-3 rounded-lg border border-gray-200">
                                  <p className="text-xs text-gray-600 mb-2 text-center">Scan QR Code to Pay</p>
                                  <img 
                                    src={fullQrUrl || ''} 
                                    alt="UPI QR Code" 
                                    className="w-48 h-48 mx-auto object-contain"
                                    onError={(e) => {
                                      console.error('❌ Failed to load QR code image');
                                      console.error('   Original URL:', account.qrCodeUrl);
                                      console.error('   Full URL:', fullQrUrl);
                                      e.currentTarget.style.display = 'none';
                                    }}
                                    onLoad={() => {
                                      console.log('✅ QR code loaded successfully:', fullQrUrl);
                                    }}
                                  />
                                </div>
                              ) : (
                                <p className="text-xs text-gray-500 text-center">No QR code available</p>
                              )}
                            </div>
                          ) : null;
                        })()}
                      </motion.div>
                    )}

                    {selectedUpiAccount && (
                      <>
                        <AnimatedInput
                          label="🔑 Transaction ID "
                          type="text"
                          value={transactionId}
                          onChange={(e) => setTransactionId(e.target.value)}
                          placeholder="Enter UPI transaction ID"
                        />
                        <div>
                          <label className="block text-sm font-medium text-gray-900 mb-2">
                            📸 Payment Screenshot {!transactionId && <span className="text-red-600">*</span>}
                          </label>
                          <p className="text-xs text-gray-600 mb-2">Upload screenshot of payment confirmation</p>
                          <div className="relative">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  setScreenshot(file);
                                }
                              }}
                              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 file:cursor-pointer"
                            />
                          </div>
                          {screenshot && (
                            <motion.p
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="text-xs text-green-600 mt-2 flex items-center gap-1"
                            >
                              <span>✓</span>
                              <span>Selected: {screenshot.name}</span>
                            </motion.p>
                          )}
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-white backdrop-blur-xl border-t border-gray-200 px-6 py-4 rounded-b-2xl">
                <div className="flex gap-3">
                  <AnimatedButton
                    onClick={handleDeposit}
                    disabled={processing}
                    fullWidth
                    size="lg"
                  >
                    {processing ? (
                      <span className="flex items-center justify-center gap-2">
                        <LoadingSpinner size="sm" />
                        <span>Processing...</span>
                      </span>
                    ) : (
                      '✓ Submit Deposit'
                    )}
                  </AnimatedButton>
                  <AnimatedButton
                    onClick={closeModal}
                    variant="ghost"
                    size="lg"
                  >
                    Cancel
                  </AnimatedButton>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Withdraw Modal */}
      <AnimatePresence>
        {(activeModal === 'withdraw-inr' || activeModal === 'withdraw-usdt' || activeModal === 'withdraw-roi' || activeModal === 'withdraw-salary') && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                closeModal();
              }
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="bg-white backdrop-blur-xl border-2 border-gray-200 rounded-2xl shadow-2xl w-[90%] sm:w-[85%] md:w-[75%] lg:w-[500px] xl:w-[550px] 2xl:w-[600px] max-h-[85vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-white backdrop-blur-xl border-b border-gray-200 px-6 py-4 rounded-t-2xl z-10">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-gray-900">💸 Withdraw {activeModal === 'withdraw-inr' ? 'INR' : activeModal === 'withdraw-usdt' ? 'USDT' : activeModal === 'withdraw-roi' ? 'ROI' : 'Salary'}</h3>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={closeModal}
                    className="text-gray-600 hover:text-gray-900 transition-colors text-2xl leading-none w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100">
                  
                    ×
                  </motion.button>
                </div>
              </div>
              
              {/* Modal Body */}
              <div className="p-6 space-y-5">
                <AnimatedInput
                  label="💵 Amount"
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="Enter amount"
                  max={(() => {
                    const wallet = activeModal === 'withdraw-inr' ? inrWallet : activeModal === 'withdraw-usdt' ? usdtWallet : activeModal === 'withdraw-roi' ? roiWallet : salaryWallet;
                    return wallet?.balance;
                  })()}
                />
                <p className="text-xs text-gray-600 flex items-center gap-1">
                  <span>💳</span>
                  <span>Available: {(() => {
                    const wallet = activeModal === 'withdraw-inr' ? inrWallet : activeModal === 'withdraw-usdt' ? usdtWallet : activeModal === 'withdraw-roi' ? roiWallet : salaryWallet;
                    return formatCurrency(wallet?.balance || '0', wallet?.currency || 'INR');
                  })()}</span>
                </p>

                {/* Fee Calculation Display */}
                {withdrawAmount && parseFloat(withdrawAmount) > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-orange-50 border border-orange-200 rounded-xl p-4 space-y-2"
                  >
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700">Requested Amount:</span>
                      <span className="font-semibold text-gray-900">
                        {activeModal === 'withdraw-usdt' 
                          ? `${parseFloat(withdrawAmount).toFixed(2)} USDT`
                          : `₹${parseFloat(withdrawAmount).toFixed(2)}`
                        }
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700">Platform Fee ({platformFeeSettings.withdrawalFeePercent}%):</span>
                      <span className="font-semibold text-red-600">
                        - {activeModal === 'withdraw-usdt'
                          ? `${calculateWithdrawalAmounts(parseFloat(withdrawAmount)).fee.toFixed(2)} USDT`
                          : `₹${calculateWithdrawalAmounts(parseFloat(withdrawAmount)).fee.toFixed(2)}`
                        }
                      </span>
                    </div>
                    <div className="border-t border-orange-300 pt-2 flex justify-between">
                      <span className="text-gray-900 font-semibold">You will receive:</span>
                      <span className="font-bold text-green-600 text-lg">
                        {activeModal === 'withdraw-usdt'
                          ? `${calculateWithdrawalAmounts(parseFloat(withdrawAmount)).amountToReceive.toFixed(2)} USDT`
                          : `₹${calculateWithdrawalAmounts(parseFloat(withdrawAmount)).amountToReceive.toFixed(2)}`
                        }
                      </span>
                    </div>
                  </motion.div>
                )}

                {/* Withdrawal Address for USDT */}
                {activeModal === 'withdraw-usdt' && (
                  <div className="border-t border-gray-200 pt-4 space-y-4">
                    {/* Network Selector */}
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        🌐 Select Network <span className="text-red-600">*</span>
                      </label>
                      <select
                        value={selectedWithdrawNetwork}
                        onChange={(e) => setSelectedWithdrawNetwork(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      >
                        {withdrawNetworks.length === 0 && (
                          <option value="">Loading networks...</option>
                        )}
                        {withdrawNetworks.map((network) => (
                          <option key={network.network} value={network.network}>
                            {network.name} (Chain ID: {network.chainId})
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        Select the blockchain network for withdrawal
                      </p>
                    </div>

                    {/* Withdrawal Address */}
                    <AnimatedInput
                      label="📍 Withdrawal Address (ERC20) *"
                      type="text"
                      value={withdrawalAddress}
                      onChange={(e) => setWithdrawalAddress(e.target.value)}
                      placeholder="0x..."
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      ⚠️ Please ensure this is a valid address on {withdrawNetworks.find(n => n.network === selectedWithdrawNetwork)?.name || 'the selected network'}. Funds sent to incorrect addresses cannot be recovered.
                    </p>
                  </div>
                )}

                {/* Bank Account Selection for INR/ROI/Salary Withdrawals */}
                {(activeModal === 'withdraw-inr' || activeModal === 'withdraw-roi' || activeModal === 'withdraw-salary') && (
                  <>
                    <div className="border-t border-gray-200 pt-4">
                      {userBankAccounts.length === 0 ? (
                        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-5">
                          <div className="flex items-start gap-3 mb-4">
                            <span className="text-2xl">⚠️</span>
                            <div>
                              <p className="text-sm font-semibold text-gray-900 mb-1">No Bank Accounts Found</p>
                              <p className="text-sm text-gray-700">
                                Please add a bank account first to proceed with withdrawal.
                              </p>
                            </div>
                          </div>
                          <AnimatedButton
                            onClick={() => {
                              closeModal();
                              navigate('/profile');
                              // Small delay to ensure navigation completes before tab change
                              setTimeout(() => {
                                const profileComponent = document.querySelector('[data-tab="bank-accounts"]');
                                if (profileComponent) {
                                  (profileComponent as HTMLElement).click();
                                }
                              }, 100);
                            }}
                            variant="primary"
                            size="md"
                            fullWidth
                          >
                            <span className="flex items-center justify-center gap-2">
                              <span>🏦</span>
                              <span>Add Bank Account</span>
                            </span>
                          </AnimatedButton>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-900 mb-2">
                              Select Bank Account <span className="text-red-600">*</span>
                            </label>
                            <select
                              value={selectedUserBankAccount}
                              onChange={(e) => setSelectedUserBankAccount(e.target.value)}
                              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer"
                            >
                              <option value="">Select a bank account</option>
                              {userBankAccounts.map((account) => (
                                <option key={account.id} value={account.id}>
                                  {account.accountName} - {account.accountNumber.replace(/\d(?=\d{4})/g, '*')} ({account.bankName})
                                </option>
                              ))}
                            </select>
                          </div>

                          {selectedUserBankAccount && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-200"
                            >
                              <h4 className="text-sm font-semibold text-blue-600 mb-3 flex items-center gap-2">
                                <span>📋</span>
                                <span>Selected Account Details</span>
                              </h4>
                              {(() => {
                                const account = userBankAccounts.find((a) => a.id === selectedUserBankAccount);
                                return account ? (
                                  <div className="text-sm text-gray-900 space-y-2">
                                    <p><span className="text-gray-600">Account Name:</span> {account.accountName}</p>
                                    <p><span className="text-gray-600">Account Number:</span> {account.accountNumber.replace(/\d(?=\d{4})/g, '*')}</p>
                                    <p><span className="text-gray-600">IFSC:</span> {account.ifscCode}</p>
                                    <p><span className="text-gray-600">Bank:</span> {account.bankName}</p>
                                    {account.branchName && <p><span className="text-gray-600">Branch:</span> {account.branchName}</p>}
                                  </div>
                                ) : null;
                              })()}
                            </motion.div>
                          )}

                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span>Need to add another account?</span>
                            <button
                              onClick={() => {
                                closeModal();
                                navigate('/profile');
                                setTimeout(() => {
                                  const profileComponent = document.querySelector('[data-tab="bank-accounts"]');
                                  if (profileComponent) {
                                    (profileComponent as HTMLElement).click();
                                  }
                                }, 100);
                              }}
                              className="text-blue-600 hover:text-blue-700 font-semibold"
                            >
                              Go to Settings →
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
              
              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-white backdrop-blur-xl border-t border-gray-200 px-6 py-4 rounded-b-2xl">
                <div className="flex gap-3">
                  <AnimatedButton
                    onClick={handleWithdraw}
                    disabled={processing}
                    fullWidth
                    size="lg"
                  >
                    {processing ? (
                      <span className="flex items-center justify-center gap-2">
                        <LoadingSpinner size="sm" />
                        <span>Processing...</span>
                      </span>
                    ) : (
                      '✓ Submit Withdrawal'
                    )}
                  </AnimatedButton>
                  <AnimatedButton
                    onClick={closeModal}
                    variant="ghost"
                    size="lg"
                  >
                    Cancel
                  </AnimatedButton>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Deposit Wallet Modal (EVM) */}
      <AnimatePresence>
        {showDepositWalletModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowDepositWalletModal(false);
              }
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="bg-white backdrop-blur-xl border-2 border-gray-200 rounded-2xl shadow-2xl w-[90%] sm:w-[85%] md:w-[75%] lg:w-[550px] xl:w-[600px] max-h-[85vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-white backdrop-blur-xl border-b border-gray-200 px-6 py-4 rounded-t-2xl z-10">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-gray-900">₮ Deposit tUSDT (Testnet)</h3>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowDepositWalletModal(false)}
                    className="text-gray-600 hover:text-gray-900 transition-colors text-2xl leading-none w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100"
                  >
                    ×
                  </motion.button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6">
                {/* Tab Selection */}
                <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                  <button
                    onClick={() => setDepositTab('manual')}
                    className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                      depositTab === 'manual'
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 hover:text-blue-600'
                    }`}
                  >
                    Manual Deposit
                  </button>
                  <button
                    onClick={() => setDepositTab('direct')}
                    className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                      depositTab === 'direct'
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 hover:text-blue-600'
                    }`}
                  >
                    Direct Payment
                  </button>
                </div>

                {depositTab === 'manual' ? (
                  <>
                    {/* Manual Deposit Instructions */}
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <h4 className="font-semibold text-gray-900 mb-2">How to Deposit USDT</h4>
                      <ul className="text-sm text-gray-700 space-y-1">
                        <li>• Send USDT to your deposit address below</li>
                        <li>• Deposits are automatically credited after confirmation</li>
                        <li>• No manual approval needed</li>
                        <li>• Minimum deposit: {platformFeeSettings.minDepositUSDT} USDT</li>
                        {platformFeeSettings.depositFeePercent > 0 && (
                          <li className="text-red-600 font-medium">• Platform fee: {platformFeeSettings.depositFeePercent}% will be deducted</li>
                        )}
                        <li className="text-orange-600 font-medium">⚠️ Manual deposits only supported on Ethereum and BSC networks</li>
                      </ul>
                    </div>

                    {/* Deposit Address Card */}
                    <div className="bg-white rounded-lg border border-gray-300 p-6">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-lg font-semibold text-gray-900">Your Deposit Address</h4>
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full">
                          Active
                        </span>
                      </div>
                      
                      {/* QR Code */}
                      {depositWalletAddress && (
                        <div className="flex justify-center mb-4">
                          <div className="bg-white p-4 rounded-xl border-2 border-gray-200 shadow-sm">
                            <QRCodeSVG 
                              value={`ethereum:${depositWalletAddress}@11155111`}
                              size={200}
                              level="H"
                              includeMargin={true}
                              bgColor="#ffffff"
                              fgColor="#000000"
                            />
                            <p className="text-xs text-center text-gray-500 mt-2">Sepolia Testnet</p>
                          </div>
                        </div>
                      )}

                      {/* Address */}
                      <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <p className="text-xs text-gray-600 mb-2 font-medium">Wallet Address</p>
                        <div className="flex items-center gap-2">
                          <p className="font-mono text-sm text-gray-900 break-all flex-1">
                            {depositWalletAddress || 'Loading...'}
                          </p>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(depositWalletAddress);
                              showToast.success('Address copied!');
                            }}
                            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs font-semibold whitespace-nowrap"
                          >
                            Copy
                          </button>
                        </div>
                      </div>

                      {/* Supported Networks */}
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-gray-600 mb-2">Supported Networks:</p>
                        <div className="grid grid-cols-1 gap-2">
                          {depositNetworks.length === 0 ? (
                            <div className="bg-gray-50 border border-gray-300 rounded-lg p-3 text-center">
                              <p className="text-sm text-gray-600">Loading networks...</p>
                            </div>
                          ) : (
                            depositNetworks.map((network) => (
                              <div key={network.network} className="bg-blue-50 border border-blue-300 rounded-lg p-3 text-center">
                                <p className="text-sm font-bold text-blue-900">{network.name}</p>
                                <p className="text-xs text-blue-700 mt-1">Chain ID: {network.chainId}</p>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Warning */}
                    <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
                      <p className="font-semibold text-gray-900 mb-2">Important Notice:</p>
                      <ul className="space-y-1 text-sm text-gray-700">
                        <li>• Only send tUSDT tokens to this address on Sepolia testnet</li>
                        <li>• Sending other tokens may result in permanent loss</li>
                        <li>• Ensure you're using the Sepolia test network</li>
                        <li>• Contract deposits are not supported</li>
                      </ul>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Direct Payment Info */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-5 border border-blue-200"
                    >
                      <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <span>⚡</span>
                        <span>Direct Payment (Testnet)</span>
                      </h4>
                      <p className="text-sm text-gray-700 mb-3">
                        Send tUSDT directly from your wallet on Sepolia testnet. Your balance will be credited automatically after blockchain confirmation.
                      </p>
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <p className="text-xs font-semibold text-yellow-800 mb-2">📝 Need Test Tokens?</p>
                        <div className="text-xs text-yellow-700 space-y-1">
                          <p>1. Get test ETH: <a href="https://sepoliafaucet.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-semibold">Sepolia Faucet</a></p>
                          <p>2. Get tUSDT from contract: <a href={`https://sepolia.etherscan.io/address/0x379D44df8fd761B888693764EE83e38Fe2fAD988#writeContract`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-mono text-xs break-all">0x379D44df8fd761B888693764EE83e38Fe2fAD988</a></p>
                          <p className="text-xs text-yellow-600 mt-1">⚠️ You need tUSDT tokens in your wallet to send</p>
                        </div>
                      </div>
                    </motion.div>

                    {/* Payment Card */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="bg-white rounded-xl border-2 border-gray-200 p-6 space-y-5"
                    >
                      {!isConnected ? (
                        <div className="text-center py-8">
                          <div className="text-5xl mb-4">👛</div>
                          <h4 className="text-xl font-semibold text-gray-900 mb-2">Connect Your Wallet</h4>
                          <p className="text-sm text-gray-600 mb-6">Connect your wallet to send tUSDT on Sepolia testnet</p>
                          <div className="flex justify-center">
                            <ConnectButton />
                          </div>
                        </div>
                      ) : (
                        <>
                          {/* Connected Wallet Info */}
                          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xs text-gray-600 font-medium mb-1">Connected Wallet</p>
                                <p className="font-mono text-sm text-gray-900 font-semibold">
                                  {address?.slice(0, 8)}...{address?.slice(-6)}
                                </p>
                                {chain && (
                                  <p className="text-xs text-gray-600 mt-1">Network: {chain.name}</p>
                                )}
                              </div>
                              <span className="text-3xl">✅</span>
                            </div>
                          </div>

                          {/* Network Selection */}
                          <div>
                            <label className="block text-sm font-medium text-gray-900 mb-3">
                              Select Network <span className="text-red-600">*</span>
                            </label>
                            {depositNetworks.length === 0 ? (
                              <div className="text-center py-4 text-gray-500">
                                Loading networks...
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 gap-3">
                                {depositNetworks.map((network) => (
                                  <button
                                    key={network.network}
                                    type="button"
                                    onClick={() => setSelectedDepositNetwork(network.network)}
                                    className={`relative px-6 py-5 rounded-xl border-2 transition-all ${
                                      selectedDepositNetwork === network.network
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-300 bg-white hover:border-blue-300'
                                    }`}
                                  >
                                    <div className="text-3xl mb-2">
                                      {network.network === 'SEPOLIA' ? '🧪' : network.network === 'ETHEREUM' ? '⟠' : '🔶'}
                                    </div>
                                    <div className={`text-base font-bold ${
                                      selectedDepositNetwork === network.network ? 'text-blue-700' : 'text-gray-900'
                                    }`}>
                                      {network.name}
                                    </div>
                                    <div className={`text-xs mt-1 ${
                                      selectedDepositNetwork === network.network ? 'text-blue-600' : 'text-gray-600'
                                    }`}>
                                      Chain ID: {network.chainId}
                                    </div>
                                    {selectedDepositNetwork === network.network && (
                                      <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs px-3 py-1 rounded-full font-bold">
                                        Selected
                                      </span>
                                    )}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Amount Input */}
                          <AnimatedInput
                            label="💵 Amount (tUSDT)"
                            type="number"
                            value={usdtDepositAmount}
                            onChange={(e) => setUsdtDepositAmount(e.target.value)}
                            placeholder={`Enter amount (min: ${platformFeeSettings.minDepositUSDT} tUSDT)`}
                          />

                          {/* Fee Calculation Display */}
                          {usdtDepositAmount && parseFloat(usdtDepositAmount) > 0 && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2"
                            >
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-700">Amount to Send:</span>
                                <span className="font-semibold text-gray-900">{parseFloat(usdtDepositAmount).toFixed(2)} tUSDT</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-700">Platform Fee ({platformFeeSettings.depositFeePercent}%):</span>
                                <span className="font-semibold text-red-600">- {((parseFloat(usdtDepositAmount) * platformFeeSettings.depositFeePercent) / 100).toFixed(2)} tUSDT</span>
                              </div>
                              <div className="border-t border-blue-300 pt-2 flex justify-between">
                                <span className="text-gray-900 font-semibold">Amount to be Credited:</span>
                                <span className="font-bold text-green-600 text-lg">{(parseFloat(usdtDepositAmount) - (parseFloat(usdtDepositAmount) * platformFeeSettings.depositFeePercent / 100)).toFixed(2)} tUSDT</span>
                              </div>
                              <div className="text-xs text-gray-600 italic">
                                Platform fee will be deducted from the received amount
                              </div>
                            </motion.div>
                          )}

                          {/* Transaction Summary */}
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200"
                          >
                            <p className="text-xs text-gray-600 font-medium uppercase tracking-wider mb-3">Transaction Summary</p>
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Amount:</span>
                                <span className="text-sm font-bold text-gray-900">{usdtDepositAmount || '0'} tUSDT</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Network:</span>
                                <span className="text-sm font-semibold text-blue-700">
                                  🧪 Sepolia Testnet
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">INR Value:</span>
                                <span className="text-sm font-semibold text-green-600">
                                  ₹{((parseFloat(usdtDepositAmount) || 0) * currencyRate).toFixed(2)}
                                </span>
                              </div>
                              <div className="pt-2 border-t border-gray-300">
                                <div className="flex justify-between items-start">
                                  <span className="text-xs text-gray-600">Recipient:</span>
                                  <span className="font-mono text-xs text-gray-900 break-all text-right ml-2">
                                    {depositWalletAddress?.slice(0, 10)}...{depositWalletAddress?.slice(-8)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </motion.div>

                          {/* Send Button */}
                          <AnimatedButton
                            onClick={handleWalletDeposit}
                            disabled={isSending || !usdtDepositAmount}
                            fullWidth
                            size="lg"
                          >
                            {isSending ? (
                              <span className="flex items-center justify-center gap-2">
                                <LoadingSpinner size="sm" />
                                <span>Sending Transaction...</span>
                              </span>
                            ) : (
                              '⚡ Send tUSDT Now'
                            )}
                          </AnimatedButton>

                          {/* Transaction Status */}
                          {txHash && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4"
                            >
                              <p className="text-sm font-semibold text-green-800 mb-2 flex items-center gap-2">
                                <span>✓</span>
                                <span>Transaction Sent</span>
                              </p>
                              <p className="text-xs text-gray-700 font-mono break-all mb-2">
                                {txHash}
                              </p>
                              {isConfirmed ? (
                                <p className="text-xs text-green-700 font-semibold flex items-center gap-1">
                                  <span>🎉</span>
                                  <span>Confirmed! Your balance will be updated shortly.</span>
                                </p>
                              ) : (
                                <>
                                  <p className="text-xs text-gray-600 flex items-center gap-1 mb-2">
                                    <LoadingSpinner size="sm" />
                                    <span>Waiting for blockchain confirmation...</span>
                                  </p>
                                  <p className="text-xs text-green-600 font-medium">
                                    💰 Your pending transaction is being tracked! Check the Wallet Summary below.
                                  </p>
                                </>
                              )}
                            </motion.div>
                          )}

                          {/* Pending Transactions Display */}
                          {pendingTransactions.length > 0 && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="bg-yellow-50 border border-yellow-200 rounded-xl p-4"
                            >
                              <p className="text-sm font-semibold text-yellow-800 mb-3 flex items-center gap-2">
                                <span>⏳</span>
                                <span>Pending Transactions ({pendingTransactions.length})</span>
                              </p>
                              <div className="space-y-2">
                                {pendingTransactions.map((tx: any) => (
                                  <div key={tx.id} className="bg-white rounded-lg p-3 border border-yellow-300">
                                    <div className="flex items-center justify-between mb-1">
                                      <p className="text-xs font-semibold text-gray-900">
                                        {parseFloat(tx.amount).toFixed(4)} tUSDT
                                      </p>
                                      <p className="text-xs text-gray-600">
                                        {new Date(tx.createdAt).toLocaleTimeString()}
                                      </p>
                                    </div>
                                    <p className="text-xs text-gray-600 font-mono break-all">
                                      {tx.txHash}
                                    </p>
                                    <p className="text-xs text-yellow-700 mt-1">
                                      ⏱️ Auto-expires in {Math.max(0, Math.ceil((new Date(tx.expiresAt).getTime() - Date.now()) / 60000))} min
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}

                          {/* Important Notice */}
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="bg-blue-50 border border-blue-200 rounded-xl p-4"
                          >
                            <p className="text-xs font-semibold text-blue-800 mb-2">💡 Important</p>
                            <ul className="space-y-1 text-xs text-blue-700">
                              <li>• You must have tUSDT tokens in your connected wallet</li>
                              <li>• Minimum deposit: 10 tUSDT</li>
                              <li>• Balance credited automatically after confirmation</li>
                              <li>• Transaction may take 1-5 minutes on testnet</li>
                              <li>• Ensure sufficient test ETH for gas fees</li>
                            </ul>
                          </motion.div>
                        </>
                      )}
                    </motion.div>
                  </>
                )}

                {/* Recent Deposits */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-gray-900">Recent Deposits</h4>
                    <AnimatedButton
                      onClick={handleCheckDeposits}
                      disabled={checkingDeposits}
                      size="sm"
                      variant="primary"
                    >
                      {checkingDeposits ? (
                        <span className="flex items-center gap-1">
                          <LoadingSpinner size="sm" />
                          Checking...
                        </span>
                      ) : (
                        '🔍 Check Now'
                      )}
                    </AnimatedButton>
                  </div>
                  {depositTransactions.length > 0 ? (
                    <div className="space-y-2">
                      {depositTransactions.map((tx: any) => (
                        <div
                          key={tx.id}
                          className="bg-white rounded-lg border border-gray-200 p-3"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-gray-900">
                              {parseFloat(tx.amount).toFixed(4)} {tx.tokenSymbol}
                            </span>
                            <span
                              className={`text-xs px-2 py-1 rounded-full font-medium ${
                                tx.credited
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-orange-100 text-orange-700'
                              }`}
                            >
                              {tx.credited ? '✓ Credited' : 'Pending'}
                            </span>
                          </div>
                          <div className="text-xs text-gray-600 space-y-1">
                            <div className="flex items-center justify-between">
                              <span>Tx Hash:</span>
                              <a
                                href={`https://sepolia.etherscan.io/tx/${tx.txHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline font-mono"
                              >
                                {tx.txHash.slice(0, 8)}...{tx.txHash.slice(-6)}
                              </a>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>Date:</span>
                              <span>{new Date(tx.blockTimestamp).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-lg p-4 text-center text-sm text-gray-600">
                      No recent deposits. Send tUSDT to your deposit address to get started.
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-white backdrop-blur-xl border-t border-gray-200 px-6 py-4 rounded-b-2xl">
                <AnimatedButton
                  onClick={() => setShowDepositWalletModal(false)}
                  variant="ghost"
                  size="lg"
                  fullWidth
                >
                  Close
                </AnimatedButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Wallet;
