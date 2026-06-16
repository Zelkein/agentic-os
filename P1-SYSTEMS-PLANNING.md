# P1 Systems Planning — Answers Complete ✅

**Status:** All 45 questions answered by Frank — ready for architecture design  
**Created:** 2026-05-13  
**Answers completed:** 2026-06-04  
**Systems to Build:** 4 interconnected systems  
**Timeline:** Phases 2-3 (weeks 5-24)

---

## Overview

Frank is planning 4 P1 systems to automate MEP engineering workflows and reduce his workload from 70H/week to 50H/week:

1. **MEP Checklist + Automated Calculation System** (Goal 3) — Prevent coordination errors early
2. **Convert CAD Tables to Excel + Build Calculation Systems** (Goal 4) — Single source of truth
3. **Build AI Agent for Intelligent Review** (Goal 5) — Reduce 2-hour reviews to 10 minutes
4. **Clean Up ClickUp** (Goal 6) — 100 tasks → 30-40 actionable tasks

### Core Vision (Frank's words)

*"Mon objectif n'est pas juste d'automatiser les calculs. Mon objectif est de verrouiller la séquence coordination → calcul → dessin, parce que c'est là que se crée aujourd'hui le plus de rework. Je veux un système simple pour l'équipe, assez structuré pour enlever les oublis, et assez intelligent pour que je ne sois plus le seul filtre final sur tout."*

---

## System 1: MEP Checklist + Automated Calculation System

**Phase:** 2 (weeks 5-12)  
**Success Metric:** Team uses checklist on all 7 projects, automated calcs catch 80%+ of errors before drawing

### Frank's Answers

**Checklist Content & Format:**

**Q1-2. Top 15 coordination errors:**
1. Shafts/risers sous-dimensionnés ou mal placés
2. Retombées/plénums insuffisants
3. Percements en murs/planchers coupe-feu oubliés
4. Conflits drains/pentes/structure
5. Prises et rejets d'air mal coordonnés
6. Équipements trop gros pour les locaux techniques
7. Équipements non alignés avec les charges
8. CFM/sommaires/schedules non cohérents entre calculs et plans
9. Conflits entre cheminements électriques et mécanique
10. Condensats/drains oubliés
11. Accès d'entretien non prévus
12. Cuisines/commerces qui changent trop tard
13. Contrôles/intercom/accès qui bougent après le design
14. Coordination toiture/écran mécanique incomplète
15. Détails de transition archi/MEP laissés implicites

**Q2. Checklist diffère par type de projet ?**
✅ Oui — tronc commun + modules par type (APH répétitif ≠ mandat MEP complet ≠ rénovation).

**Q3. Processus mental de revue :**
> Est-ce que le projet est coordonné discipline par discipline, est-ce que les hypothèses de base sont claires, est-ce que les espaces techniques existent vraiment, est-ce que les cheminements sont faisables, est-ce que les calculs supportent les choix, puis seulement après est-ce qu'on peut dessiner.

**Q4. Format préféré :**
✅ Excel ou Google Sheets structuré — simple, flexible, partageable, lien possible checklist→calculs. Web form plus tard. Pas de PDF.

**Current Calculation Workflow:**

**Q5-6. Calculs actuels :**
- Ductwork : online ductulator + Excel (pas de système unique verrouillé)
- Piping & électrique : Excel, calculs manuels, morceaux de templates, validation par expérience
- APH/énergie : Carrier HAP 6.3 selon le mandat
- **Problème :** pas de chaîne cohérente intégrée

**Q7. Qui fait les calculs ?**
Plusieurs personnes par discipline. Frank est trop souvent le validateur final. Objectif : chaque discipline produit ses calculs, le système remonte seulement les écarts.

**Q8. Outils existants :**
Excel, AutoCAD, PDF, ClickUp, Google Drive, Carrier HAP 6.3. Le problème = absence de flux standardisé coordination→calcul→dessin.

**Validation & Red Flags:**

**Q9. Incohérences causant des redraws :**
- CFM ne match pas les charges
- Équipement choisi ne match pas les besoins
- Dimensions conduits/tuyauterie non cohérentes avec les débits
- Panel/load summary non cohérent avec les plans
- Drains/vents mal dimensionnés
- Coordination spatiale qui casse en dessin
- Coordination inter-professionnelle pas assez assidue

**Q10. Signalement des erreurs :**
✅ Signalées dans l'outil de travail lui-même (cellule en erreur, ligne bloquée, code couleur, commentaire). Résumé des red flags importants envoyé au responsable. Pas de courriel pour les erreurs de base.

**Q11. Qui voit les red flags ?**
Niveau 1 → la personne qui fait le calcul. Niveau 2 → lead de discipline / chargé de projet. Frank → seulement les red flags majeurs, pas le bruit.

**Integration Points:**

**Q12. Checklist + calculs : même fichier ou séparés ?**
✅ Connectés mais pas dans le même onglet. Même workbook/structure de données, sections séparées mais reliées.

**Q13. Checklist auto-remplie ?**
✅ Oui — préremplie par métadonnées (type de projet, discipline, phase, adresse, client, architecte, présence cuisine/commerces/garage, etc.).

---

## System 2: Convert CAD Tables to Excel + Build Calculation Systems

**Phase:** 2 (weeks 5-12)  
**Success Metric:** All 7 projects use Excel templates, AutoCAD pulls final numbers from Excel (read-only)

### Frank's Answers

**Current CAD Usage:**

**Q14. Version AutoCAD :**
AutoCAD 2023, relativement à jour.

**Q15-16. Types de tables dans CAD :**
Schedules d'équipements, sommaires de charges, tableaux de panneaux, sommaires ventilation/ductwork, listes de plomberie, tableaux de coordination. Majoritairement intégrées au dessin ou à un jeu CAD lié. Parfois l'info vit dans Excel/notes puis est recopiée dans CAD → **c'est ce dédoublement qu'il faut éliminer.**

**Q17. Nombre de tables par projet :**
5 à 20 tables selon la complexité (un petit APH en a peu, un projet mixte/commercial beaucoup plus).

**Excel Template Structure:**

**Q18. Structure de données idéale par projet :**
1. Feuille projet/métadonnées
2. Feuille hypothèses
3. HVAC
4. Plomberie
5. Électrique
6. Équipements/schedules
7. Validations
8. Export vers CAD
→ Ajouter APH/énergie ou cuisine/commercial selon le mandat.

**Q19. Template unique vs par type :**
✅ Noyau commun + variantes par type de projet. Un seul template rigide ne fonctionnera pas pour les 7 projets.

**Q20. Dependency map :**
Architecture/programme → charges/débits/demandes → sélection d'équipements → dimensions conduits/tuyaux/feeders → sommaires/tables → plans. Si on casse cette chaîne = rework.

**CAD→Excel Integration:**

**Q21. AutoCAD tire données d'Excel comment ?**
✅ Valeurs finales depuis Excel en lecture contrôlée. Source unique avant tout. Lien simple et robuste d'abord, plus automatisé ensuite.

**Q22. Fréquence de changements :**
Peu au début, très souvent en coordination active et exécution. Minimum hebdomadaire, parfois quotidien sur projets chauds.

**Q23. Qui maintient le fichier Excel ?**
Responsable de discipline ou personne désignée — pas Frank seul. Frank garde la logique, la structure et la validation finale.

**Calculation Logic:**

**Q24. Formules Excel actuelles :**
IF, SUMIF/SUMIFS, XLOOKUP/INDEX-MATCH, validations de données, tables de référence, formules de pertes de charge/vitesses/charges/sélections. Priorité = robuste et lisible, pas "smart".

**Q25. Calculs standards à automatiser :**
Duct sizing, vitesses, pertes de charge, pipe sizing, drainage/venting de base, electrical load/demand, feeder sizing, vérifications d'équipement, tout ce qui est récurrent.

**Q26. Règles de validation Excel :**
- Champs obligatoires
- Min/max sur valeurs
- Cohérence inputs↔outputs
- Valeurs hors plage
- Mismatch sélection↔charge
- Mismatch tableau↔plan
- Blocage si donnée critique manque

**Migration & Testing:**

**Q27. Les 7 projets migrables ?**
Pas tous tels quels — certains exploitables, d'autres trop brouillons ou avancés. Accepter un mix : migration complète, partielle ou témoin seulement.

**Q28. Projet pilote :**
✅ **APH typique** — répétitif, standard, peu d'exceptions. Pas une rénovation tordue ni un commercial atypique.

---

## System 3: Build AI Agent for Intelligent Review

**Phase:** 3 (weeks 13-24)  
**Success Metric:** AI agent reviews 7 projects, Frank review time reduces from 2 hours to 10 minutes per project

### Frank's Answers

**File Access & Format:**

**Q29. Fichiers à lire :**
✅ Must-have : Excel de calcul, PDF de plans/devis, tâches/commentaires ClickUp, notes texte, sommaires/schedules exportés.
⚠️ Nice-to-have : DWG natif. Prioriser d'abord des exports fiables plutôt que du DWG mal exploité.

**Q30. Organisation des fichiers :**
Par projet, avec dossier de référence clair + tâche/liste ClickUp correspondante. L'info existe entre ClickUp, Google Drive et les fichiers projet — le but est de structurer, pas d'ajouter une couche.

**Q31. Must-have vs nice-to-have :**
Must : Excel, PDF, ClickUp, notes structurées. Nice-to-have : DWG natif, parsing avancé, liens bidirectionnels complexes.

**Q32. Aspects confidentiels :**
✅ Protéger : données clients, templates internes, hypothèses de design, méthodes de travail. Logs complets requis.

**Validation Rules:**

**Q33. Checklist de revue manuelle (20 éléments) :**
1. Bonne version du projet
2. Bonnes hypothèses de base
3. Discipline/mandat bien compris
4. Architecture et structure à jour
5. Shafts disponibles
6. Locaux techniques suffisants
7. Accès d'entretien prévus
8. Sélection d'équipements cohérente
9. Charges cohérentes
10. Débits cohérents
11. Conduits/tuyaux/feeders cohérents
12. Drainage/condensats/vents cohérents
13. Coordination plafond/toiture
14. Murs/planchers coupe-feu traités
15. Tableaux/schedules cohérents avec les plans
16. Annotations essentielles présentes
17. Constructibilité acceptable
18. Conformité code/normes
19. Rien d'important laissé implicite
20. Projet prêt à dessiner ou encore en conception

**Q34. Top 5 erreurs causant des redraws :**
1. Coordination spatiale incomplète
2. Charges et sélections non alignées
3. Schedules non cohérents avec les plans
4. Changements tardifs d'architecture/programme/cuisine
5. Calculs validés trop tard dans le cycle

**Q35. Codes/standards applicables :**
Priorité 1 : Code du Québec et du Canada. Priorité 2 : Normes CSA/discipline. Priorité 3 : Exigences APH/énergie selon mandat. Priorité 4 : Données manufacturier.

**Q36. Validation manuelle actuelle :**
- Electrical load : remonter hypothèses → charges connectées → demande → feeder → protection
- Ductwork : débits → vitesses → pertes de charge → choix d'appareils → cohérence spatiale
- Pipe sizing : débits → unités de plomberie → vitesses → pentes → pertes de charge → contraintes d'implantation

**Error Detection & Reporting:**

**Q37. Critère vs Warning vs Informatif :**
- 🔴 Critique = erreur rendant le design faux, non conforme ou impossible à construire
- 🟡 Warning = point douteux ou incomplet, résoluble sans tout refaire
- 🔵 Informatif = note utile, optimisation, élément à surveiller sans bloquer

**Q38. Auto-suggérer corrections ?**
✅ Suggérer des pistes de correction, mais ne rien modifier automatiquement. D'abord excellent réviseur, pas designer autonome. Si l'agent en a les capacités ensuite, confirmer qu'on veut qu'il modifie — **mais backuper chaque modification importante.**

**Q39. Qui reçoit le résumé 1-page ?**
D'abord Frank. Une fois fiable → préparateur ou lead de discipline. Ne pas noyer l'équipe avec des faux positifs en rodage.

**Sandboxing & Security:**

**Q40. Read-only suffisant ?**
✅ Oui, même préférable pour démarrer. Si l'agent lit bien, juge bien et log bien, pas besoin de droits d'écriture.

**Q41. Log de revue ?**
✅ Oui — un log par projet et par passe de validation. Tracer ce qui a été vu, bloqué, toléré et corrigé.

**Training Data:**

**Q42. 10-20 projets complétés pour entraînement ?**
✅ Oui, largement assez de projets complétés et revues passées. Nécessite curation — tout n'est pas directement propre à l'entraînement.

**Q43. Ajusté par type de projet ?**
✅ Oui absolument — un APH répétitif, un mandat commercial, une rénovation ou un projet énergétique ne se révisent pas avec les mêmes lunettes.

---

## System 4: Clean Up ClickUp

**Phase:** 1 (weeks 1-4) — This is part of Phase 1 cleanup  
**Success Metric:** 30-40 actionable tasks, organized by process phases, one task per person at a time

### Frank's Answers

**Q44. Organisation ClickUp actuelle :**
- Espace d'équipe principal
- Dossiers projets par année : Projets-2021 à Projets-2026
- Chaque liste = un projet
- Listes transversales : Tâches en cours, Storage, Admin, Interne
- Liste Codes et normes
- Zone de doublons déjà existante pour nettoyer sans perdre d'info

**Q45. 100 tâches = combien de bruit vs actionnables ?**
- 30-40 actionnables et prioritaires
- 60-70 = bruit (doublons, suivis périmés, tâches d'attente, notifications→tâches, éléments à archiver/fermer)
- **Problème réel :** les tâches actionnables doivent être fermées manuellement. Le système actuel n'a aucun moyen de savoir quand les fermer. Ça viendra plus tard ("Plus tard on intégrera des automations lorsqu'on aura un système fiable et que les modèles IA feront moins d'erreurs").

---

## Interdependencies & Architecture Map

```
ClickUp (System 4: Clean & Organize)
    ↓
    └─→ Tasks sequenced: Coordination → Calculation → Drawing
    
Coordination Phase:
    ├─→ MEP Checklist (System 1) — validates "coordination complete"
    └─→ AI Review Agent (System 3) — checks checklist compliance
    
Calculation Phase:
    ├─→ Excel Calcs (System 2) — automation runs here
    ├─→ Automated Validation (System 1) — catches inconsistencies
    └─→ AI Review Agent (System 3) — validates calc accuracy
    
Drawing Phase:
    ├─→ AutoCAD pulls from Excel (System 2)
    └─→ AI Review Agent (System 3) — final validation before release
```

**Critical Coupling:** MEP Checklist (System 1) and Excel Calcs (System 2) MUST be linked. Coordination items → corresponding calculation sheets. This breaks the redraw/patch cycle.

---

## Risks & Critical Unknowns

| Risk | Impact | Mitigation |
|------|--------|-----------|
| No sample calculation workflow | Hard to design Excel templates | Frank will provide ONE complete example: design input → all calcs → final numbers |
| AutoCAD version/capability unclear | CAD→Excel link might not work | AutoCAD 2023 confirmed. Start with simple robust link, iterate |
| Team skill level unknown | Checklist/calcs too complex for adoption | Keep simple; extensive training needed |
| AI accuracy on design review unknown | Agent misses errors or false-flags | Need training data & validation vs Frank's reviews |
| ClickUp API/integration unknown | Daily sync might break | Verify API; have manual fallback |
| Task auto-closure not feasible yet | Manual closure bottleneck | Defer automation until system is reliable and AI models improve |

---

## Key Decisions from Frank's Answers

1. **Format:** Excel/Google Sheets first (not PDF, not web form yet)
2. **Template strategy:** Common core + variants per project type (not one rigid template)
3. **Pilot project:** APH typique, répétitif, standard
4. **AI agent:** Read-only first, suggest corrections but never auto-modify, log everything
5. **Error signaling:** In-tool (cell highlighting, blocking), not email-based
6. **Review flow:** Frank gets 1-page summary first during beta; expands to team when reliable
7. **ClickUp:** 30-40 actionable tasks is the target. Auto-closure deferred to later phase
8. **CAD→Excel:** Simple robust link first, automation later
9. **Backup policy:** Backuper chaque modification importante avant que l'IA ne touche aux fichiers
10. **Codes/standards priority:** Québec/Canada → CSA/discipline → APH/énergie → Manufacturer

---

## Next Steps

1. ✅ **Frank has answered all 45 questions** — 2026-06-04
2. **Jasper/AI designs detailed architecture** for each system
3. **Identify build order** and dependencies
4. **Estimate effort** and propose Phase 2 timeline
5. **Frank reviews architecture** and approves
6. **Build Phase 2 systems** (MEP checklist + Excel calcs + AI agent)

---

## Document Status: Answers Complete ✅

**All 45 Clarifying Questions:** Answered by Frank (2026-06-04)  
**Planning Depth:** Complete — ready to move to architecture design  
**Pilot project preference:** APH typique  
**Core philosophy:** "Verrouiller la séquence coordination → calcul → dessin. Système simple pour l'équipe, assez structuré pour enlever les oublis, assez intelligent pour que Frank ne soit plus le seul filtre final."
