// components/shared.js
// Small reusable pieces used across many components.
const e = React.createElement;

export function RoleBadge({ role }) {
  if (role==="faculty")   return e("span",{className:"badge badge-faculty"},"🎓 Faculty");
  if (role==="admin")     return e("span",{className:"badge badge-admin"},  "👑 Admin");
  if (role==="moderator") return e("span",{className:"badge badge-mod"},    "⚖️ Mod");
  return null;
}

export function StatusBadge({ status }) {
  const map = { approved:"badge-approved", pending:"badge-pending",
                rejected:"badge-rejected", banned:"badge-banned" };
  const label = { approved:"Approved", pending:"Pending", rejected:"Rejected", banned:"Banned" };
  return e("span",{className:`badge ${map[status]||"badge-pending"}`}, label[status]||status);
}

export function Avatar({ name, size=36 }) {
  return e("div",{
    className:"avatar",
    style:{ width:size, height:size, fontSize:size>30?13:10 }
  }, (name||"?").charAt(0).toUpperCase());
}

export function Spinner({ small=false }) {
  return e("div",{ className: small ? "spinner spinner-sm" : "spinner" });
}

// Inline confirm dialog rendered inside a modal overlay
export function ConfirmDialog({ title, message, confirmLabel="Confirm", danger=false, onConfirm, onCancel }) {
  return e("div",{className:"modal-overlay", onClick:e=>e.target===e.currentTarget&&onCancel()},
    e("div",{className:"confirm-dialog"},
      e("h3",null, title),
      e("p", null, message),
      e("div",{className:"confirm-actions"},
        e("button",{className:"btn-ghost",    onClick:onCancel},  "Cancel"),
        e("button",{className: danger?"btn-danger":"btn-primary", onClick:onConfirm}, confirmLabel),
      )
    )
  );
}
