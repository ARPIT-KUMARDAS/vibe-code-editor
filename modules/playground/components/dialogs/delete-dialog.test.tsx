/* @vitest-environment jsdom */
/**
 * Test runner: Vitest
 * Testing library: React Testing Library (+ @testing-library/jest-dom)
 *
 * These tests focus on the DeleteDialog component's public interface and behaviors:
 * - Rendering with defaults and custom props
 * - Placeholder replacement in description
 * - User interactions (confirm, backdrop/close)
 * - Edge cases (undefined/null/long/special item names, multiple placeholders)
 * - Accessibility basics
 * - Stability across re-renders and unmounts
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import '@testing-library/jest-dom'

// Provide virtual mocks for aliased modules so tests don't depend on path alias resolution.
/* eslint-disable @typescript-eslint/no-explicit-any */
vi.mock('@/components/ui/alert-dialog', () => ({
  AlertDialog: ({ children, open, onOpenChange }: any) => (
    <div data-testid="alert-dialog" data-open={open}>
      {children}
      {open && (
        <button
          data-testid="dialog-backdrop"
          onClick={() => onOpenChange(false)}
          aria-label="Close dialog"
        />
      )}
    </div>
  ),
  AlertDialogContent: ({ children }: any) => (
    <div data-testid="alert-dialog-content">{children}</div>
  ),
  AlertDialogHeader: ({ children }: any) => (
    <div data-testid="alert-dialog-header">{children}</div>
  ),
  AlertDialogTitle: ({ children }: any) => (
    <h2 data-testid="alert-dialog-title">{children}</h2>
  ),
  AlertDialogDescription: ({ children }: any) => (
    <p data-testid="alert-dialog-description">{children}</p>
  ),
  AlertDialogFooter: ({ children }: any) => (
    <div data-testid="alert-dialog-footer">{children}</div>
  ),
  // Cancel button has no intrinsic behavior in the component;
  // behavior is driven by the parent AlertDialog's onOpenChange.
  AlertDialogCancel: ({ children, onClick }: any) => (
    <button data-testid="cancel-button" onClick={onClick}>
      {children}
    </button>
  ),
  AlertDialogAction: ({ children, onClick, className }: any) => (
    <button
      data-testid="confirm-button"
      onClick={onClick}
      className={className}
    >
      {children}
    </button>
  ),
}), { virtual: true })

vi.mock('@/lib/utils', () => ({
  cn: (...classes: string[]) => classes.filter(Boolean).join(' '),
}), { virtual: true })
/* eslint-enable @typescript-eslint/no-explicit-any */

// Import component AFTER mocks so they take effect.
import { DeleteDialog } from './delete-dialog'

describe('DeleteDialog', () => {
  const mockSetIsOpen = vi.fn()
  const mockOnConfirm = vi.fn()

  const defaultProps = {
    isOpen: true,
    setIsOpen: mockSetIsOpen,
    onConfirm: mockOnConfirm,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders the dialog when isOpen is true', () => {
      render(<DeleteDialog {...defaultProps} />)
      expect(screen.getByTestId('alert-dialog')).toBeInTheDocument()
      expect(screen.getByTestId('alert-dialog')).toHaveAttribute('data-open', 'true')
    })

    it('renders default title, description, and buttons', () => {
      render(<DeleteDialog {...defaultProps} />)
      expect(screen.getByTestId('alert-dialog-title')).toHaveTextContent('Delete Item')
      expect(screen.getByTestId('alert-dialog-description')).toHaveTextContent(
        'Are you sure you want to delete this item? This action cannot be undone.'
      )
      expect(screen.getByTestId('cancel-button')).toHaveTextContent('Cancel')
      expect(screen.getByTestId('confirm-button')).toHaveTextContent('Delete')
    })

    it('renders custom title', () => {
      render(<DeleteDialog {...defaultProps} title="Remove User" />)
      expect(screen.getByTestId('alert-dialog-title')).toHaveTextContent('Remove User')
    })

    it('renders custom description', () => {
      render(
        <DeleteDialog
          {...defaultProps}
          description="This will permanently remove the user from the system."
        />
      )
      expect(screen.getByTestId('alert-dialog-description')).toHaveTextContent(
        'This will permanently remove the user from the system.'
      )
    })

    it('renders custom button labels', () => {
      render(
        <DeleteDialog
          {...defaultProps}
          confirmLabel="Remove"
          cancelLabel="Keep"
        />
      )
      expect(screen.getByTestId('cancel-button')).toHaveTextContent('Keep')
      expect(screen.getByTestId('confirm-button')).toHaveTextContent('Remove')
    })

    it('replaces {item} with itemName in description', () => {
      render(
        <DeleteDialog
          {...defaultProps}
          description="Are you sure you want to delete {item}?"
          itemName="Project Alpha"
        />
      )
      expect(screen.getByTestId('alert-dialog-description'))
        .toHaveTextContent('Are you sure you want to delete "Project Alpha"?')
    })

    it('handles description without {item} placeholder', () => {
      render(
        <DeleteDialog
          {...defaultProps}
          description="This action is permanent."
          itemName="Test Item"
        />
      )
      expect(screen.getByTestId('alert-dialog-description'))
        .toHaveTextContent('This action is permanent.')
    })

    it('does not open when isOpen is false', () => {
      render(<DeleteDialog {...defaultProps} isOpen={false} />)
      expect(screen.getByTestId('alert-dialog')).toHaveAttribute('data-open', 'false')
    })

    it('applies destructive styling classes to confirm button', () => {
      render(<DeleteDialog {...defaultProps} />)
      const confirmButton = screen.getByTestId('confirm-button')
      expect(confirmButton).toHaveClass(
        'bg-destructive',
        'text-destructive-foreground',
        'hover:bg-destructive/90'
      )
    })
  })

  describe('User Interactions', () => {
    it('calls onConfirm when confirm button is clicked', () => {
      render(<DeleteDialog {...defaultProps} />)
      fireEvent.click(screen.getByTestId('confirm-button'))
      expect(mockOnConfirm).toHaveBeenCalledTimes(1)
    })

    it('Cancel button does not call onConfirm', () => {
      render(<DeleteDialog {...defaultProps} />)
      fireEvent.click(screen.getByTestId('cancel-button'))
      expect(mockOnConfirm).not.toHaveBeenCalled()
    })

    it('calls setIsOpen(false) when backdrop is clicked', () => {
      render(<DeleteDialog {...defaultProps} />)
      fireEvent.click(screen.getByTestId('dialog-backdrop'))
      expect(mockSetIsOpen).toHaveBeenCalledWith(false)
      expect(mockSetIsOpen).toHaveBeenCalledTimes(1)
    })

    it('handles rapid clicks on confirm button (idempotence of handler call site)', () => {
      render(<DeleteDialog {...defaultProps} />)
      const confirmButton = screen.getByTestId('confirm-button')
      fireEvent.click(confirmButton)
      fireEvent.click(confirmButton)
      fireEvent.click(confirmButton)
      expect(mockOnConfirm).toHaveBeenCalledTimes(3)
    })

    it('maintains isOpen state across re-renders when prop changes', () => {
      const { rerender } = render(<DeleteDialog {...defaultProps} />)
      expect(screen.getByTestId('alert-dialog')).toHaveAttribute('data-open', 'true')

      rerender(<DeleteDialog {...defaultProps} isOpen={false} />)
      expect(screen.getByTestId('alert-dialog')).toHaveAttribute('data-open', 'false')

      rerender(<DeleteDialog {...defaultProps} isOpen />)
      expect(screen.getByTestId('alert-dialog')).toHaveAttribute('data-open', 'true')
    })
  })

  describe('Edge Cases', () => {
    it('handles undefined itemName gracefully when placeholder is present', () => {
      render(
        <DeleteDialog
          {...defaultProps}
          description="Delete {item}?"
          itemName={undefined}
        />
      )
      expect(screen.getByTestId('alert-dialog-description')).toHaveTextContent('Delete "undefined"?')
    })

    it('handles empty string itemName', () => {
      render(
        <DeleteDialog
          {...defaultProps}
          description="Delete {item}?"
          itemName=""
        />
      )
      expect(screen.getByTestId('alert-dialog-description')).toHaveTextContent('Delete ""?')
    })

    it('handles special characters in itemName', () => {
      const specialName = '<script>alert("XSS")</script>'
      render(
        <DeleteDialog
          {...defaultProps}
          description="Delete {item}?"
          itemName={specialName}
        />
      )
      expect(screen.getByTestId('alert-dialog-description'))
        .toHaveTextContent(`Delete "${specialName}"?`)
    })

    it('handles very long itemName', () => {
      const longName = 'A'.repeat(1000)
      render(
        <DeleteDialog
          {...defaultProps}
          description="Delete {item}?"
          itemName={longName}
        />
      )
      expect(screen.getByTestId('alert-dialog-description'))
        .toHaveTextContent(`Delete "${longName}"?`)
    })

    it('replaces only first {item} occurrence (native String.replace behavior)', () => {
      render(
        <DeleteDialog
          {...defaultProps}
          description="{item} will be deleted. Are you sure about {item}?"
          itemName="File.txt"
        />
      )
      expect(screen.getByTestId('alert-dialog-description'))
        .toHaveTextContent('"File.txt" will be deleted. Are you sure about {item}?')
    })

    it('renders even when optional props are null', () => {
      render(
        <DeleteDialog
          {...defaultProps}
          title={null as any}
          description={null as any}
          confirmLabel={null as any}
          cancelLabel={null as any}
        />
      )
      expect(screen.getByTestId('alert-dialog')).toBeInTheDocument()
    })

    it('propagates error if onConfirm throws', () => {
      const errorOnConfirm = vi.fn(() => {
        throw new Error('Confirm error')
      })
      render(<DeleteDialog {...defaultProps} onConfirm={errorOnConfirm} />)
      expect(() => fireEvent.click(screen.getByTestId('confirm-button'))).toThrow('Confirm error')
    })

    it('propagates error if setIsOpen throws via backdrop', () => {
      const errorSetIsOpen = vi.fn(() => {
        throw new Error('SetIsOpen error')
      })
      render(<DeleteDialog {...defaultProps} setIsOpen={errorSetIsOpen} />)
      expect(() => fireEvent.click(screen.getByTestId('dialog-backdrop'))).toThrow('SetIsOpen error')
    })
  })

  describe('Props Validation', () => {
    it('works with all props provided', () => {
      render(
        <DeleteDialog
          isOpen
          setIsOpen={mockSetIsOpen}
          title="Custom Title"
          description="Delete {item} permanently?"
          itemName="Important Document"
          onConfirm={mockOnConfirm}
          confirmLabel="Yes, Delete"
          cancelLabel="No, Keep It"
        />
      )
      expect(screen.getByTestId('alert-dialog-title')).toHaveTextContent('Custom Title')
      expect(screen.getByTestId('alert-dialog-description'))
        .toHaveTextContent('Delete "Important Document" permanently?')
      expect(screen.getByTestId('cancel-button')).toHaveTextContent('No, Keep It')
      expect(screen.getByTestId('confirm-button')).toHaveTextContent('Yes, Delete')
    })

    it('works with only required props', () => {
      render(
        <DeleteDialog
          isOpen
          setIsOpen={mockSetIsOpen}
          onConfirm={mockOnConfirm}
        />
      )
      expect(screen.getByTestId('alert-dialog')).toBeInTheDocument()
      expect(screen.getByTestId('alert-dialog-title')).toHaveTextContent('Delete Item')
    })
  })

  describe('Accessibility', () => {
    it('exposes a close control with aria-label', () => {
      render(<DeleteDialog {...defaultProps} />)
      expect(screen.getByLabelText('Close dialog')).toBeInTheDocument()
    })

    it('buttons are visible (basic keyboard focusability proxy)', () => {
      render(<DeleteDialog {...defaultProps} />)
      expect(screen.getByTestId('cancel-button')).toBeVisible()
      expect(screen.getByTestId('confirm-button')).toBeVisible()
    })
  })

  describe('Stability & Lifecycle', () => {
    it('renders under React.StrictMode', () => {
      render(
        <React.StrictMode>
          <DeleteDialog {...defaultProps} />
        </React.StrictMode>
      )
      expect(screen.getByTestId('alert-dialog')).toBeInTheDocument()
    })

    it('unmounts cleanly while open', () => {
      const { unmount } = render(<DeleteDialog {...defaultProps} />)
      expect(screen.getByTestId('alert-dialog')).toBeInTheDocument()
      expect(() => unmount()).not.toThrow()
    })

    it('falls back to defaults when props change to undefined', () => {
      const { rerender } = render(
        <DeleteDialog
          {...defaultProps}
          title="Initial Title"
          description="Initial Description"
        />
      )
      rerender(
        <DeleteDialog
          {...defaultProps}
          title={undefined}
          description={undefined}
        />
      )
      expect(screen.getByTestId('alert-dialog-title')).toHaveTextContent('Delete Item')
      expect(screen.getByTestId('alert-dialog-description'))
        .toHaveTextContent('Are you sure you want to delete this item? This action cannot be undone.')
    })

    it('handles rapid prop changes without crashing', () => {
      const { rerender } = render(<DeleteDialog {...defaultProps} />)
      for (let i = 0; i < 50; i++) {
        rerender(
          <DeleteDialog
            {...defaultProps}
            isOpen={i % 2 === 0}
            title={`Title ${i}`}
          />
        )
      }
      expect(screen.getByTestId('alert-dialog')).toHaveAttribute('data-open', 'false')
      expect(screen.getByTestId('alert-dialog-title')).toHaveTextContent('Title 49')
    })
  })

  describe('Integration-like flows', () => {
    it('typical delete flow: open → confirm → close asynchronously', async () => {
      let isDialogOpen = false
      const handleSetOpen = (open: boolean) => {
        isDialogOpen = open
      }
      const handleConfirm = vi.fn(() => {
        return new Promise<void>((resolve) => {
          setTimeout(() => {
            isDialogOpen = false
            resolve()
          }, 50)
        })
      })

      const { rerender } = render(
        <DeleteDialog
          isOpen={isDialogOpen}
          setIsOpen={handleSetOpen}
          onConfirm={handleConfirm}
          itemName="User Account"
          description="Delete {item}? This cannot be undone."
        />
      )
      expect(screen.getByTestId('alert-dialog')).toHaveAttribute('data-open', 'false')

      // Open it
      isDialogOpen = true
      rerender(
        <DeleteDialog
          isOpen={isDialogOpen}
          setIsOpen={handleSetOpen}
          onConfirm={handleConfirm}
          itemName="User Account"
          description="Delete {item}? This cannot be undone."
        />
      )
      expect(screen.getByTestId('alert-dialog')).toHaveAttribute('data-open', 'true')

      // Confirm
      fireEvent.click(screen.getByTestId('confirm-button'))
      expect(handleConfirm).toHaveBeenCalledTimes(1)

      await waitFor(() => {
        expect(isDialogOpen).toBe(false)
      })
    })

    it('cancel via backdrop does not trigger onConfirm', () => {
      let isDialogOpen = true
      const handleSetOpen = vi.fn((open: boolean) => { isDialogOpen = open })
      render(
        <DeleteDialog
          isOpen={isDialogOpen}
          setIsOpen={handleSetOpen}
          onConfirm={mockOnConfirm}
        />
      )
      fireEvent.click(screen.getByTestId('dialog-backdrop'))
      expect(handleSetOpen).toHaveBeenCalledWith(false)
      expect(mockOnConfirm).not.toHaveBeenCalled()
    })
  })
})