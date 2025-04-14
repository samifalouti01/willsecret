import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import Dashboard from './pages/Dashboard';
import CreateWill from './pages/CreateWill';
import { FaEnvelope, FaSignOutAlt, FaPlusCircle, FaList } from 'react-icons/fa';
import './App.css';

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('create');
  const [email, setEmail] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });

  useEffect(() => {
    async function checkSession() {
      setLoading(true);
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      setLoading(false);

      supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
      });
    }
    
    checkSession();
  }, []);

  const signIn = async (e) => {
    e.preventDefault();
    setIsLoggingIn(true);
    
    try {
      const { error } = await supabase.auth.signInWithOtp({ 
        email,
        options: {
          emailRedirectTo: window.location.origin
        }
      });
      
      if (error) throw error;
      
      showNotification('Magic link sent! Check your email inbox.', 'success');
      setEmail('');
    } catch (error) {
      showNotification(`Error: ${error.message}`, 'error');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 3000);
  };

  if (loading) {
    return (
      <div className="app-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="login-container">
        <div className="login-box">
          <div className="login-header">
            <h1 className="login-title">Digital Will</h1>
            <p className="login-subtitle">Secure your digital legacy for loved ones</p>
          </div>
          
          {notification.show && (
            <div className={`notification ${notification.type}`}>
              {notification.message}
            </div>
          )}

          <form onSubmit={signIn} className="login-form">
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
              disabled={isLoggingIn}
              className="login-button"
            >
              {isLoggingIn ? (
                <>
                  <span className="login-button-spinner"></span>
                  Sending Link...
                </>
              ) : (
                <>
                  <FaEnvelope size={18} className="mr-2" />
                  Login with Email
                </>
              )}
            </button>
          </form>
          
          <div className="login-footer">
            We'll send you a magic link to your email
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="header">
        <div className="header-content">
          <div className="header-inner">
            <div className="flex items-center">
              <h1 className="header-title">Digital Will</h1>
            </div>
            
            <div className="header-user">
              <span className="header-email">
                {session.user.email}
              </span>
              <button
                onClick={signOut}
                className="logout-button"
              >
                <FaSignOutAlt size={18} className="mr-1" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="main-content">
        <div className="view-controls">
          <h2 className="view-controls-header">
            {view === 'create' ? 'Create New Digital Will' : 'Your Digital Wills'}
          </h2>
          
          <div className="view-controls-buttons">
            <button
              onClick={() => setView('create')}
              className={`view-button ${view === 'create' ? 'create-active' : 'create-inactive'}`}
            >
              <FaPlusCircle size={18} className="mr-1" />
              Create New
            </button>
            <button
              onClick={() => setView('list')}
              className={`view-button ${view === 'list' ? 'list-active' : 'list-inactive'}`}
            >
              <FaList size={18} className="mr-1" />
              View All
            </button>
          </div>
        </div>

        {view === 'create' ? <CreateWill /> : <Dashboard />}
      </main>
    </div>
  );
}

export default App;