import React, { useState } from 'react';
import { UserProfile, RenterPreferences } from '../types';
import { X, Filter, Sparkles, Check } from 'lucide-react';

interface PreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onSavePreferences: (prefs: RenterPreferences) => void;
}

const AVAILABLE_HOBBIES = [
  'Cooking', 'Gaming', 'Fitness', 'Reading', 'Yoga', 'Pottery', 'Music', 
  'Hiking', 'Photography', 'Anime', 'Board Games', 'Coding'
];

export default function PreferencesModal({
  isOpen,
  onClose,
  profile,
  onSavePreferences,
}: PreferencesModalProps) {
  const [prefs, setPrefs] = useState<RenterPreferences>({ ...profile.preferences });
  const [newHobby, setNewHobby] = useState('');

  if (!isOpen) return null;

  const handleToggleHobby = (hobby: string) => {
    if (prefs.hobbies.includes(hobby)) {
      setPrefs({ ...prefs, hobbies: prefs.hobbies.filter(h => h !== hobby) });
    } else {
      setPrefs({ ...prefs, hobbies: [...prefs.hobbies, hobby] });
    }
  };

  const handleAddCustomHobby = (e: React.FormEvent) => {
    e.preventDefault();
    if (newHobby.trim() && !prefs.hobbies.includes(newHobby.trim())) {
      setPrefs({ ...prefs, hobbies: [...prefs.hobbies, newHobby.trim()] });
      setNewHobby('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSavePreferences(prefs);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <Sparkles className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="font-display text-lg font-bold text-gray-900">Co-Living & Tenant Match Preferences</h3>
              <p className="text-xs text-gray-500">Optimizes matching compatibility and predicts match scores immediately</p>
            </div>
          </div>
          <button
            id="close-preference-modal"
            onClick={onClose}
            className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-900"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-5 max-h-[70vh] overflow-y-auto pr-2">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Budget */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Max Monthly Budget (INR)</label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="5000"
                  max="100000"
                  step="1000"
                  value={prefs.budget}
                  onChange={(e) => setPrefs({ ...prefs, budget: parseInt(e.target.value) })}
                  className="h-1.5 w-full cursor-pointer rounded-lg bg-gray-200 accent-emerald-600"
                />
                <span className="font-mono text-sm font-semibold text-emerald-700 min-w-[70px] text-right">
                  ₹{prefs.budget.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Office/Commute Location */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Workplace / Office Hub Locality</label>
              <input
                type="text"
                placeholder="e.g. Indiranagar, Bangalore"
                value={prefs.officeLocation}
                onChange={(e) => setPrefs({ ...prefs, officeLocation: e.target.value })}
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

          </div>

          <div className="border-t border-gray-100 pt-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Habits & Co-Living Compatibility Rules</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Pet Friendly */}
              <div className="flex items-center justify-between rounded-xl px-3 py-2.5 border border-gray-200 bg-gray-50/50">
                <div>
                  <p className="text-sm font-semibold text-gray-800">Pet Lover</p>
                  <p className="text-[10px] text-gray-500">Own or welcome pets</p>
                </div>
                <button
                  type="button"
                  id="toggle-pets"
                  onClick={() => setPrefs({ ...prefs, pets: !prefs.pets })}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    prefs.pets ? 'bg-emerald-600' : 'bg-gray-200'
                  }`}
                >
                  <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    prefs.pets ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* Non Veg cooking allowed */}
              <div className="flex items-center justify-between rounded-xl px-3 py-2.5 border border-gray-200 bg-gray-50/50">
                <div>
                  <p className="text-sm font-semibold text-gray-800">Non-Veg Cooking</p>
                  <p className="text-[10px] text-gray-500">Cook non-veg inside room</p>
                </div>
                <button
                  type="button"
                  id="toggle-nonveg"
                  onClick={() => setPrefs({ ...prefs, nonVeg: !prefs.nonVeg })}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    prefs.nonVeg ? 'bg-emerald-600' : 'bg-gray-200'
                  }`}
                >
                  <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    prefs.nonVeg ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* Smoking Habits */}
              <div className="flex items-center justify-between rounded-xl px-3 py-2.5 border border-gray-200 bg-gray-50/50">
                <div>
                  <p className="text-sm font-semibold text-gray-800">Smoking Habit</p>
                  <p className="text-[10px] text-gray-500">Check if you smoke</p>
                </div>
                <button
                  type="button"
                  id="toggle-smoking"
                  onClick={() => setPrefs({ ...prefs, smoking: !prefs.smoking })}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    prefs.smoking ? 'bg-emerald-600' : 'bg-gray-200'
                  }`}
                >
                  <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    prefs.smoking ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </button>
              </div>

            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Sleep Schedule */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Typical Sleep Schedule</label>
              <select
                value={prefs.sleepHours}
                onChange={(e) => setPrefs({ ...prefs, sleepHours: e.target.value as any })}
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="Early Bird (9 PM - 5 AM)">Early Bird (9 PM - 5 AM)</option>
                <option value="Standard (11 PM - 7 AM)">Standard (11 PM - 7 AM)</option>
                <option value="Night Owl (2 AM - 10 AM)">Night Owl (2 AM - 10 AM)</option>
              </select>
            </div>

            {/* Cleanliness Index */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Cleanliness & Neatness Habit</label>
              <select
                value={prefs.cleanLevel}
                onChange={(e) => setPrefs({ ...prefs, cleanLevel: e.target.value as any })}
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="High">High (Declutter daily, neat space is a priority)</option>
                <option value="Moderate">Moderate (Clean up regularly, casual style)</option>
                <option value="Spontaneous">Spontaneous (Cleaning is done when needed)</option>
              </select>
            </div>

          </div>

          {/* Roommate count preference */}
          <div className="space-y-1.5Col border-t border-gray-100 pt-4">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-2">Preferred Max Roommates Count</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((num) => (
                <button
                  type="button"
                  key={num}
                  onClick={() => setPrefs({ ...prefs, roommateCount: num })}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold border transition ${
                    prefs.roommateCount === num
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-100'
                      : 'border-gray-200 text-gray-600 bg-white hover:bg-gray-50'
                  }`}
                >
                  {num} Roommate{num > 1 ? 's' : ''}
                </button>
              ))}
            </div>
          </div>

          {/* Social Hobbies & Commute Matching */}
          <div className="space-y-1.5 border-t border-gray-100 pt-4">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-3">Hobbies & Social Activities (Supports Match Scorer)</label>
            
            <div className="flex flex-wrap gap-2 mb-3">
              {AVAILABLE_HOBBIES.map((hobby) => {
                const isSelected = prefs.hobbies.includes(hobby);
                return (
                  <button
                    type="button"
                    key={hobby}
                    onClick={() => handleToggleHobby(hobby)}
                    className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition select-none ${
                      isSelected
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200/50'
                    }`}
                  >
                    {isSelected && <Check className="h-3 w-3" />}
                    <span>{hobby}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add other custom interest..."
                value={newHobby}
                onChange={(e) => setNewHobby(e.target.value)}
                className="w-full text-xs rounded-xl border border-gray-200 px-3 py-2 focus:border-emerald-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddCustomHobby}
                className="rounded-xl bg-purple-50 px-4 py-2 text-xs font-bold text-purple-700 border border-purple-200 hover:bg-purple-100"
              >
                Add
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-500 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-100 transition"
            >
              Apply Changes
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
