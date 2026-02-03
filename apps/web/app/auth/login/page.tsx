'use client';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { API, setTokens } from '@/lib/auth';
import { useAuth } from '@/contexts/AuthContext';

export default function Login() {
    const [userType, setUserType] = useState<'admin' | 'ngo' | 'ngo-user'>('admin');
    const [formData, setFormData] = useState({ identifier: '', password: '', ngoName: '' });
    const [err, setErr] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [availableNgos, setAvailableNgos] = useState<Array<{ name: string; id: string }>>([]);
    const { setIsLoggedIn } = useAuth();
    const router = useRouter();
    const sp = useSearchParams();

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErr(null);
        setLoading(true);
        try {
            const requestBody: any = { 
                identifier: formData.identifier, 
                password: formData.password, 
                userType 
            };
            
            if (userType === 'ngo-user') {
                requestBody.ngoName = formData.ngoName;
            }
            
            const r = await fetch(`${API}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
            });
            const j = await r.json();
            if (!r.ok) throw new Error(j.message || 'Login failed');
            setTokens(j.accessToken, j.refreshToken);
            setIsLoggedIn(true);
            // Store user data and userType in localStorage
            if (typeof window !== 'undefined') {
                localStorage.setItem('userData', JSON.stringify(j.user || {}));
                if (j.user && j.user.userType) {
                    localStorage.setItem('userType', j.user.userType);
                } else {
                    localStorage.setItem('userType', userType);
                }
            }
            if (userType === 'admin') {
                router.push('/admin-dashboard');
            } else if (userType === 'ngo' && j.user.isVerified) {
                router.push('/ngo-dashboard');
            } else if (userType === 'ngo' && !j.user.isVerified) {
                alert('Your NGO account is pending approval. Please wait for verification.');
                router.push('/auth/login');
            } else if (userType === 'ngo-user') {
                router.push('/ngo-users');
            }
        } catch (e: any) {
            setErr(e.message);
        }
        setLoading(false);
    };

    const handleSignUp = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        router.push('/auth/register');
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
                    className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-6 sm:p-8 lg:p-10 transform transition-all duration-500 hover:shadow-3xl hover:scale-[1.02]"
                >
                    <div className="text-center mb-8">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3, duration: 0.5 }}
                            className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-4 transform transition-transform duration-300 hover:rotate-12"
                        >
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                            </svg>
                        </motion.div>
                        <motion.h2
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3, duration: 0.5 }}
                            className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2"
                        >
                            Welcome Back
                        </motion.h2>
                        <p className="text-gray-600 text-sm sm:text-base">Sign in to your account</p>
                    </div>

                    {/* User Type Toggle */}
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

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {userType === 'ngo-user' && (
                            <div className="transform transition-all duration-300 hover:scale-[1.02]">
                                <motion.select
                                    whileFocus={{ scale: 1.02 }}
                                    name="ngoName"
                                    value={formData.ngoName}
                                    onChange={handleChange}
                                    required
                                    suppressHydrationWarning
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
                                suppressHydrationWarning
                                className="text-black w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all duration-300 bg-white/50 backdrop-blur-sm hover:bg-white/80"
                            />
                        </div>

                        <div className="transform transition-all duration-300 hover:scale-[1.02]">
                            <motion.input
                                whileFocus={{ scale: 1.02 }}
                                type="password"
                                name="password"
                                placeholder="Password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                className="text-black w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all duration-300 bg-white/50 backdrop-blur-sm hover:bg-white/80"
                            />
                        </div>

                        <div className="text-right">
                            <a
                                href="/auth/forgot-password"
                                className="text-sm text-blue-600 hover:text-blue-700 transition-colors duration-200 font-medium"
                            >
                                Forgot Password?
                            </a>
                        </div>

                        {err && (
                            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-xl border border-red-200">{err}</div>
                        )}

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-xl font-medium text-lg shadow-lg hover:shadow-xl transform transition-all duration-300 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Signing in...' : 'Sign In'}
                        </motion.button>
                    </form>

                    <div className="text-center mt-6">
                        <p className="text-gray-600 text-sm mb-2">
                            Don't have an account?{' '}
                            <a
                                href="/auth/register"
                                className="text-blue-600 hover:text-blue-700 transition-colors duration-200 font-medium"
                                onClick={handleSignUp}
                            >
                                Sign up
                            </a>
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}