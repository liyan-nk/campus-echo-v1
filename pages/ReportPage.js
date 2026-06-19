// pages/ReportPage.js
import { ReportService } from "../services/reportService.js";
import { ConfirmDialog } from "../components/shared.js";

const { useState } = React;
const e = React.createElement;

export function ReportPage({ targetId, targetType, currentUser, onNavigate }) {
  const [reason,    setReason]  = useState("");
  const [done,      setDone]    = useState(false);
  const [submitting,setSub]     = useState(false);
  const [confirm,   setConfirm] = useState(false);

  const goBack = () => onNavigate("feed");

  const submit = async () => {
    if (!reason.trim()) return;
    setSub(true);
    await ReportService.submit(targetId, targetType, reason.trim(), currentUser.uid);
    setDone(true);
    setSub(false);
    setConfirm(false);
  };

  return e("div", null,
    e("button", { className: "btn-ghost", style: { marginBottom: 20 }, onClick: goBack }, "← Back"),

    e("div", { className: "page-header" },
      e("h1", null, "Report Content"),
      e("p",  null, `Reporting a ${targetType}. All reports are reviewed by moderators.`)),

    e("div", { className: "card" },
      done
        ? e("div", null,
            e("div", { className: "alert alert-success" },
              "✅ Report submitted. Thank you for keeping Campus Echo safe."),
            e("button", { className: "btn-primary", onClick: goBack }, "Go Back"),
          )
        : e("div", null,
            e("div", { className: "form-group" },
              e("label", { className: "form-label" }, "Reason for reporting"),
              e("textarea", {
                value:       reason,
                onChange:    ev => setReason(ev.target.value),
                rows:        5,
                placeholder: "Describe why this content violates community guidelines…",
              }),
            ),
            e("div", { style: { display: "flex", gap: 10, justifyContent: "flex-end" } },
              e("button", { className: "btn-ghost",  onClick: goBack }, "Cancel"),
              e("button", {
                className: "btn-danger",
                onClick:   () => setConfirm(true),
                disabled:  !reason.trim(),
              }, "Submit Report"),
            ),
          ),
    ),

    confirm && e(ConfirmDialog, {
      title:        "Submit Report",
      message:      "Are you sure you want to flag this content? Moderators will review it shortly.",
      confirmLabel: "Submit",
      danger:       false,
      onConfirm:    submit,
      onCancel:     () => setConfirm(false),
    }),
  );
}
