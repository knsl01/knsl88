import React from "react";
import { User } from "lucide-react";

function initials(name) {
  const n = String(name || "U").trim();
  return n.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "U";
}

export default function UserAvatar({ user, size = 40, className = "" }) {
  const px = size;
  const url = user?.avatarUrl;
  const style = {
    width: px,
    height: px,
    borderRadius: Math.round(px * 0.28),
    objectFit: "cover",
    flexShrink: 0,
    border: "1px solid var(--line)",
    background: "linear-gradient(135deg,rgba(19,133,92,0.25),#101413)",
  };

  if (url) {
    return (
      <img
        src={url}
        alt=""
        className={`user-photo ${className}`.trim()}
        style={style}
        width={px}
        height={px}
      />
    );
  }

  return (
    <div
      className={`gold-text ${className}`.trim()}
      style={{
        ...style,
        display: "grid",
        placeItems: "center",
        fontSize: Math.max(11, px * 0.32),
        fontWeight: 600,
      }}
      aria-hidden
    >
      {initials(user?.name || user?.username)}
    </div>
  );
}

export function UserAvatarIcon({ size = 16 }) {
  return <User size={size} strokeWidth={1.8} />;
}
