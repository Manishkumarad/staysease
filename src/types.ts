export interface RenterPreferences {
  budget: number;
  pets: boolean;
  nonVeg: boolean;
  smoking: boolean;
  sleepHours: 'Early Bird (9 PM - 5 AM)' | 'Standard (11 PM - 7 AM)' | 'Night Owl (2 AM - 10 AM)';
  roommateCount: number;
  officeLocation: string;
  cleanLevel: 'High' | 'Moderate' | 'Spontaneous';
  hobbies: string[];
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'renter' | 'owner';
  verificationStatus: {
    email: boolean;
    phone: boolean;
    id: boolean;
    income: boolean;
  };
  preferences: RenterPreferences;
  trustScore: number;
  avatar: string;
}

export interface HouseRules {
  nonVegcooking: boolean;
  smoking: boolean;
  pets: boolean;
  couplesSelection: boolean;
  quietHours: string;
  maxOccupants: number;
}

export interface Property {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  propertyType: '1BHK' | '2BHK' | '3BHK' | 'Room' | 'Shared Room' | 'Studio';
  furnishingType: 'Furnished' | 'Semi-Furnished' | 'Unfurnished';
  location: string;
  latitude: number;
  longitude: number;
  areaSqft: number;
  bedrooms: number;
  bathrooms: number;
  amenities: string[];
  houseRules: HouseRules;
  pricePerMonth: number;
  securityDeposit: number;
  availableFromDate: string;
  maxOccupants: number;
  parking: 'No' | 'Bike Only' | 'Car & Bike';
  petFriendly: boolean;
  photos: string[];
  status: 'Active' | 'Inactive' | 'Booked';
  ownerName: string;
  ownerRating: number;
  ownerReviewsCount: number;
  ownerAvatar: string;
  views: number;
  inquiriesCount: number;
  allowedOccupants: 'Girls' | 'Boys' | 'Family' | 'Any';
  roomCategory: 'PG' | 'Co-Living' | 'Flatshare';
  bathroomPhoto?: string;
  panoramicPhoto?: string;
  reviewsList?: PropertyReview[];
  featured?: boolean;
}

export interface PropertyReview {
  id: string;
  renterName: string;
  renterAvatar: string;
  rating: number; // overall
  landlordCharacterRating: number; // 1-5 behavior score
  landlordCharacterComment: string;
  roomConditionRating: number; // 1-5 score
  roomConditionComment: string;
  bathroomHygieneRating: number; // 1-5 score
  reviewDate: string;
}

export interface MatchResult {
  matchScore: number;
  matchReason: string[];
  willApply: 'Yes' | 'Maybe' | 'No';
  willAccept: 'High' | 'Medium' | 'Low';
  mismatches: string[];
}

export interface Inquiry {
  id: string;
  propertyId: string;
  renterId: string;
  renterName: string;
  renterAvatar: string;
  renterEmail: string;
  renterPhone: string;
  status: 'Pending' | 'Accepted' | 'Rejected' | 'Scheduled_Visit' | 'Completed';
  matchScore: number;
  trustScore: number;
  applicationDate: string;
  moveInDate: string;
  leaseDuration: string;
  preferences: RenterPreferences;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  propertyId?: string;
  text: string;
  timestamp: string;
  isRead: boolean;
}
