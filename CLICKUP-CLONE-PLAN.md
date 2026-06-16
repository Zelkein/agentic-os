# ClickUp Clone — Plan d'implémentation

**Objectif :** Transformer le Command Centre Agentic OS en plateforme de gestion de projets complète (clone ClickUp) pour Groupe CMI.

**Base existante :** Next.js 16 + SQLite (better-sqlite3) + Zustand + dnd-kit + SSE + Dark theme
**Déjà en place :** Tasks (CRUD), Kanban board, Dashboard, Chat, Agents, Projets, Permissions, FTS5 search

---

## Phase 1 — Core Enhancements (priorité haute)

### 1.1 Priority sur les tasks
- Ajouter colonne `priority` TEXT CHECK ('none','urgent','high','normal','low') DEFAULT 'none'
- Mettre à jour le type Task, l'API PATCH, le store
- Afficher dans le Kanban card + Task detail panel

### 1.2 Due dates & Start dates
- Ajouter `dueDate` TEXT et `startDate` TEXT sur tasks
- API + type + store
- Calendar view (Phase 2)

### 1.3 Tags multiples (remplacer tag unique)
- Créer table `tags` (id, name, color, clientId)
- Créer table `task_tags` (taskId, tagId)
- API CRUD pour tags
- TagPicker existant à adapter pour multi-select

### 1.4 Comments / Activity
- Créer table `task_comments` (id, taskId, author, content, createdAt)
- API CRUD comments
- Afficher dans TaskDetailPanel

### 1.5 DB Migrations
- Ajouter dans `db.ts` les migrations pour les nouvelles colonnes/tables

---

## Phase 2 — Nouvelles Vues

### 2.1 List View (tableau)
- Nouvelle page `/list`
- Tableau triable avec colonnes : title, status, priority, assignee, due date, tags
- Inline editing
- Filtres par colonne

### 2.2 Calendar View
- Nouvelle page `/calendar`
- Grille mensuelle/hebdomadaire
- Tasks avec dueDate affichées sur le calendrier
- Drag & drop pour changer les dates

### 2.3 Enhanced Board View
- Colonnes configurables (pas juste goals/done)
- WIP limits
- Swimlanes par assignee/priority

---

## Phase 3 — UX & Productivité

### 3.1 Search global
- Barre de recherche dans le header
- FTS5 sur tasks (titre + description)
- Résultats avec aperçu

### 3.2 Filters & Saved Views
- Filtres combinés : status + priority + tags + assignee + due date
- Saved views par projet/utilisateur

### 3.3 Notifications
- Activity feed temps réel (SSE existant)
- Badge de notifications non lues
- Notifications pour : task assignée, commentaire, status change

---

## Phase 4 — Avancé

### 4.1 Custom Fields
- Table `custom_fields` (id, projectId, name, type, options)
- Table `task_custom_field_values` (taskId, fieldId, value)
- UI pour ajouter/configurer des champs personnalisés par projet

### 4.2 Automations
- Règles conditionnelles : "Quand status → done, assigner à X"
- Triggers: status change, date approche, comment added

### 4.3 Templates
- Task templates avec champs pré-remplis
- Project templates (checklist, phases)

### 4.4 Time Tracking
- Table `time_entries` (taskId, userId, start, end, duration, description)
- Timer UI dans TaskDetailPanel
- Rapport de temps par projet/utilisateur

---

## Ordre d'exécution

```
Semaine 1 : Phase 1 (DB + types + API + UI de base)
Semaine 2 : Phase 2 (List view + Calendar)
Semaine 3 : Phase 3 (Search + Filters)
Semaine 4 : Phase 4 (Custom fields + Automations)
```

**Démarrer maintenant :** Phase 1.1 → 1.2 → 1.3 → 1.4 → 1.5