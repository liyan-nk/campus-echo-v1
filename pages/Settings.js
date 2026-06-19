// pages/Settings.js
import { AuthService } from "../services/authService.js";
import { RoleBadge, StatusBadge } from "../components/shared.js";

const { useState } = React;
const e = React.createElement;

export function SettingsPage({ currentUser, onNavigate, onLogout }) {
  const [msg, setMsg] = useState("");

  if (!currentUser)
    return e("div",{className:"alert alert-info"},"Sign in to view settings.");

  const handleLogout = async () => {
    await AuthService.logout();
    onLogout();
  };

  return e("div",null,
    e("div",{className:"page-header"},
      e("h1",null,"Settings"),
      e("p",null,"Manage your account.")),

    // Account info
    e("div",{className:"card"},
      e("div",{className:"settings-section"},
        e("h3",null,"Account"),
        e("div",{style:{display:"flex",flexDirection:"column",gap:10}},
          e("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:"1px solid var(--border)"}},
            e("span",{style:{color:"var(--subtle)",fontSize:13}},"Name"),
            e("span",{style:{fontSize:13}}, currentUser.role==="student"?"Anonymous (student)":currentUser.name)),
          e("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:"1px solid var(--border)"}},
            e("span",{style:{color:"var(--subtle)",fontSize:13}},"Email"),
            e("span",{style:{fontSize:13,fontFamily:"var(--fm)"}}, currentUser.email)),
          e("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:"1px solid var(--border)"}},
            e("span",{style:{color:"var(--subtle)",fontSize:13}},"Role"),
            e(RoleBadge,{role:currentUser.role})||e("span",{style:{fontSize:13}},currentUser.role)),
          e("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:"1px solid var(--border)"}},
            e("span",{style:{color:"var(--subtle)",fontSize:13}},"Status"),
            e(StatusBadge,{status:currentUser.status})),
          currentUser.class && e("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0"}},
            e("span",{style:{color:"var(--subtle)",fontSize:13}},"Class"),
            e("span",{style:{fontSize:13,fontFamily:"var(--fm)"}}, currentUser.class)),
        ),
      ),

      e("div",{className:"settings-section"},
        e("h3",null,"Privacy"),
        e("div",{className:"alert alert-info"},
          currentUser.role==="student"
            ? "Your posts and comments appear as Anonymous to all other users. Only Admins can see your identity."
            : "Your name and role badge are visible on your posts and comments."
        ),
      ),

      e("div",{className:"settings-section"},
        e("h3",null,"Danger Zone"),
        e("button",{className:"btn-danger",onClick:handleLogout},
          "Sign Out of Campus Echo"),
      ),
    ),
  );
}
