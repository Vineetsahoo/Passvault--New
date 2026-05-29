import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, AlertCircle } from 'lucide-react';
import axios from 'axios';
import Navbar from './Navbar';
import Footer from './Footer';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const SignIn: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (!email.trim()) throw new Error('Email is required');
      if (!password) throw new Error('Password is required');
      if (!email.includes('@')) throw new Error('Please enter a valid email address');

      const response = await axios.post(
        `${API_URL}/auth/login`,
        { email: email.trim().toLowerCase(), password, rememberMe: false },
        { headers: { 'Content-Type': 'application/json' }, withCredentials: true }
      );

      if (response.data && response.data.success) {
        const { user, accessToken } = response.data.data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('userData', JSON.stringify(user));
        localStorage.setItem('mockAuth', 'true');
        localStorage.setItem('userToken', accessToken);
        localStorage.setItem('mockUser', JSON.stringify(user));
        window.dispatchEvent(new Event('storage'));
        navigate('/dashboard', { replace: true });
      } else {
        throw new Error(response.data?.message || 'Login failed');
      }
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Login failed. Please try again.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#F9F9F7] overflow-hidden min-h-screen">
      <Navbar />

      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 pt-[7rem] md:pt-[8rem] pb-20 flex items-start justify-center">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="border-b-4 border-[#111111] mb-10 pb-6">
            <div
              className="text-[0.65rem] uppercase tracking-[0.2em] text-[#525252] mb-4"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              Secure Access &nbsp;|&nbsp; Authentication
            </div>
            <h1
              className="font-black leading-[0.9]"
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 'clamp(3rem, 8vw, 4rem)',
              }}
            >
              SIGN IN
            </h1>
          </div>

          {/* Error */}
          {error && (
            <div className="border-2 border-[#CC0000] bg-[#FFE5E5] p-4 mb-8 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-[#CC0000] flex-shrink-0 mt-0.5" />
              <p className="text-sm text-[#CC0000]" style={{ fontFamily: "'Lora', serif" }}>{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSignIn} className="space-y-8">
            <div>
              <label
                className="block text-[0.65rem] uppercase tracking-[0.2em] mb-3 text-[#525252]"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-newsprint pr-8"
                  placeholder="your@email.com"
                  disabled={isLoading}
                />
                <Mail className="absolute right-0 bottom-3 h-5 w-5 text-[#525252] pointer-events-none" />
              </div>
            </div>

            <div>
              <label
                className="block text-[0.65rem] uppercase tracking-[0.2em] mb-3 text-[#525252]"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                Master Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-newsprint pr-8"
                  placeholder="••••••••"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 bottom-3 h-5 w-5 text-[#525252] hover:text-[#111111] transition-colors"
                >
                  <Lock className="h-5 w-5" />
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-[#CC0000] text-[#F9F9F7] font-black uppercase text-xs tracking-widest hover:bg-[#990000] disabled:opacity-50 transition-colors hard-shadow-hover"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {isLoading ? 'SIGNING IN...' : 'SIGN IN'}
            </button>
          </form>

          {/* Divider */}
          <div className="divider-ornamental border-b border-t border-[#E5E5E0] my-6 py-4 text-sm">
            ✦ ✦ ✦
          </div>

          {/* Signup link */}
          <div className="text-center">
            <p className="text-sm text-[#525252] mb-4" style={{ fontFamily: "'Lora', serif" }}>
              Don't have an account?
            </p>
            <Link
              to="/signup"
              className="inline-block w-full py-3 border-2 border-[#111111] text-[#111111] font-black uppercase text-xs tracking-widest hover:bg-[#111111] hover:text-[#F9F9F7] transition-colors text-center"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              CREATE ACCOUNT
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default SignIn;
