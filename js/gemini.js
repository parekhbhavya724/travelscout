/**
 * TravelScout Gemini API Service
 * Handles country-specific travel suggestions and AI chatbot queries using Google Gemini API.
 */

const STORAGE_GEMINI_KEY = 'travelscout_gemini_key';

class GeminiService {
    constructor() {
        this.keyModal = null;
    }

    getApiKey() {
        return localStorage.getItem(STORAGE_GEMINI_KEY) || '';
    }

    setApiKey(key) {
        localStorage.setItem(STORAGE_GEMINI_KEY, key.trim());
    }

    openApiKeyModal(callback) {
        let existing = document.getElementById('ts-gemini-modal');
        if (existing) existing.remove();

        const currentKey = this.getApiKey();
        const modal = document.createElement('div');
        modal.id = 'ts-gemini-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(17, 24, 39, 0.7);
            backdrop-filter: blur(4px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 99999;
            padding: 20px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        `;

        modal.innerHTML = `
            <div style="background: #ffffff; width: 100%; max-width: 480px; border-radius: 18px; padding: 28px; box-shadow: 0 20px 40px rgba(0,0,0,0.25); animation: tsFadeIn 0.25s ease;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                    <h3 style="margin: 0; font-size: 20px; font-weight: 700; color: #111827;">Google Gemini API Key</h3>
                    <button id="ts-modal-close" style="background: none; border: none; font-size: 20px; cursor: pointer; color: #9ca3af;">✕</button>
                </div>

                <p style="font-size: 14px; color: #4b5563; line-height: 1.5; margin-bottom: 20px;">
                    To enable real-time generative suggestions and live AI chat via Google Gemini, paste your API key below. 
                    <br><small style="color: #6b7280;">(If left empty, TravelScout will use its built-in Intelligent Fallback Generator).</small>
                </p>

                <div style="margin-bottom: 20px;">
                    <label style="display: block; font-weight: 600; font-size: 13px; color: #374151; margin-bottom: 6px;">Gemini API Key</label>
                    <input type="password" id="ts-api-key-input" value="${currentKey}" placeholder="AIzaSy..." style="width: 100%; padding: 12px 14px; border: 1.5px solid #d1d5db; border-radius: 10px; font-size: 14px; outline: none; transition: 0.2s;" onfocus="this.style.borderColor='#1677ff'">
                </div>

                <div style="display: flex; gap: 10px; justify-content: flex-end;">
                    <button id="ts-api-key-clear" style="padding: 10px 16px; border: 1px solid #d1d5db; background: #f3f4f6; color: #374151; border-radius: 9px; font-weight: 600; cursor: pointer;">Clear Key</button>
                    <button id="ts-api-key-save" style="padding: 10px 22px; border: none; background: #1677ff; color: white; border-radius: 9px; font-weight: 600; cursor: pointer;">Save & Connect</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        document.getElementById('ts-modal-close').onclick = () => modal.remove();
        document.getElementById('ts-api-key-clear').onclick = () => {
            this.setApiKey('');
            modal.remove();
            if (callback) callback('');
        };
        document.getElementById('ts-api-key-save').onclick = () => {
            const val = document.getElementById('ts-api-key-input').value;
            this.setApiKey(val);
            modal.remove();
            if (callback) callback(val);
        };
    }

    /**
     * Generate Personalized Suggestions ONLY for the target country based on user profile.
     */
    async getCountrySuggestions(targetCountry, userProfile) {
        const apiKey = this.getApiKey();

        const profileText = userProfile ? `
User Name: ${userProfile.name || 'Traveler'}
Age: ${userProfile.age || '25'} years old
Gender: ${userProfile.gender || 'Not specified'}
Nationality: ${userProfile.nationality || 'Global citizen'}
Favorite Country to Visit: ${userProfile.favCountry || 'Various'}
Group Travel Preference: ${userProfile.groupTravel || 'Open'}
` : 'Standard traveler profile';

        const prompt = `
You are TravelScout AI, an elite travel advisor.
Target Country to Visit: ${targetCountry.toUpperCase()}

User Profile:
${profileText}

IMPORTANT CRITICAL INSTRUCTION:
You MUST provide recommendations and suggestions ONLY for ${targetCountry.toUpperCase()}. Do NOT suggest other countries.
Tailor all suggestions specifically to the user's age (${userProfile?.age || '25'}), nationality (${userProfile?.nationality || 'Global'}), and travel preference (${userProfile?.groupTravel || 'Group/Solo'}).

Please format your response into 5 distinct, well-structured sections without using icons/emojis:
1. Must-Visit Secret Spots & Hidden Gems in ${targetCountry}
2. Recommended Activities (Tailored for ${userProfile?.groupTravel || 'your travel style'})
3. Local Culinary Highlights & Food Spots in ${targetCountry}
4. Cultural & Practical Travel Tips for ${userProfile?.nationality || 'International'} Travelers
5. Age-Tailored (${userProfile?.age || '25'} yrs) Packing & Safety Advice

Be concise, vivid, encouraging, and directly useful. Do not include icons or emojis in the response.
`;

        if (!apiKey) {
            console.log('Gemini API key not found. Using Intelligent Travel Engine.');
            await new Promise(r => setTimeout(r, 900)); // Simulate AI processing delay
            return this.generateFallbackSuggestions(targetCountry, userProfile);
        }

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: prompt }]
                    }]
                })
            });

            if (!response.ok) {
                const errData = await response.json();
                console.warn('Gemini API request failed:', errData);
                return this.generateFallbackSuggestions(targetCountry, userProfile, true);
            }

            const data = await response.json();
            const textOutput = data.candidates?.[0]?.content?.parts?.[0]?.text;
            
            if (textOutput) {
                return { success: true, isLiveGemini: true, content: textOutput };
            } else {
                return this.generateFallbackSuggestions(targetCountry, userProfile);
            }
        } catch (err) {
            console.error('Gemini API Error:', err);
            return this.generateFallbackSuggestions(targetCountry, userProfile, true);
        }
    }

    /**
     * Smart Chatbot Query Handler
     */
    async askChatbot(messagesHistory, userMessage, userProfile) {
        const apiKey = this.getApiKey();

        if (!apiKey) {
            await new Promise(r => setTimeout(r, 600));
            return this.generateFallbackChatResponse(userMessage, userProfile);
        }

        try {
            const systemContext = `You are TravelScout AI Assistant. Helpful, friendly, concise, expert on global destinations. User is ${userProfile?.name || 'a traveler'}, ${userProfile?.age || '25'}yo, ${userProfile?.nationality || 'international'} citizen, prefers ${userProfile?.groupTravel || 'group traveling'}. Do not use emojis or icons.`;
            
            const contents = [
                { role: 'user', parts: [{ text: systemContext }] },
                { role: 'model', parts: [{ text: `Hello ${userProfile?.name || 'traveler'}! I am TravelScout AI. How can I help you plan your next trip today?` }] }
            ];

            messagesHistory.forEach(msg => {
                contents.push({
                    role: msg.sender === 'user' ? 'user' : 'model',
                    parts: [{ text: msg.text }]
                });
            });

            contents.push({
                role: 'user',
                parts: [{ text: userMessage }]
            });

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents })
            });

            if (response.ok) {
                const data = await response.json();
                const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
                if (text) return { success: true, text: text };
            }
        } catch (e) {
            console.error('Gemini Chatbot Error:', e);
        }

        return { success: true, text: this.generateFallbackChatResponse(userMessage, userProfile) };
    }

    /**
     * Intelligent Fallback Engine for Country Suggestions
     */
    generateFallbackSuggestions(country, profile, isErrorFallback = false) {
        const cName = country.charAt(0).toUpperCase() + country.slice(1).toLowerCase();
        const age = profile?.age || 25;
        const name = profile?.name || 'Traveler';
        const groupPref = profile?.groupTravel || 'Group Travel';
        const isGroup = groupPref.toLowerCase().includes('yes') || groupPref.toLowerCase().includes('group');
        const nat = profile?.nationality || 'global';

        const content = `
### Personalized Travel Scout Recommendations for **${cName}**
*Tailored specifically for ${name} (${age} yrs, ${nat} citizen, ${isGroup ? 'Group Travel Enthusiast' : 'Solo Traveler'})*

${isErrorFallback ? '> *Note: Configured Gemini API Key reached limit or was invalid, so TravelScout Smart AI Engine generated these custom suggestions for you.*' : ''}

---

#### 1. Must-Visit Secret Spots & Hidden Gems in ${cName}
- **The Mystic Highlands & Coastal Vistas**: Beyond standard tourist traps, explore the lesser-known scenic trails and serene countryside villages of ${cName}.
- **Historic Old Quarter & Alleyways**: Wandering through historic districts reveals hidden cafes, artisan workshops, and secret courtyards.
- **Panoramic Sunsets**: Visit local rooftop viewpoints or cliffside lookouts away from crowded tour buses.

#### 2. Recommended Activities (${isGroup ? 'Group Traveling Focus' : 'Solo Traveler Focus'})
${isGroup ? `
- **Join Local Small-Group Eco Tours**: Great way to meet fellow international wanderers while discovering national parks in ${cName}.
- **Interactive Cooking Masterclass**: Team up with local chefs to make authentic regional dishes together with other food lovers.
- **Group Sunset Sail & Beach Socials**: Perfect for sharing stories, photos, and travel tips with fellow explorers.
` : `
- **Self-Guided Cultural Walking Tours**: Explore at your own pace with curated map routes through ${cName}'s top heritage landmarks.
- **Cozy Hostel/Boutique Stays**: Connect with like-minded travelers while enjoying private room comfort.
- **Photography & Cafe Hopping**: Spend relaxed afternoons capturing local street life and hidden neighborhood gems.
`}

#### 3. Local Culinary Highlights & Food Spots in ${cName}
- **Authentic Street Markets**: Taste fresh, locally sourced street specialties and traditional street snacks popular among locals.
- **Heritage Dining Rooms**: Try signature traditional national dishes that ${cName} is world-famous for.
- **Artisanal Coffee & Tea Houses**: Relax at neighborhood cafes specializing in traditional brews and pastries.

#### 4. Cultural & Practical Tips for ${nat} Travelers
- **Currency & Local Payments**: Keep a mix of contactless digital payment methods and small local currency notes.
- **Local Etiquette**: A warm greeting in the local language goes a very long way in ${cName}. Respect local customs at sacred and historical sites.
- **SIM & Connectivity**: Grab a local eSIM or airport data card upon arrival to easily navigate public transport apps.

#### 5. Age-Tailored (${age} yrs) Packing & Safety Advice
- **Versatile Footwear**: Comfortable, broken-in walking shoes are essential for exploring cobble streets or nature trails.
- **Weather Preparedness**: Pack lightweight layers and a compact wind/rain jacket suitable for ${cName}'s current seasonal climate.
- **Digital Backups**: Keep copies of your passport, travel insurance, and hotel reservations stored offline on your phone.
`;

        return {
            success: true,
            isLiveGemini: false,
            content: content
        };
    }

    /**
     * Fallback Chatbot Logic
     */
    generateFallbackChatResponse(query, profile) {
        const q = query.toLowerCase();
        const name = profile?.name ? profile.name.split(' ')[0] : 'there';
        const fav = profile?.favCountry || 'Japan';

        if (q.includes('hello') || q.includes('hi') || q.includes('hey')) {
            return `Hello ${name}! I am your TravelScout AI Assistant. I can help you find top hidden gems, budget tips, packing advice, or group travel ideas for any country! What country are you planning to visit next?`;
        }

        if (q.includes('budget') || q.includes('cheap') || q.includes('cost')) {
            return `Here are 3 quick budget travel hacks for your trips, ${name}:\n1. **Book local trains/buses in advance** rather than express tourist shuttles.\n2. **Eat where locals line up** for lunch—street markets offer the freshest food at half the price.\n3. **Use TravelScout Group Matcher** to split accommodation and rental car costs with travel buddies!`;
        }

        if (q.includes('pack') || q.includes('luggage') || q.includes('bring')) {
            return `Smart packing tips:\n- Universal power adapter with multi-USB ports.\n- Quick-dry microfiber towel and comfortable walking sneakers.\n- Refillable insulated water bottle.\n- Digital copy of your travel insurance & passport.`;
        }

        if (q.includes('group') || q.includes('companion') || q.includes('people')) {
            return `TravelScout makes group travel super easy! Check out our **Explore / Matcher** tab to connect with verified travelers visiting countries like ${fav} around the same dates as you.`;
        }

        return `That's a great travel question, ${name}! Based on your interest in group exploration and favorite country (${fav}), I recommend exploring local authentic food markets and scenic heritage trails. Would you like detailed suggestions for a specific country? Just tell me which country you want to visit!`;
    }
}

window.GeminiService = new GeminiService();
