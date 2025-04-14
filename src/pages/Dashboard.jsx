import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { FaShieldAlt, FaShareAlt, FaHashtag, FaFileAlt, FaEnvelope, FaCalendarAlt, FaLock, 
  FaTrashAlt, FaEye, FaFilePdf, FaFileImage, FaDownload, FaTable, FaListUl, FaCheck, FaHourglassHalf } from 'react-icons/fa';
import '../App.css';

export default function Dashboard() {
  const [wills, setWills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWill, setSelectedWill] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [viewMode, setViewMode] = useState('card');

  useEffect(() => {
    fetchWills();
  }, []);

  const fetchWills = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data, error } = await supabase
        .from('wills')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWills(data || []);
    } catch (error) {
      console.error('Error loading wills:', error);
    } finally {
      setLoading(false);
    }
  };

  const getWillIcon = (title) => {
    if (title.includes('Passphrase')) return <FaShieldAlt size={20} />;
    if (title.includes('Social Media')) return <FaShareAlt size={20} />;
    if (title.includes('Hash')) return <FaHashtag size={20} />;
    return <FaFileAlt size={20} />;
  };

  const getFileIcon = (fileUrl) => {
    if (!fileUrl) return null;
    
    if (fileUrl.toLowerCase().endsWith('.pdf')) {
      return <FaFilePdf size={18} className="text-red-600" />;
    } else {
      return <FaFileImage size={18} className="text-blue-600" />;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const deleteWill = async (id) => {
    if (!window.confirm('Are you sure you want to delete this digital will?')) return;
    
    try {
      const { error } = await supabase
        .from('wills')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      setWills(wills.filter(will => will.id !== id));
    } catch (error) {
      console.error('Error deleting will:', error);
    }
  };

  const viewWillDetails = (will) => {
    setSelectedWill(will);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedWill(null);
  };

  const downloadFile = async (fileUrl) => {
    if (!fileUrl) return;
    
    try {
      window.open(fileUrl, '_blank');
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  const renderCardView = () => (
    <div className="card-view">
      {wills.map((will) => (
        <div key={will.id} className="card">
          <div className="card-header">
            <div className="flex items-center">
              <div className="card-icon">
                {getWillIcon(will.title)}
              </div>
              <div>
                <h3 className="card-title">{will.title}</h3>
                <p className="card-content">
                  {will.content.length > 100 
                    ? `${will.content.substring(0, 100)}...` 
                    : will.content}
                </p>
              </div>
            </div>
            <div className="card-actions">
              <button 
                onClick={() => viewWillDetails(will)}
                className="card-action-button view"
                aria-label="View"
              >
                <FaEye size={18} />
              </button>
              <button 
                onClick={() => deleteWill(will.id)}
                className="card-action-button delete"
                aria-label="Delete"
              >
                <FaTrashAlt size={18} />
              </button>
            </div>
          </div>
          
          <div className="card-details">
            <div className="card-detail email">
              <FaEnvelope size={14} className="mr-1" />
              <span>{will.recipient_email}</span>
            </div>
            <div className="card-detail timeframe">
              <FaCalendarAlt size={14} className="mr-1" />
              <span>Delivery after {will.delivery_condition} of inactivity</span>
            </div>
            {will.encrypted && (
              <div className="card-detail encrypted">
                <FaLock size={14} className="mr-1" />
                <span>Encrypted</span>
              </div>
            )}
            {will.file_url && (
              <div className="card-detail attachment">
                {getFileIcon(will.file_url)}
                <span className="ml-1">Attachment</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  const renderTableView = () => (
    <div className="table-container">
      <table className="table">
        <thead>
          <tr>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Title
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Recipient
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Delivery Timeframe
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Created
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {wills.map((will) => (
            <tr key={will.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="table-icon">
                    {getWillIcon(will.title)}
                  </div>
                  <div className="ml-3">
                    <div className="table-title">{will.title}</div>
                    <div className="table-icons">
                      {will.encrypted && <FaLock size={12} className="text-green-600" />}
                      {will.file_url && getFileIcon(will.file_url)}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <div className="table-email">{will.recipient_email}</div>
                {will.recipient_phone && (
                  <div className="table-phone">{will.recipient_phone}</div>
                )}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <span className="table-timeframe">{will.delivery_condition}</span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                {will.is_sent ? (
                  <span className="table-status delivered">
                    <FaCheck className="mr-1" /> Delivered
                  </span>
                ) : (
                  <span className="table-status pending">
                    <FaHourglassHalf className="mr-1" /> Pending
                  </span>
                )}
              </td>
              <td className="px-4 py-3 whitespace-nowrap table-date">
                {formatDate(will.created_at)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap table-actions">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => viewWillDetails(will)}
                    className="table-action-button view"
                  >
                    <FaEye size={16} />
                  </button>
                  <button
                    onClick={() => deleteWill(will.id)}
                    className="table-action-button delete"
                  >
                    <FaTrashAlt size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2 className="dashboard-title">Your Digital Wills</h2>
        <div className="flex items-center">
          <span className="will-count">
            {wills.length} {wills.length === 1 ? 'Will' : 'Wills'}
          </span>
          <div className="view-toggle">
            <button
              onClick={() => setViewMode('card')}
              className={`view-toggle-button ${viewMode === 'card' ? 'active' : ''}`}
              title="Card View"
            >
              <FaListUl size={16} />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`view-toggle-button ${viewMode === 'table' ? 'active' : ''}`}
              title="Table View"
            >
              <FaTable size={16} />
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading your digital wills...</p>
        </div>
      ) : wills.length === 0 ? (
        <div className="empty-state">
          <FaFileAlt size={48} className="mx-auto text-gray-400" />
          <h3 className="empty-title">No digital wills yet</h3>
          <p className="empty-text">Create your first digital will to get started.</p>
        </div>
      ) : viewMode === 'card' ? (
        renderCardView()
      ) : (
        renderTableView()
      )}

      {showModal && selectedWill && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-content">
              <div className="modal-header">
                <h3 className="modal-title">{selectedWill.title}</h3>
                <button 
                  onClick={closeModal}
                  className="modal-close"
                >
                  ✕
                </button>
              </div>
              
              <div className="modal-body">
                <div>
                  <h4 className="modal-section-title">Message Content</h4>
                  <p className="modal-content-text">{selectedWill.content}</p>
                </div>
                
                <div className="modal-grid">
                  <div>
                    <h4 className="modal-section-title">Recipient Email</h4>
                    <p className="modal-email">{selectedWill.recipient_email}</p>
                  </div>
                  
                  {selectedWill.recipient_phone && (
                    <div>
                      <h4 className="modal-section-title">Recipient Phone</h4>
                      <p className="modal-phone">{selectedWill.recipient_phone}</p>
                    </div>
                  )}
                </div>
                
                <div>
                  <h4 className="modal-section-title">Delivery Condition</h4>
                  <p className="modal-delivery">Will be delivered after {selectedWill.delivery_condition} of inactivity</p>
                </div>
                
                {selectedWill.encrypted && (
                  <div className="modal-encrypted">
                    <div className="modal-encrypted-header">
                      <FaLock size={16} className="text-green-500 mr-2" />
                      <h4 className="modal-encrypted-title">End-to-end Encrypted</h4>
                    </div>
                    <p className="modal-encrypted-text">
                      This message is protected with end-to-end encryption.
                    </p>
                  </div>
                )}

                {selectedWill.file_url && (
                  <div>
                    <h4 className="modal-section-title">Attachment</h4>
                    <button
                      onClick={() => downloadFile(selectedWill.file_url)}
                      className="modal-attachment-button"
                    >
                      {getFileIcon(selectedWill.file_url)}
                      <span>Download Attachment</span>
                    </button>
                  </div>
                )}
              </div>
              
              <div className="modal-actions">
                <button
                  onClick={closeModal}
                  className="modal-close-button"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}