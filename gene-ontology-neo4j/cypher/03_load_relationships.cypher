// =====================================================================
// 03_load_relationships.cypher
// Create every typed edge from the relationship CSVs.
// Run after 02_load_nodes.cypher.
//
// Edge types created here:
//   (Gene)-[:LOCATED_ON]->(Chromosome)
//   (Gene)-[:HAS_ELEMENT]->(GeneElement)
//   (Enhancer)-[:REGULATES]->(Gene)          <-- rich, gene-specific props
//   (TranscriptionFactor)-[:BINDS]->(TFBindingSite)
//   (TFBindingSite)-[:LOCATED_IN_PROMOTER_OF]->(Gene)   (derived)
//   (TranscriptionFactor)-[:ACTIVATES|REPRESSES]->(Gene)
//   (Inhibitor)-[:INHIBITS]->(Gene)
//   (Gene)-[:TRANSCRIBED_TO]->(Transcript)
//   (Transcript)-[:TRANSLATED_TO]->(Protein)
//   (Gene)-[:ASSOCIATED_WITH]->(Disease)     <-- association metadata
//   (Gene)-[:PARTICIPATES_IN]->(Pathway)
//   (Gene)-[:ANNOTATED_WITH]->(GOTerm)
//   (Variant)-[:AFFECTS]->(Gene)
//   (Variant)-[:IMPLICATED_IN]->(Disease)
// =====================================================================

// ---- Gene LOCATED_ON Chromosome --------------------------------------
LOAD CSV WITH HEADERS FROM 'file:///genes.csv' AS r
MATCH (g:Gene {symbol: r.symbol})
MATCH (c:Chromosome {id: r.chromosome})
MERGE (g)-[:LOCATED_ON]->(c);

// ---- Gene HAS_ELEMENT GeneElement ------------------------------------
LOAD CSV WITH HEADERS FROM 'file:///rel_gene_element.csv' AS r
MATCH (g:Gene {symbol: r.gene})
MATCH (e:GeneElement {id: r.element_id})
MERGE (g)-[h:HAS_ELEMENT]->(e)
  SET h.element_label = r.element_label;

// ---- Enhancer REGULATES Gene  (the headline edge) --------------------
// Properties vary per (enhancer, gene) pair: effect direction, fold change,
// linear distance, biophysical mechanism, tissue and evidence confidence.
LOAD CSV WITH HEADERS FROM 'file:///rel_enhancer_gene.csv' AS r
MATCH (e:Enhancer {id: r.enhancer_id})
MATCH (g:Gene {symbol: r.gene})
MERGE (e)-[x:REGULATES]->(g)
  SET x.effect      = r.effect,        // activates | represses
      x.fold_change = toFloat(r.fold_change),
      x.distance_bp = toInteger(r.distance_bp),
      x.mechanism   = r.mechanism,     // chromatin_looping | enhancer_RNA | cohesin_mediated
      x.tissue      = r.tissue,
      x.confidence  = toFloat(r.confidence),
      x.evidence    = r.evidence;

// ---- TranscriptionFactor BINDS TFBindingSite -------------------------
LOAD CSV WITH HEADERS FROM 'file:///rel_tf_bindingsite.csv' AS r
MATCH (t:TranscriptionFactor {symbol: r.tf_symbol})
MATCH (b:TFBindingSite {id: r.bindingsite_id})
MERGE (t)-[bd:BINDS]->(b)
  SET bd.score = toFloat(r.score);

// ---- TFBindingSite LOCATED_IN_PROMOTER_OF Gene (structural link) -----
// The binding-site id is prefixed with the gene symbol ("<GENE>:TFBS:<TF>").
LOAD CSV WITH HEADERS FROM 'file:///tf_binding_sites.csv' AS r
WITH r, split(r.id, ':')[0] AS gene_symbol
MATCH (b:TFBindingSite {id: r.id})
MATCH (g:Gene {symbol: gene_symbol})
MERGE (b)-[:LOCATED_IN_PROMOTER_OF]->(g);

// ---- TranscriptionFactor ACTIVATES / REPRESSES Gene ------------------
// Edge TYPE is chosen from the `effect` column, so the same TF can activate
// one gene and repress another.
LOAD CSV WITH HEADERS FROM 'file:///rel_tf_gene.csv' AS r
WITH r WHERE r.effect = 'activates'
MATCH (t:TranscriptionFactor {symbol: r.tf_symbol})
MATCH (g:Gene {symbol: r.gene})
MERGE (t)-[a:ACTIVATES]->(g)
  SET a.activity_multiplier = toFloat(r.activity_multiplier),
      a.tissue = r.tissue, a.evidence = r.evidence;

LOAD CSV WITH HEADERS FROM 'file:///rel_tf_gene.csv' AS r
WITH r WHERE r.effect = 'represses'
MATCH (t:TranscriptionFactor {symbol: r.tf_symbol})
MATCH (g:Gene {symbol: r.gene})
MERGE (t)-[a:REPRESSES]->(g)
  SET a.activity_multiplier = toFloat(r.activity_multiplier),
      a.tissue = r.tissue, a.evidence = r.evidence;

// ---- Inhibitor INHIBITS Gene -----------------------------------------
LOAD CSV WITH HEADERS FROM 'file:///rel_inhibitor_target.csv' AS r
MATCH (i:Inhibitor {id: r.inhibitor_id})
MATCH (g:Gene {symbol: r.gene})
MERGE (i)-[x:INHIBITS]->(g)
  SET x.action = r.action, x.mechanism = r.mechanism;

// ---- Gene TRANSCRIBED_TO Transcript ----------------------------------
LOAD CSV WITH HEADERS FROM 'file:///rel_gene_transcript.csv' AS r
MATCH (g:Gene {symbol: r.gene})
MATCH (t:Transcript {id: r.transcript_id})
MERGE (g)-[x:TRANSCRIBED_TO]->(t)
  SET x.tag = r.tag;

// ---- Transcript TRANSLATED_TO Protein --------------------------------
LOAD CSV WITH HEADERS FROM 'file:///rel_transcript_protein.csv' AS r
MATCH (t:Transcript {id: r.transcript_id})
MATCH (p:Protein {id: r.protein_id})
MERGE (t)-[:TRANSLATED_TO]->(p);

// ---- Gene ASSOCIATED_WITH Disease ------------------------------------
LOAD CSV WITH HEADERS FROM 'file:///rel_gene_disease.csv' AS r
MATCH (g:Gene {symbol: r.gene})
MATCH (d:Disease {id: r.disease_id})
MERGE (g)-[x:ASSOCIATED_WITH]->(d)
  SET x.association_type = r.association_type,  // causal | driver | predisposition | susceptibility
      x.molecular_effect = r.molecular_effect,  // loss_of_function | gain_of_function | ...
      x.inheritance      = r.inheritance,
      x.evidence_level   = r.evidence_level,
      x.source           = r.source;

// ---- Gene PARTICIPATES_IN Pathway ------------------------------------
LOAD CSV WITH HEADERS FROM 'file:///rel_gene_pathway.csv' AS r
MATCH (g:Gene {symbol: r.gene})
MATCH (p:Pathway {id: r.pathway_id})
MERGE (g)-[:PARTICIPATES_IN]->(p);

// ---- Gene ANNOTATED_WITH GOTerm --------------------------------------
LOAD CSV WITH HEADERS FROM 'file:///rel_gene_goterm.csv' AS r
MATCH (g:Gene {symbol: r.gene})
MATCH (t:GOTerm {id: r.go_id})
MERGE (g)-[x:ANNOTATED_WITH]->(t)
  SET x.evidence_code = r.evidence_code;

// ---- Variant AFFECTS Gene --------------------------------------------
LOAD CSV WITH HEADERS FROM 'file:///rel_variant_gene.csv' AS r
MATCH (v:Variant {id: r.variant_id})
MATCH (g:Gene {symbol: r.gene})
MERGE (v)-[x:AFFECTS]->(g)
  SET x.consequence = r.consequence;

// ---- Variant IMPLICATED_IN Disease -----------------------------------
LOAD CSV WITH HEADERS FROM 'file:///rel_variant_disease.csv' AS r
MATCH (v:Variant {id: r.variant_id})
MATCH (d:Disease {id: r.disease_id})
MERGE (v)-[x:IMPLICATED_IN]->(d)
  SET x.clinical_significance = r.clinical_significance,
      x.source = r.source;
