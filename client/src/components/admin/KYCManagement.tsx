import { useEffect, useState } from 'react';
import { adminApi } from '../../services/adminApi';
import { showToast } from '../../utils/toast';
import { useConfirm } from '../../utils/confirm';
import ConfirmDialog from '../common/ConfirmDialog';

interface KycDocument {
  id: string;
  docType: string;
  fileUrl: string;
  selfieUrl?: string;
  status: string;
  remarks?: string;
  createdAt: string;
}

interface PendingKycEntry {
  user: { id: string; name: string; email: string; phone: string };
  documents: KycDocument[];
}

const KYCManagement = () => {
  const [entries, setEntries] = useState<PendingKycEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedEntry, setSelectedEntry] = useState<PendingKycEntry | null>(null);
  const [remarks, setRemarks] = useState('');
  const { confirm, isOpen, config, handleConfirm, handleCancel } = useConfirm();

  useEffect(() => {
    loadPendingKyc();
  }, [page]);

  const loadPendingKyc = async () => {
    setLoading(true);
    try {
      const response = await adminApi.getPendingKyc({ page, limit: 20 });
      if (response.success && response.data) {
        const payload = response.data as any;
        const list = Array.isArray(payload) ? payload : payload?.data ?? [];
        setEntries(list);
        const pagination = payload?.pagination ?? (response as any).pagination;
        if (pagination?.totalPages != null) {
          setTotalPages(pagination.totalPages);
        }
      }
    } catch (error) {
      console.error('Failed to load pending KYC:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = (userId: string) => {
    confirm(
      'Approve KYC',
      'Approve all KYC documents (e.g. PAN & Aadhaar) for this user?',
      async () => {
        try {
          const response = await adminApi.approveUserKyc(userId, remarks);
          if (response.success) {
            showToast.success('KYC approved successfully');
            loadPendingKyc();
            setSelectedEntry(null);
            setRemarks('');
          } else {
            showToast.error(response.error || 'Failed to approve KYC');
          }
        } catch (error) {
          showToast.error('Failed to approve KYC');
        }
      },
      'info'
    );
  };

  const handleReject = (userId: string) => {
    if (!remarks.trim()) {
      showToast.warning('Please provide remarks for rejection');
      return;
    }
    confirm(
      'Reject KYC',
      'Reject all KYC documents for this user?',
      async () => {
        try {
          const response = await adminApi.rejectUserKyc(userId, remarks);
          if (response.success) {
            showToast.success('KYC rejected successfully');
            loadPendingKyc();
            setSelectedEntry(null);
            setRemarks('');
          } else {
            showToast.error(response.error || 'Failed to reject KYC');
          }
        } catch (error) {
          showToast.error('Failed to reject KYC');
        }
      },
      'danger'
    );
  };

  const docUrl = (path: string) => {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
    const baseUrl = apiBaseUrl.replace(/\/api$/, '');
    let filename = path;
    if (filename.includes('/')) filename = filename.split('/').pop() || filename;
    else if (filename.includes('\\')) filename = filename.split('\\').pop() || filename;
    return `${baseUrl}/uploads/${filename}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">KYC Management</h1>
        <p className="text-gray-600 mt-1 text-sm sm:text-base">Review and approve KYC documents</p>
      </div>

      {loading ? (
        <div className="p-8 text-center text-gray-500">Loading pending KYC...</div>
      ) : entries.length === 0 ? (
        <div className="p-8 text-center text-gray-500">No pending KYC</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* One row per user */}
          <div className="bg-white rounded-lg shadow-md p-5 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-900">Pending KYC (by user)</h2>
            <div className="space-y-3">
              {entries.map((entry) => (
                <div
                  key={entry.user.id}
                  className={`border rounded-lg p-4 cursor-pointer hover:border-blue-500 transition-colors ${
                    selectedEntry?.user.id === entry.user.id ? 'border-blue-500 bg-blue-50' : ''
                  }`}
                  onClick={() => setSelectedEntry(entry)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {entry.user.name || entry.user.email || entry.user.phone}
                      </p>
                      <p className="text-sm text-gray-600 mt-0.5">
                        {entry.documents.map((d) => d.docType).join(', ')}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {entry.documents.length} document(s) · {new Date(entry.documents[0]?.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg disabled:opacity-50 text-sm font-semibold hover:bg-gray-50"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg disabled:opacity-50 text-sm font-semibold hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            )}
          </div>

          {/* User details + all documents */}
          {selectedEntry && (
            <div className="bg-white rounded-lg shadow-md p-5 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-900">KYC Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">User</label>
                  <p className="text-gray-900">
                    {selectedEntry.user.name || selectedEntry.user.email || selectedEntry.user.phone}
                  </p>
                  {selectedEntry.user.email && (
                    <p className="text-sm text-gray-600">{selectedEntry.user.email}</p>
                  )}
                  {selectedEntry.user.phone && (
                    <p className="text-sm text-gray-600">{selectedEntry.user.phone}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Documents</label>
                  <div className="space-y-3">
                    {selectedEntry.documents.map((doc) => (
                      <div key={doc.id} className="rounded-lg border border-gray-200 p-3 bg-gray-50">
                        <p className="font-medium text-gray-900 mb-2">{doc.docType}</p>
                        <div className="flex flex-wrap gap-2">
                          {doc.fileUrl && (
                            <a
                              href={docUrl(doc.fileUrl)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 text-sm font-semibold"
                            >
                              📄 View Document
                            </a>
                          )}
                          {doc.selfieUrl && (
                            <a
                              href={docUrl(doc.selfieUrl)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 text-sm font-semibold"
                            >
                              🤳 View Selfie
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Remarks</label>
                  <textarea
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Enter remarks (required for rejection)"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    rows={3}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(selectedEntry.user.id)}
                    className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
                  >
                    Approve KYC
                  </button>
                  <button
                    onClick={() => handleReject(selectedEntry.user.id)}
                    className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold"
                  >
                    Reject KYC
                  </button>
                </div>
              </div>
            </div>
          )}
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

export default KYCManagement;
