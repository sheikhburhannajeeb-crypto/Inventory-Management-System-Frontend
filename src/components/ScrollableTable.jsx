import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const ScrollableTable = ({ children, className = '', ...props }) => {
    const tableContainerRef = useRef(null);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(false);
    const [bounds, setBounds] = useState({ left: 10, right: 10, isVisible: true });

    const checkScrollAndBounds = useCallback(() => {
        if (!tableContainerRef.current) return;
        const node = tableContainerRef.current;
        
        // Horizontal Scroll
        const { scrollLeft, scrollWidth, clientWidth } = node;
        setShowLeftArrow(scrollLeft > 0);
        setShowRightArrow(Math.ceil(scrollLeft + clientWidth) < scrollWidth - 2);

        // Vertical & Horizontal Bounds in Viewport
        const rect = node.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        const windowWidth = window.innerWidth;
        
        // Check if table is currently visible in the screen
        const isVisible = rect.top < (windowHeight * 0.8) && rect.bottom > (windowHeight * 0.2);
        
        setBounds({
            left: Math.max(10, rect.left + 16),
            right: Math.max(10, windowWidth - rect.right + 16),
            isVisible
        });
    }, []);

    useEffect(() => {
        checkScrollAndBounds();
        window.addEventListener('resize', checkScrollAndBounds);
        
        // The main scroll container is `.main-content`
        const mainScrollContainer = document.querySelector('.main-content');
        if (mainScrollContainer) {
            mainScrollContainer.addEventListener('scroll', checkScrollAndBounds, { passive: true });
        } else {
            window.addEventListener('scroll', checkScrollAndBounds, { passive: true });
        }
        
        let resizeObserver;
        if (tableContainerRef.current && typeof ResizeObserver !== 'undefined') {
            resizeObserver = new ResizeObserver(() => checkScrollAndBounds());
            resizeObserver.observe(tableContainerRef.current);
        }
        
        let mutationObserver;
        if (tableContainerRef.current && typeof MutationObserver !== 'undefined') {
            mutationObserver = new MutationObserver(() => checkScrollAndBounds());
            mutationObserver.observe(tableContainerRef.current, { childList: true, subtree: true });
        }
        
        return () => {
            window.removeEventListener('resize', checkScrollAndBounds);
            if (mainScrollContainer) {
                mainScrollContainer.removeEventListener('scroll', checkScrollAndBounds);
            } else {
                window.removeEventListener('scroll', checkScrollAndBounds);
            }
            if (resizeObserver) resizeObserver.disconnect();
            if (mutationObserver) mutationObserver.disconnect();
        };
    }, [checkScrollAndBounds]);

    const scrollHorizontally = (amount) => {
        if (tableContainerRef.current) {
            tableContainerRef.current.scrollBy({ left: amount, behavior: 'smooth' });
        }
    };

    return (
        <div className="scrollable-wrapper">
            {showLeftArrow && bounds.isVisible && (
                <button 
                    className="scrollable-arrow animate-fade-in" 
                    onClick={() => scrollHorizontally(-250)}
                    aria-label="Scroll left"
                    type="button"
                    style={{ position: 'fixed', top: '50vh', left: `${bounds.left}px` }}
                >
                    <ChevronLeft size={24} />
                </button>
            )}
            
            <div 
                className={`scrollable-container ${className}`} 
                ref={tableContainerRef} 
                onScroll={checkScrollAndBounds}
                {...props}
            >
                {children}
            </div>

            {showRightArrow && bounds.isVisible && (
                <button 
                    className="scrollable-arrow animate-fade-in" 
                    onClick={() => scrollHorizontally(250)}
                    aria-label="Scroll right"
                    type="button"
                    style={{ position: 'fixed', top: '50vh', right: `${bounds.right}px` }}
                >
                    <ChevronRight size={24} />
                </button>
            )}
        </div>
    );
};

export default ScrollableTable;
