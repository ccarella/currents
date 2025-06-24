import { describe, it, expect, beforeAll } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('CSS Variables Validation', () => {
  let cssContent: string

  beforeAll(() => {
    // Read the actual CSS file
    const cssPath = path.resolve(__dirname, '../app/globals.css')
    cssContent = fs.readFileSync(cssPath, 'utf-8')
  })

  describe('Color Variables', () => {
    it('should define all primary color shades', () => {
      const primaryShades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900]
      
      primaryShades.forEach(shade => {
        expect(cssContent).toContain(`--color-primary-${shade}:`)
      })

      // Verify specific values
      expect(cssContent).toMatch(/--color-primary-500:\s*#0ea5e9;/)
      expect(cssContent).toMatch(/--color-primary-100:\s*#e0f2fe;/)
      expect(cssContent).toMatch(/--color-primary-900:\s*#0c4a6e;/)
    })

    it('should define all gray color shades', () => {
      const grayShades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900]
      
      grayShades.forEach(shade => {
        expect(cssContent).toContain(`--color-gray-${shade}:`)
      })

      // Verify specific values
      expect(cssContent).toMatch(/--color-gray-500:\s*#6b7280;/)
      expect(cssContent).toMatch(/--color-gray-100:\s*#f3f4f6;/)
      expect(cssContent).toMatch(/--color-gray-900:\s*#111827;/)
    })

    it('should define theme colors for light mode', () => {
      expect(cssContent).toMatch(/--background:\s*#ffffff;/)
      expect(cssContent).toMatch(/--foreground:\s*#111827;/)
      expect(cssContent).toMatch(/--muted:\s*#f9fafb;/)
      expect(cssContent).toMatch(/--muted-foreground:\s*#6b7280;/)
      expect(cssContent).toMatch(/--accent:\s*#f3f4f6;/)
      expect(cssContent).toMatch(/--border:\s*#e5e7eb;/)
      expect(cssContent).toMatch(/--ring:\s*#0ea5e9;/)
    })
  })

  describe('Typography Variables', () => {
    it('should define font size scale with correct values', () => {
      const expectedFontSizes = {
        'xs': '0.75rem',
        'sm': '0.875rem',
        'base': '1.125rem', // 18px
        'lg': '1.25rem',
        'xl': '1.5rem',
        '2xl': '1.875rem',
        '3xl': '2.25rem',
        '4xl': '3rem'
      }

      Object.entries(expectedFontSizes).forEach(([size, value]) => {
        expect(cssContent).toMatch(new RegExp(`--font-size-${size}:\\s*${value.replace('.', '\\.')};`))
      })
    })

    it('should define line height scale', () => {
      const expectedLineHeights = {
        'tight': '1.25',
        'snug': '1.375',
        'normal': '1.5',
        'relaxed': '1.625',
        'loose': '1.75'
      }

      Object.entries(expectedLineHeights).forEach(([name, value]) => {
        expect(cssContent).toMatch(new RegExp(`--line-height-${name}:\\s*${value.replace('.', '\\.')};`))
      })
    })

    it('should configure base font size to 18px', () => {
      expect(cssContent).toContain('--font-size-base: 1.125rem; /* 18px */')
    })
  })

  describe('Font Family Configuration', () => {
    it('should import custom fonts from Google Fonts', () => {
      expect(cssContent).toContain("@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');")
      expect(cssContent).toContain("@import url('https://fonts.googleapis.com/css2?family=Spectral:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700&display=swap');")
      expect(cssContent).toContain("@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap');")
    })

    it('should define font family variables in @theme', () => {
      expect(cssContent).toMatch(/--font-sans:\s*'Inter',\s*var\(--font-geist-sans\),\s*system-ui,\s*sans-serif;/)
      expect(cssContent).toMatch(/--font-serif:\s*'Spectral',\s*Georgia,\s*serif;/)
      expect(cssContent).toMatch(/--font-mono:\s*'JetBrains Mono',\s*var\(--font-geist-mono\),\s*monospace;/)
    })
  })

  describe('Layout Variables', () => {
    it('should define max-width-content as 650px', () => {
      expect(cssContent).toMatch(/--max-width-content:\s*650px;/)
    })
  })

  describe('Dark Mode Configuration', () => {
    it('should define dark mode color overrides', () => {
      const darkModeSection = cssContent.match(/@media\s*\(prefers-color-scheme:\s*dark\)\s*{[\s\S]*?}/)?.[0] || ''
      
      expect(darkModeSection).toBeTruthy()
      expect(darkModeSection).toContain('--background: #0a0a0a;')
      expect(darkModeSection).toContain('--foreground: #ededed;')
      expect(darkModeSection).toContain('--muted: #1f2937;')
      expect(darkModeSection).toContain('--muted-foreground: #9ca3af;')
      expect(darkModeSection).toContain('--accent: #374151;')
      expect(darkModeSection).toContain('--border: #374151;')
      expect(darkModeSection).toContain('--ring: #38bdf8;')
    })
  })

  describe('Base Styles', () => {
    it('should set html font-size to 16px for rem calculations', () => {
      expect(cssContent).toMatch(/html\s*{\s*font-size:\s*16px;.*?}/s)
    })

    it('should apply correct body styles', () => {
      const bodySection = cssContent.match(/body\s*{[\s\S]*?}/)?.[0] || ''
      
      expect(bodySection).toContain('font-family: var(--font-serif);')
      expect(bodySection).toContain('font-size: var(--font-size-base);')
      expect(bodySection).toContain('line-height: var(--line-height-relaxed);')
      expect(bodySection).toContain('background: var(--background);')
      expect(bodySection).toContain('color: var(--foreground);')
    })

    it('should style headings with Inter font', () => {
      const headingSection = cssContent.match(/h1,\s*h2,\s*h3,\s*h4,\s*h5,\s*h6\s*{[\s\S]*?}/)?.[0] || ''
      
      expect(headingSection).toContain('font-family: var(--font-sans);')
      expect(headingSection).toContain('line-height: var(--line-height-tight);')
    })

    it('should define correct heading sizes', () => {
      expect(cssContent).toMatch(/h1\s*{[\s\S]*?font-size:\s*var\(--font-size-4xl\);[\s\S]*?}/)
      expect(cssContent).toMatch(/h2\s*{[\s\S]*?font-size:\s*var\(--font-size-3xl\);[\s\S]*?}/)
      expect(cssContent).toMatch(/h3\s*{[\s\S]*?font-size:\s*var\(--font-size-2xl\);[\s\S]*?}/)
      expect(cssContent).toMatch(/h4\s*{[\s\S]*?font-size:\s*var\(--font-size-xl\);[\s\S]*?}/)
      expect(cssContent).toMatch(/h5\s*{[\s\S]*?font-size:\s*var\(--font-size-lg\);[\s\S]*?}/)
      expect(cssContent).toMatch(/h6\s*{[\s\S]*?font-size:\s*var\(--font-size-base\);[\s\S]*?}/)
    })
  })

  describe('Utility Classes', () => {
    it('should define container class with max-width constraint', () => {
      const containerSection = cssContent.match(/\.container\s*{[\s\S]*?}/)?.[0] || ''
      
      expect(containerSection).toContain('max-width: var(--max-width-content);')
      expect(containerSection).toContain('margin-left: auto;')
      expect(containerSection).toContain('margin-right: auto;')
      expect(containerSection).toContain('padding-left: 1rem;')
      expect(containerSection).toContain('padding-right: 1rem;')
    })

    it('should define font family utility classes', () => {
      expect(cssContent).toMatch(/\.font-sans\s*{[\s\S]*?font-family:\s*var\(--font-sans\);[\s\S]*?}/)
      expect(cssContent).toMatch(/\.font-serif\s*{[\s\S]*?font-family:\s*var\(--font-serif\);[\s\S]*?}/)
      expect(cssContent).toMatch(/\.font-mono\s*{[\s\S]*?font-family:\s*var\(--font-mono\);[\s\S]*?}/)
    })

    it('should define text size utility classes', () => {
      const textSizes = ['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl']
      
      textSizes.forEach(size => {
        expect(cssContent).toMatch(new RegExp(`\\.text-${size}\\s*{[\\s\\S]*?font-size:\\s*var\\(--font-size-${size}\\);[\\s\\S]*?}`))
      })
    })

    it('should define line height utility classes', () => {
      const lineHeights = ['tight', 'snug', 'normal', 'relaxed', 'loose']
      
      lineHeights.forEach(height => {
        expect(cssContent).toMatch(new RegExp(`\\.leading-${height}\\s*{[\\s\\S]*?line-height:\\s*var\\(--line-height-${height}\\);[\\s\\S]*?}`))
      })
    })
  })
})