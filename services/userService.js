// services/userService.js
import { DEMO_MODE } from "../config/firebase.js";
import { DS } from "../data/demoData.js";
import { NotifService } from "./notifService.js";

export const UserService = {
  getById(uid)       { return DS.users[uid]||null; },
  getDisplayName(uid){ return DS.users[uid]?.name||null; },

  async fetchAll() {
    if (DEMO_MODE) return Object.values(DS.users);
    const s = await window._db.collection("users").get();
    return s.docs.map(d=>({uid:d.id,...d.data()}));
  },

  async updateRole(uid, role) {
    if (DEMO_MODE) { if (DS.users[uid]) DS.users[uid].role=role; return; }
    await window._db.collection("users").doc(uid).update({ role });
  },

  async ban(uid, reason, actorUid) {
    if (DEMO_MODE) {
      const u=DS.users[uid];
      if (!u) return;
      u.status="banned"; u.bannedAt=Date.now(); u.bannedBy=actorUid; u.banReason=reason;
      NotifService._push(uid,"banned",
        `Your account has been suspended. Reason: ${reason}`, null);
      return;
    }
    await window._db.collection("users").doc(uid).update({
      status:"banned", bannedAt:Date.now(), bannedBy:actorUid, banReason:reason
    });
  },

  async unban(uid) {
    if (DEMO_MODE) {
      const u=DS.users[uid];
      if (!u) return;
      u.status="approved"; u.bannedAt=null; u.bannedBy=null; u.banReason=null;
      NotifService._push(uid,"approval","Your account suspension has been lifted.",null);
      return;
    }
    await window._db.collection("users").doc(uid).update({
      status:"approved", bannedAt:null, bannedBy:null, banReason:null
    });
  },
  async updateModerationClass(uid, className) {
  if (DEMO_MODE) {
    if (DS.users[uid]) DS.users[uid].moderatesClass = className;
    return;
  }
  
  await window._db.collection("users").doc(uid).update({
    moderatesClass: className,
    updatedAt: Date.now()
  });
},

  // Check if user can interact (approved + not banned)
  canInteract(user) {
    return user && user.status==="approved";
  },
};
