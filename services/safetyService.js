// services/safetyService.js
const BANNED_WORDS = ["slur1","badword","offensive"]; // extend as needed
const _rl = {}; // { uid: { posts:[ts], lastComment:ts } }
const rec = uid => { if (!_rl[uid]) _rl[uid]={posts:[],lastComment:0}; return _rl[uid]; };

export const SafetyService = {
  checkContent(text) {
    const l = text.toLowerCase();
    for (const w of BANNED_WORDS) if (l.includes(w)) return { ok:false };
    return { ok:true };
  },
  validatePost(title, content) {
    if (!title || title.trim().length < 5)    return { ok:false, error:"Title must be at least 5 characters." };
    if (!content || content.trim().length < 15) return { ok:false, error:"Content must be at least 15 characters." };
    if (!SafetyService.checkContent(title).ok)   return { ok:false, error:"Title contains prohibited language." };
    if (!SafetyService.checkContent(content).ok)  return { ok:false, error:"Content contains prohibited language." };
    return { ok:true };
  },
  validateComment(content) {
    if (!content || content.trim().length < 5) return { ok:false, error:"Comment must be at least 5 characters." };
    if (!SafetyService.checkContent(content).ok) return { ok:false, error:"Comment contains prohibited language." };
    return { ok:true };
  },
  checkPostRateLimit(uid) {
    const now = Date.now(), r = rec(uid);
    r.posts = r.posts.filter(ts => ts > now - 86400000);
    if (r.posts.length >= 3) return { ok:false, error:"Max 3 posts per day." };
    return { ok:true };
  },
  recordPost(uid)    { rec(uid).posts.push(Date.now()); },
  checkCommentCooldown(uid) {
    const elapsed = Date.now() - rec(uid).lastComment;
    if (elapsed < 10000) return { ok:false, waitSeconds: Math.ceil((10000-elapsed)/1000) };
    return { ok:true };
  },
  recordComment(uid) { rec(uid).lastComment = Date.now(); },
};
