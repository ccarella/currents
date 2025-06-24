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

## Architecture Overview

This is a Next.js 15.3.4 application using the App Router pattern with TypeScript and Tailwind CSS v4.

### Technology Stack

- **Framework**: Next.js 15.3.4 with Turbopack
- **UI Library**: React 19.0.0
- **Language**: TypeScript 5+
- **Styling**: Tailwind CSS v4
- **Font**: Geist font family

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
- No testing framework is currently configured
- ESLint is configured with Next.js recommended rules
- TypeScript strict mode is enabled in tsconfig.json
