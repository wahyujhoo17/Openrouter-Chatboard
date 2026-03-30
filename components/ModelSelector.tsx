"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { MODELS, type AIModel } from "@/lib/models";

interface Props {
  selectedModel: string;
  userPlan: "free" | "pro";
  isGuest: boolean;
  onChange: (modelId: string) => void;
}

const PROVIDER_ICONS: Record<string, string> = {
  OpenAI: "OA",
  Anthropic: "AN",
  Google: "GO",
  Meta: "ME",
  "Mistral AI": "MI",
  Alibaba: "AL",
  Microsoft: "MS",
  NVIDIA: "NV",
  DeepSeek: "DS",
  StepFun: "SF",
  "Arcee AI": "AR",
  MiniMax: "MM",
  "Nous Research": "NR",
  OpenRouter: "AU",
};

const MONTH_LABELS: Record<string, string> = {
  "2026-03": "Maret 2026",
  "2026-02": "Februari 2026",
  "2026-01": "Januari 2026",
  "2025-12": "Desember 2025",
  "2025-11": "November 2025",
  "2025-10": "Oktober 2025",
  "2025-09": "September 2025",
  "2025-08": "Agustus 2025",
};

export default function ModelSelector({
  selectedModel,
  userPlan,
  isGuest,
  onChange,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [freeOnly, setFreeOnly] = useState(false);
  const [hovered, setHovered] = useState<AIModel | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const current = MODELS.find((m) => m.id === selectedModel) || MODELS[0];

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (open && searchRef.current) {
      setTimeout(() => searchRef.current?.focus(), 50);
    }
    if (!open) {
      setSearch("");
      setHovered(null);
    }
  }, [open]);

  const filtered = useMemo(() => {
    return MODELS.filter((m) => {
      if (m.id === "openrouter/free") return false; // handled separately on top
      if (freeOnly && m.plan !== "free") return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          m.name.toLowerCase().includes(q) ||
          m.provider.toLowerCase().includes(q) ||
          (m.tags || []).some((t) => t.includes(q))
        );
      }
      return true;
    });
  }, [search, freeOnly]);

  const autoModel = MODELS.find((m) => m.id === "openrouter/free");

  const grouped = useMemo(() => {
    const map = new Map<string, AIModel[]>();
    for (const m of filtered) {
      const key = m.releaseDate || "older";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(m);
    }
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered]);

  const preview = hovered || current;

  function selectModel(model: AIModel) {
    const locked = model.plan === "pro" && (isGuest || userPlan === "free");
    if (locked) {
      if (isGuest) {
        router.push("/login");
        setOpen(false);
        return;
      }
      return;
    }
    onChange(model.id);
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      {/* Trigger button */}
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface2 border border-surface2 hover:border-accent/50 text-current hover:text-white text-xs font-medium transition-all"
      >
        <span className="text-sm font-semibold tracking-wider">
          {PROVIDER_ICONS[current.provider] ||
            current.provider.slice(0, 2).toUpperCase()}
        </span>
        <span className="max-w-[130px] truncate">{current.name}</span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          className="absolute top-full mt-2 left-0 z-[9999] flex rounded-xl border border-border surface shadow-2xl shadow-black/40 overflow-hidden"
          style={{ width: 580, maxHeight: "80vh" }}
        >
          {/* ── Left: list ─────────────────────────────── */}
          <div
            className="flex flex-col border-r border-border surface2"
            style={{ width: 280 }}
          >
            {/* Search */}
            <div className="px-3 pt-3 pb-2">
              <div className="flex items-center gap-2 bg-surface2 border border-surface2 rounded-lg px-2.5 py-1.5">
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--muted)"
                  strokeWidth="2"
                  className="shrink-0"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                <input
                  ref={searchRef}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari model..."
                  className="bg-transparent text-xs text-current placeholder-muted outline-none w-full"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="text-muted hover:text-current transition-colors"
                  >
                    <svg
                      width="11"
                      height="11"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Filters */}
            <div className="px-3 pb-2 flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => setFreeOnly((p) => !p)}
                className={`flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-md border transition-all ${
                  freeOnly
                    ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                    : "border-border text-muted hover:border-accent/50 hover:text-current"
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                Free
              </button>
              {(search || freeOnly) && (
                <button
                  onClick={() => {
                    setSearch("");
                    setFreeOnly(false);
                  }}
                  className="text-[10px] text-muted hover:text-current px-2 py-1 rounded-md border border-border hover:border-accent/40 transition-all"
                >
                  Reset
                </button>
              )}
              <span className="ml-auto text-[10px] text-muted">
                {filtered.length} model
              </span>
            </div>

            {/* Model list */}
            <div
              className="overflow-y-auto flex-1 px-2 pb-2"
              style={{ maxHeight: 380 }}
            >
              {autoModel && (
                <button
                  key={autoModel.id}
                  onClick={() => selectModel(autoModel)}
                  onMouseEnter={() => setHovered(autoModel)}
                  onMouseLeave={() => setHovered(null)}
                  className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-left transition-all mb-1 ${
                    selectedModel === autoModel.id
                      ? "bg-surface2 border border-accent/40"
                      : ""
                  }`}
                >
                  <span className="text-sm shrink-0">
                    {PROVIDER_ICONS[autoModel.provider] || "⚙️"}
                  </span>
                  <span className="flex-1 min-w-0 text-xs font-medium text-current truncate">
                    {autoModel.name}
                  </span>
                  <span className="text-[9px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded-full font-semibold">
                    Free
                  </span>
                </button>
              )}

              {grouped.length === 0 ? (
                <div className="text-center py-8 text-muted text-xs">
                  Tidak ada model ditemukan
                </div>
              ) : (
                grouped.map(([monthKey, models]) => (
                  <div key={monthKey} className="mb-1">
                    <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted">
                      {MONTH_LABELS[monthKey] || monthKey}
                    </div>
                    {models.map((model) => {
                      const locked =
                        model.plan === "pro" &&
                        (isGuest || userPlan === "free");
                      const isSelected = selectedModel === model.id;
                      const isHov = hovered?.id === model.id;
                      return (
                        <button
                          key={model.id}
                          onClick={() => selectModel(model)}
                          onMouseEnter={() => setHovered(model)}
                          onMouseLeave={() => setHovered(null)}
                          className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-left transition-all ${
                            isSelected
                              ? "bg-surface2 border border-accent/40"
                              : isHov
                                ? "bg-surface2"
                                : ""
                          } ${locked ? "opacity-50" : ""}`}
                        >
                          <span className="text-sm font-semibold shrink-0">
                            {PROVIDER_ICONS[model.provider] ||
                              model.provider.slice(0, 2).toUpperCase()}
                          </span>
                          <span className="flex-1 min-w-0 text-xs font-medium text-current truncate">
                            {model.name}
                          </span>
                          <div className="flex items-center gap-1 shrink-0">
                            {model.plan === "free" ? (
                              <span className="text-[9px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded-full font-semibold">
                                Free
                              </span>
                            ) : (
                              <span className="text-[9px] bg-violet-500/15 text-violet-400 border border-violet-500/20 px-1.5 py-0.5 rounded-full font-semibold flex items-center gap-0.5">
                                {locked && (
                                  <svg
                                    width="7"
                                    height="7"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                  >
                                    <rect
                                      x="3"
                                      y="11"
                                      width="18"
                                      height="11"
                                      rx="2"
                                    />
                                    <path d="M7 11V7a5 5 0 0110 0v4" />
                                  </svg>
                                )}
                                Pro
                              </span>
                            )}
                            {isSelected && (
                              <svg
                                width="10"
                                height="10"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="var(--accent)"
                                strokeWidth="2.5"
                              >
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ── Right: preview ─────────────────────────── */}
          <div className="flex flex-col p-4 flex-1">
            <div className="flex items-start gap-3 mb-3">
              <span className="text-2xl">
                {PROVIDER_ICONS[preview.provider] || "🤖"}
              </span>
              <div>
                <div className="text-sm font-bold text-current leading-tight">
                  {preview.name}
                </div>
                <div className="text-[11px] text-muted mt-0.5">
                  {preview.provider}
                </div>
              </div>
              <div className="ml-auto shrink-0">
                {preview.plan === "free" ? (
                  <span className="text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-semibold">
                    Free
                  </span>
                ) : (
                  <span className="text-[10px] bg-violet-500/15 text-violet-400 border border-violet-500/20 px-2 py-0.5 rounded-full font-semibold">
                    Pro
                  </span>
                )}
              </div>
            </div>

            <p className="text-[11px] text-muted leading-relaxed mb-3">
              {preview.description}
            </p>

            <div className="flex flex-col gap-1.5 mb-3">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-muted">Context Window</span>
                <span className="text-muted font-semibold">
                  {preview.contextWindow}
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-muted">Provider</span>
                <span className="text-muted font-semibold">
                  {preview.provider}
                </span>
              </div>
              {preview.releaseDate && (
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-muted">Rilis</span>
                  <span className="text-muted font-semibold">
                    {MONTH_LABELS[preview.releaseDate] || preview.releaseDate}
                  </span>
                </div>
              )}
            </div>

            {preview.tags && preview.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {preview.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[9px] px-1.5 py-0.5 rounded-md bg-surface border border-border text-muted font-medium capitalize"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-auto">
              {preview.plan === "pro" && (isGuest || userPlan === "free") ? (
                <div className="space-y-2">
                  <p className="text-[10px] text-violet-300">
                    Model Pro memerlukan akun & langganan berbayar.
                  </p>
                  {isGuest && (
                    <button
                      onClick={() => {
                        router.push("/login");
                        setOpen(false);
                      }}
                      className="w-full text-xs font-semibold py-2 rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white transition-all"
                    >
                      Login untuk unlock Pro
                    </button>
                  )}
                </div>
              ) : preview.id !== selectedModel ? (
                <button
                  onClick={() => selectModel(preview)}
                  className="w-full text-xs font-semibold py-2 rounded-lg bg-surface2 border border-accent/40 hover:bg-accent/20 text-accent hover:text-white transition-all"
                >
                  Pilih model ini
                </button>
              ) : (
                <div className="w-full text-xs font-semibold py-2 rounded-lg bg-accent/15 border border-accent/30 text-accent text-center">
                  ✓ Sedang digunakan
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
