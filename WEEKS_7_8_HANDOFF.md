# Weeks 7–8 Handoff for Claude Code

## What's Been Implemented (Weeks 1–6)

### Week 1: Agent Foundation ✅
- Database schema with `agents`, `agent_configs`, `chat_sessions`, `chat_messages` tables
- API routes for full CRUD on agents
- AgentBuilder component with guided role templates
- AgentList with card-based design, role icons, and color coding

### Week 2: Chat Interface + LLM Routing ✅
- Chat sessions API (`/api/agents/[id]/chat/sessions`, `/api/agents/[id]/chat/sessions/[id]/messages`)
- LLM router (`src/lib/llm-router.ts`) with provider routing
- ChatWindow, ChatMessage, ChatInput components
- Message persistence and display

### Week 5: Advanced Agent Configuration ✅
- Enhanced AgentBuilder with skills, workflows, custom config, advanced LLM params
- Database schema extended with `temperature`, `maxTokens`, `topP`, `frequencyPenalty`, `presencePenalty`
- API endpoints handle all new fields
- AgentList displays advanced parameters

### Week 6: Polish & Dark Mode ✅
- Dark mode contrast improvements in `globals.css`
- CSS variables for semantic colors (success/warning/error/info)
- New utility classes: `.glass-surface`, `.card-hover`, `.agent-template-card`, `.page-enter`
- Custom scrollbar, focus ring, smooth transitions
- AgentBuilder redesigned with ClickUp-inspired role template cards
- AgentList redesigned with role icons, color badges, chat button, loading skeletons
- App sidebar component created with navigation links

## Weeks 7–8 Tasks for Claude Code

### Week 7: File Processing + Team Features

| Task | Description | Files |
|------|-------------|-------|
| **File preview polish** | Improve FilePreview component for dark mode, add drag-and-drop zone | `src/components/FilePreview.tsx`, `src/components/FileUploader.tsx` |
| **Chat file attachments** | Wire up file upload to attach files to messages (infrastructure exists in `chat-attachment-service.ts`) | `src/components/chat/ChatWindow.tsx`, `src/components/shared/file-upload.tsx` |
| **Natural language agent builder** | Enhance `NaturalLanguageAgentBuilder.tsx` to parse user text into agent config | `src/components/NaturalLanguageAgentBuilder.tsx` |
| **Agent sharing** | Add export/import agent config as JSON | New API route, AgentList action |
| **Toast notification system** | Global toast for success/error across all pages | New `src/components/shared/toast.tsx` |

### Week 8: Team Testing + Deployment Readiness

| Task | Description | Files |
|------|-------------|-------|
| **Sub-agent dispatch** | Create intent parser + sub-agent executor | `src/app/api/parse-agent-intent/route.ts`, `src/app/api/agents/[id]/execute/route.ts` |
| **Dashboard page** | Build dashboard with agent stats, recent activity, token usage | `src/app/dashboard/page.tsx`, `src/components/dashboard/` |
| **Jasper & Sensei deployment** | Ensure preset agents work end-to-end with chat | Test existing agents via UI |
| **Error boundaries** | Add error boundaries to key pages | Wrap pages with error boundary components |
| **Performance audit** | Check bundle size, lazy load routes, optimize assets | `next.config.ts`, dynamic imports |
| **Team onboarding docs** | Create user guide for non-coders | `docs/user-guide.md` |

## Design System Reference

```
All components must use CSS variables (never hardcoded colors):
  var(--bg-primary)     — main background
  var(--bg-secondary)   — sidebar, card backgrounds
  var(--bg-tertiary)    — elevated cards, modals
  var(--bg-elevated)    — dropdowns, tooltips
  var(--text-primary)   — headings, body text
  var(--text-secondary) — meta, descriptions
  var(--text-tertiary)  — muted, captions
  var(--border-color)   — subtle borders
  var(--border-color-secondary) — card borders
  var(--accent-color)   — buttons, links, active states
  var(--accent-light)   — hover backgrounds, badges
  var(--accent-glow)    — card hover shadows
  var(--success / --warning / --error / --info) — semantic states

Fonts:
  Headings: var(--font-space-grotesk), Space Grotesk, sans-serif
  Body:     var(--font-inter), Inter, sans-serif

Styling: inline style={{...}} props (no Tailwind utility classes)
Transitions: 150ms–200ms ease on hover/state changes
Borders: 1px solid var(--border-color-secondary), 8–12px radius
```

## Key Files to Reference

| File | Purpose |
|------|---------|
| `src/app/globals.css` | All CSS variables, animations, utility classes |
| `src/components/AgentBuilder.tsx` | Polished agent creation flow (Week 5+6) |
| `src/components/AgentList.tsx` | Agent dashboard with cards (Week 6) |
| `src/components/layout/app-sidebar.tsx` | Sidebar navigation (Week 6) |
| `src/lib/llm-router.ts` | LLM provider routing |
| `src/lib/schema.sql` | Database schema |
| `src/components/chat/ChatWindow.tsx` | Chat interface |
| `src/components/NaturalLanguageAgentBuilder.tsx` | Natural language agent creation |

## Notes
- The project uses Tailwind CSS v4 for base reset only — no utility classes in components
- CSS variables drive the entire design system (light + dark)
- All styling is inline via `style={{}}` props
- React 19 + Next.js 16 with App Router
- Database: better-sqlite3

---
Handoff created: 2026-05-15