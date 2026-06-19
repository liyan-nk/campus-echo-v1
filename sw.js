// sw.js - Service Worker for Campus Echo PWA
const CACHE_NAME = "campus-echo-v3-cache-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./404.html",
  "./bootstrap.js",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./styles/main.css",
  "./utils/helpers.js",
  "./config/firebase.js",
  "./data/demoData.js",
  
  // Components
  "./components/shared.js",
  "./components/VoteButtons.js",
  "./components/AuthorDisplay.js",
  "./components/AuthModal.js",
  "./components/Sidebar.js",
  "./components/PostCard.js",
  "./components/CommentNode.js",

  // Services
  "./services/approvalService.js",
  "./services/authService.js",
  "./services/commentService.js",
  "./services/notifService.js",
  "./services/postService.js",
  "./services/reportService.js",
  "./services/safetyService.js",
  "./services/userService.js",
  "./services/voteService.js",

  // Pages
  "./pages/App.js",
  "./pages/Feed.js",
  "./pages/CreatePost.js",
  "./pages/PostDetail.js",
  "./pages/Profile.js",
  "./pages/Notifications.js",
  "./pages/Search.js",
  "./pages/ReportPage.js",
  "./pages/Settings.js",
  "./pages/Dashboard.js",

  // CDNs
  "https://unpkg.com/react@18/umd/react.development.js",
  "https://unpkg.com/react-dom@18/umd/react-dom.development.js",
  "https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js",
  "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth-compat.js",
  "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore-compat.js",
  "https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Syne:wght@700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,400&display=swap"
];

// Install Event
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log("Caching all static shell assets");
      return cache.addAll(ASSETS);
    })
  );
});

// Activate Event
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log("Clearing old cache:", key);
            return caches.delete(key);
          }
        })
      );
    })
  );
});

// Fetch Event - Cache First with Network Fallback
self.addEventListener("fetch", event => {
  // Only cache GET requests
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then(networkResponse => {
        // Cache dynamic fetches (like fonts/images loaded at runtime)
        if (networkResponse.status === 200) {
          const cacheCopy = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, cacheCopy);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Fallback for offline HTML
        if (event.request.headers.get("accept") && event.request.headers.get("accept").includes("text/html")) {
          return caches.match("./index.html");
        }
      });
    })
  );
});
