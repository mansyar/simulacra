# Specification: User Presence Tracking System

## Overview

Replace the current tick-based sleep mode logic with a comprehensive user presence tracking system that accurately detects real-time user activity. This system will use the official Convex `@convex-dev/presence` component to track users in a "room" and determine when the world should enter sleep mode.

**Track ID:** `presence-tracking_20250425`

---

## Functional Requirements

### 1. Presence Component Integration

#### 1.1 Installation
- Install `@convex-dev/presence` via npm
- Add the component to `convex/convex.config.ts` using `app.use(presence)`

#### 1.2 Component Setup
- The component manages presence state internally (no manual table needed)
- Uses scheduled functions for efficient updates (no polling)
- Clients only receive updates when users join or leave the room

### 2. Convex API Functions

Create the following functions in `convex/presence.ts`:

#### 2.1 `heartbeat` Mutation
- **Purpose**: Client signals they are active in the room
- **Parameters**:
  - `roomId`: string - Identifier for the room (e.g., "main-app")
  - `userId`: string - User identifier from Convex auth
  - `sessionId`: string - Unique session ID per browser tab/window
  - `interval`: number - Heartbeat interval in milliseconds
- **Behavior**: Updates the user's presence state in the room

#### 2.2 `list` Query
- **Purpose**: Get the live-updating list of users in the room
- **Parameters**:
  - `roomToken`: string - Token identifying the room
- **Behavior**: Returns list of users with their presence status
- **Note**: Optimized for shared cache - all subscriptions use the same cache

#### 2.3 `disconnect` Mutation
- **Purpose**: Gracefully remove a user from the room
- **Parameters**:
  - `sessionToken`: string - Token identifying the session to disconnect
- **Behavior**: Removes the user's presence record
- **Note**: Called automatically via `sendBeacon` on tab close

### 3. Client-Side Integration

#### 3.1 React Hook Usage
- Use `usePresence` hook from `@convex-dev/presence/react`
- Hook automatically:
  - Sends heartbeat messages at regular intervals
  - Handles cleanup when components unmount or tabs close
  - Provides live presence state that updates when users join/leave

#### 3.2 Room Identification
- Room ID: `"main-app"` (or configurable via environment variable)
- All users viewing the app join the same room
- Room provides live-updating list of all current users

#### 3.3 Session Management
- Session ID: Generated per browser tab/window using `crypto.randomUUID()`
- Session ID stored in `sessionStorage` for persistence across page reloads
- Each tab/window has a unique session within the room

### 4. Sleep Mode Integration

#### 4.1 Modified Sleep Mode Logic
- **Current Logic**: Pauses world tick after 30 minutes of inactivity based on tick execution timing
- **New Logic**: Pauses world tick when the presence room is empty (no users viewing the app)
- **Grace Period**: 30-second grace period before pausing sleep mode when users become active

#### 4.2 Implementation
- Use the `list` query to check if any users are in the room
- If room is empty, trigger sleep mode after grace period
- If room has users, ensure sleep mode is disabled

#### 4.3 Configuration
- `SLEEP_MODE_GRACE_PERIOD`: Configurable grace period (default: 30000ms = 30 seconds)
- `PRESENCE_ROOM_ID`: Configurable room identifier (default: "main-app")

### 5. UI Integration

#### 5.1 Active User Count Display
- **Location**: Header, right side (next to weather icon and master toggle)
- **Display**: Shows count of active users (e.g., "👁 2 observers")
- **Implementation**: Use `FacePile` component or custom display from presence state
- **Styling**: Pixel-style font, subtle icon

#### 5.2 Component Updates
- Update `Header.tsx` to include active user count
- Use `usePresence` hook to get live presence state
- Display count derived from presence list

---

## Non-Functional Requirements

### Performance
- Presence updates use scheduled functions (no polling)
- Minimal query re-execution - only when users join/leave
- Efficient shared cache for all subscriptions

### Reliability
- Automatic cleanup on tab close via `sendBeacon`
- Graceful disconnection handling
- Session persistence across page reloads

### Security
- User identification via Convex auth
- Auth checks in heartbeat/disconnect mutations
- No sensitive data in presence state

---

## Acceptance Criteria

### 1. Presence Component Setup
- [ ] `@convex-dev/presence` installed via npm
- [ ] Component added to `convex/convex.config.ts`
- [ ] `convex/presence.ts` created with heartbeat, list, and disconnect functions

### 2. Client Integration
- [ ] `usePresence` hook implemented in client code
- [ ] Room ID configured (default: "main-app")
- [ ] Session ID generated per browser tab/window
- [ ] Automatic heartbeat sending implemented
- [ ] Automatic cleanup on tab close implemented

### 3. Sleep Mode Integration
- [ ] Sleep mode checks if presence room is empty
- [ ] 30-second grace period implemented
- [ ] Grace period configurable via environment variable

### 4. UI Integration
- [ ] Active user count displayed in header (right side)
- [ ] Real-time updates via presence hook
- [ ] Pixel-style font styling matches existing design

### 5. Testing
- [ ] Unit tests for presence functions
- [ ] Integration tests for sleep mode interaction
- [ ] Coverage >80% for new code

---

## Out of Scope

- Historical presence tracking or analytics
- User-specific presence details beyond count
- Presence-based notifications or alerts
- Multi-user collaboration features
- Presence visibility for non-authenticated users

---

## Technical Notes

### Convex Presence Component

The `@convex-dev/presence` component provides:
- **Room-based tracking**: Users are tracked in a "room" identified by a string
- **Scheduled functions**: Efficient updates without polling
- **Automatic cleanup**: Handles disconnections via `sendBeacon` on tab close
- **React hook**: `usePresence` for seamless client integration
- **FacePile component**: Pre-built UI for displaying user avatars

### Key Functions

| Function | Type | Purpose |
|----------|------|---------|
| `heartbeat` | Mutation | Client signals activity |
| `list` | Query | Get live user list |
| `disconnect` | Mutation | Graceful cleanup |

### Room Concept

- All users viewing the app join the same room (e.g., "main-app")
- The room provides a live-updating list of all current users
- When a user views the app, they join the room
- When a user disconnects, they leave the room

### Environment Variables

- `PRESENCE_ROOM_ID`: Room identifier (default: "main-app")
- `SLEEP_MODE_GRACE_PERIOD`: Grace period before sleep mode activation (default: 30000ms)
