"use client";

import { useState } from "react";
import Link from "next/link";
import type { Conversation, SessionUser } from "@/app/page";

interface Props {
  collapsed: boolean;
  mobileOpen: boolean;
  onToggleCollapse: () => void;
  onMobileClose: () => void;
  conversations: Conversation[];
  activeConvId: number | null;
  user: SessionUser | null;
  onNewChat: () => void;
  onSelectConversation: (id: number) => void;
  onDeleteConversation: (id: number) => void;
  onLogout: () => void;
}

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return date.toLocaleDateString();
}

function groupConversations(convs: Conversation[]) {
  const now = new Date();
  const today: Conversation[] = [];
  const yesterday: Conversation[] = [];
  const thisWeek: Conversation[] = [];
  const older: Conversation[] = [];
  convs.forEach((c) => {
    const diffDays = Math.floor(
      (now.getTime() - new Date(c.updated_at).getTime()) / 86400000,
    );
    if (diffDays === 0) today.push(c);
    else if (diffDays === 1) yesterday.push(c);
    else if (diffDays <= 7) thisWeek.push(c);
    else older.push(c);
  });
  const groups: { label: string; items: Conversation[] }[] = [];
  if (today.length) groups.push({ label: "Today", items: today });
  if (yesterday.length) groups.push({ label: "Yesterday", items: yesterday });
  if (thisWeek.length) groups.push({ label: "This Week", items: thisWeek });
  if (older.length) groups.push({ label: "Older", items: older });
  return groups;
}

export default function Sidebar({
  collapsed,
  mobileOpen,
  onToggleCollapse,
  onMobileClose,
  conversations,
  activeConvId,
  user,
  onNewChat,
  onSelectConversation,
  onDeleteConversation,
  onLogout,
}: Props) {
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const groups = groupConversations(conversations);

  async function handleDelete(e: React.MouseEvent, id: number) {
    e.stopPropagation();
    if (!confirm("Delete this conversation?")) return;
    setDeletingId(id);
    await onDeleteConversation(id);
    setDeletingId(null);
  }

  const initials = user
    ? user.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "";

  return (
    <aside
      className={[
        "sidebar-transition flex flex-col h-full surface border-r border-surface shrink-0 overflow-hidden z-30",
        "fixed md:relative inset-y-0 left-0",
        collapsed ? "w-[60px]" : "w-[260px]",
        mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
      ].join(" ")}
    >
      {/* Header */}
      <div
        className={`flex items-center border-b border-surface shrink-0 h-[52px] ${collapsed ? "justify-center px-2" : "justify-between px-3"}`}
        style={{ background: "var(--surface)" }}
      >
        {!collapsed && (
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm font-semibold text-current truncate">
              AI Chatboard
            </span>
          </div>
        )}
        <button
          onClick={onToggleCollapse}
          className="p-2 rounded-lg hover:bg-surface2 text-muted hover:text-current transition-colors shrink-0"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M13 17l5-5-5-5" />
              <path d="M6 17l5-5-5-5" />
            </svg>
          ) : (
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M11 17l-5-5 5-5" />
              <path d="M18 17l-5-5 5-5" />
            </svg>
          )}
        </button>
      </div>

      {/* New Chat */}
      <div
        className={`px-2.5 py-3 shrink-0 ${collapsed ? "flex justify-center" : ""}`}
      >
        <button
          onClick={onNewChat}
          title="New Chat"
          className={[
            "flex items-center gap-2 rounded-xl transition-all",
            "bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500",
            "text-white text-xs font-semibold shadow-md shadow-violet-900/20",
            collapsed ? "w-9 h-9 justify-center" : "w-full px-3 py-2.5",
          ].join(" ")}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
          {!collapsed && <span>New Chat</span>}
        </button>
      </div>

      {/* Conversations list */}
      <div className="flex-1 overflow-y-auto min-h-0 px-1.5 pb-2">
        {/* Guest state */}
        {!user && !collapsed && (
          <div className="mx-1 mt-1 mb-3 p-3 rounded-xl surface2 border border-surface">
            <div className="flex items-center gap-2 mb-2">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--accent)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
              <span className="text-xs font-semibold text-current">
                Save your chats
              </span>
            </div>
            <p className="text-[11px] text-muted mb-3 leading-relaxed">
              Sign in to save conversations and access them from anywhere.
            </p>
            <div className="flex gap-2">
              <Link
                href="/login"
                className="flex-1 text-center text-xs font-semibold py-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white transition-all shadow-accent"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="flex-1 text-center text-xs font-medium py-1.5 rounded-lg border border-surface2 text-muted hover:bg-surface2 hover:text-current transition-all"
              >
                Register
              </Link>
            </div>
          </div>
        )}

        {/* Logged-in: conversation groups */}
        {user && !collapsed && groups.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
            <div className="w-10 h-10 rounded-xl bg-[#161926] border border-[#1e2130] flex items-center justify-center mb-3">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#374151"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
            </div>
            <p className="text-[10px] text-muted">No conversations yet</p>
            <p className="text-[11px] text-muted mt-1">
              Start a new chat above
            </p>
          </div>
        )}

        {!collapsed &&
          groups.map((group) => (
            <div key={group.label} className="mb-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted px-2 py-1.5">
                {group.label}
              </p>
              <div className="space-y-1">
                {group.items.map((conv) => (
                  <div
                    key={conv.id}
                    onMouseEnter={() => setHoveredId(conv.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    className={`group relative flex items-center gap-2 rounded-xl px-3 py-2 cursor-pointer transition-colors ${
                      activeConvId === conv.id
                        ? "bg-accent/20 text-current"
                        : "text-muted hover:bg-surface2 hover:text-current"
                    }`}
                    onClick={() => onSelectConversation(conv.id)}
                  >
                    <svg
                      className="shrink-0"
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs truncate">{conv.title}</p>
                      <p className="text-[10px] text-[#374151] mt-0.5">
                        {timeAgo(conv.updated_at)}
                      </p>
                    </div>
                    {(hoveredId === conv.id || activeConvId === conv.id) && (
                      <button
                        onClick={(e) => handleDelete(e, conv.id)}
                        disabled={deletingId === conv.id}
                        className="shrink-0 p-1 rounded-md hover:bg-red-500/20 text-[#4a5568] hover:text-red-400 transition-colors"
                        title="Delete"
                      >
                        {deletingId === conv.id ? (
                          <svg
                            className="animate-spin"
                            width="11"
                            height="11"
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                            />
                          </svg>
                        ) : (
                          <svg
                            width="11"
                            height="11"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6l-1 14H6L5 6" />
                            <path d="M10 11v6M14 11v6" />
                            <path d="M9 6V4h6v2" />
                          </svg>
                        )}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

        {/* Collapsed: icons only */}
        {collapsed &&
          conversations.slice(0, 8).map((conv) => (
            <button
              key={conv.id}
              onClick={() => onSelectConversation(conv.id)}
              title={conv.title}
              className={`w-full flex justify-center p-2.5 rounded-lg mb-0.5 transition-colors ${
                activeConvId === conv.id
                  ? "bg-[#1a1d2e] text-white"
                  : "text-[#4a5568] hover:bg-[#161926] hover:text-[#64748b]"
              }`}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
            </button>
          ))}

        {/* Collapsed guest: show login icon */}
        {collapsed && !user && (
          <Link
            href="/login"
            title="Sign in"
            className="w-full flex justify-center p-2.5 rounded-lg text-[#818cf8] hover:bg-[#161926] transition-colors"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" y1="12" x2="3" y2="12" />
            </svg>
          </Link>
        )}
      </div>

      {/* Bottom: user info or guest CTA */}
      <div className="px-2 py-3 shrink-0 bg-surface2 rounded-t-xl">
        {user ? (
          <>
            {/* Plan badge */}
            {!collapsed && (
              <div
                className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg mb-2 ${
                  user.plan === "pro"
                    ? "bg-violet-500/10 border border-violet-500/20"
                    : "bg-surface border border-border"
                }`}
              >
                {user.plan === "pro" ? (
                  <>
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="#a78bfa"
                    >
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                    <span className="text-[10px] font-semibold text-violet-300">
                      Pro — All models unlocked
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-[10px] text-[#4a5568]">
                      Free Plan
                    </span>
                    <span className="text-[10px] text-[#374151] mx-1">·</span>
                    <span className="text-[10px] text-violet-400 font-medium cursor-pointer hover:text-violet-300">
                      Upgrade ↗
                    </span>
                  </>
                )}
              </div>
            )}
            {/* User row */}
            <div
              className={`flex items-center gap-2.5 px-1 ${collapsed ? "justify-center" : ""}`}
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center text-white text-[11px] font-bold shrink-0">
                {initials}
              </div>
              {!collapsed && (
                <>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-current truncate">
                      {user.name}
                    </p>
                    <p className="text-[10px] text-muted truncate">
                      {user.email}
                    </p>
                  </div>
                  <button
                    onClick={onLogout}
                    title="Sign out"
                    className="p-1.5 rounded-lg hover:bg-[#1e2130] text-[#4a5568] hover:text-[#94a3b8] transition-colors shrink-0"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                  </button>
                </>
              )}
            </div>
          </>
        ) : /* Guest bottom */
        !collapsed ? (
          <div className={`flex items-center gap-2 px-1`}>
            <div className="w-8 h-8 rounded-full bg-surface2 border border-border flex items-center justify-center text-muted shrink-0">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted">Guest</p>
              <p className="text-[10px] text-muted">Chats not saved</p>
            </div>
            <Link
              href="/login"
              className="text-[10px] font-semibold text-violet-400 hover:text-violet-300 transition-colors shrink-0"
            >
              Sign in
            </Link>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-8 h-8 rounded-full bg-[#1e2130] border border-[#2a2d3e] flex items-center justify-center text-[#4a5568]">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
