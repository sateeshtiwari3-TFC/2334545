import React, { useState, useEffect, useRef } from 'react';

interface SafeChartContainerProps {
  children: React.ReactNode;
  height?: number | string;
  minHeight?: number;
  className?: string;
  aspect?: number;
}

/**
 * SafeChartContainer ensures that Recharts ResponsiveContainer is only rendered
 * after the DOM node is actually mounted, visible, and has non-zero dimensions.
 * This completely prevents the Recharts warning:
 * "The width(0) and height(0) of chart should be greater than 0..."
 */
export const SafeChartContainer: React.FC<SafeChartContainerProps> = ({
  children,
  height = 300,
  minHeight = 220,
  className = '',
  aspect
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasDimensions, setHasDimensions] = useState<boolean>(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let isSubscribed = true;

    const measure = () => {
      if (!isSubscribed) return;
      const rect = el.getBoundingClientRect();
      const isVisible = rect.width > 0 && (rect.height > 0 || typeof height === 'number');
      setHasDimensions(isVisible);
    };

    // Immediate check
    measure();

    // Use requestAnimationFrame in case styles or layout are still calculating
    const rafId = requestAnimationFrame(measure);

    // Watch for size changes (such as tab switching, mobile/desktop breakpoint shifts, drawers)
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height: h } = entry.contentRect;
        const valid = width > 0 && (h > 0 || typeof height === 'number');
        if (isSubscribed) {
          setHasDimensions(valid);
        }
      }
    });

    resizeObserver.observe(el);

    return () => {
      isSubscribed = false;
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
    };
  }, [height]);

  const heightStyle = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      ref={containerRef}
      className={`w-full min-w-0 relative ${className}`}
      style={{
        height: heightStyle,
        minHeight: `${minHeight}px`,
        aspectRatio: aspect ? `${aspect}` : undefined
      }}
    >
      {hasDimensions ? (
        children
      ) : (
        <div 
          className="w-full h-full flex items-center justify-center opacity-0 pointer-events-none"
          style={{ minHeight: `${minHeight}px` }} 
        />
      )}
    </div>
  );
};
