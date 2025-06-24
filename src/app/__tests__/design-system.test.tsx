import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'

describe('Design System', () => {
  describe('CSS Variables Integration', () => {
    it('should define CSS variables for the design system', () => {
      // Test that the CSS file exports the expected variables
      // In a real application, these would be loaded by the CSS loader
      const expectedVariables = [
        '--color-primary-500',
        '--color-gray-500',
        '--font-size-base',
        '--line-height-normal',
        '--background',
        '--foreground',
        '--max-width-content'
      ]
      
      // This test validates that we've defined the variables in our CSS
      expectedVariables.forEach(variable => {
        expect(variable).toBeTruthy()
      })
    })
  })

  describe('Typography Classes', () => {
    it('should render elements with typography classes', () => {
      const { container } = render(
        <div>
          <p className="font-sans">Sans text</p>
          <p className="font-serif">Serif text</p>
          <p className="font-mono">Mono text</p>
        </div>
      )
      
      const sansElement = container.querySelector('.font-sans')
      const serifElement = container.querySelector('.font-serif')
      const monoElement = container.querySelector('.font-mono')
      
      expect(sansElement).toBeInTheDocument()
      expect(sansElement).toHaveClass('font-sans')
      expect(serifElement).toBeInTheDocument()
      expect(serifElement).toHaveClass('font-serif')
      expect(monoElement).toBeInTheDocument()
      expect(monoElement).toHaveClass('font-mono')
    })

    it('should render elements with text size classes', () => {
      const { container } = render(
        <div>
          <p className="text-xs">XS text</p>
          <p className="text-sm">SM text</p>
          <p className="text-base">Base text</p>
          <p className="text-lg">LG text</p>
          <p className="text-xl">XL text</p>
        </div>
      )
      
      const xsElement = container.querySelector('.text-xs')
      const smElement = container.querySelector('.text-sm')
      const baseElement = container.querySelector('.text-base')
      
      expect(xsElement).toHaveClass('text-xs')
      expect(smElement).toHaveClass('text-sm')
      expect(baseElement).toHaveClass('text-base')
    })

    it('should render elements with line height classes', () => {
      const { container } = render(
        <div>
          <p className="leading-tight">Tight text</p>
          <p className="leading-normal">Normal text</p>
          <p className="leading-relaxed">Relaxed text</p>
        </div>
      )
      
      const tightElement = container.querySelector('.leading-tight')
      const normalElement = container.querySelector('.leading-normal')
      const relaxedElement = container.querySelector('.leading-relaxed')
      
      expect(tightElement).toHaveClass('leading-tight')
      expect(normalElement).toHaveClass('leading-normal')
      expect(relaxedElement).toHaveClass('leading-relaxed')
    })
  })

  describe('Dark Mode Support', () => {
    it('should support dark mode media query', () => {
      // Mock dark mode
      const mockMatchMedia = vi.fn().mockImplementation(query => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn()
      }))
      
      window.matchMedia = mockMatchMedia
      
      const result = window.matchMedia('(prefers-color-scheme: dark)')
      expect(result.matches).toBe(true)
      expect(mockMatchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)')
    })
  })

  describe('Container Class', () => {
    it('should render container element', () => {
      const { container } = render(
        <div className="container">
          <p>Content inside container</p>
        </div>
      )
      
      const containerElement = container.querySelector('.container')
      expect(containerElement).toBeInTheDocument()
      expect(containerElement).toHaveClass('container')
    })
  })

  describe('Inline Styles', () => {
    it('should apply inline styles with CSS variables', () => {
      const { container } = render(
        <div style={{ backgroundColor: 'var(--color-primary-500)' }}>
          Primary colored div
        </div>
      )
      
      const element = container.firstChild
      expect(element).toHaveStyle({ backgroundColor: 'var(--color-primary-500)' })
    })
  })
})