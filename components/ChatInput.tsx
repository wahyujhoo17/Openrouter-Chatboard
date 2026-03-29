"use client";

import { useState, useRef, useEffect } from "react";

interface Props {
  onSend: (text: string) => void;
  isLoading: boolean;
}

export default function ChatInput({ onSend, isLoading }: Props) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isLoading) {
      textareaRef.current?.focus();
    }
  }, [isLoading]);

  function autoResize() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 180) + "px";
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  function handleSubmit() {
    const text = value.trim();
    if (!text || isLoading) return;
    onSend(text);
    setValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }

  return (
    <div className="shrink-0 px-4 pb-4 pt-2 border-t border-surface">
      <div className="max-w-3xl mx-auto">
        <div className="relative flex items-end gap-2 bg-surface2 border border-surface2 rounded-2xl px-4 py-3 focus-within:border-accent focus-within:ring-1 focus-within:ring-accent/30 transition-all">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              autoResize();
            }}
            onKeyDown={handleKeyDown}
            placeholder="Message AI Chatboard..."
            disabled={isLoading}
            rows={1}
            className="flex-1 bg-transparent text-current placeholder:text-muted text-sm resize-none focus:outline-none leading-relaxed max-h-[180px] disabled:opacity-60"
          />
          <button
            onClick={handleSubmit}
            disabled={!value.trim() || isLoading}
            style={{
              backgroundColor:
                !value.trim() || isLoading
                  ? "var(--surface2)"
                  : "var(--accent)",
              borderColor:
                !value.trim() || isLoading ? "var(--border)" : "transparent",
              color: !value.trim() || isLoading ? "var(--muted)" : "#ffffff",
            }}
            className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-150 shadow-md disabled:shadow-none"
            title="Send (Enter)"
          >
            {isLoading ? (
              <svg
                className="animate-spin w-4 h-4"
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
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 2L11 13" />
                <path d="M22 2L15 22 11 13 2 9l20-7z" />
              </svg>
            )}
          </button>
        </div>
        <p className="text-center text-[10px] text-muted mt-2">
          Press{" "}
          <kbd className="font-mono bg-surface2 px-1 py-0.5 rounded text-muted">
            Enter
          </kbd>{" "}
          to send ·{" "}
          <kbd className="font-mono bg-surface2 px-1 py-0.5 rounded text-muted">
            Shift+Enter
          </kbd>{" "}
          for new line
        </p>
      </div>
    </div>
  );
}
