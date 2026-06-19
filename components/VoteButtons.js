// components/VoteButtons.js
import { VoteService } from "../services/voteService.js";
import { UserService }  from "../services/userService.js";
const { useState, useEffect } = React;
const e = React.createElement;

export function VoteButtons({ targetId, type, initialVotes, currentUser, layout="vertical" }) {
  const [votes,    setVotes]    = useState(initialVotes);
  const [userVote, setUserVote] = useState(0);
  const [busy,     setBusy]     = useState(false);

  const canVote = currentUser && UserService.canInteract(currentUser);

  useEffect(()=>{
    if (!canVote) return;
    VoteService.getUserVote(currentUser.uid, targetId)
      .then(v => { if (v) setUserVote(v.value); });
  }, [currentUser, targetId]);

  const handleVote = async val => {
    if (!canVote||busy) return;
    setBusy(true);
    const prev    = userVote;
    const newVote = prev===val ? 0 : val;
    // Optimistic update
    setVotes(v => v+(newVote-prev));
    setUserVote(newVote);
    try {
      await VoteService.vote(currentUser.uid, targetId, val, type);
    } catch {
      // Rollback
      setVotes(v => v-(newVote-prev));
      setUserVote(prev);
    } finally { setBusy(false); }
  };

  const upCls   = `vote-btn up   ${userVote=== 1?"active":""}`;
  const downCls = `vote-btn down ${userVote===-1?"active":""}`;

  if (layout==="horizontal") {
    return e("span",{style:{display:"inline-flex",alignItems:"center",gap:2}},
      e("button",{className:upCls,   onClick:()=>handleVote(1),  disabled:!canVote||busy},"▲"),
      e("span",  {className:"vote-count"}, votes),
      e("button",{className:downCls, onClick:()=>handleVote(-1), disabled:!canVote||busy},"▼"),
    );
  }
  return e("div",{className:"post-card-vote"},
    e("button",{className:upCls,   onClick:()=>handleVote(1),  disabled:!canVote||busy},"▲"),
    e("span",  {className:"vote-count"}, votes),
    e("button",{className:downCls, onClick:()=>handleVote(-1), disabled:!canVote||busy},"▼"),
  );
}
