"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = StaffMessagesPage;
const jsx_runtime_1 = require("react/jsx-runtime");
const lucide_react_1 = require("lucide-react");
const staff_shell_1 = require("@/components/staff/staff-shell");
const button_1 = require("@/components/ui/button");
const conversations = [
    {
        id: "MSG-001",
        applicant: "Amara Singh",
        applicationId: "APP-5412",
        preview: "I uploaded my pay stub. Can you please confirm?",
        time: "30m ago",
        unread: true,
        messages: [
            { from: "Amara Singh", text: "Hi, I just uploaded my pay stub. Can you please confirm receipt?", time: "30m ago", isStaff: false },
            { from: "You", text: "Hi Amara, I can see the upload. I'll review it shortly and update your application.", time: "20m ago", isStaff: true }
        ]
    },
    {
        id: "MSG-002",
        applicant: "Carlos Reyes",
        applicationId: "APP-5411",
        preview: "Thank you for the update. I'll send the form today.",
        time: "2h ago",
        unread: true,
        messages: [
            { from: "You", text: "Hi Carlos, please complete the DD-214 and upload it to your application.", time: "3h ago", isStaff: true },
            { from: "Carlos Reyes", text: "Thank you for the update. I'll send the form today.", time: "2h ago", isStaff: false }
        ]
    },
    {
        id: "MSG-003",
        applicant: "Priya Patel",
        applicationId: "APP-5408",
        preview: "Sorry for the delay. I'm having trouble with the upload.",
        time: "1 day ago",
        unread: false,
        messages: [
            { from: "Priya Patel", text: "Sorry for the delay. I'm having trouble uploading my documents.", time: "1 day ago", isStaff: false }
        ]
    }
];
function StaffMessagesPage() {
    const active = conversations[0];
    return ((0, jsx_runtime_1.jsx)(staff_shell_1.StaffShell, { title: "Staff inbox", description: "Communicate with applicants and keep every case conversation organized.", children: (0, jsx_runtime_1.jsx)("div", { className: "rounded-[28px] border border-border bg-white shadow-soft overflow-hidden", children: (0, jsx_runtime_1.jsxs)("div", { className: "grid xl:grid-cols-[320px_1fr]", style: { minHeight: "520px" }, children: [(0, jsx_runtime_1.jsxs)("div", { className: "border-r border-border", children: [(0, jsx_runtime_1.jsx)("div", { className: "border-b border-border px-4 py-4", children: (0, jsx_runtime_1.jsx)("p", { className: "text-xs font-semibold uppercase tracking-[0.24em] text-slate-500", children: "Conversations" }) }), (0, jsx_runtime_1.jsx)("div", { className: "divide-y divide-border", children: conversations.map((conv) => ((0, jsx_runtime_1.jsxs)("button", { type: "button", className: `w-full px-4 py-4 text-left transition hover:bg-slate-50 ${conv.id === active.id ? "bg-brand/5" : ""}`, children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-start justify-between gap-2", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3", children: [(0, jsx_runtime_1.jsx)("div", { className: "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-sm font-bold text-brand", children: conv.applicant.charAt(0) }), (0, jsx_runtime_1.jsxs)("div", { className: "min-w-0", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm font-semibold text-slate-950 truncate", children: conv.applicant }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-slate-500", children: conv.applicationId })] })] }), conv.unread ? ((0, jsx_runtime_1.jsx)("span", { className: "shrink-0 inline-flex h-2 w-2 rounded-full bg-brand mt-1.5" })) : null] }), (0, jsx_runtime_1.jsx)("p", { className: "mt-2 ml-12 text-xs text-slate-500 truncate", children: conv.preview }), (0, jsx_runtime_1.jsx)("p", { className: "mt-1 ml-12 text-xs text-slate-400", children: conv.time })] }, conv.id))) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3 border-b border-border px-5 py-4", children: [(0, jsx_runtime_1.jsx)("div", { className: "inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand/10 text-sm font-bold text-brand", children: active.applicant.charAt(0) }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm font-semibold text-slate-950", children: active.applicant }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-slate-500", children: active.applicationId })] })] }), (0, jsx_runtime_1.jsx)("div", { className: "flex-1 space-y-4 overflow-y-auto p-5", children: active.messages.map((msg, i) => ((0, jsx_runtime_1.jsx)("div", { className: `flex ${msg.isStaff ? "justify-end" : "justify-start"}`, children: (0, jsx_runtime_1.jsxs)("div", { className: `max-w-[70%] rounded-[20px] px-4 py-3 text-sm leading-6 ${msg.isStaff ? "bg-brand text-white rounded-br-md" : "bg-slate-100 text-slate-900 rounded-bl-md"}`, children: [(0, jsx_runtime_1.jsx)("p", { children: msg.text }), (0, jsx_runtime_1.jsx)("p", { className: `mt-1.5 text-xs ${msg.isStaff ? "text-white/60" : "text-slate-500"}`, children: msg.time })] }) }, i))) }), (0, jsx_runtime_1.jsx)("div", { className: "border-t border-border p-4", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-end gap-3", children: [(0, jsx_runtime_1.jsx)("textarea", { rows: 2, placeholder: "Type a message to the applicant\u2026", className: "flex-1 resize-none rounded-2xl border border-border bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-brand/20", "aria-label": "Compose message" }), (0, jsx_runtime_1.jsxs)(button_1.Button, { size: "sm", className: "shrink-0 h-11", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Send, { className: "h-4 w-4 mr-1.5" }), "Send"] })] }) })] })] }) }) }));
}
