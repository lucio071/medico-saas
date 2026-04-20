import type { ReactNode } from "react";

function Wrap({ children }: { children: ReactNode }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      {children}
    </svg>
  );
}

export const NavIcons = {
  calendar: (
    <Wrap>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 11h18" />
    </Wrap>
  ),
  users: (
    <Wrap>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" transform="translate(3 0)" />
      <circle cx="12" cy="7" r="4" />
    </Wrap>
  ),
  user: (
    <Wrap>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </Wrap>
  ),
  office: (
    <Wrap>
      <path d="M3 21h18" />
      <path d="M5 21V7l7-4 7 4v14" />
      <path d="M9 9h.01M9 13h.01M9 17h.01M15 9h.01M15 13h.01M15 17h.01" />
    </Wrap>
  ),
  clock: (
    <Wrap>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </Wrap>
  ),
  prescription: (
    <Wrap>
      <path d="M9 3h7a3 3 0 0 1 3 3v2a3 3 0 0 1-3 3H9V3z" />
      <path d="M9 14l6 7M13 14l-4 7" />
    </Wrap>
  ),
  chart: (
    <Wrap>
      <path d="M3 3v18h18" />
      <path d="M7 15l4-4 4 4 5-5" />
    </Wrap>
  ),
  history: (
    <Wrap>
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 3v5h5" />
      <path d="M12 7v5l3 2" />
    </Wrap>
  ),
  briefcase: (
    <Wrap>
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
    </Wrap>
  ),
  settings: (
    <Wrap>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </Wrap>
  ),
  search: (
    <Wrap>
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </Wrap>
  ),
  plus: (
    <Wrap>
      <path d="M12 5v14M5 12h14" />
    </Wrap>
  ),
  list: (
    <Wrap>
      <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
    </Wrap>
  ),
  stethoscope: (
    <Wrap>
      <path d="M4 4l3 3v5a5 5 0 0 0 10 0V7l3-3" />
      <circle cx="17" cy="17" r="3" />
      <path d="M12 17v2" />
    </Wrap>
  ),
  heart: (
    <Wrap>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </Wrap>
  ),
  shield: (
    <Wrap>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </Wrap>
  ),
};
