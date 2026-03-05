import { useEffect, useState } from 'react';
import { adminApi } from '../../services/adminApi';
import { showToast } from '../../utils/toast';

interface Ticket {
  id: string;
  userId: string;
  subject: string;
  description: string;
  status: string;
  priority?: string;
  assignedTo?: string;
  createdAt: string;
}

const Support = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('OPEN');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  useEffect(() => {
    loadTickets();
  }, [filter]);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const response = await adminApi.getAllTickets({ status: filter });
      if (response.success && response.data) {
        const data = response.data as any;
        setTickets(Array.isArray(data) ? data : data.data || []);
      }
    } catch (error) {
      console.error('Failed to load tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const response = await adminApi.updateTicketStatus(id, status);
      if (response.success) {
        showToast.success('Ticket status updated successfully');
        loadTickets();
      } else {
        showToast.error(response.error || 'Failed to update ticket status');
      }
    } catch (error) {
      showToast.error('Failed to update ticket status');
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      OPEN: 'bg-blue-100 text-blue-800',
      PENDING: 'bg-yellow-100 text-yellow-800',
      CLOSED: 'bg-gray-100 text-gray-800',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  const getPriorityBadge = (priority?: string) => {
    if (!priority) return null;
    const colors: Record<string, string> = {
      HIGH: 'bg-red-100 text-red-800',
      MEDIUM: 'bg-yellow-100 text-yellow-800',
      LOW: 'bg-green-100 text-green-800',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[priority] || 'bg-gray-100 text-gray-800'}`}>
        {priority}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Support Tickets</h1>
        <p className="text-gray-600 mt-1">Manage customer support tickets</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('OPEN')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'OPEN' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            Open
          </button>
          <button
            onClick={() => setFilter('PENDING')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'PENDING' ? 'bg-yellow-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter('CLOSED')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'CLOSED' ? 'bg-gray-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            Closed
          </button>
          <button
            onClick={() => setFilter('')}
            className={`px-4 py-2 rounded-lg ${
              filter === '' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            All
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tickets List */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading tickets...</div>
          ) : tickets.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No tickets found</div>
          ) : (
            <div className="divide-y">
              {tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  onClick={() => setSelectedTicket(ticket)}
                  className={`p-4 cursor-pointer hover:bg-gray-50 ${
                    selectedTicket?.id === ticket.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">{ticket.subject}</h3>
                    {getStatusBadge(ticket.status)}
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">{ticket.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    {getPriorityBadge(ticket.priority)}
                    <span className="text-xs text-gray-500">
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Ticket Details */}
        <div className="bg-white rounded-lg shadow-md p-6">
          {selectedTicket ? (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold mb-2">{selectedTicket.subject}</h2>
                <div className="flex items-center gap-2 mb-4">
                  {getStatusBadge(selectedTicket.status)}
                  {getPriorityBadge(selectedTicket.priority)}
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">User ID</p>
                <p className="text-sm font-medium">{selectedTicket.userId}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Description</p>
                <p className="text-sm">{selectedTicket.description}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Created</p>
                <p className="text-sm">{new Date(selectedTicket.createdAt).toLocaleString()}</p>
              </div>
              <div className="pt-4 border-t space-y-2">
                <button
                  onClick={() => handleUpdateStatus(selectedTicket.id, 'PENDING')}
                  className="w-full px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                >
                  Mark Pending
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedTicket.id, 'CLOSED')}
                  className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Close Ticket
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500">
              Select a ticket to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Support;
