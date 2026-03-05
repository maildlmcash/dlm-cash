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
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  createdAt: string;
}

const KYCManagement = () => {
  const [documents, setDocuments] = useState<KycDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedDoc, setSelectedDoc] = useState<KycDocument | null>(null);
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
        const data = response.data as any;
        setDocuments(Array.isArray(data) ? data : data.data || []);
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages || 1);
        }
      }
    } catch (error) {
      console.error('Failed to load KYC documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    confirm(
      'Approve KYC',
      'Are you sure you want to approve this KYC document?',
      async () => {
        try {
          const response = await adminApi.approveKyc(id, remarks);
          if (response.success) {
            showToast.success('KYC approved successfully');
            loadPendingKyc();
            setSelectedDoc(null);
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

  const handleReject = async (id: string) => {
    if (!remarks.trim()) {
      showToast.warning('Please provide remarks for rejection');
      return;
    }
    confirm(
      'Reject KYC',
      'Are you sure you want to reject this KYC document?',
      async () => {
        try {
          const response = await adminApi.rejectKyc(id, remarks);
          if (response.success) {
            showToast.success('KYC rejected successfully');
            loadPendingKyc();
            setSelectedDoc(null);
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">KYC Management</h1>
        <p className="text-gray-600 mt-1 text-sm sm:text-base">Review and approve KYC documents</p>
      </div>

      {loading ? (
        <div className="p-8 text-center text-gray-500">Loading KYC documents...</div>
      ) : documents.length === 0 ? (
        <div className="p-8 text-center text-gray-500">No pending KYC documents</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Document List */}
          <div className="bg-white rounded-lg shadow-md p-5 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-900">Pending Documents</h2>
            <div className="space-y-3">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className={`border rounded-lg p-4 cursor-pointer hover:border-blue-500 transition-colors ${
                    selectedDoc?.id === doc.id ? 'border-blue-500 bg-blue-50' : ''
                  }`}
                  onClick={() => setSelectedDoc(doc)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{doc.user.name || doc.user.email || doc.user.phone}</p>
                      <p className="text-sm text-gray-600 mt-0.5">{doc.docType}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(doc.createdAt).toLocaleDateString()}
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

          {/* Document Details */}
          {selectedDoc && (
            <div className="bg-white rounded-lg shadow-md p-5 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-900">Document Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">User</label>
                  <p className="text-gray-900">
                    {selectedDoc.user.name || selectedDoc.user.email || selectedDoc.user.phone}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Document Type</label>
                  <p className="text-gray-900">{selectedDoc.docType}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Document</label>
                  {selectedDoc.fileUrl && (
                    <a
                      href={(() => {
                        // Get base URL and remove /api suffix if present (static files are at root)
                        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
                        const baseUrl = apiBaseUrl.replace(/\/api$/, '');
                        
                        // Extract filename from path (handle both 'uploads/filename.jpg' and just 'filename.jpg')
                        let filename = selectedDoc.fileUrl;
                        if (filename.includes('/')) {
                          filename = filename.split('/').pop() || filename;
                        } else if (filename.includes('\\')) {
                          filename = filename.split('\\').pop() || filename;
                        }
                        
                        return `${baseUrl}/uploads/${filename}`;
                      })()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 transition-colors w-fit text-sm font-semibold mb-2"
                    >
                      📄 View Document
                    </a>
                  )}
                  {selectedDoc.selfieUrl && (
                    <a
                      href={(() => {
                        // Get base URL and remove /api suffix if present (static files are at root)
                        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
                        const baseUrl = apiBaseUrl.replace(/\/api$/, '');
                        
                        // Extract filename from path (handle both 'uploads/filename.jpg' and just 'filename.jpg')
                        let filename = selectedDoc.selfieUrl;
                        if (filename.includes('/')) {
                          filename = filename.split('/').pop() || filename;
                        } else if (filename.includes('\\')) {
                          filename = filename.split('\\').pop() || filename;
                        }
                        
                        return `${baseUrl}/uploads/${filename}`;
                      })()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 transition-colors w-fit text-sm font-semibold"
                    >
                      🤳 View Selfie
                    </a>
                  )}
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
                    onClick={() => handleApprove(selectedDoc.id)}
                    className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(selectedDoc.id)}
                    className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold"
                  >
                    Reject
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
