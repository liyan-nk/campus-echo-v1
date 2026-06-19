// pages/Search.js
import { PostCard }    from "../components/PostCard.js";
import { PostService } from "../services/postService.js";

const { useState, useRef } = React;
const e = React.createElement;

export function SearchPage({ currentUser, onNavigate }) {
  const [query,   setQuery]   = useState("");
  const [results, setResults] = useState(null); // null = not searched yet
  const [loading, setLoading] = useState(false);
  const timer = useRef(null);

  const canMod = currentUser&&(currentUser.role==="moderator"||currentUser.role==="admin");

  const doSearch = async q => {
    if (!q.trim()) { setResults(null); return; }
    setLoading(true);
    const r = await PostService.search(q.trim());
    const visible = canMod ? r : r.filter(p=>p.status!=="hidden");
    setResults(visible);
    setLoading(false);
  };

  const handleChange = ev => {
    const v = ev.target.value;
    setQuery(v);
    clearTimeout(timer.current);
    timer.current = setTimeout(()=>doSearch(v), 350);
  };

  return e("div",null,
    e("div",{className:"page-header"},
      e("h1",null,"Search"),
      e("p",null,"Find posts by keyword, topic, or category.")),

    e("div",{className:"search-bar",style:{marginBottom:20}},
      e("span",{className:"search-icon"},"🔍"),
      e("input",{
        value:query, onChange:handleChange,
        placeholder:"Search posts…",
        autoFocus:true,
      }),
    ),

    loading && e("div",{className:"spinner"}),

    results===null && !loading &&
      e("div",{className:"empty-state"},
        e("h3",null,"Start typing to search"),
        e("p",null,"Posts are searched by title, content, and category.")),

    results!==null && !loading && results.length===0 &&
      e("div",{className:"empty-state"},
        e("h3",null,"No results"),
        e("p",null,`No posts found for "${query}".`)),

    results!==null && !loading && results.length>0 &&
      e("div",null,
        e("p",{style:{fontSize:13,color:"var(--muted)",marginBottom:12}},
          `${results.length} result${results.length!==1?"s":""} for "${query}"`),
        e("div",{className:"feed"},
          results.map(p=>e(PostCard,{
            key:p.id, post:p, currentUser,
            onOpen:  id=>onNavigate("detail",{postId:id}),
            onRefresh:()=>doSearch(query),
            onReport:(id,type)=>onNavigate("report",{targetId:id,targetType:type}),
          }))
        )
      ),
  );
}
