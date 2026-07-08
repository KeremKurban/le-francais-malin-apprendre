#!/usr/bin/env python3
"""Generate a POC Neo4j gene-regulation ontology dataset.

The script is deterministic (fixed seed) so the CSVs it emits into ``../data``
are reproducible.  It encodes a small, *curated* seed of well known human genes
together with real disease associations, then programmatically derives the gene
regulatory elements (promoters, enhancers, poly-A signals, UTRs, TF binding
sites, ...), transcripts, proteins, variants and cross references so the graph
is comprehensive without needing hundreds of hand-written rows.

POC scope: at most 100 genes (we ship ~55 curated ones).

Run:
    python scripts/generate_data.py
"""

from __future__ import annotations

import csv
import os
import random
from pathlib import Path

SEED = 42
random.seed(SEED)

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

# --------------------------------------------------------------------------- #
# Curated seed data                                                           #
# --------------------------------------------------------------------------- #
# Each gene: symbol, full name, chromosome band, gene biotype, strand.
# Diseases are attached separately below with association metadata.

GENES = [
    # symbol,   name,                                     chrom,   biotype,          strand
    ("TP53",   "tumor protein p53",                        "17p13.1", "protein_coding", "-"),
    ("BRCA1",  "BRCA1 DNA repair associated",              "17q21.31","protein_coding", "-"),
    ("BRCA2",  "BRCA2 DNA repair associated",              "13q13.1", "protein_coding", "+"),
    ("EGFR",   "epidermal growth factor receptor",         "7p11.2",  "protein_coding", "+"),
    ("KRAS",   "KRAS proto-oncogene, GTPase",              "12p12.1", "protein_coding", "-"),
    ("MYC",    "MYC proto-oncogene, bHLH TF",              "8q24.21", "protein_coding", "+"),
    ("APC",    "APC regulator of WNT signaling pathway",   "5q22.2",  "protein_coding", "+"),
    ("PTEN",   "phosphatase and tensin homolog",           "10q23.31","protein_coding", "+"),
    ("RB1",    "RB transcriptional corepressor 1",         "13q14.2", "protein_coding", "+"),
    ("CFTR",   "CF transmembrane conductance regulator",   "7q31.2",  "protein_coding", "+"),
    ("HBB",    "hemoglobin subunit beta",                  "11p15.4", "protein_coding", "-"),
    ("HTT",    "huntingtin",                               "4p16.3",  "protein_coding", "+"),
    ("DMD",    "dystrophin",                               "Xp21.2",  "protein_coding", "-"),
    ("FMR1",   "FMRP translational regulator 1",           "Xq27.3",  "protein_coding", "+"),
    ("MECP2",  "methyl-CpG binding protein 2",             "Xq28",    "protein_coding", "-"),
    ("APOE",   "apolipoprotein E",                         "19q13.32","protein_coding", "+"),
    ("APP",    "amyloid beta precursor protein",           "21q21.3", "protein_coding", "-"),
    ("PSEN1",  "presenilin 1",                             "14q24.2", "protein_coding", "+"),
    ("SNCA",   "synuclein alpha",                          "4q22.1",  "protein_coding", "-"),
    ("LRRK2",  "leucine rich repeat kinase 2",             "12q12",   "protein_coding", "+"),
    ("SOD1",   "superoxide dismutase 1",                   "21q22.11","protein_coding", "+"),
    ("G6PD",   "glucose-6-phosphate dehydrogenase",        "Xq28",    "protein_coding", "+"),
    ("LDLR",   "low density lipoprotein receptor",         "19p13.2", "protein_coding", "+"),
    ("MLH1",   "mutL homolog 1",                           "3p22.2",  "protein_coding", "+"),
    ("MSH2",   "mutS homolog 2",                           "2p21",    "protein_coding", "+"),
    ("VHL",    "von Hippel-Lindau tumor suppressor",       "3p25.3",  "protein_coding", "+"),
    ("NF1",    "neurofibromin 1",                          "17q11.2", "protein_coding", "+"),
    ("NF2",    "NF2, moesin-ezrin-radixin like",           "22q12.2", "protein_coding", "+"),
    ("TSC1",   "TSC complex subunit 1",                    "9q34.13", "protein_coding", "-"),
    ("TSC2",   "TSC complex subunit 2",                    "16p13.3", "protein_coding", "+"),
    ("FBN1",   "fibrillin 1",                              "15q21.1", "protein_coding", "-"),
    ("COL1A1", "collagen type I alpha 1 chain",            "17q21.33","protein_coding", "-"),
    ("PAH",    "phenylalanine hydroxylase",                "12q23.2", "protein_coding", "-"),
    ("GBA",    "glucosylceramidase beta",                  "1q22",    "protein_coding", "+"),
    ("SMN1",   "survival of motor neuron 1, telomeric",    "5q13.2",  "protein_coding", "+"),
    ("ATM",    "ATM serine/threonine kinase",              "11q22.3", "protein_coding", "+"),
    ("WT1",    "WT1 transcription factor",                 "11p13",   "protein_coding", "-"),
    ("MEN1",   "menin 1",                                  "11q13.1", "protein_coding", "-"),
    ("RET",    "ret proto-oncogene",                       "10q11.21","protein_coding", "+"),
    ("KIT",    "KIT proto-oncogene, RTK",                  "4q12",    "protein_coding", "+"),
    ("ABL1",   "ABL proto-oncogene 1, tyrosine kinase",    "9q34.12", "protein_coding", "+"),
    ("BCR",    "BCR activator of RhoGEF and GTPase",       "22q11.23","protein_coding", "+"),
    ("FLT3",   "fms related receptor tyrosine kinase 3",   "13q12.2", "protein_coding", "-"),
    ("JAK2",   "Janus kinase 2",                           "9p24.1",  "protein_coding", "+"),
    ("IDH1",   "isocitrate dehydrogenase (NADP(+)) 1",     "2q34",    "protein_coding", "-"),
    ("CDKN2A", "cyclin dependent kinase inhibitor 2A",     "9p21.3",  "protein_coding", "-"),
    ("MITF",   "melanocyte inducing transcription factor", "3p13",    "protein_coding", "+"),
    ("VEGFA",  "vascular endothelial growth factor A",     "6p21.1",  "protein_coding", "+"),
    ("TNF",    "tumor necrosis factor",                    "6p21.33", "protein_coding", "+"),
    ("IL6",    "interleukin 6",                            "7p15.3",  "protein_coding", "+"),
    ("INS",    "insulin",                                  "11p15.5", "protein_coding", "-"),
    ("GCK",    "glucokinase",                              "7p13",    "protein_coding", "-"),
    ("HNF1A",  "HNF1 homeobox A",                          "12q24.31","protein_coding", "+"),
    ("F8",     "coagulation factor VIII",                  "Xq28",    "protein_coding", "-"),
    ("F9",     "coagulation factor IX",                    "Xq27.1",  "protein_coding", "+"),
    ("CYP21A2","cytochrome P450 family 21 subfamily A 2",  "6p21.33", "protein_coding", "+"),
]

# gene -> list of (disease_id, disease_name, inheritance, association_type,
#                  effect_direction, evidence, source)
GENE_DISEASE = {
    "TP53":   [("MONDO:0018875", "Li-Fraumeni syndrome", "autosomal_dominant", "causal", "loss_of_function", "strong", "OMIM"),
               ("MONDO:0004993", "breast carcinoma", "somatic", "predisposition", "loss_of_function", "strong", "COSMIC")],
    "BRCA1":  [("MONDO:0007254", "hereditary breast ovarian cancer syndrome", "autosomal_dominant", "causal", "loss_of_function", "strong", "ClinVar")],
    "BRCA2":  [("MONDO:0007254", "hereditary breast ovarian cancer syndrome", "autosomal_dominant", "causal", "loss_of_function", "strong", "ClinVar")],
    "EGFR":   [("MONDO:0005233", "non-small cell lung carcinoma", "somatic", "driver", "gain_of_function", "strong", "COSMIC")],
    "KRAS":   [("MONDO:0005575", "colorectal cancer", "somatic", "driver", "gain_of_function", "strong", "COSMIC"),
               ("MONDO:0009831", "pancreatic carcinoma", "somatic", "driver", "gain_of_function", "strong", "COSMIC")],
    "MYC":    [("MONDO:0009693", "Burkitt lymphoma", "somatic", "driver", "gain_of_function", "strong", "COSMIC")],
    "APC":    [("MONDO:0021056", "familial adenomatous polyposis", "autosomal_dominant", "causal", "loss_of_function", "strong", "OMIM")],
    "PTEN":   [("MONDO:0016063", "Cowden syndrome", "autosomal_dominant", "causal", "loss_of_function", "strong", "OMIM")],
    "RB1":    [("MONDO:0008380", "retinoblastoma", "autosomal_dominant", "causal", "loss_of_function", "strong", "OMIM")],
    "CFTR":   [("MONDO:0009061", "cystic fibrosis", "autosomal_recessive", "causal", "loss_of_function", "definitive", "OMIM")],
    "HBB":    [("MONDO:0011382", "sickle cell anemia", "autosomal_recessive", "causal", "altered_function", "definitive", "OMIM"),
               ("MONDO:0009902", "beta thalassemia", "autosomal_recessive", "causal", "loss_of_function", "definitive", "OMIM")],
    "HTT":    [("MONDO:0007739", "Huntington disease", "autosomal_dominant", "causal", "gain_of_function", "definitive", "OMIM")],
    "DMD":    [("MONDO:0010679", "Duchenne muscular dystrophy", "x_linked_recessive", "causal", "loss_of_function", "definitive", "OMIM")],
    "FMR1":   [("MONDO:0010383", "fragile X syndrome", "x_linked_dominant", "causal", "loss_of_function", "definitive", "OMIM")],
    "MECP2":  [("MONDO:0010726", "Rett syndrome", "x_linked_dominant", "causal", "loss_of_function", "definitive", "OMIM")],
    "APOE":   [("MONDO:0004975", "Alzheimer disease", "risk_factor", "susceptibility", "risk_allele", "strong", "GWAS")],
    "APP":    [("MONDO:0004975", "Alzheimer disease", "autosomal_dominant", "causal", "gain_of_function", "strong", "OMIM")],
    "PSEN1":  [("MONDO:0004975", "Alzheimer disease", "autosomal_dominant", "causal", "gain_of_function", "definitive", "OMIM")],
    "SNCA":   [("MONDO:0005180", "Parkinson disease", "autosomal_dominant", "causal", "gain_of_function", "strong", "OMIM")],
    "LRRK2":  [("MONDO:0005180", "Parkinson disease", "autosomal_dominant", "causal", "gain_of_function", "strong", "OMIM")],
    "SOD1":   [("MONDO:0004976", "amyotrophic lateral sclerosis", "autosomal_dominant", "causal", "gain_of_function", "strong", "OMIM")],
    "G6PD":   [("MONDO:0010214", "glucose-6-phosphate dehydrogenase deficiency", "x_linked_recessive", "causal", "loss_of_function", "definitive", "OMIM")],
    "LDLR":   [("MONDO:0007750", "familial hypercholesterolemia", "autosomal_dominant", "causal", "loss_of_function", "definitive", "OMIM")],
    "MLH1":   [("MONDO:0005835", "Lynch syndrome", "autosomal_dominant", "causal", "loss_of_function", "strong", "OMIM")],
    "MSH2":   [("MONDO:0005835", "Lynch syndrome", "autosomal_dominant", "causal", "loss_of_function", "strong", "OMIM")],
    "VHL":    [("MONDO:0008667", "von Hippel-Lindau disease", "autosomal_dominant", "causal", "loss_of_function", "definitive", "OMIM")],
    "NF1":    [("MONDO:0018975", "neurofibromatosis type 1", "autosomal_dominant", "causal", "loss_of_function", "definitive", "OMIM")],
    "NF2":    [("MONDO:0007034", "neurofibromatosis type 2", "autosomal_dominant", "causal", "loss_of_function", "definitive", "OMIM")],
    "TSC1":   [("MONDO:0001734", "tuberous sclerosis", "autosomal_dominant", "causal", "loss_of_function", "strong", "OMIM")],
    "TSC2":   [("MONDO:0001734", "tuberous sclerosis", "autosomal_dominant", "causal", "loss_of_function", "strong", "OMIM")],
    "FBN1":   [("MONDO:0007947", "Marfan syndrome", "autosomal_dominant", "causal", "dominant_negative", "definitive", "OMIM")],
    "COL1A1": [("MONDO:0019019", "osteogenesis imperfecta", "autosomal_dominant", "causal", "dominant_negative", "definitive", "OMIM")],
    "PAH":    [("MONDO:0009861", "phenylketonuria", "autosomal_recessive", "causal", "loss_of_function", "definitive", "OMIM")],
    "GBA":    [("MONDO:0018150", "Gaucher disease", "autosomal_recessive", "causal", "loss_of_function", "definitive", "OMIM"),
               ("MONDO:0005180", "Parkinson disease", "risk_factor", "susceptibility", "risk_allele", "strong", "GWAS")],
    "SMN1":   [("MONDO:0001516", "spinal muscular atrophy", "autosomal_recessive", "causal", "loss_of_function", "definitive", "OMIM")],
    "ATM":    [("MONDO:0008840", "ataxia-telangiectasia", "autosomal_recessive", "causal", "loss_of_function", "definitive", "OMIM")],
    "WT1":    [("MONDO:0006058", "Wilms tumor", "autosomal_dominant", "causal", "loss_of_function", "strong", "OMIM")],
    "MEN1":   [("MONDO:0007540", "multiple endocrine neoplasia type 1", "autosomal_dominant", "causal", "loss_of_function", "definitive", "OMIM")],
    "RET":    [("MONDO:0017827", "multiple endocrine neoplasia type 2", "autosomal_dominant", "causal", "gain_of_function", "definitive", "OMIM")],
    "KIT":    [("MONDO:0011719", "gastrointestinal stromal tumor", "somatic", "driver", "gain_of_function", "strong", "COSMIC")],
    "ABL1":   [("MONDO:0011996", "chronic myeloid leukemia", "somatic", "driver", "gain_of_function", "definitive", "COSMIC")],
    "BCR":    [("MONDO:0011996", "chronic myeloid leukemia", "somatic", "driver", "fusion", "definitive", "COSMIC")],
    "FLT3":   [("MONDO:0018874", "acute myeloid leukemia", "somatic", "driver", "gain_of_function", "strong", "COSMIC")],
    "JAK2":   [("MONDO:0009891", "polycythemia vera", "somatic", "driver", "gain_of_function", "definitive", "COSMIC")],
    "IDH1":   [("MONDO:0018177", "glioma", "somatic", "driver", "neomorphic", "strong", "COSMIC")],
    "CDKN2A": [("MONDO:0005105", "melanoma", "autosomal_dominant", "predisposition", "loss_of_function", "strong", "OMIM")],
    "MITF":   [("MONDO:0005105", "melanoma", "risk_factor", "susceptibility", "risk_allele", "moderate", "GWAS")],
    "VEGFA":  [("MONDO:0005010", "diabetic retinopathy", "risk_factor", "susceptibility", "risk_allele", "moderate", "GWAS")],
    "TNF":    [("MONDO:0008383", "rheumatoid arthritis", "risk_factor", "susceptibility", "risk_allele", "strong", "GWAS")],
    "IL6":    [("MONDO:0008383", "rheumatoid arthritis", "risk_factor", "susceptibility", "risk_allele", "moderate", "GWAS")],
    "INS":    [("MONDO:0011073", "permanent neonatal diabetes mellitus", "autosomal_dominant", "causal", "loss_of_function", "strong", "OMIM")],
    "GCK":    [("MONDO:0007449", "maturity-onset diabetes of the young type 2", "autosomal_dominant", "causal", "loss_of_function", "definitive", "OMIM")],
    "HNF1A":  [("MONDO:0007451", "maturity-onset diabetes of the young type 3", "autosomal_dominant", "causal", "loss_of_function", "definitive", "OMIM")],
    "F8":     [("MONDO:0010602", "hemophilia A", "x_linked_recessive", "causal", "loss_of_function", "definitive", "OMIM")],
    "F9":     [("MONDO:0010603", "hemophilia B", "x_linked_recessive", "causal", "loss_of_function", "definitive", "OMIM")],
    "CYP21A2":[("MONDO:0018543", "congenital adrenal hyperplasia", "autosomal_recessive", "causal", "loss_of_function", "definitive", "OMIM")],
}

# A small library of transcription factors and their canonical effect.
TRANSCRIPTION_FACTORS = [
    # symbol, name, family
    ("SP1",   "Sp1 transcription factor",           "zinc_finger"),
    ("TBP",   "TATA-box binding protein",           "general"),
    ("NFKB1", "nuclear factor kappa B subunit 1",   "Rel"),
    ("STAT3", "signal transducer STAT3",            "STAT"),
    ("CREB1", "cAMP responsive element binding 1",  "bZIP"),
    ("E2F1",  "E2F transcription factor 1",         "E2F"),
    ("HIF1A", "hypoxia inducible factor 1 alpha",   "bHLH-PAS"),
    ("GATA1", "GATA binding protein 1",             "GATA"),
    ("YY1",   "YY1 transcription factor",           "zinc_finger"),
    ("CTCF",  "CCCTC-binding factor (insulator)",   "zinc_finger"),
]

# Small-molecule / biologic inhibitors used in the graph.
INHIBITORS = [
    # id,        name,          modality,       target_gene
    ("DB00619",  "imatinib",    "small_molecule", "ABL1"),
    ("DB01259",  "lapatinib",   "small_molecule", "EGFR"),
    ("DB00530",  "erlotinib",   "small_molecule", "EGFR"),
    ("DB08875",  "cabozantinib","small_molecule", "RET"),
    ("DB09079",  "nintedanib",  "small_molecule", "FLT3"),
    ("DB11800",  "ruxolitinib", "small_molecule", "JAK2"),
    ("DB00072",  "trastuzumab", "monoclonal_antibody", "EGFR"),
    ("DB05294",  "vandetanib",  "small_molecule", "KIT"),
]

PATHWAYS = [
    ("R-HSA-73894", "DNA Repair", "Reactome"),
    ("R-HSA-69278", "Cell Cycle, Mitotic", "Reactome"),
    ("R-HSA-162582", "Signal Transduction", "Reactome"),
    ("R-HSA-1640170", "Cell Cycle", "Reactome"),
    ("hsa04010", "MAPK signaling pathway", "KEGG"),
    ("hsa04151", "PI3K-Akt signaling pathway", "KEGG"),
    ("hsa04110", "Cell cycle", "KEGG"),
    ("hsa04630", "JAK-STAT signaling pathway", "KEGG"),
    ("hsa04310", "Wnt signaling pathway", "KEGG"),
    ("hsa04210", "Apoptosis", "KEGG"),
]

# gene -> pathway ids
GENE_PATHWAYS = {
    "TP53": ["R-HSA-69278", "hsa04110", "hsa04210"],
    "BRCA1": ["R-HSA-73894", "R-HSA-1640170"],
    "BRCA2": ["R-HSA-73894"],
    "EGFR": ["hsa04010", "hsa04151", "R-HSA-162582"],
    "KRAS": ["hsa04010", "hsa04151"],
    "MYC": ["hsa04110", "hsa04310"],
    "APC": ["hsa04310"],
    "PTEN": ["hsa04151"],
    "RB1": ["hsa04110", "R-HSA-1640170"],
    "JAK2": ["hsa04630"],
    "ABL1": ["hsa04010"],
    "FLT3": ["hsa04010", "hsa04151"],
    "RET": ["hsa04010"],
    "KIT": ["hsa04010", "hsa04151"],
    "TNF": ["hsa04210"],
    "IL6": ["hsa04630"],
    "VEGFA": ["hsa04151"],
    "ATM": ["R-HSA-73894"],
    "MLH1": ["R-HSA-73894"],
    "MSH2": ["R-HSA-73894"],
}

# GO terms (id, name, aspect)
GO_TERMS = [
    ("GO:0006355", "regulation of DNA-templated transcription", "biological_process"),
    ("GO:0003700", "DNA-binding transcription factor activity", "molecular_function"),
    ("GO:0006281", "DNA repair", "biological_process"),
    ("GO:0008283", "cell population proliferation", "biological_process"),
    ("GO:0006915", "apoptotic process", "biological_process"),
    ("GO:0005634", "nucleus", "cellular_component"),
    ("GO:0005886", "plasma membrane", "cellular_component"),
    ("GO:0004672", "protein kinase activity", "molecular_function"),
]

TISSUES = ["liver", "brain", "blood", "breast", "lung", "colon", "muscle",
           "pancreas", "skin", "kidney", "bone_marrow", "ubiquitous"]

ELEMENT_TYPES_PER_GENE = [
    # label,          class,        upstream_offset_bp (relative to TSS), typical_len
    ("CorePromoter",  "Promoter",   -100,  120),
    ("ProximalPromoter", "Promoter", -300, 200),
    ("TATABox",       "PromoterMotif", -30, 8),
    ("CpGIsland",     "PromoterMotif", -200, 900),
    ("FivePrimeUTR",  "UTR",        50,   180),
    ("ThreePrimeUTR", "UTR",        3000, 800),
    ("PolyASignal",   "PolyASignal", 3800, 6),
    ("Terminator",    "Terminator", 4000, 40),
]


def w(name, header, rows):
    path = DATA_DIR / name
    with path.open("w", newline="") as fh:
        writer = csv.writer(fh)
        writer.writerow(header)
        writer.writerows(rows)
    print(f"  wrote {path.relative_to(DATA_DIR.parent)}  ({len(rows)} rows)")


def base_coord():
    return random.randint(1_000_000, 240_000_000)


def main() -> None:
    print("Generating gene-ontology POC dataset...")

    # ---- Node: Gene -------------------------------------------------------
    gene_rows = []
    gene_tss = {}
    for sym, name, band, biotype, strand in GENES:
        chrom = band.split("p")[0].split("q")[0]
        tss = base_coord()
        gene_tss[sym] = (chrom, tss, strand)
        gene_rows.append([sym, name, f"chr{chrom}", band, biotype, strand, tss, "Homo sapiens", "9606"])
    w("genes.csv",
      ["symbol", "name", "chromosome", "cytoband", "biotype", "strand", "tss", "organism", "taxon_id"],
      gene_rows)

    # ---- Node: Chromosome -------------------------------------------------
    chroms = sorted({r[2] for r in gene_rows}, key=lambda c: c.replace("chr", "").zfill(2))
    w("chromosomes.csv", ["id", "name", "assembly"],
      [[c, c, "GRCh38"] for c in chroms])

    # ---- Node: GeneElement + rel gene->element ----------------------------
    element_rows = []
    gene_element_rows = []
    enhancer_rows = []
    enhancer_gene_rows = []
    tfbs_rows = []
    tf_bind_rows = []
    tf_regulates_rows = []
    for sym, _n, _b, _bt, strand in GENES:
        chrom, tss, strand = gene_tss[sym]
        for label, klass, off, length in ELEMENT_TYPES_PER_GENE:
            eid = f"{sym}:{label}"
            start = tss + off
            end = start + length
            element_rows.append([eid, label, klass, f"chr{chrom}", start, end, strand])
            gene_element_rows.append([sym, eid, label, "HAS_ELEMENT"])

        # 1-2 enhancers per gene, placed at variable distance
        for i in range(random.randint(1, 2)):
            dist = random.choice([-50000, -25000, -12000, 8000, 30000, 120000])
            eid = f"{sym}:Enhancer{i+1}"
            estart = tss + dist
            tissue = random.choice(TISSUES)
            activity = round(random.uniform(0.2, 1.0), 2)
            enhancer_rows.append([eid, "Enhancer", f"chr{chrom}", estart, estart + 500, tissue, activity])
            # Enhancer -> Gene REGULATES edge with rich, gene-specific properties
            effect = "activates"
            fold = round(random.uniform(1.5, 25.0), 1)
            mechanism = random.choice(["chromatin_looping", "enhancer_RNA", "cohesin_mediated"])
            enhancer_gene_rows.append([
                eid, sym, effect, fold, abs(dist), mechanism, tissue,
                round(random.uniform(0.5, 0.99), 2), "Hi-C+eQTL"])

        # transcription-factor binding sites inside the proximal promoter
        for tf_sym, _tfn, _fam in random.sample(TRANSCRIPTION_FACTORS, k=random.randint(2, 4)):
            bsid = f"{sym}:TFBS:{tf_sym}"
            bstart = tss - random.randint(20, 250)
            tfbs_rows.append([bsid, "TFBindingSite", f"chr{chrom}", bstart, bstart + 12, tf_sym])
            tf_bind_rows.append([tf_sym, bsid, round(random.uniform(0.6, 0.99), 2)])
            # TF -> gene ACTIVATES/REPRESSES edge, direction varies by gene
            act = random.random() > 0.35
            tf_regulates_rows.append([
                tf_sym, sym, "activates" if act else "represses",
                round(random.uniform(0.3, 3.0), 2),
                random.choice(TISSUES), "ChIP-seq"])

    w("gene_elements.csv",
      ["id", "label", "element_class", "chromosome", "start", "end", "strand"],
      element_rows)
    w("enhancers.csv",
      ["id", "label", "chromosome", "start", "end", "tissue_specificity", "activity_score"],
      enhancer_rows)
    w("tf_binding_sites.csv",
      ["id", "label", "chromosome", "start", "end", "tf_symbol"], tfbs_rows)
    w("rel_gene_element.csv", ["gene", "element_id", "element_label", "rel"], gene_element_rows)
    w("rel_enhancer_gene.csv",
      ["enhancer_id", "gene", "effect", "fold_change", "distance_bp", "mechanism",
       "tissue", "confidence", "evidence"], enhancer_gene_rows)

    # ---- Node: TranscriptionFactor + edges --------------------------------
    w("transcription_factors.csv", ["symbol", "name", "family"],
      [[s, n, f] for s, n, f in TRANSCRIPTION_FACTORS])
    w("rel_tf_bindingsite.csv", ["tf_symbol", "bindingsite_id", "score"], tf_bind_rows)
    w("rel_tf_gene.csv",
      ["tf_symbol", "gene", "effect", "activity_multiplier", "tissue", "evidence"],
      tf_regulates_rows)

    # ---- Node: Inhibitor / Drug + TARGETS edge ----------------------------
    w("inhibitors.csv", ["id", "name", "modality"],
      [[i, n, m] for i, n, m, _t in INHIBITORS])
    w("rel_inhibitor_target.csv",
      ["inhibitor_id", "gene", "action", "mechanism"],
      [[i, t, "inhibits", "competitive"] for i, _n, _m, t in INHIBITORS])

    # ---- Node: Transcript / Protein + edges -------------------------------
    transcript_rows, protein_rows = [], []
    g2t_rows, t2p_rows = [], []
    for idx, (sym, name, *_ ) in enumerate(GENES):
        tx = f"ENST{100000+idx:08d}"
        pr = f"ENSP{100000+idx:08d}"
        transcript_rows.append([tx, sym, "protein_coding", random.randint(1, 40)])
        protein_rows.append([pr, f"{sym}_HUMAN", name])
        g2t_rows.append([sym, tx, "canonical"])
        t2p_rows.append([tx, pr])
    w("transcripts.csv", ["id", "gene", "biotype", "exon_count"], transcript_rows)
    w("proteins.csv", ["id", "uniprot_name", "full_name"], protein_rows)
    w("rel_gene_transcript.csv", ["gene", "transcript_id", "tag"], g2t_rows)
    w("rel_transcript_protein.csv", ["transcript_id", "protein_id"], t2p_rows)

    # ---- Node: Disease + rel gene->disease --------------------------------
    disease_seen = {}
    gene_disease_rows = []
    for sym, assocs in GENE_DISEASE.items():
        for did, dname, inh, atype, effect, evidence, source in assocs:
            disease_seen[did] = dname
            gene_disease_rows.append([sym, did, atype, effect, inh, evidence, source])
    w("diseases.csv", ["id", "name", "ontology"],
      [[d, n, "MONDO"] for d, n in sorted(disease_seen.items())])
    w("rel_gene_disease.csv",
      ["gene", "disease_id", "association_type", "molecular_effect",
       "inheritance", "evidence_level", "source"], gene_disease_rows)

    # ---- Node: Pathway + edges --------------------------------------------
    w("pathways.csv", ["id", "name", "database"],
      [[p, n, db] for p, n, db in PATHWAYS])
    gp_rows = [[g, pid, "participates_in"] for g, pids in GENE_PATHWAYS.items() for pid in pids]
    w("rel_gene_pathway.csv", ["gene", "pathway_id", "rel"], gp_rows)

    # ---- Node: GOTerm + edges ---------------------------------------------
    w("go_terms.csv", ["id", "name", "aspect"], [[i, n, a] for i, n, a in GO_TERMS])
    go_rows = []
    for sym, *_ in GENES:
        for gid, _gn, _asp in random.sample(GO_TERMS, k=random.randint(1, 3)):
            go_rows.append([sym, gid, random.choice(["IEA", "IDA", "TAS", "ISS"])])
    w("rel_gene_goterm.csv", ["gene", "go_id", "evidence_code"], go_rows)

    # ---- Node: Variant + edges (gene, disease) ----------------------------
    variant_rows, var_gene_rows, var_disease_rows = [], [], []
    consequences = ["missense_variant", "nonsense_variant", "frameshift_variant",
                    "splice_donor_variant", "stop_gained", "inframe_deletion"]
    clin = ["pathogenic", "likely_pathogenic", "uncertain_significance"]
    vid = 0
    for sym, assocs in GENE_DISEASE.items():
        for _ in range(random.randint(1, 2)):
            vid += 1
            rsid = f"rs{random.randint(1_000_000, 99_999_999)}"
            cons = random.choice(consequences)
            sig = random.choice(clin)
            variant_rows.append([rsid, sym, cons, sig, f"c.{random.randint(1,3000)}A>G"])
            var_gene_rows.append([rsid, sym, cons])
            did = assocs[0][0]
            var_disease_rows.append([rsid, did, sig, "ClinVar"])
    w("variants.csv", ["id", "gene", "consequence", "clinical_significance", "hgvs_c"], variant_rows)
    w("rel_variant_gene.csv", ["variant_id", "gene", "consequence"], var_gene_rows)
    w("rel_variant_disease.csv", ["variant_id", "disease_id", "clinical_significance", "source"], var_disease_rows)

    print(f"\nDone. {len(GENES)} genes, {len(disease_seen)} diseases, "
          f"{len(element_rows)+len(enhancer_rows)+len(tfbs_rows)} regulatory elements.")


if __name__ == "__main__":
    main()
