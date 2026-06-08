import React from "react";

const PHRASES = [
  "Reduce Legal Workload",
  "Work Faster",
  "Less Repetitive Tasks",
  "Better Decisions",
  "Faster Research",
  "Smarter Workflows",
];

const MARQUEE_TEXT = PHRASES.map((p) => `${p} •`).join(" ");

export default function AuthMobileMarquee() {
  return (
    <div className="auth-marquee" aria-hidden="true">
      <div className="auth-marquee-fade auth-marquee-fade-left" />
      <div className="auth-marquee-fade auth-marquee-fade-right" />
      <div className="auth-marquee-track">
        <span className="auth-marquee-text">{MARQUEE_TEXT}</span>
        <span className="auth-marquee-text">{MARQUEE_TEXT}</span>
      </div>
    </div>
  );
}
