'use client';
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/contexts/AuthContext'
import Logo from '../assets/images/Janmitra_logo.jpeg'

type Props = {}

export default function Navbar({ }: Props) {
    const { isLoggedIn, logout } = useAuth() // Add user if available in context
    const router = useRouter()

    const userType = localStorage.getItem('userType');
    const handleLogout = () => {
        logout()
        router.push('/auth/login')
    }

    return (
        <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <div className="flex items-center">
                        <Link href="/" className="flex items-center gap-2">
                            <Image src={Logo} alt="JanMirta Logo" width={120} height={40} className="rounded-full"/>
                            
                        </Link>
                    </div>

                    <div className="md:block text-black">
                        <Link
                            href="/about_Us"
                            className="text-gray-700 hover:text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200"
                        >
                            About Us
                        </Link>
                        <Link
                            href="/contact_us"
                            className="text-gray-700 hover:text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 cursor-pointer"
                        >
                            Contact Us
                        </Link>
                    </div>

                    {/* Desktop Auth/Dashboard Links */}
                    <div className=" md:flex items-center space-x-4 ml-10">
                        {isLoggedIn ? (
                            <>
                                {userType === 'admin' && (<Link
                                    href="/admin-dashboard"
                                    className="text-gray-700 hover:text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 "
                                >
                                    Admin
                                </Link>)}
                                
                                {userType === 'ngo' && (
                                    <Link
                                        href="/ngo-dashboard"
                                        className="text-gray-700 hover:text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 "
                                    >
                                        NGO
                                    </Link>
                                )}
                                {userType === 'ngo-user' && (
                                    <Link
                                        href="/ngo-users"
                                        className="text-gray-700 hover:text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 "
                                    >
                                        NGO User
                                    </Link>
                                )}
                                <button
                                    onClick={handleLogout}
                                    className="border border-gray-800 text-black px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 hover:bg-gray-100 hover:shadow-md"
                                >
                                    Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <Link
                                    href="/auth/login"
                                    className="text-gray-700 hover:text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 border border-gray-300"
                                >
                                    Login
                                </Link>
                                <Link
                                    href="/auth/register"
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 hover:shadow-md"
                                >
                                    Sign Up
                                </Link>
                            </>
                        )}
                    </div>
                </div>


            </div>
        </nav>
    )
}