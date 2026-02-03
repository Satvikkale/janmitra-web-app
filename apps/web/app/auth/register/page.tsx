'use client'
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { API, setTokens } from '@/lib/auth';
import { useAuth } from '@/contexts/AuthContext';

export default function Register() {
  const [userType, setUserType] = useState<'ngo-user' | 'ngo'>('ngo-user');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const { setIsLoggedIn } = useAuth();
  
  // NGO User specific fields
  const [ngoUserInfo, setNgoUserInfo] = useState({
    ngoName: '',
    position: '',
    mobileNo: '',
  });
  
  // Available NGOs
  const [availableNgos, setAvailableNgos] = useState<Array<{ name: string; id: string }>>([]);
  
  // NGO specific fields
  const [ngoInfo, setNgoInfo] = useState({
    name: '', // Organization name
    subtype: '', // e.g., 'Health NGO', 'Education NGO'
    city: '',
    categories: [] as string[], // Working areas/categories
    contactEmail: '',
    contactPhone: '',
    address: '',
    registrationNumber: '',
    establishedYear: 2024, // Fixed value to avoid hydration mismatch
    website: '',
  });
  
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    // Fetch available NGOs when component mounts
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

  const handleNgoInfoChange = (field: string, value: any) => {
    setNgoInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleNgoUserInfoChange = (field: string, value: any) => {
    setNgoUserInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleCategoriesChange = (value: string) => {
    const areas = value.split(',').map(area => area.trim()).filter(area => area);
    setNgoInfo(prev => ({ ...prev, categories: areas }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    try {
      let endpoint = `${API}/auth/register-ngo-user`;
      let body: any = { 
        ngoName: ngoUserInfo.ngoName, 
        name, 
        position: ngoUserInfo.position, 
        mobileNo: ngoUserInfo.mobileNo, 
        password 
      };
      
      if (userType === 'ngo') {
        endpoint = `${API}/auth/register-ngo`;
        body = { name, password, ngoInfo };
      }
      
      const r = await fetch(endpoint, {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.message || 'Register failed');
      
      if (userType === 'ngo') {
        // NGO registration - no tokens, needs verification
        alert(j.message || 'NGO registration successful! Your account is pending admin verification. You will be able to login once verified.');
        router.push('/auth/login');
      } else {
        // NGO User registration - direct login
        setTokens(j.accessToken, j.refreshToken);
        setIsLoggedIn(true);
        localStorage.setItem('userType', 'ngo-user');
        router.push('/');
      }
    } catch (e: any) { 
      setErr(e.message); 
    }
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
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-6 sm:p-8 lg:p-10 transform transition-all duration-500 hover:shadow-3xl hover:scale-[1.02]">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-4 transform transition-transform duration-300 hover:rotate-12">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Create Account
            </h2>
            <p className="text-gray-600 text-sm sm:text-base">Join our community today</p>
          </div>

          {/* User Type Toggle */}
          <div className="flex mb-6 bg-white/30 rounded-xl p-1">
            <button
              type="button"
              onClick={() => setUserType('ngo-user')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition ${
                userType === 'ngo-user'
                  ? 'bg-blue-600 text-white shadow-md'
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

          <form onSubmit={submit} className="space-y-5">
            <div className="transform transition-all duration-300 hover:scale-[1.02]">
              <input
                type="text"
                placeholder={userType === 'ngo' ? 'Contact Person Name' : 'Your Name'}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                suppressHydrationWarning
                className="text-black w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all duration-300 bg-white/50 backdrop-blur-sm hover:bg-white/80"
              />
            </div>

            {userType === 'ngo-user' && (
              <>
                <div className="transform transition-all duration-300 hover:scale-[1.02]">
                  <select
                    value={ngoUserInfo.ngoName}
                    onChange={(e) => handleNgoUserInfoChange('ngoName', e.target.value)}
                    required
                    className="text-black w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all duration-300 bg-white/50 backdrop-blur-sm hover:bg-white/80"
                  >
                    <option value="" disabled>Select NGO</option>
                    {availableNgos.map((ngo) => (
                      <option key={ngo.id} value={ngo.name}>
                        {ngo.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="transform transition-all duration-300 hover:scale-[1.02]">
                  <input
                    type="text"
                    placeholder="Position"
                    value={ngoUserInfo.position}
                    onChange={(e) => handleNgoUserInfoChange('position', e.target.value)}
                    required
                    className="text-black w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all duration-300 bg-white/50 backdrop-blur-sm hover:bg-white/80"
                  />
                </div>

                <div className="transform transition-all duration-300 hover:scale-[1.02]">
                  <input
                    type="tel"
                    placeholder="Mobile Number"
                    value={ngoUserInfo.mobileNo}
                    onChange={(e) => handleNgoUserInfoChange('mobileNo', e.target.value)}
                    required
                    className="text-black w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all duration-300 bg-white/50 backdrop-blur-sm hover:bg-white/80"
                  />
                </div>
              </>
            )}

            {userType === 'ngo' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Organization Name"
                    value={ngoInfo.name}
                    onChange={(e) => handleNgoInfoChange('name', e.target.value)}
                    required
                    className="text-black w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all duration-300 bg-white/50 backdrop-blur-sm hover:bg-white/80"
                  />
                  <input
                    type="text"
                    placeholder="NGO Type-Health NGO, Education NGO)"
                    value={ngoInfo.subtype}
                    onChange={(e) => handleNgoInfoChange('subtype', e.target.value)}
                    className="text-black w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all duration-300 bg-white/50 backdrop-blur-sm hover:bg-white/80"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="email"
                    placeholder="Contact Email"
                    value={ngoInfo.contactEmail}
                    onChange={(e) => handleNgoInfoChange('contactEmail', e.target.value)}
                    required
                    className="text-black w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all duration-300 bg-white/50 backdrop-blur-sm hover:bg-white/80"
                  />
                  <input
                    type="tel"
                    placeholder="Contact Phone"
                    value={ngoInfo.contactPhone}
                    onChange={(e) => handleNgoInfoChange('contactPhone', e.target.value)}
                    required
                    className="text-black w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all duration-300 bg-white/50 backdrop-blur-sm hover:bg-white/80"
                  />
                </div>

                <textarea
                  placeholder="Address"
                  value={ngoInfo.address}
                  onChange={(e) => handleNgoInfoChange('address', e.target.value)}
                  required
                  rows={3}
                  className="text-black w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all duration-300 bg-white/50 backdrop-blur-sm hover:bg-white/80 resize-none"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="City"
                    value={ngoInfo.city}
                    onChange={(e) => handleNgoInfoChange('city', e.target.value)}
                    required
                    className="text-black w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all duration-300 bg-white/50 backdrop-blur-sm hover:bg-white/80"
                  />
                  <input
                    type="text"
                    placeholder="Registration Number"
                    value={ngoInfo.registrationNumber}
                    onChange={(e) => handleNgoInfoChange('registrationNumber', e.target.value)}
                    className="text-black w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all duration-300 bg-white/50 backdrop-blur-sm hover:bg-white/80"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="number"
                    placeholder="Established Year"
                    value={ngoInfo.establishedYear}
                    onChange={(e) => handleNgoInfoChange('establishedYear', parseInt(e.target.value) || 2024)}
                    required
                    min="1900"
                    max={2024}
                    className="text-black w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all duration-300 bg-white/50 backdrop-blur-sm hover:bg-white/80"
                  />
                  <input
                    type="url"
                    placeholder="Website (optional)"
                    value={ngoInfo.website}
                    onChange={(e) => handleNgoInfoChange('website', e.target.value)}
                    className="text-black w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all duration-300 bg-white/50 backdrop-blur-sm hover:bg-white/80"
                  />
                </div>
              </>
            )}
            
            <div className="transform transition-all duration-300 hover:scale-[1.02]">
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="text-black w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all duration-300 bg-white/50 backdrop-blur-sm hover:bg-white/80"
              />
            </div>
            
            {err && <div className="text-red-600 text-sm bg-red-50 p-3 rounded-xl border border-red-200">{err}</div>}
            
            <button
              type="submit"
              suppressHydrationWarning
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-xl font-medium text-lg shadow-lg hover:shadow-xl transform transition-all duration-300 hover:scale-[1.02] hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-blue-300"
            >
              {userType === 'ngo-user' ? 'Register as NGO User' : 'Register NGO'}
            </button>
            
            <div className="text-center mt-6">
              <a href="/auth/login" className="text-blue-600 hover:text-blue-700 transition-colors duration-200 font-medium">
                Back to login
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}