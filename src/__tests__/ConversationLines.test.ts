import { describe, it, expect, beforeEach } from 'vitest';
import { ConversationLines } from '../components/game/ConversationLines';

describe('ConversationLines', () => {
  let conversationLines: ConversationLines;

  beforeEach(() => {
    conversationLines = new ConversationLines();
  });

  it('should be created', () => {
    expect(conversationLines).toBeDefined();
  });

  it('should have empty initial state', () => {
    expect(conversationLines.getConversationCount()).toBe(0);
  });

  it('should add conversation line between two agents', () => {
    const agentA = {
      id: 'agent-a',
      name: 'Agent A',
      gridX: 10,
      gridY: 10,
      archetype: 'socialite' as const,
    };

    const agentB = {
      id: 'agent-b',
      name: 'Agent B',
      gridX: 20,
      gridY: 20,
      archetype: 'builder' as const,
    };

    conversationLines.addConversation(agentA, agentB);

    expect(conversationLines.getConversationCount()).toBe(1);
  });

  it('should remove conversation line when conversation ends', () => {
    const agentA = {
      id: 'agent-a',
      name: 'Agent A',
      gridX: 10,
      gridY: 10,
      archetype: 'socialite' as const,
    };

    const agentB = {
      id: 'agent-b',
      name: 'Agent B',
      gridX: 20,
      gridY: 20,
      archetype: 'builder' as const,
    };

    conversationLines.addConversation(agentA, agentB);
    expect(conversationLines.getConversationCount()).toBe(1);

    conversationLines.removeConversation(agentA.id, agentB.id);
    // Conversation is marked for fading out, but still in map
    expect(conversationLines.getConversationCount()).toBe(1);

    // Update with large delta time to complete fade out
    conversationLines.update(500);
    expect(conversationLines.getConversationCount()).toBe(0);
  });

  it('should update line positions when agents move', () => {
    const agentA = {
      id: 'agent-a',
      name: 'Agent A',
      gridX: 10,
      gridY: 10,
      archetype: 'socialite' as const,
    };

    const agentB = {
      id: 'agent-b',
      name: 'Agent B',
      gridX: 20,
      gridY: 20,
      archetype: 'builder' as const,
    };

    conversationLines.addConversation(agentA, agentB);

    // Update agent positions
    const updatedAgentA = { ...agentA, gridX: 15, gridY: 15 };
    const updatedAgentB = { ...agentB, gridX: 25, gridY: 25 };

    conversationLines.updatePositions(updatedAgentA, updatedAgentB);

    // Line should still exist and be updated
    expect(conversationLines.getConversationCount()).toBe(1);
  });

  it('should handle multiple conversations', () => {
    const agentA = {
      id: 'agent-a',
      name: 'Agent A',
      gridX: 10,
      gridY: 10,
      archetype: 'socialite' as const,
    };

    const agentB = {
      id: 'agent-b',
      name: 'Agent B',
      gridX: 20,
      gridY: 20,
      archetype: 'builder' as const,
    };

    const agentC = {
      id: 'agent-c',
      name: 'Agent C',
      gridX: 30,
      gridY: 30,
      archetype: 'explorer' as const,
    };

    const agentD = {
      id: 'agent-d',
      name: 'Agent D',
      gridX: 40,
      gridY: 40,
      archetype: 'philosopher' as const,
    };

    conversationLines.addConversation(agentA, agentB);
    conversationLines.addConversation(agentC, agentD);

    expect(conversationLines.getConversationCount()).toBe(2);
  });

  it('should clear all conversations', () => {
    const agentA = {
      id: 'agent-a',
      name: 'Agent A',
      gridX: 10,
      gridY: 10,
      archetype: 'socialite' as const,
    };

    const agentB = {
      id: 'agent-b',
      name: 'Agent B',
      gridX: 20,
      gridY: 20,
      archetype: 'builder' as const,
    };

    const agentC = {
      id: 'agent-c',
      name: 'Agent C',
      gridX: 30,
      gridY: 30,
      archetype: 'explorer' as const,
    };

    const agentD = {
      id: 'agent-d',
      name: 'Agent D',
      gridX: 40,
      gridY: 40,
      archetype: 'philosopher' as const,
    };

    conversationLines.addConversation(agentA, agentB);
    conversationLines.addConversation(agentC, agentD);

    expect(conversationLines.getConversationCount()).toBe(2);

    conversationLines.clear();
    expect(conversationLines.getConversationCount()).toBe(0);
  });
});
