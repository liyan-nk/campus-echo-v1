// pages/App.js — Root component: auth, routing, nav, banners
import { AuthService }    from "../services/authService.js";
import { ApprovalService} from "../services/approvalService.js";
import { NotifService }   from "../services/notifService.js";
import { DEMO_MODE }      from "../config/firebase.js";

import { Sidebar }        from "../components/Sidebar.js";
import { AuthModal }      from "../components/AuthModal.js";

import { FeedPage }          from "./Feed.js";
import { PostDetailPage }    from "./PostDetail.js";
import { CreatePostPage }    from "./CreatePost.js";
import { SearchPage }        from "./Search.js";
import { ProfilePage }       from "./Profile.js";
import { NotificationsPage } from "./Notifications.js";
import { SettingsPage }      from "./Settings.js";
import { DashboardPage }     from "./Dashboard.js";
import { ReportPage }        from "./ReportPage.js";

const { useState, useEffect, useCallback } = React;
const e = React.createElement;

// ── Simple page-stack router ──────────────────────────────────
// page = { name: string, params: object }
// stack allows true "back" navigation
function useRouter() {
  const [stack, setStack] = useState([{ name: "feed", params: {} }]);
  const current = stack[stack.length - 1];

  const push = useCallback((name, params = {}) => {
    setStack(s => [...s, { name, params }]);
    window.scrollTo(0, 0);
  }, []);

  const replace = useCallback((name, params = {}) => {
    setStack(s => [...s.slice(0, -1), { name, params }]);
    window.scrollTo(0, 0);
  }, []);

  const back = useCallback(() => {
    setStack(s => s.length > 1 ? s.slice(0, -1) : s);
    window.scrollTo(0, 0);
  }, []);

  return { current, push, replace, back };
}

export function App() {
  const [currentUser,  setCurrentUser]  = useState(undefined); // undefined = loading
  const [showAuth,     setShowAuth]     = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [unreadCount,  setUnreadCount]  = useState(0);

  const router = useRouter();
  const { current: page, push, back } = router;

  // ── Auth subscription ───────────────────────────────────────
  useEffect(() => {
    return AuthService.onAuthStateChanged(u => setCurrentUser(u ?? null));
  }, []);

  // ── Badge counts ────────────────────────────────────────────
  useEffect(() => {
    if (!currentUser) { setPendingCount(0); setUnreadCount(0); return; }
    if (currentUser.role === "moderator" || currentUser.role === "admin")
      ApprovalService.countPending(currentUser).then(setPendingCount);
    NotifService.fetchForUser(currentUser.uid)
      .then(ns => setUnreadCount(ns.filter(n => !n.read).length));
  }, [currentUser]);

  // ── Navigation helper (gate auth/approval) ──────────────────
  const navigate = useCallback((name, params = {}) => {
    const needsAuth     = ["create","profile","notifs","settings","dashboard","report"];
    const needsApproved = ["create"];
    if (needsAuth.includes(name) && !currentUser) { setShowAuth(true); return; }
    if (needsApproved.includes(name) && currentUser?.status !== "approved") return;
    if (name === "feed" && page.name === "create") {
      router.replace(name, params);
    } else {
      push(name, params);
    }
  }, [currentUser, push, page.name]);

  const handleLogout = useCallback(async () => {
    await AuthService.logout();
    setCurrentUser(null);
    router.replace("feed", {});
  }, []);

  // ── Derived flags ───────────────────────────────────────────
  const canMod    = currentUser && (currentUser.role === "moderator" || currentUser.role === "admin");
  const canPost   = currentUser?.status === "approved";
  const isPending = currentUser?.status === "pending";
  const isBanned  = currentUser?.status === "banned";

  // ── Loading splash ──────────────────────────────────────────
  if (currentUser === undefined)
    return e("div", { style: { display:"flex", alignItems:"center", justifyContent:"center", height:"100vh" } },
      e("div", { className: "spinner" }));

  // ── Page renderer ───────────────────────────────────────────
  const { name, params } = page;
  let pageContent;
  if      (name === "detail"    )  pageContent = e(PostDetailPage,    { postId: params.postId, currentUser, onNavigate: navigate, onBack: back });
  else if (name === "create" && canPost) pageContent = e(CreatePostPage, { currentUser, onNavigate: navigate });
  else if (name === "search"    )  pageContent = e(SearchPage,         { currentUser, onNavigate: navigate });
  else if (name === "profile"   )  pageContent = e(ProfilePage,        { currentUser, onNavigate: navigate });
  else if (name === "notifs"    )  pageContent = e(NotificationsPage,  { currentUser, onNavigate: navigate, onRead: () => setUnreadCount(0) });
  else if (name === "settings"  )  pageContent = e(SettingsPage,       { currentUser, onNavigate: navigate, onLogout: handleLogout });
  else if (name === "dashboard" && canMod) pageContent = e(DashboardPage, { currentUser, onNavigate: navigate });
  else if (name === "report" && currentUser) pageContent = e(ReportPage,  { targetId: params.targetId, targetType: params.targetType, currentUser, onNavigate: navigate });
  else pageContent = e(FeedPage, { currentUser, onNavigate: navigate, initialCategory: params.category || null });

  // ── Top nav ─────────────────────────────────────────────────
  const Nav = e("nav", { className: "nav" },
    e("div", { className: "nav-logo", onClick: () => navigate("feed") }, "Campus Echo"),
    DEMO_MODE && e("span", {
      style: { fontSize:10, color:"var(--warn)", fontFamily:"var(--fm)",
               background:"#fbbf2411", border:"1px solid #fbbf2433", padding:"2px 8px", borderRadius:4 }
    }, "DEMO"),
    e("div", { className: "nav-spacer" }),

    // Notifications button (desktop)
    currentUser && e("button", {
      className: "nav-icon-btn",
      title:     "Notifications",
      onClick:   () => navigate("notifs"),
      style:     { position: "relative" },
    },
      "🔔",
      unreadCount > 0 && e("span", { className: "notif-dot" }),
    ),

    // Dashboard button (mod/admin)
    canMod && e("button", {
      className: "nav-icon-btn",
      title:     "Dashboard",
      onClick:   () => navigate("dashboard"),
      style:     { position: "relative" },
    },
      "📊",
      pendingCount > 0 && e("span", { className: "pending-badge" }, pendingCount),
    ),

    currentUser
      ? e("button", { className: "btn-ghost btn-sm", onClick: handleLogout }, "Sign Out")
      : e("button", { className: "btn-primary btn-sm", onClick: () => setShowAuth(true) }, "Sign In"),
  );

  // ── System banners ───────────────────────────────────────────
  const DemoBar = DEMO_MODE && e("div", { className: "demo-bar" },
    "⚡ Demo Mode — data resets on refresh.",
    !currentUser && e("span", null,
      " ", e("span", { className: "link", onClick: () => setShowAuth(true) }, "Sign in"), " to try all roles."));

  const PendingBanner = isPending && e("div", { className: "pending-banner" },
    "⏳ Your account is awaiting approval from your class moderator. You cannot post or comment until approved.");

  const BannedBanner = isBanned && e("div", { className: "banned-banner" },
    `🚫 Your account is suspended. Reason: ${currentUser.banReason || "Contact an administrator."}`);

  const WelcomeBanner = !currentUser && name === "feed" && e("div", {
    className: "alert alert-info", style: { marginBottom: 16 },
  },
    "👋 Welcome to Campus Echo. ",
    e("span", { className: "link", onClick: () => setShowAuth(true) }, "Sign in"),
    " to post, vote, and comment anonymously.");

  // ── Mobile bottom nav ────────────────────────────────────────
  const BottomNav = e("nav", { className: "bottom-nav" },
    e("button", { className: `bnav-btn ${name==="feed"?"active":""}`,    onClick: () => navigate("feed") },
      e("span", { className: "bnav-icon" }, "🏠"), "Home"),
    e("button", { className: `bnav-btn ${name==="search"?"active":""}`,  onClick: () => navigate("search") },
      e("span", { className: "bnav-icon" }, "🔍"), "Search"),
    canPost
      ? e("button", { className: `bnav-btn ${name==="create"?"active":""}`, onClick: () => navigate("create") },
          e("span", { className: "bnav-icon" }, "✏️"), "Post")
      : e("button", { className: "bnav-btn", style:{ opacity:.4 }, onClick: () => currentUser ? null : setShowAuth(true) },
          e("span", { className: "bnav-icon" }, "✏️"), "Post"),
    e("button", {
      className: `bnav-btn ${name==="notifs"?"active":""}`,
      onClick:   () => currentUser ? navigate("notifs") : setShowAuth(true),
      style:     { position: "relative" },
    },
      e("span", { className: "bnav-icon" }, "🔔"),
      unreadCount > 0 && e("span", {
        style: { position:"absolute", top:6, right:"calc(50% - 14px)",
                 width:8, height:8, background:"var(--danger)", borderRadius:"50%" },
      }),
      "Alerts"),
    e("button", {
      className: `bnav-btn ${name==="profile"?"active":""}`,
      onClick:   () => currentUser ? navigate("profile") : setShowAuth(true),
    },
      e("span", { className: "bnav-icon" }, "👤"), "Profile"),
  );

  return e("div", null,
    DemoBar,
    Nav,
    PendingBanner,
    BannedBanner,

    e("div", { className: "container" },
      e("div", { className: "main-layout" },

        // Desktop sidebar
        e(Sidebar, {
          currentUser,
          activePage:   name,
          onNavigate:   navigate,
          pendingCount,
          unreadCount,
        }),

        // Main content
        e("main", { className: "feed" },
          WelcomeBanner,
          pageContent,
        ),
      ),
    ),

    BottomNav,

    showAuth && e(AuthModal, {
      onClose:   () => setShowAuth(false),
      onSuccess: u  => { setCurrentUser(u); setShowAuth(false); },
    }),
  );
}
