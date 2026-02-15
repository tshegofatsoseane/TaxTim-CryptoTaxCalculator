import React, { useEffect, useMemo, useState } from "react";
import styles from "./WalkthroughModal.module.css";

// Mascot
import taxTimGuy from "../../assets/guide.png";

// Step images
import step1Img from "../../assets/step1.png";
import step2Img from "../../assets/step2.png";
import step3Img from "../../assets/step3.png";
import step4Img from "../../assets/step4.png";

export default function WalkthroughModal({
  isOpen,
  onClose,
  steps,
  storageKey = "taxtim_walkthrough_dismissed_v1",
  rememberDismissal = true,
}) {
  const safeSteps = useMemo(() => steps ?? [], [steps]);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (isOpen) setIdx(0);
  }, [isOpen]);

  if (!isOpen) return null;

  const total = safeSteps.length || 1;
  const step = safeSteps[idx] ?? {};
  const isFirst = idx === 0;
  const isLast = idx === total - 1;

  const dismiss = () => {
    if (rememberDismissal) {
      try {
        localStorage.setItem(storageKey, "1");
      } catch {}
    }
    onClose?.();
  };

  const next = () => setIdx((v) => Math.min(v + 1, total - 1));
  const back = () => setIdx((v) => Math.max(v - 1, 0));

  // 👇 map images per step index
  const stepImages = {
    0: step1Img,
    1: step2Img,
    2: step3Img,
    3: step4Img,
  };

  const activeImage = stepImages[idx];

  return (
    <div className={styles.backdrop} role="dialog" aria-modal="true">
      <div className={styles.modal}>
        {/* Top bar */}
        <div className={styles.top}>
          <div className={styles.leftTop}>
            <div className={styles.kicker}>Quick walkthrough</div>
            <div className={styles.stepPill}>
              Step <b>{idx + 1}</b> / <b>{total}</b>
            </div>
          </div>

          <button className={styles.close} onClick={dismiss} aria-label="Close">
            ✕
          </button>
        </div>

        {/* Progress */}
        <div className={styles.progressRow}>
          <div className={styles.dots}>
            {Array.from({ length: total }).map((_, i) => (
              <span
                key={i}
                className={`${styles.dot} ${i === idx ? styles.dotActive : ""}`}
              />
            ))}
          </div>
          <div className={styles.progressHint}>
            Click <b>Next</b> to continue
          </div>
        </div>

        {/* Main content */}
        <div className={styles.contentRow}>
          {/* LEFT: visual */}
          <div className={styles.visual}>
            <div className={styles.visualCard}>
              {activeImage ? (
                <div className={styles.stepShotWrap}>
                  <img
                    src={activeImage}
                    alt={`Walkthrough step ${idx + 1}`}
                    className={`${styles.stepShot} ${
                      idx === 0 ? styles.stepShotLarge : ""
                    }`}
                    draggable="false"
                  />
                </div>
              ) : (
                <div className={styles.visualPlaceholder} />
              )}

              {/* Mascot (always visible) */}
              <div className={styles.mascotWrap}>
                <span className={`${styles.sparkle} ${styles.sparkle1}`} />
                <span className={`${styles.sparkle} ${styles.sparkle2}`} />
                <span className={`${styles.sparkle} ${styles.sparkle3}`} />

                <img
                  src={taxTimGuy}
                  alt="TaxTim guide"
                  className={styles.guy}
                  draggable="false"
                />
              </div>
            </div>

            <div className={styles.visualCaption}>
              {idx === 0
                ? "Paste your transactions and click Calculate."
                : "Review your results and explore the breakdowns."}
            </div>
          </div>

          {/* RIGHT: text */}
          <div className={styles.body}>
            <h3 className={styles.title}>{step.title}</h3>

            {step.subtitle && (
              <p className={styles.subtitle}>{step.subtitle}</p>
            )}

            {step.bullets?.length > 0 && (
              <ul className={styles.bullets}>
                {step.bullets.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            )}

            {step.note && <div className={styles.note}>{step.note}</div>}
          </div>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button className={styles.ghost} onClick={dismiss}>
            Skip
          </button>

          <div className={styles.footerRight}>
            <button
              className={styles.ghost}
              onClick={back}
              disabled={isFirst}
            >
              Back
            </button>

            {!isLast ? (
              <button className={styles.primary} onClick={next}>
                Next
              </button>
            ) : (
              <button className={styles.primary} onClick={dismiss}>
                Done
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
