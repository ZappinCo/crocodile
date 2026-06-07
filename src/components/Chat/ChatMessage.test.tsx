import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChatMessage } from './ChatMessage';

describe('ChatMessage', () => {
  const baseMessage = {
    id: '1',
    userId: 'user1',
    userName: 'TestUser',
    text: 'Hello world',
    timestamp: new Date().toISOString(),
    isGuess: false,
  };

  it('renders own message correctly', () => {
    render(
      <ChatMessage
        message={baseMessage}
        isOwn={true}
        isLeader={false}
        isGameActive={true}
        username="TestUser"
      />
    );
    expect(screen.getByText('Hello world')).toBeInTheDocument();
    expect(screen.queryByText('TestUser')).not.toBeInTheDocument();
  });

  it('renders other user message with author name', () => {
    render(
      <ChatMessage
        message={baseMessage}
        isOwn={false}
        isLeader={false}
        isGameActive={true}
        username="AnotherUser"
      />
    );
    expect(screen.getByText('Hello world')).toBeInTheDocument();
    expect(screen.getByText('TestUser')).toBeInTheDocument();
  });

  it('shows leader badge for leader message', () => {
    render(
      <ChatMessage
        message={baseMessage}
        isOwn={false}
        isLeader={true}
        isGameActive={true}
        username="Player"
      />
    );
    expect(screen.getByText('TestUser')).toBeInTheDocument();
    expect(screen.getByText('👑')).toBeInTheDocument();
  });

  it('does not show leader badge when game is not active', () => {
    render(
      <ChatMessage
        message={baseMessage}
        isOwn={false}
        isLeader={true}
        isGameActive={false}
        username="Player"
      />
    );
    expect(screen.getByText('TestUser')).toBeInTheDocument();
    expect(screen.queryByText('👑')).not.toBeInTheDocument();
  });

  it('shows guess badge for guess messages', () => {
    const guessMessage = { ...baseMessage, isGuess: true };
    render(
      <ChatMessage
        message={guessMessage}
        isOwn={false}
        isLeader={false}
        isGameActive={true}
        username="Player"
      />
    );
    expect(screen.getByText('🔍 Попытка угадать')).toBeInTheDocument();
  });

  it('renders system message differently', () => {
    const systemMessage = {
      ...baseMessage,
      userId: 'system',
      userName: 'Система',
      text: 'User joined the room',
    };
    render(
      <ChatMessage
        message={systemMessage}
        isOwn={false}
        isLeader={false}
        isGameActive={true}
        username="Player"
      />
    );
    expect(screen.getByText('User joined the room')).toBeInTheDocument();
    expect(screen.getByText('ℹ️')).toBeInTheDocument();
    expect(screen.queryByTestId('message-author')).not.toBeInTheDocument();
  });

  it('formats timestamp correctly', () => {
    const fixedDate = new Date(2024, 0, 1, 14, 30);
    const messageWithFixedTime = {
      ...baseMessage,
      timestamp: fixedDate.toISOString(),
    };
    render(
      <ChatMessage
        message={messageWithFixedTime}
        isOwn={false}
        isLeader={false}
        isGameActive={true}
        username="Player"
      />
    );
    expect(screen.getByText(/14:30/)).toBeInTheDocument();
  });
});