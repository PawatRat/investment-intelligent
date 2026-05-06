import { useEffect, useRef, useState } from "react";

const TYPE_SPEED = 120;
const DELETE_SPEED = 60;
const PAUSE_MS = 3000;

export default function TypewriterTitle({ className = "", text }) {
  const [displayedText, setDisplayedText] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReducedMotion) {
      setDisplayedText(text);
      setIsComplete(true);
      return;
    }

    let index = 0;
    let phase = "typing"; // 'typing' | 'waiting' | 'deleting'

    const schedule = (delay) => {
      timerRef.current = window.setTimeout(() => {
        if (phase === "typing") {
          index += 1;
          setDisplayedText(text.slice(0, index));
          if (index >= text.length) {
            phase = "waiting";
            setIsComplete(true);
            schedule(PAUSE_MS);
          } else {
            schedule(TYPE_SPEED);
          }
        } else if (phase === "waiting") {
          phase = "deleting";
          setIsComplete(false);
          schedule(DELETE_SPEED);
        } else if (phase === "deleting") {
          index -= 1;
          setDisplayedText(text.slice(0, index));
          if (index <= 0) {
            phase = "typing";
            schedule(TYPE_SPEED);
          } else {
            schedule(DELETE_SPEED);
          }
        }
      }, delay);
    };

    setDisplayedText("");
    setIsComplete(false);
    schedule(TYPE_SPEED);

    return () => window.clearTimeout(timerRef.current);
  }, [text]);

  return (
    <h1 aria-label={text} className={className}>
      <span aria-hidden="true">{displayedText}</span>
      <span
        aria-hidden="true"
        className={`ml-1 inline-block w-[0.08em] bg-black align-[-0.05em] ${
          isComplete ? "typing-cursor" : ""
        }`}
      >
        &nbsp;
      </span>
    </h1>
  );
}
