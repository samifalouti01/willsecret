import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { FaEnvelope, FaArrowLeft } from 'react-icons/fa';
import '../App.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) throw error;

      setNotification({
        show: true,
        message: 'Password reset email sent! Check your inbox.',
        type: 'success'
      });
      setEmail('');
    } catch (error) {
      setNotification({
        show: true,
        message: `Error: ${error.message}`,
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <h1 className="login-title">Reset Password</h1>
          <p className="login-subtitle">Enter your email to receive a reset link</p>
        </div>

        {notification.show && (
          <div className={`notification ${notification.type}`}>
            {notification.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div>
            <label htmlFor="email" className="form-label">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="form-input"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="login-button"
          >
            {isSubmitting ? (
              <>
                <span className="login-button-spinner"></span>
                Sending...
              </>
            ) : (
              <>
                <FaEnvelope size={18} className="mr-2" />
                Send Reset Link
              </>
            )}
          </button>
        </form>

        <a href="/login" className="back-to-login">
          <FaArrowLeft className="mr-1" /> Back to Login
        </a>
      </div>
    </div>
  );
}