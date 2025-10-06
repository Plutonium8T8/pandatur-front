import { useEffect, useState } from "react";

export function useZoomScale(defaultValue = 1) {
  const [scale, setScale] = useState(defaultValue);

  useEffect(() => {
    const el = document.getElementById("root");
    if (!el) return;
    // zoom может быть строкой типа "0.75" или пустым
    const z = getComputedStyle(el).zoom;
    const parsed = z ? Number(z) : defaultValue;
    setScale(Number.isFinite(parsed) && parsed > 0 ? parsed : defaultValue);
  }, []);

  return scale;
}
