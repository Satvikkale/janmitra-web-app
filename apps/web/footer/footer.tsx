import React from 'react';
import Link from 'next/link';
import { Mail, Phone, MapPin, Facebook, Instagram, Youtube, ArrowRight } from 'lucide-react';

const Footer: React.FC = () => {
    return (
        <footer className="bg-slate-950 text-white">
            {/* Main Footer Content */}
            <div className="max-w-7xl mx-auto px-4 py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
                    {/* Brand Section */}
                    <div className="space-y-4">
                        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                            JanMitra
                        </h2>
                        <p className="text-slate-400 text-sm leading-relaxed">
                            Empowering citizens to capture and resolve issues effortlessly.
                        </p>
                        <div className="flex gap-3 pt-2">
                            <a href="/" className="p-2 rounded-lg bg-slate-800 hover:bg-blue-600 transition-colors duration-300">
                                <Facebook size={18} />
                            </a>
                            <a href="/" className="p-2 rounded-lg bg-slate-800 hover:bg-pink-600 transition-colors duration-300">
                                <Instagram size={18} />
                            </a>
                            <a href="/" className="p-2 rounded-lg bg-slate-800 hover:bg-red-600 transition-colors duration-300">
                                <Youtube size={18} />
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-lg font-semibold mb-6 text-white">Quick Links</h3>
                        <ul className="space-y-3">
                            {[
                                { label: 'Services', href: '/services' },
                                { label: 'About Us', href: '/about_us' },
                                { label: 'Blog', href: '/blog' },
                                { label: 'Contact', href: '/contact' }
                            ].map((link) => (
                                <li key={link.href}>
                                    <Link href={link.href} className="text-slate-400 hover:text-emerald-400 transition-colors duration-300 flex items-center gap-2 group">
                                        <span className="w-1 h-1 bg-slate-600 rounded-full group-hover:bg-emerald-400 transition-colors" />
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Support */}
                    <div>
                        <h3 className="text-lg font-semibold mb-6 text-white">Support</h3>
                        <ul className="space-y-3">
                            {[
                                { label: 'Help Center', href: '/' },
                                { label: 'Privacy Policy', href: '/' },
                                { label: 'Terms of Service', href: '/' },
                                { label: 'FAQ', href: '/' }
                            ].map((link) => (
                                <li key={link.label}>
                                    <Link href={link.href} className="text-slate-400 hover:text-blue-400 transition-colors duration-300 flex items-center gap-2 group">
                                        <span className="w-1 h-1 bg-slate-600 rounded-full group-hover:bg-blue-400 transition-colors" />
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Newsletter */}
                    <div>
                        <h3 className="text-lg font-semibold mb-6 text-white">Newsletter</h3>
                        <p className="text-slate-400 text-sm mb-4">Subscribe to get updates on new features.</p>
                        <form className="space-y-3">
                            <input
                                type="email"
                                placeholder="Enter your email"
                                className="w-full px-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                            />
                            <button
                                type="submit"
                                className="w-full bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white py-2.5 rounded-lg text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2"
                            >
                                Subscribe <ArrowRight size={16} />
                            </button>
                        </form>
                    </div>
                </div>

                {/* Divider */}
                <div className="border-t border-slate-800 my-8" />
            </div>
        </footer>
    );
};

export default Footer;