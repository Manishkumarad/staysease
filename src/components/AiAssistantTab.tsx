import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, RenterPreferences } from '../types';
import { Sparkles, Send, Bot, HelpCircle, MessageSquare, CheckCircle, X, DollarSign } from 'lucide-react';

interface AiAssistantProps {
  userProfile: UserProfile;
  onUpdatePreferences?: (newPrefs: RenterPreferences) => void;
}

interface Message {
  sender: 'user' | 'bot';
  text: string;
}

const SUGGESTED_QUESTIONS = [
  'Set my budget preference to 12,000 INR',
  'What is the average rent in Bhopal (Arera Colony & Indrapuri)?',
  'How does the roommate matching algorithm evaluate compatibility?',
  'What does my renter Trust Score measure and how do I increase it?',
  'What are standard house rules for kitchen dishes and smoking?'
];

export default function AiAssistantTab({ userProfile, onUpdatePreferences }: AiAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'bot',
      text: `Hi ${userProfile.name}! 👋 I am the **Property Connect AI Agent**, your co-living expert. How can I help you today?\n\nYou can ask me about regional rent standards, optimizing co-living matches, room checklist drafts, or setting your room budget.\n\n*Direct Feature:* Try typing **"set my budget to 15,000"** or **"change budget to 12000"** to automatically save your rent limit directly in your roommate profile!`
    }
  ]);
  const [inpValue, setInpValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [savedBudgetNotification, setSavedBudgetNotification] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto scroll messages
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMsg: Message = { sender: 'user', text: textToSend.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInpValue('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          userRole: userProfile.role,
          userProfile: userProfile
        })
      });

      const resData = await response.json();
      if (resData.success) {
        let replyText = resData.reply;

        // Parse and extract SAVE_BUDGET
        const saveBudgetMatch = replyText.match(/\[SAVE_BUDGET:\s*(\d+)\]/);
        if (saveBudgetMatch) {
          const newBudget = parseInt(saveBudgetMatch[1], 10);
          if (!isNaN(newBudget) && onUpdatePreferences) {
            onUpdatePreferences({
              ...userProfile.preferences,
              budget: newBudget
            });
            setSavedBudgetNotification(newBudget);
          }
          replyText = replyText.replace(/\[SAVE_BUDGET:\s*\d+\]/g, '').trim();
        }

        setMessages(prev => [...prev, { sender: 'bot', text: replyText }]);
      } else {
        throw new Error(resData.error || 'Generative failure');
      }
    } catch (err) {
      console.warn('Gemini chat request failed, generating helpful response locally:', err);
      // Helpful fallback content
      let responseText = "I ran into a server communication glitch, but I'm happy to help. For Indiranagar or Bhopal, average room rents are approximately 7,500 to 18,000 INR depending on furnishing. Let me know if you want me to try resolving!";
      
      const query = textToSend.toLowerCase();
      if (query.includes('budget') && (query.match(/\d+/) || query.includes('set') || query.includes('save') || query.includes('change') || query.includes('update') || query.includes('limit'))) {
        const numMatch = query.replace(/,/g, '').match(/\d+/);
        if (numMatch) {
          const budgetValue = parseInt(numMatch[0], 10);
          if (budgetValue > 0) {
            responseText = `I have successfully registered your new monthly rent budget preference to **₹${budgetValue.toLocaleString('en-IN')}/month**! 
            
            Our co-living matching algorithm will now immediately calibrate rating percentages and compatibility calculations to align with this new parameters. Let me know if you would like me to adjust any other co-living habits (pets preference, sleeping schedules, food choices)!
            
            [SAVE_BUDGET: ${budgetValue}]`;
          }
        }
      } else if (textToSend.toLowerCase().includes('match')) {
        responseText = "Matching checks five criteria: budget flexibility, pet compatibility, smoking choices, cleanliness standards, and commute distance. Setting accurate values on your Preferences improves scores!";
      } else if (textToSend.toLowerCase().includes('trust score')) {
        responseText = "The trust score measures verification parameters: Identity ID ✓, phone ✓, email ✓, and proof of income ✓. Higher scores gain premium search priority.";
      }

      // Parse and extract budget from local fallback response
      let finalResponseText = responseText;
      const saveBudgetMatch = responseText.match(/\[SAVE_BUDGET:\s*(\d+)\]/);
      if (saveBudgetMatch) {
        const newBudget = parseInt(saveBudgetMatch[1], 10);
        if (!isNaN(newBudget) && onUpdatePreferences) {
          onUpdatePreferences({
            ...userProfile.preferences,
            budget: newBudget
          });
          setSavedBudgetNotification(newBudget);
        }
        finalResponseText = responseText.replace(/\[SAVE_BUDGET:\s*\d+\]/g, '').trim();
      }

      setMessages(prev => [...prev, {
        sender: 'bot',
        text: finalResponseText
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      
      {/* Title block */}
      <div className="border-b border-gray-100 pb-5 mb-6">
        <h1 className="font-display text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-purple-600 animate-pulse" />
          <span>Co-Living AI Assistant</span>
        </h1>
        <p className="text-sm text-gray-500">Discuss co-living, flatshares, neighborhood pricing, trust policies, or drafting property reports.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Suggestion Sidebar */}
        <div className="space-y-4 lg:col-span-1">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-1.5">
              <HelpCircle className="h-4 w-4 text-purple-600" />
              <span>Suggested Queries</span>
            </h4>
            <div className="flex flex-col gap-2">
              {SUGGESTED_QUESTIONS.map((q, idx) => (
                <button
                  key={idx}
                  id={`suggested-q-${idx}`}
                  onClick={() => handleSendMessage(q)}
                  className="text-left text-xs rounded-xl border border-gray-200 p-2.5 transition bg-gray-50/55 hover:bg-purple-50/30 hover:border-purple-200 text-gray-700 font-medium leading-normal"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-purple-200 bg-purple-50/10 p-4 space-y-2">
            <span className="text-[10px] font-bold text-purple-600 uppercase tracking-widest">Co-Living intelligence</span>
            <p className="text-[11px] text-gray-600 leading-normal">
              Our assistant leverages Gemini LLM parameters to extract market trends, safety advice, and drafting aids.
            </p>
          </div>
        </div>

        {/* Chat Thread (Right 2 spans) */}
        <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm flex flex-col h-[520px]">
          
          {/* Active status */}
          <div className="bg-purple-50/40 p-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-600 text-white shadow-sm shadow-purple-100">
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-gray-900 block">AI Consultant Bot</span>
                <span className="text-[10px] font-bold text-purple-600 animate-pulse">Online & Ready</span>
              </div>
            </div>
            
            {/* Show user's current budget indicator */}
            <div className="text-[10px] font-extrabold bg-white border border-purple-200 px-2.5 py-1.5 rounded-xl text-purple-950 flex items-center gap-1 font-sans shadow-sm">
              <DollarSign className="h-3 w-3 text-purple-600" />
              <span>Budget: <strong className="font-extrabold text-purple-950">₹{userProfile.preferences.budget.toLocaleString('en-IN')}/mo</strong></span>
            </div>
          </div>

          {/* Budget Success Saved Alert Toast Banner */}
          {savedBudgetNotification && (
            <div id="ai-saved-budget-alert" className="mx-4 mt-3 p-3 bg-emerald-50 border border-emerald-250 rounded-xl text-emerald-850 text-xs flex items-center justify-between font-sans shadow-sm animate-in slide-in-from-top-3 duration-200">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-500 text-white shrink-0">
                  <CheckCircle className="h-3.5 w-3.5" />
                </div>
                <div>
                  <span className="block font-black text-emerald-950">Rent Budget Updated Live!</span>
                  <span className="text-[10px] font-medium text-emerald-700">Standard preference updated to <strong className="font-extrabold text-emerald-950">₹{savedBudgetNotification.toLocaleString('en-IN')}/mo</strong>. Room compatibility scores and alternative suggestions have refreshed live.</span>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setSavedBudgetNotification(null)}
                className="text-emerald-400 hover:text-emerald-950 border border-emerald-150 rounded-lg p-1 hover:bg-emerald-100/40 cursor-pointer text-xs shrink-0 inline-flex items-center justify-center"
                title="Dismiss Alert"
              >
                <X className="h-3.5 w-3.5 font-bold" />
              </button>
            </div>
          )}

          {/* Chat scrolling log */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((m, index) => {
              const isMine = m.sender === 'user';
              
              // High-fidelity local markdown formatter
              const formatMessageText = (text: string) => {
                return text.split('\n').map((line, lineIdx) => {
                  const trimmed = line.trim();
                  
                  // Check list item formats
                  const isListItem = trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('1. ') || trimmed.startsWith('2. ') || trimmed.startsWith('3. ') || trimmed.startsWith('4. ');
                  
                  // Remove list prefix for nice custom rendering
                  let listPrefix = '';
                  let cleanedLine = line;
                  if (trimmed.startsWith('- ')) {
                    listPrefix = '• ';
                    cleanedLine = trimmed.substring(2);
                  } else if (trimmed.startsWith('* ')) {
                    listPrefix = '• ';
                    cleanedLine = trimmed.substring(2);
                  } else if (/^\d+\.\s/.test(trimmed)) {
                    const match = trimmed.match(/^(\d+\.)\s/);
                    if (match) {
                      listPrefix = match[1] + ' ';
                      cleanedLine = trimmed.substring(match[0].length);
                    }
                  }
                  
                  // Parse bold text **word**
                  const parts = cleanedLine.split('**');
                  const renderedLine = parts.map((part, partIdx) => {
                    if (partIdx % 2 === 1) {
                      return <strong key={partIdx} className={`font-extrabold ${isMine ? 'text-white' : 'text-purple-950 font-bold'}`}>{part}</strong>;
                    }
                    return part;
                  });

                  if (isListItem) {
                    return (
                      <div key={lineIdx} className="ml-4 pl-1 my-1 flex items-start gap-1 leading-relaxed">
                        <span className={`font-bold shrink-0 ${isMine ? 'text-purple-200' : 'text-purple-600'}`}>{listPrefix}</span>
                        <span>{renderedLine}</span>
                      </div>
                    );
                  }

                  return (
                    <p key={lineIdx} className={trimmed === '' ? 'h-2' : 'my-1 leading-relaxed'}>
                      {renderedLine}
                    </p>
                  );
                });
              };

              return (
                <div key={index} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`p-4 rounded-2xl text-xs max-w-[85%] leading-relaxed shadow-sm transition-all duration-150 ${
                    isMine 
                      ? 'bg-purple-650 text-white rounded-tr-none' 
                      : 'bg-purple-50/50 border border-purple-100 text-purple-950 rounded-tl-none'
                  }`}>
                    {formatMessageText(m.text)}
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 p-3.5 rounded-2xl flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-purple-600 animate-bounce" />
                  <div className="h-2 w-2 rounded-full bg-purple-600 animate-bounce duration-100" />
                  <div className="h-2 w-2 rounded-full bg-purple-600 animate-bounce duration-200" />
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>

          {/* Send Input Bar */}
          <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(inpValue); }} className="p-3 border-t border-gray-100 bg-gray-50 flex gap-2">
            <input
              type="text"
              placeholder="Ask anything about rental matching, rules, locations..."
              value={inpValue}
              onChange={(e) => setInpValue(e.target.value)}
              className="flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
            <button
              type="submit"
              id="btn-assistant-send"
              className="rounded-xl bg-purple-600 hover:bg-purple-700 px-4 py-2 text-xs font-bold text-white shadow-sm flex items-center justify-center"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>

        </div>

      </div>

    </div>
  );
}
