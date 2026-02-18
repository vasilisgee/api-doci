"use client";

import { useEffect, useState } from "react";

const SHOW_AFTER_PX = 280;

export function BackToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setIsVisible(window.scrollY > SHOW_AFTER_PX);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo(0, 0);
  };

  return (
    <button
      type="button"
      aria-label="Back to top"
      className={`back-to-top${isVisible ? " is-visible" : ""}`}
      onClick={scrollToTop}
    >
      ↑
    </button>
  );
}
