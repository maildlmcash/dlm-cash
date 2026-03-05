import { useState } from 'react';
import { showToast } from '../../utils/toast';

const Reports = () => {
  const [activeReport, setActiveReport] = useState<string>('');

  const reports = [
    { id: 'user-growth', name: 'User Growth Report', icon: '📈' },
    { id: 'deposit-withdrawal', name: 'Deposit & Withdrawal Summary', icon: '💰' },
    { id: 'roi-salary', name: 'ROI & Salary Income Analysis', icon: '💵' },
    { id: 'referral', name: 'Referral Performance Charts', icon: '🔗' },
    { id: 'wallet-ledger', name: 'Wallet Ledger Report', icon: '💳' },
    { id: 'daily-finance', name: 'Daily Finance Export', icon: '📊' },
    { id: 'monthly-finance', name: 'Monthly Finance Export', icon: '📅' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Reports & Analytics</h1>
        <p className="text-gray-600 mt-1">Generate and view comprehensive reports</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((report) => (
          <div
            key={report.id}
            onClick={() => setActiveReport(report.id)}
            className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow"
          >
            <div className="text-4xl mb-3">{report.icon}</div>
            <h3 className="text-lg font-semibold mb-2">{report.name}</h3>
            <div className="flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveReport(report.id);
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                View
              </button>
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  try {
                    // Generate and download report
                    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
                    const response = await fetch(`${API_BASE_URL}/admin/reports/${report.id}?format=csv`, {
                      headers: {
                        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                      },
                    });
                    if (response.ok) {
                      const blob = await response.blob();
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${report.id}-${new Date().toISOString().split('T')[0]}.csv`;
                      document.body.appendChild(a);
                      a.click();
                      window.URL.revokeObjectURL(url);
                      document.body.removeChild(a);
                    } else {
                      showToast.info('Report export functionality needs backend implementation');
                    }
                  } catch (error) {
                    showToast.info('Report export functionality needs backend implementation');
                  }
                }}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
              >
                Export
              </button>
            </div>
          </div>
        ))}
      </div>

      {activeReport && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">
              {reports.find(r => r.id === activeReport)?.name}
            </h2>
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  try {
                    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
                    const response = await fetch(`${API_BASE_URL}/admin/reports/${activeReport}?format=csv`, {
                      headers: {
                        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                      },
                    });
                    if (response.ok) {
                      const blob = await response.blob();
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${activeReport}-${new Date().toISOString().split('T')[0]}.csv`;
                      document.body.appendChild(a);
                      a.click();
                      window.URL.revokeObjectURL(url);
                      document.body.removeChild(a);
                    } else {
                      showToast.info('Report export functionality needs backend implementation');
                    }
                  } catch (error) {
                    showToast.info('Report export functionality needs backend implementation');
                  }
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
              >
                Export CSV
              </button>
              <button
                onClick={() => setActiveReport('')}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>
          </div>
          <div className="space-y-4">
            <div className="p-8 text-center text-gray-500 border-2 border-dashed rounded-lg">
              <p className="mb-2">Report data visualization will be displayed here</p>
              <p className="text-sm">Report Type: {reports.find(r => r.id === activeReport)?.name}</p>
            </div>
            {/* Placeholder for report data - would be populated from API */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Total Records</p>
                <p className="text-2xl font-bold">-</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Date Range</p>
                <p className="text-2xl font-bold">-</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Summary</p>
                <p className="text-2xl font-bold">-</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
