export default function VehicleSvg({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 600 260" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path
          d="M70 188 C70 168 86 152 106 152 L188 152 C206 122 240 104 286 104 L372 104 C420 104 452 124 472 156 L506 162 C524 166 536 182 536 200"
          stroke="var(--glow-teal)"
          strokeWidth="9"
        />
        <path
          d="M196 152 C214 124 244 110 286 110 L364 110 C404 110 432 128 450 154 Z"
          fill="#dbe9ff"
          stroke="var(--glow-teal)"
          strokeWidth="3"
        />
        <line x1="300" y1="110" x2="300" y2="152" stroke="var(--glow-teal)" strokeWidth="3" />
        <path d="M70 188 L536 188" stroke="var(--glow-teal)" strokeWidth="9" />
        <circle cx="178" cy="196" r="40" fill="#fff" stroke="#0b0f14" strokeWidth="11" />
        <circle cx="178" cy="196" r="15" fill="var(--glow-teal)" />
        <circle cx="438" cy="196" r="40" fill="#fff" stroke="#0b0f14" strokeWidth="11" />
        <circle cx="438" cy="196" r="15" fill="var(--glow-teal)" />
        <path d="M508 168 L530 172" stroke="#5ac8fa" strokeWidth="7" />
      </g>
    </svg>
  );
}
