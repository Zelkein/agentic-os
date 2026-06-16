# Claude Code Handoff — Weeks 7–8

## Current State (End of Week 6)

The Command Centre app now has:
- ✅ **Dark mode** with high contrast, semantic colors, smooth transitions
- ✅ **Guided agent creation** with 4 role templates (Orchestrator, Coach, Assistant, Specialist)
- ✅ **Agent dashboard** with role icons, color badges, chat links
- ✅ **Sidebar navigation** linking all 10 pages
- ✅ **Chat interface** with LLM routing and session persistence
- ✅ **CSS design system** using CSS variables (no hardcoded colors)
- ✅ **Polish**: loading skeletons, empty states, scrollbar styling, focus rings

## Week 7: File Processing + Team Features (~3 days)

### Priority 1 — Toast Notification System
Create `src/components/shared/toast.tsx`:
```tsx
// Global toast context + component
// Props: { type: 'success' | 'error' | 'warning' | 'info', message: string }
// Auto-dismiss after 4s
// Renders fixed bottom-right
// Expose via useToast() hook or context
```
Then add toasts to AgentBuilder (already has inline messages — convert to global), agent delete, chat message send failures.

### Priority 2 — File Attachments in Chat
Wire up existing `chat-attachment-service.ts` to the ChatWindow:
- Add file upload button to ChatInput
- Show attachment preview in ChatMessage
- Pass files to agent via `files_json` field
- Reference: `src/components/shared/file-upload.tsx`, `src/components/shared/chat-attachment-strip.tsx`

### Priority 3 — Natural Language Agent Builder Enhancement
Update `src/components/NaturalLanguageAgentBuilder.tsx`:
- Parse user text like "Make me a coach that reviews MEP calculations"
- Extract role, name, description from natural language
- Call LLM to generate system prompt
- Pre-fill AgentBuilder form with results

### Priority 4 — Agent Export/Import
- Add "Export JSON" button to AgentList card actions
- Add "Import Agent" button next to "New Agent"
- API route: `POST /api/agents/import`

## Week 8: Team Testing + Deployment (~3 days)

### Priority 1 — Dashboard Page
Create `src/app/dashboard/page.tsx`:
- Agent count, chat sessions count
- Recent activity feed
- Token usage summary
- System health status
- Use existing dashboard components in `src/components/dashboard/`

### Priority 2 — Sub-agent Dispatch
- Complete `src/app/api/parse-agent-intent/route.ts`
- Complete `src/app/api/agents/[id]/execute/route.ts`
- Test orchestrator → sub-agent delegation flow

### Priority 3 — Jasper & Sensei End-to-End Test
- Create both agents through the UI
- Start chat sessions with each
- Send messages and verify LLM responses
- Verify conversation history persists

### Priority 4 — Error Boundaries
Wrap key pages with error boundaries:
- `src/app/agents/error.tsx`
- `src/app/board/error.tsx`
- `src/app/dashboard/error.tsx`

## Quick Start

```bash
cd /c/agentic-os-v2/command-centre
npm run dev
# Open http://localhost:3000/agents
```

## Design Rules (Do Not Break)
- All colors via CSS variables: `var(--bg-*)`, `var(--text-*)`, `var(--border-*)`, `var(--accent-*)`
- Fonts: `var(--font-space-grotesk)` for headings, `var(--font-inter)` for body
- Styling: inline `style={{}}` — NO Tailwind utility classes
- Transitions: `150ms–200ms ease`
- Border radius: `8px–12px`
- All components must look correct in BOTH light and dark mode

## Files at a Glance

| File | Status | Notes |
|------|--------|-------|
| `globals.css` | ✅ Done | Design system, dark mode, animations |
| `AgentBuilder.tsx` | ✅ Done | Role templates, guided flow, dark mode |
| `AgentList.tsx` | ✅ Done | Cards, icons, chat links |
| `app-sidebar.tsx` | ✅ Done | Navigation, active states |
| `ChatWindow.tsx` | ⚠️ Needs polish | Add file attachment, dark mode check |
| `toast.tsx` | 🔴 Create | Global toast system |
| `dashboard/page.tsx` | 🔴 Create | Agent stats, activity |
| `parse-agent-intent/route.ts` | ⚠️ Exists | May need completion |

---
Ready for Claude Code. Start with Week 7 Priority 1 (Toast system).