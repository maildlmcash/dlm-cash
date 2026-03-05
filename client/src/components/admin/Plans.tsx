import { useEffect, useState } from 'react';
import { adminApi } from '../../services/adminApi';
import { showToast } from '../../utils/toast';
import LoadingSpinner from '../common/LoadingSpinner';
import { useConfirm } from '../../utils/confirm';
import ConfirmDialog from '../common/ConfirmDialog';

interface Plan {
  id: string;
  name: string;
  description?: string;
  amount: string;
  roiAmount: string;
  durationTimes: number;
  frequency: string;
  frequencyDay?: number;
  frequencyDays?: number[] | string; // For DAILY: array of days
  isActive: boolean;
  createdAt: string;
  freeDirectReferralIncome?: string | number;
  paidDirectReferralIncome?: string | number;
  boostIncome?: string | number;
}

const Plans = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const { confirm, isOpen, config, handleConfirm, handleCancel } = useConfirm();
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [showAuthKeyModal, setShowAuthKeyModal] = useState(false);
  const [selectedPlanForAuthKey, setSelectedPlanForAuthKey] = useState<Plan | null>(null);
  const [authKeyQuantity, setAuthKeyQuantity] = useState('');
  const [generatingAuthKeys, setGeneratingAuthKeys] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    amount: '',
    roiAmount: '',
    durationTimes: '',
    frequency: 'DAILY' as 'DAILY' | 'WEEKLY' | 'MONTHLY',
    frequencyDay: '',
    frequencyDays: [] as number[], // For DAILY: array of selected days [1,2,3,4,5] where 1=Monday, 7=Sunday
    freeDirectReferralIncome: '',
    paidDirectReferralIncome: '',
    boostIncome: '',
  });

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    setLoading(true);
    try {
      const response = await adminApi.getAllPlans();
      if (response.success && response.data) {
        const data = response.data as any;
        setPlans(Array.isArray(data) ? data : data.data || []);
      }
    } catch (error) {
      console.error('Failed to load plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingPlan(null);
    setFormData({
      name: '',
      description: '',
      amount: '',
      roiAmount: '',
      durationTimes: '',
      frequency: 'DAILY',
      frequencyDay: '',
      frequencyDays: [],
      freeDirectReferralIncome: '',
      paidDirectReferralIncome: '',
      boostIncome: '',
    });
    setShowModal(true);
  };

  const handleEdit = (plan: Plan) => {
    setEditingPlan(plan);
    // Parse frequencyDays if it exists (could be array or JSON string)
    let frequencyDays: number[] = [];
    if (plan.frequency === 'DAILY' && (plan as any).frequencyDays) {
      const days = (plan as any).frequencyDays;
      frequencyDays = Array.isArray(days) ? days : (typeof days === 'string' ? JSON.parse(days) : []);
    }
    
    setFormData({
      name: plan.name,
      description: plan.description || '',
      amount: plan.amount,
      roiAmount: plan.roiAmount,
      durationTimes: plan.durationTimes.toString(),
      frequency: plan.frequency as 'DAILY' | 'WEEKLY' | 'MONTHLY',
      frequencyDay: plan.frequencyDay?.toString() || '',
      frequencyDays,
      freeDirectReferralIncome: (plan as any).freeDirectReferralIncome?.toString() || '',
      paidDirectReferralIncome: (plan as any).paidDirectReferralIncome?.toString() || '',
      boostIncome: (plan as any).boostIncome?.toString() || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate boost income
    const boostIncomeValue = parseFloat(formData.boostIncome);
    if (formData.boostIncome && (isNaN(boostIncomeValue) || boostIncomeValue > 100)) {
      showToast.error('Boost income cannot be more than 100');
      setSaving(false);
      return;
    }
    
    setSaving(true);
    try {
      const payload: any = {
        name: formData.name,
        description: formData.description || undefined,
        amount: parseFloat(formData.amount),
        roiAmount: parseFloat(formData.roiAmount),
        durationTimes: parseInt(formData.durationTimes),
        frequency: formData.frequency,
        frequencyDay: formData.frequency !== 'DAILY' && formData.frequencyDay ? parseInt(formData.frequencyDay) : undefined,
        freeDirectReferralIncome: formData.freeDirectReferralIncome ? parseFloat(formData.freeDirectReferralIncome) : undefined,
        paidDirectReferralIncome: formData.paidDirectReferralIncome ? parseFloat(formData.paidDirectReferralIncome) : undefined,
        boostIncome: formData.boostIncome ? parseFloat(formData.boostIncome) : undefined,
      };

      // Add frequencyDays for DAILY frequency
      if (formData.frequency === 'DAILY') {
        if (formData.frequencyDays.length === 0) {
          showToast.error('Please select at least one day for daily frequency');
          return;
        }
        payload.frequencyDays = formData.frequencyDays;
      }

      let response;
      if (editingPlan) {
        response = await adminApi.updatePlan(editingPlan.id, payload);
      } else {
        response = await adminApi.createPlan(payload);
      }

      if (response.success) {
        showToast.success(editingPlan ? 'Plan updated successfully' : 'Plan created successfully');
        setShowModal(false);
        loadPlans();
      } else {
        showToast.error(response.error || 'Failed to save plan');
      }
    } catch (error) {
      showToast.error('Failed to save plan');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      const response = await adminApi.togglePlanStatus(id);
      if (response.success) {
        loadPlans();
      } else {
        showToast.error(response.error || 'Failed to toggle plan status');
      }
    } catch (error) {
      showToast.error('Failed to toggle plan status');
    }
  };

  const handleDelete = async (id: string) => {
    confirm(
      'Delete Plan',
      'Are you sure you want to delete this plan? This action cannot be undone.',
      async () => {
        try {
          const response = await adminApi.deletePlan(id);
          if (response.success) {
            showToast.success('Plan deleted successfully');
            loadPlans();
          } else {
            showToast.error(response.error || 'Failed to delete plan');
          }
        } catch (error) {
          showToast.error('Failed to delete plan');
        }
      },
      'danger'
    );
  };

  const handleGenerateAuthKeys = (plan: Plan) => {
    setSelectedPlanForAuthKey(plan);
    setAuthKeyQuantity('');
    setShowAuthKeyModal(true);
  };

  const handleAuthKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanForAuthKey) return;

    const quantity = parseInt(authKeyQuantity);
    if (isNaN(quantity) || quantity < 1 || quantity > 1000) {
      showToast.error('Please enter a valid quantity between 1 and 1000');
      return;
    }

    setGeneratingAuthKeys(true);
    try {
      const response = await adminApi.generateAuthKeys({
        planId: selectedPlanForAuthKey.id,
        quantity,
      });

      if (response.success) {
        showToast.success(`${quantity} Authentication Keys generated successfully for ${selectedPlanForAuthKey.name}`);
        setShowAuthKeyModal(false);
        setAuthKeyQuantity('');
        setSelectedPlanForAuthKey(null);
      } else {
        showToast.error(response.error || 'Failed to generate Authentication Keys');
      }
    } catch (error) {
      showToast.error('Failed to generate Authentication Keys');
    } finally {
      setGeneratingAuthKeys(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Investment Plans</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">Manage investment plans and ROI settings</p>
        </div>
        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 whitespace-nowrap text-sm sm:text-base cursor-pointer"
        >
          + Add Plan
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-gray-500">Loading plans...</div>
      ) : plans.length === 0 ? (
        <div className="p-8 text-center text-gray-500">No plans found</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div key={plan.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">{plan.name}</h3>
                <span
                  className={`px-2 py-1 rounded-full text-xs ${
                    plan.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {plan.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              {plan.description && (
                <p className="text-gray-600 mb-4">{plan.description}</p>
              )}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-medium">${parseFloat(plan.amount).toLocaleString()} USDT</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">ROI Amount:</span>
                  <span className="font-medium">${parseFloat(plan.roiAmount).toLocaleString()} USDT</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Frequency:</span>
                  <span className="font-medium">{plan.frequency}</span>
                </div>
                {plan.frequency === 'DAILY' && (plan as any).frequencyDays && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Selected Days:</span>
                    <span className="font-medium">
                      {(() => {
                        const days = (plan as any).frequencyDays;
                        const dayArray = Array.isArray(days) ? days : (typeof days === 'string' ? JSON.parse(days) : []);
                        const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                        return dayArray.map((d: number) => dayNames[d - 1]).join(', ');
                      })()}
                    </span>
                  </div>
                )}
                {plan.frequency !== 'DAILY' && plan.frequencyDay && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Frequency Day:</span>
                    <span className="font-medium">
                      {plan.frequency === 'WEEKLY' 
                        ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][plan.frequencyDay - 1]
                        : `${plan.frequencyDay}`
                      }
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-medium">{plan.durationTimes} times</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Free Referral Income:</span>
                  <span className="font-medium">{plan.freeDirectReferralIncome ? parseFloat(plan.freeDirectReferralIncome.toString()).toFixed(2) : '0.00'} USDT</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Paid Referral Income:</span>
                  <span className="font-medium">{plan.paidDirectReferralIncome ? parseFloat(plan.paidDirectReferralIncome.toString()).toFixed(2) : '0.00'} USDT</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Boost Income:</span>
                  <span className="font-medium">{plan.boostIncome ? parseFloat(plan.boostIncome.toString()).toFixed(2) : '0.00'}%</span>
                </div>
              </div>
              <div className="mt-4 flex flex-col gap-2">
                <button
                  onClick={() => handleGenerateAuthKeys(plan)}
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm cursor-pointer"
                >
                  🔑 Generate Authentication Keys
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(plan)}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm cursor-pointer"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleToggleStatus(plan.id)}
                    className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm cursor-pointer"
                  >
                    {plan.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => handleDelete(plan.id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget && !saving) {
              setShowModal(false);
            }
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-[90%] sm:w-[85%] md:w-[80%] lg:w-[700px] xl:w-[750px] 2xl:w-[800px] max-h-[85vh] overflow-y-auto animate-slideUp border-2 border-gray-200">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl backdrop-blur-sm z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingPlan ? '✏️ Edit Plan' : '➕ Create New Plan'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  disabled={saving}
                  className="text-gray-600 hover:text-gray-900 transition-colors text-2xl leading-none disabled:opacity-50"
                >
                  ×
                </button>
              </div>
            </div>
            
            {/* Modal Body */}
            <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">📝 Plan Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="Enter plan name"
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">📄 Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter plan description (optional)"
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">💰 Amount (USDT) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                    placeholder="Enter amount"
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">💵 ROI Amount (USDT) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.roiAmount}
                    onChange={(e) => setFormData({ ...formData, roiAmount: e.target.value })}
                    required
                    placeholder="Enter ROI amount"
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">⏱️ Duration (Times) *</label>
                  <input
                    type="number"
                    value={formData.durationTimes}
                    onChange={(e) => setFormData({ ...formData, durationTimes: e.target.value })}
                    required
                    min="1"
                    placeholder="Enter duration"
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                  
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">📅 Frequency *</label>
                  <select
                    value={formData.frequency}
                    onChange={(e) => {
                      const newFrequency = e.target.value as 'DAILY' | 'WEEKLY' | 'MONTHLY';
                      setFormData({ 
                        ...formData, 
                        frequency: newFrequency, 
                        frequencyDay: '',
                        frequencyDays: newFrequency === 'DAILY' ? [] : []
                      });
                    }}
                    required
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  >
                    <option value="DAILY">Daily</option>
                    <option value="WEEKLY">Weekly</option>
                    <option value="MONTHLY">Monthly</option>
                  </select>
                </div>
              </div>
              {formData.frequency === 'DAILY' && (
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    📆 Select Days * (Multiple selection allowed)
                  </label>
                  <p className="text-xs text-gray-600 mb-3">Select the days when ROI will be paid. Salary will be given only on selected days.</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { value: 1, label: 'Monday' },
                      { value: 2, label: 'Tuesday' },
                      { value: 3, label: 'Wednesday' },
                      { value: 4, label: 'Thursday' },
                      { value: 5, label: 'Friday' },
                      { value: 6, label: 'Saturday' },
                      { value: 7, label: 'Sunday' },
                    ].map((day) => (
                      <label
                        key={day.value}
                        className="flex items-center space-x-2 p-3 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 cursor-pointer transition-all"
                      >
                        <input
                          type="checkbox"
                          checked={formData.frequencyDays.includes(day.value)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                frequencyDays: [...formData.frequencyDays, day.value],
                              });
                            } else {
                              setFormData({
                                ...formData,
                                frequencyDays: formData.frequencyDays.filter((d) => d !== day.value),
                              });
                            }
                          }}
                          className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-900">{day.label}</span>
                      </label>
                    ))}
                  </div>
                  {formData.frequencyDays.length === 0 && (
                    <p className="text-xs text-red-600 mt-2">⚠️ Please select at least one day</p>
                  )}
                </div>
              )}
              {formData.frequency === 'WEEKLY' && (
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    📅 Frequency Day * (Select day of week)
                  </label>
                  <select
                    value={formData.frequencyDay}
                    onChange={(e) => setFormData({ ...formData, frequencyDay: e.target.value })}
                    required
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  >
                    <option value="">Select day</option>
                    <option value="1">Monday</option>
                    <option value="2">Tuesday</option>
                    <option value="3">Wednesday</option>
                    <option value="4">Thursday</option>
                    <option value="5">Friday</option>
                    <option value="6">Saturday</option>
                    <option value="7">Sunday</option>
                  </select>
                </div>
              )}
              {formData.frequency === 'MONTHLY' && (
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    📅 Frequency Day * (Select day of month 1-30)
                  </label>
                  <select
                    value={formData.frequencyDay}
                    onChange={(e) => setFormData({ ...formData, frequencyDay: e.target.value })}
                    required
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  >
                    <option value="">Select day</option>
                    {Array.from({ length: 30 }, (_, i) => i + 1).map((day) => (
                      <option key={day} value={day.toString()}>
                        {day}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">🆓 Free Direct Referral Income (USDT)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.freeDirectReferralIncome}
                    onChange={(e) => setFormData({ ...formData, freeDirectReferralIncome: e.target.value })}
                    placeholder="Enter amount in USDT"
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">💳 Paid Direct Referral Income (USDT)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.paidDirectReferralIncome}
                    onChange={(e) => setFormData({ ...formData, paidDirectReferralIncome: e.target.value })}
                    placeholder="Enter amount in USDT"
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">🚀 ROI Boost Income (Percentage, Max 100%)</label>
                <input
                  type="number"
                  step="0.01"
                  max="100"
                  value={formData.boostIncome}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    if (e.target.value === '' || (value >= 0 && value <= 100)) {
                      setFormData({ ...formData, boostIncome: e.target.value });
                    }
                  }}
                  placeholder="Enter boost income (max 100)"
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
               
              </div>
              
              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 rounded-b-2xl -mx-6 -mb-6 backdrop-blur-sm mt-6">
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-xl hover:from-blue-700 hover:to-blue-600 transition-all shadow-lg hover:shadow-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                  >
                    {saving && <LoadingSpinner size="sm" />}
                    {saving ? (editingPlan ? 'Updating...' : 'Creating...') : (editingPlan ? '✓ Update Plan' : '✓ Create Plan')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    disabled={saving}
                    className="px-6 py-3 bg-gray-200 text-gray-900 font-semibold rounded-xl hover:bg-gray-300 transition-all border border-gray-300 hover:border-gray-400 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}

      {/* Authentication Key Generation Modal */}
      {showAuthKeyModal && selectedPlanForAuthKey && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget && !generatingAuthKeys) {
              setShowAuthKeyModal(false);
              setAuthKeyQuantity('');
              setSelectedPlanForAuthKey(null);
            }
          }}
        >
          <div className="bg-gradient-to-br from-[#1E2329] to-[#1a1f2e] border-2 border-purple-500/30 rounded-2xl shadow-2xl w-[90%] sm:w-[85%] md:w-[75%] lg:w-[500px] xl:w-[550px] 2xl:w-[600px] max-h-[85vh] overflow-y-auto animate-slideUp">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-[#1E2329] to-[#1a1f2e] border-b border-gray-700/50 px-6 py-4 rounded-t-2xl backdrop-blur-sm z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">🔑 Generate Authentication Keys</h2>
                <button
                  onClick={() => {
                    setShowAuthKeyModal(false);
                    setAuthKeyQuantity('');
                    setSelectedPlanForAuthKey(null);
                  }}
                  disabled={generatingAuthKeys}
                  className="text-gray-400 hover:text-white transition-colors text-2xl leading-none disabled:opacity-50"
                >
                  ×
                </button>
              </div>
            </div>
            
            {/* Modal Body */}
            <div className="p-6">
              <p className="text-gray-300 mb-4">
                Generate Authentication Keys for plan: <span className="font-semibold text-yellow-400">{selectedPlanForAuthKey.name}</span>
              </p>
              <form onSubmit={handleAuthKeySubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    📊 Quantity * (1-1000)
                  </label>
                  <input
                    type="number"
                    value={authKeyQuantity}
                    onChange={(e) => setAuthKeyQuantity(e.target.value)}
                    required
                    min="1"
                    max="1000"
                    placeholder="Enter number of keys to generate"
                    className="w-full px-4 py-3 bg-gray-800/80 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                  />
                  <p className="text-xs text-gray-400 mt-2">
                    Enter how many Authentication Keys you want to generate for this plan
                  </p>
                </div>
                
                {/* Modal Footer */}
                <div className="sticky bottom-0 bg-gradient-to-r from-[#1E2329] to-[#1a1f2e] border-t border-gray-700/50 px-6 py-4 rounded-b-2xl -mx-6 -mb-6 backdrop-blur-sm mt-6">
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={generatingAuthKeys}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-bold rounded-xl hover:from-purple-700 hover:to-purple-600 transition-all shadow-lg hover:shadow-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                    >
                      {generatingAuthKeys && <LoadingSpinner size="sm" />}
                      {generatingAuthKeys ? 'Generating...' : '✓ Generate Keys'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAuthKeyModal(false);
                        setAuthKeyQuantity('');
                        setSelectedPlanForAuthKey(null);
                      }}
                      disabled={generatingAuthKeys}
                      className="px-6 py-3 bg-gray-700/80 text-white font-semibold rounded-xl hover:bg-gray-600 transition-all border border-gray-600 hover:border-gray-500 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={isOpen}
        title={config?.title || 'Confirm Action'}
        message={config?.message || ''}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        type={config?.type || 'warning'}
      />
    </div>
  );
};

export default Plans;
