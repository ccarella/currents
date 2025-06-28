import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { Button } from '../Button';

describe('Button', () => {
  describe('Touch Targets', () => {
    it('has proper minimum height for mobile touch targets', () => {
      const { container } = render(<Button size="sm">Small Button</Button>);
      const button = container.querySelector('button');

      expect(button).toHaveClass('min-h-[44px]');
    });

    it('applies correct size classes for small variant', () => {
      const { container } = render(<Button size="sm">Small Button</Button>);
      const button = container.querySelector('button');

      expect(button).toHaveClass('px-3', 'py-2', 'text-sm', 'min-h-[44px]');
    });

    it('applies correct size classes for medium variant', () => {
      const { container } = render(<Button size="md">Medium Button</Button>);
      const button = container.querySelector('button');

      expect(button).toHaveClass('px-4', 'py-2.5', 'text-base', 'min-h-[44px]');
    });

    it('applies correct size classes for large variant', () => {
      const { container } = render(<Button size="lg">Large Button</Button>);
      const button = container.querySelector('button');

      expect(button).toHaveClass('px-6', 'py-3', 'text-lg', 'min-h-[48px]');
    });

    it('applies responsive padding classes', () => {
      const { container } = render(<Button size="sm">Button</Button>);
      const button = container.querySelector('button');

      // Check for responsive classes
      expect(button).toHaveClass('md:py-1.5', 'md:min-h-0');
    });
  });

  describe('Variants', () => {
    it('applies primary variant classes', () => {
      const { container } = render(<Button variant="primary">Primary</Button>);
      const button = container.querySelector('button');

      expect(button).toHaveClass('bg-blue-600', 'text-white');
    });

    it('applies secondary variant classes', () => {
      const { container } = render(
        <Button variant="secondary">Secondary</Button>
      );
      const button = container.querySelector('button');

      expect(button).toHaveClass('bg-gray-200', 'text-gray-900');
    });

    it('applies danger variant classes', () => {
      const { container } = render(<Button variant="danger">Danger</Button>);
      const button = container.querySelector('button');

      expect(button).toHaveClass('bg-red-600', 'text-white');
    });
  });

  describe('Accessibility', () => {
    it('supports disabled state', () => {
      const { container } = render(<Button disabled>Disabled</Button>);
      const button = container.querySelector('button');

      expect(button).toBeDisabled();
      expect(button).toHaveClass(
        'disabled:pointer-events-none',
        'disabled:opacity-50'
      );
    });

    it('forwards ref correctly', () => {
      const ref = { current: null };
      render(<Button ref={ref}>Button</Button>);

      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });

    it('applies custom className', () => {
      const { container } = render(
        <Button className="custom-class">Button</Button>
      );
      const button = container.querySelector('button');

      expect(button).toHaveClass('custom-class');
    });
  });
});
