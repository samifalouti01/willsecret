import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { FaLock, FaCreditCard, FaCheckCircle } from 'react-icons/fa';
import '../App.css';

const plans = {
  basic: { name: 'Basic', monthly: { price: 8 }, yearly: { price: 96 }, wills: 3 },
  standard: { name: 'Standard', monthly: { price: 23 }, yearly: { price: 276 }, wills: 100 },
  pro: { name: 'Pro', monthly: { price: 135 }, yearly: { price: 1620 }, wills: 'Unlimited' }
};

export default function Settings() {
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [passwordData, setPasswordData] = useState({ newPassword: '', confirmPassword: '' });
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUserAndSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      const { data } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      setSubscription(data);
    };
    fetchUserAndSubscription();
  }, []);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setNotification({ show: true, message: 'Passwords do not match', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: passwordData.newPassword });
      if (error) throw error;
      setNotification({ show: true, message: 'Password updated successfully', type: 'success' });
      setPasswordData({ newPassword: '', confirmPassword: '' });
    } catch (error) {
      setNotification({ show: true, message: `Error: ${error.message}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handlePlanChange = async (planType) => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();

      // Redirect to your PayPal checkout backend
      const response = await fetch('/api/create-paypal-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          planType,
          billingCycle,
          price: plans[planType][billingCycle].price,
          userId: user.id
        })
      });

      const { approvalUrl } = await response.json();
      window.location.href = approvalUrl;
    } catch (error) {
      setNotification({ show: true, message: `Error: ${error.message}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="settings-container">
      <h2 className="settings-title">Settings</h2>

      {notification.show && (
        <div className={`notification ${notification.type}`}>{notification.message}</div>
      )}

      <div className="settings-section">
        <h3 className="section-title">Change Password</h3>
        <form onSubmit={handlePasswordChange} className="password-form">
          <div className="form-group">
            <label htmlFor="newPassword">New Password</label>
            <input
              id="newPassword"
              type="password"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              required
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              required
              className="form-input"
            />
          </div>
          <button type="submit" disabled={loading} className="submit-button">
            <FaLock className="mr-1" /> Update Password
          </button>
        </form>
      </div>

      <div className="settings-section">
        <h3 className="section-title">Subscription Plan</h3>
        <div className="billing-toggle">
          <button
            className={`toggle-button ${billingCycle === 'monthly' ? 'active' : ''}`}
            onClick={() => setBillingCycle('monthly')}
          >
            Monthly
          </button>
          <button
            className={`toggle-button ${billingCycle === 'yearly' ? 'active' : ''}`}
            onClick={() => setBillingCycle('yearly')}
          >
            Yearly (Save up to 12%)
          </button>
        </div>

        <div className="plans-grid">
          {Object.entries(plans).map(([key, plan]) => (
            <div key={key} className="plan-card">
              <h4 className="plan-title">{plan.name}</h4>
              <p className="plan-wills">{plan.wills} Wills</p>
              <p className="plan-price">${plan[billingCycle].price}/{billingCycle}</p>
              {subscription?.plan_type === key && subscription?.billing_cycle === billingCycle ? (
                <button className="plan-button active" disabled>
                  <FaCheckCircle className="mr-1" /> Current Plan
                </button>
              ) : (
                <button
                  className="plan-button"
                  onClick={() => handlePlanChange(key)}
                  disabled={loading}
                >
                  <FaCreditCard className="mr-1" /> Select Plan
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
