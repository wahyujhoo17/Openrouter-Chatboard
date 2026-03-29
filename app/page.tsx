"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import ChatWindow from "@/components/ChatWindow";
import ChatInput from "@/components/ChatInput";
import ModelSelector from "@/components/ModelSelector";
import { getDefaultModel, canUseModel, DEFAULT_FREE_MODEL } from "@/lib/models";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at?: string;
}

export interface Conversation {
  id: number;
  title: string;
  model: string;
  updated_at: string;
  message_count: number;
}

export interface SessionUser {
  userId: number;
  name: string;
  email: string;
  plan: "free" | "pro";
}

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null | "loading">("loading");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedModel, setSelectedModel] =
    useState<string>(DEFAULT_FREE_MODEL);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  // Check theme preference
  useEffect(() => {
    const saved = window.localStorage.getItem("ai-theme") as
      | "dark"
      | "light"
      | null;
    const system = window.matchMedia("(prefers-color-scheme: light)").matches
      ? "light"
      : "dark";
    const initial = saved || system || "dark";
    setTheme(initial);
  }, []);

  useEffect(() => {
    document.documentElement.classList.remove("dark", "light");
    document.documentElement.classList.add(theme);
    window.localStorage.setItem("ai-theme", theme);
  }, [theme]);

  // Check session — but don't redirect, guests are allowed
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
          setSelectedModel(getDefaultModel(data.user.plan));
        } else {
          setUser(null);
        }
      })
      .catch(() => setUser(null));
  }, []);

  const loggedInUser = user !== "loading" ? user : null;

  // Load conversations (only when logged in)
  const loadConversations = useCallback(async () => {
    const res = await fetch("/api/conversations");
    if (!res.ok) return;
    const data = await res.json();
    if (data.conversations) setConversations(data.conversations);
  }, []);

  useEffect(() => {
    if (loggedInUser) loadConversations();
    else setConversations([]);
  }, [loggedInUser, loadConversations]);

  // Load messages for active conversation
  const loadMessages = useCallback(
    async (convId: number) => {
      const res = await fetch(`/api/conversations/${convId}/messages`);
      const data = await res.json();
      if (data.messages) {
        setMessages(
          data.messages.map((m: Message & { id: number }) => ({
            ...m,
            id: String(m.id),
          })),
        );
      }
      const conv = conversations.find((c) => c.id === convId);
      if (conv) setSelectedModel(conv.model);
    },
    [conversations],
  );

  useEffect(() => {
    if (activeConvId !== null) loadMessages(activeConvId);
  }, [activeConvId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleNewChat = useCallback(() => {
    setActiveConvId(null);
    setMessages([]);
    setSelectedModel(getDefaultModel(loggedInUser?.plan ?? "free"));
  }, [loggedInUser]);

  const handleSelectConversation = useCallback((convId: number) => {
    setActiveConvId(convId);
    setMobileSidebarOpen(false);
  }, []);

  const handleDeleteConversation = useCallback(
    async (convId: number) => {
      await fetch(`/api/conversations/${convId}`, { method: "DELETE" });
      await loadConversations();
      if (activeConvId === convId) {
        setActiveConvId(null);
        setMessages([]);
      }
    },
    [activeConvId, loadConversations],
  );

  const handleModelChange = useCallback(
    (modelId: string) => {
      const plan = loggedInUser?.plan ?? "free";
      if (!canUseModel(modelId, plan)) return;
      setSelectedModel(modelId);
    },
    [loggedInUser],
  );

  const handleSend = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;

      const userMsg: Message = {
        id: Date.now().toString(),
        role: "user",
        content: text,
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      try {
        const history = messages.map((m) => ({
          role: m.role,
          content: m.content,
        }));
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text,
            history,
            model: selectedModel,
            conversationId: activeConvId,
          }),
        });
        const data = await res.json();

        if (data.requiresLogin) {
          router.push("/login");
          setMessages((prev) => prev.slice(0, -1));
          setIsLoading(false);
          return;
        }

        if (data.conversationId && data.conversationId !== activeConvId) {
          setActiveConvId(data.conversationId);
          await loadConversations();
        } else if (data.conversationId) {
          await loadConversations();
        }

        if (data.reply) {
          setMessages((prev) => [
            ...prev,
            {
              id: (Date.now() + 1).toString(),
              role: "assistant",
              content: data.reply,
            },
          ]);
        } else if (data.error) {
          setMessages((prev) => [
            ...prev,
            {
              id: (Date.now() + 1).toString(),
              role: "assistant",
              content: `Error: ${data.error}`,
            },
          ]);
        }
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: "Network error. Please try again.",
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [
      messages,
      isLoading,
      selectedModel,
      activeConvId,
      loadConversations,
      router,
    ],
  );

  const handleLogout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setConversations([]);
    setMessages([]);
    setActiveConvId(null);
    setSelectedModel(DEFAULT_FREE_MODEL);
    router.refresh();
  }, [router]);

  if (user === "loading") {
    return (
      <div className="h-full flex items-center justify-center bg-[#0d0f18]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[#64748b]">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full overflow-hidden bg-app">
      <Sidebar
        collapsed={sidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        onToggleCollapse={() => setSidebarCollapsed((p) => !p)}
        onMobileClose={() => setMobileSidebarOpen(false)}
        conversations={conversations}
        activeConvId={activeConvId}
        user={loggedInUser}
        onNewChat={handleNewChat}
        onSelectConversation={handleSelectConversation}
        onDeleteConversation={handleDeleteConversation}
        onLogout={handleLogout}
      />

      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      <div className="flex flex-col flex-1 min-w-0 h-full">
        {/* Header */}
        <header className="flex items-center gap-3 px-4 py-2.5 border-b border-surface shrink-0 bg-surface">
          <div className="flex items-center gap-2">
            {/* header brand removed per user request */}
          </div>

          <div className="flex-1 flex justify-center">
            <ModelSelector
              selectedModel={selectedModel}
              userPlan={loggedInUser?.plan ?? "free"}
              isGuest={!loggedInUser}
              onChange={handleModelChange}
            />
          </div>

          <button
            onClick={() =>
              setTheme((prev) => (prev === "dark" ? "light" : "dark"))
            }
            className="text-xs px-2 py-1 rounded-lg border border-surface2 text-muted hover:text-current hover:bg-surface2 transition-all"
          >
            {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
          </button>

          {loggedInUser ? (
            <div
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-semibold ${
                loggedInUser.plan === "pro"
                  ? "bg-violet-500/10 border-violet-500/30 text-violet-300"
                  : "bg-[#1e2130] border-[#2a2d3e] text-[#64748b]"
              }`}
            >
              {loggedInUser.plan === "pro" && (
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              )}
              {loggedInUser.plan === "pro" ? "PRO" : "FREE"}
            </div>
          ) : (
            <a
              href="/login"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white text-xs font-semibold transition-all"
            >
              Sign in
            </a>
          )}
        </header>

        <ChatWindow
          messages={messages}
          isLoading={isLoading}
          isGuest={!loggedInUser}
        />
        <ChatInput onSend={handleSend} isLoading={isLoading} />
      </div>
    </div>
  );
}
