// ✅ Create: src/components/Tooltip/Tooltip.jsx
import React, { useEffect, useId, useRef, useState } from "react";
import styles from "./Tooltip.module.css";

/**
 * Tooltip (reusable)
 *
 * Usage:
 * <Tooltip content={<div>...</div>} placement="top">
 *   <button>?</button>
 * </Tooltip>
 *
 * Props:
 * - content: ReactNode (required)
 * - children: ReactElement (required; gets aria + handlers)
 * - placement: "top" | "bottom" | "left" | "right"
 * - align: "start" | "center" | "end"
 * - maxWidth: number (px)
 * - offset: number (px)
 * - interactive: boolean (default true)
 */
export default function Tooltip({
  content,
  children,
  placement = "top",
  align = "center",
  maxWidth = 340,
  offset = 10,
  interactive = true,
}) {
  const id = useId();
  const wrapRef = useRef(null);

  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ left: 0, top: 0, transform: "" });

  const computePosition = () => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    const trigger = wrap.querySelector("[data-tooltip-trigger='true']");
    const bubble = wrap.querySelector("[data-tooltip-bubble='true']");
    if (!trigger || !bubble) return;

    // Show bubble invisibly to measure
    bubble.style.visibility = "hidden";
    bubble.style.display = "block";

    const t = trigger.getBoundingClientRect();
    const b = bubble.getBoundingClientRect();
    const pad = 8;

    const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

    const alignX = () => {
      if (align === "start") return t.left;
      if (align === "end") return t.right - b.width;
      return t.left + t.width / 2 - b.width / 2;
    };

    const alignY = () => {
      if (align === "start") return t.top;
      if (align === "end") return t.bottom - b.height;
      return t.top + t.height / 2 - b.height / 2;
    };

    let left = 0;
    let top = 0;

    if (placement === "top") {
      left = alignX();
      top = t.top - b.height - offset;
    } else if (placement === "bottom") {
      left = alignX();
      top = t.bottom + offset;
    } else if (placement === "left") {
      left = t.left - b.width - offset;
      top = alignY();
    } else {
      left = t.right + offset;
      top = alignY();
    }

    // Keep inside viewport (with padding)
    left = clamp(left, pad, window.innerWidth - b.width - pad);
    top = clamp(top, pad, window.innerHeight - b.height - pad);

    // Use fixed positioning for reliability
    setPos({ left, top, transform: "translate3d(0,0,0)" });

    // restore
    bubble.style.visibility = "";
    bubble.style.display = "";
  };

  useEffect(() => {
    if (!open) return;
    computePosition();

    const onScroll = () => computePosition();
    const onResize = () => computePosition();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, placement, align, maxWidth, offset]);

  const close = () => setOpen(false);
  const openNow = () => setOpen(true);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  // Click outside to close (only if open)
  useEffect(() => {
    if (!open) return;
    const onDocMouseDown = (e) => {
      const wrap = wrapRef.current;
      if (!wrap) return;
      if (!wrap.contains(e.target)) close();
    };
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [open]);

  const triggerProps = {
    "data-tooltip-trigger": "true",
    "aria-describedby": open ? id : undefined,
    onMouseEnter: openNow,
    onMouseLeave: () => {
      if (!interactive) close();
    },
    onFocus: openNow,
    onBlur: close,
    onClick: (e) => {
      // allow toggle on click (nice on mobile)
      e.preventDefault();
      setOpen((v) => !v);
    },
  };

  const child = React.isValidElement(children)
    ? React.cloneElement(children, {
        ...triggerProps,
        ...children.props,
      })
    : children;

  return (
    <span className={styles.wrap} ref={wrapRef}>
      {child}

      {open && (
        <div
          id={id}
          role="tooltip"
          data-tooltip-bubble="true"
          className={`${styles.bubble} ${styles[placement]}`}
          style={{
            left: pos.left,
            top: pos.top,
            transform: pos.transform,
            maxWidth,
          }}
          onMouseEnter={() => interactive && openNow()}
          onMouseLeave={() => interactive && close()}
        >
          <div className={styles.content}>{content}</div>
          <div className={styles.arrow} />
        </div>
      )}
    </span>
  );
}
