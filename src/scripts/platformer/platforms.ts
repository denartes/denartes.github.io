/**
 * Platform detection and collision handling.
 * Detects both data-platform elements and common page elements.
 */

import type { Platform, AvatarState, AvatarSize, PhysicsConfig } from './types';

/** Elements explicitly marked as platforms */
const EXPLICIT_PLATFORM_SELECTOR = '[data-platform]';

/** Auto-detected elements that make good platforms - use element bounds */
const AUTO_PLATFORM_SELECTORS = [
  // Block text elements - headings work well as solid platforms
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  // Code
  'code',
  // Images
  'img',
  '.bio-avatar',
];

/** Inline elements where we measure actual text content bounds */
const INLINE_TEXT_SELECTORS = [
  'p',
  'a',
  'strong', 'em', 'b', 'i',
  'label',
  'time',
];

/** Minimum dimensions for auto-detected platforms */
const MIN_WIDTH = 40;
const MIN_HEIGHT = 16;

/**
 * Get the bounding rect of the actual text content inside an element.
 */
function getTextContentRect(element: Element): DOMRect | null {
  const range = document.createRange();
  range.selectNodeContents(element);
  const rects = range.getClientRects();
  
  if (rects.length === 0) return null;
  
  // Combine all text rects into one bounding rect
  let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity;
  
  for (const rect of rects) {
    if (rect.width <= 0 || rect.height <= 0) continue;
    left = Math.min(left, rect.left);
    top = Math.min(top, rect.top);
    right = Math.max(right, rect.right);
    bottom = Math.max(bottom, rect.bottom);
  }
  
  if (left === Infinity) return null;
  
  return new DOMRect(left, top, right - left, bottom - top);
}

/**
 * Scan the DOM for platform elements and compute their document coordinates.
 */
export function scanPlatforms(): Platform[] {
  const platforms: Platform[] = [];
  const seen = new Set<Element>();
  
  const scrollX = window.scrollX;
  const scrollY = window.scrollY;
  const viewportHeight = window.innerHeight;
  const viewportTop = scrollY - viewportHeight; // Buffer above
  const viewportBottom = scrollY + viewportHeight * 2; // Buffer below
  
  // Helper to add a platform from a rect
  const addPlatformFromRect = (element: Element, rect: DOMRect, skipViewportCheck = false) => {
    if (seen.has(element)) return;
    seen.add(element);
    
    // Skip elements with no size
    if (rect.width <= 0 || rect.height <= 0) return;
    
    // Skip auto-detected elements that are too small
    if (!element.hasAttribute('data-platform')) {
      if (rect.width < MIN_WIDTH || rect.height < MIN_HEIGHT) return;
    }
    
    const top = rect.top + scrollY;
    const bottom = rect.bottom + scrollY;
    
    // Skip elements far outside the viewport buffer (unless explicitly including)
    if (!skipViewportCheck && (bottom < viewportTop || top > viewportBottom)) return;
    
    platforms.push({
      element,
      left: rect.left + scrollX,
      right: rect.right + scrollX,
      top: top,
      bottom: bottom,
    });
  };
  
  // Always include footer element regardless of viewport position (for spawning)
  const footerElement = document.querySelector('footer, .site-footer, [data-platform="footer"]');
  if (footerElement) {
    addPlatformFromRect(footerElement, footerElement.getBoundingClientRect(), true);
  }
  
  // Add explicit data-platform elements
  const explicitElements = document.querySelectorAll(EXPLICIT_PLATFORM_SELECTOR);
  for (const element of explicitElements) {
    addPlatformFromRect(element, element.getBoundingClientRect());
  }
  
  // Add auto-detected block elements (use element bounds)
  const autoSelector = AUTO_PLATFORM_SELECTORS.join(', ');
  const autoElements = document.querySelectorAll(autoSelector);
  for (const element of autoElements) {
    if (element.closest('[data-platform]')) continue;
    if (element.closest('.platformer-avatar')) continue;
    addPlatformFromRect(element, element.getBoundingClientRect());
  }
  
  // Add inline text elements (use actual text bounds)
  const inlineSelector = INLINE_TEXT_SELECTORS.join(', ');
  const inlineElements = document.querySelectorAll(inlineSelector);
  for (const element of inlineElements) {
    if (element.closest('[data-platform]')) continue;
    if (element.closest('.platformer-avatar')) continue;
    
    const textRect = getTextContentRect(element);
    if (textRect) {
      addPlatformFromRect(element, textRect);
    }
  }
  
  return platforms;
}

/**
 * Check if the avatar's feet are within horizontal bounds of a platform.
 */
function isHorizontallyOverlapping(
  avatarX: number,
  avatarWidth: number,
  platform: Platform
): boolean {
  const avatarLeft = avatarX;
  const avatarRight = avatarX + avatarWidth;
  return avatarRight > platform.left && avatarLeft < platform.right;
}

/**
 * One-way platform collision detection.
 * The avatar can jump up through platforms and only lands when falling onto the top edge.
 */
export function checkPlatformCollision(
  avatar: AvatarState,
  prevY: number,
  size: AvatarSize,
  platforms: Platform[],
  config: PhysicsConfig
): { grounded: boolean; landingY: number | null } {
  const avatarBottom = avatar.y + size.height;
  const prevBottom = prevY + size.height;
  
  // Only check for landing when falling (moving downward)
  if (avatar.vy < 0) {
    return { grounded: false, landingY: null };
  }
  
  let landingY: number | null = null;
  let grounded = false;
  
  for (const platform of platforms) {
    // Skip if not horizontally overlapping
    if (!isHorizontallyOverlapping(avatar.x, size.width, platform)) {
      continue;
    }
    
    // One-way platform check:
    // - Previous bottom was above or at platform top (with tolerance)
    // - Current bottom is at or below platform top
    const tolerance = config.collisionTolerance;
    const wasAbove = prevBottom <= platform.top + tolerance;
    const nowBelow = avatarBottom >= platform.top;
    
    if (wasAbove && nowBelow) {
      // Land on this platform
      const newY = platform.top - size.height;
      
      // Pick the highest platform if multiple collisions
      if (landingY === null || newY < landingY) {
        landingY = newY;
        grounded = true;
      }
    }
  }
  
  return { grounded, landingY };
}

/**
 * Check if avatar is still standing on any platform.
 * Used to detect when avatar walks off an edge.
 */
export function isStandingOnPlatform(
  avatar: AvatarState,
  size: AvatarSize,
  platforms: Platform[],
  config: PhysicsConfig
): boolean {
  const avatarBottom = avatar.y + size.height;
  
  for (const platform of platforms) {
    if (!isHorizontallyOverlapping(avatar.x, size.width, platform)) {
      continue;
    }
    
    // Check if avatar's feet are on the platform's top surface
    const onSurface = Math.abs(avatarBottom - platform.top) <= config.collisionTolerance;
    if (onSurface) {
      return true;
    }
  }
  
  return false;
}

/**
 * Find the footer element to spawn the avatar on.
 */
export function findFooterPlatform(platforms: Platform[]): Platform | null {
  // Look for the footer platform specifically
  for (const platform of platforms) {
    if (platform.element.matches('footer, .site-footer, [data-platform="footer"]')) {
      return platform;
    }
  }
  
  // Fallback: find the lowest platform
  if (platforms.length > 0) {
    return platforms.reduce((lowest, p) => p.top > lowest.top ? p : lowest);
  }
  
  return null;
}

/**
 * Get the document height for respawn detection.
 */
export function getDocumentHeight(): number {
  return Math.max(
    document.body.scrollHeight,
    document.body.offsetHeight,
    document.documentElement.scrollHeight,
    document.documentElement.offsetHeight
  );
}
