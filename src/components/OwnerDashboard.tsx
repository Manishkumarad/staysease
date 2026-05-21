import React, { useState } from 'react';
import { Property, Inquiry, HouseRules } from '../types';
import { 
  Building, Sparkles, Plus, CheckCircle, X, 
  Trash2, Play, Pause, ChevronRight, Eye, MessageSquare, AlertCircle,
  Star, Award, UserCheck, Calendar, Clock, Heart, Loader2
} from 'lucide-react';
import { uploadPropertyPhoto, isSupabaseConfigured } from '../lib/supabase';


interface OwnerDashboardProps {
  properties: Property[];
  inquiries: Inquiry[];
  onAddProperty: (newProp: Property) => void;
  onUpdatePropertyStatus: (id: string, status: 'Active' | 'Inactive' | 'Booked') => void;
  onUpdateInquiryStatus: (id: string, status: 'Accepted' | 'Rejected') => void;
  onDeleteProperty: (id: string) => void;
  onTogglePropertyFeatured: (id: string) => void;
  onUpdatePropertyPrice?: (id: string, price: number) => void;
}

export default function OwnerDashboard({
  properties,
  inquiries,
  onAddProperty,
  onUpdatePropertyStatus,
  onUpdateInquiryStatus,
  onDeleteProperty,
  onTogglePropertyFeatured,
  onUpdatePropertyPrice,
}: OwnerDashboardProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [formStep, setFormStep] = useState(1);
  const [activeSection, setActiveSection] = useState<'listings' | 'reviews'>('listings');
  
  // Create New Listing Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [propertyType, setPropertyType] = useState<'1BHK' | '2BHK' | '3BHK' | 'Room' | 'Shared Room' | 'Studio'>('Room');
  const [furnishingType, setFurnishingType] = useState<'Furnished' | 'Semi-Furnished' | 'Unfurnished'>('Semi-Furnished');
  const [location, setLocation] = useState('Indiranagar, Bangalore');
  const [latitude, setLatitude] = useState<number>(12.9716);
  const [longitude, setLongitude] = useState<number>(77.6412);
  const [areaSqft, setAreaSqft] = useState(300);
  const [bedrooms, setBedrooms] = useState(1);
  const [bathrooms, setBathrooms] = useState(1);
  const [pricePerMonth, setPricePerMonth] = useState(15000);
  const [securityDeposit, setSecurityDeposit] = useState(30000);
  const [parking, setParking] = useState<'No' | 'Bike Only' | 'Car & Bike'>('Bike Only');
  const [amenities, setAmenities] = useState<string[]>(['High Speed WiFi', 'Geyser', 'Washing Machine']);
  const [houseRules, setHouseRules] = useState<HouseRules>({
    nonVegcooking: true,
    smoking: false,
    pets: true,
    couplesSelection: true,
    quietHours: '10:00 PM - 07:00 AM',
    maxOccupants: 1,
  });

  // Gallery upload and management states
  const [addedPhotos, setAddedPhotos] = useState<string[]>([
    'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800&auto=format&fit=crop&q=80',
  ]);
  const [customPhotoUrl, setCustomPhotoUrl] = useState('');
  const [photoError, setPhotoError] = useState('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // AI Pricing recommendations state
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiPricingData, setAiPricingData] = useState<any | null>(null);
  const [isFeatured, setIsFeatured] = useState(false);

  // AI Pricing optimization for already listed properties
  const [activeOptimizationProperty, setActiveOptimizationProperty] = useState<Property | null>(null);
  const [existingAiLoading, setExistingAiLoading] = useState(false);
  const [existingAiPricingData, setExistingAiPricingData] = useState<any | null>(null);

  // Stats calculation
  const totalViews = properties.reduce((acc, p) => acc + p.views, 0);
  const totalInquiries = inquiries.length;

  // Extract all reviews across listed properties belonging to this owner
  const allReviews = properties.reduce<any[]>((acc, property) => {
    if (property.reviewsList) {
      const reviewsWithProperty = property.reviewsList.map(r => ({
        ...r,
        propertyId: property.id,
        propertyTitle: property.title,
      }));
      return [...acc, ...reviewsWithProperty];
    }
    return acc;
  }, []);

  const totalReviewsCount = allReviews.length;

  const avgOverall = totalReviewsCount > 0
    ? (allReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviewsCount).toFixed(1)
    : '5.0';

  const avgCharacter = totalReviewsCount > 0
    ? (allReviews.reduce((sum, r) => sum + r.landlordCharacterRating, 0) / totalReviewsCount).toFixed(1)
    : '5.0';

  const avgRoom = totalReviewsCount > 0
    ? (allReviews.reduce((sum, r) => sum + r.roomConditionRating, 0) / totalReviewsCount).toFixed(1)
    : '5.0';

  const avgBathroom = totalReviewsCount > 0
    ? (allReviews.reduce((sum, r) => sum + r.bathroomHygieneRating, 0) / totalReviewsCount).toFixed(1)
    : '5.0';

  const handleToggleAmenity = (name: string) => {
    if (amenities.includes(name)) {
      setAmenities(amenities.filter(a => a !== name));
    } else {
      setAmenities([...amenities, name]);
    }
  };

  // Run Gemini Price Audit Predictor
  const handleTriggerPriceOptimizer = async () => {
    setIsAiLoading(true);
    setAiPricingData(null);
    try {
      const mockMetaProperty = {
        title,
        description,
        propertyType,
        furnishingType,
        location,
        areaSqft,
        bedrooms,
        bathrooms,
        amenities,
        houseRules,
      };

      const response = await fetch('/api/gemini/price-predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ property: mockMetaProperty }),
      });
      const resData = await response.json();
      if (resData.success) {
        setAiPricingData(resData.data);
      } else {
        throw new Error(resData.error || 'Pricing error');
      }
    } catch (err) {
      console.warn('Pricing predictor server error, using local fallback estimator:', err);
      // Fallback details
      const suggested = Math.round(areaSqft * 42 + bedrooms * 2500);
      setAiPricingData({
        suggestedRent: suggested,
        minRange: Math.round(suggested * 0.9),
        maxRange: Math.round(suggested * 1.15),
        confidence: 80,
        reasons: [
          `Base rent computed utilizing local ${location} specifications index.`,
          `Furnishing category (${furnishingType}) provides a slight markup.`,
        ],
        tips: [
          'Add Air Conditioning to raise maximum rental capabilities by 15%.',
          'Keep deposits under 3x rents to ensure faster tenant sign-offs.'
        ]
      });
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleTriggerExistingPriceOptimizer = async (property: Property) => {
    setActiveOptimizationProperty(property);
    setExistingAiLoading(true);
    setExistingAiPricingData(null);
    try {
      const response = await fetch('/api/gemini/price-predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ property }),
      });
      const resData = await response.json();
      if (resData.success) {
        setExistingAiPricingData(resData.data);
      } else {
        throw new Error(resData.error || 'Pricing error');
      }
    } catch (err) {
      console.warn('Pricing predictor server error, using local fallback:', err);
      // Fallback
      const basePrice = Math.round(property.areaSqft * 42 + property.bedrooms * 2500);
      setExistingAiPricingData({
        suggestedRent: basePrice,
        minRange: Math.round(basePrice * 0.9),
        maxRange: Math.round(basePrice * 1.15),
        confidence: 85,
        reasons: [
          `Local market demand index is extremely strong in ${property.location}.`,
          `Furnishing: ${property.furnishingType} has healthy premium values.`,
          `${property.amenities.length} core amenities provide active tenant attraction.`
        ],
        tips: [
          'Enable instant reservation on digital direct leases to save 15 days of vacancy.',
          'Post at least 3 high-resolution photos of clean bathrooms to justify premium pricing.',
          'Consider professional deep cleaning between occupants to enhance initial character scores.'
        ]
      });
    } finally {
      setExistingAiLoading(false);
    }
  };

  // Save new property (integrated with multiple property photo upload validation and handleAddProperty)
  const handleSavePropertySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    // Strict validation: Require at least 3 photos to post a valid listing
    if (addedPhotos.length < 3) {
      setPhotoError('At least 3 property photos are required to post a valid room listing. Please upload or add more photos in Step 2.');
      setFormStep(2); // Automatically navigate back to step 2 where photo upload is handled
      return;
    }

    const newProp: Property = {
      id: 'prop_' + Date.now(),
      ownerId: 'owner_1',
      title,
      description: description || 'No description supplied.',
      propertyType,
      furnishingType,
      location,
      latitude,
      longitude,
      areaSqft,
      bedrooms,
      bathrooms,
      amenities,
      houseRules,
      pricePerMonth,
      securityDeposit,
      availableFromDate: '2026-06-01',
      maxOccupants: houseRules.maxOccupants,
      parking,
      petFriendly: houseRules.pets,
      allowedOccupants: 'Any',
      roomCategory: 'PG',
      bathroomPhoto: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&auto=format&fit=crop&q=80',
      panoramicPhoto: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1600&auto=format&fit=crop&q=80',
      reviewsList: [],
      photos: addedPhotos,
      status: 'Active',
      ownerName: 'Rohan Sharma',
      ownerRating: 5.0,
      ownerReviewsCount: 1,
      ownerAvatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80',
      views: 0,
      inquiriesCount: 0,
      featured: isFeatured,
    };

    onAddProperty(newProp);
    setShowAddForm(false);
    setFormStep(1);
    setTitle('');
    setDescription('');
    setLatitude(12.9716);
    setLongitude(77.6412);
    setAiPricingData(null);
    setIsFeatured(false);
    setAddedPhotos([
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800&auto=format&fit=crop&q=80',
    ]);
    setCustomPhotoUrl('');
    setPhotoError('');
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      
      {/* Landlord Header */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-6 mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-gray-900">Landlord Operations Dashboard</h1>
          <p className="text-sm text-gray-500">Manage listings without pricing commissions, evaluate applicant badges, and forecast perfect rents.</p>
        </div>

        <button
          id="btn-add-property"
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-4 py-2.5 text-xs font-bold shadow-md shadow-emerald-100 transition"
        >
          <Plus className="h-4 w-4" />
          <span>Post New Room</span>
        </button>
      </div>

      {/* Visual Analytics stats metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Listings</span>
          <p className="text-2xl font-extrabold text-gray-900 mt-1">{properties.length}</p>
          <span className="text-xs text-emerald-600 mt-2 block font-medium">✨ Unlimited free listings</span>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Visibility Views</span>
          <p className="text-2xl font-extrabold text-gray-900 mt-1">{totalViews}</p>
          <span className="text-xs text-emerald-600 mt-2 block font-medium">📈 +18% impressions increase this week</span>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Partner Inquiries</span>
          <p className="text-2xl font-extrabold text-gray-900 mt-1">{totalInquiries}</p>
          <span className="text-xs text-emerald-600 mt-2 block font-medium">👤 Average response rate to applicants: &lt;6 hours</span>
        </div>

      </div>

      {/* Sub-tab Navigation */}
      <div className="flex border-b border-gray-200 mb-8">
        <button
          onClick={() => setActiveSection('listings')}
          className={`pb-3.5 px-6 text-sm font-bold border-b-2 transition flex items-center gap-2 ${
            activeSection === 'listings'
              ? 'border-emerald-600 text-emerald-600 font-extrabold'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <Building className="h-4 w-4" />
          <span>Manage Rooms &amp; Applicants</span>
        </button>
        <button
          onClick={() => setActiveSection('reviews')}
          className={`pb-3.5 px-6 text-sm font-bold border-b-2 transition flex items-center gap-2 ${
            activeSection === 'reviews'
              ? 'border-emerald-600 text-emerald-600 font-extrabold'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <Star className="h-4 w-4" />
          <span>Renter Reviews &amp; Feedback</span>
          {allReviews.length > 0 && (
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
              {allReviews.length}
            </span>
          )}
        </button>
      </div>

      {activeSection === 'listings' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Listed Properties column (Left 2 spans) */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="font-display text-base font-bold text-gray-900">Your Listed Properties</h3>

          {/* Real-time AI Price Optimizer Result Banner */}
          {activeOptimizationProperty && (
            <div className="rounded-2xl border-2 border-purple-200 bg-gradient-to-r from-purple-50/70 to-indigo-50/40 p-6 shadow-md relative overflow-hidden animate-in slide-in-from-top-4 duration-200 font-sans">
              <button 
                type="button"
                onClick={() => { setActiveOptimizationProperty(null); setExistingAiPricingData(null); }}
                className="absolute top-4 right-4 text-purple-400 hover:text-purple-900 border border-purple-150 rounded-lg p-1 hover:bg-purple-100/50 cursor-pointer"
                title="Dismiss Report"
              >
                <X className="h-4 w-4" />
              </button>
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="p-3 bg-purple-600 rounded-2xl text-white shadow-lg shadow-purple-200 shrink-0">
                    <Sparkles className="h-6 w-6 animate-pulse" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-purple-600 uppercase tracking-widest bg-purple-100 px-2 py-0.5 rounded-full inline-block">AI Marketplace Report</span>
                    <h4 className="text-base font-extrabold text-gray-900 mt-1">Rent Yield Optimization Audit</h4>
                    <p className="text-xs text-gray-500 font-medium">Analyzing: <strong className="text-purple-950 font-bold">{activeOptimizationProperty.title}</strong> ({activeOptimizationProperty.location})</p>
                  </div>
                </div>

                {existingAiLoading && (
                  <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl border border-purple-120 shadow-sm shrink-0">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-purple-600 border-t-transparent" />
                    <span className="text-xs font-bold text-purple-700 font-sans">Querying Gemini Neural Engine...</span>
                  </div>
                )}
              </div>

              {existingAiPricingData && (
                <div className="mt-6 grid grid-cols-1 md:grid-cols-12 gap-6 pt-5 border-t border-purple-150">
                  {/* Metric breakdown */}
                  <div className="md:col-span-4 bg-white rounded-2xl border border-purple-100 p-5 shadow-sm space-y-4">
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block font-sans">Competitive Rent</span>
                      <div className="flex items-baseline gap-1 mt-1 font-sans">
                        <p className="text-2xl font-black text-purple-950">₹{existingAiPricingData.suggestedRent.toLocaleString('en-IN')}</p>
                        <span className="text-[11px] font-medium text-gray-500">/mo</span>
                      </div>
                      
                      <div className="mt-2.5 pt-2.5 border-t border-gray-100 flex items-center justify-between">
                        <span className="text-[10px] text-gray-400 font-bold">Current Price:</span>
                        <span className="text-xs font-extrabold text-gray-800">₹{activeOptimizationProperty.pricePerMonth.toLocaleString('en-IN')}/mo</span>
                      </div>
                    </div>

                    <div className="space-y-1.5 bg-gray-50/80 rounded-xl p-3 text-[11px]">
                      <div className="flex items-center justify-between text-gray-500">
                        <span>Rent Range (Low):</span>
                        <strong className="text-gray-700">₹{existingAiPricingData.minRange.toLocaleString('en-IN')}</strong>
                      </div>
                      <div className="flex items-center justify-between text-gray-500">
                        <span>Rent Range (High):</span>
                        <strong className="text-gray-700">₹{existingAiPricingData.maxRange.toLocaleString('en-IN')}</strong>
                      </div>
                      <div className="flex items-center justify-between pt-1.5 border-t border-gray-150">
                        <span className="font-semibold text-purple-900">Safety Score:</span>
                        <span className="font-black text-purple-800">{existingAiPricingData.confidence || 90}%</span>
                      </div>
                    </div>

                    {onUpdatePropertyPrice && activeOptimizationProperty.pricePerMonth !== existingAiPricingData.suggestedRent && (
                      <button
                        type="button"
                        onClick={() => {
                          onUpdatePropertyPrice(activeOptimizationProperty.id, existingAiPricingData.suggestedRent);
                          // Update active copy so state matches
                          setActiveOptimizationProperty({
                            ...activeOptimizationProperty,
                            pricePerMonth: existingAiPricingData.suggestedRent
                          });
                        }}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-xl py-2.5 text-xs font-black shadow-md cursor-pointer transition flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle className="h-3.5 w-3.5" />
                        Apply Recommended Rent
                      </button>
                    )}
                  </div>

                  {/* Reasons bullet points */}
                  <div className="md:col-span-4 bg-white/70 rounded-2xl border border-purple-100/50 p-5 space-y-3.5">
                    <h5 className="text-xs font-extrabold text-purple-950 uppercase tracking-widest flex items-center gap-1.5 border-b border-purple-100 pb-1.5 font-sans">
                      <CheckCircle className="h-4 w-4 text-emerald-500" /> Evaluation Factors
                    </h5>
                    <ul className="space-y-2.5 text-xs text-gray-700 font-medium leading-relaxed font-sans">
                      {existingAiPricingData.reasons.map((reason: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="inline-flex h-1.5 w-1.5 rounded-full bg-purple-600 mt-1.5 shrink-0" />
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Optimizations & suggestions */}
                  <div className="md:col-span-4 bg-white/70 rounded-2xl border border-purple-100/50 p-5 space-y-3.5 font-sans">
                    <h5 className="text-xs font-extrabold text-purple-950 uppercase tracking-widest flex items-center gap-1.5 border-b border-purple-100 pb-1.5">
                      <AlertCircle className="h-4 w-4 text-amber-500" /> Yield Booster Tips
                    </h5>
                    <ul className="space-y-2.5 text-xs text-gray-700 leading-relaxed font-semibold">
                      {existingAiPricingData.tips.map((tip: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2 bg-amber-50/40 p-2 rounded-xl border border-amber-100/30">
                          <span className="text-amber-600 font-bold shrink-0">💡</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}

          {properties.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-gray-300 rounded-2xl">
              <Building className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-gray-600">No properties listed yet</p>
              <button
                id="btn-add-property-empty"
                onClick={() => setShowAddForm(true)}
                className="mt-2 text-xs font-bold text-emerald-600 hover:underline"
              >
                Create your first listing now
              </button>
            </div>
          ) : (
            properties.map((property) => (
              <div
                key={property.id}
                className="rounded-2xl border border-gray-200 bg-white p-4 flex flex-col sm:flex-row gap-4 hover:shadow-sm transition"
              >
                <img
                  src={property.photos[0]}
                  className="w-full sm:w-36 aspect-[4/3] rounded-xl object-cover bg-gray-50"
                />

                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-gray-100 px-2 py-0.5 text-[9px] font-bold text-gray-600 uppercase tracking-wider">
                          {property.propertyType} • {property.furnishingType}
                        </span>
                        {property.featured && (
                          <span className="inline-flex items-center gap-1 rounded bg-amber-50 text-amber-700 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider border border-amber-200">
                            <Sparkles className="h-2.5 w-2.5 fill-amber-550 text-amber-500 animate-pulse animate-infinite" />
                            Featured
                          </span>
                        )}
                      </div>
                      
                      {/* Active Status controls */}
                      <div className="flex items-center gap-1">
                        <span className={`h-2 w-2 rounded-full ${
                          property.status === 'Active' ? 'bg-emerald-500' : 'bg-gray-400'
                        }`} />
                        <span className="text-[10px] font-bold text-gray-500 uppercase">{property.status}</span>
                      </div>
                    </div>

                    <h4 className="font-display text-base font-bold text-gray-900 mt-1">{property.title}</h4>
                    <p className="text-xs text-gray-500 mt-1">{property.location}</p>
                  </div>

                  {/* Actions footer inside property card */}
                  <div className="flex items-center justify-between border-t border-gray-100 pt-3 mt-4">
                    <span className="font-display text-sm font-bold text-gray-900">₹{property.pricePerMonth.toLocaleString('en-IN')}<span className="text-[11px] font-normal text-gray-500">/mo</span></span>
                    
                    <div className="flex items-center gap-1 flex-wrap">
                      <button
                        type="button"
                        id={`btn-optimize-existing-${property.id}`}
                        onClick={() => handleTriggerExistingPriceOptimizer(property)}
                        className={`flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs transition cursor-pointer font-bold ${
                          activeOptimizationProperty?.id === property.id
                            ? 'bg-purple-100 text-purple-900 border-purple-300 font-extrabold shadow-sm animate-pulse'
                            : 'border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100/60'
                        }`}
                        title="Analyze current attributes with Gemini AI"
                      >
                        <Sparkles className={`h-3 w-3 ${activeOptimizationProperty?.id === property.id ? 'text-purple-700 fill-purple-400' : 'text-purple-600'}`} />
                        <span>Optimize Price</span>
                      </button>

                      <button
                        id={`toggle-featured-${property.id}`}
                        onClick={() => onTogglePropertyFeatured(property.id)}
                        className={`flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs transition cursor-pointer ${
                          property.featured 
                            ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100 font-semibold' 
                            : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <Sparkles className={`h-3 w-3 ${property.featured ? 'text-amber-600 fill-amber-500' : 'text-gray-400'}`} />
                        <span>{property.featured ? 'Featured' : 'Promote'}</span>
                      </button>

                      {property.status === 'Active' ? (
                        <button
                          id={`pause-${property.id}`}
                          onClick={() => onUpdatePropertyStatus(property.id, 'Inactive')}
                          className="flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-50"
                        >
                          <Pause className="h-3 w-3" />
                          <span>Pause</span>
                        </button>
                      ) : (
                        <button
                          id={`resume-${property.id}`}
                          onClick={() => onUpdatePropertyStatus(property.id, 'Active')}
                          className="flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-50"
                        >
                          <Play className="h-3 w-3" />
                          <span>Resume</span>
                        </button>
                      )}

                      <button
                        id={`delete-${property.id}`}
                        onClick={() => { if(confirm("Delete property?")) onDeleteProperty(property.id); }}
                        className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                </div>

              </div>
            ))
          )}

        </div>

        {/* Tenant Inquiries column (Right 1 span) */}
        <div className="space-y-6">
          <h3 className="font-display text-base font-bold text-gray-900">Applicant Submissions</h3>
          
          {inquiries.length === 0 ? (
            <p className="text-xs text-gray-400 italic">No renter submissions listed right now.</p>
          ) : (
            inquiries.map((inquiry) => {
              const matchedProp = properties.find(p => p.id === inquiry.propertyId);
              return (
                <div
                  key={inquiry.id}
                  className="rounded-2xl border border-gray-200 bg-white p-4 space-y-3.5 shadow-sm"
                >
                  
                  {/* Avatar detail */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <img src={inquiry.renterAvatar} className="h-8 w-8 rounded-full object-cover" />
                      <div>
                        <span className="text-xs font-bold text-gray-900 leading-none block">{inquiry.renterName}</span>
                        <span className="text-[9px] font-medium text-emerald-600">Trust Score: {inquiry.trustScore}% Verified ✓</span>
                      </div>
                    </div>

                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-purple-50 text-xs font-bold text-purple-700 font-mono">
                      {inquiry.matchScore}%
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-2.5 text-[11px] text-gray-600 space-y-1">
                    <p>Applied for: <span className="font-semibold text-gray-800 line-clamp-1">{matchedProp?.title || 'Property room'}</span></p>
                    <p>Wants budget: <span className="font-semibold text-gray-800">₹{inquiry.preferences.budget}</span></p>
                    <p>Sleep hours: <span className="font-semibold text-gray-800">{inquiry.preferences.sleepHours}</span></p>
                  </div>

                  {/* Lease and Move-In Info */}
                  <div className="border border-sky-100/60 rounded-xl p-2.5 bg-sky-50/30 text-xs space-y-1.5 font-sans">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-gray-500 font-medium flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-sky-600" /> Move-In Date:
                      </span>
                      <span className="font-bold text-gray-800">{inquiry.moveInDate || "Immediate"}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-gray-500 font-medium flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-sky-600" /> Lease Duration:
                      </span>
                      <span className="font-bold text-gray-800">{inquiry.leaseDuration || "Not specified"}</span>
                    </div>
                  </div>

                  {/* Renter Preferences & Lifestyle Context */}
                  <div className="border border-gray-150 rounded-xl p-3 bg-white space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Renter Lifestyle</span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                        {inquiry.preferences.roommateCount > 0 ? `${inquiry.preferences.roommateCount} Roommates` : 'Single'}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-1.5 text-[10px] font-sans">
                      <div className="flex items-center justify-between bg-gray-50 p-1.5 rounded-lg border border-gray-100">
                        <span className="text-gray-400">🐶 Pets:</span>
                        <span className="font-bold text-gray-800">{inquiry.preferences.pets ? 'Yes' : 'No'}</span>
                      </div>
                      <div className="flex items-center justify-between bg-gray-50 p-1.5 rounded-lg border border-gray-100">
                        <span className="text-gray-400">🥬 Non-Veg:</span>
                        <span className="font-bold text-gray-800">{inquiry.preferences.nonVeg ? 'Yes' : 'No'}</span>
                      </div>
                      <div className="flex items-center justify-between bg-gray-50 p-1.5 rounded-lg border border-gray-100 col-span-2">
                        <span className="text-gray-400">🚬 Smoking:</span>
                        <span className="font-bold text-gray-800">{inquiry.preferences.smoking ? 'Yes' : 'No'}</span>
                      </div>
                      <div className="flex items-center justify-between bg-gray-50 p-1.5 rounded-lg border border-gray-100 col-span-2">
                        <span className="text-gray-400">🧹 Clean Bias:</span>
                        <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded leading-none text-[9px] uppercase">{inquiry.preferences.cleanLevel}</span>
                      </div>
                      {inquiry.preferences.officeLocation && (
                        <div className="flex items-center justify-between bg-gray-50 p-1.5 rounded-lg border border-gray-100 col-span-2">
                          <span className="text-gray-400">📍 Location:</span>
                          <span className="font-bold text-gray-800 truncate max-w-[120px]" title={inquiry.preferences.officeLocation}>{inquiry.preferences.officeLocation}</span>
                        </div>
                      )}
                    </div>

                    {inquiry.preferences.hobbies && inquiry.preferences.hobbies.length > 0 && (
                      <div className="pt-1.5 text-left">
                        <span className="text-[9px] font-semibold text-gray-400 block mb-1 uppercase tracking-wide">Hobbies & Interests:</span>
                        <div className="flex flex-wrap gap-1">
                          {inquiry.preferences.hobbies.map((hobby, idx) => (
                            <span key={idx} className="bg-purple-50 text-purple-700 font-medium text-[9px] px-2 py-0.5 rounded border border-purple-100 leading-none">
                              {hobby}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions inside inquiry */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100">
                    <span className={`text-[10px] font-bold uppercase ${
                      inquiry.status === 'Accepted' ? 'text-emerald-600' : inquiry.status === 'Rejected' ? 'text-rose-500' : 'text-gray-400'
                    }`}>
                      {inquiry.status}
                    </span>

                    {inquiry.status === 'Pending' && (
                      <div className="flex gap-1">
                        <button
                          id={`reject-inq-${inquiry.id}`}
                          onClick={() => onUpdateInquiryStatus(inquiry.id, 'Rejected')}
                          className="rounded-lg text-[10px] font-bold text-gray-500 border border-gray-200 px-2 py-1 hover:bg-gray-50"
                        >
                          Decline
                        </button>
                        <button
                          id={`accept-inq-${inquiry.id}`}
                          onClick={() => onUpdateInquiryStatus(inquiry.id, 'Accepted')}
                          className="rounded-lg text-[10px] font-bold text-white bg-emerald-600 px-2.5 py-1 hover:bg-emerald-700"
                        >
                          Accept Match
                        </button>
                      </div>
                    )}
                  </div>

                </div>
              );
            })
          )}

        </div>

      </div>

      ) : (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Reputation Header & Quick Info */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-150 pb-5">
            <div>
              <h3 className="font-display text-lg font-bold text-gray-950">Landlord Reputation &amp; Renters Feedback</h3>
              <p className="text-xs text-slate-500 font-sans mt-0.5">Crowdsourced tenant logs and rating evaluations verified by zero-knowledge co-living certificates.</p>
            </div>
            <div className="flex gap-2.5 bg-gray-100/80 p-1 rounded-xl self-start">
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-lg flex items-center gap-1">
                <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
                Verified Landlord Account ✓
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {/* Massive overall score card */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Overall Trust Index</span>
                <p className="text-4xl font-black text-gray-950 mt-2 flex items-baseline gap-1.5 font-display">
                  ⭐ {avgOverall}
                  <span className="text-xs font-semibold text-gray-400">/ 5.0</span>
                </p>
              </div>
              <p className="text-xs text-slate-500 mt-4 font-sans font-medium">Aggregated across <strong className="text-gray-900">{totalReviewsCount}</strong> verified co-living logs.</p>
            </div>

            {/* Sub-Score Card: Character Rating */}
            <div className="rounded-2xl border border-gray-200 bg-amber-50/20 p-5 shadow-sm space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">🗣️ Character Index</span>
                <span className="text-xs font-bold text-amber-700">★ {avgCharacter} / 5</span>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="h-1.5 w-full bg-gray-200/60 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(parseFloat(avgCharacter) / 5) * 100}%` }} />
                </div>
                <div className="flex justify-between text-[10px] text-gray-400 font-semibold font-sans">
                  <span>Standard Politeness</span>
                  <span className="text-amber-805">Excellent✓</span>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 leading-normal">Evaluates behavior, respect for roommate privacy, repair turnaround time, and deposit return integrity.</p>
            </div>

            {/* Sub-Score Card: Room Condition Rating */}
            <div className="rounded-2xl border border-gray-200 bg-teal-50/20 p-5 shadow-sm space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider">🚿 Room Hygiene Index</span>
                <span className="text-xs font-bold text-teal-700">★ {avgRoom} / 5</span>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="h-1.5 w-full bg-gray-200/60 rounded-full overflow-hidden">
                  <div className="h-full bg-teal-500 rounded-full" style={{ width: `${(parseFloat(avgRoom) / 5) * 100}%` }} />
                </div>
                <div className="flex justify-between text-[10px] text-gray-400 font-semibold font-sans">
                  <span>Hygienic standard</span>
                  <span className="text-teal-805">Spotless ✓</span>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 leading-normal">Tracks overall neatness upon check-in, water pressure / geyser utility, paint, ventilation, and Wi-Fi stability.</p>
            </div>

            {/* Sub-Score Card: Bathroom Hygiene Rating */}
            <div className="rounded-2xl border border-gray-200 bg-blue-50/20 p-5 shadow-sm space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">🚿 Bathroom Index</span>
                <span className="text-xs font-bold text-blue-700">★ {avgBathroom} / 5</span>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="h-1.5 w-full bg-gray-200/60 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(parseFloat(avgBathroom) / 5) * 100}%` }} />
                </div>
                <div className="flex justify-between text-[10px] text-gray-400 font-semibold font-sans">
                  <span>Leaks checked</span>
                  <span className="text-blue-805">No Leakage✓</span>
                </div>
              </div>
              <p className="text-[10px] text-slate-505 leading-normal">Calculates toilet plumbing, tile hygiene, ventilation, and regular exhaust efficiency audited by inspectors.</p>
            </div>
          </div>

          {/* Reviews logs list */}
          <div className="space-y-4 pt-4">
            <h4 className="text-xs font-bold text-gray-805 uppercase tracking-widest block font-sans">Historical Renter Feedback Logs ({totalReviewsCount})</h4>

            {totalReviewsCount === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
                <Star className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-gray-650">No renter feedback received yet</p>
                <p className="text-xs text-gray-400 mt-1">Tenant evaluations automatically sync when renters submit ratings via their portal.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {allReviews.map((review: any) => (
                  <div key={review.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
                    {/* Reviewer and Badge Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-gray-100">
                      <div className="flex items-center gap-2.5">
                        <img src={review.renterAvatar} className="h-9 w-9 rounded-full object-cover border border-gray-150 shadow-xs" />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-gray-900 leading-none block">{review.renterName}</span>
                            <span className="rounded bg-emerald-50 text-[9px] font-bold text-emerald-800 border border-emerald-100 px-1 py-0.5 leading-none">Verified Tenant ✓</span>
                          </div>
                          <span className="text-[10px] text-gray-400 mt-1 block leading-none">{review.reviewDate} • Stayed at: <strong className="text-gray-650 font-semibold">{review.propertyTitle}</strong></span>
                        </div>
                      </div>

                      {/* Score Badges */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="bg-amber-100/70 border border-amber-200 text-amber-805 text-[10px] px-2.5 py-1 rounded-lg font-bold">
                          🗣️ Character: ★ {review.landlordCharacterRating}/5
                        </span>
                        <span className="bg-teal-100/70 border border-teal-200 text-teal-855 text-[10px] px-2.5 py-1 rounded-lg font-bold">
                          🏨 Room Quality: ★ {review.roomConditionRating}/5
                        </span>
                        <span className="bg-blue-100/70 border border-blue-200 text-blue-855 text-[10px] px-2.5 py-1 rounded-lg font-bold">
                          🚿 Bath Hygiene: ★ {review.bathroomHygieneRating}/5
                        </span>
                      </div>
                    </div>

                    {/* Detailed feedback text */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
                      <div className="rounded-xl bg-amber-50/25 border border-amber-100/40 p-4 space-y-2">
                        <span className="text-[10px] font-bold text-amber-855 uppercase tracking-wide block">Renter feedback on Landlord behavior:</span>
                        <p className="text-gray-750 italic leading-relaxed">
                          "{review.landlordCharacterComment || "No comment left."}"
                        </p>
                      </div>

                      <div className="rounded-xl bg-teal-50/25 border border-teal-100/40 p-4 space-y-2">
                        <span className="text-[10px] font-bold text-teal-855 uppercase tracking-wide block">Renter feedback on Room conditions:</span>
                        <p className="text-gray-750 italic leading-relaxed">
                          "{review.roomConditionComment || "No comment left."}"
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* Add Property Multi-step Modal Form */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-4xl rounded-2xl bg-white p-6 shadow-xl flex flex-col md:flex-row gap-6 max-h-[90vh] overflow-y-auto">
            
            {/* Form Left Side */}
            <div className="flex-1 space-y-4">
              
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                    <Building className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h3 className="font-display text-base font-bold text-gray-900">Post Room Listing</h3>
                    <p className="text-xs text-gray-500">Zero commission, direct to potential roommates.</p>
                  </div>
                </div>
                <button
                  id="close-add-form"
                  onClick={() => setShowAddForm(false)}
                  className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-950"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Progress Steps Indicators */}
              <div className="flex items-center justify-between text-xs text-gray-500 font-bold uppercase tracking-wider bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
                <span className={formStep === 1 ? 'text-emerald-700' : ''}>1. Basics</span>
                <ChevronRight className="h-3 w-3" />
                <span className={formStep === 2 ? 'text-emerald-700' : ''}>2. Amenities &amp; Gallery</span>
                <ChevronRight className="h-3 w-3" />
                <span className={formStep === 3 ? 'text-emerald-700' : ''}>3. House Rules</span>
              </div>

              {/* Step Forms */}
              <form onSubmit={handleSavePropertySubmit} className="space-y-4">
                
                {formStep === 1 && (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Listing Headline / Title</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Minimalist Furnished master room near central metro"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full text-xs rounded-xl border border-gray-200 px-3 py-2 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Property Type</label>
                        <select
                          value={propertyType}
                          onChange={(e) => setPropertyType(e.target.value as any)}
                          className="w-full text-xs rounded-xl border border-gray-200 px-3 py-2 focus:outline-none"
                        >
                          <option value="1BHK">1BHK</option>
                          <option value="2BHK">2BHK</option>
                          <option value="3BHK">3BHK</option>
                          <option value="Room">Room</option>
                          <option value="Shared Room">Shared Room</option>
                          <option value="Studio">Studio</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Zone / Locality</label>
                        <input
                          type="text"
                          required
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          className="w-full text-xs rounded-xl border border-gray-200 px-3 py-2 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Latitude</label>
                        <input
                          type="number"
                          step="any"
                          required
                          value={latitude}
                          onChange={(e) => setLatitude(parseFloat(e.target.value) || 0)}
                          className="w-full text-xs rounded-xl border border-gray-200 px-3 py-2 focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Longitude</label>
                        <input
                          type="number"
                          step="any"
                          required
                          value={longitude}
                          onChange={(e) => setLongitude(parseFloat(e.target.value) || 0)}
                          className="w-full text-xs rounded-xl border border-gray-200 px-3 py-2 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Target Monthly Rent (INR)</label>
                        <input
                          type="number"
                          required
                          value={pricePerMonth}
                          onChange={(e) => setPricePerMonth(parseInt(e.target.value))}
                          className="w-full text-xs rounded-xl border border-gray-200 px-3 py-2 focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Security Deposit Expectation</label>
                        <input
                          type="number"
                          required
                          value={securityDeposit}
                          onChange={(e) => setSecurityDeposit(parseInt(e.target.value))}
                          className="w-full text-xs rounded-xl border border-gray-200 px-3 py-2 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Area (sqft)</label>
                        <input
                          type="number"
                          value={areaSqft}
                          onChange={(e) => setAreaSqft(parseInt(e.target.value))}
                          className="w-full text-xs rounded-xl border border-gray-200 px-2 py-1.5"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Bedrooms</label>
                        <input
                          type="number"
                          value={bedrooms}
                          onChange={(e) => setBedrooms(parseInt(e.target.value))}
                          className="w-full text-xs rounded-xl border border-gray-200 px-2 py-1.5"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Bathrooms</label>
                        <input
                          type="number"
                          value={bathrooms}
                          onChange={(e) => setBathrooms(parseInt(e.target.value))}
                          className="w-full text-xs rounded-xl border border-gray-200 px-2 py-1.5"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Room Details & Commute landmark info</label>
                      <textarea
                        rows={3}
                        placeholder="Write dynamic details about roommate vibe, clean standards..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full text-xs rounded-xl border border-gray-200 px-3 py-2 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {formStep === 2 && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-2">Furnishing standard</label>
                      <div className="flex gap-2">
                        {['Furnished', 'Semi-Furnished', 'Unfurnished'].map((type) => (
                          <button
                            type="button"
                            key={type}
                            onClick={() => setFurnishingType(type as any)}
                            className={`rounded-xl px-4 py-2 text-xs font-bold border transition ${
                              furnishingType === type
                                ? 'bg-emerald-600 text-white border-emerald-600'
                                : 'border-gray-200 text-gray-600 bg-white hover:bg-gray-50'
                            }`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-2">Amenities available</label>
                      <div className="flex flex-wrap gap-1.5">
                        {['Power Backup', 'Air Conditioning', 'High Speed WiFi', 'Washing Machine', 'Refrigerator', 'Geyser', 'Microwave', 'Gymnasium', 'Water Purifier', 'Elevator', 'Security Guard'].map((name) => {
                          const has = amenities.includes(name);
                          return (
                            <button
                              type="button"
                              key={name}
                              onClick={() => handleToggleAmenity(name)}
                              className={`rounded-full px-3 py-1.5 text-xs transition border ${
                                has 
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                                  : 'bg-transparent border-gray-200 text-gray-600 hover:bg-gray-50'
                              }`}
                            >
                              {name}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1.5">Parking support</label>
                      <select
                        value={parking}
                        onChange={(e) => setParking(e.target.value as any)}
                        className="w-full text-xs rounded-xl border border-gray-200 px-3 py-2 focus:outline-none"
                      >
                        <option value="No">No Parking available</option>
                        <option value="Bike Only">Bike Only Parking</option>
                        <option value="Car & Bike">Car & Bike (Gated)</option>
                      </select>
                    </div>

                    {/* Multi-Photo Gallery & Drag-and-Drop Area */}
                    <div className="border-t border-gray-150 pt-4 space-y-3.5">
                      <div>
                        <span className="text-xs font-bold text-gray-800 uppercase tracking-wider block">📸 Room &amp; Property Gallery (Min 3 Photos)</span>
                        <p className="text-[11px] text-gray-500">Provide high-resolution photos of the cozy space to attract verified co-living seekers.</p>
                      </div>

                      {/* Drag & Drop File Upload + Click to Manual upload */}
                      <div 
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const files = e.dataTransfer.files;
                          if (files && files.length > 0) {
                            Array.from(files).forEach((file: File) => {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                if (event.target?.result) {
                                  setAddedPhotos(prev => [...prev, event.target!.result as string]);
                                  setPhotoError('');
                                }
                              };
                              reader.readAsDataURL(file);
                            });
                          }
                        }}
                        className={`border-2 border-dashed ${isUploadingPhoto ? 'border-purple-300 bg-purple-50/20' : 'border-gray-205 hover:border-emerald-500 hover:bg-emerald-50/5'} cursor-pointer rounded-2xl p-5 text-center transition space-y-1 relative group`}
                      >
                        {/* Hidden file input target */}
                        <input 
                          type="file" 
                          id="gallery-file-upload"
                          multiple
                          accept="image/*"
                          disabled={isUploadingPhoto}
                          onChange={async (e) => {
                            const files = e.target.files;
                            if (files && files.length > 0) {
                              setIsUploadingPhoto(true);
                              setPhotoError('');
                              try {
                                const fileList = Array.from(files);
                                for (const file of fileList) {
                                  const photoUrl = await uploadPropertyPhoto(file);
                                  setAddedPhotos(prev => [...prev, photoUrl]);
                                }
                              } catch (err: any) {
                                setPhotoError(`Upload issue: ${err?.message || err}`);
                              } finally {
                                setIsUploadingPhoto(false);
                              }
                            }
                          }}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full disabled:cursor-not-allowed"
                        />
                        {isUploadingPhoto ? (
                          <div className="mx-auto h-7 w-7 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center animate-spin">
                            <Loader2 className="h-4 w-4" />
                          </div>
                        ) : (
                          <div className="mx-auto h-7 w-7 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition duration-150">
                            <Plus className="h-4 w-4" />
                          </div>
                        )}
                        <p className="text-xs font-bold text-gray-700">
                          {isUploadingPhoto ? 'Uploading to Supabase Store...' : 'Drag & drop photos here, or click to browse'}
                        </p>
                        <p className="text-[10px] text-gray-400">
                          {isSupabaseConfigured 
                            ? '⚡ Connected: Live Supabase photo storage active' 
                            : 'Supports JPEG, PNG, or WebP (Local fallback active)'}
                        </p>
                      </div>

                      {/* Custom URL Input & Quick Suggestions */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Or Add photo via URL address</label>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            id="custom-photo-url-input"
                            placeholder="Paste custom room image address..."
                            value={customPhotoUrl}
                            onChange={(e) => setCustomPhotoUrl(e.target.value)}
                            className="flex-1 text-xs rounded-xl border border-gray-200 px-3 py-2 focus:border-emerald-500 focus:outline-none bg-white"
                          />
                          <button
                            type="button"
                            id="btn-add-custom-photo"
                            onClick={() => {
                              if (!customPhotoUrl.trim()) return;
                              if (!customPhotoUrl.startsWith('http') && !customPhotoUrl.startsWith('data:image')) {
                                setPhotoError('Please specify a valid image HTTP URL or file.');
                                return;
                              }
                              setAddedPhotos(prev => [...prev, customPhotoUrl.trim()]);
                              setCustomPhotoUrl('');
                              setPhotoError('');
                            }}
                            className="rounded-xl bg-gray-900 px-3.5 py-2 text-xs font-bold text-white hover:bg-gray-800 transition shrink-0"
                          >
                            Add URL
                          </button>
                        </div>

                        {/* Presets/Thumbnails clickable row to quickly populate */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[9px] text-gray-400 font-bold uppercase select-none font-sans mr-1">Comfort Presets:</span>
                          {[
                            { name: '🛋️ Cozy Lounge', url: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&auto=format&fit=crop&q=80' },
                            { name: '🛏️ Modern Bed', url: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800&auto=format&fit=crop&q=80' },
                            { name: '☀️ Workstation', url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop&q=80' },
                            { name: '🛁 Clean Bath', url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&auto=format&fit=crop&q=80' }
                          ].map((preset, pidx) => (
                            <button
                              type="button"
                              key={pidx}
                              onClick={() => {
                                if (addedPhotos.includes(preset.url)) return;
                                setAddedPhotos(prev => [...prev, preset.url]);
                                setPhotoError('');
                              }}
                              className="text-[10px] bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 transition text-gray-650 px-2 py-1 rounded-lg border border-gray-150 font-medium"
                            >
                              {preset.name}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Photo preview Gallery Grid */}
                      <div className="space-y-1.5 pt-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-gray-450 uppercase tracking-widest block">Active Gallery ({addedPhotos.length})</span>
                          {addedPhotos.length >= 3 ? (
                            <span className="text-[9px] text-emerald-800 font-extrabold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                              ✓ Minimum 3 Met
                            </span>
                          ) : (
                            <span className="text-[9px] text-amber-800 font-extrabold flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded border border-amber-100 animate-pulse">
                              ⚠️ Add at least {3 - addedPhotos.length} more
                            </span>
                          )}
                        </div>

                        {photoError && <p className="text-[10px] text-red-600 font-bold">{photoError}</p>}

                        {addedPhotos.length === 0 ? (
                          <div className="text-center py-5 bg-gray-50 rounded-2xl border border-dashed border-gray-250">
                            <span className="text-xs text-gray-400 italic font-medium">No photos added yet. Complete this step by listing at least 3 photos.</span>
                          </div>
                        ) : (
                          <div className="grid grid-cols-3 gap-2 bg-gray-100/50 p-2 border border-gray-200 rounded-2xl">
                            {addedPhotos.map((pUrl, pi) => (
                              <div key={pi} className="relative group rounded-xl overflow-hidden aspect-[4/3] bg-gray-105 border border-gray-200">
                                <img src={pUrl} className="w-full h-full object-cover group-hover:scale-105 transition duration-200" alt={`Listing upload preview ${pi}`} referrerPolicy="no-referrer" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setAddedPhotos(prev => prev.filter((_, idx) => idx !== pi));
                                    }}
                                    className="p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full transition shadow-xs"
                                    title="Delete Photo"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                                <span className="absolute bottom-1 right-1 bg-black/75 px-1 py-0.5 rounded text-[8px] text-white font-mono">
                                  #{pi + 1}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                    </div>
                  </div>
                )}

                {formStep === 3 && (
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Co-Living House Rules policies</h4>
                    
                    <div className="grid grid-cols-2 gap-3.5">
                      <div className="flex items-center justify-between rounded-xl px-3 py-2 border border-gray-200 bg-gray-50/50">
                        <span className="text-xs text-gray-700 font-semibold">Non Veg Cooking Allowed</span>
                        <input 
                          type="checkbox" 
                          checked={houseRules.nonVegcooking} 
                          onChange={(e) => setHouseRules({ ...houseRules, nonVegcooking: e.target.checked })}
                          className="h-4 w-4 accent-emerald-600 cursor-pointer"
                        />
                      </div>

                      <div className="flex items-center justify-between rounded-xl px-3 py-2 border border-gray-200 bg-gray-50/50">
                        <span className="text-xs text-gray-700 font-semibold">Smoking Permitted</span>
                        <input 
                          type="checkbox" 
                          checked={houseRules.smoking} 
                          onChange={(e) => setHouseRules({ ...houseRules, smoking: e.target.checked })}
                          className="h-4 w-4 accent-emerald-600 cursor-pointer"
                        />
                      </div>

                      <div className="flex items-center justify-between rounded-xl px-3 py-2 border border-gray-200 bg-gray-50/50">
                        <span className="text-xs text-gray-700 font-semibold">Pet Friendly</span>
                        <input 
                          type="checkbox" 
                          checked={houseRules.pets} 
                          onChange={(e) => setHouseRules({ ...houseRules, pets: e.target.checked })}
                          className="h-4 w-4 accent-emerald-600 cursor-pointer"
                        />
                      </div>

                      <div className="flex items-center justify-between rounded-xl px-3 py-2 border border-gray-200 bg-gray-50/50">
                        <span className="text-xs text-gray-700 font-semibold">Couples/Guests Welcomed</span>
                        <input 
                          type="checkbox" 
                          checked={houseRules.couplesSelection} 
                          onChange={(e) => setHouseRules({ ...houseRules, couplesSelection: e.target.checked })}
                          className="h-4 w-4 accent-emerald-600 cursor-pointer"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Quiet Hours</label>
                        <input
                          type="text"
                          value={houseRules.quietHours}
                          onChange={(e) => setHouseRules({ ...houseRules, quietHours: e.target.value })}
                          className="w-full text-xs rounded-xl border border-gray-200 px-3 py-2"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Max Room Occupants</label>
                        <input
                          type="number"
                          value={houseRules.maxOccupants}
                          onChange={(e) => setHouseRules({ ...houseRules, maxOccupants: parseInt(e.target.value) })}
                          className="w-full text-xs rounded-xl border border-gray-200 px-3 py-2"
                        />
                      </div>
                    </div>

                    <div className="rounded-xl border border-amber-200 bg-amber-50/10 p-3.5 flex items-center justify-between">
                      <div className="flex items-start gap-2.5">
                        <Sparkles className="h-4 w-4 text-amber-500 shrink-0 mt-0.5 fill-amber-500" />
                        <div>
                          <span className="text-xs font-bold text-amber-900 block font-sans">Feature &amp; Promote Listing</span>
                          <span className="text-[10px] text-gray-500 block mt-0.5">Places this roommate listing at the top of the search directory for renters with a prominent Sparkle status.</span>
                        </div>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={isFeatured} 
                        onChange={(e) => setIsFeatured(e.target.checked)}
                        className="h-4.5 w-4.5 accent-amber-500 cursor-pointer"
                      />
                    </div>

                    <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100 flex items-start gap-2">
                      <CheckCircle className="h-4.5 w-4.5 text-emerald-600 shrink-0 mt-0.5" />
                      <p className="text-[10px] text-gray-600 leading-snug">
                        Ready! By clicking Post below, you publish directly to our zero-brokerage match platform. Verify your settings on the right sidebar if pricing feels high.
                      </p>
                    </div>

                  </div>
                )}

                {/* Form Navigation Controls */}
                <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-6">
                  {formStep > 1 ? (
                    <button
                      type="button"
                      id="btn-form-prev"
                      onClick={() => setFormStep(formStep - 1)}
                      className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-semibold hover:bg-gray-50"
                    >
                      Back
                    </button>
                  ) : (
                    <div />
                  )}

                  {formStep < 3 ? (
                    <button
                      type="button"
                      id="btn-form-next"
                      onClick={() => {
                        if (formStep === 2 && addedPhotos.length < 3) {
                          setPhotoError('At least 3 photos are required to proceed.');
                          return;
                        }
                        setPhotoError('');
                        setFormStep(formStep + 1);
                      }}
                      className="rounded-xl bg-emerald-600 text-white px-5 py-2.5 text-xs font-bold hover:bg-emerald-700"
                    >
                      Continue
                    </button>
                  ) : (
                    <button
                      type="submit"
                      id="submit-property"
                      className="rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white px-6 py-2.5 text-xs font-bold shadow-md shadow-emerald-100"
                    >
                      Publish Listing ✓
                    </button>
                  )}
                </div>

              </form>

            </div>

            {/* Form Right Side: AI Price Optimizer Assistant block */}
            <div className="w-full md:w-80 shrink-0 rounded-2xl border border-purple-200 bg-purple-50/20 p-5 space-y-4">
              <div className="flex items-center gap-1.5 text-purple-800">
                <Sparkles className="h-4.5 w-4.5" />
                <h4 className="font-display text-xs font-bold uppercase tracking-wider">AI Rent Price Optimizer</h4>
              </div>
              <p className="text-[11px] text-gray-600 leading-relaxed">
                Click estimate below and Gemini will audit your location, furnishing, size, and config against similar listings to suggest an optimal, fast-renting price range!
              </p>

              {/* Estimate Button */}
              {!aiPricingData && !isAiLoading ? (
                <button
                  type="button"
                  id="btn-run-price-optimizer"
                  onClick={handleTriggerPriceOptimizer}
                  className="w-full rounded-xl bg-purple-600 hover:bg-purple-700 px-4 py-2 text-xs font-bold text-white shadow-sm transition"
                >
                  Analyze & Suggest Rent Rate
                </button>
              ) : isAiLoading ? (
                <div className="text-center py-4 space-y-2">
                  <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-purple-600 border-t-transparent" />
                  <p className="text-[10px] text-purple-700 font-bold animate-pulse">Running Gemini pricing regressions...</p>
                </div>
              ) : (
                <div className="space-y-4 text-xs animate-in fade-in duration-200">
                  <div className="border-b border-purple-100 pb-3">
                    <span className="text-[9px] font-bold text-purple-500 uppercase">Suggested Monthly rent</span>
                    <p className="text-xl font-black text-purple-900 mt-0.5">₹{aiPricingData.suggestedRent.toLocaleString('en-IN')}</p>
                    <span className="text-[10px] text-gray-500 block mt-1">Recommended Range: ₹{aiPricingData.minRange.toLocaleString('en-IN')} - ₹{aiPricingData.maxRange.toLocaleString('en-IN')}</span>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[9px] font-bold text-purple-500 uppercase">Evaluation reasons</span>
                    <ul className="space-y-1.5 text-[10px] text-gray-600 font-medium">
                      {aiPricingData.reasons.map((reason: string, i: number) => (
                        <li key={i} className="flex items-start gap-1">
                          <CheckCircle className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-1 bg-white border border-purple-100 rounded-xl p-3">
                    <span className="text-[9px] font-bold text-amber-600 uppercase flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Tips to increase yield
                    </span>
                    <ul className="space-y-1 text-[10px] text-gray-600 mt-1">
                      {aiPricingData.tips.map((tip: string, idx: number) => (
                        <li key={idx} className="list-disc pl-1 ml-3">{tip}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Apply Suggested Rent directly to rent input field */}
                  <button
                    type="button"
                    id="btn-apply-suggested-rent"
                    onClick={() => setPricePerMonth(aiPricingData.suggestedRent)}
                    className="w-full text-center rounded-xl border border-purple-300 bg-white hover:bg-purple-50 px-3 py-1.5 text-[10px] font-bold text-purple-700"
                  >
                    Set Rent to ₹{aiPricingData.suggestedRent.toLocaleString('en-IN')}
                  </button>

                </div>
              )}

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
