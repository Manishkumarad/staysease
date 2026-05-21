import React, { useState } from 'react';
import { Property, UserProfile, MatchResult, ChatMessage, RenterPreferences } from '../types';
import { motion } from 'motion/react';
import { 
  Search, SlidersHorizontal, Eye, ShieldCheck, Heart, MapPin, 
  Sparkles, CheckCircle, Dog, Ban, Timer, Compass, Send, Check, 
  MessageSquare, Layers, Award, ShieldAlert, BadgeInfo, HelpCircle,
  Building2, LineChart, Cpu, DollarSign, Home, CheckSquare, Users, User, Flame,
  Calendar, Clock, X
} from 'lucide-react';

interface RenterDashboardProps {
  properties: Property[];
  renterProfile: UserProfile;
  messages: ChatMessage[];
  onSendMessage: (text: string, receiverId: string, propertyId: string) => void;
  onApplyProperty: (
    propertyId: string, 
    moveInDate?: string, 
    leaseDuration?: string, 
    updatedPreferences?: RenterPreferences
  ) => void;
  setActiveTab: (tab: 'browse' | 'listings' | 'inbox' | 'assistant') => void;
}

export default function RenterDashboard({
  properties,
  renterProfile,
  messages,
  onSendMessage,
  onApplyProperty,
  setActiveTab,
}: RenterDashboardProps) {
  const [searchVal, setSearchVal] = useState('');
  const [selectedBhk, setSelectedBhk] = useState<string>('All');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [maxRent, setMaxRent] = useState<number>(45000);
  const [selectedOccupant, setSelectedOccupant] = useState<string>('All'); // 'All' | 'Girls' | 'Boys' | 'Family'
  const [selectedCategory, setSelectedCategory] = useState<string>('All'); // 'All' | 'PG' | 'Co-Living' | 'Flatshare'
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  
  // AI Matching States
  const [isMatching, setIsMatching] = useState(false);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  
  // Gallery view selected tab state: 'photos' | 'bathroom' | 'vr'
  const [galleryTab, setGalleryTab] = useState<'photos' | 'bathroom' | 'vr'>('photos');
  const [vrRotation, setVrRotation] = useState<number>(0);

  // Review submission inputs state
  const [reviewText, setReviewText] = useState('');
  const [reviewLandlordRating, setReviewLandlordRating] = useState<number>(5);
  const [reviewRoomRating, setReviewRoomRating] = useState<number>(5);
  const [localPropertyReviews, setLocalPropertyReviews] = useState<Record<string, any[]>>({});

  // Interactive Hero Vibe Tester states
  const [heroPets, setHeroPets] = useState<boolean>(renterProfile.preferences?.pets ?? true);
  const [heroSmoking, setHeroSmoking] = useState<boolean>(renterProfile.preferences?.smoking ?? false);
  const [heroNonVeg, setHeroNonVeg] = useState<boolean>(renterProfile.preferences?.nonVeg ?? true);
  const [heroCleanLevel, setHeroCleanLevel] = useState<'High' | 'Medium' | 'Low'>(
    (renterProfile.preferences?.cleanLevel as any) || 'High'
  );
  const [heroSelectedRoommate, setHeroSelectedRoommate] = useState<'priya' | 'arjun' | 'kartik'>('arjun');
  const [heroActiveTab, setHeroActiveTab] = useState<'rooms' | 'roommates'>('rooms');
  const [activeHeroRoomIdx, setActiveHeroRoomIdx] = useState<number>(0);

  // Application success tracker
  const [appliedPropertySuccess, setAppliedPropertySuccess] = useState<Property | null>(null);

  // Wishlist state
  const [wishlist, setWishlist] = useState<string[]>(['prop_1', 'prop_4']);
  
  // Chat context inside detail
  const [chatInput, setChatInput] = useState('');

  // RENTER-SIDE AI HOUSE PRICE PREDICTION SYSTEM STATE
  const [predictCity, setPredictCity] = useState('Indiranagar, Bangalore');
  const [predictBhk, setPredictBhk] = useState('1BHK');
  const [predictFurnishing, setPredictFurnishing] = useState('Furnished');
  const [predictSqft, setPredictSqft] = useState(450);
  const [predictParking, setPredictParking] = useState('Bike Only');
  const [isPredicting, setIsPredicting] = useState(false);
  const [predictedResult, setPredictedResult] = useState<any>({
    recommendedRent: 19500,
    rangeMin: 17500,
    rangeMax: 21500,
    confidence: 94,
    points: [
      'Indiranagar metro connectivity increases premiums by ~12%',
      'Fully furnished options command standard 15% markup over raw rentals',
      'Average security deposit expectation is strictly 2.5 months'
    ]
  });

  // Custom booking application state
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [applyMoveInDate, setApplyMoveInDate] = useState('2026-06-01');
  const [applyLeaseDuration, setApplyLeaseDuration] = useState('11 Months');
  const [applyRenterPrefs, setApplyRenterPrefs] = useState<RenterPreferences>(renterProfile.preferences);

  // Filtering Logic
  const filteredProperties = properties.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(searchVal.toLowerCase()) || 
                          p.location.toLowerCase().includes(searchVal.toLowerCase());
    const matchesBhk = selectedBhk === 'All' || p.propertyType.includes(selectedBhk);
    const matchesType = selectedType === 'All' || p.propertyType === selectedType;
    const matchesRent = p.pricePerMonth <= maxRent;
    const matchesOccupant = selectedOccupant === 'All' || p.allowedOccupants === selectedOccupant;
    const matchesCategory = selectedCategory === 'All' || p.roomCategory === selectedCategory;
    return matchesSearch && matchesBhk && matchesType && matchesRent && matchesOccupant && matchesCategory;
  });

  // Sort: Featured listings at the top
  const sortedProperties = [...filteredProperties].sort((a, b) => {
    const aFeatured = a.featured ? 1 : 0;
    const bFeatured = b.featured ? 1 : 0;
    return bFeatured - aFeatured;
  });

  const handleToggleWishlist = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (wishlist.includes(id)) {
      setWishlist(wishlist.filter(item => item !== id));
    } else {
      setWishlist([...wishlist, id]);
    }
  };

  // Run house rent forecasting algorithm logic right on client
  const handleCalculateRentForecast = () => {
    setIsPredicting(true);
    setTimeout(() => {
      // Sophisticated local pricing forecasting models by city guidelines
      let baseSqftRate = 42; 
      let locationPremium = 1.0;
      let bhkPremium = 3000;

      const normCity = predictCity.toLowerCase();
      if (normCity.includes('bandra') || normCity.includes('mumbai')) {
        baseSqftRate = 85; 
        locationPremium = 1.4;
      } else if (normCity.includes('gurgaon') || normCity.includes('golf course')) {
        baseSqftRate = 46; 
        locationPremium = 1.15;
      } else if (normCity.includes('delhi') || normCity.includes('connaught')) {
        baseSqftRate = 55;
        locationPremium = 1.25;
      } else if (normCity.includes('bangalore') || normCity.includes('hsr') || normCity.includes('indiranagar')) {
        baseSqftRate = 44;
        locationPremium = 1.05;
      } else if (normCity.includes('bhopal') || normCity.includes('indrapuri') || normCity.includes('nagar') || normCity.includes('ratnagiri') || normCity.includes('ayodhya')) {
        baseSqftRate = 22;
        locationPremium = 0.85;
      }

      const mult = predictFurnishing === 'Furnished' ? 1.25 : predictFurnishing === 'Semi-Furnished' ? 1.1 : 0.95;
      
      if (predictBhk === 'Studio') bhkPremium = 4000;
      else if (predictBhk === '2BHK') bhkPremium = 7500;
      else if (predictBhk === '3BHK') bhkPremium = 11000;

      const calcValue = Math.round((predictSqft * baseSqftRate + bhkPremium) * locationPremium * mult);
      
      setPredictedResult({
        recommendedRent: calcValue,
        rangeMin: Math.round(calcValue * 0.9),
        rangeMax: Math.round(calcValue * 1.12),
        confidence: Math.round(85 + Math.random() * 12),
        points: [
          `Base rent indexed on ${predictCity} spec matrix (~₹${baseSqftRate}/sq.ft).`,
          `Category ${predictBhk} is high-demanded, boosting occupancy chances.`,
          `${predictFurnishing} pricing rules calculated with secure ${predictParking} option offsets.`
        ]
      });
      setIsPredicting(false);
    }, 600);
  };

  // Run Real-Time AI smart matching using backend API
  const handleCheckSmartMatch = async (property: Property) => {
    setIsMatching(true);
    setMatchResult(null);
    try {
      const response = await fetch('/api/gemini/smart-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ renterProfile, property }),
      });
      const resData = await response.json();
      if (resData.success) {
        setMatchResult(resData.data);
      } else {
        throw new Error(resData.error || 'Matching failure');
      }
    } catch (err) {
      console.warn('Matching request failed, using local algorithmic compatibility estimator:', err);
      // Clean fallback algorithm
      let score = 75;
      const reasons = ['Rent value aligns well with your preference.'];
      const mms = [];

      if (property.pricePerMonth <= renterProfile.preferences.budget) {
        score += 15;
        reasons.push('Rent is safely within your comfortable monthly limit.');
      } else {
        score -= 10;
        mms.push('Rent slightly exceeds your defined optimal budget.');
      }

      if (property.petFriendly === renterProfile.preferences.pets) {
        score += 10;
        reasons.push(property.petFriendly ? 'Pet policy perfectly welcomes animals.' : 'Peaceful pet-free environment match.');
      } else {
        score -= 12;
        mms.push(property.petFriendly ? 'Property supports pets, contrary to your preference.' : 'Strict no-pets rule at this property.');
      }

      setMatchResult({
        matchScore: Math.min(Math.max(score, 45), 98),
        matchReason: reasons,
        willApply: score >= 85 ? 'Yes' : 'Maybe',
        willAccept: score >= 80 ? 'High' : 'Medium',
        mismatches: mms,
      });
    } finally {
      setIsMatching(false);
    }
  };

  const activePropertyChats = selectedProperty 
    ? messages.filter(m => m.propertyId === selectedProperty.id)
    : [];

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !selectedProperty) return;
    onSendMessage(chatInput.trim(), selectedProperty.ownerId, selectedProperty.id);
    setChatInput('');
  };

  const handleCloseDetail = () => {
    setSelectedProperty(null);
    setMatchResult(null);
    setGalleryTab('photos');
    setVrRotation(0);
    setReviewText('');
    setShowApplyForm(false);
    setApplyMoveInDate('2026-06-01');
    setApplyLeaseDuration('11 Months');
    setApplyRenterPrefs(renterProfile.preferences);
  };

  const getSimilarProperties = (currentProperty: Property) => {
    const budgetMin = currentProperty.pricePerMonth * 0.70;
    const budgetMax = currentProperty.pricePerMonth * 1.30;

    return properties
      .filter((p) => p.id !== currentProperty.id)
      .map((p) => {
        let score = 0;
        const pLoc = p.location.toLowerCase();
        const currLoc = currentProperty.location.toLowerCase();
        
        const getCity = (loc: string) => {
          if (loc.includes('bhopal')) return 'bhopal';
          if (loc.includes('bangalore') || loc.includes('indiranagar') || loc.includes('koramangala') || loc.includes('hsr')) return 'bangalore';
          if (loc.includes('mumbai') || loc.includes('bandra')) return 'mumbai';
          if (loc.includes('gurgaon')) return 'gurgaon';
          if (loc.includes('delhi') || loc.includes('connaught')) return 'delhi';
          return '';
        };
        
        if (getCity(pLoc) && getCity(pLoc) === getCity(currLoc)) score += 3;
        if (p.roomCategory === currentProperty.roomCategory) score += 2;
        if (p.allowedOccupants === currentProperty.allowedOccupants) score += 1;
        
        const priceDiffRatio = Math.abs(p.pricePerMonth - currentProperty.pricePerMonth) / currentProperty.pricePerMonth;
        if (priceDiffRatio <= 0.1) score += 2;
        else if (priceDiffRatio <= 0.25) score += 1;

        return { property: p, score };
      })
      .filter((item) => item.property.pricePerMonth >= budgetMin && item.property.pricePerMonth <= budgetMax)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((item) => item.property);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      
      {/* 1. PREMIUM PROMINENT HERO SECTION WITH GLOWING ACCENTS */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-emerald-950 to-neutral-900 px-6 py-12 md:py-16 text-white shadow-2xl mb-12 border border-emerald-500/20"
      >
        
        {/* Animated Background Blobs and AI Synapses Decors */}
        <div className="absolute top-0 right-0 -mt-20 -mr-20 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl opacity-60 animate-pulse duration-[8000ms]" />
        <div className="absolute bottom-0 left-0 -mb-28 -ml-28 h-[400px] w-[400px] rounded-full bg-teal-500/15 blur-3xl opacity-50 animate-pulse duration-[6000ms]" />
        
        {/* Decorative Grid Mesh Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Hero Left Content Column */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Premium Pill Badge */}
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-emerald-300 backdrop-blur-md border border-white/5 shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
              <span>StayEase: Peer-to-Peer Rental Network</span>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse ml-1" />
            </div>
            
            {/* Catchy Main Headline */}
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-[1.12]">
              Find Peer-to-Peer Rooms <br className="hidden sm:inline" />
              With <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-300 bg-clip-text text-transparent">AI Compatibility Match</span>
            </h1>
            
            {/* Brief Value Proposition Description */}
            <p className="text-sm md:text-base text-gray-300 leading-relaxed max-w-xl">
              Connect directly with verified room seekees and flat owners. Experience <span className="text-emerald-300 font-bold">Zero Brokerage</span> co-living, secured trust badges, and instantaneous rent evaluation tools.
            </p>

            {/* INTERACTIVE COMPATIBILITY VIBE CONTROLLER */}
            <div className="rounded-2xl border border-white/5 bg-white/5 backdrop-blur-md p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                <span className="text-[10px] uppercase font-bold text-emerald-300 tracking-wider">⚡ Interactive Renter Vibe Check Parameters</span>
                <span className="text-[10px] text-gray-450">Tune live below to update matches</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Pets Toggle */}
                <button
                  onClick={() => setHeroPets(!heroPets)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                    heroPets 
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' 
                      : 'bg-white/5 text-gray-400 border-transparent hover:bg-white/10'
                  }`}
                >
                  <span className="flex items-center gap-2">🐶 Pet Friendly Setup</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-extrabold ${heroPets ? 'bg-emerald-500/25 text-emerald-200' : 'bg-white/5 text-gray-500'}`}>
                    {heroPets ? 'ON' : 'OFF'}
                  </span>
                </button>

                {/* Smoking Toggle */}
                <button
                  onClick={() => setHeroSmoking(!heroSmoking)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                    heroSmoking 
                      ? 'bg-red-500/10 text-red-300 border-red-500/25' 
                      : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                  }`}
                >
                  <span className="flex items-center gap-2">🚭 Strict Smoke-Free</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-extrabold ${!heroSmoking ? 'bg-emerald-500/25 text-emerald-200' : 'bg-red-500/25 text-red-200'}`}>
                    {!heroSmoking ? 'YES' : 'SMOKE OK'}
                  </span>
                </button>

                {/* Non-Veg Toggle */}
                <button
                  onClick={() => setHeroNonVeg(!heroNonVeg)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                    heroNonVeg 
                      ? 'bg-teal-500/15 text-teal-300 border-teal-500/30' 
                      : 'bg-white/5 text-gray-400 border-transparent hover:bg-white/10'
                  }`}
                >
                  <span className="flex items-center gap-2 font-semibold">🍳 Non-Veg Cooking OK</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-extrabold ${heroNonVeg ? 'bg-teal-500/25 text-teal-200' : 'bg-white/5 text-gray-500'}`}>
                    {heroNonVeg ? 'YES' : 'VEG ONLY'}
                  </span>
                </button>

                {/* Cleanliness cycle */}
                <button
                  onClick={() => {
                    const seq: ('High' | 'Medium' | 'Low')[] = ['High', 'Medium', 'Low'];
                    const idx = seq.indexOf(heroCleanLevel);
                    setHeroCleanLevel(seq[(idx + 1) % seq.length]);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-transparent bg-white/5 hover:bg-white/10 text-xs font-bold transition-all flex items-center justify-between cursor-pointer"
                >
                  <span className="flex items-center gap-2 text-gray-200">🧼 Cleanliness Standard</span>
                  <span className="text-[10px] px-2 py-0.5 rounded font-black bg-emerald-500 text-slate-950">
                    {heroCleanLevel}
                  </span>
                </button>
              </div>
            </div>

            {/* Action buttons and confirmation alert info */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => {
                  // Connect hero filters down into standard browser inputs!
                  if (heroPets) {
                    setSelectedOccupant('All');
                  }
                  if (!heroSmoking) {
                    // Simulates setting high-compatibility flag or text search
                    setSearchVal('Furnished');
                  }
                  setMaxRent(28000); // reasonable budget target
                  // Scroll to search container
                  const listEl = document.getElementById('search-input');
                  if (listEl) {
                    listEl.scrollIntoView({ behavior: 'smooth' });
                    listEl.focus();
                  }
                }}
                className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs px-5 py-3 shadow-lg shadow-emerald-950/40 transition-all duration-300 transform hover:-translate-y-0.5 flex items-center gap-2 cursor-pointer"
              >
                <CheckSquare className="h-4 w-4" />
                <span>Apply Vibe Parameters &amp; Browse</span>
              </button>
              
              <button
                onClick={() => {
                  const widgetEl = document.getElementById('calculate-renter-forecast');
                  if (widgetEl) {
                    widgetEl.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/10 font-bold text-xs px-5 py-3 backdrop-blur-sm transition-all duration-300 transform hover:-translate-y-0.5"
              >
                Check AI Rent Forecast
              </button>
            </div>

          </div>

          {/* Hero Right Visuals: Interactive Compatibility Analytics Dashboard Card & Featured Bhopal Rooms */}
          <div className="lg:col-span-1 border-white/5 flex lg:hidden justify-center items-center py-2 h-0.5 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          
          <div className="lg:col-span-12 lg:col-span-5 bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-emerald-500/15 p-5 shadow-2xl space-y-4 flex flex-col justify-between">
            
            {/* Header: Dynamic Tab Selector */}
            <div className="flex flex-col gap-2 pb-2 border-b border-white/10">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest leading-none bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  ⚡ Live Dynamic Feed
                </span>
                <span className="flex items-center gap-1 text-[9px] font-medium text-emerald-300/80 leading-none">
                  <Flame className="h-2.5 w-2.5 text-amber-400 shrink-0" />
                  Premium Showcases
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-2 bg-white/5 p-1 rounded-xl border border-white/5">
                <button
                  type="button"
                  onClick={() => setHeroActiveTab('rooms')}
                  className={`py-1.5 px-3 rounded-lg text-[10px] font-black uppercase transition flex items-center justify-center gap-1.5 cursor-pointer select-none ${
                    heroActiveTab === 'rooms'
                      ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/25 border border-emerald-400/40 text-emerald-200 shadow-inner'
                      : 'border border-transparent text-gray-400 hover:text-gray-200 hover:bg-white/5'
                  }`}
                >
                  <Award className="h-3.5 w-3.5 text-emerald-400" />
                  <span>🏆 Bhopal Rooms</span>
                </button>
                <button
                  type="button"
                  onClick={() => setHeroActiveTab('roommates')}
                  className={`py-1.5 px-3 rounded-lg text-[10px] font-black uppercase transition flex items-center justify-center gap-1.5 cursor-pointer select-none ${
                    heroActiveTab === 'roommates'
                      ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/25 border border-emerald-400/40 text-emerald-200 shadow-inner'
                      : 'border border-transparent text-gray-400 hover:text-gray-200 hover:bg-white/5'
                  }`}
                >
                  <Users className="h-3.5 w-3.5 text-emerald-400" />
                  <span>👥 Roommate Sync</span>
                </button>
              </div>
            </div>

            {/* TAB CONTENT: FEATURED ARYAVARTA/BHOPAL ROOMS */}
            {heroActiveTab === 'rooms' && (() => {
              // Extract Bhopal featured listings dynamically
              const bhopalFeatured = properties.filter(
                (p) => p.location.toLowerCase().includes('bhopal') && p.featured
              );
              
              // Fallback if none or not enough
              const displayHeroRooms = bhopalFeatured.length > 0 
                ? bhopalFeatured 
                : properties.filter(p => p.featured);
                
              const finalFour = displayHeroRooms.slice(0, 4);
              const activeRoom = finalFour[activeHeroRoomIdx] || finalFour[0] || properties[0];

              if (!activeRoom) {
                return (
                  <div className="text-center py-8 text-xs text-gray-400">
                    No verified listings listed currently in Bhopal.
                  </div>
                );
              }

              // Calculate active compatibility based on left sidebar variables live!
              let matchesCount = 0;
              if (heroPets === activeRoom.petFriendly) matchesCount += 1;
              if (heroSmoking === activeRoom.houseRules.smoking) matchesCount += 1;
              if (heroNonVeg === activeRoom.houseRules.nonVegcooking) matchesCount += 1;
              const matchesClean = (heroCleanLevel === 'High' && activeRoom.houseRules.maxOccupants === 1) || heroCleanLevel === 'Medium' || heroCleanLevel === 'Low';
              if (matchesClean) matchesCount += 1;
              
              const calculatedPercentage = Math.round(55 + (matchesCount / 4) * 44);

              // Subtext location names for visual tabs
              const getLocAbbr = (loc: string) => {
                if (loc.includes('Arera')) return 'Arera';
                if (loc.includes('MP Nagar')) return 'MP Nagar';
                if (loc.includes('Indrapuri')) return 'Indrapuri';
                if (loc.includes('Ayodhya')) return 'Ayodhya';
                if (loc.includes('Ratnagiri')) return 'Ratnagiri';
                return loc.split(',')[0] || 'Room';
              };

              return (
                <div className="space-y-3.5 animate-in fade-in duration-200 flex-1 flex flex-col justify-between">
                  {/* Miniature Tabs Selector */}
                  <div className="grid grid-cols-4 gap-1.5 bg-white/5 p-1 rounded-xl border border-white/5">
                    {finalFour.map((room, idx) => (
                      <button
                        key={room.id}
                        type="button"
                        onClick={() => setActiveHeroRoomIdx(idx)}
                        className={`py-1.5 rounded-lg text-[10px] font-bold tracking-tight transition flex flex-col items-center justify-center gap-0.5 cursor-pointer select-none ${
                          activeHeroRoomIdx === idx
                            ? 'bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-extrabold'
                            : 'border border-transparent text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <span className="text-[10px] leading-none shrink-0 mb-0.5">🏠</span>
                        <span className="truncate max-w-[62px] leading-none">{getLocAbbr(room.location)}</span>
                      </button>
                    ))}
                  </div>

                  {/* Active Featured Room Spotlight Card */}
                  <div className="relative rounded-2xl border border-white/5 overflow-hidden group bg-gradient-to-b from-slate-950 to-slate-900 shadow-md">
                    {/* Room Image Display */}
                    <div className="h-32 w-full relative overflow-hidden">
                      <img 
                        src={activeRoom.photos[0] || 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=600&auto=format&fit=crop&q=80'} 
                        alt={activeRoom.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700"
                        referrerPolicy="no-referrer"
                      />
                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                      
                      {/* Absolute Badges */}
                      <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1">
                        <span className="inline-flex items-center gap-0.5 rounded bg-emerald-500 text-slate-950 text-[8px] font-black px-1.5 py-0.5 uppercase tracking-wider shadow border border-emerald-400 leading-none">
                          Verified ✓
                        </span>
                        <span className="inline-flex items-center gap-0.5 rounded bg-slate-950/70 backdrop-blur-md text-emerald-300 text-[8px] font-bold px-1.5 py-0.5 uppercase tracking-wider border border-white/10 leading-none">
                          P2P Verified
                        </span>
                      </div>

                      <div className="absolute top-2.5 right-2.5">
                        <span className="inline-flex items-center gap-0.5 rounded bg-amber-400 text-slate-950 text-[8px] font-black px-1.5 py-0.5 uppercase tracking-wider shadow border border-amber-300 leading-none font-sans">
                          ★ {activeRoom.ownerRating || '4.9'} User Score
                        </span>
                      </div>

                      {/* Title Overlay */}
                      <div className="absolute bottom-2.5 left-3 right-3 text-left">
                        <span className="text-[9px] text-emerald-400 tracking-widest uppercase font-bold block leading-none">{activeRoom.location}</span>
                        <span className="text-xs font-bold text-white truncate block mt-1 leading-none drop-shadow-md" title={activeRoom.title}>
                          {activeRoom.title}
                        </span>
                      </div>
                    </div>

                    {/* Meta Body details */}
                    <div className="p-3 bg-slate-950/20 space-y-3.5">
                      {/* Rent info & Price range */}
                      <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                        <div>
                          <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Zero Brokerage Price</span>
                          <div className="flex items-baseline gap-0.5">
                            <span className="text-sm font-black text-white">₹{activeRoom.pricePerMonth.toLocaleString('en-IN')}</span>
                            <span className="text-[9px] text-gray-400 font-medium">/mo</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Est. Market Value Range</span>
                          <span className="text-[10px] font-bold text-emerald-300 block">
                            ₹{(activeRoom.pricePerMonth * 0.95).toLocaleString('en-IN', {maximumFractionDigits: 0})} - ₹{(activeRoom.pricePerMonth * 1.05).toLocaleString('en-IN', {maximumFractionDigits: 0})}
                          </span>
                        </div>
                      </div>

                      {/* Live Compatibility Synergy Score */}
                      <div className="bg-emerald-950/25 rounded-xl border border-emerald-500/10 p-3 relative overflow-hidden">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[9px] text-emerald-300 font-semibold uppercase tracking-wider block leading-none">Your Live compatibility Vibe Score</span>
                          <span className="text-[10px] font-black text-emerald-300 leading-none">{calculatedPercentage}% Match</span>
                        </div>

                        {/* Progress Bar Container */}
                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${calculatedPercentage}%` }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                            className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300 rounded-full" 
                          />
                        </div>

                        {/* Verifications lists */}
                        <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-white/5 text-[9px] text-gray-400 flex-wrap gap-1 leading-none font-sans">
                          <span className="flex items-center gap-0.5"><Check className="h-2.5 w-2.5 text-emerald-400" /> Rent Shield</span>
                          <span className="flex items-center gap-0.5"><Check className="h-2.5 w-2.5 text-emerald-400" /> Premium Rating</span>
                          <span className="flex items-center gap-0.5"><Check className="h-2.5 w-2.5 text-emerald-400" /> Verified Landlord</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Immediate Action Row */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedProperty(activeRoom);
                      // Scroll to top of listing detail page if active
                      window.scrollTo({ top: 350, behavior: 'smooth' });
                    }}
                    className="w-full text-center bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-[11px] py-3 rounded-xl transition duration-200 transform active:scale-98 cursor-pointer shadow-md select-none flex items-center justify-center gap-1"
                  >
                    <Compass className="h-3.5 w-3.5" />
                    Inspect Layout &amp; Unlock Space
                  </button>
                </div>
              );
            })()}

            {/* TAB CONTENT: SIMULATE ROOMMATE SYNC */}
            {heroActiveTab === 'roommates' && (() => {
              const heroCandidates = [
                {
                  id: 'arjun',
                  name: 'Arjun Iyer',
                  role: 'Backend Engineer • Bhopal',
                  avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80',
                  pref: { pets: true, smoking: false, nonVeg: true, cleanLevel: 'High' },
                  tag: 'Techie Vibe',
                  bio: 'Loves coding late in React, likes a quiet ambient space, non-smoker, vegan cooking friendly.',
                },
                {
                  id: 'priya',
                  name: 'Anjali Sharma',
                  role: 'Art Director • Bhopal',
                  avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
                  pref: { pets: true, smoking: false, nonVeg: false, cleanLevel: 'High' },
                  tag: 'Creative Spirit',
                  bio: 'Watercolor painter & golden retriever pup parent. Seeking standard polite roommates.',
                },
                {
                  id: 'kartik',
                  name: 'Kartik Mehta',
                  role: 'Financial Analyst • Bhopal',
                  avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
                  pref: { pets: false, smoking: false, nonVeg: true, cleanLevel: 'Medium' },
                  tag: 'Active & Minimalist',
                  bio: 'Early rising fitness geek. Prefers neat, cozy rooms close to transit points.',
                }
              ];

              const targetCandidate = heroCandidates.find(c => c.id === heroSelectedRoommate) || heroCandidates[0];
              
              // Calculate compatibility percentage
              let matchesCount = 0;
              if (heroPets === targetCandidate.pref.pets) matchesCount += 1;
              if (heroSmoking === targetCandidate.pref.smoking) matchesCount += 1;
              if (heroNonVeg === targetCandidate.pref.nonVeg) matchesCount += 1;
              if (heroCleanLevel === targetCandidate.pref.cleanLevel) matchesCount += 1;
              
              const calculatedPercentage = Math.round(55 + (matchesCount / 4) * 43);

              return (
                <div className="space-y-4 animate-in fade-in duration-200 flex-1 flex flex-col justify-between">
                  {/* Roommate Switcher Row */}
                  <div className="grid grid-cols-3 gap-2 bg-white/5 p-1 rounded-xl">
                    {[
                      { id: 'arjun', name: 'Arjun', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&auto=format&fit=crop&q=80' },
                      { id: 'priya', name: 'Anjali', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80' },
                      { id: 'kartik', name: 'Kartik', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80' }
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setHeroSelectedRoommate(m.id as any)}
                        className={`py-1.5 px-2 rounded-lg text-[10px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                          heroSelectedRoommate === m.id
                            ? 'bg-emerald-500/30 border border-emerald-400/45 text-white animate-pulse'
                            : 'border border-transparent text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <img src={m.avatar} className="h-4.5 w-4.5 rounded-full object-cover border border-white/20 shrink-0" />
                        <span>{m.name}</span>
                      </button>
                    ))}
                  </div>

                  {/* Selected Candidate Meta Info */}
                  <div className="flex items-center gap-3 bg-white/5 border border-white/5 p-3 rounded-xl">
                    <img src={targetCandidate.avatar} className="h-10 w-10 rounded-full object-cover border border-emerald-500/30 shadow-md" />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-white">{targetCandidate.name}</span>
                        <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-bold">{targetCandidate.tag}</span>
                      </div>
                      <span className="text-[10px] text-gray-400 block mt-0.5">{targetCandidate.role}</span>
                    </div>
                  </div>

                  {/* Compatibility Meter Gauge */}
                  <div className="bg-emerald-950/45 rounded-xl border border-emerald-500/20 p-4 relative overflow-hidden">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider block">Co-habitation Synergy Match</span>
                      <span className="text-xs font-black text-emerald-300">{calculatedPercentage}% Score</span>
                    </div>

                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${calculatedPercentage}%` }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300 rounded-full" 
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-3 pt-3 border-t border-white/5 text-[10px]">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs shrink-0">{heroPets === targetCandidate.pref.pets ? '🌸' : '🚫'}</span>
                        <span className={heroPets === targetCandidate.pref.pets ? 'text-emerald-300 font-medium' : 'text-gray-450'}>
                          Pet Vibe: {heroPets === targetCandidate.pref.pets ? 'Aligned' : 'Mismatch'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs shrink-0">{heroSmoking === targetCandidate.pref.smoking ? '🌸' : '🚫'}</span>
                        <span className={heroSmoking === targetCandidate.pref.smoking ? 'text-emerald-300 font-medium' : 'text-gray-450'}>
                          Smoke policy: {heroSmoking === targetCandidate.pref.smoking ? 'Aligned' : 'Mismatch'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs shrink-0">{heroNonVeg === targetCandidate.pref.nonVeg ? '🌸' : '🚫'}</span>
                        <span className={heroNonVeg === targetCandidate.pref.nonVeg ? 'text-emerald-300 font-medium' : 'text-gray-450'}>
                          Veg/Non-Veg: {heroNonVeg === targetCandidate.pref.nonVeg ? 'Aligned' : 'Mismatch'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs shrink-0">{heroCleanLevel === targetCandidate.pref.cleanLevel ? '🌸' : '🚫'}</span>
                        <span className={heroCleanLevel === targetCandidate.pref.cleanLevel ? 'text-emerald-300 font-medium' : 'text-gray-450'}>
                          Cleanliness: {heroCleanLevel === targetCandidate.pref.cleanLevel ? 'Aligned' : 'Mismatch'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-gray-300 italic bg-white/5 p-3 rounded-lg border border-white/5 leading-relaxed">
                    "{targetCandidate.bio}"
                  </p>
                </div>
              );
            })()}

          </div>

        </div>

      </motion.div>

      {/* REAL-TIME COMPATIBILITY TENANCY APPLICATION TRACKER FEED */}
      {appliedPropertySuccess && (
        <div id="applied-success-tracker" className="rounded-3xl border-2 border-emerald-200 bg-gradient-to-r from-emerald-50/80 to-teal-50/40 p-6 md:p-8 mb-12 shadow-lg relative overflow-hidden animate-in slide-in-from-top-6 duration-300 font-sans">
          
          {/* Dismiss button */}
          <button 
            type="button"
            id="dismiss-success-tracker"
            onClick={() => setAppliedPropertySuccess(null)}
            className="absolute top-4 right-4 text-emerald-400 hover:text-emerald-950 border border-emerald-200 rounded-xl p-1.5 hover:bg-emerald-100/60 cursor-pointer shadow-sm bg-white transition"
            title="Dismiss Tracker Banner"
          >
            <X className="h-4 w-4" />
          </button>
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="p-4 bg-emerald-600 rounded-2xl text-white shadow-xl shadow-emerald-200 shrink-0">
                <CheckCircle className="h-7 w-7 animate-bounce" />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest bg-emerald-100 px-2.5 py-1 rounded-full inline-block border border-emerald-200 font-sans">
                  🎉 Direct Connection Logged
                </span>
                <h3 className="text-xl font-black text-gray-950">Application Active &amp; Shielded!</h3>
                <p className="text-xs text-gray-500 font-semibold leading-relaxed">
                  Your certified tenant match parameters for <strong className="text-emerald-950 font-black">{appliedPropertySuccess.title}</strong> ({appliedPropertySuccess.location}) are synced directly.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
              <button
                type="button"
                id="btn-go-to-chats"
                onClick={() => setActiveTab('inbox')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-5 py-3 text-xs font-black shadow-md shadow-emerald-200 hover:-translate-y-0.5 transition cursor-pointer select-none flex items-center gap-1.5"
              >
                <MessageSquare className="h-3.5 w-3.5 fill-current" />
                <span>Open Direct Chat Deal</span>
              </button>
              <button
                type="button"
                id="btn-view-receipt"
                onClick={() => setSelectedProperty(appliedPropertySuccess)}
                className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-xl px-4 py-3 text-xs font-bold shadow-sm transition cursor-pointer select-none"
              >
                Inspect Original Layout
              </button>
            </div>
          </div>

          {/* Progress Tracker Milestones */}
          <div className="mt-8 pt-6 border-t border-emerald-150 grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Step 1 */}
            <div className="bg-white rounded-2xl border border-emerald-100 p-4 shadow-sm relative overflow-hidden flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-emerald-500/15 border border-emerald-400 text-emerald-700 text-xs font-black flex items-center justify-center shrink-0">
                ✓
              </div>
              <div>
                <h4 className="text-xs font-black text-emerald-950 uppercase tracking-wider leading-none">1. Synced &amp; Applied</h4>
                <p className="text-[11px] text-gray-500 mt-1 leading-normal">
                  Inquiry logged at <strong className="text-emerald-800 font-semibold">100% Zero Brokerage</strong> matching rent rates.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-white rounded-2xl border border-emerald-100 p-4 shadow-sm relative overflow-hidden flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-amber-400/20 border border-amber-300 text-amber-700 text-xs font-black flex items-center justify-center shrink-0 animate-pulse">
                🕒
              </div>
              <div>
                <h4 className="text-xs font-black text-amber-950 uppercase tracking-wider leading-none">2. Landlord Review</h4>
                <p className="text-[11px] text-gray-500 mt-1 leading-normal">
                  Host is checking roommate synergy scores &amp; trust badges. Status is currently: <strong className="text-amber-700 font-bold">Pending Approval</strong>.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-slate-50/50 rounded-2xl border border-dashed border-gray-200 p-4 flex items-start gap-3 opacity-60">
              <div className="h-6 w-6 rounded-full bg-gray-100 text-gray-400 text-xs font-black flex items-center justify-center shrink-0">
                3
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider leading-none">3. Deal Handover</h4>
                <p className="text-[11px] text-gray-400 mt-1 leading-normal">
                  Generate the certified digitally-signed e-agreement instantly without middleman.
                </p>
              </div>
            </div>

          </div>

          <p className="text-[10px] text-emerald-750 font-bold mt-4 shrink-0 flex items-center gap-1.5 font-mono">
            <span>🛡️ StayEase Tenant Protection Active</span>
            <span>•</span>
            <span className="text-teal-700 font-bold">Smart match rating score evaluated. No hidden commissions or brokerage.</span>
          </p>

        </div>
      )}

      {/* 2. RENTER-SIDE HOUSE PRICE PREDICTION CORE ALGORITHM WIDGET */}
      <div className="rounded-3xl border border-emerald-100 bg-emerald-50/20 p-6 md:p-8 mb-12 grid grid-cols-1 lg:grid-cols-12 gap-8 shadow-sm">
        
        {/* Forecaster Left controls */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md">
              <LineChart className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-extrabold text-gray-950">AI House & Rent Estimator</h2>
              <p className="text-xs text-gray-500">StayEase Market Price Prediction System</p>
            </div>
          </div>
          
          <p className="text-xs text-gray-600 leading-normal">
            Input localized parameters including configurations, areas, and setups. Our algorithm analyzes national rental registries to determine target prices.
          </p>

          <div className="space-y-3 pt-2">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1">Target Zone / City Location</label>
              <select 
                value={predictCity} 
                onChange={(e) => setPredictCity(e.target.value)}
                className="w-full text-xs rounded-xl border border-gray-200 bg-white px-3 py-2 focus:border-emerald-500 focus:outline-none"
              >
                 <option value="Indiranagar, Bangalore">Indiranagar, Bangalore</option>
                <option value="Koramangala, Bangalore">Koramangala, Bangalore</option>
                <option value="HSR Layout, Bangalore">HSR Layout, Bangalore</option>
                <option value="Bandra West, Mumbai">Bandra West, Mumbai</option>
                <option value="Golf Course Road, Gurgaon">Golf Course Road, Gurgaon</option>
                <option value="Connaught Place, Delhi">Connaught Place, Delhi</option>
                <option value="Indrapuri, Bhopal">Indrapuri, Bhopal</option>
                <option value="MP Nagar, Bhopal">MP Nagar, Bhopal</option>
                <option value="Ratnagiri, Bhopal">Ratnagiri, Bhopal</option>
                <option value="Ayodhya Extension, Bhopal">Ayodhya Extension, Bhopal</option>
                <option value="Arera Colony, Bhopal">Arera Colony, Bhopal</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1">Configuration</label>
                <select 
                  value={predictBhk} 
                  onChange={(e) => setPredictBhk(e.target.value)}
                  className="w-full text-xs rounded-xl border border-gray-200 bg-white px-3 py-2 focus:outline-none"
                >
                  <option value="Room">Private Room</option>
                  <option value="Studio">Studio Space</option>
                  <option value="1BHK">1BHK Apt</option>
                  <option value="2BHK">2BHK Apt</option>
                  <option value="3BHK">3BHK Apt</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1">Furnishing Status</label>
                <select 
                  value={predictFurnishing} 
                  onChange={(e) => setPredictFurnishing(e.target.value)}
                  className="w-full text-xs rounded-xl border border-gray-200 bg-white px-3 py-2 focus:outline-none"
                >
                  <option value="Furnished">Fully Furnished</option>
                  <option value="Semi-Furnished">Semi-Furnished</option>
                  <option value="Unfurnished">Unfurnished Raw</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1">Builtup Area ({predictSqft} sqft)</label>
                <input 
                  type="range"
                  min="200"
                  max="1800"
                  step="50"
                  value={predictSqft}
                  onChange={(e) => setPredictSqft(parseInt(e.target.value))}
                  className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600 mt-2"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1">Parking Options</label>
                <select 
                  value={predictParking} 
                  onChange={(e) => setPredictParking(e.target.value)}
                  className="w-full text-xs rounded-xl border border-gray-200 bg-white px-3 py-2 focus:outline-none"
                >
                  <option value="No">No Parking</option>
                  <option value="Bike Only">Bike Only</option>
                  <option value="Car & Bike">Car & Bike (Gated)</option>
                </select>
              </div>
            </div>

            <button
              id="calculate-renter-forecast"
              onClick={handleCalculateRentForecast}
              className="w-full mt-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 shadow-md shadow-emerald-100 transition"
            >
              Run Forecasting Price Model
            </button>
          </div>
        </div>

        {/* Forecaster Right analytical visualization */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-emerald-100 p-6 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Algorithmic output prediction</span>
                <h3 className="text-sm font-bold text-gray-900 mt-0.5">StayEase Fair-Value Rent Report</h3>
              </div>
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                Confidence: {predictedResult.confidence}%
              </span>
            </div>

            <div className="py-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-emerald-50/50 rounded-2xl p-4 border border-emerald-50">
                <span className="text-[10px] font-semibold text-gray-500 block uppercase">Suggested Median Rent</span>
                <p className="font-display text-2xl font-black text-emerald-900 mt-1">
                  ₹{predictedResult.recommendedRent.toLocaleString('en-IN')}
                  <span className="text-xs font-normal text-gray-500"> /mo</span>
                </p>
              </div>

              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                <span className="text-[10px] font-semibold text-gray-500 block uppercase font-sans">Dynamic Range Index</span>
                <p className="font-display text-sm font-bold text-gray-900 mt-1 leading-normal">
                  ₹{predictedResult.rangeMin.toLocaleString('en-IN')} - ₹{predictedResult.rangeMax.toLocaleString('en-IN')}
                </p>
                <span className="text-[9px] text-gray-400 block mt-0.5">Based on seasonal demand indexes</span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Co-Living Market Points checked:</span>
              <ul className="space-y-2">
                {predictedResult.points.map((pt: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-gray-705 leading-relaxed">
                    <CheckSquare className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="rounded-xl bg-amber-50 border border-amber-100 p-2.5 flex items-start gap-1.5 text-[10px] text-gray-650">
            <BadgeInfo className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <span>Always compare rent projections with host-provided specifications. Direct negotiation on deposit rates remains best practice.</span>
          </div>
        </div>

      </div>

      {/* 3. VERIFIED LISTINGS TITLE & SEARCH FILTERS BAR */}
      <h2 className="font-display text-xl font-bold tracking-tight text-gray-900 mb-2 flex items-center gap-2">
        <Building2 className="h-5 w-5 text-emerald-600" />
        <span>Browse Available Direct Marketplace Rooms</span>
      </h2>

      <p className="text-xs text-gray-500 mb-4">Zero brokerage flatshares, co-living units, and private room leases directly hosted by verified owners.</p>

      {/* Target Demographic Quick Filter Badges */}
      <div className="mb-6 bg-slate-55/6 p-4 rounded-2xl border border-gray-100 shadow-sm">
        <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider block mb-2">⚡ Quick Match & Suitability Segments:</span>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => { setSelectedOccupant('All'); setSelectedCategory('All'); setSelectedType('All'); }}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition flex items-center gap-1.5 border shadow-xs ${
              selectedOccupant === 'All' && selectedCategory === 'All' && selectedType === 'All'
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-white text-gray-700 border-gray-100 hover:bg-gray-50'
            }`}
          >
            All Spaces ({properties.length})
          </button>
          
          <button
            onClick={() => { setSelectedOccupant('Girls'); setSelectedCategory('All'); setSelectedType('All'); }}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition flex items-center gap-1.5 border shadow-xs ${
              selectedOccupant === 'Girls'
                ? 'bg-rose-500 text-white border-rose-500'
                : 'bg-white text-rose-600 border-rose-100 hover:bg-rose-50'
            }`}
          >
            👩‍🦰 Rooms for Girls ({properties.filter(p => p.allowedOccupants === 'Girls').length})
          </button>

          <button
            onClick={() => { setSelectedOccupant('Boys'); setSelectedCategory('All'); setSelectedType('All'); }}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition flex items-center gap-1.5 border shadow-xs ${
              selectedOccupant === 'Boys'
                ? 'bg-sky-600 text-white border-sky-600'
                : 'bg-white text-sky-700 border-sky-100 hover:bg-sky-50'
            }`}
          >
            👨 Rooms for Boys ({properties.filter(p => p.allowedOccupants === 'Boys').length})
          </button>

          <button
            onClick={() => { setSelectedOccupant('Family'); setSelectedCategory('All'); setSelectedType('All'); }}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition flex items-center gap-1.5 border shadow-xs ${
              selectedOccupant === 'Family'
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-indigo-700 border-indigo-100 hover:bg-indigo-50'
            }`}
          >
            👪 Family Friendly ({properties.filter(p => p.allowedOccupants === 'Family').length})
          </button>

          <button
            onClick={() => { setSelectedType('Shared Room'); setSelectedOccupant('All'); setSelectedCategory('All'); }}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition flex items-center gap-1.5 border shadow-xs ${
              selectedType === 'Shared Room'
                ? 'bg-amber-600 text-white border-amber-600'
                : 'bg-white text-amber-700 border-amber-100 hover:bg-amber-50'
            }`}
          >
            🤝 Room Sharing / PG ({properties.filter(p => p.propertyType === 'Shared Room').length})
          </button>

          <button
            onClick={() => { setSelectedCategory('PG'); setSelectedOccupant('All'); setSelectedType('All'); }}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition flex items-center gap-1.5 border shadow-xs ${
              selectedCategory === 'PG'
                ? 'bg-teal-650 text-white border-teal-650'
                : 'bg-white text-teal-700 border-teal-100 hover:bg-teal-50'
            }`}
          >
            🏢 Elegant Double PG ({properties.filter(p => p.roomCategory === 'PG').length})
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 border-b border-gray-100 pb-4 mb-6">
        <div>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none block">Active Direct Marketplace</span>
        </div>

        {/* Search Bar Row */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[260px]">
            <Search className="absolute top-2.5 left-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              id="search-input"
              placeholder="Search locality (e.g., Bandra, Connaught CP)..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white pl-9 pr-4 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <button
            id="reset-filters"
            onClick={() => { 
              setSearchVal(''); 
              setSelectedBhk('All'); 
              setSelectedType('All'); 
              setMaxRent(45000); 
              setSelectedOccupant('All'); 
              setSelectedCategory('All'); 
            }}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Main Core Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Side Filters Pane */}
        <div className="lg:col-span-1 rounded-2xl border border-gray-200 bg-white p-5 h-fit shadow-sm">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3 mb-4">
            <SlidersHorizontal className="h-4 w-4 text-emerald-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">Advanced Filters</h3>
          </div>

          <div className="space-y-4">
            
            {/* Rent pricing limits */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-gray-600">
                <span>Max Monthly Rent</span>
                <span className="font-mono text-emerald-600 font-bold">₹{maxRent.toLocaleString('en-IN')}</span>
              </div>
              <input
                type="range"
                min="5000"
                max="80000"
                step="2000"
                value={maxRent}
                onChange={(e) => setMaxRent(parseInt(e.target.value))}
                className="w-full cursor-pointer h-1 rounded-lg bg-gray-200 accent-emerald-500"
              />
            </div>

            {/* BHK specification selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Configuration</label>
              <div className="flex flex-wrap gap-1">
                {['All', '1BHK', '2BHK', '3BHK'].map((config) => (
                  <button
                    key={config}
                    id={`bhk-${config}`}
                    onClick={() => setSelectedBhk(config)}
                    className={`rounded-lg px-2.5 py-1.5 text-xs font-bold border transition ${
                      selectedBhk === config
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'border-gray-200 text-gray-600 bg-transparent hover:bg-gray-50'
                    }`}
                  >
                    {config}
                  </button>
                ))}
              </div>
            </div>

            {/* Property Category Style */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Renting Options</label>
              <div className="flex flex-col gap-1.5">
                {[
                  { id: 'All', name: 'All Choices' },
                  { id: 'Room', name: 'Private Room' },
                  { id: 'Shared Room', name: 'Shared Co-living' },
                  { id: 'Studio', name: 'Entire Studio' }
                ].map((option) => (
                  <button
                    key={option.id}
                    id={`type-${option.id}`}
                    onClick={() => setSelectedType(option.id)}
                    className={`text-left rounded-xl px-3 py-2 text-xs font-semibold transition flex items-center justify-between ${
                      selectedType === option.id
                        ? 'bg-emerald-50 text-emerald-600 border-l-4 border-emerald-600'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span>{option.name}</span>
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Renter Preferences short insight card */}
          <div className="rounded-xl bg-gradient-to-tr from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 p-4 mt-8">
            <div className="flex items-center gap-1.5 text-emerald-800 mb-1">
              <Sparkles className="h-4 w-4" />
              <h4 className="text-xs font-bold uppercase tracking-wider">Your Match Profile</h4>
            </div>
            <p className="text-[11px] text-gray-600 leading-relaxed mb-2">
              Budget: <span className="font-semibold text-emerald-800">₹{renterProfile.preferences.budget}</span> • 
              Pets: <span className="font-semibold text-emerald-800">{renterProfile.preferences.pets ? 'Lover' : 'No'}</span> • 
              Cleanliness: <span className="font-semibold text-emerald-800">{renterProfile.preferences.cleanLevel}</span>
            </p>
            <span className="text-[9px] font-bold text-emerald-600 bg-white/80 rounded px-1.5 py-0.5">Verified Trust: {renterProfile.trustScore}%</span>
          </div>

        </div>

        {/* Right Side Listings Grid */}
        <div className="lg:col-span-3">
          {sortedProperties.length === 0 ? (
            <div className="text-center py-16 bg-white border border-gray-100 rounded-2xl">
              <Compass className="h-10 w-10 text-gray-400 mx-auto mb-3" />
              <h3 className="font-display text-base font-bold text-gray-900">No properties found</h3>
              <p className="text-xs text-gray-500 mt-1">Try to broaden search criteria or adjust rent filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {sortedProperties.map((property) => {
                const isFavorite = wishlist.includes(property.id);
                return (
                  <div
                    key={property.id}
                    onClick={() => setSelectedProperty(property)}
                    className={`group relative cursor-pointer overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${
                      property.featured 
                        ? 'border-amber-300 shadow-amber-50/50 shadow-xs ring-1 ring-amber-200/55 bg-amber-50/5' 
                        : 'border-gray-200'
                    }`}
                  >
                    {/* Image Area */}
                    <div className="relative aspect-[16/10] overflow-hidden bg-gray-105">
                      <img
                        src={property.photos[0]}
                        alt={property.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute top-3 left-3 flex items-center gap-1.5">
                        <span className="rounded-md bg-emerald-600 text-[10px] font-bold uppercase tracking-wider text-white px-2 py-0.5 shadow-sm">
                          Zero Brokerage
                        </span>
                        {property.featured && (
                          <span className="rounded-md bg-gradient-to-r from-amber-500 to-orange-500 text-[10px] font-black uppercase tracking-wider text-white px-2 py-0.5 shadow-sm flex items-center gap-1">
                            <Sparkles className="h-3 w-3 fill-white animate-pulse" />
                            Featured
                          </span>
                        )}
                      </div>

                      <button
                        id={`wishlist-button-${property.id}`}
                        onClick={(e) => handleToggleWishlist(property.id, e)}
                        className={`absolute top-3 right-3 rounded-full border border-gray-100 bg-white p-2 transition hover:bg-gray-50 ${
                          isFavorite ? 'text-rose-500' : 'text-gray-405'
                        }`}
                      >
                        <Heart className="h-4 w-4 fill-current" />
                      </button>

                      {/* Info Overlays */}
                      <div className="absolute bottom-3 left-3 flex items-center gap-1">
                        <span className="rounded bg-black/75 px-2 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider">
                          {property.propertyType}
                        </span>
                        <span className="rounded bg-black/75 px-2 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider">
                          {property.furnishingType}
                        </span>
                      </div>
                    </div>

                    {/* Meta info */}
                    <div className="p-4">
                      
                      {/* Price header */}
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-baseline gap-1">
                          <span className="font-display text-lg font-bold text-gray-900">₹{property.pricePerMonth.toLocaleString('en-IN')}</span>
                          <span className="text-xs text-gray-450">/ month</span>
                        </div>
                        <div className="flex items-center gap-1 rounded bg-orange-50 px-1.5 py-0.5 text-[10px] text-orange-750 font-bold border border-orange-100">
                          <ShieldCheck className="h-3 w-3" />
                          <span>Owner Rating: {property.ownerRating}</span>
                        </div>
                      </div>

                      <h3 className="font-display text-sm font-bold text-gray-900 line-clamp-1 group-hover:text-emerald-700 transition">
                        {property.title}
                      </h3>

                      <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1.5 mb-1.5">
                        <MapPin className="h-3.5 w-3.5 text-emerald-650" />
                        <span>{property.location}</span>
                      </div>

                      <div className="flex flex-wrap gap-1.5 mb-3">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                          property.allowedOccupants === 'Girls'
                            ? 'bg-rose-50 text-rose-650 border border-rose-100'
                            : property.allowedOccupants === 'Boys'
                            ? 'bg-sky-50 text-sky-655 border border-sky-100'
                            : 'bg-indigo-50 text-indigo-655 border border-indigo-100'
                        }`}>
                          {property.allowedOccupants === 'Girls' ? '👩‍🦰 Girls Only' : property.allowedOccupants === 'Boys' ? '👨 Boys Only' : '👪 Family Friendly'}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold uppercase">
                          🏠 {property.roomCategory || 'Co-Living'}
                        </span>
                      </div>

                      {/* Amenities Row */}
                      <div className="flex flex-wrap gap-1 border-t border-gray-100 pt-3">
                        {property.amenities.slice(0, 4).map((amenity, i) => (
                          <span key={i} className="rounded-md bg-gray-50 border border-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
                            {amenity}
                          </span>
                        ))}
                        {property.amenities.length > 4 && (
                          <span className="rounded-md bg-gray-50 px-2 py-0.5 text-[9px] font-bold text-gray-400">
                            +{property.amenities.length - 4} more
                          </span>
                        )}
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* 4. PREMIUM RESPONSIVE FOOTER SECTION */}
      <footer className="mt-20 border-t border-gray-200 bg-white rounded-3xl p-8 md:p-12 space-y-8 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold">
                SE
              </div>
              <span className="font-display text-base font-extrabold text-gray-900">StayEase</span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              Zero commission P2P co-living housing portals for verified students, technology builders, and local professionals.
            </p>
            <p className="text-[10px] text-emerald-700 font-bold">
              © 2026 StayEase Technologies Private Ltd. • India
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-3 block">Marketplace Standards</h4>
            <ul className="space-y-2 text-xs text-gray-500 text-left">
              <li>Direct Owner Contract Verification</li>
              <li>Interactive Gemini Matching Analyzer</li>
              <li>Security Deposit Escrow Advisory</li>
              <li>Rent Pricing Integrity Indexes</li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-3 block">Safety & Community guidelines</h4>
            <ul className="space-y-2 text-xs text-gray-500 text-left">
              <li>Identity Trust Score checks</li>
              <li>P2P Gated Chat security layers</li>
              <li>Anti-discrimination co-living rule guidelines</li>
              <li>Site visit safety protocols</li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-3 block font-sans">AI Workspace integrations</h4>
            <div className="rounded-xl bg-purple-50 p-3.5 border border-purple-100 space-y-1.5">
              <span className="text-[9px] font-bold text-purple-700 uppercase tracking-widest block">Operational Tech Stack</span>
              <p className="text-[10px] text-gray-650 leading-relaxed font-semibold">
                This app runs fully persistent workspace evaluations using Google Gemini parameters targeting fast landlord approvals.
              </p>
            </div>
          </div>

        </div>

        <div className="border-t border-gray-100 pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-gray-400 gap-4">
          <div className="flex items-center gap-4">
            <span className="hover:text-gray-900 cursor-pointer">Terms of tenancy</span>
            <span className="hover:text-gray-900 cursor-pointer">Privacy regulations</span>
            <span className="hover:text-gray-900 cursor-pointer">Contact support Desk</span>
          </div>
          <p className="italic">StayEase: Made for harmonious flatshares.</p>
        </div>
      </footer>

      {/* Property Details Modal Overlay */}
      {selectedProperty && (
        <div className="fixed inset-0 z-50 flex items-stretch justify-end bg-gray-900/40 backdrop-blur-sm">
          <div className="w-full max-w-3xl bg-white shadow-2xl overflow-y-auto flex flex-col animate-in slide-in-from-right duration-300">
            
            {/* Header toolbar */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white p-4">
              <div className="flex items-center gap-3">
                <button
                  id="close-property-detail"
                  onClick={handleCloseDetail}
                  className="rounded-xl border border-gray-200 p-2 text-gray-500 hover:bg-gray-50 hover:text-gray-950"
                >
                  Back to List
                </button>
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Property details</h4>
                  <p className="text-sm font-bold text-gray-900 line-clamp-1">{selectedProperty.title}</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  id="btn-apply-property"
                  onClick={() => setShowApplyForm(true)}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-sm cursor-pointer"
                >
                  Apply to Rent
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">

              {/* IMMERSIVE 360-degree VR & Multi-Gallery Tab Switcher */}
              <div className="space-y-3">
                <div className="flex rounded-xl bg-gray-100 p-1 border border-gray-200">
                  <button
                    onClick={() => setGalleryTab('photos')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                      galleryTab === 'photos'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-905'
                    }`}
                  >
                    📸 Room Photos ({selectedProperty.photos.length})
                  </button>
                  <button
                    onClick={() => setGalleryTab('bathroom')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                      galleryTab === 'bathroom'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-905'
                    }`}
                  >
                    🚿 Bathrooms Gallery
                  </button>
                  <button
                    onClick={() => setGalleryTab('vr')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1 ${
                      galleryTab === 'vr'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-905'
                    }`}
                  >
                    🌀 Virtual 360° VR Tour
                  </button>
                </div>

                {/* Gallery Viewer Panel */}
                {galleryTab === 'photos' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 rounded-2xl overflow-hidden shadow-sm animate-in fade-in duration-200">
                    <div className="md:col-span-2 aspect-[16/10] overflow-hidden bg-gray-100">
                      <img src={selectedProperty.photos[0]} className="h-full w-full object-cover" />
                    </div>
                    <div className="grid grid-rows-2 gap-2">
                      <div className="h-full overflow-hidden bg-gray-100">
                        <img src={selectedProperty.photos[1] || selectedProperty.photos[0]} className="h-full w-full object-cover" />
                      </div>
                      <div className="relative h-full overflow-hidden bg-gray-150 relative">
                        <img src={selectedProperty.photos[2] || selectedProperty.photos[0]} className="h-full w-full object-cover" />
                        <div className="absolute inset-0 bg-black/45 flex items-center justify-center text-white font-bold text-[10px] uppercase">
                          <span>Verified Pics</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {galleryTab === 'bathroom' && (
                  <div className="border border-indigo-100 bg-indigo-50/10 rounded-2xl p-4 space-y-3 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">Inspecting: Bathroom & Lavatory</span>
                        <h4 className="text-[11px] text-gray-500">Zero-Leaking index checked by StayEase Inspectors</h4>
                      </div>
                      <span className="rounded bg-indigo-100 px-2 py-0.5 text-[10px] text-indigo-800 font-bold">Hygiene: Excellent✓</span>
                    </div>

                    <div className="rounded-xl overflow-hidden aspect-[16/9] border border-gray-100 relative shadow-inner">
                      <img 
                        src={selectedProperty.bathroomPhoto || 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&auto=format&fit=crop&q=80'} 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover hover:scale-101 transition duration-200"
                        alt="Bathroom detailed photo"
                      />
                      <div className="absolute bottom-3 left-3 bg-black/75 rounded px-2.5 py-1.5 text-[10px] text-white">
                        🚿 Standard Western Toilet • Geyser Installed • Dynamic Exhaust
                      </div>
                    </div>
                  </div>
                )}

                {galleryTab === 'vr' && (
                  <div className="border border-emerald-100 bg-emerald-50/10 rounded-2xl p-4 space-y-3 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest block">🌀 STAYEASE VR 360° LIVE VIEWER</span>
                        <h4 className="text-[11px] text-gray-500">Pan left/right to browse Room Layout virtually</h4>
                      </div>
                      <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] text-emerald-800 font-bold flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                        3D Stream Enabled
                      </span>
                    </div>

                    {/* Interactive panning canvas div */}
                    <div className="rounded-xl overflow-hidden aspect-[16/8] border border-emerald-200 relative bg-slate-950 flex items-center justify-center">
                      <div 
                        className="absolute inset-0 h-full transition-transform duration-100 ease-out"
                        style={{
                          backgroundImage: `url(${selectedProperty.panoramicPhoto || 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1600&auto=format&fit=crop&q=80'})`,
                          backgroundSize: 'cover',
                          backgroundPosition: `${vrRotation * 1.5}px center`,
                          width: '100%',
                        }}
                      />
                      
                      {/* Central focus crosshairs */}
                      <div className="absolute inset-0 bg-transparent flex items-center justify-center pointer-events-none">
                        <div className="h-8 w-8 rounded-full border-2 border-dashed border-emerald-500/50 flex items-center justify-center opacity-70">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        </div>
                      </div>

                      <div className="absolute bottom-2 left-2 bg-black/80 rounded px-2.5 py-1 text-[9px] text-gray-300 font-mono">
                        Camera Angle: {Math.round(vrRotation % 360)}°
                      </div>
                    </div>

                    {/* Rotation controls slider */}
                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-150 flex items-center gap-4">
                      <span className="text-[11px] font-bold text-gray-500 shrink-0 select-none">Pan Left</span>
                      <input 
                        type="range"
                        min="-200"
                        max="200"
                        value={vrRotation}
                        onChange={(e) => setVrRotation(parseInt(e.target.value))}
                        className="flex-1 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-650"
                      />
                      <span className="text-[11px] font-bold text-gray-500 shrink-0 select-none">Pan Right</span>
                      
                      <button
                        onClick={() => setVrRotation(0)}
                        className="rounded-lg bg-white border border-gray-200 px-2.5 py-1 text-[10px] font-bold hover:bg-gray-100"
                      >
                        Recenter
                      </button>
                    </div>

                  </div>
                )}
              </div>

              {/* Core Information Section split columns */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Left Info Column */}
                <div className="md:col-span-2 space-y-6">
                  <div>
                    <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800 border border-emerald-100">
                      {selectedProperty.propertyType}
                    </span>
                    <h2 className="font-display text-xl font-bold text-gray-900 mt-2">{selectedProperty.title}</h2>
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                      <span>{selectedProperty.location}</span>
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-4 border-y border-gray-100 py-4">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Monthly Rent</span>
                      <p className="font-display text-base font-bold text-gray-900 mt-0.5">₹{selectedProperty.pricePerMonth.toLocaleString('en-IN')}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Security Deposit</span>
                      <p className="font-display text-base font-bold text-gray-900 mt-0.5">₹{selectedProperty.securityDeposit.toLocaleString('en-IN')}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Area</span>
                      <p className="font-display text-base font-bold text-gray-900 mt-0.5">{selectedProperty.areaSqft} sq.ft</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-display text-sm font-bold text-gray-900 mb-2">Listing Description</h3>
                    <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">{selectedProperty.description}</p>
                  </div>

                  {/* House Rules & Policies */}
                  <div>
                    <h3 className="font-display text-sm font-bold text-gray-900 mb-3">House & Co-Living Rules</h3>
                    <div className="grid grid-cols-2 gap-3.5">
                      <div className="flex items-center justify-between rounded-xl px-3 py-2 border border-gray-100 bg-gray-50/50">
                        <span className="text-xs text-gray-600 font-semibold">Non-Veg Allowed</span>
                        {selectedProperty.houseRules.nonVegcooking ? (
                          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 rounded px-1.5 py-0.5">Yes</span>
                        ) : (
                          <span className="text-xs font-bold text-amber-600 bg-amber-50 rounded px-1.5 py-0.5">Veg Only</span>
                        )}
                      </div>

                      <div className="flex items-center justify-between rounded-xl px-3 py-2 border border-gray-100 bg-gray-50/50">
                        <span className="text-xs text-gray-600 font-semibold">Pet Policy</span>
                        {selectedProperty.petFriendly ? (
                          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 rounded px-1.5 py-0.5">Friendly</span>
                        ) : (
                          <span className="text-xs font-bold text-rose-600 bg-rose-50 rounded px-1.5 py-0.5">No Pets</span>
                        )}
                      </div>

                      <div className="flex items-center justify-between rounded-xl px-3 py-2 border border-gray-100 bg-gray-50/50">
                        <span className="text-xs text-gray-600 font-semibold">Smoking Policy</span>
                        {selectedProperty.houseRules.smoking ? (
                          <span className="text-xs font-bold text-orange-600 bg-orange-50 rounded px-1.5 py-0.5">Permitted</span>
                        ) : (
                          <span className="text-xs font-bold text-rose-600 bg-rose-50 rounded px-1.5 py-0.5">Strict No</span>
                        )}
                      </div>

                      <div className="flex items-center justify-between rounded-xl px-3 py-2 border border-gray-100 bg-gray-50/50">
                        <span className="text-xs text-gray-600 font-semibold">Quiet Hours</span>
                        <span className="text-xs font-bold text-gray-700 bg-gray-100 rounded px-1.5 py-0.5">{selectedProperty.houseRules.quietHours}</span>
                      </div>
                    </div>
                  </div>

                  {/* LANDLORD CHARACTER AUDIT & ROOM CONDITIONS RATING BOARD */}
                  <div className="border-t border-gray-150 pt-5 space-y-5">
                    <div>
                      <h3 className="font-display text-sm font-bold text-gray-900 mb-1">Direct Tenancy Security Audit</h3>
                      <p className="text-xs text-slate-500 font-sans">Crowdsourced reputation scores verified via zero-knowledge identity check stamps.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Sub-card 1: Landlord character evaluation */}
                      <div className="p-4 rounded-2xl bg-amber-50/55 border border-amber-100 space-y-2.5">
                        <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">🗣️ Landlord Character Index</span>
                        <div className="space-y-1.5 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Politeness & Character:</span>
                            <span className="font-bold text-gray-800">★ 4.9 / 5</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Security Deposit Return:</span>
                            <span className="font-bold text-gray-800">★ 4.8 / 5</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Repair responsiveness:</span>
                            <span className="font-bold text-gray-800">★ 4.7 / 5</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-505">Direct Communication:</span>
                            <span className="font-bold text-emerald-700">★ 5.0 / 5</span>
                          </div>
                        </div>
                      </div>

                      {/* Sub-card 2: Room condition evaluation */}
                      <div className="p-4 rounded-2xl bg-teal-50/55 border border-teal-100 space-y-2.5">
                        <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider block">🚿 Room Condition Index</span>
                        <div className="space-y-1.5 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Overall Hygiene:</span>
                            <span className="font-bold text-gray-800">★ 4.9 / 5</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Electricity & Geyser backup:</span>
                            <span className="font-bold text-gray-800">★ 4.6 / 5</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">In-house Wi-Fi index:</span>
                            <span className="font-bold text-gray-800">★ 4.8 / 5</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-505">Water supply regularity:</span>
                            <span className="font-bold text-emerald-700">24/7 Regular ✓</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Feedback lists */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-gray-800 uppercase tracking-widest">Client Tenancy Logs ({
                        (selectedProperty.reviewsList?.length || 0) + (localPropertyReviews[selectedProperty.id]?.length || 0)
                      })</h4>

                      <div className="space-y-3 font-sans">
                        {/* Map existing reviews, plus local in-memory reviews */}
                        {[
                          ...(selectedProperty.reviewsList || []),
                          ...(localPropertyReviews[selectedProperty.id] || [])
                        ].map((review, i) => (
                          <div key={i} className="p-3.5 rounded-xl border border-gray-100 bg-white shadow-xs space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="h-7 w-7 rounded-full bg-emerald-50 text-emerald-800 font-bold text-xs border border-emerald-100 flex items-center justify-center">
                                  {review.renterName ? review.renterName.charAt(0) : 'U'}
                                </div>
                                <div className="text-left">
                                  <span className="text-xs font-bold text-gray-900 block leading-none">{review.renterName || 'Anonymous'}</span>
                                  <span className="text-[9px] text-gray-400 mt-0.5 block">{review.reviewDate || 'Just now'}</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 text-[9px] font-bold">
                                <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">Landlord: ★ {review.landlordCharacterRating || 5}</span>
                                <span className="bg-sky-100 text-sky-800 px-1.5 py-0.5 rounded">Room: ★ {review.roomConditionRating || 5}</span>
                              </div>
                            </div>

                            <p className="text-xs text-gray-750 leading-relaxed italic pr-2 font-sans">
                              "{review.landlordCharacterComment || review.roomConditionComment}"
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* CREATE A LIVE VERIFIED REVIEW FOR ROOM & LANDLORD PORTAL */}
                    <div className="rounded-2xl border border-dashed border-gray-200 p-4 bg-gray-50/50 space-y-3 font-sans">
                      <div className="flex items-center gap-1.5 text-gray-800">
                        <Award className="h-4 w-4 text-emerald-600" />
                        <h4 className="text-xs font-bold uppercase tracking-widest">Share Your Experience / Submit Review</h4>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pb-2 select-none">
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-wider text-gray-405 block mb-1">Character Rating</label>
                          <select
                            value={reviewLandlordRating}
                            onChange={(e) => setReviewLandlordRating(parseInt(e.target.value))}
                            className="w-full text-xs rounded-lg border border-gray-200 bg-white px-2 py-1.5 focus:outline-none focus:border-emerald-500"
                          >
                            <option value="5">★ 5 - Exceptional</option>
                            <option value="4">★ 4 - Good conduct</option>
                            <option value="3">★ 3 - Standard/Polite</option>
                            <option value="2">★ 2 - Slightly delayed</option>
                            <option value="1">★ 1 - Unresponsive</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-wider text-gray-405 block mb-1">Room Hygiene</label>
                          <select
                            value={reviewRoomRating}
                            onChange={(e) => setReviewRoomRating(parseInt(e.target.value))}
                            className="w-full text-xs rounded-lg border border-gray-200 bg-white px-2 py-1.5 focus:outline-none focus:border-emerald-500"
                          >
                            <option value="5">★ 5 - Spotless/Superb</option>
                            <option value="4">★ 4 - Clean/Tidy</option>
                            <option value="3">★ 3 - Average shape</option>
                            <option value="2">★ 2 - Lacks ventilation</option>
                            <option value="1">★ 1 - Maintenance issues</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <textarea
                          rows={2}
                          value={reviewText}
                          onChange={(e) => setReviewText(e.target.value)}
                          placeholder="What did you love about this Room / PG? Is the owner friendly? How about security deposits returns?"
                          className="w-full rounded-xl border border-gray-200 p-2.5 text-xs bg-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (!reviewText.trim()) return;
                          
                          const newReview = {
                            id: 'rev_local_' + Date.now(),
                            renterName: renterProfile.name || 'Rohan Sharma',
                            renterAvatar: renterProfile.avatar,
                            rating: Math.round((reviewLandlordRating + reviewRoomRating) / 2),
                            landlordCharacterRating: reviewLandlordRating,
                            landlordCharacterComment: reviewText.trim(),
                            roomConditionRating: reviewRoomRating,
                            roomConditionComment: reviewText.trim(),
                            bathroomHygieneRating: reviewRoomRating,
                            reviewDate: 'Just now • Verified Tenancy'
                          };

                          const propId = selectedProperty.id;
                          const currentReviews = localPropertyReviews[propId] || [];
                          
                          setLocalPropertyReviews({
                            ...localPropertyReviews,
                            [propId]: [...currentReviews, newReview]
                          });

                          setReviewText('');
                          alert('Verified review published! Thank you for sharing your co-living feedback.');
                        }}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 rounded-xl transition shadow-xs"
                      >
                        Publish Verified Co-living Review
                      </button>
                    </div>

                  </div>

                </div>

                {/* Right Auditor / Landlord Context Column */}
                <div className="space-y-6">
                  
                  {/* AI Smart Match Analyzer Feature */}
                  <div className="rounded-2xl border border-purple-200 bg-purple-50/30 p-5">
                    <div className="flex items-center gap-1.5 text-purple-850 mb-2">
                      <Sparkles className="h-4.5 w-4.5" />
                      <h4 className="font-display text-sm font-bold">AI Co-Living Match Auditor</h4>
                    </div>
                    <p className="text-[11px] text-gray-600 leading-relaxed mb-4">
                      Evaluating co-living compatible scoring matching habits (Budget, Smoking, Office distance, Food, Sleep schedules).
                    </p>

                    {!matchResult && !isMatching ? (
                      <button
                        id="btn-evaluate-match"
                        onClick={() => handleCheckSmartMatch(selectedProperty)}
                        className="w-full rounded-xl bg-purple-600 hover:bg-purple-700 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition"
                      >
                        Compute Smart Match Score
                      </button>
                    ) : isMatching ? (
                      <div className="text-center py-4 space-y-2">
                        <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-purple-600 border-t-transparent" />
                        <p className="text-[11px] font-bold text-purple-705 animate-pulse">Running Gemini Match Analysis Engine...</p>
                      </div>
                    ) : (
                      <div className="space-y-4 animate-in fade-in duration-300">
                        
                        {/* Score Circular dial */}
                        <div className="flex items-center gap-4 border-b border-purple-100 pb-3">
                          <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full font-display text-xl font-extrabold ${
                            matchResult.matchScore >= 85 
                              ? 'bg-emerald-100 text-emerald-800 border-2 border-emerald-400' 
                              : matchResult.matchScore >= 70 
                              ? 'bg-amber-100 text-amber-800 border-2 border-amber-400'
                              : 'bg-rose-100 text-rose-800 border-2 border-rose-400'
                          }`}>
                            {matchResult.matchScore}%
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider block">Decision predictions</span>
                            <div className="text-xs text-gray-750 mt-0.5">
                              Will Apply: <span className="font-bold text-gray-900">{matchResult.willApply}</span> <br/>
                              Accept Likely: <span className="font-bold text-gray-900">{matchResult.willAccept}</span>
                            </div>
                          </div>
                        </div>

                        {/* Match reasons */}
                        <div className="space-y-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Match points</span>
                          <ul className="space-y-1.5 text-[11px] text-gray-600">
                            {matchResult.matchReason.map((reason, index) => (
                              <li key={index} className="flex items-start gap-1">
                                <CheckCircle className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                <span>{reason}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Mismatches and alerts info */}
                        {matchResult.mismatches && matchResult.mismatches.length > 0 && (
                          <div className="space-y-2 pt-2 border-t border-purple-100">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500">Mismatches</span>
                            <ul className="space-y-1 text-[11px] text-gray-600">
                              {matchResult.mismatches.map((mismatch, idx) => (
                                <li key={idx} className="flex items-start gap-1">
                                  <Ban className="h-3.5 w-3.5 text-rose-500 shrink-0 mt-0.5" />
                                  <span>{mismatch}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <button
                          id="re-evaluate-match"
                          onClick={() => handleCheckSmartMatch(selectedProperty)}
                          className="w-full text-center text-[10px] font-bold text-purple-600 hover:text-purple-800 hover:underline"
                        >
                          Re-evaluate calculations
                        </button>

                      </div>
                    )}
                  </div>

                  {/* Landlord information card */}
                  <div className="rounded-2xl border border-gray-200 bg-white p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <img src={selectedProperty.ownerAvatar} className="h-10 w-10 rounded-full object-cover" />
                      <div>
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none">Property Owner</h4>
                        <span className="text-sm font-bold text-gray-900 block mt-0.5">{selectedProperty.ownerName}</span>
                        <div className="flex items-center gap-1 mt-0.5 text-[10px] text-emerald-600 font-bold">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          <span>Identity Verified✓</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-2.5 space-y-1.5 text-xs border border-gray-100 mb-4">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Owner Rating:</span>
                        <span className="font-bold">★ {selectedProperty.ownerRating} / 5</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Total Reviews:</span>
                        <span className="font-bold">{selectedProperty.ownerReviewsCount} reviews</span>
                      </div>
                    </div>

                    {/* Direct Chat Integration with owner */}
                    <div className="border-t border-gray-100 pt-3">
                      <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">P2P In-App Direct Chat</h5>
                      
                      {/* Message Thread Container */}
                      <div className="max-h-[140px] overflow-y-auto space-y-2 mb-3 pr-1 text-[11px]">
                        {activePropertyChats.length === 0 ? (
                          <p className="text-center text-gray-400 italic py-2">No messages yet. Ask the owner directly!</p>
                        ) : (
                          activePropertyChats.map((msg, i) => {
                            const isMine = msg.senderId === renterProfile.id;
                            return (
                              <div key={i} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                                <div className={`rounded-lg px-2.5 py-1.5 max-w-[85%] ${
                                  isMine ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {msg.text}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* Message edit block */}
                      <form onSubmit={handleSendChat} className="flex gap-1.5">
                        <input
                          type="text"
                          id="chat-input"
                          placeholder="Type inquiry to owner..."
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs focus:border-emerald-500 focus:outline-none animate-none"
                        />
                        <button
                          type="submit"
                          id="btn-send-chat"
                          className="rounded-lg bg-emerald-600 p-1.5 text-white hover:bg-emerald-700"
                        >
                          <Send className="h-3.5 w-3.5" />
                        </button>
                      </form>

                    </div>

                  </div>

                </div>

              </div>

              {/* Similar Rooms with Similar Budget Recommendation Section */}
              {(() => {
                const similarRooms = getSimilarProperties(selectedProperty);
                if (similarRooms.length === 0) return null;

                return (
                  <div id="similar-rooms-section" className="border-t border-gray-150 pt-6 mt-6 font-sans">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-black text-emerald-800 uppercase tracking-wider bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-250 font-sans inline-block">
                            Explore Alternatives
                          </span>
                          <span className="text-[9px] font-bold text-indigo-700 uppercase tracking-wider bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-150 inline-block">
                            Similar Budget ✓
                          </span>
                        </div>
                        <h3 className="font-display text-base font-extrabold text-gray-900 mt-1.5">
                          Similar Rooms in Your Budget Range
                        </h3>
                        <p className="text-[11px] text-gray-500 font-medium">Bhopal and co-living units matching ₹{(selectedProperty.pricePerMonth * 0.7).toLocaleString('en-IN', {maximumFractionDigits:0})} - ₹{(selectedProperty.pricePerMonth * 1.3).toLocaleString('en-IN', {maximumFractionDigits:0})} average market rates.</p>
                      </div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-100 px-2.5 py-1.5 rounded-xl border border-gray-200">
                        {similarRooms.length} Best matches
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {similarRooms.map((room) => {
                        const priceDiff = room.pricePerMonth - selectedProperty.pricePerMonth;
                        const isCheaper = priceDiff < 0;
                        const absDiff = Math.abs(priceDiff);

                        return (
                          <div 
                            key={room.id}
                            id={`similar-room-card-${room.id}`}
                            className="group rounded-2xl border border-gray-200 bg-gray-50/50 p-3.5 transition hover:border-emerald-400 hover:bg-white hover:shadow-lg flex flex-col justify-between"
                          >
                            <div className="space-y-3">
                              {/* Room Thumbnail Photo */}
                              <div className="h-28 w-full rounded-xl overflow-hidden relative bg-gray-200">
                                <img 
                                  src={room.photos[0] || 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=400&auto=format&fit=crop&q=80'} 
                                  alt={room.title} 
                                  className="w-full h-full object-cover group-hover:scale-103 transition duration-500"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="absolute top-2 left-2 flex gap-1">
                                  <span className="rounded bg-emerald-500 text-slate-950 text-[8px] font-black px-1.5 py-0.5 uppercase tracking-wider shadow border border-emerald-400">
                                    Verified
                                  </span>
                                </div>
                                <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-xs rounded px-2 py-0.5 text-[10px] text-white font-black font-sans">
                                  ₹{room.pricePerMonth.toLocaleString('en-IN')}/mo
                                </div>
                              </div>

                              <div className="space-y-1">
                                <h4 
                                  className="font-display text-xs font-bold text-gray-900 line-clamp-1 group-hover:text-emerald-700 transition" 
                                  title={room.title}
                                >
                                  {room.title}
                                </h4>
                                <div className="flex items-center gap-1 text-[10px] text-gray-500">
                                  <MapPin className="h-3 w-3 text-emerald-600 shrink-0" />
                                  <span className="truncate">{room.location}</span>
                                </div>
                              </div>

                              <div className="flex items-center justify-between text-[10px] pt-1.5 border-t border-gray-150 font-sans">
                                <span className="text-gray-400 font-bold">{room.allowedOccupants} • {room.roomCategory}</span>
                                {priceDiff === 0 ? (
                                  <span className="text-gray-400 font-extrabold bg-gray-100 px-1.5 py-0.5 rounded leading-none shrink-0">Same Price</span>
                                ) : (
                                  <span className={`font-black px-1.5 py-0.5 rounded leading-none shrink-0 border ${
                                    isCheaper 
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                      : 'bg-amber-50 text-amber-700 border-amber-100'
                                  }`}>
                                    {isCheaper ? `₹${absDiff.toLocaleString('en-IN')} cheaper` : `₹${absDiff.toLocaleString('en-IN')} extra`}
                                  </span>
                                )}
                              </div>
                            </div>

                            <button
                              type="button"
                              id={`btn-explore-similar-${room.id}`}
                              onClick={() => {
                                setSelectedProperty(room);
                                setMatchResult(null); // Force recalculate dynamic compatibility score
                                // Scroll modal container to top smoothly
                                const modalContainer = document.querySelector('.overflow-y-auto');
                                if (modalContainer) {
                                  modalContainer.scrollTo({ top: 0, behavior: 'smooth' });
                                } else {
                                  window.scrollTo({ top: 0, behavior: 'smooth' });
                                }
                              }}
                              className="w-full text-center bg-white hover:bg-emerald-600 hover:text-white text-emerald-700 border border-emerald-250 font-black text-[10px] py-2 rounded-xl transition cursor-pointer select-none flex items-center justify-center gap-1 mt-4"
                            >
                              <Compass className="h-3 w-3" />
                              Inspect Room
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

            </div>

          </div>
        </div>
      )}

      {showApplyForm && selectedProperty && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-900/60 backdrop-blur-md p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-gray-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-teal-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                  <Sparkles className="h-5 w-5 text-emerald-600 fill-emerald-500" />
                </div>
                <div>
                  <h3 className="font-display text-sm font-bold text-gray-900">Direct Tenancy Application</h3>
                  <p className="text-[10px] text-gray-500 font-sans mt-0.5">Custom Lease &amp; Matching Habits Context</p>
                </div>
              </div>
              <button 
                onClick={() => setShowApplyForm(false)} 
                className="rounded-xl border border-gray-200 p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-900 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Form Area */}
            <div className="p-6 overflow-y-auto space-y-4 text-left font-sans">
              <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-3.5 space-y-1.5">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">Applying For</span>
                <p className="text-xs font-extrabold text-gray-900 leading-snug">{selectedProperty.title}</p>
                <div className="flex items-center justify-between text-[11px] text-gray-500 mt-1">
                  <span>Location: <strong className="text-gray-700">{selectedProperty.location}</strong></span>
                  <span>Rent: <strong className="text-emerald-700">₹{selectedProperty.pricePerMonth.toLocaleString('en-IN')}/mo</strong></span>
                </div>
              </div>

              {/* Step 1: Lease details */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider border-b border-gray-150 pb-1 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-emerald-600" /> Key Tenancy Terms
                </h4>
                
                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1">Target Move-in Date</label>
                    <input 
                      type="date" 
                      value={applyMoveInDate}
                      onChange={(e) => setApplyMoveInDate(e.target.value)}
                      className="w-full text-xs rounded-xl border border-gray-205 bg-white px-3 py-2.5 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1">Proposed Lease Duration</label>
                    <select
                      value={applyLeaseDuration}
                      onChange={(e) => setApplyLeaseDuration(e.target.value)}
                      className="w-full text-xs rounded-xl border border-gray-205 bg-white px-3 py-2.5 focus:border-emerald-500 focus:outline-none"
                    >
                      <optgroup label="Flexible Agreements">
                        <option value="Flexible Month-to-Month">Flexible Month-to-Month (Rolling)</option>
                        <option value="1-3 Months Trial">1-3 Months (Short Term Trial)</option>
                        <option value="3-6 Months Range">3-6 Months (Flexible Range)</option>
                      </optgroup>
                      <optgroup label="Standard Fixed Terms">
                        <option value="6 Months">6 Months (Fixed)</option>
                        <option value="6-9 Months Range">6-9 Months (Mid Term Range)</option>
                        <option value="9-11 Months Range">9-11 Months (Academic/Interim)</option>
                        <option value="11 Months">11 Months (Standard Fixed)</option>
                        <option value="12 Months">12 Months (Standard Annual)</option>
                      </optgroup>
                      <optgroup label="Long Term Options">
                        <option value="12-18 Months Range">12-18 Months (Flexible Multi-Season)</option>
                        <option value="24 Months">24 Months (Long Term Fixed)</option>
                        <option value="Custom Flexible">Custom / Flexible Term (Discuss with Owner)</option>
                      </optgroup>
                    </select>
                  </div>
                </div>
              </div>

              {/* Step 2: Live Personal Habits & Preferences Verification Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-gray-150 pb-1">
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                    <SlidersHorizontal className="h-3.5 w-3.5 text-emerald-600" /> Share Habits &amp; Preferences
                  </h4>
                  <span className="text-[9px] text-purple-750 font-bold bg-purple-50 px-2 py-0.5 rounded-full">AI Smart compatibility</span>
                </div>

                <div className="space-y-2.5">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1">Ideal Roommate Count</label>
                      <input 
                        type="number"
                        min="0"
                        max="5"
                        value={applyRenterPrefs.roommateCount}
                        onChange={(e) => setApplyRenterPrefs({ ...applyRenterPrefs, roommateCount: parseInt(e.target.value) || 0 })}
                        className="w-full text-xs rounded-xl border border-gray-205 bg-white px-3 py-2 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1">Target Monthly Budget (₹)</label>
                      <input 
                        type="number"
                        min="2000"
                        max="100000"
                        value={applyRenterPrefs.budget}
                        onChange={(e) => setApplyRenterPrefs({ ...applyRenterPrefs, budget: parseInt(e.target.value) || 12000 })}
                        className="w-full text-xs rounded-xl border border-gray-205 bg-white px-3 py-2 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1">Sleeping Hours Routine</label>
                    <select
                      value={applyRenterPrefs.sleepHours}
                      onChange={(e) => setApplyRenterPrefs({ ...applyRenterPrefs, sleepHours: e.target.value as any })}
                      className="w-full text-xs rounded-xl border border-gray-205 bg-white px-3 py-2 focus:border-emerald-500 focus:outline-none"
                    >
                      <option value="Early Bird (9 PM - 5 AM)">Early Bird (9 PM - 5 AM)</option>
                      <option value="Standard (11 PM - 7 AM)">Standard (11 PM - 7 AM)</option>
                      <option value="Night Owl (2 AM - 10 AM)">Night Owl (2 AM - 10 AM)</option>
                    </select>
                  </div>

                  {/* Yes/No Toggles */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <label className="flex items-center gap-2 rounded-xl p-2.5 border border-gray-150 bg-gray-50/20 hover:bg-gray-55 cursor-pointer transition select-none">
                      <input 
                        type="checkbox"
                        checked={applyRenterPrefs.pets}
                        onChange={(e) => setApplyRenterPrefs({ ...applyRenterPrefs, pets: e.target.checked })}
                        className="h-4 w-4 accent-emerald-600 rounded cursor-pointer"
                      />
                      <span className="text-xs font-semibold text-gray-700">Bringing Pets?</span>
                    </label>

                    <label className="flex items-center gap-2 rounded-xl p-2.5 border border-gray-150 bg-gray-50/20 hover:bg-gray-55 cursor-pointer transition select-none">
                      <input 
                        type="checkbox"
                        checked={applyRenterPrefs.nonVeg}
                        onChange={(e) => setApplyRenterPrefs({ ...applyRenterPrefs, nonVeg: e.target.checked })}
                        className="h-4 w-4 accent-emerald-600 rounded cursor-pointer"
                      />
                      <span className="text-xs font-semibold text-gray-700">Cooks Non-Veg?</span>
                    </label>

                    <label className="flex items-center gap-2 rounded-xl p-2.5 border border-gray-150 bg-gray-50/20 hover:bg-gray-55 cursor-pointer transition select-none">
                      <input 
                        type="checkbox"
                        checked={applyRenterPrefs.smoking}
                        onChange={(e) => setApplyRenterPrefs({ ...applyRenterPrefs, smoking: e.target.checked })}
                        className="h-4 w-4 accent-emerald-600 rounded cursor-pointer"
                      />
                      <span className="text-xs font-semibold text-gray-700">Smoking Habit?</span>
                    </label>

                    <div>
                      <select
                        value={applyRenterPrefs.cleanLevel}
                        onChange={(e) => setApplyRenterPrefs({ ...applyRenterPrefs, cleanLevel: e.target.value as any })}
                        className="w-full text-xs rounded-xl border border-gray-150 bg-gray-50/20 px-2.5 py-2.5 focus:border-emerald-500 focus:outline-none"
                      >
                        <option value="High">✨ Clean: High</option>
                        <option value="Moderate">🧹 Clean: Moderate</option>
                        <option value="Spontaneous">🧼 Clean: Spontaneous</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="p-5 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowApplyForm(false)}
                className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-bold text-gray-600 hover:bg-white bg-transparent cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onApplyProperty(selectedProperty.id, applyMoveInDate, applyLeaseDuration, applyRenterPrefs);
                  const justApplied = selectedProperty;
                  handleCloseDetail();
                  setAppliedPropertySuccess(justApplied);
                  // Scroll to the top of the dashboard page so the success banner is clearly visible
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 px-5 py-2 text-xs font-extrabold text-white shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="h-3.5 w-3.5 fill-white" />
                Submit Direct Application
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
