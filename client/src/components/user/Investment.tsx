import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { userApi } from '../../services/userApi';
import { showToast } from '../../utils/toast';
import LoadingSpinner from '../common/LoadingSpinner';
import AnimatedButton from '../common/AnimatedButton';
import AnimatedInput from '../common/AnimatedInput';
import GlassCard from '../common/GlassCard';

interface Plan {
  id: string;
  name: string;
  description: string;
  amount: string;
  roiAmount: string;
  durationTimes: number;
  frequency: string;
  frequencyDay?: number;
  frequencyDays?: number[];
  isActive: boolean;
}

interface Investment {
  id: string;
  amount: string;
  startDate: string;
  endDate: string;
  status: string;
  roiEarned: string;
  realTimeROI?: string;
  refundTimelineDays?: number; // Timeline window for breakdown requests
  adminRemarks?: string; // Admin remarks for rejection or approval
  plan?: Plan;
  refunds?: Array<{
    id: string;
    status: string;
    amount: string;
    createdAt: string;
  }>;
}

const Investment = () => {
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [processingBreakdown, setProcessingBreakdown] = useState<string | null>(null);
  const [showBreakdownModal, setShowBreakdownModal] = useState(false);
  const [selectedInvestmentForBreakdown, setSelectedInvestmentForBreakdown] = useState<Investment | null>(null);
  const [purchaseMethod, setPurchaseMethod] = useState<'ADMIN_REQUEST' | 'DIRECT_WALLET_INR' | 'DIRECT_WALLET_USDT' | 'AUTH_KEY'>('ADMIN_REQUEST');
  const [authKeyCode, setAuthKeyCode] = useState('');
  const [walletBalances, setWalletBalances] = useState<{ inr: string; usdt: string }>({ inr: '0', usdt: '0' });
  const [currencyRate, setCurrencyRate] = useState<number>(83.5); // Default INR to USD rate
  const [userInvestments, setUserInvestments] = useState<Investment[]>([]); // Store all user investments to check duplicates

  useEffect(() => {
    if (!type) {
      navigate('/investment/plans', { replace: true });
      return;
    }
    if (type === 'browse') {
      loadPlans();
      loadAllUserInvestments(); // Load user investments to check for duplicates
    } else {
      loadInvestments();
    }
  }, [type, filter, navigate]);

  // Use ref to track latest investments for the interval callback
  const investmentsRef = useRef<Investment[]>([]);
  const updateRealTimeROIRef = useRef<(() => Promise<void>) | null>(null);

  useEffect(() => {
    investmentsRef.current = investments;
  }, [investments]);

  // Poll for real-time ROI every 10 seconds for active investments
  useEffect(() => {
    if (type !== 'plans') return;

    let isMounted = true;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const updateRealTimeROI = async () => {
      if (!isMounted) return;

      // Get current investments from ref to always use latest
      const currentInvestments = investmentsRef.current;
      const activeInvestments = currentInvestments.filter(inv => inv.status === 'ACTIVE');

      if (activeInvestments.length === 0) return;

      // Update each active investment
      for (const investment of activeInvestments) {
        try {
          const response = await userApi.getInvestmentRealTimeROI(investment.id);
          if (response.success && response.data && isMounted) {
            const data = response.data as any;
            setInvestments(prev =>
              prev.map(inv =>
                inv.id === investment.id
                  ? { ...inv, realTimeROI: data.realTimeROI }
                  : inv
              )
            );
          }
        } catch (error) {
          // Silently fail for real-time updates
          console.error(`Failed to update ROI for investment ${investment.id}:`, error);
        }
      }
    };

    // Store the update function in ref so we can call it when investments change
    updateRealTimeROIRef.current = updateRealTimeROI;

    // Update immediately
    updateRealTimeROI();

    // Then update every 10 seconds (10000ms)
    intervalId = setInterval(() => {
      if (isMounted) {
        updateRealTimeROI();
      }
    }, 10000);

    return () => {
      isMounted = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
      updateRealTimeROIRef.current = null;
    };
  }, [type]); // Only depend on type, investments are accessed via ref

  // Trigger update when investments are loaded (especially on initial load)
  useEffect(() => {
    if (type === 'plans' && investments.length > 0 && updateRealTimeROIRef.current) {
      // Small delay to ensure investments are fully set
      const timer = setTimeout(() => {
        updateRealTimeROIRef.current?.();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [investments.length, type]);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const response = await userApi.getPlans();
      if (response.success && response.data) {
        setPlans(response.data as Plan[]);
      } else {
        showToast.error(response.error || 'Failed to load plans');
      }
    } catch (error) {
      showToast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const loadInvestments = async () => {
    try {
      setLoading(true);
      const status = filter === 'all' ? undefined : filter.toUpperCase();
      const response = await userApi.getInvestments({ status });
      if (response.success && response.data) {
        const data = response.data as any;
        setInvestments(Array.isArray(data) ? data : data.data || []);
      } else {
        showToast.error(response.error || 'Failed to load investments');
      }
    } catch (error) {
      showToast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const loadAllUserInvestments = async () => {
    try {
      // Load all investments (no filter) to check if user already has any plan
      const response = await userApi.getInvestments({});
      if (response.success && response.data) {
        const data = response.data as any;
        setUserInvestments(Array.isArray(data) ? data : data.data || []);
      }
    } catch (error) {
      console.error('Failed to load user investments:', error);
    }
  };

  const isPlanAlreadyPurchased = (planId: string) => {
    return userInvestments.some(inv => inv.plan?.id === planId);
  };

  useEffect(() => {
    // Load wallet balances when purchase modal opens
    if (showPurchaseModal && selectedPlan) {
      loadWalletBalances();
    }
  }, [showPurchaseModal, selectedPlan]);

  const loadWalletBalances = async () => {
    try {
      const [walletsResponse, rateResponse] = await Promise.all([
        userApi.getWallets(),
        userApi.getCurrencyRate(),
      ]);

      if (walletsResponse.success && walletsResponse.data) {
        const wallets = walletsResponse.data as any;
        const walletsArray = Array.isArray(wallets) ? wallets : wallets.data || [];

        const inrWallet = walletsArray.find((w: any) => w.type === 'INR');
        const usdtWallet = walletsArray.find((w: any) => w.type === 'USDT');

        setWalletBalances({
          inr: inrWallet?.balance || '0',
          usdt: usdtWallet?.balance || '0',
        });
      }

      // Fetch currency rate
      if (rateResponse.success && rateResponse.data) {
        const rateData = rateResponse.data as any;
        if (rateData.rate) {
          setCurrencyRate(parseFloat(rateData.rate));
        }
      }
    } catch (error) {
      console.error('Failed to load wallet balances:', error);
      showToast.error('Failed to load wallet information');
    }
  };

  const handlePurchase = async () => {
    if (!selectedPlan) return;

    // Validate Authentication Key if method is AUTH_KEY
    if (purchaseMethod === 'AUTH_KEY' && !authKeyCode.trim()) {
      showToast.error('Please enter Authentication Key code');
      return;
    }

    setProcessing(true);
    try {
      const response = await userApi.createInvestment({
        planId: selectedPlan.id,
        amount: parseFloat(selectedPlan.amount),
        purchaseMethod,
        authKeyCode: purchaseMethod === 'AUTH_KEY' ? authKeyCode.trim().toUpperCase() : undefined,
        walletType: purchaseMethod === 'DIRECT_WALLET_INR' ? 'INR' : purchaseMethod === 'DIRECT_WALLET_USDT' ? 'USDT' : undefined,
      });

      if (response.success) {
        const message = purchaseMethod === 'ADMIN_REQUEST'
          ? 'Investment request submitted successfully! Waiting for admin approval.'
          : purchaseMethod === 'AUTH_KEY'
            ? 'Investment activated successfully! Your plan is now active and ROI payouts will begin as scheduled.'
            : 'Investment created successfully!';
        showToast.success(message);
        setShowPurchaseModal(false);
        setSelectedPlan(null);
        setPurchaseMethod('ADMIN_REQUEST');
        setAuthKeyCode('');
        navigate('/investment/plans');
        loadInvestments();
      } else {
        showToast.error(response.error || 'Failed to create investment');
      }
    } catch (error) {
      showToast.error('An error occurred');
    } finally {
      setProcessing(false);
    }
  };

  const handleBreakdownRequest = async () => {
    if (!selectedInvestmentForBreakdown) return;

    setProcessingBreakdown(selectedInvestmentForBreakdown.id);
    try {
      const response = await userApi.requestBreakdown(selectedInvestmentForBreakdown.id);

      if (response.success) {
        showToast.success('Breakdown request submitted successfully!');
        setShowBreakdownModal(false);
        setSelectedInvestmentForBreakdown(null);
        loadInvestments(); // Reload investments to show updated status
      } else {
        showToast.error(response.error || 'Failed to request breakdown');
      }
    } catch (error) {
      showToast.error('An error occurred');
    } finally {
      setProcessingBreakdown(null);
    }
  };

  const handleCancelBreakdown = async (investmentId: string) => {
    try {
      const response = await userApi.cancelBreakdown(investmentId);

      if (response.success) {
        showToast.success('Breakdown request cancelled! ROI credits will resume.');
        loadInvestments(); // Reload investments
      } else {
        showToast.error(response.error || 'Failed to cancel breakdown');
      }
    } catch (error) {
      showToast.error('An error occurred');
    }
  };

  const hasBreakdownRequest = (investment: Investment) => {
    return investment.refunds?.some(refund =>
      refund.status === 'PENDING'
    ) || false;
  };

  const isBreakdownWindowOpen = (investment: Investment) => {
    if (!investment.startDate) {
      return false; // Can't request if no start date
    }

    const startDate = new Date(investment.startDate);
    const today = new Date();
    const daysSinceStart = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    // Default to 30 days if refundTimelineDays is not set (for older investments)
    const timelineDays = investment.refundTimelineDays || 30;

    // Window is open if we're within the timeline
    return daysSinceStart <= timelineDays;
  };

  const getDaysRemainingForBreakdown = (investment: Investment): number => {
    if (!investment.startDate) {
      return 0;
    }

    const startDate = new Date(investment.startDate);
    const today = new Date();
    const daysSinceStart = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    // Default to 30 days if refundTimelineDays is not set (for older investments)
    const timelineDays = investment.refundTimelineDays || 30;

    return Math.max(0, timelineDays - daysSinceStart);
  };

  const formatCurrency = (amount: string, currency: string = 'USDT') => {
    const num = parseFloat(amount || '0');
    if (currency === 'USDT') {
      return `$${num.toFixed(2)} USDT`;
    }
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getFrequencyText = (plan: Plan) => {
    if (plan.frequency === 'DAILY') {
      const days = plan.frequencyDays || [];
      const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      return `Daily (${days.map(d => dayNames[d - 1]).join(', ')})`;
    } else if (plan.frequency === 'WEEKLY') {
      const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      return `Weekly (${dayNames[(plan.frequencyDay || 1) - 1]})`;
    } else {
      return `Monthly (Day ${plan.frequencyDay})`;
    }
  };

  if (type === 'browse') {
    return (
      <div className="space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1">
            Browse Investment Plans
          </h1>
          <p className="text-gray-600 text-xs sm:text-sm">Choose a plan that suits your investment goals</p>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -8, scale: 1.02 }}
              >
                <GlassCard className="h-full border-primary-500/30 hover:border-primary-500/50">
                  <div className="flex items-start justify-between mb-3 sm:mb-4">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900">{plan.name}</h3>
                    <motion.div
                      whileHover={{ scale: 1.2, rotate: 5 }}
                      className="text-3xl"
                    >
                      💼
                    </motion.div>
                  </div>
                  {plan.description && (
                    <p className="text-sm text-gray-600 mb-6">{plan.description}</p>
                  )}
                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <span className="text-gray-600 text-sm">Investment Amount</span>
                      <span className="text-gray-900 font-bold text-lg">{formatCurrency(plan.amount)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-primary-500/10 rounded-lg border border-primary-500/20">
                      <span className="text-gray-600 text-sm">ROI per Payout</span>
                      <span className="text-primary-400 font-bold text-lg">{formatCurrency(plan.roiAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <span className="text-gray-600 text-sm">Duration</span>
                      <span className="text-gray-900 font-semibold">{plan.durationTimes} payouts</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <span className="text-gray-600 text-sm">Frequency</span>
                      <span className="text-gray-900 text-sm font-medium">{getFrequencyText(plan)}</span>
                    </div>
                  </div>
                  <AnimatedButton
                    onClick={() => {
                      setSelectedPlan(plan);
                      setShowPurchaseModal(true);
                    }}
                    disabled={isPlanAlreadyPurchased(plan.id)}
                    fullWidth
                    size="lg"
                  >
                    {isPlanAlreadyPurchased(plan.id) ? '✓ Already Purchased' : '💰 Invest Now'}
                  </AnimatedButton>
                  {isPlanAlreadyPurchased(plan.id) && (
                    <p className="text-xs text-gray-500 text-center mt-2">
                      You have already purchased this plan
                    </p>
                  )}
                </GlassCard>
              </motion.div>
            ))}
          </div>
        )}

        {/* Purchase Modal */}
        <AnimatePresence>
          {showPurchaseModal && selectedPlan && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setShowPurchaseModal(false);
                  setSelectedPlan(null);
                  setPurchaseMethod('ADMIN_REQUEST');
                  setAuthKeyCode('');
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
                <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 rounded-t-2xl z-10">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900">💰 Confirm Investment</h3>
                    <motion.button
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        setShowPurchaseModal(false);
                        setSelectedPlan(null);
                        setPurchaseMethod('ADMIN_REQUEST');
                        setAuthKeyCode('');
                      }}
                      className="text-gray-600 hover:text-gray-900 transition-colors text-xl leading-none w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg hover:bg-gray-100"
                    >
                      ×
                    </motion.button>
                  </div>
                </div>

                {/* Modal Body */}
                <div className="p-6 space-y-5">
                  <div className="space-y-4 mb-6">
                    <div className="p-4 bg-primary-500/10 rounded-xl border border-primary-500/20">
                      <p className="text-xs text-gray-600 mb-1 font-medium">Plan</p>
                      <p className="text-gray-900 font-bold text-lg">{selectedPlan.name}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <p className="text-xs text-gray-600 mb-1 font-medium">Investment Amount</p>
                      <p className="text-gray-900 font-bold text-2xl">{formatCurrency(selectedPlan.amount)}</p>
                    </div>
                    <div className="p-4 bg-primary-500/10 rounded-xl border border-primary-500/20">
                      <p className="text-xs text-gray-600 mb-1 font-medium">ROI per Payout</p>
                      <p className="text-primary-400 font-bold text-xl">{formatCurrency(selectedPlan.roiAmount)}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <p className="text-xs text-gray-600 mb-1 font-medium">Total Payouts</p>
                      <p className="text-gray-900 font-semibold text-lg">{selectedPlan.durationTimes} times</p>
                    </div>

                    {/* Purchase Method Selection */}
                    <div>
                      <p className="text-sm font-semibold text-gray-900 mb-3">Payment Method *</p>
                      <div className="space-y-3">
                        {[
                          { value: 'ADMIN_REQUEST', label: 'Admin Request', desc: 'Request admin to purchase this plan', icon: '👤' },
                          {
                            value: 'DIRECT_WALLET_INR',
                            label: 'Direct Payment (INR)',
                            desc: `Balance: ${formatCurrency(walletBalances.inr, 'INR')} (~$${(parseFloat(walletBalances.inr) / currencyRate).toFixed(2)} USDT)`,
                            icon: '💵'
                          },
                          { value: 'DIRECT_WALLET_USDT', label: 'Direct Payment (USDT)', desc: `Balance: ${formatCurrency(walletBalances.usdt, 'USDT')}`, icon: '₮' },
                          { value: 'AUTH_KEY', label: 'Authentication Key', desc: 'Use Authentication Key code to purchase', icon: '🔑' },
                        ].map((method) => (
                          <motion.label
                            key={method.value}
                            whileHover={{ scale: 1.02, x: 4 }}
                            className={`flex items-center p-4 rounded-xl cursor-pointer transition-all border-2 ${purchaseMethod === method.value
                                ? 'bg-blue-50 border-blue-500'
                                : 'bg-gray-50 border-gray-200 hover:border-blue-300'
                              }`}
                          >
                            <input
                              type="radio"
                              name="purchaseMethod"
                              value={method.value}
                              checked={purchaseMethod === method.value}
                              onChange={(e) => setPurchaseMethod(e.target.value as any)}
                              className="mr-4 w-5 h-5 accent-primary-500"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xl">{method.icon}</span>
                                <p className="text-gray-900 font-semibold">{method.label}</p>
                              </div>
                              <p className="text-xs text-gray-600">{method.desc}</p>
                            </div>
                          </motion.label>
                        ))}
                      </div>
                    </div>

                    {/* Authentication Key Code Input */}
                    {purchaseMethod === 'AUTH_KEY' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <AnimatedInput
                          label="🔑 Authentication Key Code *"
                          type="text"
                          value={authKeyCode}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAuthKeyCode(e.target.value.toUpperCase())}
                          placeholder="Enter Authentication Key code"
                        />
                      </motion.div>
                    )}
                  </div>
                  {/* Modal Footer */}
                  <div className="sticky bottom-0 bg-white backdrop-blur-xl border-t border-gray-200 px-6 py-4 rounded-b-2xl">
                    <div className="flex gap-3">
                      <AnimatedButton
                        onClick={handlePurchase}
                        disabled={processing || (purchaseMethod === 'AUTH_KEY' && !authKeyCode.trim())}
                        fullWidth
                        size="lg"
                      >
                        {processing ? (
                          <span className="flex items-center justify-center gap-2">
                            <LoadingSpinner size="sm" />
                            <span>Processing...</span>
                          </span>
                        ) : (
                          purchaseMethod === 'ADMIN_REQUEST' ? '✓ Request Investment' : purchaseMethod === 'AUTH_KEY' ? '✓ Activate Plan with Key' : '✓ Confirm & Invest'
                        )}
                      </AnimatedButton>
                      <AnimatedButton
                        onClick={() => {
                          setShowPurchaseModal(false);
                          setSelectedPlan(null);
                          setPurchaseMethod('ADMIN_REQUEST');
                          setAuthKeyCode('');
                        }}
                        variant="ghost"
                        size="lg"
                      >
                        Cancel
                      </AnimatedButton>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
      >
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1">
            {type === 'plans' ? 'Active Plans' : 'Plan History'}
          </h1>
          <p className="text-gray-600 text-xs sm:text-sm">
            {type === 'plans' ? 'Your currently active investments' : 'Your completed investments'}
          </p>
        </div>
        {type === 'plans' && (
          <AnimatedButton
            onClick={() => navigate('/investment/browse')}
            variant="primary"
            size="lg"
          >
            📋 Browse Plans
          </AnimatedButton>
        )}
      </motion.div>

      {/* Filter Tabs */}
      {type === 'history' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex gap-2 border-b border-white/10"
        >
          {(['all', 'active', 'completed'] as const).map((f, index) => (
            <motion.button
              key={f}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              whileHover={{ y: -2 }}
              onClick={() => setFilter(f)}
              className={`px-6 py-3 font-semibold transition-all relative ${filter === f
                  ? 'text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {filter === f && (
                <motion.div
                  layoutId="activeFilter"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500 rounded-full"
                  initial={false}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </motion.button>
          ))}
        </motion.div>
      )}

      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      ) : investments.length > 0 ? (
        <div className="space-y-6">
          {investments.map((investment, index) => (
            <motion.div
              key={investment.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -4, scale: 1.01 }}
            >
              <GlassCard className="border-white/10 hover:border-primary-500/30">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {investment.plan?.name || 'Investment Plan'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Invested: <span className="text-gray-900 font-semibold">{formatCurrency(investment.amount)}</span>
                    </p>
                  </div>
                  <motion.span
                    whileHover={{ scale: 1.1 }}
                    className={`px-4 py-2 rounded-full text-xs font-bold ${investment.status === 'ACTIVE'
                        ? 'bg-success/20 text-success border border-success/30'
                        : investment.status === 'COMPLETED'
                          ? 'bg-info/20 text-info border border-info/30'
                          : investment.status === 'REJECTED'
                            ? 'bg-red-100 text-red-600 border border-red-300'
                            : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                      }`}
                  >
                    {investment.status}
                  </motion.span>
                </div>
                {(investment.status === 'REJECTED' || investment.status === 'CANCELLED') && investment.adminRemarks && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4"
                  >
                    <p className="text-red-800 text-sm font-semibold mb-1 flex items-center gap-2">
                      <span>⚠️</span>
                      <span>{investment.status === 'REJECTED' ? 'Rejection Reason' : 'Cancellation Reason'}</span>
                    </p>
                    <p className="text-red-700 text-sm">{investment.adminRemarks}</p>
                  </motion.div>
                )}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-600 mb-1 font-medium">Start Date</p>
                    <p className="text-gray-900 font-semibold">
                      {investment.startDate ? formatDate(investment.startDate) : 'Pending'}
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-600 mb-1 font-medium">End Date</p>
                    <p className="text-gray-900 font-semibold">
                      {investment.endDate ? formatDate(investment.endDate) : 'Pending'}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-xs text-gray-600 mb-1 font-medium">ROI Earned</p>
                    <p className="text-primary-400 font-bold text-lg">
                      {formatCurrency(investment.realTimeROI || investment.roiEarned)}
                    </p>
                    {investment.status === 'ACTIVE' && investment.realTimeROI && (
                      <motion.p
                        animate={{ opacity: [1, 0.5, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="text-xs text-success mt-1 font-medium"
                      >
                        ● Live
                      </motion.p>
                    )}
                  </div>
                  {investment.plan && (
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-600 mb-1 font-medium">ROI per Payout</p>
                      <p className="text-gray-900 font-semibold">{formatCurrency(investment.plan.roiAmount)}</p>
                    </div>
                  )}
                </div>
                {investment.status === 'ACTIVE' && !hasBreakdownRequest(investment) && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    {isBreakdownWindowOpen(investment) ? (
                      <>
                        <AnimatedButton
                          onClick={() => {
                            setSelectedInvestmentForBreakdown(investment);
                            setShowBreakdownModal(true);
                          }}
                          variant="danger"
                          size="md"
                        >
                          ⚠️ Request Breakdown
                        </AnimatedButton>
                        <p className="text-xs text-gray-500 mt-2">
                          {getDaysRemainingForBreakdown(investment) > 0
                            ? `You have ${getDaysRemainingForBreakdown(investment)} day(s) left to request breakdown`
                            : 'Last day to request breakdown'
                          }
                        </p>
                      </>
                    ) : (
                      <div className="bg-gray-100 border border-gray-300 rounded-xl p-4">
                        <p className="text-gray-600 text-sm font-semibold mb-1">🔒 Breakdown Request Closed</p>
                        <p className="text-gray-500 text-xs">
                          The breakdown request window has expired. Breakdown requests are only allowed within {investment.refundTimelineDays || 30} {(investment.refundTimelineDays || 30) === 1 ? 'day' : 'days'} from investment start.
                        </p>
                      </div>
                    )}
                  </div>
                )}
                {hasBreakdownRequest(investment) && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mt-6 pt-6 border-t border-white/10"
                  >
                    <div className="bg-warning/20 border border-warning/50 rounded-xl p-4">
                      <p className="text-warning text-sm font-semibold mb-1">⏸️ Breakdown Requested</p>
                      <p className="text-gray-400 text-xs mb-3">
                        Your breakdown request is pending. ROI credits and boost income are paused.
                      </p>
                      <AnimatedButton
                        onClick={() => handleCancelBreakdown(investment.id)}
                        variant="primary"
                        size="sm"
                      >
                        ↩️ Cancel Breakdown Request
                      </AnimatedButton>
                    </div>
                  </motion.div>
                )}
              </GlassCard>
            </motion.div>
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-16"
        >
          <GlassCard>
            <div className="text-6xl mb-4">📊</div>
            <p className="text-gray-600 mb-6 text-lg">No investments found</p>
            {type === 'plans' && (
              <AnimatedButton onClick={() => navigate('/investment/browse')}>
                Browse Plans
              </AnimatedButton>
            )}
          </GlassCard>
        </motion.div>
      )}

      {/* Breakdown Request Modal */}
      <AnimatePresence>
        {showBreakdownModal && selectedInvestmentForBreakdown && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowBreakdownModal(false);
                setSelectedInvestmentForBreakdown(null);
              }
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="bg-white border-2 border-error/30 rounded-2xl shadow-2xl w-[90%] sm:w-[85%] md:w-[75%] lg:w-[500px] xl:w-[550px] 2xl:w-[600px] max-h-[85vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl z-10">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-gray-900">⚠️ Request Breakdown</h3>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      setShowBreakdownModal(false);
                      setSelectedInvestmentForBreakdown(null);
                    }}
                    className="text-gray-600 hover:text-gray-900 transition-colors text-2xl leading-none w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100"
                  >
                    ×
                  </motion.button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-5">
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-error/20 border border-error/50 rounded-xl p-4"
                >
                  <p className="text-error text-sm font-semibold mb-2 flex items-center gap-2">
                    <span>⚠️</span>
                    <span>Important Notice</span>
                  </p>
                  <p className="text-gray-600 text-xs">
                    Requesting breakdown will:
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Apply {selectedInvestmentForBreakdown.refundTimelineDays || 30} {(selectedInvestmentForBreakdown.refundTimelineDays || 30) === 1 ? 'day' : 'days'} refund timeline - you can only request breakdown within this period from start date</li>
                      <li>Apply deduction percentage to your total (investment + ROI earned)</li>
                      <li>During the timeline period, you'll earn 50% of ROI (other 50% goes to breakdown wallet)</li>
                      <li>You can withdraw from breakdown wallet after the timeline period ends</li>
                    </ul>
                  </p>
                </motion.div>
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <p className="text-sm text-gray-600 mb-1 font-medium">Investment Amount</p>
                    <p className="text-gray-900 font-bold text-xl">{formatCurrency(selectedInvestmentForBreakdown.amount)}</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                    <p className="text-sm text-gray-600 mb-1 font-medium">ROI Earned</p>
                    <p className="text-primary-400 font-bold text-xl">
                      {formatCurrency(selectedInvestmentForBreakdown.realTimeROI || selectedInvestmentForBreakdown.roiEarned)}
                    </p>
                  </div>
                  {selectedInvestmentForBreakdown.plan && (() => {
                    const investmentAmount = parseFloat(selectedInvestmentForBreakdown.amount || '0');
                    const totalROICredited = parseFloat(selectedInvestmentForBreakdown.realTimeROI || selectedInvestmentForBreakdown.roiEarned || '0');
                    const deductionPercentage = 20; // Default, should match backend setting

                    // New formula: [Total invested * (100 - Deduction%)] - [Total ROI Credited * 50%]
                    const investmentAfterDeduction = investmentAmount * (100 - deductionPercentage) / 100;
                    const roiPenalty = totalROICredited * 0.5;
                    const breakdownAmount = investmentAfterDeduction - roiPenalty;

                    return (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-4 bg-blue-50 rounded-xl border border-blue-200"
                      >
                        <p className="text-sm text-gray-600 mb-1 font-medium">Breakdown Amount</p>
                        <p className="text-blue-600 font-bold text-xl">
                          {formatCurrency(Math.max(0, breakdownAmount).toFixed(2))}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          Calculation: ${investmentAmount.toFixed(2)} × {100 - deductionPercentage}% = ${investmentAfterDeduction.toFixed(2)} - ROI Penalty ${roiPenalty.toFixed(2)} (50% of ${totalROICredited.toFixed(2)})
                        </p>
                      </motion.div>
                    );
                  })()}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 rounded-b-2xl">
                <div className="flex gap-3">
                  <AnimatedButton
                    onClick={handleBreakdownRequest}
                    disabled={processingBreakdown === selectedInvestmentForBreakdown.id}
                    variant="danger"
                    fullWidth
                    size="lg"
                  >
                    {processingBreakdown === selectedInvestmentForBreakdown.id ? (
                      <span className="flex items-center justify-center gap-2">
                        <LoadingSpinner size="sm" />
                        <span>Processing...</span>
                      </span>
                    ) : (
                      '⚠️ Confirm Breakdown Request'
                    )}
                  </AnimatedButton>
                  <AnimatedButton
                    onClick={() => {
                      setShowBreakdownModal(false);
                      setSelectedInvestmentForBreakdown(null);
                    }}
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
    </div>
  );
};

export default Investment;

