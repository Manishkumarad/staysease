import React from 'react';
import { UserProfile } from '../types';
import { Building, Search, MessageSquare, Sparkles, User, Settings, RefreshCw, LogOut } from 'lucide-react';

interface NavigationProps {
  currentProfile: UserProfile;
  activeTab: 'browse' | 'listings' | 'inbox' | 'assistant';
  setActiveTab: (tab: 'browse' | 'listings' | 'inbox' | 'assistant') => void;
  onOpenPreferences: () => void;
  onChangeRole: (role: 'renter' | 'owner') => void;
  onLogout?: () => void;
}

export default function Navigation({
  currentProfile,
  activeTab,
  setActiveTab,
  onOpenPreferences,
  onChangeRole,
  onLogout,
}: NavigationProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-100 bg-white/85 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          
          {/* Brand Logo StayEase */}
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-white font-display font-bold shadow-md shadow-emerald-100">
              SE
            </div>
            <div>
              <span className="font-display text-base font-bold tracking-tight text-gray-900 leading-none block">StayEase</span>
              <span className="text-[10px] font-bold text-emerald-600 tracking-wider uppercase block mt-0.5">P2P Co-Living Hub</span>
            </div>
          </div>

          {/* Premium Nav Links Tabs */}
          <nav className="flex items-center gap-1 bg-gray-50 p-1.5 rounded-xl border border-gray-100">
            {currentProfile.role === 'renter' ? (
              <button
                id="tab-browse"
                onClick={() => setActiveTab('browse')}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'browse'
                    ? 'bg-white text-emerald-700 shadow-sm'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <Search className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Browse Rooms</span>
              </button>
            ) : (
              <button
                id="tab-listings"
                onClick={() => setActiveTab('listings')}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'listings'
                    ? 'bg-white text-emerald-700 shadow-sm'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <Building className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">My Listings</span>
              </button>
            )}

            <button
              id="tab-inbox"
              onClick={() => setActiveTab('inbox')}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'inbox'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Inbox Deals</span>
            </button>

            <button
              id="tab-assistant"
              onClick={() => setActiveTab('assistant')}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'assistant'
                  ? 'bg-white text-emerald-750 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">AI Assistant</span>
            </button>
          </nav>

          {/* Right Controls user actions */}
          <div className="flex items-center gap-3">
            
            {/* Role quick toggle */}
            <button
              id="toggle-role-btn"
              onClick={() => onChangeRole(currentProfile.role === 'renter' ? 'owner' : 'renter')}
              className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-705 bg-white hover:bg-gray-50 shadow-sm transition"
            >
              <RefreshCw className="h-3.5 w-3.5 text-emerald-600 animate-spin-slow" />
              <span className="hidden lg:inline">Switch to {currentProfile.role === 'renter' ? 'Landlord' : 'Renter'}</span>
              <span className="lg:hidden">{currentProfile.role === 'renter' ? 'Owner' : 'Renter'}</span>
            </button>

            {currentProfile.role === 'renter' && (
              <button
                id="edit-preferences"
                onClick={onOpenPreferences}
                className="rounded-xl border border-gray-200 p-2 text-gray-500 hover:bg-gray-50 hover:text-gray-950 shadow-sm"
                title="Matching Preferences"
              >
                <Settings className="h-4 w-4" />
              </button>
            )}

            {/* User Badge */}
            <div className="flex items-center gap-2">
              <img
                src={currentProfile.avatar}
                alt={currentProfile.name}
                className="h-8 w-8 rounded-full border border-gray-100 object-cover shadow-sm"
              />
              <div className="hidden lg:block text-left">
                <span className="text-xs font-bold text-gray-900 block leading-none">{currentProfile.name}</span>
                <span className="text-[9px] font-bold text-purple-600 uppercase tracking-wider block mt-0.5">Trust Score: {currentProfile.trustScore}%</span>
              </div>
            </div>

            {onLogout && (
              <button
                id="logout-btn"
                onClick={onLogout}
                className="rounded-xl border border-red-150 p-2 text-rose-500 hover:bg-rose-50 shadow-sm transition"
                title="Sign Out / Switch Profile"
              >
                <LogOut className="h-4 w-4" />
              </button>
            )}

          </div>

        </div>
      </div>
    </header>
  );
}
