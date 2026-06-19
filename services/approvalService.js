// services/approvalService.js
import { DEMO_MODE } from "../config/firebase.js";
import { DS } from "../data/demoData.js";
import { NotifService } from "./notifService.js";

export const ApprovalService = {
  async fetchPending(currentUser) {
    if (DEMO_MODE) {
      const all = Object.values(DS.users).filter(u => u.status==="pending");
      if (currentUser.role==="admin") return all;
      return all.filter(u => u.assignedModeratorId===currentUser.uid);
    }
    let q = window._db.collection("users").where("status","==","pending");
    if (currentUser.role!=="admin") q = q.where("assignedModeratorId","==",currentUser.uid);
    const s = await q.get();
    return s.docs.map(d => ({ uid:d.id, ...d.data() }));
  },

  async approve(uid, actorName) {
    if (DEMO_MODE) {
      if (DS.users[uid]) DS.users[uid].status="approved";
      NotifService._push(uid, "approval",
        `Your account has been approved by ${actorName}. Welcome to Campus Echo!`, null);
      return;
    }
    await window._db.collection("users").doc(uid).update({ status:"approved" });
  },

  async reject(uid, actorName) {
    if (DEMO_MODE) {
      if (DS.users[uid]) DS.users[uid].status="rejected";
      NotifService._push(uid, "rejection",
        `Your account application was not approved. Contact your class moderator for details.`, null);
      return;
    }
    await window._db.collection("users").doc(uid).update({ status:"rejected" });
  },

  async countPending(currentUser) {
    const list = await ApprovalService.fetchPending(currentUser);
    return list.length;
  },
};
