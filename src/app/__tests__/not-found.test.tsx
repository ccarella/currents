import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import NotFound from '../not-found';

describe('NotFound', () => {
  it('renders 404 heading', () => {
    render(<NotFound />);
    const heading = screen.getByText('404');
    expect(heading).toBeInTheDocument();
  });

  it('renders page not found message', () => {
    render(<NotFound />);
    const message = screen.getByText('Page not found');
    expect(message).toBeInTheDocument();
  });

  it('renders descriptive text', () => {
    render(<NotFound />);
    const description = screen.getByText(
      /This page has drifted away like a passing thought/
    );
    expect(description).toBeInTheDocument();
  });

  it('renders navigation buttons', () => {
    render(<NotFound />);
    const homeButton = screen.getByRole('button', { name: 'Return Home' });
    const writeButton = screen.getByRole('button', { name: 'Share a Thought' });

    expect(homeButton).toBeInTheDocument();
    expect(writeButton).toBeInTheDocument();
  });

  it('has correct link destinations', () => {
    render(<NotFound />);
    const homeLink = screen.getByRole('link', { name: /Return Home/i });
    const writeLink = screen.getByRole('link', { name: /Share a Thought/i });

    expect(homeLink).toHaveAttribute('href', '/');
    expect(writeLink).toHaveAttribute('href', '/write');
  });
});
