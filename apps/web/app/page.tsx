'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import {
  Camera,
  Users,
  Bell,
  Shield,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  TrendingUp,
  MapPin,
  Clock,
  Award,
  Zap,
  Target,
  Heart,
  Building2,
  FileCheck,
  Timer,
  Calendar,
  ChevronRight,
  Megaphone
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

interface EventItem {
  _id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  status: string;
  tags: string[];
  imageUrl?: string;
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

const impactStats = [
  { icon: <Target className="h-6 w-6" />, label: "Success Rate", value: "94%", color: "text-emerald-500" },
  { icon: <Timer className="h-6 w-6" />, label: "Avg Resolution", value: "48hrs", color: "text-blue-500" },
  { icon: <Heart className="h-6 w-6" />, label: "Satisfaction", value: "4.8/5", color: "text-rose-500" },
  { icon: <Zap className="h-6 w-6" />, label: "Response Time", value: "<2hrs", color: "text-amber-500" },
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

// Animated counter hook
function useAnimatedCounter(end: number, duration: number = 2000, start: number = 0) {
  const [count, setCount] = useState(start);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    if (!hasStarted) return;
    
    let startTime: number;
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      setCount(Math.floor(progress * (end - start) + start));
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [end, duration, start, hasStarted]);

  return { count, startAnimation: () => setHasStarted(true) };
}

// Stats Card Component
const StatCard: React.FC<{ 
  icon: React.ReactNode; 
  value: number | string; 
  label: string; 
  suffix?: string;
  gradient: string;
  delay?: number;
}> = ({ icon, value, label, suffix = "", gradient, delay = 0 }) => {
  const numValue = typeof value === 'number' ? value : parseInt(value) || 0;
  const { count, startAnimation } = useAnimatedCounter(numValue, 2000);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
      startAnimation();
    }, delay);
    return () => clearTimeout(timer);
  }, [delay, startAnimation]);

  return (
    <div className={`relative overflow-hidden bg-white rounded-3xl p-6 shadow-lg border border-slate-100 transform transition-all duration-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
      <div className={`absolute top-0 right-0 w-24 h-24 ${gradient} rounded-bl-[4rem] opacity-10`}></div>
      <div className={`w-12 h-12 ${gradient} rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg`}>
        {icon}
      </div>
      <div className="text-3xl font-bold text-slate-800 mb-1">
        {typeof value === 'number' ? count.toLocaleString() : value}{suffix}
      </div>
      <div className="text-slate-500 text-sm font-medium">{label}</div>
    </div>
  );
};

// Event Card Component
const EventCard: React.FC<{ event: EventItem }> = ({ event }) => {
  const eventDate = new Date(event.date);
  const formattedDate = eventDate.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
  const formattedTime = eventDate.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="group bg-white rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all duration-300 border border-slate-100 hover:border-indigo-200">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-xl p-3 text-center min-w-[60px]">
          <div className="text-xs font-medium opacity-80">
            {eventDate.toLocaleDateString('en-IN', { month: 'short' }).toUpperCase()}
          </div>
          <div className="text-2xl font-bold">{eventDate.getDate()}</div>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-slate-800 text-lg group-hover:text-indigo-600 transition-colors line-clamp-1">
            {event.title}
          </h4>
          <p className="text-slate-500 text-sm mt-1 line-clamp-2">
            {event.description}
          </p>
          <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-slate-500">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4 text-indigo-500" />
              {formattedTime}
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4 text-rose-500" />
              <span className="line-clamp-1">{event.location}</span>
            </div>
          </div>
          {event.tags && event.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {event.tags.slice(0, 3).map((tag, idx) => (
                <span
                  key={idx}
                  className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function MainPage() {
  const { isLoggedIn } = useAuth();
  const [userType, setUserType] = React.useState<string | null>(null);
  const [statsLoaded, setStatsLoaded] = useState(false);
  const [upcomingEvents, setUpcomingEvents] = useState<EventItem[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);

  React.useEffect(() => {
    setUserType(localStorage.getItem('userType'));
  }, []);

  // Fetch upcoming events
  useEffect(() => {
    const fetchUpcomingEvents = async () => {
      try {
        const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000/v1';
        const response = await fetch(`${API_BASE}/events/upcoming?limit=4`);
        if (response.ok) {
          const data = await response.json();
          setUpcomingEvents(data);
        }
      } catch (error) {
        console.error('Failed to fetch upcoming events:', error);
      } finally {
        setEventsLoading(false);
      }
    };

    fetchUpcomingEvents();
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
        {/* Animated background decorations */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-yellow-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>

        <div className="mx-auto max-w-screen-xl px-4 py-12 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center mt-8">
            <div>
              <div className="inline-flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-sm border border-slate-100 mb-6 animate-fade-in">
                <Sparkles className="h-4 w-4 text-indigo-500 animate-pulse" />
                <span className="text-sm font-medium text-slate-600">Empowering Communities Across India</span>
              </div>

              <h1 className="text-5xl font-extrabold text-slate-900 sm:text-6xl leading-tight tracking-tight">
                Transform Your{' '}
                <span className="relative">
                  <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 bg-clip-text text-transparent animate-gradient">
                    Community
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
                <br />
                <span className="text-slate-700">With JanMirta</span>
              </h1>

              <p className="mt-8 text-slate-500 text-lg leading-relaxed max-w-xl">
                India&apos;s first AI-powered civic complaint platform connecting <strong className="text-slate-700">citizens</strong>, <strong className="text-slate-700">NGOs</strong>, and <strong className="text-slate-700">local authorities</strong> for faster issue resolution. Report, track, and resolve community problems in real-time.
              </p>

              {/* Mini Stats Row */}
              <div className="flex flex-wrap items-center gap-6 mt-8 p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-slate-100">
                {impactStats.map((stat, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className={`${stat.color}`}>{stat.icon}</div>
                    <div>
                      <div className={`font-bold ${stat.color}`}>{stat.value}</div>
                      <div className="text-xs text-slate-500">{stat.label}</div>
                    </div>
                  </div>
                ))}
              </div>

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
                  <span>100% Transparent</span>
                </div>
              </div>

              {!isLoggedIn ? (
                <div className="mt-10 flex flex-wrap gap-4">
                  <button
                    className="group inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-4 font-semibold text-white shadow-lg shadow-indigo-200 transition-all hover:shadow-xl hover:shadow-indigo-300 hover:-translate-y-0.5"
                    onClick={scrollToHowItWorks}
                  >
                    Download App
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                  <Link
                    href="/auth/register"
                    className="inline-flex items-center gap-2 rounded-2xl bg-white px-8 py-4 font-semibold text-slate-700 shadow-lg border border-slate-200 transition-all hover:shadow-xl hover:-translate-y-0.5 hover:border-indigo-200"
                  >
                    Get Started Free
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
                    className="group inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-4 font-semibold text-white shadow-lg shadow-indigo-200 transition-all hover:shadow-xl hover:shadow-indigo-300 hover:-translate-y-0.5"
                    onClick={scrollToHowItWorks}
                  >
                    Download App
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
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

      {/* Upcoming Events Section */}
      <div className="mx-auto max-w-screen-xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="relative bg-white rounded-[3rem] shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100">
          {/* Background pattern */}
          <div className="absolute top-0 left-0 w-1/3 h-full bg-gradient-to-r from-amber-50 via-orange-50 to-transparent"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-indigo-100 to-transparent rounded-bl-full opacity-50"></div>

          <div className="relative p-8 md:p-12">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
              <div>
                <div className="inline-flex items-center gap-2 bg-amber-50 rounded-full px-4 py-2 mb-3">
                  <Megaphone className="h-4 w-4 text-amber-600" />
                  <span className="text-sm font-semibold text-amber-700">Notice Board</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900">Upcoming Events</h2>
                <p className="text-slate-500 mt-2">Stay updated with the latest community events and activities</p>
              </div>
            </div>

            {eventsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-slate-50 rounded-2xl p-5 animate-pulse">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 bg-slate-200 rounded-xl"></div>
                      <div className="flex-1">
                        <div className="h-5 bg-slate-200 rounded w-3/4 mb-2"></div>
                        <div className="h-4 bg-slate-200 rounded w-full mb-2"></div>
                        <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : upcomingEvents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {upcomingEvents.map((event) => (
                  <EventCard key={event._id} event={event} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-slate-50 rounded-2xl">
                <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-600 mb-2">No Upcoming Events</h3>
                <p className="text-slate-500">Check back later for new community events and activities.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Why JanMirta Section */}
      <div className="mx-auto max-w-screen-xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 rounded-[3rem] overflow-hidden">
          {/* Background patterns */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-40 h-40 border-2 border-white rounded-full"></div>
            <div className="absolute bottom-10 right-10 w-60 h-60 border-2 border-white rounded-full"></div>
            <div className="absolute top-1/2 left-1/2 w-80 h-80 border-2 border-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
          </div>
          
          <div className="relative p-10 md:p-16">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                  Why Choose<br />JanMirta?
                </h2>
                <p className="text-white/80 text-lg mb-8">
                  We&apos;re not just another complaint platform. JanMirta is built with cutting-edge technology and a vision to transform how communities solve problems together.
                </p>
                
                <div className="space-y-4">
                  {[
                    { icon: <Zap />, text: "AI-powered complaint categorization & routing" },
                    { icon: <MapPin />, text: "GPS-based automatic location tagging" },
                    { icon: <Clock />, text: "Real-time status updates & notifications" },
                    { icon: <Award />, text: "Transparent resolution tracking" },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-2xl p-4">
                      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white">
                        {item.icon}
                      </div>
                      <span className="text-white font-medium">{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-6 text-center">
                  <div className="text-5xl font-bold text-white mb-2">&lt;2h</div>
                  <div className="text-white/70 text-sm">Avg Response Time</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-6 text-center">
                  <div className="text-5xl font-bold text-white mb-2">24/7</div>
                  <div className="text-white/70 text-sm">Platform Available</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-6 text-center">
                  <div className="text-5xl font-bold text-white mb-2">100%</div>
                  <div className="text-white/70 text-sm">Transparency</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-6 text-center">
                  <div className="text-5xl font-bold text-white mb-2">Free</div>
                  <div className="text-white/70 text-sm">For Citizens</div>
                </div>
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


      {/* Call to Action */}
      <div className="mx-auto max-w-screen-xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="bg-slate-900 rounded-[3rem] p-10 md:p-16 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-pink-600/20"></div>
          <div className="absolute top-0 left-1/2 w-96 h-96 bg-indigo-500 rounded-full blur-3xl opacity-20 -translate-x-1/2 -translate-y-1/2"></div>
          
          <div className="relative">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Transform Your Community?
            </h2>
            <p className="text-slate-400 text-lg mb-8 max-w-2xl mx-auto">
              Join thousands of citizens and organizations already using JanMirta to build better communities.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <button
                onClick={scrollToHowItWorks}
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-8 py-4 font-semibold text-slate-900 shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5"
              >
                Download Mobile App
                <ArrowRight className="h-5 w-5" />
              </button>
              <Link
                href="/auth/register"
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 px-8 py-4 font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5"
              >
                Register Your Organization
              </Link>
            </div>
          </div>
        </div>
      </div>

     
    </section>
  );
}
