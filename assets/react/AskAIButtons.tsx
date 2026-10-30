'use client';
/**
 * AskAIButtons — "Open in ChatGPT" + "Copy as Markdown" for a page's .md mirror.
 *
 * Pairs with the chanmeng-geo-markdown-mirror skill. Point it at the SAME-SITE mirror
 * (e.g. "/llms/pricing.md"), not a GitHub raw URL — the on-site mirror works for
 * private repos, custom domains, and pages with no markdown source.
 *
 * Usage (Next.js App Router page, Docusaurus swizzle, any React app):
 *   <AskAIButtons mirrorPath="/llms/pricing.md" />
 *
 * It reads window.location.origin at click time, so the absolute URL it hands to
 * ChatGPT is correct in dev and prod without hardcoding the domain.
 *
 * Styling: minimal inline styles so it drops in anywhere. Replace with your own
 * classes/CSS modules if you want it to match your design system.
 */
import React, { useState } from 'react';

export interface AskAIButtonsProps {
  /** Site-root path to this page's markdown mirror, e.g. "/llms/pricing.md". */
  mirrorPath: string;
  /** Optional label override. */
  className?: string;
}

export default function AskAIButtons({ mirrorPath, className }: AskAIButtonsProps) {
  const [copied, setCopied] = useState(false);

  const absoluteMirror = () =>
    (typeof window !== 'undefined' ? window.location.origin : '') + mirrorPath;

  const openInChatGPT = () => {
    const prompt = `Read ${absoluteMirror()}`;
    const url = `https://chatgpt.com/?hints=search&prompt=${encodeURIComponent(prompt)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const copyMarkdown = async () => {
    try {
      const md = await fetch(mirrorPath).then((r) => r.text());
      await navigator.clipboard.writeText(md);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: open the raw mirror so the user can copy it manually.
      window.open(mirrorPath, '_blank', 'noopener,noreferrer');
    }
  };

  const btn: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.4em',
    padding: '0.4em 0.8em',
    fontSize: '0.85rem',
    fontWeight: 500,
    lineHeight: 1.2,
    border: '1px solid currentColor',
    borderRadius: '8px',
    background: 'transparent',
    color: 'inherit',
    cursor: 'pointer',
  };

  return (
    <div
      className={className}
      style={{ display: 'inline-flex', gap: '0.5rem', flexWrap: 'wrap' }}
    >
      <button type="button" style={btn} onClick={openInChatGPT} title="Open this page in ChatGPT">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
        Open in ChatGPT
      </button>
      <button type="button" style={btn} onClick={copyMarkdown} title="Copy this page as Markdown">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <rect x="9" y="9" width="13" height="13" rx="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
        {copied ? 'Copied!' : 'Copy as Markdown'}
      </button>
    </div>
  );
}
