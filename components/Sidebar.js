// components/Sidebar.js
import { RoleBadge, Avatar } from "./shared.js";
import { CATEGORIES }        from "../data/demoData.js";

const e = React.createElement;

export function Sidebar({ currentUser, activePage, onNavigate, pendingCount, unreadCount }) {
  const canMod = currentUser&&(currentUser.role==="moderator"||currentUser.role==="admin");

  const link = (page, icon, label, badge=0) =>
    e("button",{
      className:`sidebar-link ${activePage===page?"active":""}`,
      onClick:()=>onNavigate(page),
    },
      e("span",{className:"sidebar-link-icon"}, icon),
      label,
      badge>0 && e("span",{style:{
        marginLeft:"auto",background:"var(--danger)",color:"#fff",
        borderRadius:"50%",width:18,height:18,fontSize:10,
        display:"flex",alignItems:"center",justifyContent:"center",
        fontFamily:"var(--fm)",
      }}, badge),
    );

  return e("aside",{className:"sidebar"},
    // User card
    currentUser && e("div",{className:"card",style:{marginBottom:4}},
      e("div",{style:{display:"flex",gap:10,alignItems:"center",marginBottom:8}},
        e(Avatar,{name:currentUser.name}),
        e("div",{style:{minWidth:0}},
          e("div",{style:{fontSize:13,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}},
            currentUser.role==="student"?"Anonymous":currentUser.name),
          e(RoleBadge,{role:currentUser.role}),
        ),
      ),
      currentUser.class && e("p",{style:{fontSize:11,color:"var(--subtle)",fontFamily:"var(--fm)"}},`📚 ${currentUser.class}`),
    ),

    // Nav links
    e("div",{className:"card"},
      e("div",{style:{display:"flex",flexDirection:"column",gap:2}},
        link("feed",      "🏠", "Home"),
        link("search",    "🔍", "Search"),
        currentUser?.status==="approved" && link("create","✏️","Create Post"),
        link("profile",   "👤", "My Profile"),
        link("notifs",    "🔔", "Notifications", unreadCount),
        link("settings",  "⚙️", "Settings"),
        canMod && e("div",{className:"divider"}),
        canMod && link("dashboard","📊",
          currentUser.role==="admin"?"Admin Dashboard":"Mod Dashboard",
          pendingCount),
      ),
    ),

    // Categories filter
    e("div",{className:"card"},
      e("p",{style:{fontSize:11,color:"var(--subtle)",fontFamily:"var(--fm)",textTransform:"uppercase",letterSpacing:".06em",marginBottom:10}},"Categories"),
      e("div",{style:{display:"flex",flexDirection:"column",gap:2}},
        e("button",{className:"sidebar-link",onClick:()=>onNavigate("feed")},
          e("span",{className:"sidebar-link-icon"},"📋"),"All Posts"),
        CATEGORIES.map(c=>
          e("button",{key:c,className:"sidebar-link",
            onClick:()=>onNavigate("feed",{category:c})},
            e("span",{className:"sidebar-link-icon"},"#"), c)
        ),
      ),
    ),
  );
}
