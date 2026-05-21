import { createClient } from '@supabase/supabase-js';
import { Property } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if Supabase keys are provided and valid
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey && supabaseUrl !== 'undefined' && supabaseAnonKey !== 'undefined');

let supabaseInstance: any = null;

export function getSupabase() {
  if (!isSupabaseConfigured) {
    return null;
  }
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabaseInstance;
}

/**
 * Handle image files upload.
 * If Supabase is configured: Uploads to 'room-photos' bucket and returns public URL.
 * If not: Converts to stable Base64 or object-URL database or local mock persistence, ensuring seamless functionality.
 */
export async function uploadPropertyPhoto(file: File): Promise<string> {
  const supabase = getSupabase();
  if (!supabase) {
    // Graceful fallback: produce base64 or temporary browser Object URL
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve(reader.result as string);
      };
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    });
  }

  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `room_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
    const filePath = `listings/${fileName}`;

    // Upload files to 'room-photos' bucket
    const { error: uploadError } = await supabase.storage
      .from('room-photos')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      // If bucket does not exist, try to upload/create or fallback
      throw uploadError;
    }

    // Retrieve public URL
    const { data } = supabase.storage.from('room-photos').getPublicUrl(filePath);
    return data.publicUrl;
  } catch (error) {
    console.warn('Supabase upload error, using local fallback:', error);
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  }
}

/**
 * Persists property listings in Supabase or localStorage.
 */
export async function savePropertyQuery(property: Property): Promise<Property> {
  const supabase = getSupabase();
  if (!supabase) {
    // Fallback saves property in LocalStorage database
    const localList = localStorage.getItem('pc_custom_properties');
    const properties: Property[] = localList ? JSON.parse(localList) : [];
    const index = properties.findIndex(p => p.id === property.id);
    if (index >= 0) {
      properties[index] = property;
    } else {
      properties.push(property);
    }
    localStorage.setItem('pc_custom_properties', JSON.stringify(properties));
    return property;
  }

  try {
    // Tries to insert/update room listing table in Supabase
    const { data, error } = await supabase
      .from('properties')
      .upsert({
        id: property.id,
        owner_id: property.ownerId,
        title: property.title,
        description: property.description,
        property_type: property.propertyType,
        furnishing_type: property.furnishingType,
        location: property.location,
        latitude: property.latitude,
        longitude: property.longitude,
        area_sqft: property.areaSqft,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        amenities: property.amenities,
        house_rules: property.houseRules,
        price_per_month: property.pricePerMonth,
        security_deposit: property.securityDeposit,
        available_from_date: property.availableFromDate,
        max_occupants: property.maxOccupants,
        parking: property.parking,
        pet_friendly: property.petFriendly,
        photos: property.photos,
        status: property.status,
        owner_name: property.ownerName,
        owner_rating: property.ownerRating,
        owner_reviews_count: property.ownerReviewsCount,
        owner_avatar: property.ownerAvatar,
        views: property.views,
        inquiries_count: property.inquiriesCount,
        allowed_occupants: property.allowedOccupants,
        room_category: property.roomCategory,
        bathroom_photo: property.bathroomPhoto,
        panoramic_photo: property.panoramicPhoto,
        reviews_list: property.reviewsList,
        created_at: new Date().toISOString()
      })
      .select();

    if (error) throw error;
    return property;
  } catch (err) {
    console.warn('Supabase DB error, saved to local fallback engine instead:', err);
    // fallback saving
    const localList = localStorage.getItem('pc_custom_properties');
    const properties: Property[] = localList ? JSON.parse(localList) : [];
    const index = properties.findIndex(p => p.id === property.id);
    if (index >= 0) {
      properties[index] = property;
    } else {
      properties.push(property);
    }
    localStorage.setItem('pc_custom_properties', JSON.stringify(properties));
    return property;
  }
}

/**
 * Retrieve extra custom listings.
 */
export function getSavedCustomProperties(): Property[] {
  try {
    const localList = localStorage.getItem('pc_custom_properties');
    return localList ? JSON.parse(localList) : [];
  } catch (e) {
    return [];
  }
}
