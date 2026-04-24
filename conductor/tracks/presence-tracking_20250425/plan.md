# Implementation Plan: User Presence Tracking System

**Track ID:** `presence-tracking_20250425`

---

## Phase 1: Presence Component Setup

### Task 1.1: Install @convex-dev/presence Component
- [ ] Task: Install the presence component via pnpm
  - [ ] Run: `pnpm add @convex-dev/presence`
  - [ ] Verify: Check package.json for the dependency

### Task 1.2: Configure Convex App
- [ ] Task: Add presence component to Convex configuration
  - [ ] Read: `convex/convex.config.ts`
  - [ ] Edit: Import and use the presence component
  - [ ] Verify: Component is properly registered

### Task 1.3: Create Presence Directory Structure
- [ ] Task: Create directory for presence-related files
  - [ ] Create: `convex/presence.ts` file
  - [ ] Create: `src/components/ui/ActiveUserCount.tsx` file

### Task 1.4: Conductor - User Manual Verification 'Phase 1' (Protocol in workflow.md)

---

## Phase 2: Convex API Functions

### Task 2.1: Write Tests for Presence Functions (Red Phase)
- [ ] Task: Create test file for presence functions
  - [ ] Create: `convex/presence.test.ts`
  - [ ] Write: Tests for `heartbeat` mutation
  - [ ] Write: Tests for `list` query
  - [ ] Write: Tests for `disconnect` mutation
  - [ ] Run: Tests and confirm they fail (expected behavior)

### Task 2.2: Implement heartbeat Mutation (Green Phase)
- [ ] Task: Implement the heartbeat mutation
  - [ ] Read: `convex/presence.ts` (create if needed)
  - [ ] Edit: Add `heartbeat` mutation using presence component
  - [ ] Run: Tests to verify implementation

### Task 2.3: Implement list Query (Green Phase)
- [ ] Task: Implement the list query
  - [ ] Read: `convex/presence.ts`
  - [ ] Edit: Add `list` query using presence component
  - [ ] Run: Tests to verify implementation

### Task 2.4: Implement disconnect Mutation (Green Phase)
- [ ] Task: Implement the disconnect mutation
  - [ ] Read: `convex/presence.ts`
  - [ ] Edit: Add `disconnect` mutation using presence component
  - [ ] Run: Tests to verify implementation

### Task 2.5: Refactor and Verify Coverage
- [ ] Task: Refactor presence functions for clarity
  - [ ] Refactor: Clean up code and improve readability
  - [ ] Run: Tests to ensure they still pass
  - [ ] Run: Coverage report (`pnpm test:coverage`)
  - [ ] Verify: Coverage >80% for new code

### Task 2.6: Conductor - User Manual Verification 'Phase 2' (Protocol in workflow.md)

---

## Phase 3: Client Integration

### Task 3.1: Write Tests for Client Integration (Red Phase)
- [ ] Task: Create test file for client-side presence
  - [ ] Create: `src/components/ui/ActiveUserCount.test.tsx`
  - [ ] Write: Tests for `usePresence` hook usage
  - [ ] Write: Tests for session ID generation
  - [ ] Run: Tests and confirm they fail (expected behavior)

### Task 3.2: Implement usePresence Hook Integration (Green Phase)
- [ ] Task: Integrate `usePresence` hook in client code
  - [ ] Read: `src/components/ui/ActiveUserCount.tsx`
  - [ ] Edit: Import and use `usePresence` hook from `@convex-dev/presence/react`
  - [ ] Edit: Configure room ID (default: "main-app")
  - [ ] Run: Tests to verify implementation

### Task 3.3: Implement Session ID Management (Green Phase)
- [ ] Task: Generate and manage session IDs per browser tab
  - [ ] Read: `src/components/ui/ActiveUserCount.tsx`
  - [ ] Edit: Generate unique session ID using `crypto.randomUUID()`
  - [ ] Edit: Store session ID in `sessionStorage`
  - [ ] Run: Tests to verify implementation

### Task 3.4: Implement Automatic Heartbeat (Green Phase)
- [ ] Task: Configure automatic heartbeat sending
  - [ ] Read: `src/components/ui/ActiveUserCount.tsx`
  - [ ] Edit: Configure `usePresence` hook with proper interval
  - [ ] Run: Tests to verify implementation

### Task 3.5: Refactor and Verify Coverage
- [ ] Task: Refactor client integration code
  - [ ] Refactor: Clean up code and improve readability
  - [ ] Run: Tests to ensure they still pass
  - [ ] Run: Coverage report (`pnpm test:coverage`)
  - [ ] Verify: Coverage >80% for new code

### Task 3.6: Conductor - User Manual Verification 'Phase 3' (Protocol in workflow.md)

---

## Phase 4: Sleep Mode Integration

### Task 4.1: Write Tests for Sleep Mode Logic (Red Phase)
- [ ] Task: Create test file for sleep mode integration
  - [ ] Create: `convex/sleep-mode.test.ts`
  - [ ] Write: Tests for checking if presence room is empty
  - [ ] Write: Tests for grace period behavior
  - [ ] Write: Tests for sleep mode activation/deactivation
  - [ ] Run: Tests and confirm they fail (expected behavior)

### Task 4.2: Implement Sleep Mode Check (Green Phase)
- [ ] Task: Modify sleep mode logic to check presence room
  - [ ] Read: `convex/world.ts` (existing sleep mode logic)
  - [ ] Edit: Add presence room check using `list` query
  - [ ] Edit: Pause crons when room is empty
  - [ ] Run: Tests to verify implementation

### Task 4.3: Implement Grace Period (Green Phase)
- [ ] Task: Add 30-second grace period for sleep mode
  - [ ] Read: `convex/world.ts`
  - [ ] Edit: Implement grace period logic
  - [ ] Edit: Make grace period configurable via environment variable
  - [ ] Run: Tests to verify implementation

### Task 4.4: Refactor and Verify Coverage
- [ ] Task: Refactor sleep mode integration code
  - [ ] Refactor: Clean up code and improve readability
  - [ ] Run: Tests to ensure they still pass
  - [ ] Run: Coverage report (`pnpm test:coverage`)
  - [ ] Verify: Coverage >80% for new code

### Task 4.5: Conductor - User Manual Verification 'Phase 4' (Protocol in workflow.md)

---

## Phase 5: UI Integration

### Task 5.1: Write Tests for UI Components (Red Phase)
- [ ] Task: Create test file for UI components
  - [ ] Create: `src/components/ui/ActiveUserCount.test.tsx` (if not exists)
  - [ ] Write: Tests for active user count display
  - [ ] Write: Tests for real-time updates via presence hook
  - [ ] Run: Tests and confirm they fail (expected behavior)

### Task 5.2: Implement Active User Count Component (Green Phase)
- [ ] Task: Create ActiveUserCount component
  - [ ] Read: `src/components/ui/ActiveUserCount.tsx`
  - [ ] Edit: Implement component to display user count
  - [ ] Edit: Use presence hook to get live data
  - [ ] Run: Tests to verify implementation

### Task 5.3: Integrate into Header (Green Phase)
- [ ] Task: Add ActiveUserCount to Header component
  - [ ] Read: `src/components/ui/Header.tsx`
  - [ ] Edit: Import and render ActiveUserCount component
  - [ ] Edit: Position on right side (next to weather icon)
  - [ ] Run: Tests to verify implementation

### Task 5.4: Apply Styling (Green Phase)
- [ ] Task: Apply pixel-style font and styling
  - [ ] Read: `src/components/ui/ActiveUserCount.tsx`
  - [ ] Edit: Apply pixel-style font (VT323 or similar)
  - [ ] Edit: Add subtle icon (👁)
  - [ ] Run: Tests to verify implementation

### Task 5.5: Refactor and Verify Coverage
- [ ] Task: Refactor UI integration code
  - [ ] Refactor: Clean up code and improve readability
  - [ ] Run: Tests to ensure they still pass
  - [ ] Run: Coverage report (`pnpm test:coverage`)
  - [ ] Verify: Coverage >80% for new code

### Task 5.6: Conductor - User Manual Verification 'Phase 5' (Protocol in workflow.md)

---

## Phase 6: Testing and Verification

### Task 6.1: Write Integration Tests
- [ ] Task: Create integration tests for complete flow
  - [ ] Create: `src/integration/presence-flow.test.ts`
  - [ ] Write: Tests for user joining/leaving room
  - [ ] Write: Tests for sleep mode interaction
  - [ ] Write: Tests for UI updates
  - [ ] Run: Tests and verify all pass

### Task 6.2: Run Full Test Suite
- [ ] Task: Execute complete test suite
  - [ ] Run: `pnpm test` (all unit tests)
  - [ ] Run: `pnpm test:coverage` (coverage report)
  - [ ] Verify: All tests pass
  - [ ] Verify: Coverage >80% for new code

### Task 6.3: Verify Code Quality
- [ ] Task: Run linting and type checking
  - [ ] Run: `npx tsc --noEmit` (type checking)
  - [ ] Run: Linter (if configured)
  - [ ] Verify: No errors or warnings

### Task 6.4: Conductor - User Manual Verification 'Phase 6' (Protocol in workflow.md)

---

## Phase 7: Final Integration and Deployment

### Task 7.1: Update Environment Configuration
- [ ] Task: Add environment variables
  - [ ] Read: `.env` or environment configuration
  - [ ] Edit: Add `PRESENCE_ROOM_ID` (default: "main-app")
  - [ ] Edit: Add `SLEEP_MODE_GRACE_PERIOD` (default: 30000)
  - [ ] Verify: Variables are properly documented

### Task 7.2: Update Documentation
- [ ] Task: Update project documentation
  - [ ] Read: `conductor/tech-stack.md`
  - [ ] Edit: Add `@convex-dev/presence` to dependencies
  - [ ] Read: `conductor/product.md`
  - [ ] Edit: Update sleep mode description
  - [ ] Verify: Documentation is accurate

### Task 7.3: Final Verification
- [ ] Task: Complete final verification checklist
  - [ ] Verify: All acceptance criteria met
  - [ ] Verify: All tests pass
  - [ ] Verify: Coverage >80%
  - [ ] Verify: Code follows project style
  - [ ] Verify: No security vulnerabilities introduced

### Task 7.4: Conductor - User Manual Verification 'Phase 7' (Protocol in workflow.md)

---

## Summary

This implementation plan follows the Conductor methodology and TDD workflow:
- **6 Phases** covering all aspects of the presence tracking system
- **TDD approach** with Red/Green/Refactor cycles
- **Phase completion verification** for each phase
- **Quality gates** including tests, coverage, and code review

The plan will result in a fully functional user presence tracking system that:
1. Tracks users in a Convex "room" using `@convex-dev/presence`
2. Integrates with sleep mode to pause crons when no users are present
3. Displays active user count in the UI
4. Automatically handles user join/leave events
