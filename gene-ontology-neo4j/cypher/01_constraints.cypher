// =====================================================================
// 01_constraints.cypher
// Uniqueness constraints (also create backing indexes) + extra indexes.
// Run this FIRST, once, against an empty database.
// Neo4j 5.x syntax.
// =====================================================================

// ---- Node key / uniqueness constraints -------------------------------
CREATE CONSTRAINT gene_symbol IF NOT EXISTS
  FOR (g:Gene) REQUIRE g.symbol IS UNIQUE;

CREATE CONSTRAINT element_id IF NOT EXISTS
  FOR (e:GeneElement) REQUIRE e.id IS UNIQUE;

CREATE CONSTRAINT enhancer_id IF NOT EXISTS
  FOR (e:Enhancer) REQUIRE e.id IS UNIQUE;

CREATE CONSTRAINT tfbs_id IF NOT EXISTS
  FOR (t:TFBindingSite) REQUIRE t.id IS UNIQUE;

CREATE CONSTRAINT tf_symbol IF NOT EXISTS
  FOR (t:TranscriptionFactor) REQUIRE t.symbol IS UNIQUE;

CREATE CONSTRAINT inhibitor_id IF NOT EXISTS
  FOR (i:Inhibitor) REQUIRE i.id IS UNIQUE;

CREATE CONSTRAINT transcript_id IF NOT EXISTS
  FOR (t:Transcript) REQUIRE t.id IS UNIQUE;

CREATE CONSTRAINT protein_id IF NOT EXISTS
  FOR (p:Protein) REQUIRE p.id IS UNIQUE;

CREATE CONSTRAINT disease_id IF NOT EXISTS
  FOR (d:Disease) REQUIRE d.id IS UNIQUE;

CREATE CONSTRAINT pathway_id IF NOT EXISTS
  FOR (p:Pathway) REQUIRE p.id IS UNIQUE;

CREATE CONSTRAINT goterm_id IF NOT EXISTS
  FOR (g:GOTerm) REQUIRE g.id IS UNIQUE;

CREATE CONSTRAINT variant_id IF NOT EXISTS
  FOR (v:Variant) REQUIRE v.id IS UNIQUE;

CREATE CONSTRAINT chromosome_id IF NOT EXISTS
  FOR (c:Chromosome) REQUIRE c.id IS UNIQUE;

// ---- Secondary indexes for common lookups ----------------------------
CREATE INDEX gene_name IF NOT EXISTS      FOR (g:Gene)    ON (g.name);
CREATE INDEX disease_name IF NOT EXISTS   FOR (d:Disease) ON (d.name);
CREATE INDEX element_class IF NOT EXISTS  FOR (e:GeneElement) ON (e.element_class);
CREATE INDEX enhancer_tissue IF NOT EXISTS FOR (e:Enhancer) ON (e.tissue_specificity);
