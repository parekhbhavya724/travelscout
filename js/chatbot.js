/**
 * TravelScout AI Chatbot Widget
 * Injects an interactive AI Chatbot across all TravelScout pages.
 */

class TravelScoutChatbot {
    constructor() {
        this.history = [];
        this.isOpen = false;
        this.initUI();
    }

    initUI() {
        if (document.getElementById('ts-chatbot-trigger')) return;

        // Floating Trigger Button
        const trigger = document.createElement('div');
        trigger.id = 'ts-chatbot-trigger';
        trigger.style.cssText = `
            position: fixed;
            bottom: 25px;
            right: 25px;
            height: 50px;
            padding: 0 22px;
            border-radius: 25px;
            background: linear-gradient(135deg, #1677ff 0%, #3975e6 100%);
            box-shadow: 0 8px 24px rgba(22, 119, 255, 0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            z-index: 9999;
            transition: transform 0.25s ease, box-shadow 0.25s ease;
        `;
        trigger.innerHTML = `
            <span style="color: white; font-weight: 700; font-size: 14px; letter-spacing: 0.2px;">AI Chatbot</span>
        `;
        trigger.title = "Chat with TravelScout AI Assistant";

        // Chat Container
        const container = document.createElement('div');
        container.id = 'ts-chatbot-container';
        container.style.cssText = `
            position: fixed;
            bottom: 95px;
            right: 25px;
            width: 380px;
            height: 520px;
            max-width: calc(100vw - 40px);
            max-height: calc(100vh - 120px);
            background: #ffffff;
            border-radius: 20px;
            box-shadow: 0 16px 40px rgba(0, 0, 0, 0.18);
            border: 1px solid #e5e7eb;
            display: none;
            flex-direction: column;
            overflow: hidden;
            z-index: 9999;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            animation: tsChatPop 0.25s ease;
        `;

        container.innerHTML = `
            <!-- Chat Header -->
            <div style="background: #111827; color: white; padding: 14px 18px; display: flex; align-items: center; justify-content: space-between;">
                <div>
                    <div style="font-weight: 700; font-size: 15px; display: flex; align-items: center; gap: 6px;">
                        TravelScout AI
                        <span style="font-size: 10px; background: rgba(16, 185, 129, 0.2); color: #34d399; padding: 2px 6px; border-radius: 10px;">Gemini</span>
                    </div>
                    <div style="font-size: 11px; color: #9ca3af;">Always active travel scout</div>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <button id="ts-chat-key-btn" style="background: none; border: none; color: #9ca3af; cursor: pointer; font-size: 12px; font-weight: 600;" title="Set Gemini API Key">API Key</button>
                    <button id="ts-chat-close-btn" style="background: none; border: none; color: #9ca3af; cursor: pointer; font-size: 16px;" title="Close Chat">✕</button>
                </div>
            </div>

            <!-- Quick Chips -->
            <div style="padding: 10px 14px; background: #f9fafb; border-bottom: 1px solid #edf2f7; display: flex; gap: 6px; overflow-x: auto; scrollbar-width: none;">
                <button class="ts-quick-chip" data-query="Give me 3 hidden gems in Japan">Japan Gems</button>
                <button class="ts-quick-chip" data-query="Best places to visit in Italy for group travelers">Italy Group</button>
                <button class="ts-quick-chip" data-query="What should I pack for travel?">Packing List</button>
                <button class="ts-quick-chip" data-query="Top budget travel hacks">Budget Hacks</button>
            </div>

            <!-- Chat Messages Box -->
            <div id="ts-chat-messages" style="flex: 1; padding: 14px; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; background: #ffffff;">
                <div style="display: flex; gap: 8px; align-items: flex-start;">
                    <div style="background: #f3f4f6; color: #1f2937; padding: 10px 14px; border-radius: 14px; border-top-left-radius: 2px; font-size: 13px; max-width: 82%; line-height: 1.45;">
                        Hello! I am your AI Travel Assistant. Ask me anything about destinations, budget planning, or travel tips!
                    </div>
                </div>
            </div>

            <!-- Input Box -->
            <div style="padding: 12px; border-top: 1px solid #e5e7eb; background: #f9fafb; display: flex; gap: 8px; align-items: center;">
                <input type="text" id="ts-chat-input" placeholder="Ask TravelScout AI..." style="flex: 1; padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 20px; font-size: 13px; outline: none; background: white;" onkeydown="if(event.key==='Enter') window.Chatbot.sendUserMessage()">
                <button id="ts-chat-send" style="padding: 0 14px; height: 36px; border-radius: 18px; background: #1677ff; border: none; color: white; font-weight: 700; font-size: 12px; cursor: pointer;" onclick="window.Chatbot.sendUserMessage()">
                    Send
                </button>
            </div>
        `;

        document.body.appendChild(trigger);
        document.body.appendChild(container);

        // Inject chip CSS
        const style = document.createElement('style');
        style.textContent = `
            @keyframes tsChatPop {
                from { opacity: 0; transform: translateY(12px) scale(0.95); }
                to { opacity: 1; transform: translateY(0) scale(1); }
            }
            .ts-quick-chip {
                background: #ffffff;
                border: 1px solid #d1d5db;
                color: #374151;
                border-radius: 16px;
                padding: 5px 11px;
                font-size: 11px;
                font-weight: 600;
                white-space: nowrap;
                cursor: pointer;
                transition: 0.15s;
            }
            .ts-quick-chip:hover {
                background: #1677ff;
                color: white;
                border-color: #1677ff;
            }
        `;
        document.head.appendChild(style);

        // Event listeners
        trigger.onclick = () => this.toggleChat();
        document.getElementById('ts-chat-close-btn').onclick = () => this.toggleChat(false);
        document.getElementById('ts-chat-key-btn').onclick = () => {
            if (window.GeminiService) window.GeminiService.openApiKeyModal();
        };

        // Quick chip clicks
        container.querySelectorAll('.ts-quick-chip').forEach(btn => {
            btn.onclick = () => {
                const query = btn.getAttribute('data-query');
                document.getElementById('ts-chat-input').value = query;
                this.sendUserMessage();
            };
        });
    }

    toggleChat(forceState) {
        const container = document.getElementById('ts-chatbot-container');
        if (!container) return;

        this.isOpen = forceState !== undefined ? forceState : !this.isOpen;
        container.style.display = this.isOpen ? 'flex' : 'none';

        if (this.isOpen) {
            document.getElementById('ts-chat-input').focus();
        }
    }

    async sendUserMessage() {
        const input = document.getElementById('ts-chat-input');
        const text = input.value.trim();
        if (!text) return;

        input.value = '';
        this.appendMessage('user', text);

        // Show typing indicator
        const typingId = this.showTypingIndicator();

        const userProfile = window.Auth ? window.Auth.getCurrentUser() : null;

        let responseText = '';
        if (window.GeminiService) {
            const res = await window.GeminiService.askChatbot(this.history, text, userProfile);
            responseText = res.text;
        } else {
            responseText = "I'm experiencing a quick connection update. Please try asking again!";
        }

        this.removeTypingIndicator(typingId);
        this.appendMessage('ai', responseText);
    }

    appendMessage(sender, text) {
        const box = document.getElementById('ts-chat-messages');
        if (!box) return;

        this.history.push({ sender, text });

        const msgDiv = document.createElement('div');
        msgDiv.style.cssText = `
            display: flex;
            gap: 8px;
            align-items: flex-start;
            ${sender === 'user' ? 'justify-content: flex-end;' : ''}
        `;

        // Format basic markdown/linebreaks
        const formattedText = text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n/g, '<br>');

        if (sender === 'user') {
            msgDiv.innerHTML = `
                <div style="background: #1677ff; color: white; padding: 10px 14px; border-radius: 14px; border-top-right-radius: 2px; font-size: 13px; max-width: 82%; line-height: 1.45;">
                    ${formattedText}
                </div>
            `;
        } else {
            msgDiv.innerHTML = `
                <div style="background: #f3f4f6; color: #1f2937; padding: 10px 14px; border-radius: 14px; border-top-left-radius: 2px; font-size: 13px; max-width: 82%; line-height: 1.45;">
                    ${formattedText}
                </div>
            `;
        }

        box.appendChild(msgDiv);
        box.scrollTop = box.scrollHeight;
    }

    showTypingIndicator() {
        const box = document.getElementById('ts-chat-messages');
        const id = 'ts-typing-' + Date.now();

        const div = document.createElement('div');
        div.id = id;
        div.style.cssText = `display: flex; gap: 8px; align-items: center;`;
        div.innerHTML = `
            <div style="background: #f3f4f6; color: #6b7280; padding: 8px 14px; border-radius: 14px; font-size: 12px; font-style: italic;">
                TravelScout AI is thinking...
            </div>
        `;
        box.appendChild(div);
        box.scrollTop = box.scrollHeight;
        return id;
    }

    removeTypingIndicator(id) {
        const el = document.getElementById(id);
        if (el) el.remove();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.Chatbot = new TravelScoutChatbot();
});
