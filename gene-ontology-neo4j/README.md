# gene-ontology-neo4j

A proof-of-concept **Neo4j property-graph ontology** for **gene regulatory
elements** (promoters, enhancers, poly-A signals, TF binding sites, inhibitors,
…), **gene → disease associations**, and the surrounding molecular-biology
context.

> This is a self-contained project. The full ontology specification —
> every node label and edge type — lives in **[`docs/ontology.md`](docs/ontology.md)**.

## What's modelled

- **Gene elements**: `Promoter` (core/proximal), `TATABox`, `CpGIsland`,
  `FivePrimeUTR`, `ThreePrimeUTR`, **`PolyASignal`** (poly-A tail addition),
  `Terminator`, `Enhancer`, `TFBindingSite` — connected to genes with typed edges.
- **How an enhancer acts**: `(:Enhancer)-[:REGULATES {effect, fold_change,
  distance_bp, mechanism, tissue, confidence}]->(:Gene)`. The effect direction
  and magnitude are edge properties, so **the same enhancer can activate one
  gene and repress another, in a tissue-specific way** — see
  [`docs/ontology.md` §3](docs/ontology.md#3-how-an-enhancer-affects-other-nodes-the-headline-requirement).
- **Transcription factors**: `ACTIVATES` / `REPRESSES` — the *edge type itself*
  is chosen per gene from the data (this is the "edges change based on gene
  names" requirement).
- **Inhibitors / drugs**: `(:Inhibitor)-[:INHIBITS]->(:Gene)`.
- **~55 real genes** (`TP53`, `BRCA1`, `EGFR`, `CFTR`, `HTT`, `APOE`, …; POC cap
  of 100) with real **disease associations** carrying `association_type`,
  `molecular_effect`, `inheritance`, `evidence_level` and `source`.
- **Supporting layers**: `Transcript`, `Protein`, `Variant`, `Pathway`,
  `GOTerm`, `Chromosome`.

## Repository layout

```
gene-ontology-neo4j/
├── README.md
├── docker-compose.yml          # Neo4j 5 + APOC, CSVs mounted into import/
├── docs/
│   └── ontology.md             # ← full node + edge type specification (+ mermaid diagram)
├── data/                       # generated CSVs (nodes + relationships)
├── cypher/
│   ├── 01_constraints.cypher       # uniqueness constraints + indexes
│   ├── 02_load_nodes.cypher        # LOAD CSV for every node label
│   ├── 03_load_relationships.cypher# LOAD CSV for every edge type
│   ├── 04_optional_apoc.cypher     # (optional) stamp element subtype labels
│   └── 99_example_queries.cypher   # 12 read queries that exercise the graph
└── scripts/
    ├── generate_data.py        # regenerate data/ deterministically
    ├── load_neo4j.py           # alternative loader via the Bolt driver
    └── requirements.txt
```

## Quick start

### Option A — Docker + `LOAD CSV`

```bash
cd gene-ontology-neo4j
docker compose up -d          # Neo4j at http://localhost:7474  (neo4j / testpassword123)
```

Then in the Neo4j Browser run, in order, the contents of:
`cypher/01_constraints.cypher` → `02_load_nodes.cypher` →
`03_load_relationships.cypher` (→ optional `04_optional_apoc.cypher`).
Explore with `cypher/99_example_queries.cypher`.

### Option B — Python Bolt driver (no import-dir copying)

```bash
cd gene-ontology-neo4j
pip install -r scripts/requirements.txt
export NEO4J_URI=bolt://localhost:7687 NEO4J_USER=neo4j NEO4J_PASSWORD=testpassword123
python scripts/load_neo4j.py --wipe
```

### Regenerate the data

```bash
python scripts/generate_data.py     # deterministic (seed=42), rewrites data/*.csv
```

## Example queries

```cypher
// How does each enhancer affect its target gene, and by how much?
MATCH (e:Enhancer)-[x:REGULATES]->(g:Gene)
RETURN g.symbol, e.id, x.effect, x.fold_change, x.mechanism, x.tissue
ORDER BY x.fold_change DESC LIMIT 15;

// Genes causing an autosomal-recessive disease, with evidence.
MATCH (g:Gene)-[a:ASSOCIATED_WITH]->(d:Disease)
WHERE a.inheritance = 'autosomal_recessive'
RETURN g.symbol, d.name, a.molecular_effect, a.evidence_level, a.source;

// Inhibitor -> gene -> disease (repurposing hop).
MATCH (i:Inhibitor)-[:INHIBITS]->(g:Gene)-[:ASSOCIATED_WITH]->(d:Disease)
RETURN i.name, g.symbol, d.name;
```

More in [`cypher/99_example_queries.cypher`](cypher/99_example_queries.cypher).

## Scope & caveats

This is a **POC**. Gene symbols, cytobands, disease associations, inheritance
and drug targets are curated from public knowledge; **genomic coordinates
(`start`/`end`/`tss`), enhancer `fold_change`/`distance_bp`, and TF binding
scores are synthetic** placeholders generated deterministically so the graph is
fully connected and queryable. Swap `data/` for real ENCODE/GTEx/ClinVar
exports to make it production-grade. Extension ideas (silencers, insulators,
miRNAs, exons/introns, PPIs, phenotypes) are listed in
[`docs/ontology.md` §7](docs/ontology.md#7-extension-roadmap-tbd-items).
