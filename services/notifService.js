// services/notifService.js
import { DEMO_MODE } from "../config/firebase.js";
import { DS, nextId } from "../data/demoData.js";

export const NotifService = {
  // Internal push (used by other services)
  _push(userId, type, message, postId) {
    if (!userId) return;
    if (DEMO_MODE) {
      const id = nextId();
      DS.notifications[id] = { id, userId, type, message, postId, read:false, createdAt:Date.now() };
      return;
    }
    window._db.collection("notifications").add({ userId, type, message, postId, read:false, createdAt:Date.now() });
  },

  async fetchForUser(uid) {
    if (DEMO_MODE)
      return Object.values(DS.notifications)
        .filter(n => n.userId===uid)
        .sort((a,b) => b.createdAt-a.createdAt);
    const s = await window._db.collection("notifications")
      .where("userId","==",uid).orderBy("createdAt","desc").get();
    return s.docs.map(d => ({ id:d.id, ...d.data() }));
  },

  async markRead(id) {
    if (DEMO_MODE) { if (DS.notifications[id]) DS.notifications[id].read=true; return; }
    await window._db.collection("notifications").doc(id).update({ read:true });
  },

  async markAllRead(uid) {
    if (DEMO_MODE) {
      Object.values(DS.notifications).filter(n=>n.userId===uid).forEach(n=>{ n.read=true; });
      return;
    }
    const s = await window._db.collection("notifications").where("userId","==",uid).where("read","==",false).get();
    const b = window._db.batch();
    s.docs.forEach(d => b.update(d.ref,{read:true}));
    await b.commit();
  },

  unreadCount(uid) {
    if (DEMO_MODE)
      return Object.values(DS.notifications).filter(n=>n.userId===uid&&!n.read).length;
    return 0; // real-time listeners needed for Firebase; use fetchForUser
  },
};
