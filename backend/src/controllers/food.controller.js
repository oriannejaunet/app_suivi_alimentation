import { prisma } from '../lib/prisma.js';
import { lookupBarcode, searchByName } from '../services/openFoodFacts.service.js';
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
    const query = (req.query.q || '').trim();
    if (!query) {
      return res.json([]);
    }

    const customFoods = await prisma.customFood.findMany({
      where: { userId: req.userId, foodName: { contains: query } },
      take: 10,
      orderBy: { createdAt: 'desc' },
    });

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
