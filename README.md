# Campus Echo

An anonymous discussion and messaging web application designed for university environments. Students can share feedback, ask questions, and engage in campus life completely anonymously. Faculty, moderators, and admins have custom verification, role Badges, and content moderation tools to maintain community guidelines.

```
Visitor
 │
 ├── (Read Only) ──► Browse Feed & Search
 │
 └── (Register) ───► Awaiting Moderator Approval (Assigned class moderator)
                       │
                       └── (Approved) ──► Post, comment, and vote anonymously
```

---

## Features

### 🔒 Anonymous Student Interaction
* Post discussions, write comments, and vote up/down anonymously.
* Usernames are masked (displayed as `Anonymous`) to protect identities.
* Administrators have audit privileges to see student names when reviewing reports.

### 🎓 Verified Faculty & Moderation
* Faculty posts and replies display real names and verified badges (`🎓 Faculty`).
* Class moderators (`⚖️ Mod`) approve or reject new students signing up within their batch.
* Moderators and admins can lock threads, hide abusive posts, or suspend accounts.

### ⚡ Offline Demo Sandbox Mode
* Built-in local mock database (`data/demoData.js`) that runs completely inside the browser.
* Try all roles (Student, Faculty, Moderator, Admin) instantly using quick login buttons without setting up database credentials.

---

## Tech Stack
* **Frontend**: React 18 (Loaded via CDN)
* **Styling**: Modern dark CSS with custom font family (`Syne`, `DM Sans`, `DM Mono`)
* **Database & Auth**: Google Firebase (v9 Compat SDK)
* **Serving & Hosting**: Firebase Hosting

---

## Directory Structure

```
campus-echo-v3/
├── config/
│   └── firebase.js          # Credentials & toggle between Demo and Live database
├── data/
│   └── demoData.js          # In-memory mock database (active when DEMO_MODE = true)
├── components/
│   ├── shared.js            # Small presentational UI blocks (badges, confirmation modals)
│   ├── VoteButtons.js       # Up/Down vote handling (optimistic updates)
│   ├── AuthorDisplay.js     # User visibility mask rules
│   ├── AuthModal.js         # SignIn/SignUp form & Demo role switcher
│   ├── Sidebar.js           # Navigation layout links
│   ├── PostCard.js          # Discussion list item card
│   └── CommentNode.js       # Thread replies (recursive node)
├── services/                # Backend API connectors
├── pages/                   # SPA page views
├── styles/
│   └── main.css             # Main styling rules
├── utils/
│   └── helpers.js           # Date and text helper utilities
├── index.html               # Main entry HTML
└── bootstrap.js             # Initializes Firebase app & mounts React node
```

---

## Getting Started

### Prerequisites
To run the project, you only need a local static web server. No compilations or packages downloads are required.

Recommended utility:
* Node.js (which includes `npx`)

### Running Locally

#### 1. Clone the repository
```bash
git clone https://github.com/liyan-nk/campus-echo-v1.git
cd campus-echo-v1
```

#### 2. Run the application
Start a local static server inside the project root:
```bash
# Using Node's serve helper
npx serve .

# Or using Python's built-in server
python -m http.server 8000
```
Open [http://localhost:3000](http://localhost:3000) (or port 8000) in your web browser.

---

## Firebase Configuration (Production setup)

To transition from the local in-memory sandbox to your own live Firebase database:

### 1. Create a Firebase Project
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Create a new project named `campus-echo`.
3. Enable **Firebase Authentication** (enable Email/Password provider).
4. Create a **Cloud Firestore** database.

### 2. Configure Local Web App Credentials
Edit the file `config/firebase.js` and input your project credentials:

```javascript
// config/firebase.js
export const FIREBASE_CONFIG = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```
Setting a valid `apiKey` automatically disables `DEMO_MODE` and configures the application to talk to Firestore.

### 3. Setup Firestore Indexes
If you sort or query comments, you will need to add a composite index on Firestore:
* **Collection**: `notifications`
  * Fields: `userId` (Ascending), `createdAt` (Descending)

---

## Deployment

Deploy your application using the Firebase CLI:

```bash
# Install CLI
npm install -g firebase-tools

# Login to Google Account
firebase login

# Bind workspace to your project id
firebase use default

# Deploy assets
firebase deploy --only hosting
```

---

## Troubleshooting & Common Questions

#### 1. "Uncaught ReferenceError: firebase is not defined"
* **Reason**: The page failed to fetch Firebase SDK compat files from the Google CDN.
* **Fix**: Verify your computer has internet connection or check CDN scripts inside `index.html`.

#### 2. "Notifications unread count is stuck at 0"
* **Reason**: Live Firebase mode doesn't support real-time notification listener badges in `notifService.js` (line 43).
* **Fix**: Refactor `unreadCount` to execute query snapshot listeners against the database.

#### 3. "My registration is pending approval but there's no moderator"
* **Reason**: In Demo Mode, click "Sign In" and choose any moderator account from the quick login bar (e.g., "Mod S2 CSE") to approve pending accounts.

---

## Future Roadmap & Modernization
To scale the application, the following updates are planned:
1. **Migration to Vite Build Tools**: Move dependencies into package managers (`npm install`) to compile assets and remove global script CDN targets.
2. **React Hooks & JSX**: Refactor `React.createElement` declarations to JSX formatting.
3. **Database-backed Rate Limiting**: Move SafetyService validation properties to cloud checks.
