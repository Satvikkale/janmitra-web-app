'use client';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { API } from '@/lib/auth';

export default function ForgotPassword() {
    const [userType, setUserType] = useState<'admin' | 'ngo' | 'ngo-user'>('admin');
    const [step, setStep] = useState<'request' | 'verify'>('request');
    const [formData, setFormData] = useState({
        identifier: '',
        ngoName: '',
        verificationCode: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [err, setErr] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [availableNgos, setAvailableNgos] = useState<Array<{ name: string; id: string }>>([]);
    const router = useRouter();

    useEffect(() => {
        setMounted(true);
        fetchAvailableNgos();
    }, []);

    const fetchAvailableNgos = async () => {
        try {
            const response = await fetch(`${API}/auth/available-ngos`);
            if (response.ok) {
                const ngos = await response.json();
                setAvailableNgos(ngos);
            }
        } catch (error) {
            console.error('Failed to fetch available NGOs:', error);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRequestCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setErr(null);
        setSuccess(null);
        setLoading(true);

        try {
            const requestBody: any = {
                identifier: formData.identifier,
                userType
            };

            if (userType === 'ngo-user') {
                requestBody.ngoName = formData.ngoName;
            }

            const r = await fetch(`${API}/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
            });
            const j = await r.json();
            if (!r.ok) throw new Error(j.message || 'Failed to send verification code');

            setSuccess('Verification code sent! Check your email/SMS.');
            // For development, show the code (remove in production)
            if (j.verificationCode) {
                setFormData(prev => ({ ...prev, verificationCode: j.verificationCode }));
            }
            setStep('verify');
        } catch (e: any) {
            setErr(e.message);
        }
        setLoading(false);
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setErr(null);
        setSuccess(null);

        if (formData.newPassword !== formData.confirmPassword) {
            setErr('Passwords do not match');
            return;
        }

        if (formData.newPassword.length < 6) {
            setErr('Password must be at least 6 characters');
            return;
        }

        setLoading(true);

        try {
            const requestBody: any = {
                identifier: formData.identifier,
                userType,
                verificationCode: formData.verificationCode,
                newPassword: formData.newPassword
            };

            if (userType === 'ngo-user') {
                requestBody.ngoName = formData.ngoName;
            }

            const r = await fetch(`${API}/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
            });
            const j = await r.json();
            if (!r.ok) throw new Error(j.message || 'Failed to reset password');

            setSuccess('Password reset successfully! Redirecting to login...');
            setTimeout(() => {
                router.push('/auth/login');
            }, 2000);
        } catch (e: any) {
            setErr(e.message);
        }
        setLoading(false);
    };

    if (!mounted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 sm:p-6 lg:p-8">
            <div className="w-full max-w-md sm:max-w-lg">
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, ease: 'easeOut' }}
                    className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-6 sm:p-8 lg:p-10"
                >
                    <div className="text-center mb-8">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3, duration: 0.5 }}
                            className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-4"
                        >
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                            </svg>
                        </motion.div>
                        <motion.h2
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3, duration: 0.5 }}
                            className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2"
                        >
                            {step === 'request' ? 'Forgot Password' : 'Reset Password'}
                        </motion.h2>
                        <p className="text-gray-600 text-sm sm:text-base">
                            {step === 'request'
                                ? 'Enter your details to receive a verification code'
                                : 'Enter the verification code and your new password'}
                        </p>
                    </div>

                    {/* User Type Toggle */}
                    {step === 'request' && (
                        <div className="flex mb-6 bg-white/30 rounded-xl p-1">
                            <button
                                type="button"
                                onClick={() => setUserType('admin')}
                                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition ${
                                    userType === 'admin'
                                        ? 'bg-blue-600 text-white shadow-md'
                                        : 'text-gray-700 hover:bg-white/40'
                                }`}
                            >
                                Admin
                            </button>
                            <button
                                type="button"
                                onClick={() => setUserType('ngo-user')}
                                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition ${
                                    userType === 'ngo-user'
                                        ? 'bg-green-600 text-white shadow-md'
                                        : 'text-gray-700 hover:bg-white/40'
                                }`}
                            >
                                NGO User
                            </button>
                            <button
                                type="button"
                                onClick={() => setUserType('ngo')}
                                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition ${
                                    userType === 'ngo'
                                        ? 'bg-purple-600 text-white shadow-md'
                                        : 'text-gray-700 hover:bg-white/40'
                                }`}
                            >
                                NGO
                            </button>
                        </div>
                    )}

                    {step === 'request' ? (
                        <form onSubmit={handleRequestCode} className="space-y-5">
                            {userType === 'ngo-user' && (
                                <div className="transform transition-all duration-300 hover:scale-[1.02]">
                                    <motion.select
                                        whileFocus={{ scale: 1.02 }}
                                        name="ngoName"
                                        value={formData.ngoName}
                                        onChange={handleChange}
                                        required
                                        className="text-black w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all duration-300 bg-white/50 backdrop-blur-sm hover:bg-white/80"
                                    >
                                        <option value="" disabled>Select NGO</option>
                                        {availableNgos.map((ngo) => (
                                            <option key={ngo.id} value={ngo.name}>
                                                {ngo.name}
                                            </option>
                                        ))}
                                    </motion.select>
                                </div>
                            )}

                            <div className="transform transition-all duration-300 hover:scale-[1.02]">
                                <motion.input
                                    whileFocus={{ scale: 1.02 }}
                                    type="text"
                                    name="identifier"
                                    placeholder={
                                        userType === 'admin'
                                            ? 'Email or phone'
                                            : userType === 'ngo-user'
                                            ? 'Your Name'
                                            : 'Contact Email or phone'
                                    }
                                    value={formData.identifier}
                                    onChange={handleChange}
                                    required
                                    className="text-black w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all duration-300 bg-white/50 backdrop-blur-sm hover:bg-white/80"
                                />
                            </div>

                            {err && (
                                <div className="text-red-600 text-sm bg-red-50 p-3 rounded-xl border border-red-200">{err}</div>
                            )}

                            {success && (
                                <div className="text-green-600 text-sm bg-green-50 p-3 rounded-xl border border-green-200">{success}</div>
                            )}

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-xl font-medium text-lg shadow-lg hover:shadow-xl transform transition-all duration-300 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Sending...' : 'Send Verification Code'}
                            </motion.button>
                        </form>
                    ) : (
                        <form onSubmit={handleResetPassword} className="space-y-5">
                            <div className="transform transition-all duration-300 hover:scale-[1.02]">
                                <motion.input
                                    whileFocus={{ scale: 1.02 }}
                                    type="text"
                                    name="verificationCode"
                                    placeholder="Verification Code"
                                    value={formData.verificationCode}
                                    onChange={handleChange}
                                    required
                                    className="text-black w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all duration-300 bg-white/50 backdrop-blur-sm hover:bg-white/80"
                                />
                            </div>

                            <div className="transform transition-all duration-300 hover:scale-[1.02]">
                                <motion.input
                                    whileFocus={{ scale: 1.02 }}
                                    type="password"
                                    name="newPassword"
                                    placeholder="New Password"
                                    value={formData.newPassword}
                                    onChange={handleChange}
                                    required
                                    className="text-black w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all duration-300 bg-white/50 backdrop-blur-sm hover:bg-white/80"
                                />
                            </div>

                            <div className="transform transition-all duration-300 hover:scale-[1.02]">
                                <motion.input
                                    whileFocus={{ scale: 1.02 }}
                                    type="password"
                                    name="confirmPassword"
                                    placeholder="Confirm Password"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                    className="text-black w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all duration-300 bg-white/50 backdrop-blur-sm hover:bg-white/80"
                                />
                            </div>

                            {err && (
                                <div className="text-red-600 text-sm bg-red-50 p-3 rounded-xl border border-red-200">{err}</div>
                            )}

                            {success && (
                                <div className="text-green-600 text-sm bg-green-50 p-3 rounded-xl border border-green-200">{success}</div>
                            )}

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-xl font-medium text-lg shadow-lg hover:shadow-xl transform transition-all duration-300 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Resetting...' : 'Reset Password'}
                            </motion.button>

                            <button
                                type="button"
                                onClick={() => setStep('request')}
                                className="w-full text-gray-600 hover:text-gray-800 py-2 text-sm font-medium transition-colors"
                            >
                                ← Back to request code
                            </button>
                        </form>
                    )}

                    <div className="text-center mt-6">
                        <p className="text-gray-600 text-sm">
                            Remember your password?{' '}
                            <a
                                href="/auth/login"
                                className="text-blue-600 hover:text-blue-700 transition-colors duration-200 font-medium"
                            >
                                Sign in
                            </a>
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
