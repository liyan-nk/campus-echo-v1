// services/reportService.js
import { DEMO_MODE } from "../config/firebase.js";
import { DS, nextId } from "../data/demoData.js";

export const ReportService = {
  async submit(targetId, targetType, reason, reporterId) {
    if (DEMO_MODE) {
      const id = nextId();
      DS.reports[id] = {
        id, targetId, targetType, reason, reporterId,
        resolved: false, createdAt: Date.now(),
      };
      return;
    }
    await window._db.collection("reports").add({
      targetId, targetType, reason, reporterId,
      resolved: false, createdAt: Date.now(),
    });
  },

  // Returns unresolved reports, hydrated with content text + postId for linking
  async fetchAll() {
    if (DEMO_MODE) {
      return Object.values(DS.reports)
        .filter(r => !r.resolved)
        .sort((a, b) => b.createdAt - a.createdAt)
        .map(r => {
          let excerpt = "[Content not found]", title = null, postId = null;
          if (r.targetType === "post") {
            const p = DS.posts[r.targetId];
            if (p) { excerpt = (p.content || "").slice(0, 160); title = p.title; postId = p.id; }
          } else if (r.targetType === "comment") {
            const c = DS.comments[r.targetId];
            if (c) { excerpt = (c.content || "").slice(0, 160); postId = c.postId; }
          }
          const reporter = DS.users[r.reporterId];
          return { ...r, excerpt, title, postId, reporterName: reporter?.name || "Unknown" };
        });
    }

    // --- LIVE FIREBASE LOGIC ---
    const s = await window._db.collection("reports").where("resolved", "==", false).get();
    
    // Map and safely fetch content (hydration)
    const reports = await Promise.all(s.docs.map(async d => {
      const r = { id: d.id, ...d.data() };
      let excerpt = "[Content no longer available]", title = null, postId = null;

      try {
        if (r.targetType === "post") {
          const pSnap = await window._db.collection("posts").doc(r.targetId).get();
          if (pSnap.exists) { 
            const p = pSnap.data();
            excerpt = (p.content || "").slice(0, 160); 
            title = p.title; 
            postId = pSnap.id; 
          }
        } else if (r.targetType === "comment") {
          const cSnap = await window._db.collection("comments").doc(r.targetId).get();
          if (cSnap.exists) { 
            const c = cSnap.data();
            excerpt = (c.content || "").slice(0, 160); 
            postId = c.postId; 
          }
        }
      } catch (e) { console.error("Hydration error:", e); }

      return { ...r, excerpt, title, postId };
    }));

    // Safe sorting: handle both Timestamps and Numbers
    return reports.sort((a, b) => {
      const timeA = a.createdAt?.toMillis?.() || a.createdAt || 0;
      const timeB = b.createdAt?.toMillis?.() || b.createdAt || 0;
      return timeB - timeA;
    });
  },

  async dismiss(reportId) {
    if (DEMO_MODE) {
      if (DS.reports[reportId]) DS.reports[reportId].resolved = "dismissed";
      return;
    }
    await window._db.collection("reports").doc(reportId).update({ resolved: "dismissed" });
  },

  // Clears all reports pointing at a target (called after content deletion)
  async resolveByTarget(targetId) {
    if (DEMO_MODE) {
      Object.values(DS.reports)
        .filter(r => r.targetId === targetId)
        .forEach(r => { r.resolved = "deleted"; });
      return;
    }
    const s = await window._db.collection("reports").where("targetId", "==", targetId).get();
    const b = window._db.batch();
    s.docs.forEach(d => b.update(d.ref, { resolved: "deleted" }));
    await b.commit();
  },
};
