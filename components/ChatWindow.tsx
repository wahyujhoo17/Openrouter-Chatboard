"use client";

import { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import type { Message } from "@/app/page";

interface Props {
  messages: Message[];
  isLoading: boolean;
  isGuest?: boolean;
}

function CopyButton({ text }: { text: string }) {
  const ref = useRef<HTMLButtonElement>(null);
  return (
    <button
      ref={ref}
      onClick={() => {
        navigator.clipboard.writeText(text).then(() => {
          if (ref.current) {
            ref.current.textContent = "Copied!";
            setTimeout(() => {
              if (ref.current) ref.current.textContent = "Copy";
            }, 1500);
          }
        });
      }}
      className="text-[11px] text-muted hover:text-current px-2 py-0.5 rounded transition-colors font-medium"
    >
      Copy
    </button>
  );
}

export default function ChatWindow({ messages, isLoading }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center px-6 overflow-y-auto">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center text-white text-xl font-bold mb-5 shadow-lg shadow-violet-900/30">
          AI
        </div>
        <h2 className="text-xl font-semibold text-current mb-2">
          How can I help you today?
        </h2>
        <p className="text-sm text-muted max-w-md">
          Ask me anything — I can help with coding, writing, analysis, math, and
          much more.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-8 w-full max-w-lg">
          {[
            "Explain quantum computing in simple terms",
            "Write a Python function to sort a list",
            "What are the best practices for REST APIs?",
            "Help me debug this JavaScript code",
          ].map((hint) => (
            <button
              key={hint}
              className="text-left text-sm px-4 py-3 rounded-xl border border-border bg-surface2 hover:bg-surface text-muted hover:text-current transition-all duration-150"
            >
              {hint}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 surface text-current">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex gap-3 message-appear ${msg.role === "user" ? "justify-end" : "justify-start"}`}
        >
          {msg.role === "assistant" && (
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5">
              AI
            </div>
          )}

          <div
            className={`group relative max-w-[85%] ${msg.role === "user" ? "max-w-[75%]" : ""}`}
          >
            {/* Removed Assistant label per UI request */}
            <div
              className={
                msg.role === "user"
                  ? "bg-gradient-to-br from-violet-600 to-blue-600 text-white px-4 py-3 rounded-2xl rounded-tr-sm shadow-md text-sm leading-relaxed"
                  : "bg-surface text-current px-4 py-3 rounded-2xl rounded-tr-sm border border-border shadow-sm text-sm leading-relaxed"
              }
            >
              {msg.role === "user" ? (
                <p className="whitespace-pre-wrap leading-relaxed">
                  {msg.content}
                </p>
              ) : (
                <div className="prose-chat">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code({ node, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || "");
                        const isBlock =
                          !!(props as { inline?: boolean }).inline === false &&
                          match;
                        if (isBlock) {
                          return (
                            <div className="relative group/code my-3">
                              <div className="flex items-center justify-between px-3 py-1.5 bg-surface2 border border-border rounded-t-lg">
                                <span className="text-[11px] text-muted font-mono uppercase tracking-wider">
                                  {match[1]}
                                </span>
                                <CopyButton
                                  text={String(children).replace(/\n$/, "")}
                                />
                              </div>
                              <SyntaxHighlighter
                                style={oneDark}
                                language={match[1]}
                                PreTag="div"
                                customStyle={{
                                  margin: 0,
                                  borderRadius: "0 0 8px 8px",
                                  border: "1px solid var(--border)",
                                  borderTop: "none",
                                  fontSize: "0.8rem",
                                }}
                              >
                                {String(children).replace(/\n$/, "")}
                              </SyntaxHighlighter>
                            </div>
                          );
                        }
                        return (
                          <code className={className} {...props}>
                            {children}
                          </code>
                        );
                      },
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>
              )}
            </div>

            {/* Copy button for AI messages */}
            {msg.role === "assistant" && (
              <div className="flex items-center gap-1 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <CopyButton text={msg.content} />
              </div>
            )}
          </div>

          {msg.role === "user" && (
            <div className="w-8 h-8 rounded-lg bg-surface2 border border-border flex items-center justify-center text-xs font-semibold text-accent shrink-0 mt-0.5">
              You
            </div>
          )}
        </div>
      ))}

      {/* Typing indicator */}
      {isLoading && (
        <div className="flex gap-3 justify-start message-appear">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
            AI
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              {/* removed Assistant label */}
            </div>
            <div className="flex items-center gap-1.5 px-4 py-3 bg-surface2 rounded-2xl rounded-tl-sm border border-border">
              <div className="w-2 h-2 rounded-full bg-[var(--accent)] typing-dot" />
              <div className="w-2 h-2 rounded-full bg-[var(--accent)] typing-dot" />
              <div className="w-2 h-2 rounded-full bg-[var(--accent)] typing-dot" />
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
