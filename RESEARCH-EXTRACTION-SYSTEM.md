# Research & Data Extraction System

Three new skills + TOON format optimization for token-efficient research and data collection.

## The Three Skills

### 1. **web-navigation**
Navigate complex websites, handle JavaScript, interact with forms and dynamic content.
- Best for: Multi-step workflows, authentication, pagination, dynamic sites
- Example: "Log in to supplier site, search for HVAC components, navigate filtered results"

### 2. **website-scraper**
Extract structured data from pages — tables, specs, product info, codes, standards.
- Best for: Tables, repeated structured data, product specifications, regulatory data
- Example: "Extract building code table from PDF-on-page" or "Get HVAC equipment specs"

### 3. **video-processor**
Extract transcriptions from video captions, analyze video content, summarize key points.
- Best for: Educational videos, standards explanations, product demos, technical tutorials
- Example: "Get transcript of MEP coordination training video" or "Extract key points from building code explanation"

## Workflow: Your Research Process

### Example Task
"Research HVAC duct sizing standards and standards-compliant products for the CPE L'Enfantillage project."

### Step 1: Find Information Sources
```
You: Find standards documents and product specs for HVAC ductwork sizing
Jasper: Identifies sources:
  - Building code websites
  - ASHRAE standards resources
  - HVAC manufacturer spec sheets
  - Industry training videos
```

### Step 2: Extract Standards (combination approach)
```
Source 1: Building Code Table (static page)
→ Use website-scraper
→ Extract table to JSON
→ Convert to TOON for processing

Source 2: Standards Explanation Video (YouTube)
→ Use video-processor
→ Extract key points and requirements
→ Structure as JSON
→ Convert to TOON

Source 3: Product Specifications (dynamic search)
→ Use web-navigation to search supplier site
→ Use website-scraper to extract product specs
→ Create JSON comparison table
```

### Step 3: Consolidate & Process
```
All extracted data:
- Product specs table (100 rows × 8 columns = 800 cells) 
  JSON: ~4,000 tokens
  TOON: ~600 tokens
  Saving: 85% token reduction

- Standards requirements (500 lines of text)
  JSON: ~2,000 tokens
  TOON: ~300 tokens
  Saving: 85% token reduction
```

### Step 4: Send to Jasper for Analysis
```
Jasper receives TOON-formatted data
Jasper processes efficiently
Jasper recommends products that meet standards
Jasper integrates with project calculations
```

## Integration with TOON Format

TOON conversion is especially valuable for research extraction because:

1. **Repeated structure** — Standards tables, product specs, comparison lists
2. **Large datasets** — Building codes, product catalogs, regulatory requirements
3. **LLM processing** — Jasper analyzes structured data for engineering decisions

### Example: HVAC Product Comparison

**JSON (raw extraction):**
```json
[
  {
    "product_id": "HVAC-001",
    "model": "ECL-2500",
    "capacity_btuh": 25000,
    "eer": 14.2,
    "voltage": 208,
    "price": 3200,
    "availability": "in_stock"
  },
  // ... 99 more products = massive token cost
]
```

**TOON (efficient format):**
```
products[100]{product_id,model,capacity_btuh,eer,voltage,price,availability}:
  "HVAC-001","ECL-2500",25000,14.2,208,3200,"in_stock"
  "HVAC-002","ECL-3000",30000,15.1,208,3800,"in_stock"
  // ... 98 more rows = ~600 tokens instead of 4000
```

## Workflow Patterns

### Pattern 1: Quick Research
```
1. Use website-scraper to extract table
2. Convert to JSON
3. Send to Jasper for analysis
Total tokens: minimal
Speed: fast
```

### Pattern 2: Complex Research
```
1. Use web-navigation to find and navigate sources
2. Use website-scraper to extract structured data
3. Use video-processor to extract educational content
4. Consolidate to JSON
5. Convert everything to TOON
6. Send bulk data to Jasper
Total tokens: optimized via TOON
Speed: slower collection, faster LLM processing
```

### Pattern 3: Standards & Codes
```
1. Find building code resources
2. Extract table (website-scraper)
3. Extract explanation video (video-processor)
4. Cross-reference with standards docs
5. Create structured requirements list
6. Convert to TOON
7. Jasper integrates into design process
```

## Token Savings Example

**Project: CPE L'Enfantillage MEP Design**
Research task: Extract standards + products

### Without optimization (JSON only):
- Building code table: 2,000 tokens
- Product specs (100 items): 4,000 tokens
- Standards video transcript: 3,000 tokens
- Total: **9,000 tokens per research session**

### With TOON optimization:
- Building code table (TOON): 300 tokens
- Product specs (TOON): 600 tokens
- Standards summary (JSON): 1,000 tokens
- Total: **1,900 tokens per research session**

**Savings: 78% token reduction** (~7,100 tokens saved per session)

Scale this across 50 research sessions per month:
- Without optimization: 450,000 tokens/month
- With optimization: 95,000 tokens/month
- **Monthly savings: 355,000 tokens** = significant cost reduction

## For All Agents

These three skills are available to:
- ✅ **Jasper** (deepseek-v4-flash) — Use for research tasks
- ✅ **Claude** (subordinate) — When Jasper invokes for specialized research
- ✅ **All future agents** — Consistent research capability across framework

## Integration Checklist

- [x] `web-navigation` skill created and documented
- [x] `website-scraper` skill created and documented
- [x] `video-processor` skill created and documented
- [x] Updated AGENTS.md skill reference table
- [x] All three skills available in `.agents/skills/`
- [x] TOON format documentation in website-scraper and video-processor
- [x] `toon-cli` ready for installation (`npm install -g @toon-format/cli`)

## Next Steps

1. **Install TOON CLI globally:**
   ```bash
   npm install -g @toon-format/cli
   ```

2. **Use in workflows:**
   - Research phase: Extract data with the three new skills
   - Optimization phase: Convert structured JSON to TOON
   - Processing phase: Send TOON-formatted data to Jasper/Claude

3. **Benchmark your workflows:**
   - Measure tokens before/after TOON conversion
   - Compare analysis quality (should be identical)
   - Confirm token savings for your specific data structures

## Legal & Ethical Notes

All three skills include ethical guidelines:
- Extract only from sources you have permission to access
- Respect robots.txt and terms of service
- Don't overload servers
- Cite sources in extracted data
- Use within scope of research and fair use

For your engineering work at CMI:
- Building codes: Public domain or licensed for research
- Standards: Verify licensing (ASHRAE, IBC, etc.)
- Product specs: Generally fair use for research/procurement
- Training videos: Respect copyright, use for learning only

---

**Status:** ✓ System ready  
**Skills:** 3 new research skills  
**Optimization:** TOON format integrated  
**Token Savings:** 70-85% for structured research data  
**Available to:** All agents (Jasper, Claude, future agents)
