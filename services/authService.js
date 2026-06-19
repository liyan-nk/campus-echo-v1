// services/authService.js
import { DEMO_MODE }    from "../config/firebase.js";
import { DS, nextId }   from "../data/demoData.js";
import { NotifService } from "./notifService.js";

let _demoUser = null;
let _subs = [];
const notify = u => _subs.forEach(fn => fn(u));

const findMod = cls => {
  const m = Object.values(DS.users).find(
    u => u.role==="moderator" && u.moderatesClass===cls && u.status==="approved");
  if (m) return m.uid;
  const a = Object.values(DS.users).find(u => u.role==="admin");
  return a ? a.uid : null;
};

export const AuthService = {
  onAuthStateChanged(cb) {
    if (DEMO_MODE) {
      _subs.push(cb);
      setTimeout(() => cb(_demoUser), 0);
      return () => { _subs = _subs.filter(f => f !== cb); };
    }
    return window._auth.onAuthStateChanged(async fu => {
      if (!fu) { cb(null); return; }
      const s = await window._db.collection("users").doc(fu.uid).get();
      cb(s.exists ? { uid: fu.uid, ...s.data() } : null);
    });
  },

  async login(email, password) {
    if (DEMO_MODE) {
      const u = Object.values(DS.users).find(u => u.email === email);
      if (!u) throw new Error("No account found with that email.");
      _demoUser = u; notify(u); return u;
    }
    const c = await window._auth.signInWithEmailAndPassword(email, password);
    const s = await window._db.collection("users").doc(c.user.uid).get();
    return { uid: c.user.uid, ...s.data() };
  },

  async signup(email, password, name, className) {
    if (DEMO_MODE) {
      if (Object.values(DS.users).find(u => u.email === email))
        throw new Error("An account with that email already exists.");
      const uid   = nextId();
      const modId = findMod(className);
      const u = {
        uid, email, name, role: "student", status: "pending", verified: false,
        class: className, moderatesClass: null, assignedModeratorId: modId,
        bannedAt: null, bannedBy: null, banReason: null, createdAt: Date.now(),
      };
      DS.users[uid] = u;
      _demoUser = u;
      notify(u);
      NotifService._push(modId, "pending",
        `New student ${name} (${className}) is awaiting your approval.`, null);
      return u;
    }
    const c = await window._auth.createUserWithEmailAndPassword(email, password);
    const modId = await _findModFirestore(className);
    const u = {
      uid: c.user.uid, email, name, role: "student", status: "pending", verified: false,
      class: className, moderatesClass: null, assignedModeratorId: modId,
      bannedAt: null, bannedBy: null, banReason: null, createdAt: Date.now(),
    };
    await window._db.collection("users").doc(u.uid).set(u);
    return u;
  },

  async logout() {
    if (DEMO_MODE) { _demoUser = null; notify(null); return; }
    await window._auth.signOut();
  },
};

async function _findModFirestore(cls) {
  const s = await window._db.collection("users")
    .where("role", "==", "moderator")
    .where("moderatesClass", "==", cls)
    .where("status", "==", "approved")
    .limit(1).get();
  if (!s.empty) return s.docs[0].id;
  const a = await window._db.collection("users").where("role", "==", "admin").limit(1).get();
  return a.empty ? null : a.docs[0].id;
}
