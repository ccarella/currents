import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import React from 'react'

// Component that uses design system classes
const DesignSystemShowcase = () => {
  return (
    <div className="container">
      <article>
        <h1 className="font-sans text-4xl leading-tight">Design System Test</h1>
        <h2 className="font-sans text-2xl">Typography Scale</h2>
        
        <section>
          <h3 className="font-sans text-xl">Font Families</h3>
          <p className="font-serif text-base leading-relaxed">
            This paragraph uses Spectral (serif) font with base size and relaxed line height.
          </p>
          <code className="font-mono text-sm">
            const example = &quot;JetBrains Mono for code&quot;;
          </code>
        </section>

        <section>
          <h3 className="font-sans text-xl">Text Sizes</h3>
          <div>
            <span className="text-xs">Extra Small (0.75rem)</span><br />
            <span className="text-sm">Small (0.875rem)</span><br />
            <span className="text-base">Base (1.125rem)</span><br />
            <span className="text-lg">Large (1.25rem)</span><br />
            <span className="text-xl">Extra Large (1.5rem)</span>
          </div>
        </section>

        <section>
          <h3 className="font-sans text-xl">Line Heights</h3>
          <p className="leading-tight">Tight line height (1.25)</p>
          <p className="leading-snug">Snug line height (1.375)</p>
          <p className="leading-normal">Normal line height (1.5)</p>
          <p className="leading-relaxed">Relaxed line height (1.625)</p>
          <p className="leading-loose">Loose line height (1.75)</p>
        </section>

        <section>
          <h3 className="font-sans text-xl">Color System</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem' }}>
            {[100, 300, 500, 700, 900].map(shade => (
              <div
                key={shade}
                style={{
                  backgroundColor: `var(--color-primary-${shade})`,
                  padding: '1rem',
                  borderRadius: '0.25rem',
                  color: shade >= 500 ? 'white' : 'black',
                  textAlign: 'center'
                }}
              >
                {shade}
              </div>
            ))}
          </div>
        </section>
      </article>
    </div>
  )
}

describe('Design System Integration', () => {
  it('should render complete design system showcase', () => {
    const { container } = render(<DesignSystemShowcase />)
    
    // Verify container
    expect(container.querySelector('.container')).toBeInTheDocument()
    
    // Verify headings with correct classes
    const h1 = container.querySelector('h1')
    expect(h1).toHaveClass('font-sans', 'text-4xl', 'leading-tight')
    expect(h1).toHaveTextContent('Design System Test')
    
    // Verify font family applications
    expect(container.querySelector('.font-serif')).toBeInTheDocument()
    expect(container.querySelector('.font-mono')).toBeInTheDocument()
    
    // Verify text sizes
    const textSizes = ['text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl']
    textSizes.forEach(size => {
      expect(container.querySelector(`.${size}`)).toBeInTheDocument()
    })
    
    // Verify line heights
    const lineHeights = ['leading-tight', 'leading-snug', 'leading-normal', 'leading-relaxed', 'leading-loose']
    lineHeights.forEach(height => {
      expect(container.querySelector(`.${height}`)).toBeInTheDocument()
    })
  })

  it('should handle complex class combinations', () => {
    const { container } = render(
      <div>
        <p className="font-serif text-lg leading-relaxed">
          Large serif text with relaxed spacing
        </p>
        <h2 className="font-sans text-3xl leading-tight">
          Large sans heading with tight spacing
        </h2>
        <code className="font-mono text-sm leading-normal">
          Small monospace code with normal spacing
        </code>
      </div>
    )
    
    const paragraph = container.querySelector('p')
    const heading = container.querySelector('h2')
    const code = container.querySelector('code')
    
    expect(paragraph).toHaveClass('font-serif', 'text-lg', 'leading-relaxed')
    expect(heading).toHaveClass('font-sans', 'text-3xl', 'leading-tight')
    expect(code).toHaveClass('font-mono', 'text-sm', 'leading-normal')
  })

  it('should support CSS variable usage in inline styles', () => {
    const { container } = render(
      <div>
        <div style={{ backgroundColor: 'var(--color-primary-500)', padding: '1rem' }}>
          Primary background
        </div>
        <div style={{ color: 'var(--color-gray-700)', fontSize: 'var(--font-size-lg)' }}>
          Gray text with large size
        </div>
        <div style={{ maxWidth: 'var(--max-width-content)', margin: '0 auto' }}>
          Content width constrained
        </div>
      </div>
    )
    
    const primaryDiv = container.firstChild?.firstChild as HTMLElement
    const grayDiv = container.firstChild?.childNodes[1] as HTMLElement
    const constrainedDiv = container.firstChild?.lastChild as HTMLElement
    
    expect(primaryDiv).toHaveStyle({ 
      backgroundColor: 'var(--color-primary-500)',
      padding: '1rem'
    })
    expect(grayDiv).toHaveStyle({ 
      color: 'var(--color-gray-700)',
      fontSize: 'var(--font-size-lg)'
    })
    expect(constrainedDiv).toHaveStyle({ 
      maxWidth: 'var(--max-width-content)',
      margin: '0 auto'
    })
  })

  it('should maintain proper heading hierarchy', () => {
    const { container } = render(
      <article>
        <h1>Page Title</h1>
        <section>
          <h2>Section Title</h2>
          <h3>Subsection Title</h3>
          <h4>Detail Title</h4>
          <h5>Minor Title</h5>
          <h6>Smallest Title</h6>
        </section>
      </article>
    )
    
    const headings = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']
    headings.forEach(tag => {
      expect(container.querySelector(tag)).toBeInTheDocument()
    })
  })

  it('should support theme-aware components', () => {
    const ThemeAwareComponent = () => {
      return (
        <div style={{ 
          backgroundColor: 'var(--background)',
          color: 'var(--foreground)',
          borderColor: 'var(--border)'
        }}>
          <div style={{ backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)' }}>
            Muted content
          </div>
          <div style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-foreground)' }}>
            Accent content
          </div>
        </div>
      )
    }
    
    const { container } = render(<ThemeAwareComponent />)
    
    const mainDiv = container.firstChild as HTMLElement
    const mutedDiv = mainDiv.firstChild as HTMLElement
    const accentDiv = mainDiv.lastChild as HTMLElement
    
    expect(mainDiv).toHaveStyle({
      color: 'var(--foreground)'
    })
    // Check individual style properties
    expect(mainDiv.style.backgroundColor).toBe('var(--background)')
    expect(mainDiv.style.borderColor).toBe('var(--border)')
    expect(mutedDiv).toHaveStyle({
      backgroundColor: 'var(--muted)',
      color: 'var(--muted-foreground)'
    })
    expect(accentDiv).toHaveStyle({
      backgroundColor: 'var(--accent)',
      color: 'var(--accent-foreground)'
    })
  })
})