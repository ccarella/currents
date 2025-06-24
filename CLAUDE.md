# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

Build and run the development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Run production server:

```bash
npm run start
```

Lint code:

```bash
npm run lint
```

Run tests:

```bash
npm test
```

Run all tests including E2E:

```bash
npm run test:run
```

## Architecture Overview

This is a Next.js 15.3.4 application using the App Router pattern with TypeScript and Tailwind CSS v4.

### Technology Stack

- **Framework**: Next.js 15.3.4 with Turbopack
- **UI Library**: React 19.0.0
- **Language**: TypeScript 5+
- **Styling**: Tailwind CSS v4
- **Font**: Geist font family
- **Testing**: Vitest for unit and integration tests
- **Code Quality**: ESLint with custom rules, Prettier for formatting
- **Pre-commit Hooks**: Husky and lint-staged

### Project Structure

- `/src/app/` - Next.js App Router pages and layouts
  - `layout.tsx` - Root layout with HTML structure and metadata
  - `page.tsx` - Home page component
  - `globals.css` - Global styles and Tailwind directives
- `/public/` - Static assets (SVG icons, images)
- Configuration files in root directory

### Key Architectural Patterns

- **App Router**: Pages are defined in the `/src/app` directory using file-based routing
- **Server Components**: Components are server-rendered by default unless marked with "use client"
- **CSS Architecture**: Tailwind CSS with utility-first approach, configured via PostCSS

### Development Notes

- The development server uses Turbopack for faster builds (`--turbopack` flag)
- Vitest is configured for testing with React Testing Library
- ESLint is configured with:
  - Next.js recommended rules
  - TypeScript strict typing (no-explicit-any enforced)
  - Accessibility rules (jsx-a11y)
  - Security and performance rules
  - Prettier integration for consistent formatting
- Pre-commit hooks automatically run linting and formatting via husky
- TypeScript strict mode is enabled in tsconfig.json
