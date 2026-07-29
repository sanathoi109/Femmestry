// static/js/panic-shield.js

document.addEventListener('DOMContentLoaded', () => {
    const panicShield = document.getElementById('panic-shield');

    // Toggle function to show/hide the recipe mask
    function togglePanicShield() {
        if (!panicShield) return;
        
        if (panicShield.style.display === 'none' || panicShield.classList.contains('hidden') || !panicShield.style.display) {
            panicShield.style.display = 'block';
            panicShield.classList.remove('hidden');
        } else {
            panicShield.style.display = 'none';
            panicShield.classList.add('hidden');
        }
    }

    // 1. Keyboard shortcut: Spacebar or Escape key
    document.addEventListener('keydown', (e) => {
        const activeEl = document.activeElement;
        const isInputField = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');

        if (e.key === 'Escape' || (e.code === 'Space' && !isInputField)) {
            if (e.code === 'Space') e.preventDefault();
            togglePanicShield();
        }
    });

    // 2. Click or tap to return from the panic shield
    if (panicShield) {
        panicShield.addEventListener('click', () => {
            togglePanicShield();
        });
    }

    // 3. Circle / 'O' Gesture Detection Logic
    let strokePath = [];
    let isTracking = false;

    function handleStart(e) {
        isTracking = true;
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);
        if (clientX !== undefined && clientY !== undefined) {
            strokePath = [{ x: clientX, y: clientY }];
        }
    }

    function handleMove(e) {
        if (!isTracking) return;
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);
        if (clientX !== undefined && clientY !== undefined) {
            strokePath.push({ x: clientX, y: clientY });
        }
    }

    function handleEnd() {
        if (!isTracking || strokePath.length < 12) {
            isTracking = false;
            strokePath = [];
            return;
        }

        const startPoint = strokePath[0];
        const endPoint = strokePath[strokePath.length - 1];

        // Measure distance between starting point and end point
        const closureDistance = Math.hypot(endPoint.x - startPoint.x, endPoint.y - startPoint.y);

        // Find bounding box around the drawn gesture
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        strokePath.forEach(pt => {
            if (pt.x < minX) minX = pt.x;
            if (pt.x > maxX) maxX = pt.x;
            if (pt.y < minY) minY = pt.y;
            if (pt.y > maxY) maxY = pt.y;
        });

        const width = maxX - minX;
        const height = maxY - minY;
        const aspectRatio = width / height;

        // Valid Circle/O Criteria
        if (closureDistance < 70 && width > 30 && height > 30 && aspectRatio > 0.5 && aspectRatio < 2.0) {
            togglePanicShield();
        }

        isTracking = false;
        strokePath = [];
    }

    window.addEventListener('mousedown', handleStart);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);

    window.addEventListener('touchstart', handleStart);
    window.addEventListener('touchmove', handleMove);
    window.addEventListener('touchend', handleEnd);
});