// pages/PostDetail.js — Full thread view with hierarchy-aware commenting
import { VoteButtons }    from "../components/VoteButtons.js";
import { AuthorDisplay }  from "../components/AuthorDisplay.js";
import { CommentNode }    from "../components/CommentNode.js";
import { PostService }    from "../services/postService.js";
import { CommentService } from "../services/commentService.js";
import { SafetyService }  from "../services/safetyService.js";
import { UserService }    from "../services/userService.js";
import { timeAgo }        from "../utils/helpers.js";
import { DS }             from "../data/demoData.js";

const { useState, useEffect, useCallback } = React;
const e = React.createElement;

export function PostDetailPage({ postId, currentUser, onNavigate, onBack }) {
  const [post,       setPost]       = useState(null);
  const [comments,   setComments]   = useState([]);
  const [text,       setText]       = useState("");
  const [loading,    setLoading]    = useState(true);
  const [submitting, setSub]        = useState(false);
  const [commentErr, setCommentErr] = useState("");
  const [cooldown,   setCooldown]   = useState(0);

  const role     = currentUser?.role;
  const isLocked = post?.status === "locked";

  // Who can comment on a locked thread: mods, admins, faculty (but not students)
  const canComment = (() => {
    if (!currentUser || !UserService.canInteract(currentUser)) return false;
    if (!isLocked) return true;
    return role === "moderator" || role === "admin" || role === "faculty";
  })();

  const isFrozenByAdmin = post?.frozenBy && DS.users[post.frozenBy]?.role === "admin";
  const isMod = role === "moderator";

  const loadAll = useCallback(() => {
    Promise.all([PostService.getById(postId), CommentService.fetchByPost(postId)])
      .then(([p, cs]) => { setPost(p); setComments(cs); setLoading(false); });
  }, [postId]);

  useEffect(() => { setLoading(true); loadAll(); }, [loadAll]);

  const startCooldown = secs => {
    setCooldown(secs);
    const t = setInterval(() => {
      setCooldown(s => { if (s <= 1) { clearInterval(t); return 0; } return s - 1; });
    }, 1000);
  };

  const submitComment = async () => {
    setCommentErr("");
    const v = SafetyService.validateComment(text);
    if (!v.ok) { setCommentErr(v.error); return; }
    const cd = SafetyService.checkCommentCooldown(currentUser.uid);
    if (!cd.ok) { startCooldown(cd.waitSeconds); return; }
    setSub(true);
    try {
      await CommentService.add({
        postId, userId: currentUser.uid,
        userRole: currentUser.role,
        content: text.trim(), parentId: null,
      });
      SafetyService.recordComment(currentUser.uid);
      setText("");
      loadAll();
    } catch (ex) { setCommentErr(ex.message || "Failed to post comment."); }
    finally { setSub(false); }
  };

  const goBack = onBack || (() => onNavigate("feed"));

  if (loading) return e("div", { className: "spinner" });
  if (!post)   return e("div", { className: "alert alert-error" }, "Post not found.");

  const rootComments = comments.filter(c => !c.parentId);

  return e("div", null,
    e("button", { className:"btn-ghost", style:{ marginBottom:16 }, onClick: goBack }, "← Back"),

    // Post card
    e("div", { className:"card", style:{ marginBottom:16 } },
      // Status chips
      e("div", { style:{ display:"flex", alignItems:"center", gap:8, marginBottom:10, flexWrap:"wrap" } },
        e("span", { className:"tag" }, post.category),
        isLocked          && e("span", { className:"chip chip-locked" }, "🔒 Locked"),
        post.status==="hidden" && e("span", { className:"chip chip-hidden" }, "🚫 Hidden"),
        post.frozenBy     && e("span", { className:"chip chip-frozen"  }, "🔐 Admin-frozen"),
      ),

      // Frozen notice for moderators
      isFrozenByAdmin && isMod && e("div", { className:"frozen-notice" },
        "🔐 This thread was actioned by an Admin. Moderators cannot change its status."),

      e("h1", { style:{ fontFamily:"var(--fh)", fontSize:22, lineHeight:1.3, marginBottom:10 } }, post.title),

      e("div", { style:{ display:"flex", alignItems:"center", gap:10, marginBottom:14, flexWrap:"wrap" } },
        e(AuthorDisplay, { userId:post.userId, userRole:post.userRole, currentUser }),
        e("span",        { style:{ color:"var(--muted)", fontSize:12 } }, timeAgo(post.createdAt)),
        e(VoteButtons,   { targetId:post.id, type:"post", initialVotes:post.votes, currentUser, layout:"horizontal" }),
      ),

      e("p", { style:{ lineHeight:1.75, color:"var(--subtle)", whiteSpace:"pre-wrap" } }, post.content),

      // Report button (non-owner, approved)
      currentUser && currentUser.uid !== post.userId && currentUser.status === "approved" &&
        e("div", { style:{ marginTop:14 } },
          e("button", {
            className: "btn-ghost btn-sm",
            onClick:   () => onNavigate("report", { targetId:post.id, targetType:"post" }),
          }, "Report post"),
        ),
    ),

    // Comments section
    e("div", { className:"card" },
      e("h3", { style:{ fontSize:16, marginBottom:16, fontFamily:"var(--fh)" } },
        `${post.commentCount || 0} Comment${post.commentCount !== 1 ? "s" : ""}`),

      // Locked warning for students
      isLocked && !canComment && e("div", { className:"alert alert-warn" },
        "🔒 This thread is locked. New comments are restricted."),

      // Comment input box
      canComment
        ? e("div", { style:{ marginBottom:20 } },
            commentErr && e("div", { className:"alert alert-error" }, commentErr),
            cooldown > 0 && e("div", { className:"rate-limit-msg", style:{ marginBottom:8 } },
              `⏱ Wait ${cooldown}s before commenting again.`),
            e("textarea", {
              value:       text,
              onChange:    ev => setText(ev.target.value),
              placeholder: "Add a comment… (min 5 chars)",
              rows:        3,
              style:       { marginBottom:8 },
              disabled:    cooldown > 0,
            }),
            e("div", { style:{ display:"flex", justifyContent:"flex-end" } },
              e("button", {
                className: "btn-primary btn-sm",
                onClick:   submitComment,
                disabled:  submitting || cooldown > 0,
              }, submitting ? "Posting…" : "Post Comment"),
            ),
          )
        : currentUser && e("div", { className:"alert alert-error", style:{ marginBottom:16 } },
            currentUser.status === "pending" ? "Your account is under review. You cannot comment yet."
            : currentUser.status === "banned" ? "Your account is suspended."
            : "Commenting is restricted on this thread."),

      !currentUser && e("div", { className:"alert alert-info", style:{ marginBottom:16 } },
        "Sign in to join the discussion."),

      // Comment tree
      rootComments.length === 0
        ? e("div", { style:{ textAlign:"center", padding:"24px 0", color:"var(--muted)" } },
            "No comments yet. Be the first!")
        : rootComments.map(c =>
            e("div", { key:c.id, className:"comment-root" },
              e(CommentNode, {
                comment:    c,
                allComments: comments,
                currentUser,
                postLocked: isLocked && !canComment,
                onReport:   (id, type) => onNavigate("report", { targetId:id, targetType:type }),
                onRefresh:  loadAll,
              })
            )
          ),
    ),
  );
}
