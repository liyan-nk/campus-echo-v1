// components/AuthorDisplay.js
import { RoleBadge } from "./shared.js";
import { UserService } from "../services/userService.js";
const e = React.createElement;

export function AuthorDisplay({ userId, userRole, currentUser }) {
  const isAdmin   = currentUser?.role==="admin";
  const name      = UserService.getDisplayName(userId);
  const isSelf    = currentUser?.uid===userId;

  if (userRole==="student") {
    return e("span",{style:{color:"var(--muted)",fontSize:12}},
      "Anonymous",
      isAdmin && name
        ? e("span",{style:{fontSize:10,opacity:.5,marginLeft:4}},"["+name+"]")
        : null
    );
  }
  return e("span",{style:{fontSize:12,color:"var(--subtle)",display:"inline-flex",alignItems:"center",gap:6}},
    name||(isSelf?"You":"User"),
    e(RoleBadge,{role:userRole})
  );
}
