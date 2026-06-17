import React from 'react';

export default function Logo({ variant = 'full' }) {
  const Mark = () => (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
      {/* Signal Waves */}
      <path d="M 9 13 A 5 5 0 0 0 9 21" stroke="#9F7AEA" strokeWidth="1.5" strokeLinecap="round" opacity="0.9" />
      <path d="M 5 10 A 9 9 0 0 0 5 24" stroke="#9F7AEA" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
      
      <path d="M 23 13 A 5 5 0 0 1 23 21" stroke="#9F7AEA" strokeWidth="1.5" strokeLinecap="round" opacity="0.9" />
      <path d="M 27 10 A 9 9 0 0 1 27 24" stroke="#9F7AEA" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />

      {/* Anchor */}
      <circle cx="16" cy="6" r="2.5" stroke="#63B3ED" strokeWidth="2" />
      <path d="M 16 8.5 V 26" stroke="#63B3ED" strokeWidth="2" strokeLinecap="round" />
      <path d="M 11 13 H 21" stroke="#63B3ED" strokeWidth="2" strokeLinecap="round" />
      <path d="M 9 21 C 9 28 23 28 23 21" stroke="#63B3ED" strokeWidth="2" strokeLinecap="round" />
      <path d="M 9 21 L 6.5 18" stroke="#63B3ED" strokeWidth="2" strokeLinecap="round" />
      <path d="M 23 21 L 25.5 18" stroke="#63B3ED" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );

  if (variant === 'mark') {
    return <Mark />;
  }

  return (
    <div className="flex items-center" style={{ gap: '12px', height: '40px' }}>
      <Mark />
      <div className="flex flex-col justify-center">
        <span 
          style={{ 
            fontFamily: 'Space Grotesk, sans-serif', 
            fontSize: '20px', 
            fontWeight: 700, 
            letterSpacing: '4px', 
            color: '#F0F4FF',
            lineHeight: 1
          }}
        >
          HARBINGER
        </span>
        <span 
          style={{ 
            fontFamily: 'Inter, sans-serif',
            fontSize: '8px', 
            letterSpacing: '2px', 
            color: '#8892A4',
            marginTop: '2px',
            lineHeight: 1
          }}
        >
          COMMODITY INTELLIGENCE
        </span>
      </div>
    </div>
  );
}
