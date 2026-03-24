import React, { useEffect, useState } from 'react';

/* Animated SVG cloud layer */
function CloudLayer({ style }) {
  return (
    <svg viewBox="0 0 1440 320" xmlns="http://www.w3.org/2000/svg"
      style={{ position: 'absolute', width: '100%', ...style }}>
      <defs>
        <radialGradient id="cloudGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.9)" />
          <stop offset="100%" stopColor="rgba(200,210,230,0)" />
        </radialGradient>
        <filter id="blur1">
          <feGaussianBlur stdDeviation="6" />
        </filter>
        <filter id="blur2">
          <feGaussianBlur stdDeviation="10" />
        </filter>
      </defs>
      {/* Cloud puffs */}
      <ellipse cx="200" cy="200" rx="180" ry="90" fill="rgba(255,255,255,0.08)" filter="url(#blur1)" />
      <ellipse cx="350" cy="170" rx="220" ry="100" fill="rgba(255,255,255,0.07)" filter="url(#blur1)" />
      <ellipse cx="900" cy="210" rx="260" ry="110" fill="rgba(255,255,255,0.06)" filter="url(#blur1)" />
      <ellipse cx="1150" cy="170" rx="200" ry="90" fill="rgba(255,255,255,0.08)" filter="url(#blur1)" />
      <ellipse cx="700" cy="180" rx="150" ry="70" fill="rgba(255,255,255,0.05)" filter="url(#blur2)" />
    </svg>
  );
}

/* Drifting CSS cloud elements */
function DriftClouds() {
  const clouds = [
    { w: 600, h: 220, top: '10%', left: '-5%',  dur: 60, delay: 0,    opacity: 0.12 },
    { w: 500, h: 180, top: '25%', left: '60%',  dur: 80, delay: -20,  opacity: 0.08 },
    { w: 700, h: 250, top: '55%', left: '-10%', dur: 70, delay: -35,  opacity: 0.09 },
    { w: 450, h: 160, top: '70%', left: '70%',  dur: 90, delay: -10,  opacity: 0.07 },
    { w: 350, h: 130, top: '40%', left: '30%',  dur: 55, delay: -25,  opacity: 0.06 },
  ];

  return (
    <>
      {clouds.map((c, i) => (
        <div key={i} style={{
          position: 'absolute',
          top: c.top, left: c.left,
          width: c.w, height: c.h,
          borderRadius: '50%',
          background: `radial-gradient(ellipse at 40% 40%, rgba(255,255,255,${c.opacity + 0.04}) 0%, rgba(200,215,240,${c.opacity}) 40%, transparent 70%)`,
          filter: 'blur(30px)',
          animation: `drift${i % 2 === 0 ? 'R' : 'L'} ${c.dur}s linear infinite`,
          animationDelay: `${c.delay}s`,
          pointerEvents: 'none',
        }} />
      ))}
    </>
  );
}

/* Subtle twinkling star particles */
function pseudoRandom(seed) {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function Stars() {
  const stars = Array.from({ length: 40 }, (_, index) => ({
    x: pseudoRandom(index + 1) * 100,
    y: pseudoRandom(index + 2) * 55,
    size: pseudoRandom(index + 3) * 1.5 + 0.5,
    delay: pseudoRandom(index + 4) * 4,
    dur: pseudoRandom(index + 5) * 3 + 2,
  }));
  return (
    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
      {stars.map((s, i) => (
        <circle key={i}
          cx={`${s.x}%`} cy={`${s.y}%`}
          r={s.size}
          fill="white"
          opacity="0">
          <animate attributeName="opacity" values="0;0.7;0" dur={`${s.dur}s`} begin={`${s.delay}s`} repeatCount="indefinite" />
        </circle>
      ))}
    </svg>
  );
}

export default function Landing({ onGoToLogin }) {
  const [loaded, setLoaded] = useState(false);
  const [time, setTime] = useState('');

  useEffect(() => {
    setTimeout(() => setLoaded(true), 80);
    const tick = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' }));
    };
    tick();
    const id = setInterval(tick, 10000);
    return () => clearInterval(id);
  }, []);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  return (
    <div style={{
      minHeight: '100vh',
      overflow: 'hidden',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      background: '#05101f',
    }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,700;0,800;0,900;1,700&family=Inter:wght@300;400;500;600&display=swap');

        @keyframes driftR { from { transform: translateX(0px); } to { transform: translateX(120px); } }
        @keyframes driftL { from { transform: translateX(0px); } to { transform: translateX(-120px); } }
        
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes shimmerLine {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        
        @keyframes slowFloat {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-8px); }
        }
        
        @keyframes softPulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50%       { opacity: 0.9; transform: scale(1.04); }
        }

        @keyframes sunRay {
          0%, 100% { opacity: 0.12; }
          50%       { opacity: 0.28; }
        }

        .lp-enter-btn {
          background: linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.08) 100%);
          border: 1px solid rgba(255,255,255,0.25);
          color: white;
          padding: 1rem 2.75rem;
          border-radius: 100px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          letter-spacing: 0.02em;
          transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }
        .lp-enter-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.25), transparent);
          opacity: 0;
          transition: opacity 0.3s;
          border-radius: inherit;
        }
        .lp-enter-btn:hover {
          background: linear-gradient(135deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.12) 100%);
          border-color: rgba(255,255,255,0.5);
          transform: translateY(-3px);
          box-shadow: 0 20px 60px rgba(0,0,0,0.4), 0 0 40px rgba(255,255,255,0.05);
        }
        .lp-enter-btn:hover::before { opacity: 1; }
        .lp-enter-btn:active { transform: translateY(-1px); }
      `}</style>

      {/* ── BACKGROUND CLOUDSCAPE PHOTO ── */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'url(/cloudscape.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center 30%',
        opacity: 0.45,
        transition: 'opacity 1.5s ease',
      }} />

      {/* ── DEEP OVERLAY GRADIENT ── */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to bottom, rgba(5,16,31,0.55) 0%, rgba(5,16,31,0.25) 35%, rgba(5,16,31,0.7) 75%, rgba(5,16,31,0.97) 100%)',
      }} />

      {/* ── ANIMATED CSS CLOUDS ── */}
      <DriftClouds />

      {/* ── STARS ── */}
      <Stars />

      {/* ── SUN RAYS ── */}
      {[0, 18, -18, 30, -30, 8, -8].map((angle, i) => (
        <div key={i} style={{
          position: 'absolute',
          top: '28%', left: '50%',
          width: 2,
          height: '45vh',
          background: 'linear-gradient(to bottom, rgba(255,230,160,0.6), transparent)',
          transformOrigin: 'top center',
          transform: `rotate(${angle}deg)`,
          opacity: [0.18, 0.10, 0.10, 0.07, 0.07, 0.13, 0.13][i],
          animation: `sunRay ${[4,5,5,7,7,6,6][i]}s ease-in-out infinite`,
          animationDelay: `${i * 0.4}s`,
          pointerEvents: 'none',
          filter: 'blur(1px)',
        }} />
      ))}

      {/* ── SILVER LINING LIGHT ── */}
      <div style={{
        position: 'absolute',
        top: '18%', left: '50%',
        transform: 'translateX(-50%)',
        width: '70%', height: 220,
        background: 'radial-gradient(ellipse at 50% 0%, rgba(220,210,170,0.22) 0%, rgba(180,195,220,0.12) 45%, transparent 75%)',
        filter: 'blur(20px)',
        animation: 'softPulse 6s ease-in-out infinite',
        pointerEvents: 'none',
      }} />

      {/* ── TOP NAV ── */}
      <div style={{
        position: 'absolute', top: 28, left: 32, right: 32,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        zIndex: 10,
        opacity: loaded ? 1 : 0,
        transition: 'opacity 1s ease 0.2s',
      }}>
        <a href="https://thesl.co.za" target="_blank" rel="noopener noreferrer" style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          textDecoration: 'none',
        }}>
          <div style={{ width: 8, height: 8, background: '#bff368', borderRadius: '50%', boxShadow: '0 0 8px #bff368' }} />
          <span style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 800, fontSize: '1.1rem',
            color: 'rgba(255,255,255,0.9)',
            letterSpacing: '-0.02em',
          }}>THESL</span>
        </a>
        <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.35)', fontWeight: 500, letterSpacing: '0.05em' }}>
          {time}
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div style={{
        position: 'relative', zIndex: 10,
        textAlign: 'center',
        padding: '0 1.5rem',
        maxWidth: 640,
      }}>

        {/* Greeting */}
        <div style={{
          fontSize: '0.85rem',
          fontWeight: 500,
          color: 'rgba(255,255,255,0.4)',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          marginBottom: '2rem',
          opacity: loaded ? 1 : 0,
          transform: loaded ? 'translateY(0)' : 'translateY(16px)',
          transition: 'all 0.8s ease 0.1s',
        }}>
          {greeting}
        </div>

        {/* Logo mark */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          marginBottom: '1.75rem',
          opacity: loaded ? 1 : 0,
          transform: loaded ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.9s cubic-bezier(0.4,0,0.2,1) 0.2s',
          animation: loaded ? 'slowFloat 7s ease-in-out infinite' : 'none',
        }}>
          <div style={{
            width: 72, height: 72,
            borderRadius: 22,
            background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.06) 100%)',
            border: '1px solid rgba(255,255,255,0.2)',
            backdropFilter: 'blur(16px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '1.25rem',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
          }}>
            <div style={{ width: 10, height: 10, background: '#bff368', borderRadius: '50%', boxShadow: '0 0 16px #bff368, 0 0 32px rgba(191,243,104,0.4)' }} />
          </div>
        </div>

        {/* Headline */}
        <h1 style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: 'clamp(2.4rem, 5.5vw, 3.75rem)',
          fontWeight: 900,
          lineHeight: 1.08,
          letterSpacing: '-0.04em',
          marginBottom: '1rem',
          opacity: loaded ? 1 : 0,
          transform: loaded ? 'translateY(0)' : 'translateY(22px)',
          transition: 'all 1s cubic-bezier(0.4,0,0.2,1) 0.35s',
          color: 'white',
        }}>
          Finding the{' '}
          <span style={{
            background: 'linear-gradient(130deg, #e8e0c8 0%, #c8d4e8 40%, #bff368 100%)',
            backgroundSize: '200% auto',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            animation: 'shimmerLine 5s linear infinite',
          }}>
            THESL
          </span>
          <br />
          in Every Day.
        </h1>

        {/* Subline */}
        <p style={{
          fontSize: '1.05rem',
          color: 'rgba(255,255,255,0.45)',
          fontWeight: 400,
          lineHeight: 1.7,
          marginBottom: '2.75rem',
          maxWidth: 420,
          margin: '0 auto 2.75rem',
          opacity: loaded ? 1 : 0,
          transform: loaded ? 'translateY(0)' : 'translateY(18px)',
          transition: 'all 1s ease 0.5s',
        }}>
          Your Thesl HR workspace.<br />Leave, performance, documents — all in one place.
        </p>

        {/* CTA */}
        <div style={{
          opacity: loaded ? 1 : 0,
          transform: loaded ? 'translateY(0)' : 'translateY(16px)',
          transition: 'all 1s ease 0.65s',
        }}>
          <button className="lp-enter-btn" onClick={onGoToLogin}>
            Enter Workspace →
          </button>
        </div>
      </div>

      {/* ── BOTTOM FOOTER ── */}
      <div style={{
        position: 'absolute', bottom: 28, left: 0, right: 0,
        textAlign: 'center',
        zIndex: 10,
        opacity: loaded ? 1 : 0,
        transition: 'opacity 1.2s ease 0.8s',
      }}>
        <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.05em', fontWeight: 500 }}>
          © 2026 Thesl South Africa (Pty) Ltd · Powered by SLVRCLD.com
        </p>
      </div>
    </div>
  );
}
