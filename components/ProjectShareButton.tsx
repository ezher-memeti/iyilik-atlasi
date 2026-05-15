"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  AtSign,
  Check,
  Copy,
  MessageCircle,
  Send,
  Share2,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

type SharePlatform = "copy_link" | "whatsapp" | "telegram" | "twitter" | "native_share";

type ProjectShareButtonProps = {
  title: string;
  description: string;
  url: string;
};

function toAbsoluteUrl(url: string) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (typeof window === "undefined") return url;
  return new URL(url, window.location.origin).toString();
}

function isLikelyMobile() {
  if (typeof window === "undefined") return false;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  return coarse || window.innerWidth < 1024;
}

function trackShare(platform: SharePlatform, payload: { title: string; url: string }) {
  if (typeof window === "undefined") return;
  const detail = {
    share_platform: platform,
    project_title: payload.title,
    project_url: payload.url,
    timestamp: Date.now(),
  };
  window.dispatchEvent(new CustomEvent("project_shared", { detail }));
  window.dispatchEvent(new CustomEvent("share_platform", { detail }));
}

export function ProjectShareButton({ title, description, url }: ProjectShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isNativeSharing, setIsNativeSharing] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const [popoverPosition, setPopoverPosition] = useState<{ top: number; left: number } | null>(null);

  const absoluteUrl = useMemo(() => toAbsoluteUrl(url), [url]);
  const shareText = useMemo(() => `${title}\n${absoluteUrl}`.trim(), [title, absoluteUrl]);
  const canUseNative =
    typeof navigator !== "undefined" && typeof navigator.share === "function" && isLikelyMobile();

  useEffect(() => {
    if (!isOpen) return;
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPopoverPosition({
        top: rect.bottom + 8,
        left: rect.right - 192,
      });
    }
    const onClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const clickedInsideWrapper = wrapperRef.current?.contains(target);
      const clickedInsidePopover = popoverRef.current?.contains(target);
      if (!clickedInsideWrapper && !clickedInsidePopover) {
        setIsOpen(false);
      }
    };

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEscape);
    const onScrollOrResize = () => {
      if (!buttonRef.current) return;
      const rect = buttonRef.current.getBoundingClientRect();
      setPopoverPosition({
        top: rect.bottom + 8,
        left: rect.right - 192,
      });
    };
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEscape);
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(timer);
  }, [copied]);

  async function handleNativeShare() {
    if (!canUseNative || !navigator.share) return;
    try {
      setIsNativeSharing(true);
      await navigator.share({
        title,
        text: description,
        url: absoluteUrl,
      });
      trackShare("native_share", { title, url: absoluteUrl });
    } catch {
      // User cancelled share sheet; silently ignore.
    } finally {
      setIsNativeSharing(false);
    }
  }

  async function handleCopy() {
    if (!absoluteUrl) return;
    try {
      await navigator.clipboard.writeText(absoluteUrl);
      setCopied(true);
      trackShare("copy_link", { title, url: absoluteUrl });
      setIsOpen(false);
    } catch {
      // Clipboard permission issue; no alert to keep flow calm.
    }
  }

  function openShareUrl(platform: Exclude<SharePlatform, "copy_link" | "native_share">) {
    if (!absoluteUrl) return;

    const encodedUrl = encodeURIComponent(absoluteUrl);
    const encodedText = encodeURIComponent(shareText);

    const shareMap = {
      whatsapp: `https://wa.me/?text=${encodedText}`,
      telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodeURIComponent(title)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodedUrl}`,
    } as const;

    window.open(shareMap[platform], "_blank", "noopener,noreferrer");
    trackShare(platform, { title, url: absoluteUrl });
    setIsOpen(false);
  }

  return (
    <div ref={wrapperRef} className="relative z-20">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => {
          if (canUseNative) {
            void handleNativeShare();
            return;
          }
          setIsOpen((current) => !current);
        }}
        aria-label="Projeyi paylaş"
        className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-slate-500 backdrop-blur-sm transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/35"
      >
        {isNativeSharing ? <Send className="h-4 w-4 animate-pulse" /> : <Share2 className="h-4 w-4" />}
      </button>

      {typeof document !== "undefined"
        ? createPortal(
            <AnimatePresence>
              {isOpen && popoverPosition ? (
                <motion.div
                  ref={popoverRef}
                  initial={{ opacity: 0, y: 6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.98 }}
                  transition={{ duration: 0.16, ease: "easeOut" }}
                  className="fixed z-[70] w-48 rounded-xl border border-slate-200/80 bg-white/95 p-1.5 shadow-[0_10px_30px_rgba(15,23,42,0.14)] backdrop-blur-md"
                  style={{ top: popoverPosition.top, left: Math.max(12, popoverPosition.left) }}
                >
                  <button
                    type="button"
                    onClick={() => void handleCopy()}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-100"
                  >
                    <Copy className="h-4 w-4 text-slate-500" />
                    <span>Bağlantıyı Kopyala</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => openShareUrl("whatsapp")}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-100"
                  >
                    <MessageCircle className="h-4 w-4 text-slate-500" />
                    <span>WhatsApp</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => openShareUrl("telegram")}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-100"
                  >
                    <Send className="h-4 w-4 text-slate-500" />
                    <span>Telegram</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => openShareUrl("twitter")}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-100"
                  >
                    <AtSign className="h-4 w-4 text-slate-500" />
                    <span>X / Twitter</span>
                  </button>
                </motion.div>
              ) : null}
            </AnimatePresence>,
            document.body,
          )
        : null}

      <AnimatePresence>
        {copied ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-full border border-slate-200 bg-white/95 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-md backdrop-blur"
          >
            <span className="inline-flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-emerald-600" />
              Bağlantı kopyalandı
            </span>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
