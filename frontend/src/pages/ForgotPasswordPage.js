import React, { useState } from 'react';
import { authAPI } from '../utils/api';
import { useToast } from '../context/ToastContext';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authAPI.forgotPassword({ email });
      addToast('Reset link sent to your email!', 'success');
    } catch (err) {
      addToast(err.response?.data?.message || 'Something went wrong', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ /* use same background styles as LoginPage */ }}>
       <form onSubmit={handleSubmit}>
         <input 
           type="email" 
           placeholder="Enter your email" 
           value={email} 
           onChange={(e) => setEmail(e.target.value)} 
           required 
         />
         <button type="submit" disabled={loading}>
           {loading ? 'Sending...' : 'Send Reset Link'}
         </button>
       </form>
    </div>
  );
}