/* ============================================================
   AUTH.JS — UniCompass Firebase Auth System
   ============================================================
   HOW TO ACTIVATE:
   1. Go to https://console.firebase.google.com
   2. Create a project → Add a Web App → Copy the firebaseConfig
   3. Enable Authentication → Sign-in method → Email/Password
   4. Enable Firestore Database (start in test mode)
   5. Replace the firebaseConfig object below with your own
   ============================================================ */

/* ---------- SNU Chennai Programs ---------- */

const SNU_DEGREES = [
    "B.Tech",
    "B.Com",
    "B.Sc",
    "B.A., LL.B",
    "M.Tech",
    "MBA",
    "Ph.D"
];

const SNU_PROGRAMS = {
    "B.Tech": [
        "Computer Science and Engineering",
        "Artificial Intelligence & Data Science",
        "CSE (Internet of Things)",
        "CSE (Cyber Security)",
        "Electrical and Electronics Engineering",
        "Electronics and Communication Engineering",
        "ECE (VLSI Design and Technology)",
        "Information Technology"
    ],
    "B.Com": [
        "Regular",
        "Honours",
        "Professional Accounting"
    ],
    "B.Sc": [
        "Economics (Data Science)"
    ],
    "B.A., LL.B": [
        "Law"
    ],
    "M.Tech": [
        "Artificial Intelligence and Data Science",
        "Computer Science and Engineering",
        "Information Technology",
        "Power Electronics and Drives",
        "VLSI Design",
        "Wireless Communication Technology"
    ],
    "MBA": [
        "General Management"
    ],
    "Ph.D": [
        "Engineering",
        "Commerce & Management",
        "Science & Humanities",
        "Law"
    ]
};

const SNU_YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year"];

/* ============================================================
   FIREBASE INITIALISATION
   ============================================================ */

/* Load Firebase SDK from CDN then boot the auth system */
(function loadFirebase() {

    /* Inject Firebase App + Auth + Firestore scripts */
    const scripts = [
        "https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js",
        "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js",
        "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js"
    ];

    let loaded = 0;

    scripts.forEach(src => {

        const s = document.createElement("script");
        s.src = src;
        s.onload = () => {
            loaded++;
            if (loaded === scripts.length) bootAuth();
        };

        document.head.appendChild(s);
    });

})();

/* ============================================================
   BOOT — runs after Firebase SDKs are ready
   ============================================================ */

function bootAuth() {

    /* Abort if placeholder config is still in place */
    if (FIREBASE_CONFIG.apiKey === "PASTE_YOUR_API_KEY_HERE") {
        console.warn(
            "[UniCompass Auth] Firebase config not set. " +
            "Replace FIREBASE_CONFIG in auth.js with your project details."
        );
        renderNotConfigured();
        return;
    }

    firebase.initializeApp(FIREBASE_CONFIG);

    const auth = firebase.auth();
    const db   = firebase.firestore();

    injectHTML();
    injectCSS();
    wireEvents(auth, db);

    /* Watch auth state → update navbar button */
    auth.onAuthStateChanged(user => {
        if (user) {
            db.collection("users").doc(user.uid).get().then(snap => {
                if (snap.exists) {
                    const data = snap.data();
                    let display = data.rollNumber;
                    if (data.displayName) {
                        display = data.displayName.split(" ")[0];
                    }
                    showLoggedIn(display, data);
                } else {
                    showLoggedIn(user.email, {});
                }
            });
        } else {
            showLoggedOut();
        }
    });
}

/* ============================================================
   HTML INJECTION
   ============================================================ */

function injectHTML() {

    const html = `

    <!-- ===== AUTH OVERLAY ===== -->
    <div class="uc-overlay" id="uc-auth-overlay">
        <div class="uc-modal" id="uc-auth-modal">

            <button class="uc-modal-close" id="uc-auth-close">✕</button>

            <div class="uc-modal-logo">UniCompass</div>
            <div class="uc-modal-subtitle">Sign in with your SNU Roll Number</div>

            <!-- Tabs -->
            <div class="uc-tabs">
                <button class="uc-tab active" id="uc-tab-login"  onclick="ucSwitchTab('login')">Login</button>
                <button class="uc-tab"         id="uc-tab-register" onclick="ucSwitchTab('register')">Register</button>
            </div>

            <!-- Login Form -->
            <div id="uc-login-form">

                <div class="uc-form-group">
                    <label class="uc-label">Roll Number</label>
                    <input
                        class="uc-input"
                        id="uc-login-roll"
                        type="text"
                        maxlength="8"
                        placeholder="e.g. 23110001"
                    >
                </div>

                <div class="uc-form-group">
                    <label class="uc-label">Password</label>
                    <input
                        class="uc-input"
                        id="uc-login-pass"
                        type="password"
                        placeholder="Your password"
                    >
                </div>

                <button class="uc-btn" id="uc-login-btn" onclick="ucLogin()">
                    Login
                </button>

                <div class="uc-error" id="uc-login-error"></div>

            </div>

            <!-- Register Form -->
            <div id="uc-register-form" style="display:none;">

                <div class="uc-form-group">
                    <label class="uc-label">Roll Number <span style="color:#7f8aa8;font-size:12px;">(8 digits)</span></label>
                    <input
                        class="uc-input"
                        id="uc-reg-roll"
                        type="text"
                        maxlength="8"
                        placeholder="e.g. 23110001"
                    >
                </div>

                <div class="uc-form-group">
                    <label class="uc-label">Password</label>
                    <input
                        class="uc-input"
                        id="uc-reg-pass"
                        type="password"
                        placeholder="Create a password"
                    >
                </div>

                <div class="uc-form-group">
                    <label class="uc-label">Confirm Password</label>
                    <input
                        class="uc-input"
                        id="uc-reg-pass2"
                        type="password"
                        placeholder="Repeat your password"
                    >
                </div>

                <button class="uc-btn" id="uc-reg-btn" onclick="ucRegister()">
                    Create Account
                </button>

                <div class="uc-error" id="uc-reg-error"></div>

            </div>

        </div>
    </div>

    <!-- ===== ONBOARDING OVERLAY ===== -->
    <div class="uc-overlay" id="uc-onboard-overlay">
        <div class="uc-modal" id="uc-onboard-modal">

            <div class="uc-step-indicator">
                <div class="uc-step-dot done" id="uc-dot-1"></div>
                <div class="uc-step-dot"      id="uc-dot-2"></div>
                <div class="uc-step-dot"      id="uc-dot-3"></div>
                <div class="uc-step-dot"      id="uc-dot-4"></div>
            </div>

            <div class="uc-onboard-title" id="uc-onboard-title">What's your name?</div>
            <div class="uc-onboard-sub"   id="uc-onboard-sub">Help us personalise your experience</div>

            <!-- Step 1: Name -->
            <div id="uc-ob-step-1">
                <div class="uc-form-group">
                    <label class="uc-label">Full Name</label>
                    <input
                        class="uc-input"
                        id="uc-ob-name"
                        type="text"
                        placeholder="e.g. Lakshman Raj"
                    >
                </div>
                <button class="uc-btn" onclick="ucObNext(1)">Next →</button>
                <div class="uc-error" id="uc-ob-err-1"></div>
            </div>

            <!-- Step 2: Degree -->
            <div id="uc-ob-step-2" style="display:none;">
                <div class="uc-form-group">
                    <label class="uc-label">Degree</label>
                    <select class="uc-select" id="uc-ob-degree" onchange="ucUpdatePrograms()">
                        <option value="">Select degree...</option>
                    </select>
                </div>
                <button class="uc-btn" onclick="ucObNext(2)">Next →</button>
                <div class="uc-error" id="uc-ob-err-2"></div>
            </div>

            <!-- Step 3: Program -->
            <div id="uc-ob-step-3" style="display:none;">
                <div class="uc-form-group">
                    <label class="uc-label">Program</label>
                    <select class="uc-select" id="uc-ob-program">
                        <option value="">Select program...</option>
                    </select>
                </div>
                <button class="uc-btn" onclick="ucObNext(3)">Next →</button>
                <div class="uc-error" id="uc-ob-err-3"></div>
            </div>

            <!-- Step 4: Year -->
            <div id="uc-ob-step-4" style="display:none;">
                <div class="uc-form-group">
                    <label class="uc-label">Current Year</label>
                    <select class="uc-select" id="uc-ob-year">
                        <option value="">Select year...</option>
                    </select>
                </div>
                <button class="uc-btn" onclick="ucObFinish()">Finish Setup ✓</button>
                <div class="uc-error" id="uc-ob-err-4"></div>
            </div>

        </div>
    </div>

    <!-- ===== PROFILE DROPDOWN ===== -->
    <div id="uc-profile-dropdown">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;">
            <div style="width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#4f66ff,#7b5cff);display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;font-family:'Poppins',sans-serif;" id="uc-dp-avatar">?</div>
            <div>
                <div class="uc-profile-name" id="uc-dp-name">—</div>
                <div class="uc-profile-roll" id="uc-dp-roll">—</div>
            </div>
        </div>
        <div class="uc-profile-badge" id="uc-dp-degree">—</div>
        <div class="uc-profile-badge" style="margin-left:6px;" id="uc-dp-year">—</div>
        <div class="uc-divider"></div>
        <button class="uc-logout-btn" onclick="ucLogout()">Sign Out</button>
    </div>

    <!-- ===== TOAST ===== -->
    <div id="uc-toast"></div>

    `;

    document.body.insertAdjacentHTML("beforeend", html);

    /* Inject floating button only if there is no navbar button */
    if (!document.getElementById("uc-nav-btn")) {
        const fab = document.createElement("button");
        fab.id = "uc-login-fab";
        fab.innerHTML = `<span id="uc-fab-text">Login</span>`;
        fab.onclick = () => ucToggleProfileOrLogin();
        document.body.appendChild(fab);
    }

    /* Populate degree select in onboarding */
    const degSel = document.getElementById("uc-ob-degree");
    SNU_DEGREES.forEach(d => {
        const opt = document.createElement("option");
        opt.value = d;
        opt.textContent = d;
        degSel.appendChild(opt);
    });

    /* Populate year select */
    const yearSel = document.getElementById("uc-ob-year");
    SNU_YEARS.forEach(y => {
        const opt = document.createElement("option");
        opt.value = y;
        opt.textContent = y;
        yearSel.appendChild(opt);
    });
}

/* ============================================================
   CSS INJECTION (loads auth.css)
   ============================================================ */

function injectCSS() {
    if (document.getElementById("uc-auth-css")) return;
    const link = document.createElement("link");
    link.id   = "uc-auth-css";
    link.rel  = "stylesheet";
    link.href = "auth.css";
    document.head.appendChild(link);
}

/* ============================================================
   EVENT WIRING
   ============================================================ */

/* Store references globally so event handlers can use them */
let _ucAuth = null;
let _ucDb   = null;
let _ucCurrentUser = null;

function wireEvents(auth, db) {
    _ucAuth = auth;
    _ucDb   = db;

    /* Close auth modal on overlay click */
    document.getElementById("uc-auth-overlay").addEventListener("click", e => {
        if (e.target.id === "uc-auth-overlay") ucCloseAuth();
    });

    document.getElementById("uc-auth-close").addEventListener("click", ucCloseAuth);

    /* Allow Enter key to submit */
    document.addEventListener("keydown", e => {
        if (e.key !== "Enter") return;
        if (document.getElementById("uc-auth-overlay").classList.contains("active")) {
            const loginVisible = document.getElementById("uc-login-form").style.display !== "none";
            if (loginVisible) ucLogin();
            else ucRegister();
        }
    });

    /* Close profile dropdown on outside click */
    document.addEventListener("click", e => {
        const dd  = document.getElementById("uc-profile-dropdown");
        const fab = document.getElementById("uc-login-fab");
        const navBtn = document.getElementById("uc-nav-btn");
        if (
            dd.classList.contains("open") &&
            !dd.contains(e.target) &&
            e.target !== fab &&
            e.target !== navBtn &&
            !fab?.contains(e.target) &&
            !navBtn?.contains(e.target)
        ) {
            dd.classList.remove("open");
        }
    });
}

/* ============================================================
   AUTH MODAL OPEN / CLOSE
   ============================================================ */

function ucOpenAuth() {
    document.getElementById("uc-auth-overlay").classList.add("active");
    document.getElementById("uc-login-error").textContent   = "";
    document.getElementById("uc-reg-error").textContent     = "";
    setTimeout(() => document.getElementById("uc-login-roll")?.focus(), 200);
}

function ucCloseAuth() {
    document.getElementById("uc-auth-overlay").classList.remove("active");
}

function ucSwitchTab(tab) {
    const loginForm    = document.getElementById("uc-login-form");
    const registerForm = document.getElementById("uc-register-form");
    const tabLogin     = document.getElementById("uc-tab-login");
    const tabRegister  = document.getElementById("uc-tab-register");

    if (tab === "login") {
        loginForm.style.display    = "block";
        registerForm.style.display = "none";
        tabLogin.classList.add("active");
        tabRegister.classList.remove("active");
    } else {
        loginForm.style.display    = "none";
        registerForm.style.display = "block";
        tabLogin.classList.remove("active");
        tabRegister.classList.add("active");
    }
}

/* ============================================================
   REGISTER
   ============================================================ */

async function ucRegister() {
    const roll  = document.getElementById("uc-reg-roll").value.trim();
    const pass  = document.getElementById("uc-reg-pass").value;
    const pass2 = document.getElementById("uc-reg-pass2").value;
    const errEl = document.getElementById("uc-reg-error");

    errEl.textContent = "";

    /* Validation */
    if (!/^\d{8}$/.test(roll)) {
        errEl.textContent = "Roll number must be exactly 8 digits.";
        return;
    }

    if (pass.length < 6) {
        errEl.textContent = "Password must be at least 6 characters.";
        return;
    }

    if (pass !== pass2) {
        errEl.textContent = "Passwords do not match.";
        return;
    }

    const btn = document.getElementById("uc-reg-btn");
    btn.disabled   = true;
    btn.textContent = "Creating account...";

    try {
        /* Firebase uses email under the hood — we derive one from roll number */
        const fakeEmail = roll + "@student.snuchennai.edu.in";

        const cred = await _ucAuth.createUserWithEmailAndPassword(fakeEmail, pass);

        /* Create user document in Firestore */
        await _ucDb.collection("users").doc(cred.user.uid).set({
            rollNumber: roll,
            isNewUser:  true,
            createdAt:  firebase.firestore.FieldValue.serverTimestamp()
        });

        ucCloseAuth();
        ucShowToast("Account created! Let's set up your profile.");
        ucOpenOnboarding();

    } catch (err) {

        errEl.textContent = ucFirebaseError(err.code);

    } finally {
        btn.disabled    = false;
        btn.textContent = "Create Account";
    }
}

/* ============================================================
   LOGIN
   ============================================================ */

async function ucLogin() {
    const roll  = document.getElementById("uc-login-roll").value.trim();
    const pass  = document.getElementById("uc-login-pass").value;
    const errEl = document.getElementById("uc-login-error");

    errEl.textContent = "";

    if (!/^\d{8}$/.test(roll)) {
        errEl.textContent = "Roll number must be exactly 8 digits.";
        return;
    }

    if (!pass) {
        errEl.textContent = "Please enter your password.";
        return;
    }

    const btn = document.getElementById("uc-login-btn");
    btn.disabled    = true;
    btn.textContent = "Signing in...";

    try {
        const fakeEmail = roll + "@student.snuchennai.edu.in";

        await _ucAuth.signInWithEmailAndPassword(fakeEmail, pass);

        ucCloseAuth();

        /* Check if new user needs onboarding */
        const user = _ucAuth.currentUser;
        const snap = await _ucDb.collection("users").doc(user.uid).get();

        if (snap.exists && snap.data().isNewUser) {
            ucOpenOnboarding();
        } else {
            ucShowToast("Welcome back! 👋");
        }

    } catch (err) {

        errEl.textContent = ucFirebaseError(err.code);

    } finally {
        btn.disabled    = false;
        btn.textContent = "Login";
    }
}

/* ============================================================
   LOGOUT
   ============================================================ */

async function ucLogout() {
    document.getElementById("uc-profile-dropdown").classList.remove("open");
    await _ucAuth.signOut();
    ucShowToast("Signed out.");
}

/* ============================================================
   ONBOARDING — 4 step wizard
   ============================================================ */

let _ucObStep = 1;

function ucOpenOnboarding() {
    _ucObStep = 1;
    ucShowObStep(1);
    document.getElementById("uc-onboard-overlay").classList.add("active");
}

function ucShowObStep(step) {
    for (let i = 1; i <= 4; i++) {
        document.getElementById("uc-ob-step-" + i).style.display = (i === step) ? "block" : "none";
        const dot = document.getElementById("uc-dot-" + i);
        dot.classList.toggle("done", i <= step);
    }

    const titles = [
        "What's your name?",
        "What are you studying?",
        "Choose your program",
        "Which year are you in?"
    ];

    const subs = [
        "Help us personalise your experience",
        "Select your degree type",
        "Select your specific program",
        "Tell us your current year"
    ];

    document.getElementById("uc-onboard-title").textContent = titles[step - 1];
    document.getElementById("uc-onboard-sub").textContent   = subs[step - 1];
}

function ucUpdatePrograms() {
    const degree  = document.getElementById("uc-ob-degree").value;
    const progSel = document.getElementById("uc-ob-program");

    progSel.innerHTML = '<option value="">Select program...</option>';

    if (SNU_PROGRAMS[degree]) {
        SNU_PROGRAMS[degree].forEach(p => {
            const opt = document.createElement("option");
            opt.value = p;
            opt.textContent = p;
            progSel.appendChild(opt);
        });
    }
}

function ucObNext(step) {
    const errEl = document.getElementById("uc-ob-err-" + step);
    errEl.textContent = "";

    if (step === 1) {
        const name = document.getElementById("uc-ob-name").value.trim();
        if (!name) { errEl.textContent = "Please enter your name."; return; }
    }

    if (step === 2) {
        const degree = document.getElementById("uc-ob-degree").value;
        if (!degree) { errEl.textContent = "Please select a degree."; return; }
        ucUpdatePrograms();
    }

    if (step === 3) {
        const prog = document.getElementById("uc-ob-program").value;
        if (!prog) { errEl.textContent = "Please select a program."; return; }
    }

    _ucObStep = step + 1;
    ucShowObStep(_ucObStep);
}

async function ucObFinish() {
    const errEl   = document.getElementById("uc-ob-err-4");
    const year    = document.getElementById("uc-ob-year").value;

    errEl.textContent = "";

    if (!year) { errEl.textContent = "Please select your year."; return; }

    const name    = document.getElementById("uc-ob-name").value.trim();
    const degree  = document.getElementById("uc-ob-degree").value;
    const program = document.getElementById("uc-ob-program").value;

    const btn = document.querySelector("#uc-ob-step-4 .uc-btn");
    btn.disabled    = true;
    btn.textContent = "Saving...";

    try {
        const user = _ucAuth.currentUser;
        await _ucDb.collection("users").doc(user.uid).update({
            displayName: name,
            degree:      degree,
            program:     program,
            year:        year,
            isNewUser:   false,
            updatedAt:   firebase.firestore.FieldValue.serverTimestamp()
        });

        document.getElementById("uc-onboard-overlay").classList.remove("active");
        ucShowToast("Profile saved! Welcome to UniCompass 🎉");
        
        if (_ucCurrentUser) {
            _ucCurrentUser.displayName = name;
            _ucCurrentUser.degree = degree;
            _ucCurrentUser.program = program;
            _ucCurrentUser.year = year;
            showLoggedIn(name.split(" ")[0], _ucCurrentUser);
        }

    } catch (err) {

        errEl.textContent = "Failed to save. Please try again.";

    } finally {
        btn.disabled    = false;
        btn.textContent = "Finish Setup ✓";
    }
}

/* ============================================================
   NAVBAR / FAB STATE
   ============================================================ */

function showLoggedIn(name, data) {
    _ucCurrentUser = data;

    const initials = (name || "?").charAt(0).toUpperCase();

    /* Update FAB (inner pages) */
    const fab     = document.getElementById("uc-login-fab");
    const fabText = document.getElementById("uc-fab-text");
    if (fab) {
        if (!document.getElementById("uc-fab-avatar")) {
            const av = document.createElement("span");
            av.id = "uc-fab-avatar";
            av.className = "uc-avatar-circle";
            av.textContent = initials;
            fab.insertBefore(av, fabText);
        } else {
            document.getElementById("uc-fab-avatar").textContent = initials;
        }
        fabText.textContent = name || "Profile";
    }

    /* Update navbar button (index.html) */
    const navBtn = document.getElementById("uc-nav-btn");
    if (navBtn) {
        navBtn.innerHTML = `<span style="width:26px;height:26px;border-radius:50%;background:rgba(255,255,255,0.2);display:inline-flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;">${initials}</span> ${name || "Profile"}`;
    }

    /* Fill profile dropdown */
    document.getElementById("uc-dp-name").textContent   = data.displayName || name || "—";
    document.getElementById("uc-dp-roll").textContent   = data.rollNumber  || "—";
    document.getElementById("uc-dp-degree").textContent = data.degree      || "—";
    document.getElementById("uc-dp-year").textContent   = data.year        || "—";
    document.getElementById("uc-dp-avatar").textContent = initials;
}

function showLoggedOut() {
    _ucCurrentUser = null;

    const fab = document.getElementById("uc-login-fab");
    if (fab) {
        const av = document.getElementById("uc-fab-avatar");
        if (av) av.remove();
        const ft = document.getElementById("uc-fab-text");
        if (ft) ft.textContent = "Login";
    }

    const navBtn = document.getElementById("uc-nav-btn");
    if (navBtn) navBtn.innerHTML = "Login";
}

function ucToggleProfileOrLogin() {
    if (_ucAuth?.currentUser) {
        const dd = document.getElementById("uc-profile-dropdown");
        dd.classList.toggle("open");
    } else {
        ucOpenAuth();
    }
}

/* ============================================================
   HELPER — Friendly Firebase Error Messages
   ============================================================ */

function ucFirebaseError(code) {
    const map = {
        "auth/email-already-in-use":    "This roll number is already registered.",
        "auth/wrong-password":          "Incorrect password. Please try again.",
        "auth/user-not-found":          "No account found for this roll number.",
        "auth/too-many-requests":       "Too many attempts. Please wait a moment.",
        "auth/invalid-credential":      "Incorrect roll number or password.",
        "auth/network-request-failed":  "Network error. Check your connection.",
        "auth/weak-password":           "Password must be at least 6 characters.",
        "auth/invalid-email":           "Invalid roll number format."
    };
    return map[code] || "Something went wrong. Please try again.";
}

/* ============================================================
   TOAST
   ============================================================ */

function ucShowToast(msg) {
    const toast = document.getElementById("uc-toast");
    toast.textContent = msg;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2800);
}

/* ============================================================
   NOT CONFIGURED — renders a warning button instead
   ============================================================ */

function renderNotConfigured() {
    injectCSS();

    if (!document.getElementById("uc-nav-btn")) {
        const fab = document.createElement("button");
        fab.id = "uc-login-fab";
        fab.style.background = "#ff4444";
        fab.textContent = "⚠ Auth not configured";
        fab.title = "Replace FIREBASE_CONFIG in auth.js";
        document.body.appendChild(fab);
    }

    const navBtn = document.getElementById("uc-nav-btn");
    if (navBtn) {
        navBtn.style.background = "#ff4444";
        navBtn.textContent = "⚠ Auth not configured";
        navBtn.title = "Replace FIREBASE_CONFIG in auth.js";
    }
}
