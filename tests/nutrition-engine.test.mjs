import { test } from "node:test";
import assert from "node:assert/strict";
import { RECIPES, recipeNutrition, makeMealWeek, shoppingFromMeals } from "../rumbo-next/life-intelligence.js";
import { parseQuantityGrams, calculateIngredientNutrition, calculateRecipeNutrition, calculateBatchPortions, adaptRecipeForGoal } from "../rumbo-next/nutrition-engine.js";

test("free Mediterranean library has at least nine recipes in each meal category",()=>{
  for(const category of ["Breakfast","Lunch","Dinner"]) assert.ok(RECIPES.filter(x=>x.category===category).length>=9,category);
});

test("quantity parser distinguishes raw and cooked weights and does not convert units it cannot know",()=>{
  assert.equal(parseQuantityGrams("0.15 kg crudo").grams,150);
  assert.equal(parseQuantityGrams("120 g cocido").qualifier,"cooked");
  assert.equal(parseQuantityGrams("1 taza").grams,null);
  assert.equal(parseQuantityGrams("150 ml").grams,null);
});

test("new chicken and quinoa bowl has a complete, calculated macro profile",()=>{
  const recipe=RECIPES.find(x=>x.id==="pollo-quinoa-bowl");
  const n=recipeNutrition(recipe);
  assert.equal(n.complete,true);
  assert.equal(n.coverage,100);
  assert.ok(n.perServing.kcal>250);
  assert.ok(n.perServing.protein>25);
});

test("unknown ingredient quantities are left uncalculated rather than guessed",()=>{
  const n=calculateRecipeNutrition({servings:1,ingredients:[["Ingrediente desconocido","al gusto",0,0,0,0]]});
  assert.equal(n.complete,false);
  assert.deepEqual(n.unknownIngredients,["Ingrediente desconocido"]);
});

test("batch calculator divides the measured cooked yield by the cooked portion weight",()=>{
  const recipe=RECIPES.find(x=>x.id==="pollo-quinoa-bowl");
  const result=calculateBatchPortions(recipe,800,200);
  assert.equal(result.ok,true);
  assert.equal(result.wholePortions,4);
  assert.equal(result.perPortion.kcal,Math.round(recipeNutrition(recipe).total.kcal/4));
});

test("weekly meal plan creates 21 varied meal slots for a four-person household",()=>{
  const week=makeMealWeek("2026-11-16",[],RECIPES,{servings:4});
  assert.equal(week.length,21);
  assert.ok(week.every(x=>x.servings===4));
  for(const category of ["Breakfast","Lunch","Dinner"]){
    const rows=week.filter(x=>x.slot===category||x.slot==="Packed lunch"&&category==="Lunch"||x.slot==="Comida familiar"&&category==="Lunch"||x.slot==="Cena familiar"&&category==="Dinner");
    assert.equal(new Set(rows.map(x=>x.recipeId)).size,rows.length);
  }
});

test("shopping quantities scale to meal servings and subtract matching pantry stock",()=>{
  const recipe={id:"scale-test",name:"Pollo y tomate",category:"Lunch",servings:1,ingredients:[["Pechuga de pollo","150 g crudo",0,0,0,0,150,0,"raw"],["Tomate","100 g",0,0,0,0,100,0,"raw"]],steps:["Cocinar."]};
  const items=shoppingFromMeals([{recipeId:"scale-test",servings:4}], [recipe], [{name:"Pechuga de pollo",qty:"100 g"}]);
  assert.equal(items.find(x=>x.name==="Pechuga de pollo").qty,"500 g");
  assert.equal(items.find(x=>x.name==="Tomate").qty,"400 g");
});

test("light, high-protein and low-carb variants are separate recipes with explicit changes",()=>{
  const recipe=RECIPES.find(x=>x.id==="wok-gambas-arroz");
  const light=adaptRecipeForGoal(recipe,"light");
  const protein=adaptRecipeForGoal(recipe,"high-protein");
  const lowCarb=adaptRecipeForGoal(recipe,"low-carb");
  assert.equal(light.ok,true);
  assert.equal(protein.ok,true);
  assert.equal(lowCarb.ok,true);
  assert.notEqual(lowCarb.recipe.id,recipe.id);
  assert.ok(protein.recipe.ingredients.some(x=>x[0]==="Pechuga de pollo"));
  assert.ok(lowCarb.recipe.ingredients.some(x=>x[0]==="Coliflor"));
});

test("manual nutrition overrides are explicit and supported for user-entered recipes",()=>{
  const n=calculateRecipeNutrition({servings:2,nutritionOverride:{perServing:{kcal:400,protein:35,carbs:40,fat:10}},ingredients:[["Ingrediente sin datos","al gusto",0,0,0,0]]});
  assert.equal(n.complete,true);
  assert.equal(n.total.kcal,800);
  assert.equal(n.perServing.protein,35);
});
