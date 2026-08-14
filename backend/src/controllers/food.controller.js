import { prisma } from '../lib/prisma.js';
import { lookupBarcode, searchByName } from '../services/openFoodFacts.service.js';
import { matchesSearch } from '../services/foodMapper.js';
import { HttpError } from '../middleware/errorHandler.js';

function toCustomFoodDto(food) {
  return {
    id: `custom:${food.id}`,
    foodName: food.foodName,
    caloriesPer100g: food.caloriesPer100g,
    proteinPer100g: food.proteinPer100g,
    carbsPer100g: food.carbsPer100g,
    fatPer100g: food.fatPer100g,
    isCustom: true,
  };
}

export async function getByBarcode(req, res, next) {
  try {
    const result = await lookupBarcode(req.params.barcode);
    if (!result) {
      throw new HttpError(404, 'Produit non trouvé');
    }
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function search(req, res, next) {
  try {
    const query = (req.validatedQuery?.q || '').trim();
    if (!query) {
      return res.json([]);
    }

    // Filtered in JS rather than via Prisma `contains`: SQLite's LIKE doesn't fold
    // accents, so a SQL-level filter would miss "creme" against "crème". Custom foods
    // are scoped per user, so the full list stays small enough to filter in memory.
    const allCustomFoods = await prisma.customFood.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
    });
    const customFoods = allCustomFoods.filter((food) => matchesSearch(food.foodName, query)).slice(0, 10);

    let offResults = [];
    try {
      offResults = await searchByName(query);
    } catch (err) {
      // Un aliment personnalisé reste consultable même si Open Food Facts est indisponible.
      console.error('[food.controller] recherche Open Food Facts indisponible', err);
    }

    res.json([...customFoods.map(toCustomFoodDto), ...offResults]);
  } catch (err) {
    next(err);
  }
}

export async function createCustom(req, res, next) {
  try {
    const food = await prisma.customFood.create({
      data: { userId: req.userId, ...req.body },
    });
    res.status(201).json(toCustomFoodDto(food));
  } catch (err) {
    next(err);
  }
}
