import { test, expect } from '@playwright/test';

// Chaque exécution crée son propre compte : la base du conteneur n'est pas remise à zéro
// entre les runs, et un email fixe échouerait en 409 au deuxième passage.
function emailUnique(suffixe) {
  return `e2e-${suffixe}-${process.env.E2E_RUN_ID || Date.now()}@test.dev`;
}

const MOT_DE_PASSE = 'motdepasse123';

async function creerCompte(page, suffixe) {
  await page.goto('/register');
  await page.getByLabel('Email').fill(emailUnique(suffixe));
  await page.getByLabel('Mot de passe').fill(MOT_DE_PASSE);
  await page.getByRole('button', { name: 'Créer mon compte' }).click();
  await expect(page).toHaveURL(/\/onboarding$/);
}

async function remplirQuestionnaire(page, { objectif = 'Perdre du poids' } = {}) {
  await page.getByLabel('Taille (cm)').fill('170');
  await page.getByLabel('Poids (kg)').fill('65');
  await page.getByLabel('Âge').fill('30');
  await page.getByLabel('Sexe').selectOption({ label: 'Femme' });
  await page.getByLabel("Niveau d'activité").selectOption({ label: 'Modérément actif (3-5 fois/semaine)' });
  await page.getByLabel('Objectif').selectOption({ label: objectif });
  await page.getByRole('button', { name: 'Valider' }).click();
  await expect(page).toHaveURL(/\/$/);
}

test.describe('parcours complet', () => {
  test("inscription, questionnaire et objectif calorique calculé", async ({ page }) => {
    await creerCompte(page, 'objectif');
    await remplirQuestionnaire(page);

    // Femme 65 kg / 170 cm / 30 ans, modérément active, -500 kcal :
    // BMR 1401,5 → TDEE 2172 → objectif 1672. Le nombre vient du serveur, donc l'assertion
    // couvre la chaîne complète navigateur → API → calcul → rendu.
    await expect(page.getByText('1672', { exact: false }).first()).toBeVisible();
  });

  test('création d\'un aliment personnalisé puis ajout au journal', async ({ page }) => {
    await creerCompte(page, 'aliment');
    await remplirQuestionnaire(page);

    await page.goto('/scan');
    await page.getByRole('button', { name: /Rechercher/ }).click();

    // Passer par un aliment personnalisé plutôt que par la recherche Open Food Facts :
    // le test ne doit pas dépendre d'un appel réseau sortant, indisponible en CI.
    await page.getByRole('button', { name: /Créez-le vous-même/ }).click();
    await page.getByLabel('Nom').fill('Galette de test');
    await page.getByLabel('Calories pour 100 g').fill('400');
    await page.getByLabel('Protéines (g)').fill('10');
    await page.getByLabel('Glucides (g)').fill('70');
    await page.getByLabel('Lipides (g)').fill('8');
    await page.getByRole('button', { name: /Créer et ajouter/ }).click();

    // Le modal de quantité s'ouvre sur l'aliment créé.
    const quantite = page.getByLabel('Quantité (g)');
    await expect(quantite).toBeVisible();
    await quantite.fill('50');
    await page.getByRole('button', { name: 'Ajouter', exact: true }).click();

    // Retour au journal, qui doit afficher l'aliment et ses calories absolues :
    // 400 kcal/100 g × 50 g = 200 kcal.
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByText('Galette de test')).toBeVisible();
    await expect(page.getByText('200', { exact: false }).first()).toBeVisible();
  });

  test('pesée enregistrée et visible dans le suivi', async ({ page }) => {
    await creerCompte(page, 'pesee');
    await remplirQuestionnaire(page);

    await page.goto('/history');
    await page.getByLabel('Poids du jour (kg)').fill('63.5');
    await page.getByRole('button', { name: /Enregistrer/ }).click();

    await expect(page.getByText('63.5 kg')).toBeVisible();
    // Le graphique est du SVG écrit à la main : son rôle et son libellé accessibles sont
    // la seule prise stable dessus.
    await expect(page.getByRole('img', { name: /Poids/i })).toBeVisible();
  });

  test('session restaurée après rechargement, puis déconnexion', async ({ page }) => {
    await creerCompte(page, 'session');
    await remplirQuestionnaire(page);

    await page.reload();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('heading', { name: "Aujourd'hui" })).toBeVisible();

    await page.goto('/profile');
    await page.getByRole('button', { name: /déconnecter/i }).click();
    await expect(page).toHaveURL(/\/login$/);

    // Une route protégée doit renvoyer vers /login une fois la session effacée.
    await page.goto('/');
    await expect(page).toHaveURL(/\/login$/);
  });

  // `attendu` est un minimum de champs, pas une décoration : sans lui, une page pas encore
  // rendue ne présente aucun champ et le test passerait à vide en ne vérifiant rien.
  const PAGES_AVEC_CHAMPS = [
    { url: '/history', pret: 'Poids du jour (kg)', attendu: 1 },
    { url: '/profile', pret: 'Taille (cm)', attendu: 7 },
    { url: '/scan', pret: 'Rechercher un aliment', attendu: 1, onglet: /Rechercher/ },
  ];

  for (const { url, pret, attendu, onglet } of PAGES_AVEC_CHAMPS) {
    test(`les champs de ${url} ont tous un nom accessible`, async ({ page }) => {
      await creerCompte(page, `a11y${url.replace(/\W/g, '')}`);
      await remplirQuestionnaire(page);

      await page.goto(url);
      if (onglet) await page.getByRole('button', { name: onglet }).click();
      // Attendre un champ connu garantit que React a rendu avant de compter.
      await expect(page.getByLabel(pret, { exact: false }).or(page.getByPlaceholder(pret)).first()).toBeVisible();

      const champs = page.locator('input:visible, select:visible, textarea:visible');
      expect(await champs.count(), `nombre de champs sur ${url}`).toBeGreaterThanOrEqual(attendu);

      const sansNom = await champs.evaluateAll((els) =>
        els
          .filter((el) => {
            if (el.getAttribute('aria-label') || el.getAttribute('aria-labelledby')) return false;
            if (el.getAttribute('placeholder')) return false;
            const id = el.getAttribute('id');
            return !(id && document.querySelector(`label[for="${id}"]`));
          })
          .map((el) => el.outerHTML.slice(0, 90)),
      );
      expect(sansNom, `champs sans nom accessible sur ${url}`).toEqual([]);
    });
  }
});
