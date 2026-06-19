// pages/Profile.js
import { PostCard }      from "../components/PostCard.js";
import { PostService }   from "../services/postService.js";
import { CommentService }from "../services/commentService.js";
import { RoleBadge, StatusBadge, Avatar } from "../components/shared.js";
import { timeAgo }       from "../utils/helpers.js";
import { DS }            from "../data/demoData.js";

const { useState, useEffect } = React;
const e = React.createElement;

export function ProfilePage({ currentUser, onNavigate }) {
  const [posts,    setPosts]    = useState([]);
  const [comments, setComments] = useState([]);
  const [tab,      setTab]      = useState("posts");
  const [loading,  setLoading]  = useState(true);

  const user = currentUser; // profile always shows own account

  useEffect(()=>{
    if (!user) return;
    Promise.all([
      PostService.fetchByUser(user.uid),
      CommentService.fetchByUser(user.uid),
    ]).then(([p,c])=>{ setPosts(p); setComments(c); setLoading(false); });
  },[user?.uid]);

  if (!user) return e("div",{className:"alert alert-info"},"Sign in to view your profile.");

  const totalVotesReceived = posts.reduce((s,p)=>s+p.votes,0)
    + comments.reduce((s,c)=>s+c.votes,0);

  const modUid = user.assignedModeratorId;
  const modName = modUid && DS.users[modUid]?.name;

  return e("div",null,
    e("div",{className:"page-header"},
      e("h1",null,"My Profile")),

    // Profile card
    e("div",{className:"card",style:{marginBottom:20}},
      e("div",{style:{display:"flex",gap:16,alignItems:"center",marginBottom:20}},
        e(Avatar,{name:user.name, size:56}),
        e("div",null,
          e("h2",{style:{fontSize:20,marginBottom:4}},
            user.role==="student"?"Anonymous":user.name),
          e("div",{style:{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}},
            e(RoleBadge,{role:user.role}),
            e(StatusBadge,{status:user.status}),
          ),
          user.class && e("p",{style:{fontSize:12,color:"var(--subtle)",marginTop:4,fontFamily:"var(--fm)"}},
            `📚 ${user.class}`),
        ),
      ),

      // Status message
      user.status==="pending" && e("div",{className:"alert alert-warn",style:{marginBottom:16}},
        `⏳ Your account is awaiting approval from your class moderator.${modName?` Assigned to: ${modName}.`:""}`),
      user.status==="banned" && e("div",{className:"alert alert-error",style:{marginBottom:16}},
        `🚫 Your account is suspended. Reason: ${user.banReason||"Not specified."}`),

      // Stats
      e("div",{className:"stat-grid"},
        e("div",{className:"stat-card"},
          e("div",{className:"stat-value"}, posts.length),
          e("div",{className:"stat-label"},"Posts")),
        e("div",{className:"stat-card"},
          e("div",{className:"stat-value"}, comments.length),
          e("div",{className:"stat-label"},"Comments")),
        e("div",{className:"stat-card"},
          e("div",{className:"stat-value"}, totalVotesReceived),
          e("div",{className:"stat-label"},"Votes Received")),
      ),

      e("div",{style:{fontSize:12,color:"var(--muted)",fontFamily:"var(--fm)"}},
        `Member since ${timeAgo(user.createdAt)}`),
    ),

    // History tabs
    e("div",{className:"tabs"},
      e("button",{className:`tab ${tab==="posts"?"active":""}`,
        onClick:()=>setTab("posts")},`My Posts (${posts.length})`),
      e("button",{className:`tab ${tab==="comments"?"active":""}`,
        onClick:()=>setTab("comments")},`My Comments (${comments.length})`),
    ),

    loading && e("div",{className:"spinner"}),

    !loading && tab==="posts" && (
      posts.length===0
        ? e("div",{className:"empty-state"},e("h3",null,"No posts yet"),
            e("p",null,"Create your first post!"),
            user.status==="approved" && e("button",{className:"btn-primary",style:{marginTop:16},
              onClick:()=>onNavigate("create")},"+ New Post"))
        : e("div",{className:"feed"},
            posts.map(p=>e(PostCard,{key:p.id,post:p,currentUser,
              onOpen:id=>onNavigate("detail",{postId:id}),
              onRefresh:()=>PostService.fetchByUser(user.uid).then(setPosts),
              onReport:(id,type)=>onNavigate("report",{targetId:id,targetType:type}),
            }))
          )
    ),

    !loading && tab==="comments" && (
      comments.length===0
        ? e("div",{className:"empty-state"},e("h3",null,"No comments yet"))
        : e("div",{className:"feed"},
            comments.map(c=>e("div",{key:c.id,className:"card",style:{cursor:"pointer"},
              onClick:()=>onNavigate("detail",{postId:c.postId})},
              e("p",{style:{fontSize:13,color:"var(--subtle)",marginBottom:6}},
                `On post: ${DS.posts[c.postId]?.title||"[deleted]"}`),
              e("p",{style:{fontSize:14,lineHeight:1.65,color:c.deletedAt?"var(--muted)":"var(--text)",fontStyle:c.deletedAt?"italic":"normal"}},
                c.deletedAt?"[Deleted by User]":c.content),
              e("p",{style:{fontSize:11,color:"var(--muted)",fontFamily:"var(--fm)",marginTop:6}},
                timeAgo(c.createdAt)),
            ))
          )
    ),
  );
}
