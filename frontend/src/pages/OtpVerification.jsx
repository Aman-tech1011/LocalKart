import React, { useEffect, useMemo, useRef, useState } from 'react';
import './OtpVerification.css';

// OTP verification — Micro UI #3/10 V4 look (3D glass cubes, space scene),
// wired to the REAL backend. What was deliberately NOT taken from the demo:
//  - the demo's hardcoded code — verification is POST /auth/verify-email
//    and the backend compares the hash of the code it emailed
//  - the SMS pill (showing the code + a Fill button) —
//    showing the code on screen would defeat verification entirely.
//    Real autofill still works via autocomplete="one-time-code"
//  - the auto-Fill demo that types the code for you
//  - the Replay button — a real success navigates into the app
//  - the 30s resend timer — the backend enforces a 60s cooldown
//    (RESEND_COOLDOWN_MS), so the countdown is 60s and never 429s
//    on a normal tap. Backend messages are shown verbatim.

const N = 6;
const RESEND_SECONDS = 60; // must match backend RESEND_COOLDOWN_MS
const CODE_TTL_SECONDS = 600; // must match backend OTP_TTL_MS
const ANIMATION_MS = 2400;

const CUBE_ANGLES = [-150, -90, -30, 30, 90, 150];
const CUBE_POS = CUBE_ANGLES.map((a) => {
  const r = (a * Math.PI) / 180;
  return { x: 50 + 37 * Math.cos(r), y: 50 + 38 * Math.sin(r) };
});

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const easeInOut = (t) => t * t * (3 - 2 * t);

function formatSeconds(total) {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export default function OtpVerification({ email, onVerify, onResend, onBack, onSuccess }) {
  const [digits, setDigits] = useState(Array(N).fill(''));
  const [phase, setPhase] = useState('idle'); // idle | verifying | error | success
  const [message, setMessage] = useState('');
  const [messageKind, setMessageKind] = useState(''); // '' | 'err' | 'good' | 'info'
  const [resendIn, setResendIn] = useState(RESEND_SECONDS);
  const [expiresIn, setExpiresIn] = useState(CODE_TTL_SECONDS);
  const [locked, setLocked] = useState(false);

  const rootRef = useRef(null);
  const stageRef = useRef(null);
  const rowRef = useRef(null);
  const cardRef = useRef(null);
  const haloRef = useRef(null);
  const inputsRef = useRef([]);
  const nodesRef = useRef([]);
  const coreNodeRef = useRef(null);
  const mountedRef = useRef(true);
  const lockedRef = useRef(false);
  const orbitAnimsRef = useRef([]);
  const scrambleRef = useRef(null);
  const coreOutRef = useRef(null);

  const reduceMotion = useMemo(
    () => window.matchMedia('(prefers-reduced-motion:reduce)').matches,
    []
  );

  const stars = useMemo(
    () =>
      Array.from({ length: 90 }, () => {
        const z = Math.random() * 1.8 + 0.6;
        return {
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          width: `${z}px`,
          height: `${z}px`,
          '--d': `${1.5 + Math.random() * 4}s`,
          animationDelay: `-${Math.random() * 5}s`,
        };
      }),
    []
  );

  const motes = useMemo(
    () =>
      Array.from({ length: 22 }, () => {
        const ms = Math.random() * 3 + 1.5;
        return {
          left: `${Math.random() * 100}%`,
          width: `${ms}px`,
          height: `${ms}px`,
          '--d': `${9 + Math.random() * 9}s`,
          '--dx': `${Math.random() * 120 - 60}px`,
          animationDelay: `-${Math.random() * 14}s`,
        };
      }),
    []
  );

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      clearInterval(scrambleRef.current);
      orbitAnimsRef.current.forEach((a) => a.cancel());
      if (coreOutRef.current) coreOutRef.current.cancel();
    };
  }, []);

  // resend countdown + code expiry countdown
  useEffect(() => {
    const iv = setInterval(() => {
      setResendIn((v) => (v > 0 ? v - 1 : 0));
      setExpiresIn((v) => {
        if (v <= 1) {
          return 0;
        }
        return v - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    if (expiresIn === 0 && phase !== 'success') {
      setMessage('This code has expired. Request a new code.');
      setMessageKind('err');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expiresIn]);

  // keep the glass cubes in sync with the typed digits
  useEffect(() => {
    nodesRef.current.forEach((node, i) => {
      if (!node) return;
      node.querySelectorAll('.face b').forEach((b) => {
        b.textContent = digits[i] || '';
      });
      node.classList.toggle('on', !!digits[i]);
    });
  }, [digits]);

  const code = () => digits.join('');

  const focusBox = (i) => {
    const b = inputsRef.current[Math.max(0, Math.min(N - 1, i))];
    if (b) {
      b.focus();
      b.select();
    }
  };

  const say = (text, kind = '') => {
    setMessage(text);
    setMessageKind(kind);
  };

  const pop = (i) => {
    const b = inputsRef.current[i];
    if (!b) return;
    b.classList.remove('pop');
    void b.offsetWidth;
    b.classList.add('pop');
    const node = nodesRef.current[i];
    if (node && !reduceMotion) {
      node.animate(
        [{ transform: 'scale(1.3)' }, { transform: 'scale(1)' }],
        { duration: 380, easing: 'cubic-bezier(.3,1.6,.5,1)' }
      );
    }
  };

  const applyLock = (value) => {
    lockedRef.current = value;
    setLocked(value);
  };

  // ---- verification animation (visual only — the verdict comes from the API) ----
  const startScramble = () => {
    clearInterval(scrambleRef.current);
    scrambleRef.current = setInterval(() => {
      nodesRef.current.forEach((node) => {
        if (!node) return;
        const r = Math.floor(Math.random() * 10);
        node.querySelectorAll('.face b').forEach((b) => {
          b.textContent = r;
        });
      });
    }, 70);
  };

  const startOrbit = () => {
    const stage = stageRef.current;
    if (!stage) return;
    const r = { width: stage.offsetWidth, height: stage.offsetHeight };
    orbitAnimsRef.current = [];
    nodesRef.current.forEach((node, k) => {
      if (!node) return;
      const c = CUBE_POS[k];
      const sx = ((c.x - 50) / 100) * r.width;
      const sy = ((c.y - 50) / 100) * r.height;
      const r0 = Math.hypot(sx, sy);
      const a0 = Math.atan2(sy, sx);
      const kf = [];
      for (let f = 0; f <= 60; f++) {
        const u = f / 60;
        const e = easeInOut(u);
        const a = a0 + Math.PI * 3 * e;
        const rr = r0 * (1 - 0.94 * e);
        kf.push({
          transform: `translate(${(rr * Math.cos(a) - sx).toFixed(1)}px, ${(rr * Math.sin(a) - sy).toFixed(1)}px) scale(${(1 - 0.75 * e).toFixed(3)})`,
          opacity: u < 0.8 ? 1 : 1 - (u - 0.8) / 0.2,
        });
      }
      orbitAnimsRef.current.push(node.animate(kf, { duration: 1400, easing: 'linear', fill: 'forwards' }));
    });
  };

  const ripple = (col) => {
    const stage = stageRef.current;
    if (!stage) return;
    const rp = document.createElement('i');
    rp.className = 'rip';
    rp.style.color = col;
    stage.appendChild(rp);
    rp.animate(
      [
        { transform: 'scale(.6)', opacity: 0.8 },
        { transform: 'scale(3.4)', opacity: 0 },
      ],
      { duration: 1100, easing: 'ease-out' }
    ).onfinish = () => rp.remove();
  };

  const burst = () => {
    const stage = stageRef.current;
    if (!stage) return;
    for (let i = 0; i < 34; i++) {
      const d = document.createElement('i');
      const sq = i % 3 === 0;
      const a = (i / 34) * 6.283 + Math.random() * 0.3;
      const dist = 90 + Math.random() * 110;
      const rot = Math.random() * 540 - 270;
      d.className = (sq ? 'sq' : 'dot') + (i % 2 ? ' g' : '');
      stage.appendChild(d);
      d.animate(
        [
          { transform: 'translate(-50%,-50%) scale(1) rotate(0deg)', opacity: 1 },
          {
            transform: `translate(calc(-50% + ${Math.cos(a) * dist}px), calc(-50% + ${Math.sin(a) * dist + 30}px)) scale(.2) rotate(${rot}deg)`,
            opacity: 0,
          },
        ],
        { duration: 1000 + Math.random() * 700, easing: 'cubic-bezier(.15,.8,.3,1)' }
      ).onfinish = () => d.remove();
    }
  };

  const finishWrong = (backendMessage) => {
    clearInterval(scrambleRef.current);
    const stage = stageRef.current;
    const row = rowRef.current;
    if (stage) {
      stage.classList.remove('scan');
      stage.classList.add('err');
    }
    if (row) row.classList.add('error');
    say(backendMessage || 'That code isn’t right. Please try again.', 'err');
    setPhase('error');
    ripple('var(--err)');
    if (stage) stage.classList.add('shake');
    setTimeout(() => {
      if (!mountedRef.current) return;
      if (stage) stage.classList.remove('shake');
      if (row) row.classList.remove('error');
      const r = stage ? { width: stage.offsetWidth, height: stage.offsetHeight } : { width: 340, height: 280 };
      nodesRef.current.forEach((node, k) => {
        if (!node) return;
        const c = CUBE_POS[k];
        const sx = ((c.x - 50) / 100) * r.width;
        const sy = ((c.y - 50) / 100) * r.height;
        node.animate(
          [
            { transform: `translate(${-sx}px, ${-sy}px) scale(.25)`, opacity: 0 },
            { transform: 'none', opacity: 1 },
          ],
          { duration: 850, easing: 'cubic-bezier(.3,1.4,.5,1)' }
        );
      });
      orbitAnimsRef.current.forEach((a) => a.cancel());
      orbitAnimsRef.current = [];
      if (stage) stage.classList.remove('err');
      setTimeout(() => {
        if (!mountedRef.current) return;
        setDigits(Array(N).fill(''));
        applyLock(false);
        setPhase('idle');
        focusBox(0);
      }, 850);
    }, 1000);
  };

  const finishRight = (user) => {
    clearInterval(scrambleRef.current);
    const stage = stageRef.current;
    const row = rowRef.current;
    if (stage) {
      stage.classList.remove('scan');
      stage.classList.add('ok');
    }
    if (row) row.classList.add('ok');
    if (coreNodeRef.current && !reduceMotion) {
      coreNodeRef.current.animate(
        [{ transform: 'scale(1)' }, { transform: 'scale(1.3)' }, { transform: 'scale(1)' }],
        { duration: 450, easing: 'cubic-bezier(.3,1.5,.5,1)' }
      );
    }
    ripple('var(--ok)');
    setPhase('success');
    if (!reduceMotion) {
      if (coreNodeRef.current) {
        coreOutRef.current = coreNodeRef.current.animate(
          [
            { transform: 'scale(1) rotate(0deg)', opacity: 1 },
            { transform: 'scale(.15) rotate(120deg)', opacity: 0 },
          ],
          { duration: 650, delay: 500, easing: 'cubic-bezier(.6,0,.3,1)', fill: 'forwards' }
        );
      }
      [0, 220, 440].forEach((d) => setTimeout(() => ripple('var(--ok)'), 500 + d));
      setTimeout(burst, 950);
    }
    setTimeout(() => {
      if (!mountedRef.current) return;
      say('Verified. You’re all set.', 'good big');
      if (cardRef.current) cardRef.current.classList.add('verified');
      if (rootRef.current) rootRef.current.classList.add('verified');
    }, reduceMotion ? 0 : 1500);
    setTimeout(() => {
      if (mountedRef.current) onSuccess(user);
    }, reduceMotion ? 600 : 2300);
  };

  const runVerification = async (value) => {
    if (lockedRef.current) return;
    applyLock(true);
    setPhase('verifying');
    say('Verifying…', 'info');
    inputsRef.current.forEach((b) => b && b.blur());

    if (reduceMotion) {
      const result = await onVerify(value);
      if (!mountedRef.current) return;
      if (result.ok) finishRight(result.user);
      else finishWrong(result.message);
      return;
    }

    const stage = stageRef.current;
    if (stage) stage.classList.add('scan');
    startScramble();
    // cubes spin while the real request is in flight
    document.querySelectorAll('.otp-v4 .cube').forEach((c) => {
      c.animate(
        [{ transform: 'rotateX(-30deg) rotateY(45deg)' }, { transform: 'rotateX(-30deg) rotateY(1125deg)' }],
        { duration: 2400, easing: 'ease-in-out' }
      );
    });
    setTimeout(startOrbit, 1000);

    const [result] = await Promise.all([onVerify(value), delay(ANIMATION_MS)]);
    if (!mountedRef.current) return;
    if (result.ok) {
      finishRight(result.user);
    } else {
      finishWrong(result.message);
    }
  };

  const autofill = (text) => {
    const t = text.replace(/\D/g, '').slice(0, N);
    if (t.length < N || lockedRef.current) return;
    applyLock(true);
    say('');
    inputsRef.current.forEach((b) => b && b.blur());
    const next = t.split('');
    let k = 0;
    const step = () => {
      if (!mountedRef.current) return;
      if (k < N) {
        setDigits((prev) => {
          const copy = [...prev];
          copy[k] = next[k];
          return copy;
        });
        pop(k);
        k += 1;
        setTimeout(step, reduceMotion ? 0 : 140);
      } else {
        applyLock(false);
        setTimeout(() => {
          if (mountedRef.current) runVerification(t);
        }, reduceMotion ? 0 : 450);
      }
    };
    step();
  };

  const handleInput = (i, value) => {
    if (lockedRef.current) return;
    const d = value.replace(/\D/g, '');
    if (d.length >= N) {
      autofill(d);
      return;
    }
    const ch = d.slice(-1);
    setDigits((prev) => {
      const copy = [...prev];
      copy[i] = ch;
      return copy;
    });
    if (ch) {
      pop(i);
      if (i < N - 1) focusBox(i + 1);
    }
    // check after state settles
    setTimeout(() => {
      if (!lockedRef.current) {
        const current = inputsRef.current.map((b) => b.value).join('');
        if (current.length === N) runVerification(current);
      }
    }, 0);
  };

  const handleKeyDown = (i, e) => {
    if (lockedRef.current) {
      e.preventDefault();
      return;
    }
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (digits[i]) {
        setDigits((prev) => {
          const copy = [...prev];
          copy[i] = '';
          return copy;
        });
      } else if (i > 0) {
        setDigits((prev) => {
          const copy = [...prev];
          copy[i - 1] = '';
          return copy;
        });
        focusBox(i - 1);
      }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      focusBox(i - 1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      focusBox(i + 1);
    } else if (e.key === 'Delete') {
      setDigits((prev) => {
        const copy = [...prev];
        copy[i] = '';
        return copy;
      });
    }
  };

  const handlePaste = (i, e) => {
    e.preventDefault();
    if (lockedRef.current) return;
    const text = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '').slice(0, N);
    if (!text) return;
    if (text.length === N) {
      autofill(text);
      return;
    }
    const next = [...digits];
    for (let k = 0; k < text.length && i + k < N; k++) next[i + k] = text[k];
    setDigits(next);
    text.split('').forEach((_, k) => {
      if (i + k < N) pop(i + k);
    });
    focusBox(Math.min(i + text.length, N - 1));
    if (next.join('').length === N) {
      setTimeout(() => {
        if (mountedRef.current) runVerification(next.join(''));
      }, 0);
    }
  };

  const handleResend = async () => {
    if (lockedRef.current || resendIn > 0) return;
    const result = await onResend();
    if (!mountedRef.current) return;
    if (result.ok) {
      setDigits(Array(N).fill(''));
      say(result.message || 'A new code is on its way.', 'good');
      setResendIn(RESEND_SECONDS);
      setExpiresIn(CODE_TTL_SECONDS);
      focusBox(0);
    } else {
      say(result.message || 'Could not resend the code. Please try again.', 'err');
    }
  };

  // pointer tilt + parallax (fine pointers only)
  const handlePointerMove = (e) => {
    if (!window.matchMedia('(hover:hover) and (pointer:fine)').matches || reduceMotion) return;
    const root = rootRef.current;
    const card = cardRef.current;
    if (!root || !card) return;
    const nx = (e.clientX / window.innerWidth) * 2 - 1;
    const ny = (e.clientY / window.innerHeight) * 2 - 1;
    root.style.setProperty('--rx', `${(-ny * 8).toFixed(2)}deg`);
    root.style.setProperty('--ry', `${(nx * 10).toFixed(2)}deg`);
    root.style.setProperty('--px', nx.toFixed(3));
    root.style.setProperty('--py', ny.toFixed(3));
    const pr = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${(((e.clientX - pr.left) / pr.width) * 100).toFixed(1)}%`);
    card.style.setProperty('--my', `${(((e.clientY - pr.top) / pr.height) * 100).toFixed(1)}%`);
    if (haloRef.current) {
      haloRef.current.style.transform = `translate(${(e.clientX - 210).toFixed(0)}px, ${(e.clientY - 210).toFixed(0)}px)`;
    }
  };

  const messageClass = `msg${message ? ' show' : ''}${messageKind ? ` ${messageKind}` : ''}`;

  return (
    <div className="otp-v4" ref={rootRef} onPointerMove={handlePointerMove}>
      <div className="space" aria-hidden="true">
        {stars.map((s, i) => (
          <i key={i} className="star" style={s} />
        ))}
        {motes.map((m, i) => (
          <i key={i} className="mote" style={m} />
        ))}
        <i className="shoot" />
      </div>
      <div className="blob b1" aria-hidden="true" />
      <div className="blob b2" aria-hidden="true" />
      <div className="floor" aria-hidden="true" />
      <div className="tile t1" aria-hidden="true" />
      <div className="tile t2" aria-hidden="true" />
      <div className="halo" ref={haloRef} aria-hidden="true" />

      <div className="col">
        <main className="panel" ref={cardRef}>
          <h1>Verify your account</h1>
          <p className="sub">
            Enter the 6-digit code we sent to{' '}<b>{email}</b>
          </p>

          <div className="wrap">
            <div className="stage" ref={stageRef}>
              <svg className="lines" aria-hidden="true">
                {CUBE_POS.map((c, k) => (
                  <line key={k} x1="50%" y1="50%" x2={`${c.x}%`} y2={`${c.y}%`} />
                ))}
              </svg>
              {CUBE_POS.map((c, k) => (
                <div
                  key={k}
                  className="node"
                  ref={(el) => { nodesRef.current[k] = el; }}
                  style={{ left: `${c.x}%`, top: `${c.y}%`, animationDelay: `-${k * 0.7}s` }}
                >
                  <div className="cube">
                    {['fr', 'bk', 'rt', 'lf', 'tp', 'bt'].map((f) => (
                      <div key={f} className={`face ${f}`}><b /></div>
                    ))}
                  </div>
                </div>
              ))}
              <div
                className="node core"
                ref={coreNodeRef}
                style={{ left: '50%', top: '50%' }}
              >
                <div className="cube">
                  {['fr', 'bk', 'rt', 'lf', 'tp', 'bt'].map((f) => (
                    <div key={f} className={`face ${f}`}><b /></div>
                  ))}
                </div>
              </div>
              <svg className="res" viewBox="0 0 64 64" aria-hidden="true">
                <path className="ck" d="M17 33l10 10 20-22" />
                <path className="xa" d="M20 20l24 24" />
                <path className="xb" d="M44 20L20 44" />
              </svg>
              <svg className="okmark" viewBox="0 0 100 100" aria-hidden="true">
                <circle cx="50" cy="50" r="40" />
                <path d="M30 52l14 14 27-30" />
              </svg>
            </div>
          </div>

          <div className="row" ref={rowRef} role="group" aria-label="One-time code">
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => { inputsRef.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                autoComplete={i === 0 ? 'one-time-code' : 'off'}
                aria-label={`Digit ${i + 1}`}
                value={d}
                disabled={locked}
                onChange={(e) => handleInput(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                onPaste={(e) => handlePaste(i, e)}
                onFocus={(e) => {
                  e.target.select();
                  const node = nodesRef.current[i];
                  if (node) node.classList.add('focus');
                }}
                onBlur={() => {
                  const node = nodesRef.current[i];
                  if (node) node.classList.remove('focus');
                }}
              />
            ))}
          </div>

          <p className={messageClass} role="status" aria-live="polite">{message}</p>

          <div className="resend">
            {phase !== 'success' && (
              <>
                <span>Didn’t receive the code?</span>
                {resendIn > 0 ? (
                  <>
                    <svg className="ring" viewBox="0 0 22 22" aria-hidden="true">
                      <circle className="tr" cx="11" cy="11" r="10" />
                      <circle
                        className="pr"
                        cx="11"
                        cy="11"
                        r="10"
                        style={{ strokeDashoffset: 62.8 * (1 - resendIn / RESEND_SECONDS) }}
                      />
                    </svg>
                    <b className="timer">Resend in {resendIn}s</b>
                  </>
                ) : (
                  <button type="button" className="link" onClick={handleResend}>
                    Resend code
                  </button>
                )}
              </>
            )}
          </div>

          {phase !== 'success' && expiresIn > 0 && (
            <p className="expiry">Code expires in {formatSeconds(expiresIn)}</p>
          )}
        </main>

        {phase !== 'success' && (
          <button type="button" className="change-link" onClick={onBack}>
            Change email or details
          </button>
        )}
      </div>
    </div>
  );
}
