// pages/Dashboard.js — Admin & Moderator control panel
import { ApprovalService } from "../services/approvalService.js";
import { ReportService }   from "../services/reportService.js";
import { PostService }     from "../services/postService.js";
import { CommentService }  from "../services/commentService.js";
import { UserService }     from "../services/userService.js";
import { Avatar, RoleBadge, StatusBadge, Spinner, ConfirmDialog } from "../components/shared.js";
import { timeAgo }         from "../utils/helpers.js";
import { DS }              from "../data/demoData.js";

const { useState, useEffect } = React;
const e = React.createElement;

const ROLES = ["student","faculty","moderator","admin"];
const AVAILABLE_CLASSES = ["S1 CSE", "S2 CSE", "S3 CSE", "S4 CSE", "S1 EEE", "S1 MECH"];

// ── Approvals ─────────────────────────────────────────────────
function ApprovalsTab({ currentUser }) {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy,     setBusy]    = useState({});
  const [confirm, setConfirm] = useState(null);

  useEffect(() => {
    const load = async () => {
      const list = await ApprovalService.fetchPending(currentUser);
      setPending(list);
      setLoading(false);
    };
    load();
  }, [currentUser]);

  const approve = async uid => {
    setBusy(b => ({ ...b, [uid]: true }));
    await ApprovalService.approve(uid, currentUser.name || "Moderator");
    setPending(p => p.filter(u => u.uid !== uid));
    setBusy(b => ({ ...b, [uid]: false }));
  };

  const reject = async uid => {
    setBusy(b => ({ ...b, [uid]: true }));
    await ApprovalService.reject(uid, currentUser.name || "Moderator");
    setPending(p => p.filter(u => u.uid !== uid));
    setBusy(b => ({ ...b, [uid]: false }));
    setConfirm(null);
  };

  if (loading) return e(Spinner);
  if (pending.length === 0)
    return e("div", { style: { textAlign:"center", padding:"32px 0", color:"var(--muted)" } },
      "✅ No pending approvals.");

  return e("div", null,
    e("p", { style: { fontSize:12, color:"var(--muted)", marginBottom:14, fontFamily:"var(--fm)" } },
      `${pending.length} student${pending.length !== 1 ? "s" : ""} awaiting approval`),

    pending.map(u => e("div", { key: u.uid, className: "approval-row" },
      e(Avatar, { name: u.name }),
      e("div", { style: { flex:1, minWidth:0 } },
        e("div", { style: { fontSize:14, fontWeight:500 } }, u.name),
        e("div", { style: { fontSize:12, color:"var(--muted)" } }, u.email),
        e("div", { style: { fontSize:11, color:"var(--subtle)", fontFamily:"var(--fm)", marginTop:2 } }, `📚 ${u.class}`),
        e("div", { style: { fontSize:11, color:"var(--muted)", marginTop:2 } }, `Signed up ${timeAgo(u.createdAt)}`),
      ),
      e("div", { style: { display:"flex", gap:8, flexShrink:0 } },
        e("button", { className:"btn-success btn-sm", disabled:busy[u.uid],
          onClick: () => approve(u.uid) }, busy[u.uid] ? "…" : "✅ Approve"),
        e("button", { className:"btn-danger btn-sm", disabled:busy[u.uid],
          onClick: () => setConfirm({ uid:u.uid, name:u.name }) }, busy[u.uid] ? "…" : "❌ Reject"),
      ),
    )),

    confirm && e(ConfirmDialog, {
      title:         "Reject Account",
      message:       `Reject ${confirm.name}'s application? They will not be able to access the platform.`,
      confirmLabel: "Reject",
      danger:        true,
      onConfirm:     () => reject(confirm.uid),
      onCancel:      () => setConfirm(null),
    }),
  );
}

// ── Reports ───────────────────────────────────────────────────
function ReportsTab({ currentUser, onNavigate }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy,     setBusy]    = useState({});
  const [confirm, setConfirm] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await ReportService.fetchAll();
        setReports(data);
      } catch (err) {
        console.error("Reports load error:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const deleteContent = async r => {
    setBusy(b => ({ ...b, [r.id]: true }));
    try {
      if (r.targetType === "post")    await PostService.hardDelete(r.targetId, currentUser);
      if (r.targetType === "comment") await CommentService.hardDelete(r.targetId, currentUser);
      await ReportService.resolveByTarget(r.targetId);
      setReports(rs => rs.filter(x => x.targetId !== r.targetId));
    } catch (ex) { alert(ex.message); }
    finally { setBusy(b => ({ ...b, [r.id]: false })); setConfirm(null); }
  };

  const dismiss = async r => {
    setBusy(b => ({ ...b, [r.id]: true }));
    await ReportService.dismiss(r.id);
    setReports(rs => rs.filter(x => x.id !== r.id));
    setBusy(b => ({ ...b, [r.id]: false }));
    setConfirm(null);
  };

  if (loading) return e(Spinner);
  if (reports.length === 0)
    return e("div", { style: { textAlign:"center", padding:"32px 0", color:"var(--muted)" } },
      "No pending reports.");

  return e("div", null,
    reports.map(r => e("div", { key: r.id, className: "report-card" },
      e("div", { style: { display:"flex", gap:8, marginBottom:8, alignItems:"center", flexWrap:"wrap" } },
        e("span", { className: "tag" }, r.targetType),
        e("span", { style: { fontSize:11, color:"var(--muted)" } }, "Reported by"),
        e("span", { style: { fontSize:11, color:"var(--subtle)" } }, r.reporterName || "Unknown"),
        e("span", { style: { fontSize:11, color:"var(--muted)" } }, "·"),
        e("span", { style: { fontSize:11, color:"var(--muted)" } }, timeAgo(r.createdAt)),
      ),
      r.title && e("p", { style: { fontWeight:500, fontSize:13, marginBottom:4 } }, r.title),
      e("div", { className: "report-excerpt" }, r.excerpt || "[Content no longer available]"),
      e("p", { style: { fontSize:12, color:"var(--muted)", marginTop:6 } },
        `Reason: "${r.reason}"`),
      r.postId && e("button", {
        className: "btn-ghost btn-xs",
        style:     { marginTop:8, marginBottom:4 },
        onClick:   () => onNavigate("detail", { postId: r.postId }),
      }, "View Thread →"),
      e("div", { className: "report-actions" },
        e("button", {
          className: "btn-danger btn-sm",
          disabled:  busy[r.id],
          onClick:   () => setConfirm({ type:"delete", report:r }),
        }, busy[r.id] ? "…" : "🗑 Delete Content"),
        e("button", {
          className: "btn-warn btn-sm",
          disabled:  busy[r.id],
          onClick:   () => setConfirm({ type:"dismiss", report:r }),
        }, busy[r.id] ? "…" : "✕ Dismiss Report"),
      ),
    )),
    confirm && e(ConfirmDialog, {
      title:         confirm.type === "delete" ? "Delete Reported Content" : "Dismiss Report",
      message:       confirm.type === "delete"
        ? "Permanently delete this content and clear all its reports? This cannot be undone."
        : "Dismiss this report without action? The content will remain visible.",
      confirmLabel: confirm.type === "delete" ? "Delete" : "Dismiss",
      danger:        confirm.type === "delete",
      onConfirm:     () => confirm.type === "delete"
        ? deleteContent(confirm.report)
        : dismiss(confirm.report),
      onCancel:      () => setConfirm(null),
    }),
  );
}

// ── Users (admin only) ────────────────────────────────────────
function UsersTab({ currentUser }) {
  const [users,     setUsers]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [confirm,   setConfirm]   = useState(null);
  const [banReason, setBanReason] = useState("");
  const [filter,    setFilter]    = useState(""); 

  useEffect(() => {
    const loadUsers = async () => {
      const data = await UserService.fetchAll();
      setUsers(data);
      setLoading(false);
    };
    loadUsers();
  }, []);

  const changeRole = async (uid, role) => {
    if (uid === currentUser.uid) { alert("Cannot change your own role."); return; }
    await UserService.updateRole(uid, role);
    setUsers(us => us.map(u => u.uid === uid ? { ...u, role } : u));
  };

  const changeModClass = async (uid, className) => {
    await UserService.updateModerationClass(uid, className);
    setUsers(us => us.map(u => u.uid === uid ? { ...u, moderatesClass: className } : u));
  };

  const doBan = async uid => {
    if (!banReason.trim()) { alert("Provide a reason for the suspension."); return; }
    await UserService.ban(uid, banReason.trim(), currentUser.uid);
    setUsers(us => us.map(u => u.uid === uid
      ? { ...u, status:"banned", banReason:banReason.trim() } : u));
    setConfirm(null); setBanReason("");
  };

  const doUnban = async uid => {
    await UserService.unban(uid);
    setUsers(us => us.map(u => u.uid === uid
      ? { ...u, status:"approved", bannedAt:null, banReason:null } : u));
    setConfirm(null);
  };

  if (loading) return e(Spinner);

  const filtered = filter
    ? users.filter(u => u.name?.toLowerCase().includes(filter.toLowerCase())
                      || u.email?.toLowerCase().includes(filter.toLowerCase()))
    : users;

  return e("div", null,
    e("div", { style: { marginBottom: 14 } },
      e("input", {
        className: "input",
        value: filter,
        onChange: ev => setFilter(ev.target.value),
        placeholder: "Filter by name or email…",
      }),
    ),

    e("div", { className: "user-list" },
      filtered.map(u => e("div", { key: u.uid, className: "user-item" },
        // TOP: Identity
        e("div", { className: "user-info-main" },
          e(Avatar, { name: u.name }),
          e("div", { style: { flex: 1, minWidth: 0 } },
            e("div", { style: { fontSize: 14, fontWeight: 600 } }, u.name),
            e("div", { className: "text-muted", style: { fontSize: 12, wordBreak: "break-all" } }, u.email),
            u.class && e("div", { style: { fontSize: 11, color: "var(--subtle)", marginTop: 2 } }, `📚 ${u.class}`),
            u.moderatesClass && e("div", { style: { fontSize: 11, color: "var(--green)", marginTop: 2 } }, `⚖️ Moderates: ${u.moderatesClass}`),
            u.status === "banned" && e("div", { style: { fontSize: 11, color: "var(--danger)", marginTop: 2 } },
              `🚫 Banned: ${u.banReason || ""}`),
          ),
        ),

        // BOTTOM: Badges & Controls
        e("div", { className: "user-actions" },
          e("div", { className: "badge-group" },
            e(StatusBadge, { status: u.status }),
            e(RoleBadge, { role: u.role }),
          ),
          
          u.uid !== currentUser.uid && e("div", { className: "action-group", style: { flexDirection: "column", alignItems: "stretch" } },
            // Row 1: Role and Suspend/Unban
            e("div", { style: { display: "flex", gap: 8, width: "100%" } },
              e("select", {
                className: "input-sm",
                value: u.role,
                onChange: ev => changeRole(u.uid, ev.target.value),
                style: { flex: 1 }
              }, ROLES.map(r => e("option", { key: r, value: r }, r))),
              
              u.status === "banned"
                ? e("button", { 
                    className: "btn-success btn-xs",
                    onClick: () => setConfirm({ type: "unban", uid: u.uid, name: u.name }) 
                  }, "Unban")
                : e("button", { 
                    className: "btn-danger btn-xs",
                    onClick: () => setConfirm({ type: "ban", uid: u.uid, name: u.name }) 
                  }, "Suspend")
            ),

            // Row 2: Conditional Class Assignment for Moderators
            u.role === "moderator" && e("div", { style: { marginTop: 8, width: "100%" } },
              e("label", { style: { fontSize: 10, color: "var(--muted)", display: "block", marginBottom: 4, fontWeight: 600 } }, "ASSIGNED CLASS"),
              e("select", {
                className: "input-sm",
                value: u.moderatesClass || "",
                onChange: ev => changeModClass(u.uid, ev.target.value),
                style: { width: "100%", borderColor: "var(--green)" }
              }, 
                e("option", { value: "" }, "-- Unassigned --"),
                AVAILABLE_CLASSES.map(c => e("option", { key: c, value: c }, c))
              )
            )
          )
        )
      ))
    ),

    confirm?.type === "ban" && e("div", {
      className: "modal-overlay",
      onClick: ev => ev.target === ev.currentTarget && setConfirm(null),
    },
      e("div", { className: "confirm-dialog" },
        e("h3", null, `Suspend ${confirm.name}`),
        e("p", null, "Suspended users can browse but cannot post, comment, or vote."),
        e("div", { className: "form-group", style: { marginBottom: 12 } },
          e("label", { className: "form-label" }, "Reason"),
          e("input", {
            value: banReason,
            onChange: ev => setBanReason(ev.target.value),
            placeholder: "Reason for suspension…",
            autoFocus: true,
          }),
        ),
        e("div", { className: "confirm-actions" },
          e("button", { className: "btn-ghost", onClick: () => { setConfirm(null); setBanReason(""); } }, "Cancel"),
          e("button", { className: "btn-danger", onClick: () => doBan(confirm.uid) }, "Suspend"),
        ),
      ),
    ),

    confirm?.type === "unban" && e(ConfirmDialog, {
      title: `Lift suspension for ${confirm.name}`,
      message: "This will restore their full access to Campus Echo.",
      confirmLabel: "Unban",
      danger: false,
      onConfirm: () => doUnban(confirm.uid),
      onCancel: () => setConfirm(null),
    }),
  );
}

// ── Main Dashboard page ───────────────────────────────────────
export function DashboardPage({ currentUser, onNavigate }) {
  const isAdmin = currentUser?.role === "admin";
  const canMod  = isAdmin || currentUser?.role === "moderator";
  const [tab,   setTab] = useState("approvals");

  if (!canMod)
    return e("div", { className:"alert alert-error" }, "Access denied.");

  return e("div", null,
    e("div", { className:"page-header" },
      e("h1", null, isAdmin ? "👑 Admin Dashboard" : "⚖️ Moderator Dashboard"),
      e("p",  null, isAdmin
        ? "Full system control — approvals, reports, and user management."
        : "Manage your class approvals and content reports."),
    ),

    e("div", { className:"tabs" },
      e("button", { className:`tab ${tab==="approvals"?"active":""}`, onClick:()=>setTab("approvals") }, "📥 Pending Approvals"),
      e("button", { className:`tab ${tab==="reports"  ?"active":""}`, onClick:()=>setTab("reports")   }, "🚩 Reports"),
      isAdmin && e("button", { className:`tab ${tab==="users"?"active":""}`, onClick:()=>setTab("users") }, "👥 All Users"),
    ),

    tab === "approvals" && e(ApprovalsTab, { currentUser }),
    tab === "reports"   && e(ReportsTab,   { currentUser, onNavigate }),
    tab === "users"     && isAdmin && e(UsersTab, { currentUser }),
  );
}