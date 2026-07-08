// =====================================================================
// 99_example_queries.cypher
// Read-only queries that exercise the ontology. Run one at a time in the
// Neo4j Browser after loading the graph.
// =====================================================================

// 1. Every regulatory element of a gene, grouped by class.
MATCH (g:Gene {symbol: 'TP53'})-[:HAS_ELEMENT]->(e:GeneElement)
RETURN e.element_class AS class, collect(e.label) AS elements
ORDER BY class;

// 2. How does each enhancer affect its target gene, and by how much?
//    Shows the direction (effect), magnitude (fold_change), mechanism and tissue.
MATCH (e:Enhancer)-[x:REGULATES]->(g:Gene)
RETURN g.symbol AS gene, e.id AS enhancer, x.effect, x.fold_change,
       x.distance_bp, x.mechanism, x.tissue, x.confidence
ORDER BY x.fold_change DESC
LIMIT 15;

// 3. The strongest enhancer for each gene (max fold change).
MATCH (e:Enhancer)-[x:REGULATES]->(g:Gene)
WITH g, e, x ORDER BY x.fold_change DESC
WITH g, collect({enhancer: e.id, fold: x.fold_change, tissue: x.tissue})[0] AS top
RETURN g.symbol AS gene, top.enhancer AS enhancer, top.fold AS fold_change, top.tissue AS tissue
ORDER BY top.fold DESC LIMIT 10;

// 4. Transcription factors that ACTIVATE vs REPRESS a given gene.
MATCH (tf:TranscriptionFactor)-[r:ACTIVATES|REPRESSES]->(g:Gene {symbol: 'MYC'})
RETURN tf.symbol AS tf, type(r) AS effect, r.activity_multiplier, r.tissue;

// 5. Genes associated with a disease, with the association metadata.
MATCH (g:Gene)-[a:ASSOCIATED_WITH]->(d:Disease {name: 'Parkinson disease'})
RETURN g.symbol AS gene, a.association_type, a.molecular_effect,
       a.inheritance, a.evidence_level, a.source;

// 6. Full regulatory + clinical neighbourhood of one gene.
MATCH (g:Gene {symbol: 'EGFR'})
OPTIONAL MATCH (g)-[:HAS_ELEMENT]->(el:GeneElement)
OPTIONAL MATCH (enh:Enhancer)-[:REGULATES]->(g)
OPTIONAL MATCH (g)-[:ASSOCIATED_WITH]->(d:Disease)
OPTIONAL MATCH (inh:Inhibitor)-[:INHIBITS]->(g)
RETURN g.symbol AS gene,
       count(DISTINCT el)  AS elements,
       count(DISTINCT enh) AS enhancers,
       collect(DISTINCT d.name)   AS diseases,
       collect(DISTINCT inh.name) AS inhibitors;

// 7. Drug-repurposing style hop: inhibitor -> gene -> disease.
MATCH (i:Inhibitor)-[:INHIBITS]->(g:Gene)-[:ASSOCIATED_WITH]->(d:Disease)
RETURN i.name AS inhibitor, g.symbol AS gene, d.name AS disease;

// 8. Variants that are pathogenic and the gene element region they hit.
MATCH (v:Variant)-[:AFFECTS]->(g:Gene)-[:ASSOCIATED_WITH]->(d:Disease)
WHERE v.clinical_significance = 'pathogenic'
RETURN v.id AS variant, v.consequence, g.symbol AS gene, d.name AS disease
LIMIT 20;

// 9. Shared-pathway gene neighbours (guilt-by-association).
MATCH (g1:Gene {symbol: 'KRAS'})-[:PARTICIPATES_IN]->(p:Pathway)<-[:PARTICIPATES_IN]-(g2:Gene)
WHERE g1 <> g2
RETURN p.name AS pathway, collect(DISTINCT g2.symbol) AS co_pathway_genes;

// 10. Whole central-dogma path for a gene: Gene -> Transcript -> Protein.
MATCH path = (g:Gene {symbol: 'CFTR'})-[:TRANSCRIBED_TO]->(:Transcript)-[:TRANSLATED_TO]->(:Protein)
RETURN path;

// 11. Which tissues does a gene's regulation act in (across enhancers + TFs)?
MATCH (g:Gene {symbol: 'HBB'})
OPTIONAL MATCH (:Enhancer)-[re:REGULATES]->(g)
OPTIONAL MATCH (:TranscriptionFactor)-[rt:ACTIVATES|REPRESSES]->(g)
RETURN g.symbol AS gene,
       collect(DISTINCT re.tissue) AS enhancer_tissues,
       collect(DISTINCT rt.tissue) AS tf_tissues;

// 12. Sanity counts of the loaded graph.
MATCH (n) RETURN labels(n)[0] AS label, count(*) AS n ORDER BY n DESC;
