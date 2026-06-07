import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { UserMenu } from './UserMenu';

describe('UserMenu', () => {
  const mockOnEditProfile = vi.fn();
  const mockOnLogout = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    mockOnEditProfile.mockClear();
    mockOnLogout.mockClear();
    mockOnClose.mockClear();
  });

  it('renders menu items correctly', () => {
    render(
      <UserMenu
        onEditProfile={mockOnEditProfile}
        onLogout={mockOnLogout}
        onClose={mockOnClose}
      />
    );
    expect(screen.getByText('Сменить имя')).toBeInTheDocument();
    expect(screen.getByText('Выйти')).toBeInTheDocument();
  });

  it('calls onEditProfile when edit menu item is clicked', () => {
    render(
      <UserMenu
        onEditProfile={mockOnEditProfile}
        onLogout={mockOnLogout}
        onClose={mockOnClose}
      />
    );
    const editItem = screen.getByText('Сменить имя');
    fireEvent.click(editItem);
    expect(mockOnEditProfile).toHaveBeenCalledTimes(1);
  });

  it('calls onLogout when logout menu item is clicked', () => {
    render(
      <UserMenu
        onEditProfile={mockOnEditProfile}
        onLogout={mockOnLogout}
        onClose={mockOnClose}
      />
    );
    const logoutItem = screen.getByText('Выйти');
    fireEvent.click(logoutItem);
    expect(mockOnLogout).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when clicking outside the menu', () => {
    render(
      <div>
        <div data-testid="outside">Outside</div>
        <UserMenu
          onEditProfile={mockOnEditProfile}
          onLogout={mockOnLogout}
          onClose={mockOnClose}
        />
      </div>
    );
    fireEvent.mouseDown(document.body);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose when clicking inside the menu', () => {
    render(
      <UserMenu
        onEditProfile={mockOnEditProfile}
        onLogout={mockOnLogout}
        onClose={mockOnClose}
      />
    );
    const menuDiv = screen.getByText('Сменить имя').closest('.user-menu');
    fireEvent.mouseDown(menuDiv!);
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('cleans up event listener on unmount', () => {
    const { unmount } = render(
      <UserMenu
        onEditProfile={mockOnEditProfile}
        onLogout={mockOnLogout}
        onClose={mockOnClose}
      />
    );
    const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');
    unmount();
    expect(removeEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));
  });
});