"use client";

import { useState, useRef, useEffect } from "react";

interface Props {
  onSend: (text: string, attachmentUrl?: string) => void;
  isLoading: boolean;
}

export default function ChatInput({ onSend, isLoading }: Props) {
  const [value, setValue] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [uploading, setUploading] = useState(false);
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

  async function handleSubmit() {
    const text = value.trim();
    if ((!text && !file) || isLoading || uploading) return;

    let attachmentUrl: string | undefined;
    if (file) {
      try {
        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (res.ok && data.url) {
          attachmentUrl = data.url;
        } else {
          console.error("Upload failed", data);
        }
      } catch (err) {
        console.error("Upload error", err);
      } finally {
        setUploading(false);
      }
    }

    let message = text;
    if (attachmentUrl) {
      message = `${message}\n
[Attached file](${attachmentUrl})`;
    }

    onSend(message, attachmentUrl);

    setValue("");
    setFile(null);
    setPreviewUrl("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }

  return (
    <div className="shrink-0 px-4 pb-4 pt-2 border-t border-surface">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-start gap-2 bg-surface2 border border-surface2 rounded-2xl px-2 py-2 focus-within:border-accent focus-within:ring-1 focus-within:ring-accent/30 transition-all">
          <label
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface hover:bg-surface2 cursor-pointer transition-colors"
            title="Upload file"
          >
            <input
              type="file"
              accept="image/*,.txt,.pdf"
              className="hidden"
              onChange={(e) => {
                const selected = e.target.files?.[0] || null;
                setFile(selected);
                if (selected && selected.type.startsWith("image/")) {
                  setPreviewUrl(URL.createObjectURL(selected));
                } else {
                  setPreviewUrl("");
                }
              }}
            />
            <img
              src="/img/paper-clip.svg"
              alt="Clip"
              className="h-4 w-4"
              style={{ width: "16px", height: "16px" }}
            />
          </label>
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
            disabled={(!value.trim() && !file) || isLoading || uploading}
            style={{
              backgroundColor:
                (!value.trim() && !file) || isLoading || uploading
                  ? "var(--surface2)"
                  : "var(--accent)",
              borderColor:
                (!value.trim() && !file) || isLoading || uploading
                  ? "var(--border)"
                  : "transparent",
              color:
                (!value.trim() && !file) || isLoading || uploading
                  ? "var(--muted)"
                  : "var(--text)",
            }}
            className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-150 shadow-md disabled:shadow-none"
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
        <div className="mt-2 text-xs text-muted">
          {file && (
            <div className="flex items-center justify-between p-2 border border-surface2 rounded-lg bg-surface2">
              <span className="truncate">{file.name}</span>
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setPreviewUrl("");
                }}
                className="text-[10px] text-accent underline"
              >
                Remove
              </button>
            </div>
          )}

          {previewUrl && (
            <img
              src={previewUrl}
              alt="preview"
              className="mt-2 rounded max-h-28 w-auto"
            />
          )}

          <p className="mt-2 text-center text-[10px] text-muted">
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
    </div>
  );
}
