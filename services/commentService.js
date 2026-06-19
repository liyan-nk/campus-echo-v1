// services/commentService.js
import { DEMO_MODE } from "../config/firebase.js";
import { DS, nextId, outranks } from "../data/demoData.js";
import { NotifService } from "./notifService.js";

export const CommentService = {
  async fetchByPost(postId) {
    if (DEMO_MODE)
      return Object.values(DS.comments)
        .filter(c=>c.postId===postId)
        .sort((a,b)=>a.createdAt-b.createdAt);
    const s = await window._db.collection("comments").where("postId","==",postId).get();
    return s.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>a.createdAt.toMillis()-b.createdAt.toMillis());
  },

  async fetchByUser(userId) {
    if (DEMO_MODE)
      return Object.values(DS.comments)
        .filter(c=>c.userId===userId && !c.deletedAt)
        .sort((a,b)=>b.createdAt-a.createdAt);
    const s = await window._db.collection("comments").where("userId","==",userId).get();
    return s.docs.map(d=>({id:d.id,...d.data()})).filter(c=>!c.deletedAt)
      .sort((a,b)=>b.createdAt.toMillis()-a.createdAt.toMillis());
  },

  async add({ postId, userId, userRole, content, parentId=null }) {
    if (DEMO_MODE) {
      const id = nextId();
      const comment = { id, postId, userId, userRole, content,
        votes:1, parentId, deletedAt:null, frozenBy:null, createdAt:Date.now() };
      DS.comments[id] = comment;
      if (DS.posts[postId]) DS.posts[postId].commentCount++;
      // auto-upvote from creator
      DS.votes[`${userId}_${id}`] = { userId, targetId:id, value:1, type:"comment" };
      // notify parent comment author of reply
      if (parentId && DS.comments[parentId]) {
        const parentAuthorId = DS.comments[parentId].userId;
        if (parentAuthorId!==userId) {
          const post = DS.posts[postId];
          NotifService._push(parentAuthorId, "reply",
            `Someone replied to your comment on "${post?.title||"a post"}".`, postId);
        }
      }
      return comment;
    }
    const ref = window._db.collection("comments").doc();
    const comment = { id:ref.id, postId, userId, userRole, content,
      votes:1, parentId, deletedAt:null, frozenBy:null,
      createdAt:firebase.firestore.FieldValue.serverTimestamp() };
    await ref.set(comment);
    await window._db.collection("posts").doc(postId)
      .update({ commentCount:firebase.firestore.FieldValue.increment(1) });
    await window._db.collection("votes").doc(`${userId}_${ref.id}`)
      .set({ userId, targetId:ref.id, value:1, type:"comment" });
    return comment;
  },

  // Soft-delete by the comment's own author
  async softDelete(commentId, userId) {
    if (DEMO_MODE) {
      const c = DS.comments[commentId];
      if (!c || c.userId!==userId) throw new Error("Not authorized.");
      c.content   = "[Deleted by User]";
      c.deletedAt = Date.now();
      return;
    }
    await window._db.collection("comments").doc(commentId).update({
      content:"[Deleted by User]",
      deletedAt:firebase.firestore.FieldValue.serverTimestamp()
    });
  },

  // Hard-remove by mod/admin — hierarchy-checked
  async hardDelete(commentId, actor) {
    if (DEMO_MODE) {
      const c = DS.comments[commentId];
      if (!c) return;
      if (actor.role==="moderator" && outranks(c.userRole, actor.role))
        throw new Error("Moderators cannot remove content created by Admins.");
      delete DS.comments[commentId];
      // clear associated reports
      Object.values(DS.reports).filter(r=>r.targetId===commentId).forEach(r=>delete DS.reports[r.id]);
      return;
    }
    await window._db.collection("comments").doc(commentId).delete();
  },
};
