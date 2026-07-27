/**
 * Core types for the page platformer Easter egg.
 */

/** Avatar position and physics state. */
export interface AvatarState {
  /** X position in document coordinates. */
  x: number;
  /** Y position in document coordinates (top of avatar). */
  y: number;
  /** Horizontal velocity (pixels per second). */
  vx: number;
  /** Vertical velocity (pixels per second, positive = down). */
  vy: number;
  /** Whether avatar is currently on a platform. */
  grounded: boolean;
  /** Facing direction: 1 = right, -1 = left. */
  facing: 1 | -1;
  /** Current animation state. */
  animation: 'idle' | 'run' | 'jump' | 'fall';
}

/** A platform derived from a DOM element. */
export interface Platform {
  /** The DOM element this platform represents. */
  element: Element;
  /** Left edge in document coordinates. */
  left: number;
  /** Right edge in document coordinates. */
  right: number;
  /** Top edge in document coordinates (the landing surface). */
  top: number;
  /** Bottom edge in document coordinates. */
  bottom: number;
}

/** Physics configuration values. */
export interface PhysicsConfig {
  /** Horizontal acceleration when moving (pixels/s²). */
  acceleration: number;
  /** Maximum horizontal speed (pixels/s). */
  maxSpeed: number;
  /** Friction deceleration when not pressing movement (pixels/s²). */
  friction: number;
  /** Gravity acceleration (pixels/s²). */
  gravity: number;
  /** Initial jump velocity (pixels/s, negative = up). */
  jumpVelocity: number;
  /** Coyote time window after leaving platform (ms). */
  coyoteTime: number;
  /** Jump buffer window for early jump input (ms). */
  jumpBuffer: number;
  /** Small tolerance for platform landing detection. */
  collisionTolerance: number;
  /** Velocity threshold for apex detection (pixels/s). */
  apexVelocityThreshold: number;
  /** Double jump velocity multiplier. */
  doubleJumpMultiplier: number;
}

/** Input state for current frame. */
export interface InputState {
  /** Moving left. */
  left: boolean;
  /** Moving right. */
  right: boolean;
  /** Jump pressed this frame (for buffer). */
  jumpPressed: boolean;
  /** Jump being held. */
  jumpHeld: boolean;
  /** Down pressed this frame (for drop-through). */
  downPressed: boolean;
}

/** Engine timing state. */
export interface TimingState {
  /** Time since avatar left ground (for coyote time). */
  timeSinceGrounded: number;
  /** Time since jump was pressed (for jump buffer). */
  timeSinceJumpPressed: number;
  /** Whether jump has been consumed (prevent multi-jump). */
  jumpConsumed: boolean;
  /** Whether double jump has been used this airtime. */
  doubleJumpUsed: boolean;
  /** Time remaining to ignore platform collisions after dropping (ms). */
  dropIgnoreTime: number;
  /** Whether avatar is falling from a wrap-around (should fall to footer). */
  wrapAroundFalling: boolean;
}

/** Platformer game state. */
export interface GameState {
  /** Whether game is currently active. */
  active: boolean;
  /** Whether user has interacted with the avatar this session. */
  hasActivatedThisSession: boolean;
  /** Avatar state. */
  avatar: AvatarState;
  /** Timing state for coyote time / jump buffer. */
  timing: TimingState;
  /** Cached platform rectangles. */
  platforms: Platform[];
}

/** Avatar dimensions. */
export interface AvatarSize {
  width: number;
  height: number;
}

/** Scroll margins for keeping avatar in view. */
export interface ViewportMargins {
  top: number;
  bottom: number;
}
