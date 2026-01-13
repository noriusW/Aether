import React, { useRef } from 'react';

const MIN_WINDOW_WIDTH = 960;
const MIN_WINDOW_HEIGHT = 420;

const ResizeBorders = () => {
  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const direction = useRef('');

  const handleMouseDown = (e, dir) => {
    e.preventDefault();
    isDragging.current = true;
    lastPos.current = { x: e.screenX, y: e.screenY };
    direction.current = dir;

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const clampDelta = (delta, currentSize, minSize, mode) => {
    if (mode === 'plus') {
      if (currentSize + delta < minSize) return minSize - currentSize;
      return delta;
    }
    if (currentSize - delta < minSize) return currentSize - minSize;
    return delta;
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current) return;

    const dx = e.screenX - lastPos.current.x;
    const dy = e.screenY - lastPos.current.y;

    if (dx === 0 && dy === 0) return;

    const currentWidth = window.outerWidth;
    const currentHeight = window.outerHeight;
    const hasX = direction.current.includes('e') || direction.current.includes('w');
    const hasY = direction.current.includes('n') || direction.current.includes('s');
    let nextDx = dx;
    let nextDy = dy;

    if (direction.current.includes('e')) {
      nextDx = clampDelta(dx, currentWidth, MIN_WINDOW_WIDTH, 'plus');
    } else if (direction.current.includes('w')) {
      nextDx = clampDelta(dx, currentWidth, MIN_WINDOW_WIDTH, 'minus');
    }

    if (direction.current.includes('s')) {
      nextDy = clampDelta(dy, currentHeight, MIN_WINDOW_HEIGHT, 'plus');
    } else if (direction.current.includes('n')) {
      nextDy = clampDelta(dy, currentHeight, MIN_WINDOW_HEIGHT, 'minus');
    }

    const nextX = hasX ? lastPos.current.x + nextDx : e.screenX;
    const nextY = hasY ? lastPos.current.y + nextDy : e.screenY;
    lastPos.current = { x: nextX, y: nextY };

    if ((!hasX || nextDx === 0) && (!hasY || nextDy === 0)) return;

    if (window.electron) {
      window.electron.send('resize-window-delta', {
        dx: Math.round(nextDx),
        dy: Math.round(nextDy),
        direction: direction.current
      });
    }
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  const borderStyle = "fixed z-[9999] hover:bg-white/10 transition-colors bg-transparent";

  return (
    <>
      <div
        className={`${borderStyle} top-0 left-0 bottom-4 w-2 cursor-w-resize`}
        onMouseDown={(e) => handleMouseDown(e, 'w')}
      />
      <div
        className={`${borderStyle} top-0 right-0 bottom-4 w-2 cursor-e-resize`}
        onMouseDown={(e) => handleMouseDown(e, 'e')}
      />
      <div
        className={`${borderStyle} top-0 left-0 right-4 h-2 cursor-n-resize`}
        onMouseDown={(e) => handleMouseDown(e, 'n')}
      />
      <div
        className={`${borderStyle} bottom-0 left-0 right-4 h-2 cursor-s-resize`}
        onMouseDown={(e) => handleMouseDown(e, 's')}
      />
      <div
        className={`${borderStyle} top-0 left-0 w-4 h-4 cursor-nw-resize rounded-br-lg`}
        onMouseDown={(e) => handleMouseDown(e, 'nw')}
      />
      <div
        className={`${borderStyle} top-0 right-0 w-4 h-4 cursor-ne-resize rounded-bl-lg`}
        onMouseDown={(e) => handleMouseDown(e, 'ne')}
      />
      <div
        className={`${borderStyle} bottom-0 left-0 w-4 h-4 cursor-sw-resize rounded-tr-lg`}
        onMouseDown={(e) => handleMouseDown(e, 'sw')}
      />
      <div
        className={`${borderStyle} bottom-0 right-0 w-4 h-4 cursor-se-resize rounded-tl-lg`}
        onMouseDown={(e) => handleMouseDown(e, 'se')}
      />
    </>
  );
};

export default ResizeBorders;
