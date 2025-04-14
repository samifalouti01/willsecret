import React, { useState, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { FaShieldAlt, FaShareAlt, FaHashtag, FaFileAlt, FaEnvelope, FaPhone, FaCalendarAlt, FaLock, FaUpload, FaFilePdf, FaFileImage, FaTimes } from 'react-icons/fa';
import '../App.css';

const willTypes = [
  { label: 'Passphrase', icon: <FaShieldAlt />, type: 'passphrase' },
  { label: 'Social Media', icon: <FaShareAlt />, type: 'social' },
  { label: 'Hash', icon: <FaHashtag />, type: 'hash' },
  { label: 'Custom Message', icon: <FaFileAlt />, type: 'custom' }
];

const timeframes = [
  { value: '3 months', label: '3 Months' },
  { value: '6 months', label: '6 Months' },
  { value: '1 year', label: '1 Year' },
  { value: '5 years', label: '5 Years' }
];

export default function CreateWill() {
  const [form, setForm] = useState({
    title: '',
    content: '',
    recipient_email: '',
    recipient_phone: '',
    delivery_condition: '3 months',
    encrypted: false,
    file_url: ''
  });
  const [selectedType, setSelectedType] = useState('custom');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [fileUpload, setFileUpload] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileType = file.type;
    const isImage = fileType.startsWith('image/');
    const isPdf = fileType === 'application/pdf';

    if (!isImage && !isPdf) {
      showNotification('Only image or PDF files are allowed', 'error');
      resetFileInput();
      return;
    }

    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > 15) {
      showNotification('File size exceeds the 15MB limit', 'error');
      resetFileInput();
      return;
    }

    setFileUpload(file);

    if (isImage) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview({
          url: reader.result,
          type: 'image',
          name: file.name,
          size: fileSizeMB.toFixed(2)
        });
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview({
        url: null,
        type: 'pdf',
        name: file.name,
        size: fileSizeMB.toFixed(2)
      });
    }
  };

  const resetFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setFileUpload(null);
    setFilePreview(null);
    setUploadProgress(0);
  };

  const handleFileRemove = () => {
    resetFileInput();
    setForm({ ...form, file_url: '' });
  };

  const uploadFile = async () => {
    if (!fileUpload) return null;

    const fileExt = fileUpload.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = `${Date.now()}_${fileName}`;

    try {
      setUploadProgress(0);
      
      const { data, error } = await supabase.storage
        .from('assets')
        .upload(filePath, fileUpload, {
          cacheControl: '3600',
          upsert: false,
          onUploadProgress: (progress) => {
            const percentage = (progress.loaded / progress.total) * 100;
            setUploadProgress(Math.round(percentage));
          }
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('will_assets')
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (error) {
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        showNotification('You must be logged in', 'error');
        return;
      }

      if (!form.title || !form.content || !form.recipient_email) {
        showNotification('Please fill in all required fields', 'error');
        setIsSubmitting(false);
        return;
      }

      let fileUrl = form.file_url;
      if (fileUpload) {
        try {
          fileUrl = await uploadFile();
        } catch (error) {
          throw new Error(`File upload failed: ${error.message}`);
        }
      }

      const { error } = await supabase.from('wills').insert({
        user_id: user.id,
        ...form,
        file_url: fileUrl
      });

      if (error) throw error;
      
      showNotification('Digital will saved successfully', 'success');
      resetForm();
    } catch (error) {
      showNotification(`Error: ${error.message || 'Failed to create digital will'}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setForm({
      title: '',
      content: '',
      recipient_email: '',
      recipient_phone: '',
      delivery_condition: '3 months',
      encrypted: false,
      file_url: ''
    });
    setSelectedType('custom');
    resetFileInput();
  };

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 3000);
  };

  const selectWillType = (type, label) => {
    setSelectedType(type);
    setForm({ ...form, title: label });
  };

  return (
    <div className="create-will-container">
      <h2 className="create-will-title">Create Digital Will</h2>
      
      {notification.show && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="will-type-label">Will Type</label>
          <div className="will-type-grid">
            {willTypes.map((option) => (
              <button
                type="button"
                key={option.type}
                onClick={() => selectWillType(option.type, option.label)}
                className={`will-type-button ${selectedType === option.type ? 'active' : ''}`}
              >
                <span>
                  {React.cloneElement(option.icon, { 
                    size: 24,
                    color: selectedType === option.type ? '#ffffff' : '#4B5563'
                  })}
                </span>
                <span className="will-type-label-text">{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="form-section">
          <div className="form-group">
            <label htmlFor="title" className="form-group-label">
              Title <span className="required">*</span>
            </label>
            <input
              id="title"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Enter a title for your digital will"
              className="form-input-field"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="content" className="form-group-label">
              Message Content <span className="required">*</span>
            </label>
            <textarea
              id="content"
              name="content"
              value={form.content}
              onChange={handleChange}
              rows={6}
              placeholder="Type your message here..."
              className="form-textarea"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-group-label">
              <FaUpload className="mr-1" /> Attachment
            </label>
            <div className="mt-1 flex items-center">
              <label className="file-upload-label">
                <span>Upload File (PDF or Image)</span>
                <input
                  type="file"
                  className="file-upload-input"
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                  ref={fileInputRef}
                />
              </label>
              <span className="file-size-info">
                Max size: 15MB
              </span>
            </div>

            {filePreview && (
              <div className="file-preview">
                <div className="file-preview-header">
                  <div className="file-preview-info">
                    {filePreview.type === 'pdf' ? (
                      <FaFilePdf size={24} className="text-red-500 mr-2" />
                    ) : (
                      <FaFileImage size={24} className="text-blue-500 mr-2" />
                    )}
                    <div>
                      <p className="file-preview-name">{filePreview.name}</p>
                      <p className="file-preview-size">{filePreview.size} MB</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleFileRemove}
                    className="file-remove-button"
                  >
                    <FaTimes size={16} />
                  </button>
                </div>

                {filePreview.type === 'image' && (
                  <div className="file-preview-image">
                    <img 
                      src={filePreview.url} 
                      alt="Preview"
                      className="max-h-40 rounded-md mx-auto"
                    />
                  </div>
                )}

                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="upload-progress">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <p className="progress-text">{uploadProgress}%</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="recipient-grid">
            <div className="form-group">
              <label htmlFor="recipient_email" className="form-group-label">
                <FaEnvelope size={14} className="mr-1" />
                Recipient Email <span className="required">*</span>
              </label>
              <input
                id="recipient_email"
                name="recipient_email"
                type="email"
                value={form.recipient_email}
                onChange={handleChange}
                placeholder="email@example.com"
                className="form-input-field"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="recipient_phone" className="form-group-label">
                <FaPhone size={14} className="mr-1" />
                Recipient Phone
              </label>
              <input
                id="recipient_phone"
                name="recipient_phone"
                type="tel"
                value={form.recipient_phone}
                onChange={handleChange}
                placeholder="+1 (123) 456-7890"
                className="form-input-field"
              />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="delivery_condition" className="form-group-label">
              <FaCalendarAlt size={14} className="mr-1" />
              Delivery Timeframe <span className="required">*</span>
            </label>
            <select
              id="delivery_condition"
              name="delivery_condition"
              value={form.delivery_condition}
              onChange={handleChange}
              className="form-select"
              required
            >
              {timeframes.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label} of Inactivity
                </option>
              ))}
            </select>
            <p className="select-info">
              Your message will be delivered after this period of inactivity.
            </p>
          </div>
          
          <div className="checkbox-group">
            <input
              id="encrypted"
              type="checkbox"
              name="encrypted"
              checked={form.encrypted}
              onChange={handleChange}
              className="form-checkbox"
            />
            <label htmlFor="encrypted" className="checkbox-label">
              <FaLock size={14} className="mr-1" />
              Encrypt this message with end-to-end encryption
            </label>
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={resetForm}
            className="cancel-button"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="submit-button"
          >
            {isSubmitting ? 'Saving...' : 'Save Digital Will'}
          </button>
        </div>
      </form>
    </div>
  );
}