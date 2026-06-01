import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Lock, Mail, User, AlertCircle, Check } from "lucide-react";
import axios from "axios";
import Navbar from "./Navbar";
import Footer from "./Footer";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const SignUp: React.FC = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<{
    score: number;
    text: string;
    color: string;
  }>({
    score: 0,
    text: "Weak",
    color: "#CC0000",
  });
  const navigate = useNavigate();

  const calculatePasswordStrength = (password: string) => {
    let score = 0;
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    const strengths = [
      { text: "Weak", color: "#CC0000" },
      { text: "Fair", color: "#FFA500" },
      { text: "Good", color: "#FFD700" },
      { text: "Strong", color: "#228B22" },
    ];
    const strength = strengths[Math.min(Math.floor(score / 2), 3)];
    return { score, ...strength };
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === "password")
      setPasswordStrength(calculatePasswordStrength(value));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "Full name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    if (formData.password.length < 8)
      newErrors.password = "Password must be at least 8 characters";
    if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";
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
          password: formData.password,
        },
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        },
      );

      if (response.data?.success) {
        navigate("/signin", { replace: true });
      } else {
        throw new Error(response.data?.message || "Registration failed");
      }
    } catch (err: any) {
      const message =
        err.response?.data?.message ||
        err.message ||
        "Registration failed. Please try again.";
      setErrors({ form: message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#F9F9F7] overflow-hidden min-h-screen">
      <Navbar />

      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 pt-[7rem] md:pt-[8rem] pb-20">
        <div className="grid lg:grid-cols-12 border border-[#111111] bg-[#F9F9F7]">
          {/* FORM SECTION */}
          <div className="lg:col-span-5 p-6 md:p-10">
            {/* Header */}
            <div className="border-b-4 border-[#111111] mb-10 pb-6">
              <div
                className="text-[0.65rem] uppercase tracking-[0.2em] text-[#525252] mb-4"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                Create Account &nbsp;|&nbsp; Registration
              </div>
              <h1
                className="font-black leading-[0.9]"
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: "clamp(3rem, 8vw, 4rem)",
                }}
              >
                JOIN
                <br />
                PASSVAULT
              </h1>
            </div>

            {/* Error */}
            {errors.form && (
              <div className="border-2 border-[#CC0000] bg-[#FFE5E5] p-4 mb-8 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-[#CC0000] flex-shrink-0 mt-0.5" />
                <p
                  className="text-sm text-[#CC0000]"
                  style={{ fontFamily: "'Lora', serif" }}
                >
                  {errors.form}
                </p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSignUp} className="space-y-6">
              <div>
                <label
                  className="block text-[0.65rem] uppercase tracking-[0.2em] mb-3 text-[#525252]"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="input-newsprint"
                  placeholder="John Doe"
                  disabled={isLoading}
                />
                {errors.name && (
                  <p className="text-xs text-[#CC0000] mt-2">{errors.name}</p>
                )}
              </div>

              <div>
                <label
                  className="block text-[0.65rem] uppercase tracking-[0.2em] mb-3 text-[#525252]"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="input-newsprint pr-8"
                    placeholder="you@email.com"
                    disabled={isLoading}
                  />
                  <Mail className="absolute right-0 bottom-3 h-5 w-5 text-[#525252] pointer-events-none" />
                </div>
                {errors.email && (
                  <p className="text-xs text-[#CC0000] mt-2">{errors.email}</p>
                )}
              </div>

              <div>
                <label
                  className="block text-[0.65rem] uppercase tracking-[0.2em] mb-3 text-[#525252]"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="input-newsprint pr-8"
                    placeholder="••••••••"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-0 bottom-3 h-5 w-5 text-[#525252] hover:text-[#111111]"
                  >
                    <Lock className="h-5 w-5" />
                  </button>
                </div>
                {formData.password && (
                  <div className="flex gap-2 items-center text-xs mt-3">
                    <div className="flex-1 h-1.5 bg-[#E5E5E0] overflow-hidden">
                      <div
                        className="h-full transition-all duration-300"
                        style={{
                          width: `${(passwordStrength.score / 6) * 100}%`,
                          backgroundColor: passwordStrength.color,
                        }}
                      />
                    </div>
                    <span
                      className="text-[0.65rem] uppercase tracking-widest font-bold"
                      style={{
                        color: passwordStrength.color,
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      {passwordStrength.text}
                    </span>
                  </div>
                )}
                {errors.password && (
                  <p className="text-xs text-[#CC0000] mt-2">
                    {errors.password}
                  </p>
                )}
              </div>

              <div>
                <label
                  className="block text-[0.65rem] uppercase tracking-[0.2em] mb-3 text-[#525252]"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="input-newsprint pr-8"
                    placeholder="••••••••"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-0 bottom-3 h-5 w-5 text-[#525252] hover:text-[#111111]"
                  >
                    {formData.password === formData.confirmPassword &&
                    formData.confirmPassword ? (
                      <Check className="h-5 w-5 text-[#CC0000]" />
                    ) : (
                      <Lock className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-[#CC0000] mt-2">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-[#CC0000] text-[#F9F9F7] font-black uppercase text-xs tracking-widest hover:bg-[#990000] disabled:opacity-50 transition-colors hard-shadow-hover mt-4"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                {isLoading ? "CREATING ACCOUNT..." : "CREATE ACCOUNT"}
              </button>
            </form>

            {/* Divider */}
            <div className="divider-ornamental border-b border-t border-[#E5E5E0] my-6 py-4 text-sm">
              ✦ ✦ ✦
            </div>

            {/* Signin link */}
            <div className="text-center">
              <p
                className="text-sm text-[#525252] mb-4"
                style={{ fontFamily: "'Lora', serif" }}
              >
                Already have an account?
              </p>
              <Link
                to="/signin"
                className="inline-block w-full py-3 border-2 border-[#111111] text-[#111111] font-black uppercase text-xs tracking-widest hover:bg-[#111111] hover:text-[#F9F9F7] transition-colors text-center"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                SIGN IN
              </Link>
            </div>
          </div>

          {/* RIGHT VISUAL PANEL */}
          <div className="lg:col-span-7 border-t lg:border-t-0 lg:border-l border-[#111111] newsprint-texture flex">
            <div className="h-full min-h-full flex flex-col">
              <div className="border-b border-[#111111] p-6">
                <div
                  className="uppercase tracking-[0.25em] text-[0.65rem] text-[#525252]"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  Vol. 01 • Registration Edition • 2026
                </div>
              </div>

              <div className="relative aspect-[4/3] border-b border-[#111111] overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1555949963-aa79dcee981c?q=80&w=1400"
                  alt="Digital Security"
                  className="w-full h-full object-cover grayscale hover:sepia-[50%] transition-all duration-300"
                />
              </div>

              <div className="p-8 border-b border-[#111111] flex-1">
                <div
                  className="uppercase tracking-[0.25em] text-[0.65rem] text-[#525252] mb-4"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  Fig. 1.2
                </div>

                <h2
                  className="font-black leading-[0.9] mb-4"
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: "clamp(2.5rem,5vw,4rem)",
                  }}
                >
                  Build Your
                  <br />
                  Digital Archive
                </h2>

                <p
                  className="text-[#525252] leading-relaxed"
                  style={{ fontFamily: "'Lora', serif" }}
                >
                  Create your secure vault, organize credentials, and start
                  protecting your online presence with enterprise-grade
                  security.
                </p>
              </div>

              <div className="grid grid-cols-3">
                {["Passwords", "2FA Ready", "Privacy"].map((item) => (
                  <div
                    key={item}
                    className="border-r last:border-r-0 border-[#111111] p-4 hover:bg-[#111111] hover:text-[#F9F9F7] transition-colors text-center"
                  >
                    <div
                      className="uppercase tracking-widest text-[0.65rem]"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      {item}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default SignUp;
