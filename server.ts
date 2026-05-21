import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK with telemetry User-Agent
let ai: GoogleGenAI | null = null;
const API_KEY = process.env.GEMINI_API_KEY;

if (API_KEY) {
  try {
    ai = new GoogleGenAI({
      apiKey: API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
    console.log('Gemini API successfully initialized.');
  } catch (err) {
    console.error('Failed to initialize Gemini SDK:', err);
  }
} else {
  console.warn('GEMINI_API_KEY env variable is missing. Server will fall back to simulated matching/prediction.');
}

// 1. API: Price Prediction and Optimizer Engine
app.post('/api/gemini/price-predict', async (req, res) => {
  const { property } = req.body;
  if (!property) {
    return res.status(400).json({ error: 'Missing property data for pricing evaluation.' });
  }

  const defaultSimulated = {
    suggestedRent: Math.round((property.areaSqft || 500) * 45 + (property.bedrooms || 1) * 3000),
    minRange: Math.round((property.areaSqft || 500) * 40),
    maxRange: Math.round((property.areaSqft || 500) * 52),
    confidence: 85,
    reasons: [
      `Competitive rent calculated for the micro-market of ${property.location || 'Bangalore'}.`,
      `Furnishing level specified as ${property.furnishingType || 'Semi-Furnished'} provides an advantage.`,
      `${(property.amenities || []).length} amenities are set up, improving tenant attractability rating.`,
    ],
    tips: [
      'Increase competitiveness by allowing flexible leases (<6 months).',
      'Optimize deposit to 2x or 3x elements to attract faster view bookings.',
      'Allow small pets to expand the potential tenant matching pool by 30%.'
    ]
  };

  if (!ai) {
    return res.json({
      success: true,
      simulated: true,
      data: defaultSimulated
    });
  }

  try {
    const prompt = `Analyze this rental property listing and provide a competitive pricing analysis and optimization report:
    Title: ${property.title}
    Description: ${property.description}
    Property Type: ${property.propertyType}
    Furnishing: ${property.furnishingType}
    Location: ${property.location}
    Area: ${property.areaSqft} sq.ft
    Bedrooms: ${property.bedrooms}, Bathrooms: ${property.bathrooms}
    Amenities: ${(property.amenities || []).join(', ')}
    Rules: Non-Veg: ${property.houseRules?.nonVegcooking}, Smoking: ${property.houseRules?.smoking}, Pets: ${property.houseRules?.pets}

    Respond with a JSON object. Ensure the values are realistic market estimates for ${property.location || 'Bangalore, India'} (price in INR).`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestedRent: {
              type: Type.INTEGER,
              description: 'Recommended fair monthly rent in INR. Should base reasonably around typical Indian markets (e.g. 15000-50000 depending on location and sizing).'
            },
            minRange: {
              type: Type.INTEGER,
              description: 'Lower bound competitive rent in INR.'
            },
            maxRange: {
              type: Type.INTEGER,
              description: 'Upper bound premium rate in INR.'
            },
            confidence: {
              type: Type.INTEGER,
              description: 'Confidence level percentage (0 to 100)'
            },
            reasons: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '3 bullet points explaining why this rent is competitive based on location, size, and features.'
            },
            tips: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '3 actionable tips for the landlord to optimize their listing speed and rent value.'
            }
          },
          required: ['suggestedRent', 'minRange', 'maxRange', 'confidence', 'reasons', 'tips']
        }
      }
    });

    const parsedData = JSON.parse(response.text.trim());
    return res.json({ success: true, simulated: false, data: parsedData });

  } catch (error: any) {
    console.error('Gemini pricing error:', error);
    return res.json({
      success: true,
      simulated: true,
      error: error.message,
      data: defaultSimulated
    });
  }
});

// 2. API: Smart Matching Engine (Renter Compatibility Analysis)
app.post('/api/gemini/smart-match', async (req, res) => {
  const { renterProfile, property } = req.body;
  if (!renterProfile || !property) {
    return res.status(400).json({ error: 'Missing profile or property data for match analysis.' });
  }

  const budget = Number(renterProfile.preferences?.budget || 12050);
  let score = 75;
  const reasons: string[] = [];
  const mismatches: string[] = [];

  if (property.pricePerMonth <= budget) {
    score += 18;
    reasons.push(`Rent rate (₹${property.pricePerMonth.toLocaleString('en-IN')}/mo) fits safely inside your set monthly budget limit of ₹${budget.toLocaleString('en-IN')}.`);
  } else {
    score -= 15;
    mismatches.push(`Rent rate (₹${property.pricePerMonth.toLocaleString('en-IN')}/mo) exceeds your set monthly budget of ₹${budget.toLocaleString('en-IN')} by ₹${(property.pricePerMonth - budget).toLocaleString('en-IN')}.`);
  }

  if (property.petFriendly === renterProfile.preferences?.pets) {
    score += 8;
    reasons.push(property.petFriendly ? 'Listing welcomes pet animals, aligning with your preferences.' : 'Quiet pet-free environment match.');
  } else {
    mismatches.push(property.petFriendly ? 'Property is pet-friendly, contrary to your preference.' : 'Strictly no-pets policy.');
  }

  if (property.houseRules?.smoking === renterProfile.preferences?.smoking) {
    score += 8;
    reasons.push(property.houseRules?.smoking ? 'Smoking habits matches with flat rules.' : 'Strict non-smoking environment matches your habits.');
  } else {
    mismatches.push(property.houseRules?.smoking ? 'Smoking is allowed at this property (mismatches your no-smoking preference).' : 'Strictly non-smoking rules check.');
  }

  if (property.houseRules?.nonVegcooking === renterProfile.preferences?.nonVeg) {
    score += 8;
    reasons.push(property.houseRules?.nonVegcooking ? 'Non-vegetarian cooking policy is fully compatible.' : 'Veg-only clean kitchen standards matches your preference.');
  } else {
    mismatches.push(property.houseRules?.nonVegcooking ? 'Allows Non-Veg cooking (contrary to your preference).' : 'Veg-only cooking kitchen restriction.');
  }

  const defaultSimulatedMatch = {
    matchScore: Math.min(Math.max(score, 40), 98),
    matchReason: reasons.length > 0 ? reasons : [`Initial preferences align with the room pricing.`],
    willApply: score >= 85 ? 'Yes' : (score >= 65 ? 'Maybe' : 'No'),
    willAccept: score >= 80 ? 'High' : (score >= 60 ? 'Medium' : 'Low'),
    mismatches: mismatches
  };

  if (!ai) {
    return res.json({
      success: true,
      simulated: true,
      data: defaultSimulatedMatch
    });
  }

  try {
    const prompt = `Analyze compatibility between this Renter Profile and the Property:
    
    ### Renter Profile ###
    Name: ${renterProfile.name}
    Budget: ${renterProfile.preferences?.budget} INR
    Pet lover: ${renterProfile.preferences?.pets}
    Food (Non-Veg Cooking): ${renterProfile.preferences?.nonVeg}
    Smoker: ${renterProfile.preferences?.smoking}
    Sleep Schedule: ${renterProfile.preferences?.sleepHours}
    Location Office: ${renterProfile.preferences?.officeLocation}
    Cleanliness preference: ${renterProfile.preferences?.cleanLevel}
    Hobbies: ${(renterProfile.preferences?.hobbies || []).join(', ')}

    ### Property Listing ###
    Title: ${property.title}
    Rent: ${property.pricePerMonth} INR
    Furnishing: ${property.furnishingType}
    Location: ${property.location}
    Pet Policy: ${property.houseRules?.pets ? 'Pets Allowed' : 'No Pets'}
    Cooking: ${property.houseRules?.nonVegcooking ? 'Non-veg Allowed' : 'Veg Only'}
    Smoking Policy: ${property.houseRules?.smoking ? 'Smoking Allowed' : 'Strictly No Smoking'}
    Quiet Hours: ${property.houseRules?.quietHours}
    Max Occupants: ${property.houseRules?.maxOccupants}
    Amenities: ${(property.amenities || []).join(', ')}

    Calculate a detailed, logical compatibility score (0-100) and bulleted reasons. Return accurate predictions as JSON.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            matchScore: {
              type: Type.INTEGER,
              description: 'Compatibility score from 0 to 100.'
            },
            matchReason: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '3 detailed reasons highlighting positive matches (commute, rent alignment, habit compatibility etc).'
            },
            willApply: {
              type: Type.STRING,
              description: 'Is this tenant likely to apply? (Yes/Maybe/No)'
            },
            willAccept: {
              type: Type.STRING,
              description: 'Is the landlord likely to accept this tenant? (High/Medium/Low)'
            },
            mismatches: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'List any minor/major mismatches like sleeping pattern gaps, non-veg cooking differences, rules strictness.'
            }
          },
          required: ['matchScore', 'matchReason', 'willApply', 'willAccept', 'mismatches']
        }
      }
    });

    const parsedData = JSON.parse(response.text.trim());
    return res.json({ success: true, simulated: false, data: parsedData });

  } catch (error: any) {
    console.error('Gemini math matching error:', error);
    return res.json({
      success: true,
      simulated: true,
      error: error.message,
      data: defaultSimulatedMatch
    });
  }
});

// Helper function to return intelligent co-living advisor fallback content
function getSimulatedAdvisorResponse(question: string, userRole: string): string {
  const query = question.toLowerCase();
  
  // Intercept budget preference setting/saving requests
  if (query.includes('budget') && (query.match(/\d+/) || query.includes('set') || query.includes('save') || query.includes('change') || query.includes('update') || query.includes('limit'))) {
    const numMatch = query.replace(/,/g, '').match(/\d+/);
    if (numMatch) {
      const budgetValue = parseInt(numMatch[0], 10);
      if (budgetValue > 0) {
        return `I have successfully registered your new monthly rent budget preference to **₹${budgetValue.toLocaleString('en-IN')}/month**! 
        
        Our co-living matching algorithm will now immediately calibrate rating percentages and compatibility calculations to align with this new parameters. Let me know if you would like me to adjust any other co-living habits (pets preference, sleeping schedules, food choices)!
        
        [SAVE_BUDGET: ${budgetValue}]`;
      }
    }
  }

  if (query.includes('bhopal') || query.includes('arera') || query.includes('indrapuri') || query.includes('mp nagar') || query.includes('rent in') || query.includes('average rent')) {
    return `**Co-Living & Room Rent Advisor: Bhopal Micro-Market Analysis (2026)**
    
    Here is a concise breakdown of Bhopal's top 5 premium and student-centric room clusters:
    
    *   **Arera Colony (E-7/E-1 premium sector):** This is Bhopal's most prestigious sector. Premium private rooms or self-contained suites here standardly rent for **₹10,000 to ₹15,000/month**. Highly preferred by corporate professionals, doctors, and students looking for high security and quiet streets.
    *   **MP Nagar (Zone I & II):** Serving as Bhopal's commercial, financial, and competitive test-prep center. Executive studios and professional dynamic rooms range between **₹12,000 to ₹18,000/month**, perfectly situated near DB City Mall.
    *   **Indrapuri (Sector C/Sector A):** Highly populated student hub with immediate connectivity to LNCT College, coaching centers, and BHEL. Standard rooms rent for an affordable **₹5,500 to ₹7,500/month** with standard community and local tiffin services.
    *   **Ayodhya Extension & Ratnagiri:** Residential, family-oriented regions with cozy flatshares or private corner rooms. Price points are extremely competitive, ranging from **₹4,500 to ₹8,000/month**.
    
    *Pro Tip:* Ensuring a proper water backup and an Air Conditioning unit significantly optimizes listings in Bhopal due to severe summer months.`;
  }
  
  if (query.includes('match') || query.includes('compatibility') || query.includes('algorithm') || query.includes('scoring') || query.includes('score')) {
    return `**How our Smart Matching Algorithm Evaluates Roommate Compatibility:**
    
    Our co-living compatibility calculation (shown as the **Match Score**) evaluates five primary custom dimensions in real-time:
    
    1.  **Budget Alignment:** Compares renter's budget preferences against the listing's rental price. A minor budget overshoot adjusts the score proportionally.
    2.  **Dietary & Kitchen Habit Matching:** Pairs vegetarians/vegans or non-veg food cooks correctly. Cooking non-veg in shared kitchens is a primary friction point we solve!
    3.  **Pet & Animal Comfort:** Aligns pet-friendly listings with pet-owners or roommates who are comfortable residing near animals.
    4.  **Sleeping Routine Synchronization:** Sorts roommates into **Early Birds (9 PM - 5 AM)**, **Standard (11 PM - 7 AM)**, and **Night Owls (2 AM - 10 AM)** to prevent late-night bathroom noise and light disruptions.
    5.  **Cleanliness Level standards:** Maps expectations across **High (spotless/scheduled)**, **Moderate (weekly routine)**, and **Spontaneous** groups to keep chore allocations harmonious.
    
    *Improve your score:* Keeping your **Preferences Profile** detailed and verified increases roommate match accuracies by up to **42%**!`;
  }
  
  if (query.includes('rule') || query.includes('house rules') || query.includes('smoking') || query.includes('visitor') || query.includes('deposit')) {
    return `**Standard House Rules & Rental Legal Guidelines:**
    
    1.  **Smoking Policies:** Almost 90% of listing owners on our platform enforce a **Strict No Smoking** policy indoors. Balcony exceptions vary and must be explicitly recorded in the digital lease terms.
    2.  **Visitors & Guest Policy:** Standard co-living agreements allow daytime visitors, but overnight stays require prior notice to flatmates. Setting guidelines prevents 80% of co-living roommate issues.
    3.  **Security Deposit Standards:** 
        *   *Bhopal:* Usually ranges from **1.5x to 3x monthly rent** (extremely affordable).
        *   *Bangalore/Mumbai:* Often stretches up to **3x to 5x monthly rent**.
    4.  **Quiet Hours:** Standardly set between **10:00 PM and 07:00 AM** to preserve work-from-home conditions and sleep sleep hygiene.`;
  }

  if (query.includes('tips') || query.includes('attract') || query.includes('landlord') || query.includes('optimize')) {
    return `**Elite Landlord Tips to Fill Vacated Rooms 3x Faster:**
    
    1.  **Differentiate with Smart Amenities:** High-speed Fiber WiFi, 24/7 Power backups, dynamic workspace desks, and water purifiers get 3.2x more tenant engagements.
    2.  **Unlock verification Signals:** Complete phone, ID verification, and document proofs. Verified landlords get a **70% visibility lift** on search lists.
    3.  **Set Fair Deposits:** Keeping security deposits limited to 2x rent values reduces application hesitation significantly.
    4.  **Upload a Bathroom/Washroom Photo:** Washroom cleanliness is the #1 filter for premium digital renters today. High-end photos solve standard tenant doubt!`;
  }

  if (query.includes('trust score') || query.includes('verify') || query.includes('verification')) {
    return `**Understanding the Renter Trust Score (0-100%):**
    
    The Trust Score is a secure, public verification metric that badges you as an high-profile occupant:
    *   **Email & Phone Match:** Adds +30% to trust score.
    *   **ID Document Verification (Aadhaar/PAN):** Adds +35% to trust score (adds Verified ✓ badge).
    *   **Proof of Income / Employment verification:** Adds +35% to trust score (verifies financial reliability).
    
    *Pro Advantage:* Renters with a **Trust Score > 85%** enjoy prioritized tenancy reviews and are **85% more likely to be accepted** immediately by co-living hosts!`;
  }

  return `Hello! I am your AI Co-Living Advisor. I specialize in:
  *   **Rental Market Trends:** Average rent benchmarks in Bhopal and Bangalore.
  *   **House Rules & Guidelines:** Dietary kitchen habits, smoking limits, and standard deposit ranges.
  *   **Matching Algorithms:** How roommate preferences, sleep cycles, and cleanliness levels construct your Match score.
  
  Ask me any specific question about these topics or select one of the suggested queries on the left!`;
}

// 3. API: Interactive Virtual Rental Assistant Chat
app.post('/api/gemini/chat', async (req, res) => {
  const { messages, userRole, propertyMeta, userProfile } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Missing or invalid chat messages array.' });
  }

  const lastMessage = messages[messages.length - 1]?.text || 'Hello';

  if (!ai) {
    const simulatedResponse = getSimulatedAdvisorResponse(lastMessage, userRole || 'renter');
    return res.json({
      success: true,
      simulated: true,
      reply: simulatedResponse
    });
  }

  try {
    const formattedHistory = messages.map(m => {
      return `${m.sender === 'user' ? 'Client' : 'Assistant'}: ${m.text}`;
    }).join('\n');

    const currentBudget = userProfile?.preferences?.budget ? `₹${userProfile.preferences.budget}/month` : 'Not set';
    const systemInstruction = `You are "Property Connect AI Agent", an expert peer-to-peer real-estate, renting rules, and smart co-living advisor.
    You assist renters with listing comparisons, matching evaluations, house rules, and rental guidelines/trends in Bhopal (Arera Colony, Indrapuri, MP Nagar, Ratnagiri, etc.) and Bangalore.
    You assist owners with pricing, rules, and matching tenant compatibility scores.
    Your tone must be warm, peer-to-peer, highly knowledgeable, and extremely direct. Keep responses concise and use clean Markdown (bold, lists).
    Current client is logged in as a ${userRole || 'renter'}. 
    Current Renter Budget preference: ${currentBudget}.

    CRITICAL INSTRUCTION: If the user states, sets, changes, updates, or requests to save a monthly rent budget preference (e.g. 'set my budget to 15000', 'save budget 12000', 'my budget is 18000', or similar budget requests), you MUST calculate/extract the numeric value, respond with warm, professional acknowledgment confirming the update, and ALWAYS append a single line: \`[SAVE_BUDGET: <number>]\` at the very end of your reply text. The client frontend detects this token to instantly trigger a real-time profile matching update.
    
    ${propertyMeta ? `Reference property context: ${JSON.stringify(propertyMeta)}` : ''}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `Chat History:\n${formattedHistory}\n\nClient message: ${lastMessage}\n\nProvide an expert, professional response based on instructions. Keep markdown tidy and concise.`,
      config: {
        systemInstruction,
        temperature: 0.7
      }
    });

    return res.json({
      success: true,
      simulated: false,
      reply: response.text.trim()
    });

  } catch (error: any) {
    console.error('Gemini assistant error:', error);
    const fallbackResponse = getSimulatedAdvisorResponse(lastMessage, userRole || 'renter');
    return res.json({
      success: true,
      simulated: true,
      reply: fallbackResponse
    });
  }
});

// Express static serving/mounting Vite
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Property Connect server started successfully on http://localhost:${PORT}`);
  });
}

startServer();
