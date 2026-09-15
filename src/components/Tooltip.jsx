import React, { useLayoutEffect, useRef, useState } from 'react';

export default function Tooltip({ anchor, children }) {
  const ref = useRef(null);
  const [pos, setPos] = useState({ left: -9999, top: -9999 });

  useLayoutEffect(() => {
    if (!anchor || !ref.current) return;

    const rect = anchor.getBoundingClientRect();
    const tip = ref.current.getBoundingClientRect();
    const gap = 10;

    let left = rect.left - tip.width - gap;
    if (left < gap) left = rect.right + gap;                 // flip right
    if (left + tip.width > window.innerWidth - gap) {
      left = Math.max(gap, window.innerWidth - tip.width - gap);
    }

    let top = rect.top + rect.height / 2 - tip.height / 2;
    top = Math.min(Math.max(gap, top), window.innerHeight - tip.height - gap);

    setPos({ left, top });
  }, [anchor, children]);

  if (!anchor) return null;

  return (
    <div className="tooltip" ref={ref} style={pos} role="tooltip">
      {children}
    </div>
  );
}
