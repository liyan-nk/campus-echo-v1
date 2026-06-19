// components/PostCard.js
import { VoteButtons }   from "./VoteButtons.js";
import { AuthorDisplay } from "./AuthorDisplay.js";
import { ConfirmDialog } from "./shared.js";
import { PostService }   from "../services/postService.js";
import { timeAgo }       from "../utils/helpers.js";
import { outranks }      from "../data/demoData.js";
import { DS }            from "../data/demoData.js";

const { useState } = React;
const e = React.createElement;

export function PostCard({ post, currentUser, onOpen, onRefresh, onReport }) {
  const [confirm, setConfirm]   = useState(null); // { action, label, msg }
  const [err,     setErr]       = useState("");
  const [busy,    setBusy]      = useState(false);

  const role     = currentUser?.role;
  const canMod   = role==="moderator" || role==="admin";
  const isAdmin  = role==="admin";
  const isMod    = role==="moderator";
  const isOwner  = currentUser?.uid === post.userId;

  // Hierarchy guards
  const postCreatorRank = DS.users[post.userId]?.role || "student";
  const modCanAct  = !(isMod && outranks(postCreatorRank, role));
  const isFrozen   = !!post.frozenBy && post.frozenBy !== currentUser?.uid;
  const frozenByAdmin = isFrozen && DS.users[post.frozenBy]?.role==="admin";
  const modBlocked = isMod && frozenByAdmin;

  const isHidden  = post.status==="hidden";
  const isLocked  = post.status==="locked";
  const isDeleted = !!post.deletedAt;

  const runAction = async (action) => {
    setBusy(true); setErr("");
    try {
      if (action==="hide")     await PostService.setStatus(post.id, "hidden", currentUser);
      if (action==="unhide")   await PostService.setStatus(post.id, "active", currentUser);
      if (action==="lock")     await PostService.setStatus(post.id, "locked", currentUser);
      if (action==="unlock")   await PostService.setStatus(post.id, "active", currentUser);
      if (action==="delete")   await PostService.hardDelete(post.id, currentUser);
      if (action==="softdel")  await PostService.softDelete(post.id, currentUser.uid);
      onRefresh();
    } catch(ex) { setErr(ex.message); }
    finally { setBusy(false); setConfirm(null); }
  };

  const ask = (action, label, msg, danger=true) =>
    setConfirm({ action, label, msg, danger });

  const cardClass = [
    "post-card",
    isHidden  ? "status-hidden" : "",
    isLocked  ? "status-locked" : "",
    post.frozenBy ? "frozen" : "",
  ].filter(Boolean).join(" ");

  return e("div", null,
    err && e("div",{className:"alert alert-error",style:{marginBottom:6}}, err),

    e("div",{className: cardClass},
      e(VoteButtons,{targetId:post.id, type:"post", initialVotes:post.votes, currentUser}),
      e("div",{className:"post-card-body"},

        // Tag row
        e("div",{style:{display:"flex",alignItems:"center",gap:8,marginBottom:6,flexWrap:"wrap"}},
          e("span",{className:"tag"}, post.category),
          isLocked  && e("span",{className:"chip chip-locked"},  "🔒 Locked"),
          isHidden  && e("span",{className:"chip chip-hidden"},  "🚫 Hidden"),
          post.frozenBy && e("span",{className:"chip chip-frozen"},"🔐 Admin-frozen"),
        ),

        // Title
        e("div",{className:"post-title", onClick:()=>onOpen(post.id)}, post.title),

        // Excerpt
        !isDeleted && e("p",{className:"post-excerpt"}, post.content),

        // Meta
        e("div",{className:"post-meta"},
          e(AuthorDisplay,{userId:post.userId, userRole:post.userRole, currentUser}),
          e("span",null,"·"),
          e("span",null, timeAgo(post.createdAt)),
          e("span",null,"·"),
          e("span",null,`💬 ${post.commentCount}`),
        ),

        // Actions
        e("div",{className:"post-actions"},
          e("button",{className:"btn-ghost btn-sm", onClick:()=>onOpen(post.id)}, "View Thread"),

          // Owner soft-delete
          isOwner && !isDeleted && currentUser &&
            e("button",{className:"btn-ghost btn-sm", disabled:busy,
              onClick:()=>ask("softdel","Delete My Post","This will replace your post content with [Deleted by User]. The thread structure is preserved.")},
              "Delete"),

          // Report (non-owner, approved)
          !isOwner && currentUser?.status==="approved" &&
            e("button",{className:"btn-ghost btn-sm", onClick:()=>onReport(post.id,"post")}, "Report"),

          // Mod / admin tools
          canMod && modCanAct && !modBlocked && e("div",{style:{display:"flex",gap:6,flexWrap:"wrap"}},
            e("button",{className:"btn-ghost btn-sm", disabled:busy || modBlocked,
              onClick:()=>ask(isHidden?"unhide":"hide", isHidden?"Unhide Post":"Hide Post",
                isHidden?"Make this post visible again?":"Hide this post from student feeds?")},
              isHidden?"Unhide":"Hide"),

            e("button",{className:"btn-ghost btn-sm", disabled:busy,
              onClick:()=>ask(isLocked?"unlock":"lock", isLocked?"Unlock Thread":"Lock Thread",
                isLocked?"Re-open this thread for comments?":"Lock this thread? Students cannot comment while locked.")},
              isLocked?"Unlock":"Lock"),

            e("button",{className:"btn-danger btn-sm", disabled:busy,
              onClick:()=>ask("delete","Delete Post","Permanently delete this post and clear all associated reports? This cannot be undone.",true)},
              "Delete"),
          ),

          modBlocked && e("span",{style:{fontSize:11,color:"var(--accent2)",fontFamily:"var(--fm)"}},
            "🔐 Admin action — read only"
          ),
        ),
      ),
    ),

    // Confirm dialog
    confirm && e(ConfirmDialog,{
      title:       confirm.label,
      message:     confirm.msg,
      confirmLabel:confirm.label,
      danger:      confirm.danger,
      onConfirm:   ()=>runAction(confirm.action),
      onCancel:    ()=>setConfirm(null),
    }),
  );
}
