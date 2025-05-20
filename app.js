// app.js (Simplified Base - Global SDK - With Super Simple Profile Logic)

// -----------------------------------------------------------------------------
// 1. FIREBASE CONFIGURATION
// -----------------------------------------------------------------------------
const firebaseConfig = {
    apiKey: "AIzaSyBwg5qY5OS9wquAn123enuaKqvJZgi3ZL0", // YOUR API KEY
    authDomain: "manshverse-a674f.firebaseapp.com",
    projectId: "manshverse-a674f",
    storageBucket: "manshverse-a674f.appspot.com",
    messagingSenderId: "736390062196",
    appId: "1:736390062196:web:0a325b97e8c125393bf121",
    measurementId: "G-TFFGQ9NKS1"
};

// -----------------------------------------------------------------------------
// 2. FIREBASE INITIALIZATION
// -----------------------------------------------------------------------------
firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();
// const storage = firebase.storage(); // Uncomment when you re-add avatar features
const analytics = firebase.analytics();

console.log("Firebase Initialized for ManshVerse (Simplified Base + Simple Profile)");


// -----------------------------------------------------------------------------
// 3. AUTHENTICATION STATE OBSERVER
// -----------------------------------------------------------------------------
auth.onAuthStateChanged(user => {
    const currentPath = window.location.pathname;
    console.log("Auth State Changed. User:", user ? user.uid : "null", "Current Path:", currentPath);

    if (user) { // USER IS LOGGED IN
        if (currentPath.endsWith('/') || currentPath.endsWith('index.html') || currentPath.endsWith('register.html')) {
            console.log("User logged in, redirecting to chat.html");
            window.location.href = 'chat.html';
        } else if (currentPath.endsWith('chat.html')) {
            console.log("User on chat page, setting up UI and loading messages.");
            setupChatUI(user); // Make sure this is called
            loadMessages();    // Make sure this is called
        } else if (currentPath.endsWith('profile.html')) {
            console.log("User on profile page. Setting up basic display.");
            const profileStatusMsg = document.getElementById('profile-status-message');
            const userInfoArea = document.getElementById('user-info-area');
            const userEmailSpan = document.getElementById('profile-page-user-email');
            const profileLogoutButton = document.getElementById('profile-logout-button');

            if (profileStatusMsg) profileStatusMsg.style.display = 'none';

            if (userInfoArea && userEmailSpan) {
                userInfoArea.style.display = 'block';
                userEmailSpan.textContent = user.email || (user.displayName ? user.displayName + " (No email found)" : "User Info");
            } else {
                console.error("Profile page: 'user-info-area' or 'profile-page-user-email' element not found!");
            }

            if (profileLogoutButton) {
                profileLogoutButton.style.display = 'inline-block';
            } else {
                console.error("Profile page: '#profile-logout-button' not found!");
            }
        }
    } else { // NO USER LOGGED IN
        console.log("No user authenticated. Handling redirection or UI cleanup.");
        if (currentPath.endsWith('chat.html') || currentPath.endsWith('profile.html')) {
            console.log("No user, on protected page ("+ currentPath +"), redirecting to index.html");
            window.location.href = 'index.html';
        }
        // Clear UI elements if on other pages (or if redirection is slow)
        clearChatUI(); // Clears chat specific elements

        // Simple profile page elements to hide/reset
        const profileStatusMsg = document.getElementById('profile-status-message');
        const userInfoArea = document.getElementById('user-info-area');
        const profileLogoutButton = document.getElementById('profile-logout-button');

        if(profileStatusMsg && currentPath.endsWith('profile.html')) { // Only update if on profile page
            profileStatusMsg.innerHTML = "<p>Please login to view your profile. You will be redirected.</p>";
            profileStatusMsg.style.display = 'block';
        }
        if(userInfoArea) userInfoArea.style.display = 'none';
        if(profileLogoutButton) profileLogoutButton.style.display = 'none';
    }
});


// -----------------------------------------------------------------------------
// 4. UI HELPER FUNCTIONS (Auth Errors + Basic Chat UI)
// -----------------------------------------------------------------------------
function displayAuthError(type, message) {
    const errorElementId = type === 'register' ? 'register-error' : 'login-error';
    const errorElement = document.getElementById(errorElementId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    } else {
        alert(message); // Fallback
    }
}

function clearAuthError(type) {
    const errorElementId = type === 'register' ? 'register-error' : 'login-error';
    const errorElement = document.getElementById(errorElementId);
    if (errorElement) {
        errorElement.style.display = 'none';
        errorElement.textContent = '';
    }
}

function setupChatUI(user) {
    // Use querySelector for chat elements as their IDs might not be unique if headers are reused
    const userDisplayNameElement = document.querySelector('#chat-header .user-display-name-header') || document.getElementById('chat-user-displayName');
    const messagesContainer = document.querySelector('.messages-container');
    const sendMessageForm = document.querySelector('.send-message-form-layout');
    const logoutButton = document.querySelector('#chat-header #logout-button'); // More specific to chat header

    if (userDisplayNameElement) userDisplayNameElement.textContent = `${user.displayName || user.email}`;
    if (messagesContainer) messagesContainer.style.display = 'flex';
    if (sendMessageForm) sendMessageForm.style.display = 'flex';
    if (logoutButton) logoutButton.style.display = 'inline-block';
}

function clearChatUI() {
    const userDisplayNameElement = document.querySelector('#chat-header .user-display-name-header') || document.getElementById('chat-user-displayName');
    const messagesContainer = document.querySelector('.messages-container');
    const sendMessageForm = document.querySelector('.send-message-form-layout');
    const logoutButton = document.querySelector('#chat-header #logout-button');

    if (userDisplayNameElement) userDisplayNameElement.textContent = 'Loading...';
    if (messagesContainer) messagesContainer.innerHTML = '<div class="message-placeholder"><p>Connecting...</p></div>';
    if (sendMessageForm) {
        const messageInput = document.getElementById('message-input');
        if (messageInput) messageInput.value = '';
    }
    if (logoutButton) logoutButton.style.display = 'none';
}

// -----------------------------------------------------------------------------
// 5. AUTHENTICATION FUNCTIONS (Same as simplified base)
// -----------------------------------------------------------------------------
async function handleRegistration(displayName, email, password, submitButton) {
    clearAuthError('register');
    if (submitButton) { submitButton.disabled = true; submitButton.textContent = 'Creating Account...'; }
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        await user.updateProfile({ displayName: displayName, photoURL: 'assets/avatar.png' });
        await db.collection("users").doc(user.uid).set({
            uid: user.uid,
            displayName: displayName,
            email: user.email,
            photoURL: 'assets/avatar.png',
            bio: '', username: '',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
    } catch (error) { displayAuthError('register', `Registration Failed: ${error.message}`); console.error("Reg Err:", error); }
    finally { if (submitButton) { submitButton.disabled = false; submitButton.textContent = 'Create Account'; } }
}

async function handleLogin(email, password, submitButton) {
    clearAuthError('login');
    if (submitButton) { submitButton.disabled = true; submitButton.textContent = 'Logging In...'; }
    try {
        await auth.signInWithEmailAndPassword(email, password);
    } catch (error) { displayAuthError('login', `Login Failed: ${error.message}`); console.error("Login Err:", error); }
    finally { if (submitButton) { submitButton.disabled = false; submitButton.textContent = 'Login'; } }
}

async function handleLogout() {
    const logoutButtons = document.querySelectorAll('#logout-button, #profile-logout-button');
    logoutButtons.forEach(button => { if(button) { button.disabled = true; button.textContent = 'Logging out...'; }});
    try { await auth.signOut(); }
    catch (error) {
        alert("Logout failed: " + error.message); console.error("Logout Err:", error);
        logoutButtons.forEach(button => { if(button) { button.disabled = false; button.textContent = 'Logout'; }});
    }
}

// -----------------------------------------------------------------------------
// 6. CHAT FUNCTIONS (Same as simplified base)
// -----------------------------------------------------------------------------
async function handleSendMessage(text) {
    const user = auth.currentUser;
    if (!user || !text.trim()) return;
    const sendButton = document.querySelector('.send-message-form-layout button[type="submit"]');
    if (sendButton) sendButton.disabled = true;
    try {
        await db.collection("messages").add({
            text: text.trim(), userId: user.uid, displayName: user.displayName || "User",
            photoURL: user.photoURL || 'assets/avatar.png', timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
    } catch (error) { alert("Failed to send message."); console.error("Send Msg Err:", error); }
    finally { if (sendButton) sendButton.disabled = false; }
}

let unsubscribeMessages = null;
function loadMessages() {
    const user = auth.currentUser;
    if (!user) return;
    const messagesContainer = document.querySelector('.messages-container');
    if (!messagesContainer) return;
    if (unsubscribeMessages) unsubscribeMessages();
    messagesContainer.innerHTML = '<div class="message-placeholder"><p>Loading messages...</p></div>';
    const messagesQuery = db.collection("messages").orderBy("timestamp", "desc").limit(25);
    unsubscribeMessages = messagesQuery.onSnapshot((querySnapshot) => {
        if (querySnapshot.empty && messagesContainer.innerHTML.includes("Loading")) {
            messagesContainer.innerHTML = '<div class="message-placeholder"><p>No messages yet. Be the first!</p></div>'; return;
        }
        messagesContainer.innerHTML = '';
        const messages = []; querySnapshot.forEach(doc => messages.push(doc.data()));
        messages.reverse().forEach(message => {
            const item = document.createElement('div'); item.classList.add('message-item');
            if (message.userId === user.uid) item.classList.add('sent'); else item.classList.add('received');
            const avatar = document.createElement('img'); avatar.classList.add('message-avatar');
            avatar.src = message.photoURL || 'assets/avatar.png'; avatar.alt = message.displayName?.charAt(0) || 'U';
            const content = document.createElement('div'); content.classList.add('message-content');
            const sender = document.createElement('strong'); sender.textContent = (message.userId === user.uid) ? "You" : (message.displayName || "User");
            const text = document.createElement('span'); text.classList.add('message-text'); text.textContent = message.text;
            const time = document.createElement('small'); time.classList.add('timestamp');
            time.textContent = message.timestamp ? new Date(message.timestamp.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
            content.append(sender, text, time);
            if (message.userId === user.uid) item.append(content, avatar); else item.append(avatar, content);
            messagesContainer.appendChild(item);
        });
        setTimeout(() => { messagesContainer.scrollTop = messagesContainer.scrollHeight; }, 50);
    }, (error) => {
        messagesContainer.innerHTML = '<div class="message-placeholder" style="color:red;"><p>Error loading messages.</p></div>';
        console.error("Msg Load Err:", error);
    });
}

// -----------------------------------------------------------------------------
// 7. DOMContentLoaded - EVENT LISTENERS
// -----------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded. Attaching event listeners. Current Path:", window.location.pathname);

    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        const btn = registerForm.querySelector('button[type="submit"]');
        registerForm.addEventListener('submit', (e) => { e.preventDefault();
            const d=document.getElementById('register-displayName')?.value, m=document.getElementById('register-email')?.value, p=document.getElementById('register-password')?.value;
            if(d&&m&&p){ clearAuthError('register'); handleRegistration(d,m,p,btn); } else { displayAuthError('register',"All fields required."); }
        });
        ['register-displayName','register-email','register-password'].forEach(id=>document.getElementById(id)?.addEventListener('input',()=>clearAuthError('register')));
    }

    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        const btn = loginForm.querySelector('button[type="submit"]');
        loginForm.addEventListener('submit', (e) => { e.preventDefault();
            const m=document.getElementById('login-email')?.value, p=document.getElementById('login-password')?.value;
            if(m&&p){ clearAuthError('login'); handleLogin(m,p,btn); } else { displayAuthError('login',"Email & Password required."); }
        });
        ['login-email','login-password'].forEach(id=>document.getElementById(id)?.addEventListener('input',()=>clearAuthError('login')));
    }

    const chatPageLogoutButton = document.querySelector('.chat-header-bar #logout-button');
    if(chatPageLogoutButton) chatPageLogoutButton.addEventListener('click', handleLogout);

    const sendMessageForm = document.querySelector('.send-message-form-layout');
    const messageInput = document.getElementById('message-input');
    if (sendMessageForm && messageInput) {
        sendMessageForm.addEventListener('submit', (e) => { e.preventDefault();
            if (messageInput.value.trim()) { handleSendMessage(messageInput.value); messageInput.value=''; messageInput.focus(); }
        });
    }

    // Profile Page Logout Button (using ID from simple profile.html)
    const simpleProfileLogout = document.getElementById('profile-logout-button');
    if (window.location.pathname.endsWith('profile.html') && simpleProfileLogout) {
        simpleProfileLogout.addEventListener('click', handleLogout);
        console.log("Listener for simple profile logout button attached.");
    }

    // DOMContentLoaded check for already authenticated user
    if (auth.currentUser) {
        console.log("DOMContentLoaded: User already authenticated on path:", window.location.pathname);
        const user = auth.currentUser;
        if (window.location.pathname.endsWith('chat.html')) {
            if (!unsubscribeMessages) { // Prevent multiple if onAuthStateChanged already fired
                setupChatUI(user);
                loadMessages();
            }
        } else if (window.location.pathname.endsWith('profile.html')) {
            // Setup for super simple profile page
            const profileStatusMsg = document.getElementById('profile-status-message');
            const userInfoArea = document.getElementById('user-info-area');
            const userEmailSpan = document.getElementById('profile-page-user-email');
            const profileLogoutButton = document.getElementById('profile-logout-button');

            if (profileStatusMsg) profileStatusMsg.style.display = 'none';
            if (userInfoArea && userEmailSpan) {
                userInfoArea.style.display = 'block';
                userEmailSpan.textContent = user.email || (user.displayName ? user.displayName + " (No email)" : "User Info");
            }
            if (profileLogoutButton) profileLogoutButton.style.display = 'inline-block';
        }
    } else {
        console.log("DOMContentLoaded: No user authenticated yet for path:", window.location.pathname);
    }
});

console.log("app.js (Simplified Base + Simple Profile) loaded.");