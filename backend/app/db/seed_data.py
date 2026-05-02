"""
Seeds the database with FIDE and DELF topics.
Run: python -m app.db.seed_data
"""
import asyncio

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import AsyncSessionLocal, create_tables
from app.models.topic import Topic


FIDE_TOPICS = [
    {"name": "À la banque", "description": "Ouvrir un compte, virement, carte de crédit, change", "level": None, "category": "communication", "swiss_context": True},
    {"name": "Chez le médecin", "description": "Décrire des symptômes, prendre rendez-vous, ordonnance, assurance maladie LAMal", "level": None, "category": "communication", "swiss_context": True},
    {"name": "Transports publics", "description": "CFF, bus, tram, abonnements GA et demi-tarif, horaires", "level": None, "category": "communication", "swiss_context": True},
    {"name": "Logement", "description": "Chercher un appartement, bail, charges, caution, rapport au propriétaire", "level": None, "category": "communication", "swiss_context": True},
    {"name": "Travail et emploi", "description": "CV, entretien d'embauche, contrat de travail, AVS, chômage (RAV)", "level": None, "category": "communication", "swiss_context": True},
    {"name": "Services communaux", "description": "Commune, contrôle des habitants, permis de séjour, déclaration fiscale", "level": None, "category": "communication", "swiss_context": True},
    {"name": "Courses et achats", "description": "Supermarché, marché, réclamation, retour de produit, prix", "level": None, "category": "communication", "swiss_context": True},
    {"name": "École et formation", "description": "Inscription scolaire, réunion de parents, orientation professionnelle", "level": None, "category": "communication", "swiss_context": True},
    {"name": "Vie sociale et loisirs", "description": "Invitations, fêtes suisses, associations, bénévolat", "level": None, "category": "communication", "swiss_context": True},
    {"name": "Urgences et problèmes", "description": "Police, pompiers, accident, assurance RC, réclamation formelle", "level": None, "category": "communication", "swiss_context": True},
]

DELF_TOPICS = [
    # A1
    {"name": "Se présenter", "description": "Dire son nom, sa nationalité, son âge, sa profession", "level": "A1", "category": "communication", "swiss_context": False},
    {"name": "Salutations et politesse", "description": "Bonjour, merci, au revoir, s'il vous plaît", "level": "A1", "category": "vocabulary", "swiss_context": False},
    {"name": "Les chiffres et les dates", "description": "Nombres, dates, heures, jours de la semaine", "level": "A1", "category": "vocabulary", "swiss_context": False},
    {"name": "La famille", "description": "Membres de la famille, relations familiales simples", "level": "A1", "category": "vocabulary", "swiss_context": False},
    # A2
    {"name": "La vie quotidienne", "description": "Activités du quotidien, routine, emploi du temps", "level": "A2", "category": "communication", "swiss_context": False},
    {"name": "Les loisirs et hobbies", "description": "Sports, musique, lecture, activités de fin de semaine", "level": "A2", "category": "vocabulary", "swiss_context": False},
    {"name": "Les directions", "description": "Demander et donner son chemin, lieux de la ville", "level": "A2", "category": "communication", "swiss_context": False},
    {"name": "Articles et genre", "description": "Accord des articles définis et indéfinis, genre des noms", "level": "A2", "category": "grammar", "swiss_context": False},
    {"name": "Passé composé", "description": "Formation et usage du passé composé avec avoir et être", "level": "A2", "category": "grammar", "swiss_context": False},
    # B1
    {"name": "Exprimer son opinion", "description": "Donner son avis, nuancer, exprimer l'accord et le désaccord", "level": "B1", "category": "communication", "swiss_context": False},
    {"name": "Le conditionnel", "description": "Conditionnel présent : souhait, conseil, politesse, hypothèse", "level": "B1", "category": "grammar", "swiss_context": False},
    {"name": "Les articulateurs du discours", "description": "Structurer un texte : d'abord, ensuite, cependant, en conclusion", "level": "B1", "category": "writing", "swiss_context": False},
    {"name": "La santé et le bien-être", "description": "Parler de sa santé, conseiller, décrire des symptômes", "level": "B1", "category": "vocabulary", "swiss_context": False},
    {"name": "Le subjonctif", "description": "Subjonctif présent après il faut que, vouloir que, bien que", "level": "B1", "category": "grammar", "swiss_context": False},
    {"name": "Hypothèse avec si", "description": "Si + présent + futur, si + imparfait + conditionnel", "level": "B1", "category": "grammar", "swiss_context": False},
    # B2
    {"name": "Argumentation formelle", "description": "Rédiger une argumentation structurée avec thèse, antithèse, synthèse", "level": "B2", "category": "writing", "swiss_context": False},
    {"name": "Le discours rapporté", "description": "Discours indirect, concordance des temps, verbes de parole", "level": "B2", "category": "grammar", "swiss_context": False},
    {"name": "Registres de langue", "description": "Soutenu, courant, familier : reconnaître et adapter son registre", "level": "B2", "category": "vocabulary", "swiss_context": False},
    {"name": "Société et actualités", "description": "Commenter des faits de société, nuancer, citations et statistiques", "level": "B2", "category": "communication", "swiss_context": False},
    {"name": "La voix passive", "description": "Construction passive, complément d'agent, transformations actif/passif", "level": "B2", "category": "grammar", "swiss_context": False},
]


async def seed():
    await create_tables()
    async with AsyncSessionLocal() as db:
        from sqlalchemy import select, func
        count_result = await db.execute(select(func.count()).select_from(Topic))
        if count_result.scalar() > 0:
            print("Topics already seeded — skipping.")
            return

        for t in FIDE_TOPICS:
            db.add(Topic(exam_type="FIDE", **t))

        for t in DELF_TOPICS:
            db.add(Topic(exam_type="DELF", **t))

        await db.commit()
        print(f"Seeded {len(FIDE_TOPICS)} FIDE topics and {len(DELF_TOPICS)} DELF topics.")


if __name__ == "__main__":
    asyncio.run(seed())
