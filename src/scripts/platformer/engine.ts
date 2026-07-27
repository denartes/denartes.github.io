/**
 * Main platformer engine.
 * Orchestrates physics, rendering, and game state.
 */

import type {
  GameState,
  AvatarState,
  PhysicsConfig,
  AvatarSize,
  ViewportMargins,
  TimingState,
} from './types';
import { InputHandler } from './input';
import {
  scanPlatforms,
  checkPlatformCollision,
  isStandingOnPlatform,
  findFooterPlatform,
  getDocumentHeight,
} from './platforms';

/** Default physics configuration - tuned for responsive feel. */
const DEFAULT_PHYSICS: PhysicsConfig = {
  acceleration: 2800,
  maxSpeed: 340,
  friction: 2400,
  gravity: 1800,
  jumpVelocity: -580,
  coyoteTime: 100,
  jumpBuffer: 120,
  collisionTolerance: 4,
  apexVelocityThreshold: 200,
  doubleJumpMultiplier: 0.85,
};

/** Avatar dimensions. */
const AVATAR_SIZE: AvatarSize = {
  width: 16,
  height: 24,
};

/** Viewport margins for auto-scrolling. */
const VIEWPORT_MARGINS: ViewportMargins = {
  top: 120,
  bottom: 120,
};

/** Session storage key for activation state. */
const STORAGE_KEY = 'platformer-activated';

/** Fixed timestep for physics (60 FPS). */
const FIXED_TIMESTEP = 1000 / 60;

export class PlatformerEngine {
  private state: GameState;
  private physics: PhysicsConfig;
  private input: InputHandler;
  
  private avatarElement: HTMLElement | null = null;
  private controlsHint: HTMLElement | null = null;
  
  private animationFrameId: number | null = null;
  private lastTime = 0;
  private accumulator = 0;
  
  private resizeObserver: ResizeObserver | null = null;
  private platformRefreshScheduled = false;
  private lastPlatformRefresh = 0;
  
  /** How often to refresh platforms during gameplay (ms) */
  private static readonly PLATFORM_REFRESH_INTERVAL = 500;
  
  constructor() {
    this.physics = { ...DEFAULT_PHYSICS };
    this.input = new InputHandler();
    
    this.state = {
      active: false,
      hasActivatedThisSession: false,
      avatar: this.createInitialAvatarState(),
      timing: this.createInitialTimingState(),
      platforms: [],
    };
  }
  
  /** Initialize the engine with DOM elements. */
  init(avatarElement: HTMLElement, controlsHint: HTMLElement): void {
    this.avatarElement = avatarElement;
    this.controlsHint = controlsHint;
    
    // Check for reduced motion preference
    if (this.prefersReducedMotion()) {
      this.avatarElement.style.display = 'none';
      return;
    }
    
    // Check for touch-only device
    if (this.isTouchOnlyDevice()) {
      this.avatarElement.style.display = 'none';
      return;
    }
    
    // Restore session state
    this.restoreSessionState();
    
    // Set up resize observer
    this.setupResizeObserver();
    
    // Set up activation handler
    this.setupActivation();
    
    // Wait for page to be ready, then spawn on footer
    this.waitForReadyAndSpawn();
  }
  
  /** Clean up resources. */
  destroy(): void {
    this.deactivate();
    this.resizeObserver?.disconnect();
  }
  
  /** Activate the platformer game. */
  activate(): void {
    if (this.state.active) return;
    if (!this.avatarElement) return;
    
    // Refresh platforms before starting
    this.refreshPlatforms();
    
    // Spawn on footer if needed
    if (!this.state.hasActivatedThisSession) {
      this.spawnOnFooter();
    }
    
    this.state.active = true;
    this.state.hasActivatedThisSession = true;
    
    // Save to session storage
    try {
      sessionStorage.setItem(STORAGE_KEY, 'true');
    } catch {
      // Ignore storage errors
    }
    
    // Show controls hint
    this.showControlsHint();
    
    // Start input capture
    this.input.activate(() => this.deactivate());
    
    // Start game loop
    this.lastTime = performance.now();
    this.lastPlatformRefresh = this.lastTime;
    this.accumulator = 0;
    this.animationFrameId = requestAnimationFrame(this.gameLoop);
    
    // Update avatar appearance
    this.avatarElement.classList.add('active');
    this.avatarElement.setAttribute('aria-pressed', 'true');
  }
  
  /** Deactivate the platformer and restore normal browsing. */
  deactivate(): void {
    if (!this.state.active) return;
    
    this.state.active = false;
    
    // Stop input capture
    this.input.deactivate();
    
    // Hide controls hint
    this.hideControlsHint();
    
    // Update avatar appearance
    if (this.avatarElement) {
      this.avatarElement.classList.remove('active');
      this.avatarElement.setAttribute('aria-pressed', 'false');
      this.avatarElement.blur(); // Remove focus to hide outline
    }
    
    // Start falling animation back to footer
    this.state.avatar.grounded = false;
    this.state.timing.dropIgnoreTime = 150; // Pass through current platform
    this.fallToFooter();
  }
  
  /** Animate falling back to the footer after deactivation. */
  private fallToFooter(): void {
    const footer = findFooterPlatform(this.state.platforms);
    const footerY = footer ? footer.top - AVATAR_SIZE.height : getDocumentHeight();
    
    const fall = () => {
      const { avatar } = this.state;
      
      // Apply gravity
      avatar.vy += this.physics.gravity * (1 / 60);
      avatar.y += avatar.vy * (1 / 60);
      
      // Update animation
      avatar.animation = 'fall';
      this.renderAvatar();
      
      // Check if landed on footer
      if (avatar.y >= footerY) {
        avatar.y = footerY;
        avatar.vy = 0;
        avatar.grounded = true;
        avatar.animation = 'idle';
        this.renderAvatar();
        
        // Stop the animation frame
        if (this.animationFrameId !== null) {
          cancelAnimationFrame(this.animationFrameId);
          this.animationFrameId = null;
        }
        return;
      }
      
      this.animationFrameId = requestAnimationFrame(fall);
    };
    
    // Cancel existing loop and start fall animation
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.animationFrameId = requestAnimationFrame(fall);
  }
  
  /** Main game loop. */
  private gameLoop = (currentTime: number): void => {
    if (!this.state.active) return;
    
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;
    
    // Periodically refresh platforms to catch dynamically loaded content
    if (currentTime - this.lastPlatformRefresh > PlatformerEngine.PLATFORM_REFRESH_INTERVAL) {
      this.refreshPlatforms();
      this.lastPlatformRefresh = currentTime;
    }
    
    // Cap delta time to prevent spiral of death
    const cappedDelta = Math.min(deltaTime, 100);
    this.accumulator += cappedDelta;
    
    // Get input once per frame
    const inputState = this.input.poll();
    
    // Fixed timestep physics
    while (this.accumulator >= FIXED_TIMESTEP) {
      this.updatePhysics(inputState, FIXED_TIMESTEP);
      this.accumulator -= FIXED_TIMESTEP;
    }
    
    // Render
    this.updateAnimation();
    this.renderAvatar();
    this.updateViewportScroll();
    
    // Continue loop
    this.animationFrameId = requestAnimationFrame(this.gameLoop);
  };
  
  /** Update physics for one fixed timestep. */
  private updatePhysics(input: ReturnType<InputHandler['poll']>, dt: number): void {
    const dtSeconds = dt / 1000;
    const { avatar, timing, platforms } = this.state;
    const { physics } = this;
    
    // Store previous position for collision detection
    const prevY = avatar.y;
    
    // Update timing
    timing.timeSinceGrounded += dt;
    timing.timeSinceJumpPressed += dt;
    
    // Record jump press
    if (input.jumpPressed) {
      timing.timeSinceJumpPressed = 0;
      timing.jumpConsumed = false;
    }
    
    // Reset grounded timing if grounded
    if (avatar.grounded) {
      timing.timeSinceGrounded = 0;
    }
    
    // Horizontal movement
    const moveDirection = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    
    if (moveDirection !== 0) {
      // Accelerate
      avatar.vx += moveDirection * physics.acceleration * dtSeconds;
      avatar.facing = moveDirection as 1 | -1;
      
      // Clamp to max speed
      if (Math.abs(avatar.vx) > physics.maxSpeed) {
        avatar.vx = Math.sign(avatar.vx) * physics.maxSpeed;
      }
    } else {
      // Apply friction
      const friction = physics.friction * dtSeconds;
      if (Math.abs(avatar.vx) <= friction) {
        avatar.vx = 0;
      } else {
        avatar.vx -= Math.sign(avatar.vx) * friction;
      }
    }
    
    // Jumping with coyote time and jump buffer
    const canCoyoteJump = timing.timeSinceGrounded < physics.coyoteTime;
    const hasJumpBuffer = timing.timeSinceJumpPressed < physics.jumpBuffer;
    const canJump = (avatar.grounded || canCoyoteJump) && !timing.jumpConsumed;
    
    // Apex jump - can chain indefinitely if timing is right
    const atApex = !avatar.grounded && Math.abs(avatar.vy) < physics.apexVelocityThreshold;
    const canApexJump = atApex && input.jumpPressed;
    
    if (canJump && hasJumpBuffer) {
      avatar.vy = physics.jumpVelocity;
      avatar.grounded = false;
      timing.jumpConsumed = true;
      timing.timeSinceGrounded = physics.coyoteTime; // Prevent double jump from coyote
    } else if (canApexJump) {
      // Apex jump with slightly reduced power
      avatar.vy = physics.jumpVelocity * physics.doubleJumpMultiplier;
    }
    
    // Drop through platform
    if (avatar.grounded && input.downPressed) {
      avatar.grounded = false;
      avatar.y += 4; // Push through platform
      timing.timeSinceGrounded = physics.coyoteTime; // Prevent immediate coyote jump
      timing.dropIgnoreTime = 150; // Ignore collisions briefly
    }
    
    // Update drop ignore timer
    if (timing.dropIgnoreTime > 0) {
      timing.dropIgnoreTime -= dt;
    }
    
    // Apply gravity
    if (!avatar.grounded) {
      avatar.vy += physics.gravity * dtSeconds;
    }
    
    // Update position
    avatar.x += avatar.vx * dtSeconds;
    avatar.y += avatar.vy * dtSeconds;
    
    // Platform collision (one-way) - skip during drop ignore window
    if (timing.dropIgnoreTime <= 0) {
      const collision = checkPlatformCollision(
        avatar,
        prevY,
        AVATAR_SIZE,
        platforms,
        physics
      );
      
      if (collision.grounded && collision.landingY !== null) {
        avatar.y = collision.landingY;
        avatar.vy = 0;
        avatar.grounded = true;
        timing.jumpConsumed = false;
        timing.doubleJumpUsed = false;
      } else if (avatar.grounded) {
        // Check if still on platform (walking off edge)
        const stillOnPlatform = isStandingOnPlatform(
          avatar,
          AVATAR_SIZE,
          platforms,
          physics
        );
        if (!stillOnPlatform) {
          avatar.grounded = false;
        }
      }
    }
    
    // Respawn if fallen below document
    const docHeight = getDocumentHeight();
    if (avatar.y > docHeight + 200) {
      this.spawnOnFooter();
    }
    
    // Prevent going off the left side
    if (avatar.x < 0) {
      avatar.x = 0;
      avatar.vx = 0;
    }
    
    // Prevent going off the right side
    const docWidth = document.documentElement.scrollWidth;
    if (avatar.x + AVATAR_SIZE.width > docWidth) {
      avatar.x = docWidth - AVATAR_SIZE.width;
      avatar.vx = 0;
    }
  }
  
  /** Update animation state based on physics. */
  private updateAnimation(): void {
    const { avatar } = this.state;
    
    if (!avatar.grounded) {
      avatar.animation = avatar.vy < 0 ? 'jump' : 'fall';
    } else if (Math.abs(avatar.vx) > 10) {
      avatar.animation = 'run';
    } else {
      avatar.animation = 'idle';
    }
  }
  
  /** Render avatar position and state. */
  private renderAvatar(): void {
    if (!this.avatarElement) return;
    
    const { avatar } = this.state;
    
    // Use translate for smooth rendering
    this.avatarElement.style.transform = 
      `translate(${avatar.x}px, ${avatar.y}px) scaleX(${avatar.facing})`;
    
    // Update animation class
    this.avatarElement.dataset.animation = avatar.animation;
  }
  
  /** Gently scroll viewport to keep avatar visible. */
  private updateViewportScroll(): void {
    const { avatar } = this.state;
    const viewportHeight = window.innerHeight;
    const scrollY = window.scrollY;
    
    // Avatar position relative to viewport
    const avatarViewportY = avatar.y - scrollY;
    const avatarBottom = avatarViewportY + AVATAR_SIZE.height;
    
    // Check if avatar is near edges
    let targetScroll = scrollY;
    
    if (avatarViewportY < VIEWPORT_MARGINS.top) {
      // Avatar near top - scroll up
      targetScroll = avatar.y - VIEWPORT_MARGINS.top;
    } else if (avatarBottom > viewportHeight - VIEWPORT_MARGINS.bottom) {
      // Avatar near bottom - scroll down
      targetScroll = avatar.y + AVATAR_SIZE.height - viewportHeight + VIEWPORT_MARGINS.bottom;
    }
    
    // Clamp scroll target
    const maxScroll = getDocumentHeight() - viewportHeight;
    targetScroll = Math.max(0, Math.min(targetScroll, maxScroll));
    
    // Smooth scroll (lerp towards target)
    if (Math.abs(targetScroll - scrollY) > 1) {
      const smoothScroll = scrollY + (targetScroll - scrollY) * 0.1;
      window.scrollTo({ top: smoothScroll, behavior: 'instant' });
    }
  }
  
  /** Refresh platform positions. */
  refreshPlatforms(): void {
    this.state.platforms = scanPlatforms();
  }
  
  /** Schedule a platform refresh (debounced). */
  private schedulePlatformRefresh(): void {
    if (this.platformRefreshScheduled) return;
    
    this.platformRefreshScheduled = true;
    requestAnimationFrame(() => {
      this.refreshPlatforms();
      this.platformRefreshScheduled = false;
    });
  }
  
  /** Spawn avatar on the footer. */
  private spawnOnFooter(): void {
    this.refreshPlatforms();
    
    const footer = findFooterPlatform(this.state.platforms);
    if (!footer) return;
    
    // Spawn on top of footer, centered
    const footerCenterX = (footer.left + footer.right) / 2;
    
    this.state.avatar = {
      x: footerCenterX - AVATAR_SIZE.width / 2,
      y: footer.top - AVATAR_SIZE.height,
      vx: 0,
      vy: 0,
      grounded: true,
      facing: 1,
      animation: 'idle',
    };
    
    this.state.timing = this.createInitialTimingState();
  }
  
  /** Wait for page to be fully ready, then spawn avatar on footer. */
  private waitForReadyAndSpawn(): void {
    // Wait for fonts to load
    document.fonts.ready.then(() => {
      // Additional small delay to ensure layout is complete
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          this.spawnOnFooter();
          this.renderAvatar();
          
          // Make avatar visible
          if (this.avatarElement) {
            this.avatarElement.classList.add('spawned');
          }
        });
      });
    });
  }
  
  /** Set up resize observer for platform updates. */
  private setupResizeObserver(): void {
    this.resizeObserver = new ResizeObserver(() => {
      this.schedulePlatformRefresh();
    });
    
    this.resizeObserver.observe(document.body);
    
    // Also listen for window resize
    window.addEventListener('resize', () => this.schedulePlatformRefresh());
    
    // Listen for scroll to update platforms (for auto-detected elements)
    window.addEventListener('scroll', () => this.schedulePlatformRefresh(), { passive: true });
    
    // Listen for fonts loading
    document.fonts.ready.then(() => this.schedulePlatformRefresh());
  }
  
  /** Set up activation click handler. */
  private setupActivation(): void {
    if (!this.avatarElement) return;
    
    this.avatarElement.addEventListener('click', () => {
      if (this.state.active) {
        this.deactivate();
      } else {
        this.activate();
      }
    });
    
    this.avatarElement.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (this.state.active) {
          this.deactivate();
        } else {
          this.activate();
        }
      }
    });
  }
  
  /** Restore state from session storage. */
  private restoreSessionState(): void {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored === 'true') {
        this.state.hasActivatedThisSession = true;
      }
    } catch {
      // Ignore storage errors
    }
  }
  
  /** Show controls hint until game ends. */
  private showControlsHint(): void {
    if (!this.controlsHint) return;
    
    this.controlsHint.classList.add('visible');
  }
  
  /** Hide controls hint. */
  private hideControlsHint(): void {
    if (!this.controlsHint) return;
    this.controlsHint.classList.remove('visible');
  }
  
  /** Check if user prefers reduced motion. */
  private prefersReducedMotion(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  
  /** Check if device is touch-only (no keyboard). */
  private isTouchOnlyDevice(): boolean {
    // Check for touch support and narrow width (likely mobile)
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isNarrow = window.innerWidth < 768;
    return hasTouch && isNarrow;
  }
  
  /** Create initial avatar state. */
  private createInitialAvatarState(): AvatarState {
    return {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      grounded: true,
      facing: 1,
      animation: 'idle',
    };
  }
  
  /** Create initial timing state. */
  private createInitialTimingState(): TimingState {
    return {
      timeSinceGrounded: 0,
      timeSinceJumpPressed: Infinity,
      jumpConsumed: false,
      doubleJumpUsed: false,
      dropIgnoreTime: 0,
    };
  }
}

/** Global engine instance. */
let engine: PlatformerEngine | null = null;

/** Initialize the platformer on page load. */
export function initPlatformer(
  avatarElement: HTMLElement,
  controlsHint: HTMLElement
): PlatformerEngine {
  // Clean up existing engine
  engine?.destroy();
  
  engine = new PlatformerEngine();
  engine.init(avatarElement, controlsHint);
  
  return engine;
}

/** Get the current engine instance. */
export function getEngine(): PlatformerEngine | null {
  return engine;
}
