import { useState } from 'react';
import Navigation from './components/Navigation';
import RenterDashboard from './components/RenterDashboard';
import OwnerDashboard from './components/OwnerDashboard';
import PreferencesModal from './components/PreferencesModal';
import AiAssistantTab from './components/AiAssistantTab';
import LoginScreen from './components/LoginScreen';
import { 
  INITIAL_RENTER_PROFILE, 
  INITIAL_PROPERTIES, 
  INITIAL_INQUIRIES, 
  INITIAL_MESSAGES 
} from './mockData';
import { Property, RenterPreferences, Inquiry, ChatMessage, UserProfile } from './types';
import { MessageSquare, ShieldCheck } from 'lucide-react';
import { savePropertyQuery, getSavedCustomProperties } from './lib/supabase';

export default function App() {
  const [profile, setProfile] = useState<UserProfile | null>(INITIAL_RENTER_PROFILE);
  const [activeTab, setActiveTab] = useState<'browse' | 'listings' | 'inbox' | 'assistant' | 'blog'>('browse');
  const [isPrefModalOpen, setIsPrefModalOpen] = useState(false);
  
  // App core database state saved in React Memory or Supabase fallback
  const [properties, setProperties] = useState<Property[]>(() => {
    const custom = getSavedCustomProperties();
    const all = [...custom, ...INITIAL_PROPERTIES];
    // filter duplicates by ID
    return all.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
  });
  const [inquiries, setInquiries] = useState<Inquiry[]>(INITIAL_INQUIRIES);
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);

  // Active chat listing view tab state
  const [activeChatPropertyId, setActiveChatPropertyId] = useState<string | null>(null);

  const handleSavePreferences = (newPrefs: RenterPreferences) => {
    setProfile({
      ...profile,
      preferences: newPrefs,
    });
  };

  const handleRoleChange = (role: 'renter' | 'owner') => {
    setProfile({
      ...profile,
      role: role,
    });
    // Adjust default tabs
    if (role === 'owner') {
      setActiveTab('listings');
    } else {
      setActiveTab('browse');
    }
  };

  // Add a newly posted landlord property
  const handleAddProperty = async (newProp: Property) => {
    try {
      await savePropertyQuery(newProp);
    } catch (e) {
      console.warn("Supabase save warning:", e);
    }
    setProperties(prev => [newProp, ...prev]);
  };

  const handleUpdatePropertyStatus = (id: string, status: 'Active' | 'Inactive' | 'Booked') => {
    setProperties(properties.map(p => p.id === id ? { ...p, status } : p));
  };

  const handleUpdatePropertyPrice = (id: string, price: number) => {
    setProperties(properties.map(p => p.id === id ? { ...p, pricePerMonth: price } : p));
  };

  const handleTogglePropertyFeatured = (id: string) => {
    setProperties(properties.map(p => p.id === id ? { ...p, featured: !p.featured } : p));
  };

  const handleDeleteProperty = (id: string) => {
    setProperties(properties.filter(p => p.id !== id));
  };

  const handleUpdateInquiryStatus = (id: string, status: 'Accepted' | 'Rejected') => {
    setInquiries(inquiries.map(inq => inq.id === id ? { ...inq, status } : inq));
  };

  const handleApplyProperty = (
    propertyId: string, 
    moveInDate?: string, 
    leaseDuration?: string, 
    customPreferences?: RenterPreferences
  ) => {
    const matchedProp = properties.find(p => p.id === propertyId);
    const newInq: Inquiry = {
      id: 'inq_' + Date.now(),
      propertyId,
      renterId: profile.id,
      renterName: profile.name,
      renterAvatar: profile.avatar,
      renterEmail: profile.email,
      renterPhone: profile.phone,
      status: 'Pending',
      matchScore: 92, // Simulates compatibility rating
      trustScore: profile.trustScore,
      applicationDate: new Date().toISOString().split('T')[0],
      moveInDate: moveInDate || '2026-06-01',
      leaseDuration: leaseDuration || '11 Months',
      preferences: customPreferences || profile.preferences,
    };
    setInquiries([newInq, ...inquiries]);
  };

  const handleSendChatMessage = (text: string, receiverId: string, propertyId: string) => {
    const newMsg: ChatMessage = {
      id: 'msg_' + Date.now(),
      senderId: profile.id,
      receiverId,
      propertyId,
      text,
      timestamp: new Date().toISOString(),
      isRead: false,
    };
    setMessages(prev => [...prev, newMsg]);

    // Simulated quick owner response!
    setTimeout(() => {
      const ownerReply: ChatMessage = {
        id: 'msg_reply_' + Date.now(),
        senderId: receiverId,
        receiverId: profile.id,
        propertyId,
        text: `Thanks for messaging! Your inquiry about rent conditions is logged. Feel free to schedule a site visit or ask any other details.`,
        timestamp: new Date().toISOString(),
        isRead: false,
      };
      setMessages(prev => [...prev, ownerReply]);
    }, 1500);
  };

  if (!profile) {
    return (
      <LoginScreen
        onLoginSuccess={(u) => {
          setProfile(u);
          if (u.role === 'owner') {
            setActiveTab('listings');
          } else {
            setActiveTab('browse');
          }
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 font-sans text-gray-900 selection:bg-emerald-500/10 selection:text-emerald-900 antialiased">
      
      {/* Navigation Topbar */}
      <Navigation
        currentProfile={profile}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenPreferences={() => setIsPrefModalOpen(true)}
        onChangeRole={handleRoleChange}
        onLogout={() => setProfile(null)}
      />

      {/* Main Container Views based on tabs */}
      <main className="pb-16 animate-in fade-in duration-300">
        
        {profile.role === 'renter' && activeTab === 'browse' && (
          <RenterDashboard
            properties={properties}
            renterProfile={profile}
            messages={messages}
            onSendMessage={handleSendChatMessage}
            onApplyProperty={handleApplyProperty}
            setActiveTab={setActiveTab}
          />
        )}

        {profile.role === 'owner' && activeTab === 'listings' && (
          <OwnerDashboard
            properties={properties.filter(p => p.ownerId === 'owner_1' || p.ownerId === profile.id)}
            inquiries={inquiries}
            onAddProperty={handleAddProperty}
            onUpdatePropertyStatus={handleUpdatePropertyStatus}
            onUpdateInquiryStatus={handleUpdateInquiryStatus}
            onDeleteProperty={handleDeleteProperty}
            onTogglePropertyFeatured={handleTogglePropertyFeatured}
            onUpdatePropertyPrice={handleUpdatePropertyPrice}
          />
        )}

        {/* Global Messaging / Inquiries Tab Panel */}
        {activeTab === 'inbox' && (
          <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="border-b border-gray-100 pb-4 mb-6">
              <h1 className="font-display text-2xl font-bold tracking-tight text-gray-900">Direct Chat Messages</h1>
              <p className="text-sm text-gray-500">Contact owners directly for Zero brokerage co-living deals without intermediaries.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm h-[480px]">
              
              {/* Chat Thread side contacts select list */}
              <div className="md:col-span-1 border-r border-gray-100 p-4 space-y-4 overflow-y-auto">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Active Room Discussions</span>
                
                <div className="space-y-1">
                  {properties.map((p) => {
                    const lastMsg = [...messages].reverse().find(m => m.propertyId === p.id);
                    return (
                      <button
                        key={p.id}
                        id={`chat-item-${p.id}`}
                        onClick={() => setActiveChatPropertyId(p.id)}
                        className={`w-full text-left rounded-xl p-3 flex items-center gap-2.5 transition ${
                          activeChatPropertyId === p.id 
                            ? 'bg-emerald-50 text-emerald-800' 
                            : 'hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <div className="h-8 w-8 rounded-full bg-emerald-100 uppercase text-xs font-black text-emerald-700 flex items-center justify-center shrink-0">
                          {p.title.charAt(0)}
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-xs font-bold leading-none line-clamp-1">{p.title}</p>
                          <p className="text-[10px] text-gray-400 line-clamp-1 mt-1 leading-none">
                            {lastMsg ? lastMsg.text : 'Start chatting with the landlord...'}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Opened Conversation Column */}
              <div className="md:col-span-2 flex flex-col justify-between">
                {activeChatPropertyId ? (
                  (() => {
                    const activeProp = properties.find(p => p.id === activeChatPropertyId);
                    const chats = messages.filter(m => m.propertyId === activeChatPropertyId);

                    const handleSendBoxChat = (text: string) => {
                      if (!text.trim() || !activeProp) return;
                      handleSendChatMessage(text, activeProp.ownerId, activeProp.id);
                    };

                    return (
                      <>
                        {/* Conversation Header */}
                        <div className="bg-gray-50/50 border-b border-gray-100 p-4 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-emerald-600 uppercase text-xs font-bold text-white flex items-center justify-center">
                              {activeProp?.title.charAt(0)}
                            </div>
                            <div>
                              <span className="text-xs font-bold text-gray-900 block">{activeProp?.title}</span>
                              <span className="text-[10px] text-emerald-600 font-semibold">{activeProp?.ownerName}</span>
                            </div>
                          </div>
                        </div>

                        {/* Conversational Bubbles Log */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                          {chats.map((msg, idx) => {
                            const isMine = msg.senderId === profile.id;
                            return (
                              <div key={idx} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                                <div className={`p-3 rounded-2xl text-xs max-w-[80%] leading-relaxed ${
                                  isMine 
                                    ? 'bg-emerald-600 text-white' 
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {msg.text}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Textfield action row */}
                        <div className="p-3 border-t border-gray-100 bg-gray-50 flex gap-2">
                          <input
                            type="text"
                            id="inbox-chat-input"
                            placeholder="Type direct message to Landlord..."
                            className="flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleSendBoxChat(e.currentTarget.value);
                                e.currentTarget.value = '';
                              }
                            }}
                          />
                        </div>
                      </>
                    );
                  })()
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center p-6 text-gray-400">
                    <MessageSquare className="h-10 w-10 text-gray-300 mb-2" />
                    <p className="text-sm font-semibold">Select a property room chat from left panel to inspect messages</p>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* Global Co-living AI Assistant Tab */}
        {activeTab === 'assistant' && (
          <AiAssistantTab 
            userProfile={profile} 
            onUpdatePreferences={handleSavePreferences} 
          />
        )}

      </main>

      {/* Preferences modal edit overlay */}
      <PreferencesModal
        isOpen={isPrefModalOpen}
        onClose={() => setIsPrefModalOpen(false)}
        profile={profile}
        onSavePreferences={handleSavePreferences}
      />

    </div>
  );
}
