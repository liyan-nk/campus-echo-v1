// bootstrap.js — Application entry point
import { FIREBASE_CONFIG, DEMO_MODE } from "./config/firebase.js";
import { App } from "./pages/App.js";

// UMD React/ReactDOM are already on window from <script> tags.
// Re-expose so ES modules can reference them without imports.
window.React    = window.React    || React;
window.ReactDOM = window.ReactDOM || ReactDOM;

if (!DEMO_MODE) {
  if (typeof firebase === "undefined") {
    console.error("Firebase SDK not loaded. Uncomment the Firebase <script> tags in index.html.");
  } else {
    const app        = firebase.initializeApp(FIREBASE_CONFIG);
    window._auth     = firebase.auth(app);
    window._db       = firebase.firestore(app);
    console.info("Firebase initialised:", FIREBASE_CONFIG.projectId);
  }
} else {
  console.info("Campus Echo — Demo Mode active.");
}

ReactDOM.createRoot(document.getElementById("root"))
  .render(React.createElement(App));
