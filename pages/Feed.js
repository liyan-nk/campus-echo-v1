// pages/Feed.js
import { PostCard }    from "../components/PostCard.js";
import { PostService } from "../services/postService.js";
import { CATEGORIES }  from "../data/demoData.js";

const { useState, useEffect, useCallback } = React;
const e = React.createElement;

export function FeedPage({ currentUser, onNavigate, initialCategory = null }) {
  const [posts,       setPosts]       = useState([]);
  const [sort,        setSort]        = useState("newest");
  const [selectedCat, setSelectedCat] = useState(initialCategory);
  const [loading,     setLoading]     = useState(true);

  const canMod  = currentUser && (currentUser.role === "moderator" || currentUser.role === "admin");
  const canPost = currentUser?.status === "approved";

  // When parent passes a new initialCategory (sidebar click), adopt it
  useEffect(() => { setSelectedCat(initialCategory); }, [initialCategory]);

  const load = useCallback(() => {
    setLoading(true);
    PostService.fetchAll(sort).then(p => { setPosts(p); setLoading(false); });
  }, [sort]);

  useEffect(() => { load(); }, [load]);

  // Apply visibility + category filter
  let visible = selectedCat ? posts.filter(p => p.category === selectedCat) : posts;
  if (!canMod) visible = visible.filter(p => p.status !== "hidden");

  return e("div", null,

    // Sort + category bar
    e("div", { style: { display: "flex", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" } },
      e("div", { className: "tabs", style: { marginBottom: 0, borderBottom: "none", flex: 1 } },
        e("button", { className: `tab ${sort === "newest" ? "active" : ""}`, onClick: () => setSort("newest") }, "🕐 New"),
        e("button", { className: `tab ${sort === "top"    ? "active" : ""}`, onClick: () => setSort("top")    }, "🔥 Top"),
      ),
      e("select", {
        value:    selectedCat || "",
        onChange: ev => setSelectedCat(ev.target.value || null),
        style:    { width: "auto", padding: "6px 12px", fontSize: 13 },
      },
        e("option", { value: "" }, "All Categories"),
        CATEGORIES.map(c => e("option", { key: c, value: c }, c))
      ),
      selectedCat && e("button", {
        className: "btn-ghost btn-sm",
        onClick:   () => setSelectedCat(null),
      }, "✕ Clear"),
    ),

    loading
      ? e("div", { className: "spinner" })
      : visible.length === 0
        ? e("div", { className: "empty-state" },
            e("h3", null, "No posts yet"),
            e("p",  null, "Be the first to start a discussion!"),
            canPost && e("button", {
              className: "btn-primary",
              style: { marginTop: 16 },
              onClick: () => onNavigate("create"),
            }, "+ Create Post"),
          )
        : e("div", { className: "feed" },
            visible.map(p => e(PostCard, {
              key:      p.id,
              post:     p,
              currentUser,
              onOpen:   id   => onNavigate("detail", { postId: id }),
              onRefresh: load,
              onReport: (id, type) => onNavigate("report", { targetId: id, targetType: type }),
            }))
          ),
  );
}
