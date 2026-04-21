# Workflow: Simulacra

## Overview

This document defines the development workflow for the Simulacra project, following the Conductor methodology.

---

## Phase 1: Context & Planning

### Track Creation
1. User defines a new track (feature or bug fix)
2. Conductor generates `spec.md` with detailed requirements
3. Conductor generates `plan.md` with task breakdown

### Task Structure
Each task follows Test-Driven Development (TDD):
```
- [ ] Task: <Task Description>
    - [ ] Sub-task: Write tests for <Feature>
    - [ ] Sub-task: Implement <Feature>
    - [ ] Sub-task: Verify implementation against spec
```

---

## Phase 2: Implementation

### Development Process
1. **Write Tests First**: Create failing tests that define expected behavior
2. **Implement Feature**: Write code to make tests pass
3. **Verify**: Ensure implementation matches specification

### Commit Strategy
- **Per Task**: Commit after each completed task
- **Message Format**:
  ```
  <type>(<scope>): <description>

  [optional body]
  ```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code refactoring
- `test`: Test addition/update
- `docs`: Documentation
- `chore`: Maintenance

### Examples
```bash
# Feature task complete
git commit -m "feat(game): Add isometric grid rendering

- Implement 64x64 grid with 32x16 tiles
- Add screen coordinate conversion
- Add camera pan and zoom controls"

# Bug fix task complete  
git commit -m "fix(agent): Fix agent movement interpolation

- Add lerp function for smooth movement
- Update position every 100ms"
```

---

## Phase 3: Review

### Code Review Checklist
- [ ] Tests pass
- [ ] Code coverage >80%
- [ ] No linting errors
- [ ] Implementation matches spec
- [ ] No console errors/warnings

### Phase Completion
After completing all tasks in a phase:
1. Run full test suite
2. Verify coverage meets threshold
3. Create phase completion commit
4. Update track status

---

## Testing Requirements

### Coverage Threshold
- **Minimum**: 80% code coverage
- **Target**: 90% for critical paths

### Test Structure
```
src/
├── __tests__/
│   ├── components/
│   │   ├── GameCanvas.test.tsx
│   │   ├── AgentSprite.test.tsx
│   │   └── ThoughtStream.test.tsx
│   ├── lib/
│   │   ├── isometric.test.ts
│   │   └── ai-client.test.ts
│   └── convex/
│       ├── agents.test.ts
│       └── world.test.ts
```

### Running Tests
```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run in watch mode
npm test -- --watch
```

---

## Track Management

### Track Status States
| Status | Description |
|--------|-------------|
| `new` | Track created, not started |
| `in_progress` | Actively being implemented |
| `review` | Under review |
| `completed` | All tasks complete |
| `cancelled` | Track cancelled |

### Track Artifacts
Each track has:
- `spec.md` - Detailed specification
- `plan.md` - Task breakdown
- `metadata.json` - Track metadata

---

## Phase Completion Protocol

### Verification Steps
1. Run test suite: `npm test`
2. Check coverage: `npm test -- --coverage`
3. Build project: `npm run build`
4. Review implementation against spec

### Checkpoint Commit
```bash
git commit -m "feat: Complete Phase X - <Phase Name>

- All tasks completed
- Tests passing
- Coverage: XX%"
```

---

## Git Workflow

### Branch Strategy
```
main
  └── tracks/<track_id>/<task_name>
```

### Example Flow
```bash
# Create branch for track
git checkout -b tracks/game-engine/setup-grid

# Work on tasks, commit per task
git commit -m "feat(grid): Add grid rendering tests"
git commit -m "feat(grid): Implement 64x64 isometric grid"

# Complete track
git checkout main
git merge tracks/game-engine/setup-grid
```

---

## Quality Gates

### Pre-commit Checks
- [ ] All tests pass
- [ ] Coverage >= 80%
- [ ] No lint errors
- [ ] TypeScript compiles without errors

### Pre-merge Checks
- [ ] All phases complete
- [ ] Track status updated
- [ ] Documentation updated

---

## Cost Optimization

### LLM Usage
- Only call LLM when agents within interaction radius
- Use vector search to limit context
- Cache agent decisions where possible

### Development
- Use hot reload for rapid iteration
- Run subset of tests during development
- Use type checking to catch errors early