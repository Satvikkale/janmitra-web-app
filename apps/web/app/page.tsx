'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import {
  Camera,
  Users,
  Bell,
  Shield,
  ArrowRight,
  Sparkles,
  CheckCircle2
} from "lucide-react";
import Image from 'next/image';
import HeroImage from '../../web/assets/images/hero-image.png';
import QRImage from '../../web/assets/images/QR.png';

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: string;
  iconBg: string;
}

interface Step {
  number: number;
  title: string;
  description: string;
}

const features: Feature[] = [
  {
    icon: <Camera className="h-7 w-7 text-white" />,
    title: "AI-Powered Capture",
    description: "Take a photo of any community issue and let AI automatically categorize and prioritize your complaint.",
    gradient: "from-rose-500 to-orange-400",
    iconBg: "bg-gradient-to-br from-rose-500 to-orange-400"
  },
  {
    icon: <Users className="h-7 w-7 text-white" />,
    title: "Community Connect",
    description: "Connect residents, society secretaries, and NGOs on a unified platform for better communication.",
    gradient: "from-cyan-500 to-blue-500",
    iconBg: "bg-gradient-to-br from-cyan-500 to-blue-500"
  },
  {
    icon: <Bell className="h-7 w-7 text-white" />,
    title: "Real-time Notifications",
    description: "Get instant notifications when your complaints are reviewed, updated, or resolved by authorities.",
    gradient: "from-amber-500 to-yellow-400",
    iconBg: "bg-gradient-to-br from-amber-500 to-yellow-400"
  },
  {
    icon: <Shield className="h-7 w-7 text-white" />,
    title: "Secure & Reliable",
    description: "Your data is secure with role-based access control and transparent complaint tracking system.",
    gradient: "from-emerald-500 to-teal-400",
    iconBg: "bg-gradient-to-br from-emerald-500 to-teal-400"
  },
];

const steps: Step[] = [
  {
    number: 1,
    title: "Scan QR Code and Download App",
    description: "Scan the QR code and Download the app.",
  },
  {
    number: 2,
    title: "Open App and Register",
    description: "Open the app and register using your name and password",
  },
  {
    number: 3,
    title: "Capture image and Submit Complaint",
    description: "Capture an image of the issue and submit your complaint through the app.",
  },
  {
    number: 4,
    title: "Track Progress",
    description: "Monitor the status of your complaint and receive updates until resolution.",
  },
];

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: string;
  iconBg: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, iconBg }) => (
  <div className="group relative bg-white rounded-3xl p-8 shadow-sm hover:shadow-2xl transition-all duration-500 border border-slate-100 overflow-hidden">
    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-slate-50 to-transparent rounded-bl-full opacity-50"></div>
    <div className={`${iconBg} w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
      {icon}
    </div>
    <h3 className="text-xl font-bold mb-3 text-slate-800">{title}</h3>
    <p className="text-slate-500 leading-relaxed">{description}</p>
  </div>
);

interface StepItemProps {
  number: number;
  title: string;
  description: string;
  isLast?: boolean;
}

const StepItem: React.FC<StepItemProps> = ({ number, title, description, isLast }) => (
  <div className="relative flex items-start group">
    <div className="flex flex-col items-center">
      <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-2xl flex items-center justify-center font-bold shadow-lg shadow-indigo-200 group-hover:scale-110 transition-transform duration-300">
        {number}
      </div>
      {!isLast && (
        <div className="w-0.5 h-16 bg-gradient-to-b from-indigo-300 to-transparent mt-2"></div>
      )}
    </div>
    <div className="ml-5 pb-8">
      <h3 className="font-bold text-slate-800 text-lg mb-1">{title}</h3>
      <p className="text-slate-500">{description}</p>
    </div>
  </div>
);

export default function MainPage() {
  const { isLoggedIn } = useAuth();
  const [userType, setUserType] = React.useState<string | null>(null);

  React.useEffect(() => {
    setUserType(localStorage.getItem('userType'));
  }, []);

  const scrollToHowItWorks = (): void => {
    const section = document.getElementById("how-it-works");
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="bg-slate-50 min-h-screen overflow-hidden">
      {/* Hero Section */}
      <div className="relative">
        {/* Background decorations */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-yellow-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse delay-500"></div>

        <div className="mx-auto max-w-screen-xl px-4 py-12 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center mt-8">
            <div>
              <div className="inline-flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-sm border border-slate-100 mb-6">
                <Sparkles className="h-4 w-4 text-indigo-500" />
                <span className="text-sm font-medium text-slate-600">Empowering Communities</span>
              </div>

              <h1 className="text-5xl font-extrabold text-slate-900 sm:text-6xl leading-tight tracking-tight">
                Welcome to{' '}
                <span className="relative">
                  <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">
                    JanMirta
                  </span>
                  <svg className="absolute -bottom-2 left-0 w-full" height="8" viewBox="0 0 200 8" fill="none">
                    <path d="M2 6C50 2 150 2 198 6" stroke="url(#paint0_linear)" strokeWidth="3" strokeLinecap="round"/>
                    <defs>
                      <linearGradient id="paint0_linear" x1="2" y1="6" x2="198" y2="6">
                        <stop stopColor="#6366f1"/>
                        <stop offset="0.5" stopColor="#a855f7"/>
                        <stop offset="1" stopColor="#ec4899"/>
                      </linearGradient>
                    </defs>
                  </svg>
                </span>
              </h1>

              <p className="mt-8 text-slate-500 text-lg leading-relaxed max-w-xl">
                JanMirta is the central platform where all data processing and workflow control happens.
                The mobile app empowers residents to capture and submit issues, while the web dashboard
                enables organizations to manage and resolve complaints efficiently.
              </p>

              <div className="flex flex-wrap items-center gap-3 mt-6">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  <span>Real-time sync</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  <span>AI-powered</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  <span>Secure platform</span>
                </div>
              </div>

              {!isLoggedIn ? (
                <div className="mt-10 flex flex-wrap gap-4">
                  <button
                    className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-4 font-semibold text-white shadow-lg shadow-indigo-200 transition-all hover:shadow-xl hover:shadow-indigo-300 hover:-translate-y-0.5"
                    onClick={scrollToHowItWorks}
                  >
                    Download App
                    <ArrowRight className="h-5 w-5" />
                  </button>
                  <Link
                    href="/auth/register"
                    className="inline-flex items-center gap-2 rounded-2xl bg-white px-8 py-4 font-semibold text-slate-700 shadow-lg border border-slate-200 transition-all hover:shadow-xl hover:-translate-y-0.5 hover:border-indigo-200"
                  >
                    Get Started
                  </Link>
                  <Link
                    href="/auth/login"
                    className="inline-flex items-center gap-2 rounded-2xl px-8 py-4 font-semibold text-indigo-600 transition-all hover:bg-indigo-50"
                  >
                    Sign In →
                  </Link>
                </div>
              ) : (
                <div className="mt-10 flex flex-wrap gap-4">
                  <button
                    className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-4 font-semibold text-white shadow-lg shadow-indigo-200 transition-all hover:shadow-xl hover:shadow-indigo-300 hover:-translate-y-0.5"
                    onClick={scrollToHowItWorks}
                  >
                    Download App
                    <ArrowRight className="h-5 w-5" />
                  </button>
                  {userType === 'admin' && (
                    <Link
                      href="/admin-dashboard"
                      className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-8 py-4 font-semibold text-white shadow-lg shadow-emerald-200 transition-all hover:shadow-xl hover:shadow-emerald-300 hover:-translate-y-0.5"
                    >
                      Admin Dashboard
                    </Link>
                  )}
                  {userType === 'ngo' && (
                    <Link
                      href="/ngo-dashboard"
                      className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-8 py-4 font-semibold text-white shadow-lg shadow-emerald-200 transition-all hover:shadow-xl hover:shadow-emerald-300 hover:-translate-y-0.5"
                    >
                      NGO Dashboard
                    </Link>
                  )}
                </div>
              )}
            </div>

            <div className="relative lg:pl-8">
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-100 via-purple-50 to-pink-100 rounded-[3rem] -rotate-3 scale-105"></div>
              <div className="relative bg-white rounded-[2.5rem] p-4 shadow-2xl shadow-slate-200/50 rotate-1 hover:rotate-0 transition-transform duration-500">
                <Image
                  src={HeroImage}
                  className="relative z-10 rounded-[2rem]"
                  alt="Community engagement through JanMirta"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="mx-auto max-w-screen-xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">Powerful Features</h2>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto">
            Everything you need to manage community issues efficiently
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, idx) => (
            <FeatureCard key={`feature-${idx}`} {...feature} />
          ))}
        </div>
      </div>

      {/* How It Works Section */}
      <div className="mx-auto max-w-screen-xl px-4 pb-20 sm:px-6 lg:px-8">
        <div id="how-it-works" className="relative bg-white rounded-[3rem] shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100">
          {/* Background pattern */}
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-indigo-50 via-purple-50 to-transparent"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-pink-100 to-transparent rounded-full -translate-x-1/2 translate-y-1/2 opacity-50"></div>

          <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-12 p-10 md:p-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-indigo-50 rounded-full px-4 py-2 mb-6">
                <span className="text-sm font-semibold text-indigo-600">Simple Process</span>
              </div>
              <h2 className="text-4xl font-bold text-slate-900 mb-10">How It Works</h2>
              <div className="space-y-2">
                {steps.map((step, idx) => (
                  <StepItem key={idx} {...step} isLast={idx === steps.length - 1} />
                ))}
              </div>
            </div>
            <div className="relative flex justify-center lg:justify-end">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-3xl blur-2xl opacity-20 scale-110"></div>
                <div className="relative bg-white p-6 rounded-3xl shadow-2xl shadow-indigo-100 border border-slate-100">
                  <Image
                    src={QRImage}
                    alt="Smart Community App Interface"
                    className="w-full max-w-sm rounded-2xl"
                  />
                  <div className="absolute -bottom-4 -right-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-2xl shadow-lg font-semibold text-sm">
                    Scan to Download
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
