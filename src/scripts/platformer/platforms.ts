/**
 * Platform detection and collision handling.
 * Only elements marked with data-platform are collidable.
 */

import type { Platform, AvatarState, AvatarSize, PhysicsConfig } from './types';

const PLATFORM_SELECTOR = '[data-platform]';

/**
 * Scan the DOM for platform elements and compute their document coordinates.
 */
export function scanPlatforms(): Platform[] {
  const elements = document.querySelectorAll(PLATFORM_SELECTOR);
  const platforms: Platform[] = [];
  
  const scrollX = window.scrollX;
  const scrollY = window.scrollY;
  
  for (const element of elements) {
    const rect = element.getBoundingClientRect();
    
    // Skip elements with no size
    if (rect.width <= 0 || rect.height <= 0) continue;
    
    platforms.push({
      element,
      left: rect.left + scrollX,
      right: rect.right + scrollX,
      top: rect.top + scrollY,
      bottom: rect.bottom + scrollY,
    });
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
