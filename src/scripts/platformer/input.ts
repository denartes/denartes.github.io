/**
 * Input handling for the platformer.
 * Only captures input when the game is active.
 */

import type { InputState } from './types';

/** Keys used for movement. */
const LEFT_KEYS = new Set(['KeyA', 'ArrowLeft']);
const RIGHT_KEYS = new Set(['KeyD', 'ArrowRight']);
const JUMP_KEYS = new Set(['KeyW', 'ArrowUp', 'Space']);
const DOWN_KEYS = new Set(['KeyS', 'ArrowDown']);
const EXIT_KEY = 'Escape';

/** All game keys that should prevent default when active. */
const GAME_KEYS = new Set([...LEFT_KEYS, ...RIGHT_KEYS, ...JUMP_KEYS, ...DOWN_KEYS]);

export class InputHandler {
  private leftHeld = false;
  private rightHeld = false;
  private jumpHeld = false;
  private jumpPressedThisFrame = false;
  private downPressedThisFrame = false;
  
  private active = false;
  private onExit: (() => void) | null = null;
  
  private boundKeyDown: (e: KeyboardEvent) => void;
  private boundKeyUp: (e: KeyboardEvent) => void;
  
  constructor() {
    this.boundKeyDown = this.handleKeyDown.bind(this);
    this.boundKeyUp = this.handleKeyUp.bind(this);
  }
  
  /** Start capturing input. */
  activate(onExit: () => void): void {
    if (this.active) return;
    
    this.active = true;
    this.onExit = onExit;
    this.resetState();
    
    document.addEventListener('keydown', this.boundKeyDown, { capture: true });
    document.addEventListener('keyup', this.boundKeyUp, { capture: true });
  }
  
  /** Stop capturing input and restore normal browser behavior. */
  deactivate(): void {
    if (!this.active) return;
    
    this.active = false;
    this.onExit = null;
    this.resetState();
    
    document.removeEventListener('keydown', this.boundKeyDown, { capture: true });
    document.removeEventListener('keyup', this.boundKeyUp, { capture: true });
  }
  
  /** Get current input state and clear frame-specific flags. */
  poll(): InputState {
    const state: InputState = {
      left: this.leftHeld,
      right: this.rightHeld,
      jumpPressed: this.jumpPressedThisFrame,
      jumpHeld: this.jumpHeld,
      downPressed: this.downPressedThisFrame,
    };
    
    // Clear single-frame flags
    this.jumpPressedThisFrame = false;
    this.downPressedThisFrame = false;
    
    return state;
  }
  
  /** Check if game input is currently active. */
  isActive(): boolean {
    return this.active;
  }
  
  private handleKeyDown(e: KeyboardEvent): void {
    if (!this.active) return;
    
    // Check for exit
    if (e.code === EXIT_KEY) {
      e.preventDefault();
      e.stopPropagation();
      this.onExit?.();
      return;
    }
    
    // Only process game keys
    if (!GAME_KEYS.has(e.code)) return;
    
    // Prevent default browser behavior for game keys
    e.preventDefault();
    e.stopPropagation();
    
    if (LEFT_KEYS.has(e.code)) {
      this.leftHeld = true;
    }
    if (RIGHT_KEYS.has(e.code)) {
      this.rightHeld = true;
    }
    if (JUMP_KEYS.has(e.code) && !this.jumpHeld) {
      this.jumpHeld = true;
      this.jumpPressedThisFrame = true;
    }
    if (DOWN_KEYS.has(e.code)) {
      this.downPressedThisFrame = true;
    }
  }
  
  private handleKeyUp(e: KeyboardEvent): void {
    if (!this.active) return;
    
    if (LEFT_KEYS.has(e.code)) {
      this.leftHeld = false;
    }
    if (RIGHT_KEYS.has(e.code)) {
      this.rightHeld = false;
    }
    if (JUMP_KEYS.has(e.code)) {
      this.jumpHeld = false;
    }
  }
  
  private resetState(): void {
    this.leftHeld = false;
    this.rightHeld = false;
    this.jumpHeld = false;
    this.jumpPressedThisFrame = false;
    this.downPressedThisFrame = false;
  }
}
