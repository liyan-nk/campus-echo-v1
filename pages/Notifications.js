// pages/Notifications.js
import { NotifService } from "../services/notifService.js";
import { timeAgo }      from "../utils/helpers.js";

const { useState, useEffect } = React;
const e = React.createElement;

const NOTIF_ICONS = {
  approval: "✅", rejection: "❌", reply: "💬",
  locked: "🔒", hidden: "🚫", banned: "🚫", pending: "⏳",
};

export function NotificationsPage({ currentUser, onNavigate, onRead }) {
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    NotifService.fetchForUser(currentUser.uid)
      .then(n => {
        setNotifs(n || []);
      })
      .catch(err => {
        console.error("Failed to load notifications:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [currentUser?.uid]);

  const markAll = async () => {
    await NotifService.markAllRead(currentUser.uid);
    setNotifs(ns => ns.map(n => ({ ...n, read: true })));
    onRead && onRead();
  };

  const markOne = async id => {
    await NotifService.markRead(id);
    setNotifs(ns => ns.map(n => n.id === id ? { ...n, read: true } : n));
  };

  if (!currentUser)
    return e("div", { className: "alert alert-info" }, "Sign in to view notifications.");

  const unread = notifs.filter(n => !n.read).length;

  return e("div", null,
    e("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 } },
      e("div", { className: "page-header", style: { margin: 0 } },
        e("h1", null, "Notifications"),
        e("p", null, unread > 0 ? `${unread} unread` : "All caught up!")),
      unread > 0 && e("button", { className: "btn-ghost btn-sm", onClick: markAll }, "Mark all read"),
    ),

    loading && e("div", { className: "spinner" }),

    // Case 1: No notifications - wrapped in a card
    !loading && notifs.length === 0 &&
      e("div", { className: "card" },
        e("div", { className: "empty-state" },
          e("h3", null, "No notifications"),
          e("p", null, "You'll be notified about replies, approvals, and moderation actions.")
        )
      ),

    // Case 2: Has notifications - wrapped in a card
    !loading && notifs.length > 0 &&
      e("div", { className: "card" },
        notifs.map(n =>
          e("div", {
            key: n.id,
            className: "notif-item",
            style: { cursor: n.postId ? "pointer" : "default" },
            onClick: async () => {
              await markOne(n.id);
              if (n.postId) onNavigate("detail", { postId: n.postId });
            }
          },
            e("div", { className: `notif-dot-badge ${n.read ? "notif-dot-read" : ""}` }),
            e("div", { style: { flex: 1 } },
              e("p", { className: "notif-text" },
                e("span", { style: { marginRight: 6 } }, (NOTIF_ICONS[n.type] || "🔔")),
                n.message),
              e("p", { className: "notif-time" }, timeAgo(n.createdAt)),
            ),
          )
        )
      )
  );
}