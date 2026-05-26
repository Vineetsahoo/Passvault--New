import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, User, AlertCircle, Check } from 'lucide-react';
import axios from 'axios';
import Navbar from './Navbar';
import Footer from './Footer';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const SignUp: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<{score: number; text: string; color: string}>({ score: 0, text: 'Weak', color: 'red' });
  const navigate = useNavigate();

  // Password strength calculator
  const calculatePasswordStrength = (password: string) => {
    let score = 0;
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    const strengths = [
      { text: 'Weak', color: '#CC0000' },
      { text: 'Fair', color: '#FFA500' },
      { text: 'Good', color: '#FFD700' },
      { text: 'Strong', color: '#90EE90' }
    ];
    const strength = strengths[Math.min(Math.floor(score / 2), 3)];
    return { score, ...strength };
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'password') {
      setPasswordStrength(calculatePasswordStrength(value));
    }
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Full name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    return newErrors;
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(
        `${API_URL}/auth/register`,
        {
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          password: formData.password
        },
        { headers: { 'Content-Type': 'application/json' }, withCredentials: true }
      );

      if (response.data?.success) {
        navigate('/signin', { replace: true });
      } else {
        throw new Error(response.data?.message || 'Registration failed');
      }
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Registration failed. Please try again.';
      setErrors({ form: message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#F9F9F7] overflow-hidden min-h-screen">
      <Navbar />

      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-24 pt-40 flex items-center justify-center">
        <div className="w-full max-w-md">
          {/* HEADER */}
          <div className="border-b-4 border-[#111111] mb-12 pb-8">
            <div className="text-xs uppercase tracking-widest font-mono text-[#525252] mb-4">Create Account</div>
            <h1 className="text-5xl md:text-6xl font-black leading-[0.9]" style={{ fontFamily: "'Playfair Display', serif" }}>
              JOIN
              <br />
              PASSVAULT
            </h1>
          </div>

          {/* ERROR MESSAGE */}
          {errors.form && (
            <div className="border-2 border-[#CC0000] bg-[#FFE5E5] p-4 mb-8 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-[#CC0000] flex-shrink-0 mt-0.5" />
              <p className="text-sm text-[#CC0000]">{errors.form}</p>
            </div>
          )}

          {/* FORM */}
          <form onSubmit={handleSignUp} className="space-y-6">
            {/* NAME FIELD */}
            <div>
              <label className="block text-xs uppercase tracking-widest font-mono text-[#525252] mb-3">Full Name</label>
              <div className="border-b-2 border-[#111111] relative">
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full py-4 px-0 bg-transparent text-[#111111] font-serif placeholder-[#A3A3A3] focus:outline-none"
                  placeholder="John Doe"
                  disabled={isLoading}
                />
              </div>
              {errors.name && <p className="text-xs text-[#CC0000] mt-2">{errors.name}</p>}
            </div>

            {/* EMAIL FIELD */}
            <div>
              <label className="block text-xs uppercase tracking-widest font-mono text-[#525252] mb-3">Email</label>
              <div className="border-b-2 border-[#111111] relative">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full py-4 px-0 bg-transparent text-[#111111] font-serif placeholder-[#A3A3A3] focus:outline-none"
                  placeholder="you@email.com"
                  disabled={isLoading}
                />
                <Mail className="absolute right-0 bottom-4 h-5 w-5 text-[#525252] pointer-events-none" />
              </div>
              {errors.email && <p className="text-xs text-[#CC0000] mt-2">{errors.email}</p>}
            </div>

            {/* PASSWORD FIELD */}
            <div>
              <label className="block text-xs uppercase tracking-widest font-mono text-[#525252] mb-3">Password</label>
              <div className="border-b-2 border-[#111111] relative mb-3">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full py-4 px-0 bg-transparent text-[#111111] font-serif placeholder-[#A3A3A3] focus:outline-none"
                  placeholder="••••••••"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 bottom-4 h-5 w-5 text-[#525252] hover:text-[#111111]"
                >
                  <Lock className="h-5 w-5" />
                </button>
              </div>
              {formData.password && (
                <div className="flex gap-2 items-center text-xs">
                  <div className="flex-1 h-1 bg-[#E5E5E0]">
                    <div
                      className="h-full"
                      style={{ width: `${(passwordStrength.score / 6) * 100}%`, backgroundColor: passwordStrength.color }}
                    />
                  </div>
                  <span style={{ color: passwordStrength.color }}>{passwordStrength.text}</span>
                </div>
              )}
              {errors.password && <p className="text-xs text-[#CC0000] mt-2">{errors.password}</p>}
            </div>

            {/* CONFIRM PASSWORD */}
            <div>
              <label className="block text-xs uppercase tracking-widest font-mono text-[#525252] mb-3">Confirm Password</label>
              <div className="border-b-2 border-[#111111] relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full py-4 px-0 bg-transparent text-[#111111] font-serif placeholder-[#A3A3A3] focus:outline-none"
                  placeholder="••••••••"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-0 bottom-4 h-5 w-5 text-[#525252] hover:text-[#111111]"
                >
                  {formData.password === formData.confirmPassword && formData.confirmPassword && (
                    <Check className="h-5 w-5 text-[#CC0000]" />
                  ) || <Lock className="h-5 w-5" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-xs text-[#CC0000] mt-2">{errors.confirmPassword}</p>}
            </div>

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-8 py-4 bg-[#CC0000] text-[#F9F9F7] font-black uppercase text-xs tracking-widest hover:bg-[#990000] disabled:opacity-50 transition-colors mt-8"
            >
              {isLoading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
            </button>
          </form>

          {/* DIVIDER */}
          <div className="border-t border-[#E5E5E0] my-8" />

          {/* SIGNIN LINK */}
          <div className="text-center">
            <p className="text-sm text-[#525252] mb-3">Already have an account?</p>
            <Link
              to="/signin"
              className="inline-block px-8 py-3 border-2 border-[#111111] text-[#111111] font-black uppercase text-xs tracking-widest hover:bg-[#111111] hover:text-[#F9F9F7] transition-colors"
            >
              SIGN IN
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default SignUp;
