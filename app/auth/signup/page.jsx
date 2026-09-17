'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Poppins } from "next/font/google";
import { Eye, EyeOff, Lock, User, AlertCircle, CheckCircle2, UserCircle } from 'lucide-react';
import Image from 'next/image';

const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    role: 'customer'
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // ----------- SUBMIT HANDLER -----------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
          role: formData.role
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Auto login after signup
        const loginResponse = await fetch(`${API_BASE_URL}/api/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            username: formData.username,
            password: formData.password
          })
        });

        const loginData = await loginResponse.json();

        if (loginResponse.ok) {
          const userId = loginData.user.id;
          const userRole = loginData.user.role;

          localStorage.setItem('user_id', userId);
          localStorage.setItem('user_role', userRole);
          localStorage.setItem('username', loginData.user.username);
          localStorage.setItem('isAuthenticated', 'true');

          // 🎯 ROLE BASED REDIRECT
          if (userRole === "seller") {
            router.push(`/seller-verification?userId=${userId}&role=${userRole}`);
          } else {
            router.push(`/dashboard?userId=${userId}&role=${userRole}`);
          }

        } else {
          setSuccess(true);
          setTimeout(() => router.push('/auth/login'), 1500);
        }

      } else {
        setError(data.error || 'Signup failed. Please try again.');
      }

    } catch (err) {
      console.error('[SIGNUP ERROR]', err);
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };


  // ----------- UI -----------
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <video autoPlay loop muted playsInline
          className="w-full h-full object-cover"
          style={{ filter: 'blur(0px)', transform: 'scale(1.1)' }}
        >
          <source src="/backgroundvideo4.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-background/70" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen px-4 py-12">
        <div className="w-full max-w-md">

          {/* Logo */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">
              LEGAL LENS
            </h1>
          </div>

          {/* Form Box */}
          <div
            className="bg-card/90 border border-white/[0.06] rounded-2xl p-8 backdrop-blur-xl shadow-sm shadow-black/40"
          >
            <form onSubmit={handleSubmit} className="space-y-6">

              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                <span className="text-foreground flex justify-center mb-8">
                  Create Account
                </span>
              </h1>

              {/* Error */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-300" />
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}

              {/* Success */}
              {success && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-300" />
                  <p className="text-emerald-300 text-sm">Account created! Redirecting...</p>
                </div>
              )}

              {/* Username */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-foreground-muted uppercase tracking-wider">
                  Username
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-muted" />
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    required
                    className="w-full bg-card border border-white/10 rounded-lg pl-12 pr-4 py-3 text-foreground focus:border-accent/50 focus:outline-none"
                    placeholder="Choose a username"
                  />
                </div>
              </div>

              {/* Role Dropdown */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-foreground-muted uppercase tracking-wider">
                  Account Type
                </label>
                <div className="relative">
                  <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-muted" />
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full bg-card border border-white/10 rounded-lg pl-12 pr-4 py-3 text-foreground appearance-none focus:border-accent/50 focus:outline-none"
                  >
                    <option value="customer">Customer</option>
                    <option value="seller">Seller</option>
                  </select>
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-foreground-muted uppercase tracking-wider">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-muted" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    className="w-full bg-card border border-white/10 rounded-lg pl-12 pr-12 py-3 text-foreground focus:border-accent/50 focus:outline-none"
                    placeholder="Create a password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground"
                  >
                    {showPassword ? <EyeOff /> : <Eye />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-foreground-muted uppercase tracking-wider">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-muted" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    required
                    className="w-full bg-card border border-white/10 rounded-lg pl-12 pr-12 py-3 text-foreground focus:border-accent/50 focus:outline-none"
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground"
                  >
                    {showConfirmPassword ? <EyeOff /> : <Eye />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || success}
                className="w-full py-3 px-6 bg-accent hover:bg-accent/90 text-white rounded-lg font-semibold uppercase tracking-wider transition disabled:opacity-50"
              >
                {loading ? "CREATING ACCOUNT..." : "CREATE ACCOUNT"}
              </button>

              {/* Signin link */}
              <p className="text-center text-foreground-muted text-sm">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => router.push('/auth/login')}
                  className="text-accent hover:text-accent/80 font-semibold"
                >
                  Sign In
                </button>
              </p>

            </form>
          </div>

        </div>
      </div>
    </div>
  );
}
