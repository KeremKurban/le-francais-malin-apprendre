#!/usr/bin/env python3
"""Load the generated CSVs into Neo4j via the Bolt driver.

This is an alternative to the `LOAD CSV` Cypher scripts for people who do not
want to copy files into the Neo4j `import/` directory. It reads the CSVs in
../data and MERGEs nodes + relationships using batched UNWIND for speed.

Usage:
    pip install -r requirements.txt
    export NEO4J_URI=bolt://localhost:7687
    export NEO4J_USER=neo4j
    export NEO4J_PASSWORD=your_password
    python scripts/load_neo4j.py           # loads everything
    python scripts/load_neo4j.py --wipe     # delete graph first
"""

from __future__ import annotations

import argparse
import csv
import os
from pathlib import Path

try:
    from neo4j import GraphDatabase
except ImportError:  # pragma: no cover
    raise SystemExit("Missing dependency: pip install -r requirements.txt")

DATA = Path(__file__).resolve().parent.parent / "data"
CYPHER = Path(__file__).resolve().parent.parent / "cypher"


def read(name):
    with (DATA / name).open() as fh:
        return list(csv.DictReader(fh))


# (csv file, cypher) — nodes first, then relationships.
NODE_STEPS = [
    ("chromosomes.csv", "MERGE (c:Chromosome {id:row.id}) SET c.name=row.name, c.assembly=row.assembly"),
    ("genes.csv",
     "MERGE (g:Gene {symbol:row.symbol}) "
     "SET g.name=row.name, g.chromosome=row.chromosome, g.cytoband=row.cytoband, "
     "g.biotype=row.biotype, g.strand=row.strand, g.tss=toInteger(row.tss), "
     "g.organism=row.organism, g.taxon_id=row.taxon_id"),
    ("gene_elements.csv",
     "MERGE (e:GeneElement {id:row.id}) SET e.label=row.label, e.element_class=row.element_class, "
     "e.chromosome=row.chromosome, e.start=toInteger(row.start), e.end=toInteger(row.end), e.strand=row.strand"),
    ("enhancers.csv",
     "MERGE (e:Enhancer {id:row.id}) SET e.chromosome=row.chromosome, e.start=toInteger(row.start), "
     "e.end=toInteger(row.end), e.tissue_specificity=row.tissue_specificity, e.activity_score=toFloat(row.activity_score)"),
    ("tf_binding_sites.csv",
     "MERGE (t:TFBindingSite {id:row.id}) SET t.chromosome=row.chromosome, t.start=toInteger(row.start), "
     "t.end=toInteger(row.end), t.tf_symbol=row.tf_symbol"),
    ("transcription_factors.csv", "MERGE (t:TranscriptionFactor {symbol:row.symbol}) SET t.name=row.name, t.family=row.family"),
    ("inhibitors.csv", "MERGE (i:Inhibitor {id:row.id}) SET i.name=row.name, i.modality=row.modality"),
    ("transcripts.csv", "MERGE (t:Transcript {id:row.id}) SET t.biotype=row.biotype, t.exon_count=toInteger(row.exon_count)"),
    ("proteins.csv", "MERGE (p:Protein {id:row.id}) SET p.uniprot_name=row.uniprot_name, p.full_name=row.full_name"),
    ("diseases.csv", "MERGE (d:Disease {id:row.id}) SET d.name=row.name, d.ontology=row.ontology"),
    ("pathways.csv", "MERGE (p:Pathway {id:row.id}) SET p.name=row.name, p.database=row.database"),
    ("go_terms.csv", "MERGE (g:GOTerm {id:row.id}) SET g.name=row.name, g.aspect=row.aspect"),
    ("variants.csv",
     "MERGE (v:Variant {id:row.id}) SET v.consequence=row.consequence, "
     "v.clinical_significance=row.clinical_significance, v.hgvs_c=row.hgvs_c"),
]

REL_STEPS = [
    ("genes.csv",
     "MATCH (g:Gene {symbol:row.symbol}) MATCH (c:Chromosome {id:row.chromosome}) MERGE (g)-[:LOCATED_ON]->(c)"),
    ("rel_gene_element.csv",
     "MATCH (g:Gene {symbol:row.gene}) MATCH (e:GeneElement {id:row.element_id}) "
     "MERGE (g)-[h:HAS_ELEMENT]->(e) SET h.element_label=row.element_label"),
    ("rel_enhancer_gene.csv",
     "MATCH (e:Enhancer {id:row.enhancer_id}) MATCH (g:Gene {symbol:row.gene}) "
     "MERGE (e)-[x:REGULATES]->(g) SET x.effect=row.effect, x.fold_change=toFloat(row.fold_change), "
     "x.distance_bp=toInteger(row.distance_bp), x.mechanism=row.mechanism, x.tissue=row.tissue, "
     "x.confidence=toFloat(row.confidence), x.evidence=row.evidence"),
    ("rel_tf_bindingsite.csv",
     "MATCH (t:TranscriptionFactor {symbol:row.tf_symbol}) MATCH (b:TFBindingSite {id:row.bindingsite_id}) "
     "MERGE (t)-[bd:BINDS]->(b) SET bd.score=toFloat(row.score)"),
    ("tf_binding_sites.csv",
     "WITH row, split(row.id,':')[0] AS gs MATCH (b:TFBindingSite {id:row.id}) "
     "MATCH (g:Gene {symbol:gs}) MERGE (b)-[:LOCATED_IN_PROMOTER_OF]->(g)"),
    # ACTIVATES / REPRESSES chosen from the effect column (edge type varies per gene)
    ("rel_tf_gene.csv",
     "WITH row WHERE row.effect='activates' MATCH (t:TranscriptionFactor {symbol:row.tf_symbol}) "
     "MATCH (g:Gene {symbol:row.gene}) MERGE (t)-[a:ACTIVATES]->(g) "
     "SET a.activity_multiplier=toFloat(row.activity_multiplier), a.tissue=row.tissue, a.evidence=row.evidence"),
    ("rel_tf_gene.csv",
     "WITH row WHERE row.effect='represses' MATCH (t:TranscriptionFactor {symbol:row.tf_symbol}) "
     "MATCH (g:Gene {symbol:row.gene}) MERGE (t)-[a:REPRESSES]->(g) "
     "SET a.activity_multiplier=toFloat(row.activity_multiplier), a.tissue=row.tissue, a.evidence=row.evidence"),
    ("rel_inhibitor_target.csv",
     "MATCH (i:Inhibitor {id:row.inhibitor_id}) MATCH (g:Gene {symbol:row.gene}) "
     "MERGE (i)-[x:INHIBITS]->(g) SET x.action=row.action, x.mechanism=row.mechanism"),
    ("rel_gene_transcript.csv",
     "MATCH (g:Gene {symbol:row.gene}) MATCH (t:Transcript {id:row.transcript_id}) "
     "MERGE (g)-[x:TRANSCRIBED_TO]->(t) SET x.tag=row.tag"),
    ("rel_transcript_protein.csv",
     "MATCH (t:Transcript {id:row.transcript_id}) MATCH (p:Protein {id:row.protein_id}) MERGE (t)-[:TRANSLATED_TO]->(p)"),
    ("rel_gene_disease.csv",
     "MATCH (g:Gene {symbol:row.gene}) MATCH (d:Disease {id:row.disease_id}) "
     "MERGE (g)-[x:ASSOCIATED_WITH]->(d) SET x.association_type=row.association_type, "
     "x.molecular_effect=row.molecular_effect, x.inheritance=row.inheritance, "
     "x.evidence_level=row.evidence_level, x.source=row.source"),
    ("rel_gene_pathway.csv",
     "MATCH (g:Gene {symbol:row.gene}) MATCH (p:Pathway {id:row.pathway_id}) MERGE (g)-[:PARTICIPATES_IN]->(p)"),
    ("rel_gene_goterm.csv",
     "MATCH (g:Gene {symbol:row.gene}) MATCH (t:GOTerm {id:row.go_id}) "
     "MERGE (g)-[x:ANNOTATED_WITH]->(t) SET x.evidence_code=row.evidence_code"),
    ("rel_variant_gene.csv",
     "MATCH (v:Variant {id:row.variant_id}) MATCH (g:Gene {symbol:row.gene}) "
     "MERGE (v)-[x:AFFECTS]->(g) SET x.consequence=row.consequence"),
    ("rel_variant_disease.csv",
     "MATCH (v:Variant {id:row.variant_id}) MATCH (d:Disease {id:row.disease_id}) "
     "MERGE (v)-[x:IMPLICATED_IN]->(d) SET x.clinical_significance=row.clinical_significance, x.source=row.source"),
]


def run_step(session, csv_file, cypher):
    rows = read(csv_file)
    query = f"UNWIND $rows AS row {cypher}"
    session.run(query, rows=rows)
    return len(rows)


def apply_constraints(session):
    text = (CYPHER / "01_constraints.cypher").read_text()
    for stmt in [s.strip() for s in text.split(";") if s.strip() and not s.strip().startswith("//")]:
        session.run(stmt)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--wipe", action="store_true", help="DETACH DELETE the whole graph first")
    args = ap.parse_args()

    uri = os.environ.get("NEO4J_URI", "bolt://localhost:7687")
    user = os.environ.get("NEO4J_USER", "neo4j")
    pwd = os.environ.get("NEO4J_PASSWORD", "neo4j")

    driver = GraphDatabase.driver(uri, auth=(user, pwd))
    with driver.session() as s:
        if args.wipe:
            print("Wiping graph...")
            s.run("MATCH (n) DETACH DELETE n")
        print("Applying constraints...")
        apply_constraints(s)
        print("Loading nodes...")
        for f, q in NODE_STEPS:
            print(f"  {f:32s} {run_step(s, f, q):5d} rows")
        print("Loading relationships...")
        for f, q in REL_STEPS:
            print(f"  {f:32s} {run_step(s, f, q):5d} rows")
        counts = s.run("MATCH (n) RETURN count(n) AS n").single()["n"]
        rels = s.run("MATCH ()-[r]->() RETURN count(r) AS n").single()["n"]
        print(f"\nDone. {counts} nodes, {rels} relationships.")
    driver.close()


if __name__ == "__main__":
    main()
