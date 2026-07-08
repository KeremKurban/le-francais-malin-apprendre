// =====================================================================
// 02_load_nodes.cypher
// Bulk-load every node label from the CSVs in the Neo4j import directory.
//
// Prereq: copy the contents of ../data into your Neo4j `import/` folder
//         (or launch with docker-compose which mounts it there), then run
//         this file after 01_constraints.cypher.
//
// All MERGE keys are backed by the constraints created in step 1.
// =====================================================================

// ---- Chromosome ------------------------------------------------------
LOAD CSV WITH HEADERS FROM 'file:///chromosomes.csv' AS r
MERGE (c:Chromosome {id: r.id})
  SET c.name = r.name, c.assembly = r.assembly;

// ---- Gene ------------------------------------------------------------
LOAD CSV WITH HEADERS FROM 'file:///genes.csv' AS r
MERGE (g:Gene {symbol: r.symbol})
  SET g.name       = r.name,
      g.chromosome = r.chromosome,
      g.cytoband   = r.cytoband,
      g.biotype    = r.biotype,
      g.strand     = r.strand,
      g.tss        = toInteger(r.tss),
      g.organism   = r.organism,
      g.taxon_id   = r.taxon_id;

// ---- GeneElement (promoters, UTRs, poly-A signals, terminators, ...) --
// The concrete subtype is kept in `label`/`element_class`. Run the optional
// APOC step in 04_optional_apoc.cypher to also stamp it as a real node label.
LOAD CSV WITH HEADERS FROM 'file:///gene_elements.csv' AS r
MERGE (e:GeneElement {id: r.id})
  SET e.label         = r.label,
      e.element_class = r.element_class,
      e.chromosome    = r.chromosome,
      e.start         = toInteger(r.start),
      e.end           = toInteger(r.end),
      e.strand        = r.strand;

// ---- Enhancer --------------------------------------------------------
LOAD CSV WITH HEADERS FROM 'file:///enhancers.csv' AS r
MERGE (e:Enhancer {id: r.id})
  SET e.chromosome         = r.chromosome,
      e.start              = toInteger(r.start),
      e.end                = toInteger(r.end),
      e.tissue_specificity = r.tissue_specificity,
      e.activity_score     = toFloat(r.activity_score);

// ---- TFBindingSite ---------------------------------------------------
LOAD CSV WITH HEADERS FROM 'file:///tf_binding_sites.csv' AS r
MERGE (t:TFBindingSite {id: r.id})
  SET t.chromosome = r.chromosome,
      t.start      = toInteger(r.start),
      t.end        = toInteger(r.end),
      t.tf_symbol  = r.tf_symbol;

// ---- TranscriptionFactor --------------------------------------------
LOAD CSV WITH HEADERS FROM 'file:///transcription_factors.csv' AS r
MERGE (t:TranscriptionFactor {symbol: r.symbol})
  SET t.name = r.name, t.family = r.family;

// ---- Inhibitor / Drug ------------------------------------------------
LOAD CSV WITH HEADERS FROM 'file:///inhibitors.csv' AS r
MERGE (i:Inhibitor {id: r.id})
  SET i.name = r.name, i.modality = r.modality;

// ---- Transcript ------------------------------------------------------
LOAD CSV WITH HEADERS FROM 'file:///transcripts.csv' AS r
MERGE (t:Transcript {id: r.id})
  SET t.biotype = r.biotype, t.exon_count = toInteger(r.exon_count);

// ---- Protein ---------------------------------------------------------
LOAD CSV WITH HEADERS FROM 'file:///proteins.csv' AS r
MERGE (p:Protein {id: r.id})
  SET p.uniprot_name = r.uniprot_name, p.full_name = r.full_name;

// ---- Disease ---------------------------------------------------------
LOAD CSV WITH HEADERS FROM 'file:///diseases.csv' AS r
MERGE (d:Disease {id: r.id})
  SET d.name = r.name, d.ontology = r.ontology;

// ---- Pathway ---------------------------------------------------------
LOAD CSV WITH HEADERS FROM 'file:///pathways.csv' AS r
MERGE (p:Pathway {id: r.id})
  SET p.name = r.name, p.database = r.database;

// ---- GOTerm ----------------------------------------------------------
LOAD CSV WITH HEADERS FROM 'file:///go_terms.csv' AS r
MERGE (g:GOTerm {id: r.id})
  SET g.name = r.name, g.aspect = r.aspect;

// ---- Variant ---------------------------------------------------------
LOAD CSV WITH HEADERS FROM 'file:///variants.csv' AS r
MERGE (v:Variant {id: r.id})
  SET v.consequence            = r.consequence,
      v.clinical_significance  = r.clinical_significance,
      v.hgvs_c                 = r.hgvs_c;
