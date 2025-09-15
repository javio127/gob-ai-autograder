export default function Logo({ size = 28 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2 select-none">
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 14c0-4 2-7 4-8 1-1 2 0 2 1 0 0 0 0 0 0 0-1 1-2 2-1 1 0 1 1 1 2 0-1 1-2 2-1 1 0 1 1 1 2 0 0 1-1 2 0 1 1 0 3-1 5-2 4-6 6-9 6-2 0-4-2-4-6z" fill="#4BAF5B"/>
      </svg>
      <span className="text-xl font-semibold tracking-tight" style={{ color: '#4BAF5B' }}>Goblins</span>
    </div>
  );
}


