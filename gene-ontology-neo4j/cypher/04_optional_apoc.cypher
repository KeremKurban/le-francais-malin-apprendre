// =====================================================================
// 04_optional_apoc.cypher   (OPTIONAL — requires the APOC plugin)
// Promote the `label` property on GeneElement nodes to a real, queryable
// secondary node label (Promoter, UTR, PolyASignal, Terminator, ...).
//
// Without APOC every regulatory element stays queryable via
//   MATCH (e:GeneElement {element_class:'Promoter'})
// This step just makes  MATCH (e:Promoter)  work too.
// =====================================================================

MATCH (e:GeneElement)
CALL apoc.create.addLabels(e, [e.label, e.element_class]) YIELD node
RETURN count(node) AS labelled_elements;
