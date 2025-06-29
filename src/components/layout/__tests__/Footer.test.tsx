import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import Footer from '../Footer';

describe('Footer', () => {
  it('renders all footer sections', () => {
    render(<Footer />);

    // Brand section
    expect(screen.getByText('Currents')).toBeInTheDocument();
    expect(
      screen.getByText(/A clean, typography-focused platform/)
    ).toBeInTheDocument();

    // Platform links
    expect(screen.getByText('Platform')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Write' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Dashboard' })).toBeInTheDocument();

    // Resources links
    expect(screen.getByText('Resources')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'About' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Privacy' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Terms' })).toBeInTheDocument();

    // Connect links
    expect(screen.getByText('Connect')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'X.com' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'GitHub' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Contact' })).toBeInTheDocument();
  });

  it('displays current year in copyright', () => {
    render(<Footer />);

    const currentYear = new Date().getFullYear();
    expect(
      screen.getByText(`© ${currentYear} Currents. All rights reserved.`)
    ).toBeInTheDocument();
  });

  it('has correct link hrefs', () => {
    render(<Footer />);

    // Internal links
    expect(screen.getByRole('link', { name: 'Write' })).toHaveAttribute(
      'href',
      '/write'
    );
    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute(
      'href',
      '/dashboard'
    );
    expect(screen.getByRole('link', { name: 'About' })).toHaveAttribute(
      'href',
      '/about'
    );
    expect(screen.getByRole('link', { name: 'Privacy' })).toHaveAttribute(
      'href',
      '/privacy'
    );
    expect(screen.getByRole('link', { name: 'Terms' })).toHaveAttribute(
      'href',
      '/terms'
    );
    expect(screen.getByRole('link', { name: 'Contact' })).toHaveAttribute(
      'href',
      '/contact'
    );
    expect(screen.getByRole('link', { name: 'X.com' })).toHaveAttribute(
      'href',
      'https://x.com/ccarella'
    );
    expect(screen.getByRole('link', { name: 'GitHub' })).toHaveAttribute(
      'href',
      'https://github.com/ccarella/currents'
    );
  });

  it('external links have proper attributes', () => {
    render(<Footer />);

    const xLink = screen.getByRole('link', { name: 'X.com' });
    const githubLink = screen.getByRole('link', { name: 'GitHub' });

    // Check external link attributes
    expect(xLink).toHaveAttribute('target', '_blank');
    expect(xLink).toHaveAttribute('rel', 'noopener noreferrer');
    expect(githubLink).toHaveAttribute('target', '_blank');
    expect(githubLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('has proper semantic structure', () => {
    const { container } = render(<Footer />);

    const footer = container.querySelector('footer');
    expect(footer).toBeInTheDocument();

    // Check that navigation sections exist
    const navElements = container.querySelectorAll('nav');
    expect(navElements.length).toBeGreaterThan(0);
  });

  it('renders with responsive grid layout', () => {
    const { container } = render(<Footer />);

    const grid = container.querySelector('.grid');
    expect(grid).toHaveClass('gap-8', 'md:grid-cols-4');
  });
});
