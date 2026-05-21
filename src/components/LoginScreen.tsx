import React, { useState } from 'react';
import { UserProfile } from '../types';
import { ShieldCheck, User, Users, Mail, Phone, Lock, Sparkles, Building, Key, CheckCircle2, UserCheck } from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: (user: UserProfile) => void;
}

const PRESET_USERS: UserProfile[] = [
  {
    id: 'renter_1',
    name: 'Rohan Sharma',
    email: 'rohan.sharma@example.com',
    phone: '+91 98765 43210',
    role: 'renter',
    verificationStatus: {
      email: true,
      phone: true,
      id: true,
      income: true,
    },
    preferences: {
      budget: 25000,
      pets: true,
      nonVeg: true,
      smoking: false,
      sleepHours: 'Standard (11 PM - 7 AM)',
      roommateCount: 2,
      officeLocation: 'Indiranagar, Bangalore',
      cleanLevel: 'High',
      hobbies: ['Cooking', 'Gaming', 'Fitness', 'Reading'],
    },
    trustScore: 92,
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'owner_2',
    name: 'Priyamvada Sen',
    email: 'priyamvada.sen@example.com',
    phone: '+91 91234 56789',
    role: 'owner',
    verificationStatus: {
      email: true,
      phone: true,
      id: true,
      income: true,
    },
    preferences: {
      budget: 30000,
      pets: false,
      nonVeg: true,
      smoking: false,
      sleepHours: 'Early Bird (9 PM - 5 AM)',
      roommateCount: 1,
      officeLocation: 'Koramangala, Bangalore',
      cleanLevel: 'High',
      hobbies: ['Yoga', 'Pottery', 'Gardening'],
    },
    trustScore: 97,
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'owner_6',
    name: 'Kabir Thapar',
    email: 'kabir.thapar@example.com',
    phone: '+91 98888 77777',
    role: 'owner',
    verificationStatus: {
      email: true,
      phone: true,
      id: true,
      income: true,
    },
    preferences: {
      budget: 45000,
      pets: true,
      nonVeg: false,
      smoking: true,
      sleepHours: 'Night Owl (2 AM - 10 AM)',
      roommateCount: 0,
      officeLocation: 'Connaught Place, Delhi',
      cleanLevel: 'Moderate',
      hobbies: ['Architecture', 'Vinyl Collectibles', 'Espresso Brewing'],
    },
    trustScore: 94,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
  }
];

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [activeTab, setActiveTab] = useState<'preset' | 'custom'>('preset');
  const [role, setRole] = useState<'renter' | 'owner'>('renter');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [customAvatar, setCustomAvatar] = useState('https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80');

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    // Generate smart trust score based on inputs provided
    const hasPhone = phone.trim().length > 5;
    const computedTrustScore = 60 + (hasPhone ? 25 : 0) + 10; // basic checks

    const newUser: UserProfile = {
      id: 'custom_' + Date.now(),
      name,
      email,
      phone: phone || '+91 99999 00000',
      role,
      verificationStatus: {
        email: true,
        phone: hasPhone,
        id: true,
        income: false,
      },
      preferences: {
        budget: role === 'renter' ? 20000 : 0,
        pets: false,
        nonVeg: true,
        smoking: false,
        sleepHours: 'Standard (11 PM - 7 AM)',
        roommateCount: 2,
        officeLocation: 'Tech Park Area',
        cleanLevel: 'High',
        hobbies: ['Reading', 'Travel'],
      },
      trustScore: computedTrustScore,
      avatar: customAvatar,
    };

    onLoginSuccess(newUser);
  };

  const selectPresetUser = (user: UserProfile) => {
    onLoginSuccess(user);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Decorative Grid and Synapse glows */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:32px_32px] opacity-30 pointer-events-none" />
      <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 h-[600px] w-[600px] rounded-full bg-teal-500/10 blur-[120px] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-slate-950 font-display font-black text-xl shadow-lg shadow-emerald-500/20">
            SE
          </div>
        </div>
        <h2 className="text-center text-3xl font-extrabold tracking-tight text-white font-display">
          Welcome to <span className="text-emerald-400">StayEase</span>
        </h2>
        <p className="mt-2 text-center text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
          The verified P2P co-living platform styled for zero brokerage, direct matches, and automated trust evaluation indices.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg relative z-10">
        <div className="bg-slate-800/80 backdrop-blur-xl py-8 px-4 shadow-2xl rounded-2xl sm:px-10 border border-slate-700/50">
          
          {/* Tab Switchers */}
          <div className="flex rounded-xl bg-slate-950 p-1 mb-6 border border-slate-800">
            <button
              onClick={() => setActiveTab('preset')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                activeTab === 'preset'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Preset Test Profile Swaps
            </button>
            <button
              onClick={() => setActiveTab('custom')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                activeTab === 'custom'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Register Custom Account
            </button>
          </div>

          {activeTab === 'preset' ? (
            <div className="space-y-4">
              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">
                Choose a role to inspect from either side:
              </span>
              
              <div className="grid grid-cols-1 gap-3.5">
                {PRESET_USERS.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => selectPresetUser(u)}
                    className="w-full text-left bg-slate-900 border border-slate-700/60 hover:border-emerald-500/50 p-4 rounded-xl flex items-center justify-between transition duration-200 group hover:shadow-lg hover:shadow-emerald-950/20"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={u.avatar}
                        alt={u.name}
                        referrerPolicy="no-referrer"
                        className="h-11 w-11 rounded-full border border-slate-700 object-cover group-hover:scale-105 transition"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white block">{u.name}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            u.role === 'renter' 
                              ? 'bg-amber-400/10 text-amber-300 border border-amber-500/20' 
                              : 'bg-emerald-400/10 text-emerald-300 border border-emerald-500/20'
                          }`}>
                            {u.role === 'renter' ? 'Room Seeker' : 'Landlord'}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-1">{u.email}</span>
                      </div>
                    </div>

                    <div className="text-right flex flex-col items-end gap-1.5">
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-300 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        <ShieldCheck className="h-3 w-3" />
                        {u.trustScore}% Score
                      </span>
                      <span className="text-[10px] text-emerald-400 font-bold underline group-hover:translate-x-1 transition-transform block">
                        Quick Log In &rarr;
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-slate-700/50 rounded-xl bg-slate-900/40 p-3 text-slate-400 text-[11px] leading-relaxed flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Developer Notice:</strong> Choose <strong>Rohan</strong> to browse rooms, test matches and view 360 virtual tours, or select <strong>Priyamvada</strong> or <strong>Kabir</strong> to check incoming renter applications, accept matches, and write landlord logs.
                </span>
              </div>

            </div>
          ) : (
            <form onSubmit={handleCustomSubmit} className="space-y-4">
              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">
                Fill details to simulate matching algorithm:
              </span>

              {/* Role Select Button Group */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('renter')}
                  className={`py-2 p-3 text-xs font-bold rounded-xl border flex flex-col items-center justify-center gap-1 text-center transition ${
                    role === 'renter'
                      ? 'border-emerald-500 bg-emerald-500/10 text-white'
                      : 'border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700/25'
                  }`}
                >
                  <Users className="h-4 w-4 text-emerald-400" />
                  <span>I want an elegant Room / PG</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('owner')}
                  className={`py-2 p-3 text-xs font-bold rounded-xl border flex flex-col items-center justify-center gap-1 text-center transition ${
                    role === 'owner'
                      ? 'border-emerald-500 bg-emerald-500/10 text-white'
                      : 'border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700/25'
                  }`}
                >
                  <Building className="h-4 w-4 text-emerald-400" />
                  <span>I am a Room Landlord</span>
                </button>
              </div>

              {/* Name field */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 text-xs bg-slate-900 border border-slate-700 text-white rounded-xl focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Email field */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 text-xs bg-slate-900 border border-slate-700 text-white rounded-xl focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Phone field */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Mobile Number (For Verification)</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    type="tel"
                    placeholder="+91 99999 55555"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 text-xs bg-slate-900 border border-slate-700 text-white rounded-xl focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Avatar Selector Option */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">Select Profile Avatar</label>
                <div className="flex items-center gap-3">
                  {[
                    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
                    'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200&auto=format&fit=crop&q=80',
                    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&auto=format&fit=crop&q=80',
                    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80'
                  ].map((av, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setCustomAvatar(av)}
                      className={`h-10 w-10 rounded-full overflow-hidden border-2 transition ${
                        customAvatar === av ? 'border-emerald-500 scale-110' : 'border-slate-800'
                      }`}
                    >
                      <img src={av} alt="Avatar option" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-4 bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-bold text-xs py-3 rounded-xl transition duration-200 flex items-center justify-center gap-1.5"
              >
                <UserCheck className="h-4 w-4" />
                Initialize Custom StayEase Account
              </button>
            </form>
          )}

        </div>
      </div>

    </div>
  );
}
