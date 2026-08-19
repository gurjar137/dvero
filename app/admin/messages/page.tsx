'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/components/admin/Toast';
import { ContactMessage } from '@/lib/types';

type MessageFilter = 'all' | 'new' | 'read' | 'resolved';

export default function AdminContactMessagesPage() {
  const showToast = useToast();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<MessageFilter>('all');
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMessages(data ? (data as ContactMessage[]) : []);
    } catch (err: any) {
      console.error('Error fetching contact messages:', err);
      showToast('Could not load messages: ' + (err?.message || ''));
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const handleUpdateStatus = async (id: string, newStatus: 'new' | 'read' | 'resolved') => {
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('contact_messages')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      showToast(`Message status updated to ${newStatus.toUpperCase()}`);
      setMessages(prev => prev.map(m => (m.id === id ? { ...m, status: newStatus } : m)));

      if (selectedMessage && selectedMessage.id === id) {
        setSelectedMessage(prev => (prev ? { ...prev, status: newStatus } : null));
      }
    } catch (err: any) {
      console.error('Error updating status:', err);
      showToast('Could not update status: ' + (err?.message || ''));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteMessage = async (id: string) => {
    if (typeof window !== 'undefined' && !window.confirm('Are you sure you want to delete this message? This cannot be undone.')) {
      return;
    }

    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('contact_messages')
        .delete()
        .eq('id', id);

      if (error) throw error;

      showToast('Message deleted successfully');
      setMessages(prev => prev.filter(m => m.id !== id));
      if (selectedMessage?.id === id) {
        setSelectedMessage(null);
      }
    } catch (err: any) {
      console.error('Error deleting message:', err);
      showToast('Could not delete message: ' + (err?.message || ''));
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenDetails = (msg: ContactMessage) => {
    setSelectedMessage(msg);
    // Automatically mark as read if it is currently 'new'
    if (msg.status === 'new') {
      handleUpdateStatus(msg.id, 'read');
    }
  };

  const filteredMessages = messages.filter(m => {
    if (filter === 'new') return m.status === 'new';
    if (filter === 'read') return m.status === 'read';
    if (filter === 'resolved') return m.status === 'resolved';
    return true;
  });

  const newCount = messages.filter(m => m.status === 'new').length;
  const readCount = messages.filter(m => m.status === 'read').length;
  const resolvedCount = messages.filter(m => m.status === 'resolved').length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-line pb-4">
        <div>
          <h1 className="font-oswald text-2xl uppercase tracking-wider text-ink flex items-center gap-3">
            <span>Customer Contact Messages</span>
            {newCount > 0 && (
              <span className="bg-amber-500 text-white font-mono text-xs px-2.5 py-0.5 rounded-full font-semibold">
                {newCount} NEW
              </span>
            )}
          </h1>
          <p className="text-xs text-mute mt-1 font-inter">
            View, manage, and respond to incoming customer inquiries sent through the Contact Us page.
          </p>
        </div>

        <button
          onClick={() => fetchMessages()}
          className="border border-line font-oswald text-xs uppercase tracking-wider px-4 py-2.5 rounded hover:border-ink transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5">
            <path d="M23 4v6h-6" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-px border-b border-line">
        {[
          { id: 'all', label: 'All Messages', count: messages.length },
          { id: 'new', label: 'New', count: newCount },
          { id: 'read', label: 'Read', count: readCount },
          { id: 'resolved', label: 'Resolved', count: resolvedCount },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setFilter(t.id as MessageFilter)}
            className={`font-oswald text-xs uppercase tracking-wider px-4 py-2.5 border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              filter === t.id ? 'border-ink text-ink font-semibold' : 'border-transparent text-mute hover:text-ink'
            }`}
          >
            <span>{t.label}</span>
            <span className="font-mono text-[0.68rem] bg-panel border border-line px-1.5 py-0.2 rounded-full">
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Messages List Table / Cards */}
      {loading ? (
        <div className="text-center py-16 font-oswald text-xs uppercase text-mute">
          Loading messages...
        </div>
      ) : filteredMessages.length === 0 ? (
        <div className="bg-panel border border-line rounded-lg p-12 text-center text-mute space-y-2">
          <p className="font-oswald text-lg uppercase text-ink">No Messages Found</p>
          <p className="text-xs font-inter">There are no contact form submissions matching this filter.</p>
        </div>
      ) : (
        <div className="bg-panel border border-line rounded-lg shadow-sm2 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-line bg-bg font-oswald text-[0.7rem] uppercase text-mute tracking-wider">
                  <th className="p-4 font-normal">Status</th>
                  <th className="p-4 font-normal">Customer</th>
                  <th className="p-4 font-normal">Subject</th>
                  <th className="p-4 font-normal">Received Date</th>
                  <th className="p-4 font-normal text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line text-xs font-inter">
                {filteredMessages.map(msg => (
                  <tr
                    key={msg.id}
                    onClick={() => handleOpenDetails(msg)}
                    className={`hover:bg-bg/60 transition-colors cursor-pointer ${
                      msg.status === 'new' ? 'bg-amber-500/5 font-medium' : ''
                    }`}
                  >
                    {/* Status Badge */}
                    <td className="p-4 whitespace-nowrap">
                      <span
                        className={`inline-block font-oswald text-[0.62rem] uppercase tracking-wider px-2.5 py-0.5 rounded border ${
                          msg.status === 'new'
                            ? 'bg-amber-500 text-white border-amber-600'
                            : msg.status === 'resolved'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : 'bg-bg text-mute border-line'
                        }`}
                      >
                        {msg.status}
                      </span>
                    </td>

                    {/* Customer Info */}
                    <td className="p-4">
                      <div className="font-oswald text-xs uppercase text-ink font-semibold">{msg.name}</div>
                      <div className="text-[0.72rem] text-mute font-mono">{msg.email}</div>
                    </td>

                    {/* Subject snippet */}
                    <td className="p-4">
                      <div className="text-ink font-medium truncate max-w-xs">{msg.subject}</div>
                      <div className="text-[0.72rem] text-mute truncate max-w-sm font-normal">
                        {msg.message}
                      </div>
                    </td>

                    {/* Date */}
                    <td className="p-4 whitespace-nowrap text-mute font-mono text-[0.75rem]">
                      {new Date(msg.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>

                    {/* Action buttons */}
                    <td className="p-4 text-right whitespace-nowrap" onClick={e => e.stopPropagation()}>
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenDetails(msg)}
                          className="px-2.5 py-1 bg-bg border border-line rounded font-oswald text-[0.68rem] uppercase hover:border-ink transition-colors"
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => handleDeleteMessage(msg.id)}
                          className="px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 rounded font-oswald text-[0.68rem] uppercase hover:bg-red-100 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Message Details Modal Drawer */}
      {selectedMessage && (
        <div
          className="fixed inset-0 z-50 bg-ink/80 backdrop-blur-sm flex justify-center items-center p-4 animate-fadeIn"
          onClick={() => setSelectedMessage(null)}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-panel border border-line rounded-xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto"
          >
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-line pb-4">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="font-oswald text-lg uppercase text-ink">Message Details</h3>
                  <span
                    className={`font-oswald text-[0.65rem] uppercase tracking-wider px-2.5 py-0.5 rounded border ${
                      selectedMessage.status === 'new'
                        ? 'bg-amber-500 text-white border-amber-600'
                        : selectedMessage.status === 'resolved'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : 'bg-bg text-mute border-line'
                    }`}
                  >
                    {selectedMessage.status}
                  </span>
                </div>
                <div className="text-xs text-mute font-mono mt-1">
                  Received on{' '}
                  {new Date(selectedMessage.created_at).toLocaleString('en-IN', {
                    dateStyle: 'full',
                    timeStyle: 'short',
                  })}
                </div>
              </div>

              <button
                onClick={() => setSelectedMessage(null)}
                className="text-mute hover:text-ink font-oswald text-sm p-1"
              >
                ✕
              </button>
            </div>

            {/* Sender Details */}
            <div className="bg-bg border border-line p-4 rounded-lg grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-inter">
              <div>
                <div className="font-oswald text-[0.68rem] uppercase text-mute tracking-wider">Sender Name</div>
                <div className="font-oswald text-sm uppercase text-ink font-semibold mt-0.5">
                  {selectedMessage.name}
                </div>
              </div>
              <div>
                <div className="font-oswald text-[0.68rem] uppercase text-mute tracking-wider">Email Address</div>
                <a
                  href={`mailto:${selectedMessage.email}`}
                  className="font-mono text-ink font-medium hover:text-camelDeep transition-colors mt-0.5 block"
                >
                  {selectedMessage.email}
                </a>
              </div>
            </div>

            {/* Subject */}
            <div className="space-y-1">
              <div className="font-oswald text-[0.68rem] uppercase text-mute tracking-wider">Subject</div>
              <div className="font-oswald text-base text-ink font-medium">{selectedMessage.subject}</div>
            </div>

            {/* Full Message Body */}
            <div className="space-y-1">
              <div className="font-oswald text-[0.68rem] uppercase text-mute tracking-wider">Message Content</div>
              <div className="bg-bg border border-line p-4 rounded-lg text-xs sm:text-sm text-ink leading-relaxed font-inter whitespace-pre-wrap">
                {selectedMessage.message}
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-4 border-t border-line flex flex-wrap justify-between items-center gap-3">
              <div className="flex gap-2 flex-wrap">
                {selectedMessage.status !== 'read' && (
                  <button
                    disabled={actionLoading}
                    onClick={() => handleUpdateStatus(selectedMessage.id, 'read')}
                    className="bg-bg border border-line text-ink font-oswald text-xs uppercase tracking-wider px-4 py-2 rounded hover:border-ink transition-colors cursor-pointer"
                  >
                    Mark as Read
                  </button>
                )}

                {selectedMessage.status !== 'resolved' && (
                  <button
                    disabled={actionLoading}
                    onClick={() => handleUpdateStatus(selectedMessage.id, 'resolved')}
                    className="bg-emerald-700 text-white font-oswald text-xs uppercase tracking-wider px-4 py-2 rounded hover:bg-emerald-800 transition-colors cursor-pointer"
                  >
                    Mark as Resolved
                  </button>
                )}

                {selectedMessage.status !== 'new' && (
                  <button
                    disabled={actionLoading}
                    onClick={() => handleUpdateStatus(selectedMessage.id, 'new')}
                    className="bg-bg border border-line text-mute font-oswald text-xs uppercase tracking-wider px-4 py-2 rounded hover:text-ink transition-colors cursor-pointer"
                  >
                    Mark as New
                  </button>
                )}
              </div>

              <button
                disabled={actionLoading}
                onClick={() => handleDeleteMessage(selectedMessage.id)}
                className="bg-red-600 text-white font-oswald text-xs uppercase tracking-wider px-4 py-2 rounded hover:bg-red-700 transition-colors cursor-pointer"
              >
                Delete Message
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
