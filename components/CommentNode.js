// components/CommentNode.js
import { VoteButtons }    from "./VoteButtons.js";
import { AuthorDisplay }  from "./AuthorDisplay.js";
import { ConfirmDialog }  from "./shared.js";
import { CommentService } from "../services/commentService.js";
import { SafetyService }  from "../services/safetyService.js";
import { timeAgo }        from "../utils/helpers.js";
import { outranks }       from "../data/demoData.js";
import { DS }             from "../data/demoData.js";

const { useState } = React;
const e = React.createElement;

export function CommentNode({ comment, allComments, currentUser, postLocked, onReport, onRefresh, depth=0 }) {
  const [replying,   setReplying]   = useState(false);
  const [replyText,  setReplyText]  = useState("");
  const [submitting, setSub]        = useState(false);
  const [replyErr,   setReplyErr]   = useState("");
  const [cooldown,   setCooldown]   = useState(0);
  const [confirm,    setConfirm]    = useState(null);
  const [busy,       setBusy]       = useState(false);

  const role    = currentUser?.role;
  const canMod  = role==="moderator" || role==="admin";
  const isMod   = role==="moderator";
  const isOwner = currentUser?.uid===comment.userId;
  const canAct  = currentUser?.status==="approved";
  const canReply= canAct && !postLocked && depth < 3;

  // Hierarchy: mod cannot act on admin content
  const commentCreatorRole = DS.users[comment.userId]?.role || "student";
  const modCanAct = !(isMod && outranks(commentCreatorRole, role));
  const isSoftDeleted = !!comment.deletedAt;

  const children = allComments.filter(c => c.parentId===comment.id);

  const startCooldownTimer = secs => {
    setCooldown(secs);
    const t = setInterval(()=>{
      setCooldown(s=>{ if(s<=1){clearInterval(t);return 0;} return s-1; });
    },1000);
  };

  const submitReply = async () => {
    setReplyErr("");
    const v = SafetyService.validateComment(replyText);
    if (!v.ok) { setReplyErr(v.error); return; }
    const cd = SafetyService.checkCommentCooldown(currentUser.uid);
    if (!cd.ok) { startCooldownTimer(cd.waitSeconds); return; }
    setSub(true);
    try {
      await CommentService.add({
        postId:   comment.postId,
        userId:   currentUser.uid,
        userRole: currentUser.role,
        content:  replyText.trim(),
        parentId: comment.id,
      });
      SafetyService.recordComment(currentUser.uid);
      setReplyText(""); setReplying(false);
      onRefresh();
    } catch(ex){ setReplyErr(ex.message||"Failed to post reply."); }
    finally { setSub(false); }
  };

  const runAction = async action => {
    setBusy(true);
    try {
      if (action==="softdel") await CommentService.softDelete(comment.id, currentUser.uid);
      if (action==="hardel")  await CommentService.hardDelete(comment.id, currentUser);
      onRefresh();
    } catch(ex){ alert(ex.message); }
    finally { setBusy(false); setConfirm(null); }
  };

  return e("div", {className: depth>0?"comment-reply":""},
    // Content row
    e("div",{style:{display:"flex",gap:10,alignItems:"flex-start"}},
      e("div",{style:{paddingTop:2}},
        e(VoteButtons,{targetId:comment.id, type:"comment", initialVotes:comment.votes, currentUser, layout:"horizontal"}),
      ),
      e("div",{style:{flex:1,minWidth:0}},
        // Author + time
        e("div",{style:{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",marginBottom:4}},
          e(AuthorDisplay,{userId:comment.userId, userRole:comment.userRole, currentUser}),
          e("span",{style:{fontSize:11,color:"var(--muted)"}}, timeAgo(comment.createdAt)),
          isSoftDeleted && e("span",{className:"chip chip-deleted"},"deleted"),
        ),

        // Body
        isSoftDeleted
          ? e("p",{className:"comment-deleted"},"[Deleted by User]")
          : e("p",{style:{fontSize:14,lineHeight:1.65,color:"var(--text)"}}, comment.content),

        // Action row
        !isSoftDeleted && e("div",{style:{display:"flex",gap:6,marginTop:6,flexWrap:"wrap",alignItems:"center"}},
          canReply && e("button",{className:"btn-ghost btn-sm",
            onClick:()=>{setReplying(!replying);setReplyErr("");}},
            replying?"Cancel":"Reply"),

          canAct && !isOwner &&
            e("button",{className:"btn-ghost btn-sm", onClick:()=>onReport(comment.id,"comment")}, "Report"),

          // Owner soft-delete
          isOwner && canAct &&
            e("button",{className:"btn-ghost btn-sm",
              onClick:()=>setConfirm({action:"softdel",label:"Delete Comment",
                msg:"Replace your comment with [Deleted by User]? Thread stays intact."})},
              "Delete"),

          // Mod hard-delete
          canMod && modCanAct &&
            e("button",{className:"btn-danger btn-sm", disabled:busy,
              onClick:()=>setConfirm({action:"hardel",label:"Remove Comment",
                msg:"Permanently remove this comment and clear its reports?"})},
              "Remove"),

          cooldown>0 && e("span",{className:"rate-limit-msg"}, `⏱ ${cooldown}s`),
        ),

        // Reply box
        replying && e("div",{style:{marginTop:10}},
          replyErr && e("div",{className:"alert alert-error",style:{marginBottom:8}}, replyErr),
          e("textarea",{value:replyText, onChange:ev=>setReplyText(ev.target.value),
            rows:3, placeholder:"Write a reply… (min 5 chars)", style:{marginBottom:8}}),
          e("button",{className:"btn-primary btn-sm", onClick:submitReply, disabled:submitting},
            submitting?"Posting…":"Reply"),
        ),
      ),
    ),

    // Children
    children.map(child =>
      e(CommentNode,{key:child.id, comment:child, allComments, currentUser,
        postLocked, onReport, onRefresh, depth:depth+1})
    ),

    // Confirm
    confirm && e(ConfirmDialog,{
      title:       confirm.label,
      message:     confirm.msg,
      confirmLabel:confirm.label,
      danger:      true,
      onConfirm:   ()=>runAction(confirm.action),
      onCancel:    ()=>setConfirm(null),
    }),
  );
}
