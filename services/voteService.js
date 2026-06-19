// services/voteService.js
import { DEMO_MODE } from "../config/firebase.js";
import { DS } from "../data/demoData.js";

export const VoteService = {
  async getUserVote(userId, targetId) {
    const key = `${userId}_${targetId}`;
    if (DEMO_MODE) return DS.votes[key]||null;
    const s = await window._db.collection("votes").doc(key).get();
    return s.exists ? s.data() : null;
  },

  async vote(userId, targetId, value, type) {
    const key = `${userId}_${targetId}`;
    if (DEMO_MODE) {
      const ex = DS.votes[key];
      let delta = 0;
      if (ex) {
        if (ex.value===value) { delete DS.votes[key]; delta=-value; }
        else { delta=value-ex.value; DS.votes[key]={userId,targetId,value,type}; }
      } else { DS.votes[key]={userId,targetId,value,type}; delta=value; }
      if (type==="post"    && DS.posts[targetId])    DS.posts[targetId].votes+=delta;
      if (type==="comment" && DS.comments[targetId]) DS.comments[targetId].votes+=delta;
      return { delta, newValue: DS.votes[key]?.value ?? 0 };
    }
    const snap = await window._db.collection("votes").doc(key).get();
    let delta=0;
    if (snap.exists) {
      const ex=snap.data();
      if (ex.value===value) { await window._db.collection("votes").doc(key).delete(); delta=-value; }
      else { delta=value-ex.value; await window._db.collection("votes").doc(key).set({userId,targetId,value,type}); }
    } else { await window._db.collection("votes").doc(key).set({userId,targetId,value,type}); delta=value; }
    const col=type==="post"?"posts":"comments";
    await window._db.collection(col).doc(targetId).update({votes:firebase.firestore.FieldValue.increment(delta)});
    return { delta };
  },
};
