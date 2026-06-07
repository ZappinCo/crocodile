import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { About } from './About';

describe('About component', () => {
  it('renders without crashing', () => {
    render(<About />);
    expect(screen.getByText('Крокодил')).toBeInTheDocument();
  });

  it('displays the game rules section', () => {
    render(<About />);
    expect(screen.getByText('🎮 Как играть?')).toBeInTheDocument();
    expect(screen.getByText('Стань ведущим')).toBeInTheDocument();
    expect(screen.getByText('Рисуй')).toBeInTheDocument();
    expect(screen.getByText('Угадывай')).toBeInTheDocument();
  });

  it('displays features section', () => {
    render(<About />);
    expect(screen.getByText('✨ Особенности игры')).toBeInTheDocument();
    expect(screen.getByText('Режим рисования')).toBeInTheDocument();
    expect(screen.getByText('Чат реального времени')).toBeInTheDocument();
    expect(screen.getByText('Мультиплеер')).toBeInTheDocument();
  });

  it('displays how to create a room section', () => {
    render(<About />);
    expect(screen.getByText('🎯 Как создать свою комнату?')).toBeInTheDocument();
    expect(screen.getByText('Нажми «Создать комнату»')).toBeInTheDocument();
    expect(screen.getByText('Настрой параметры')).toBeInTheDocument();
    expect(screen.getByText('Пригласи друзей')).toBeInTheDocument();
  });

  it('displays tips for the host', () => {
    render(<About />);
    expect(screen.getByText('🎨 Советы для ведущего')).toBeInTheDocument();
    expect(screen.getByText('Не пиши буквы и цифры — только рисунки!')).toBeInTheDocument();
    expect(screen.getByText('Старайся рисовать основные детали, не отвлекайся на мелочи.')).toBeInTheDocument();
  });

  it('displays tips for players', () => {
    render(<About />);
    expect(screen.getByText('💡 Советы для игроков')).toBeInTheDocument();
    expect(screen.getByText('Смотри внимательно на детали рисунка — они могут быть ключом к разгадке.')).toBeInTheDocument();
  });

  it('displays technologies section', () => {
    render(<About />);
    expect(screen.getByText('🛠️ Технологии')).toBeInTheDocument();
    expect(screen.getByText('React 18')).toBeInTheDocument();
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
    expect(screen.getByText('Redux Toolkit')).toBeInTheDocument();
  });
});