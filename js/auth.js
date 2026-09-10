/**
 * TravelScout Authentication & User Profile Management System
 */

const STORAGE_USERS = 'travelscout_users_v1';
const STORAGE_SESSION = 'travelscout_session_v1';

// Default Demo User
const DEFAULT_DEMO_USER = {
    id: 'demo_user_1',
    email: 'alex.morgan@travelscout.io',
    name: 'Alex Morgan',
    age: 26,
    gender: 'Non-binary',
    nationality: 'American',
    favCountry: 'Japan',
    groupTravel: 'Yes, looking for group traveling',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    joinedDate: 'September 2026'
};

class AuthManager {
    constructor() {
        this.initUsers();
    }

    initUsers() {
        if (!localStorage.getItem(STORAGE_USERS)) {
            const initialUsers = [DEFAULT_DEMO_USER];
            localStorage.setItem(STORAGE_USERS, JSON.stringify(initialUsers));
        }
    }

    getUsers() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_USERS)) || [];
        } catch (e) {
            return [];
        }
    }

    saveUsers(users) {
        localStorage.setItem(STORAGE_USERS, JSON.stringify(users));
    }

    getCurrentUser() {
        try {
            const session = JSON.parse(localStorage.getItem(STORAGE_SESSION));
            if (session && session.user) {
                return session.user;
            }
        } catch (e) {
            console.error('Error fetching session:', e);
        }
        return null;
    }

    setCurrentUser(user) {
        localStorage.setItem(STORAGE_SESSION, JSON.stringify({
            user: user,
            loginTime: new Date().toISOString()
        }));
        this.updateNavbars();
    }

    login(email, password) {
        const users = this.getUsers();
        const found = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
        if (found) {
            this.setCurrentUser(found);
            return { success: true, user: found };
        }
        return { success: false, message: 'Account not found with this email. Please register!' };
    }

    loginAsDemo() {
        this.setCurrentUser(DEFAULT_DEMO_USER);
        return DEFAULT_DEMO_USER;
    }

    register(profileData) {
        const users = this.getUsers();
        const existing = users.find(u => u.email.toLowerCase() === profileData.email.toLowerCase().trim());
        
        if (existing) {
            // Update existing profile
            Object.assign(existing, profileData);
            this.saveUsers(users);
            this.setCurrentUser(existing);
            return { success: true, user: existing, updated: true };
        } else {
            const newUser = {
                id: 'user_' + Date.now(),
                ...profileData,
                avatar: profileData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(profileData.name)}&background=1677ff&color=fff`,
                joinedDate: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
            };
            users.push(newUser);
            this.saveUsers(users);
            this.setCurrentUser(newUser);
            return { success: true, user: newUser, created: true };
        }
    }

    logout() {
        localStorage.removeItem(STORAGE_SESSION);
        window.location.reload();
    }

    updateNavbars() {
        const user = this.getCurrentUser();
        
        // Target profile buttons or containers across pages
        const profileBtns = document.querySelectorAll('.ts-home-profile, .ts-profile, .ts-nav-profile-placeholder');
        
        profileBtns.forEach(btn => {
            if (!btn) return;

            if (user) {
                btn.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 8px; position: relative;">
                        <img src="${user.avatar}" alt="${user.name}" style="width: 28px; height: 28px; border-radius: 50%; object-fit: cover; border: 1.5px solid #1677ff;">
                        <span style="font-weight: 600; max-width: 110px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${user.name.split(' ')[0]}</span>
                    </div>
                `;
                btn.title = `${user.name} (${user.email})`;
                btn.style.cursor = 'pointer';

                // Add dropdown event if not bound
                btn.onclick = (e) => {
                    e.stopPropagation();
                    this.toggleProfileDropdown(btn, user);
                };
            } else {
                btn.innerHTML = `
                    <a href="login.html" style="color: white; text-decoration: none; display: flex; align-items: center; gap: 6px;">
                        Sign In
                    </a>
                `;
                btn.onclick = null;
            }
        });
    }

    toggleProfileDropdown(btn, user) {
        let existingMenu = document.getElementById('ts-profile-menu');
        if (existingMenu) {
            existingMenu.remove();
            return;
        }

        const menu = document.createElement('div');
        menu.id = 'ts-profile-menu';
        menu.style.cssText = `
            position: absolute;
            top: 60px;
            right: 20px;
            background: #ffffff;
            color: #1f2937;
            border-radius: 14px;
            box-shadow: 0 12px 30px rgba(0, 0, 0, 0.15);
            border: 1px solid #e5e7eb;
            width: 270px;
            z-index: 10000;
            padding: 16px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            animation: tsFadeIn 0.2s ease;
        `;

        menu.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px; border-bottom: 1px solid #f3f4f6; padding-bottom: 12px; margin-bottom: 12px;">
                <img src="${user.avatar}" style="width: 44px; height: 44px; border-radius: 50%; object-fit: cover;">
                <div style="overflow: hidden;">
                    <div style="font-weight: 700; font-size: 15px; color: #111827;">${user.name}</div>
                    <div style="font-size: 12px; color: #6b7280; text-overflow: ellipsis; overflow: hidden;">${user.email}</div>
                </div>
            </div>
            
            <div style="display: flex; flex-direction: column; gap: 6px; font-size: 13px; color: #4b5563; margin-bottom: 14px; background: #f9fafb; padding: 10px; border-radius: 8px;">
                <div><strong>Age:</strong> ${user.age || 'N/A'} yrs | <strong>Gender:</strong> ${user.gender || 'N/A'}</div>
                <div><strong>Nationality:</strong> ${user.nationality || 'N/A'}</div>
                <div><strong>Fav Country:</strong> ${user.favCountry || 'N/A'}</div>
                <div><strong>Group Travel:</strong> ${user.groupTravel || 'N/A'}</div>
            </div>

            <div style="display: flex; flex-direction: column; gap: 4px;">
                <button id="ts-set-gemini-btn" style="width: 100%; text-align: left; background: none; border: none; padding: 8px 10px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600; color: #1677ff;">
                    Gemini API Key Settings
                </button>
                <button id="ts-logout-btn" style="width: 100%; text-align: left; background: none; border: none; padding: 8px 10px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600; color: #ef4444;">
                    Sign Out
                </button>
            </div>
        `;

        document.body.appendChild(menu);

        document.getElementById('ts-set-gemini-btn').onclick = () => {
            menu.remove();
            if (window.GeminiService) {
                window.GeminiService.openApiKeyModal();
            }
        };

        document.getElementById('ts-logout-btn').onclick = () => {
            this.logout();
        };

        const closeHandler = (evt) => {
            if (!menu.contains(evt.target) && !btn.contains(evt.target)) {
                menu.remove();
                document.removeEventListener('click', closeHandler);
            }
        };
        setTimeout(() => document.addEventListener('click', closeHandler), 50);
    }
}

// Attach style tag for animation if missing
if (!document.getElementById('ts-auth-styles')) {
    const style = document.createElement('style');
    style.id = 'ts-auth-styles';
    style.textContent = `
        @keyframes tsFadeIn {
            from { opacity: 0; transform: translateY(-8px); }
            to { opacity: 1; transform: translateY(0); }
        }
    `;
    document.head.appendChild(style);
}

window.Auth = new AuthManager();

document.addEventListener('DOMContentLoaded', () => {
    window.Auth.updateNavbars();
});
