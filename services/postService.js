// services/postService.js
import { DEMO_MODE } from "../config/firebase.js";
import { DS, nextId, roleRank, outranks } from "../data/demoData.js";
import { NotifService } from "./notifService.js";

export const PostService = {
  async fetchAll(sort="newest") {
    if (DEMO_MODE) {
      const posts = Object.values(DS.posts).filter(p => !p.deletedAt);
      return sort==="top"
        ? posts.sort((a,b)=>b.votes-a.votes)
        : posts.sort((a,b)=>b.createdAt-a.createdAt);
    }
    const s = await window._db.collection("posts").where("deletedAt","==",null).get();
    let posts = s.docs.map(d=>({id:d.id,...d.data()}));
    return sort==="top" ? posts.sort((a,b)=>b.votes-a.votes)
                        : posts.sort((a,b)=>b.createdAt.toMillis()-a.createdAt.toMillis());
  },

  async search(query) {
    const q = query.toLowerCase();
    if (DEMO_MODE)
      return Object.values(DS.posts)
        .filter(p => !p.deletedAt && (
          p.title.toLowerCase().includes(q) ||
          p.content.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
        ))
        .sort((a,b)=>b.createdAt-a.createdAt);
    // Firestore full-text search requires external service; client-side fallback
    const all = await PostService.fetchAll("newest");
    return all.filter(p => p.title.toLowerCase().includes(q)||p.content.toLowerCase().includes(q));
  },

  async getById(id) {
    if (DEMO_MODE) return DS.posts[id]||null;
    const s = await window._db.collection("posts").doc(id).get();
    return s.exists ? {id:s.id,...s.data()} : null;
  },

  // Returns posts by a specific user (for profile page)
  async fetchByUser(userId) {
    if (DEMO_MODE)
      return Object.values(DS.posts)
        .filter(p=>p.userId===userId && !p.deletedAt)
        .sort((a,b)=>b.createdAt-a.createdAt);
    const s = await window._db.collection("posts").where("userId","==",userId).get();
    return s.docs.map(d=>({id:d.id,...d.data()})).filter(p=>!p.deletedAt)
      .sort((a,b)=>b.createdAt.toMillis()-a.createdAt.toMillis());
  },

  async create({ title, content, category, userId, userRole }) {
    if (DEMO_MODE) {
      const id = nextId();
      const post = { id, title, content, category, userId, userRole,
        votes:1, commentCount:0, status:"active", frozenBy:null,
        deletedAt:null, createdAt:Date.now() };
      DS.posts[id] = post;
      // auto-upvote from creator
      DS.votes[`${userId}_${id}`] = { userId, targetId:id, value:1, type:"post" };
      return post;
    }
    const ref = window._db.collection("posts").doc();
    const post = { id:ref.id, title, content, category, userId, userRole,
      votes:1, commentCount:0, status:"active", frozenBy:null,
      deletedAt:null, createdAt:firebase.firestore.FieldValue.serverTimestamp() };
    await ref.set(post);
    await window._db.collection("votes").doc(`${userId}_${ref.id}`)
      .set({ userId, targetId:ref.id, value:1, type:"post" });
    return post;
  },

  // Soft-delete by owner
  async softDelete(postId, userId) {
    if (DEMO_MODE) {
      const p = DS.posts[postId];
      if (!p || p.userId!==userId) throw new Error("Not authorized.");
      p.deletedAt = Date.now();
      p.content   = "[Deleted by User]";
      p.title     = "[Deleted]";
      return;
    }
    await window._db.collection("posts").doc(postId).update({
      deletedAt: firebase.firestore.FieldValue.serverTimestamp(),
      content:"[Deleted by User]", title:"[Deleted]"
    });
  },

  // Hard-delete by mod/admin (from dashboard)
  async hardDelete(postId, actor) {
    if (DEMO_MODE) {
      const p = DS.posts[postId];
      if (!p) return;

      // 1. Moderator cannot delete content created by admins
      if (actor.role === "moderator" && outranks(p.userRole, actor.role))
        throw new Error("Moderators cannot delete content created by Admins.");

      // 2. NEW: Moderator cannot delete content frozen by an Admin
      if (actor.role === "moderator" && p.frozenBy) {
        const freezer = DS.users[p.frozenBy];
        if (freezer && outranks(freezer.role, actor.role))
          throw new Error("This post is frozen by an Admin and cannot be deleted by a Moderator.");
      }

      delete DS.posts[postId];
      Object.values(DS.reports).filter(r => r.targetId === postId).forEach(r => delete DS.reports[r.id]);
      return;
    }
    
    // For live Firebase, ensure your Security Rules match this logic
    await window._db.collection("posts").doc(postId).delete();
  },

  // Hierarchy-enforced status change (lock / hide / active)
  async setStatus(postId, status, actor) {
    if (DEMO_MODE) {
      const p = DS.posts[postId];
      if (!p) return;

      // Moderator cannot override an admin freeze
      if (p.frozenBy && actor.role==="moderator") {
        const freezer = DS.users[p.frozenBy];
        if (freezer && outranks(freezer.role, actor.role))
          throw new Error("This post was actioned by an Admin and cannot be changed by a Moderator.");
      }
      // Moderator cannot act on admin-created posts
      if (actor.role==="moderator" && outranks(p.userRole, actor.role))
        throw new Error("Moderators cannot modify content created by Admins.");

      p.status   = status;
      p.frozenBy = actor.role==="admin" ? actor.uid : null;

      // notify commenters if locked/hidden
      if (status==="locked"||status==="hidden") {
        const affected = new Set(Object.values(DS.comments).filter(c=>c.postId===postId).map(c=>c.userId));
        affected.forEach(uid => {
          if (uid!==actor.uid)
            NotifService._push(uid, status,
              `A post you engaged with has been ${status} by a moderator.`, postId);
        });
      }
      return;
    }
    await window._db.collection("posts").doc(postId).update({ status, frozenBy: actor.role==="admin"?actor.uid:null });
  },
};
