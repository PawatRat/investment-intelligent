import { useEffect, useState } from "react";

export default function TypewriterTitle({ className = "", text }) {
  const [displayedText, setDisplayedText] = useState("");
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      setDisplayedText(text);
      setIsComplete(true);
      return;
    }

    setDisplayedText("");
    setIsComplete(false);

    let index = 0;
    const timer = window.setInterval(() => {
      index += 1;
      setDisplayedText(text.slice(0, index));

      if (index >= text.length) {
        window.clearInterval(timer);
        setIsComplete(true);
      }
    }, 48);

    return () => window.clearInterval(timer);
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
