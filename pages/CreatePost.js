// pages/CreatePost.js
import { PostService }   from "../services/postService.js";
import { SafetyService } from "../services/safetyService.js";
import { CATEGORIES }    from "../data/demoData.js";

const { useState } = React;
const e = React.createElement;

export function CreatePostPage({ currentUser, onNavigate }) {
  const [title,    setTitle]    = useState("");
  const [content,  setContent]  = useState("");
  const [category, setCategory] = useState("general");
  const [err,      setErr]      = useState("");
  const [loading,  setLoading]  = useState(false);

  const submit = async () => {
    setErr("");
    const rl = SafetyService.checkPostRateLimit(currentUser.uid);
    if (!rl.ok) { setErr(rl.error); return; }
    const v = SafetyService.validatePost(title, content);
    if (!v.ok)  { setErr(v.error); return; }
    setLoading(true);
    try {
      const post = await PostService.create({
        title:title.trim(), content:content.trim(),
        category, userId:currentUser.uid, userRole:currentUser.role,
      });
      SafetyService.recordPost(currentUser.uid);
      onNavigate("feed");
    } catch(ex) { setErr("Failed to create post. Please try again."); }
    finally { setLoading(false); }
  };

  return e("div",null,
    e("button",{className:"btn-ghost",style:{marginBottom:20}, onClick:()=>onNavigate("feed")},
      "← Cancel"),

    e("div",{className:"page-header"},
      e("h1",null,"Create Post"),
      e("p",null,"Your post will appear anonymously in the feed.")),

    e("div",{className:"card"},
      err && e("div",{className:"alert alert-error"}, err),

      e("div",{className:"form-group"},
        e("label",{className:"form-label"},"Title"),
        e("input",{value:title, onChange:ev=>setTitle(ev.target.value),
          placeholder:"What's on your mind? (min 5 chars)"}),
        e("p",{className:"char-count"},`${title.length} chars`)),

      e("div",{className:"form-group"},
        e("label",{className:"form-label"},"Category"),
        e("select",{value:category, onChange:ev=>setCategory(ev.target.value)},
          CATEGORIES.map(c=>e("option",{key:c,value:c},c)))),

      e("div",{className:"form-group"},
        e("label",{className:"form-label"},"Content"),
        e("textarea",{value:content, onChange:ev=>setContent(ev.target.value),
          placeholder:"Share details… (min 15 chars)", rows:8}),
        e("p",{className:"char-count"},`${content.length} chars`)),

      e("div",{style:{display:"flex",gap:10,justifyContent:"flex-end"}},
        e("button",{className:"btn-ghost", onClick:()=>onNavigate("feed")},"Cancel"),
        e("button",{className:"btn-primary", onClick:submit, disabled:loading},
          loading?"Posting…":"Publish Post")),
    ),
  );
}
