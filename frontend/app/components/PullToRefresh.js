'use client';
import { useRef, useEffect } from 'react';
import { usePullToRefresh } from '@/app/hooks/usePullToRefresh';

export default function PullToRefresh({ onRefresh, children }) {
    const wrapperRef = useRef(null);
    const { pullDistance, isRefreshing, isTriggered, handlers } = usePullToRefresh(onRefresh);
    const indicatorY = isRefreshing ? 20 : pullDistance - 50;
    const opacity = isRefreshing ? 1 : Math.min(pullDistance / 70, 1);

    useEffect(() => {
        const el = wrapperRef.current;
        if (!el) return;
        el.addEventListener('touchmove', handlers.onTouchMove, { passive: false });
        return () => el.removeEventListener('touchmove', handlers.onTouchMove);
    }, [handlers.onTouchMove]);

    return (
        <div
            ref={wrapperRef}
            onTouchStart={handlers.onTouchStart}
            onTouchEnd={handlers.onTouchEnd}
            style={{ minHeight: '100%', touchAction: 'pan-y' }}
        >
            {/* Pull indicator */}
            <div
                style={{
                position: 'fixed',
                top: 60,           // below your sticky navbar
                left: '50%',
                transform: `translateX(-50%) translateY(${indicatorY}px)`,
                transition: isRefreshing ? 'transform 0.2s ease' : 'none',
                opacity,
                zIndex: 100,
                pointerEvents: 'none',
                }}
            >
                <div
                style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: '#1e3a5f',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                }}
                >
                {isRefreshing ? (
                    // Spinner
                    <div style={{
                    width: 20,
                    height: 20,
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTop: '2px solid white',
                    borderRadius: '50%',
                    animation: 'ptr-spin 0.7s linear infinite',
                }} />
                ) : (
                    // Arrow — rotates when triggered
                    <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                        transform: isTriggered ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease',
                    }}
                    >
                    <polyline points="6 9 12 15 18 9" />
                    </svg>
                )}
                </div>
            </div>

            {/* Spinner CSS */}
            <style>{`@keyframes ptr-spin { to { transform: rotate(360deg); } }`}</style>

            {/* Push content down while pulling */}
            <div style={{
                transform: `translateY(${isRefreshing ? 50 : pullDistance * 0.6}px)`,
                transition: isRefreshing || pullDistance === 0 ? 'transform 0.25s ease' : 'none',
            }}>
                {children}
            </div>
        </div>
    );
}