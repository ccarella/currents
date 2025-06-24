import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import React from 'react'

// Mock CSS variables for testing
const mockCSSVariables = {
  '--color-primary-500': '#0ea5e9',
  '--color-gray-500': '#6b7280',
  '--font-size-base': '1.125rem',
  '--line-height-normal': '1.5',
  '--background': '#ffffff',
  '--foreground': '#111827',
  '--max-width-content': '650px',
  '--font-sans': "'Inter', system-ui, sans-serif",
  '--font-serif': "'Spectral', Georgia, serif",
  '--font-mono': "'JetBrains Mono', monospace"
}

describe('Design System Component Integration', () => {
  beforeEach(() => {
    // Inject CSS variables into document for testing
    Object.entries(mockCSSVariables).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value)
    })
  })

  afterEach(() => {
    // Clean up CSS variables
    Object.keys(mockCSSVariables).forEach(key => {
      document.documentElement.style.removeProperty(key)
    })
  })

  describe('Typography Components', () => {
    it('should render heading hierarchy correctly', () => {
      const { container } = render(
        <article>
          <h1>Main Title</h1>
          <h2>Section Title</h2>
          <h3>Subsection Title</h3>
          <p className="text-base">Body text with base size</p>
        </article>
      )

      const h1 = container.querySelector('h1')
      const h2 = container.querySelector('h2')
      const h3 = container.querySelector('h3')
      const paragraph = container.querySelector('p')

      expect(h1).toBeInTheDocument()
      expect(h2).toBeInTheDocument()
      expect(h3).toBeInTheDocument()
      expect(paragraph).toHaveClass('text-base')
    })

    it('should apply multiple utility classes correctly', () => {
      const { container } = render(
        <p className="font-mono text-sm leading-tight">
          Monospace small text with tight line height
        </p>
      )

      const element = container.querySelector('p')
      expect(element).toHaveClass('font-mono', 'text-sm', 'leading-tight')
    })

    it('should handle responsive typography classes', () => {
      render(
        <div>
          <h1 className="text-2xl md:text-3xl lg:text-4xl">Responsive Heading</h1>
          <p className="text-sm md:text-base lg:text-lg">Responsive Body</p>
        </div>
      )

      expect(screen.getByText('Responsive Heading')).toBeInTheDocument()
      expect(screen.getByText('Responsive Body')).toBeInTheDocument()
    })
  })

  describe('Color System Integration', () => {
    it('should apply theme colors via inline styles', () => {
      const { container } = render(
        <div>
          <div style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>
            Theme colored content
          </div>
          <div style={{ backgroundColor: 'var(--color-primary-500)' }}>
            Primary colored content
          </div>
        </div>
      )

      const themeDiv = container.firstChild?.firstChild as HTMLElement
      const primaryDiv = container.firstChild?.lastChild as HTMLElement

      expect(themeDiv).toHaveStyle({ 
        backgroundColor: 'var(--background)',
        color: 'var(--foreground)'
      })
      expect(primaryDiv).toHaveStyle({ 
        backgroundColor: 'var(--color-primary-500)'
      })
    })

    it('should handle color transitions for interactive elements', () => {
      const { container } = render(
        <button 
          style={{ 
            backgroundColor: 'var(--color-primary-500)',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-primary-600)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-primary-500)'
          }}
        >
          Hover me
        </button>
      )

      const button = container.querySelector('button')
      expect(button).toHaveStyle({ 
        backgroundColor: 'var(--color-primary-500)',
        transition: 'background-color 0.2s'
      })
    })
  })

  describe('Dark Mode Behavior', () => {
    let originalMatchMedia: typeof window.matchMedia

    beforeEach(() => {
      originalMatchMedia = window.matchMedia
    })

    afterEach(() => {
      window.matchMedia = originalMatchMedia
    })

    it('should detect and respond to dark mode preference', () => {
      const listeners: Array<(e: MediaQueryListEvent) => void> = []
      
      window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addEventListener: vi.fn((event: string, listener: (e: MediaQueryListEvent) => void) => {
          if (event === 'change') listeners.push(listener)
        }),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn()
      }))

      const Component = () => {
        const [isDark, setIsDark] = React.useState(false)

        React.useEffect(() => {
          const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
          setIsDark(mediaQuery.matches)

          const handler = (e: MediaQueryListEvent) => setIsDark(e.matches)
          mediaQuery.addEventListener('change', handler)

          return () => mediaQuery.removeEventListener('change', handler)
        }, [])

        return (
          <div style={{ 
            backgroundColor: isDark ? '#0a0a0a' : '#ffffff',
            color: isDark ? '#ededed' : '#111827'
          }}>
            {isDark ? 'Dark Mode' : 'Light Mode'}
          </div>
        )
      }

      const { rerender } = render(<Component />)

      expect(screen.getByText('Dark Mode')).toBeInTheDocument()

      // Simulate theme change
      window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: query === '(prefers-color-scheme: light)',
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn()
      }))

      // Trigger listener
      act(() => {
        listeners.forEach(listener => {
          listener({ matches: false } as MediaQueryListEvent)
        })
      })

      rerender(<Component />)
      expect(screen.getByText('Light Mode')).toBeInTheDocument()
    })
  })

  describe('Layout Constraints', () => {
    it('should apply container constraints', () => {
      const { container } = render(
        <div className="container">
          <article>
            <h1>Article Title</h1>
            <p>This content should be constrained to max-width</p>
          </article>
        </div>
      )

      const containerDiv = container.querySelector('.container')
      expect(containerDiv).toHaveClass('container')
      
      // Verify structure
      const article = containerDiv?.querySelector('article')
      expect(article).toBeInTheDocument()
      expect(article?.querySelector('h1')).toHaveTextContent('Article Title')
    })

    it('should handle nested containers properly', () => {
      const { container } = render(
        <div className="container">
          <section>
            <div className="container">
              <p>Nested container content</p>
            </div>
          </section>
        </div>
      )

      const containers = container.querySelectorAll('.container')
      expect(containers).toHaveLength(2)
    })
  })

  describe('CSS Variable Fallbacks', () => {
    it('should handle missing CSS variables gracefully', () => {
      // Remove a CSS variable
      document.documentElement.style.removeProperty('--color-primary-500')

      const { container } = render(
        <div style={{ 
          backgroundColor: 'var(--color-primary-500, #0ea5e9)',
          color: 'var(--color-text, #111827)'
        }}>
          Content with fallbacks
        </div>
      )

      const element = container.firstChild as HTMLElement
      expect(element).toHaveStyle({ 
        backgroundColor: 'var(--color-primary-500, #0ea5e9)',
        color: 'var(--color-text, #111827)'
      })
    })
  })
})