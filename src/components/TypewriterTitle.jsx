import { useEffect, useRef, useState } from "react";

const TYPE_SPEED = 120;
const DELETE_SPEED = 60;
const PAUSE_MS = 2500;

export default function TypewriterTitle({ className = "", phrases }) {
  const [displayedText, setDisplayedText] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const [phraseIndex, setPhraseIndex] = useState(0);
  const timerRef = useRef(null);

  const currentPhrase = phrases[phraseIndex] || "";

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReducedMotion) {
      setDisplayedText(currentPhrase);
      setIsComplete(true);
      return;
    }

    let index = 0;
    let phase = "typing"; // 'typing' | 'waiting' | 'deleting'

    const schedule = (delay) => {
      timerRef.current = window.setTimeout(() => {
        if (phase === "typing") {
          index += 1;
          setDisplayedText(currentPhrase.slice(0, index));
          if (index >= currentPhrase.length) {
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
          setDisplayedText(currentPhrase.slice(0, index));
          if (index <= 0) {
            // Move to next phrase
            setPhraseIndex((prev) => (prev + 1) % phrases.length);
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
  }, [currentPhrase, phrases.length]);

  return (
    <h1 aria-label={currentPhrase} className={className}>
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
