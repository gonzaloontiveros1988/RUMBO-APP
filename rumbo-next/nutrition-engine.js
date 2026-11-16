// RUMBO Nutrition Engine — free, local calculations only.
// Generic nutrient references are estimates based on common USDA FoodData Central entries.
// Product labels and weighed ingredients take precedence; unknown foods remain uncalculated.
const FOODS = {
  "pechuga de pollo":{raw:[120,22.5,0,2.6],cooked:[165,31,0,3.6]},
  "pollo":{raw:[120,22.5,0,2.6],cooked:[165,31,0,3.6]},
  "pechuga de pavo":{raw:[114,23.7,0,1.5],cooked:[135,29,0,1.6]},
  "pavo":{raw:[114,23.7,0,1.5],cooked:[135,29,0,1.6]},
  "pavo picado magro":{raw:[150,22,0,7],cooked:[190,28,0,8]},
  "ternera magra":{raw:[137,21.4,0,5],cooked:[217,26,0,11]},
  "carne de vacuno magra":{raw:[137,21.4,0,5],cooked:[217,26,0,11]},
  "salmon":{raw:[208,20.4,0,13.4],cooked:[206,22.1,0,12.4]},
  "salmon fresco":{raw:[208,20.4,0,13.4],cooked:[206,22.1,0,12.4]},
  "merluza":{raw:[86,17.2,0,1.5],cooked:[90,19,0,1.3]},
  "bacalao":{raw:[82,17.8,0,0.7],cooked:[105,23,0,0.9]},
  "gambas":{raw:[85,20.1,0.2,0.5],cooked:[99,24,0.2,0.3]},
  "langostinos":{raw:[85,20.1,0.2,0.5],cooked:[99,24,0.2,0.3]},
  "atun al natural escurrido":{raw:[116,25.5,0,0.8],cooked:[116,25.5,0,0.8]},
  "huevo":{raw:[143,12.6,0.7,9.5],cooked:[155,12.6,1.1,10.6]},
  "huevos":{raw:[143,12.6,0.7,9.5],cooked:[155,12.6,1.1,10.6]},
  "claras de huevo":{raw:[52,10.9,0.7,0.2],cooked:[52,10.9,0.7,0.2]},
  "yogur griego 0%":{raw:[59,10.3,3.6,0.4],cooked:[59,10.3,3.6,0.4]},
  "yogur griego natural":{raw:[97,9,3.9,5]},
  "yogur natural":{raw:[61,3.5,4.7,3.3]},
  "queso cottage 2%":{raw:[82,11.1,3.4,2.3]},
  "queso fresco batido 0%":{raw:[46,8,3.5,0.2]},
  "copos de avena":{raw:[389,16.9,66.3,6.9]},
  "avena":{raw:[389,16.9,66.3,6.9]},
  "arroz blanco":{raw:[360,7,80,0.7],cooked:[130,2.7,28.2,0.3]},
  "arroz integral":{raw:[370,7.5,77,2.7],cooked:[123,2.7,25.6,1]},
  "quinoa":{raw:[368,14.1,64.2,6.1],cooked:[120,4.4,21.3,1.9]},
  "pasta integral":{raw:[350,13,70,2.5],cooked:[149,5.5,30,1.1]},
  "pasta":{raw:[371,13,75,1.5],cooked:[158,5.8,30.9,0.9]},
  "patata":{raw:[77,2,17.5,0.1],cooked:[87,1.9,20.1,0.1]},
  "boniato":{raw:[86,1.6,20.1,0.1],cooked:[90,2,20.7,0.2]},
  "garbanzos cocidos":{raw:[164,8.9,27.4,2.6],cooked:[164,8.9,27.4,2.6]},
  "lentejas cocidas":{raw:[116,9,20.1,0.4],cooked:[116,9,20.1,0.4]},
  "tofu":{raw:[144,17.3,2.8,8.7],cooked:[145,17.5,3,8.7]},
  "tomate":{raw:[18,0.9,3.9,0.2],cooked:[18,0.9,3.9,0.2]},
  "cebolla":{raw:[40,1.1,9.3,0.1],cooked:[44,1.4,10.2,0.2]},
  "pimiento rojo":{raw:[31,1,6,0.3],cooked:[31,1,6,0.3]},
  "calabacin":{raw:[17,1.2,3.1,0.3],cooked:[17,1.2,3.1,0.3]},
  "brocoli":{raw:[34,2.8,6.6,0.4],cooked:[35,2.4,7.2,0.4]},
  "espinacas":{raw:[23,2.9,3.6,0.4],cooked:[23,3,3.8,0.3]},
  "champiñones":{raw:[22,3.1,3.3,0.3],cooked:[28,3.6,4.1,0.5]},
  "pepino":{raw:[15,0.7,3.6,0.1]},
  "lechuga":{raw:[15,1.4,2.9,0.2]},
  "arandanos":{raw:[57,0.7,14.5,0.3]},
  "fresas":{raw:[32,0.7,7.7,0.3]},
  "platano":{raw:[89,1.1,22.8,0.3]},
  "manzana":{raw:[52,0.3,13.8,0.2]},
  "aguacate":{raw:[160,2,8.5,14.7]},
  "aceite de oliva":{raw:[884,0,0,100]},
  "pan integral":{raw:[247,13,41,4.2]},
  "almendras":{raw:[579,21.2,21.6,49.9]},
  "nueces":{raw:[654,15.2,13.7,65.2]},
  "semillas de chia":{raw:[486,16.5,42.1,30.7]},
  "miel":{raw:[304,0.3,82.4,0]},
  "ajo":{raw:[149,6.4,33.1,0.5]},
  "limon":{raw:[29,1.1,9.3,0.3]},
  "zanahoria":{raw:[41,0.9,9.6,0.2]},
  "coliflor":{raw:[25,1.9,5,0.3]},
  "soja":{raw:[53,8,5,1.7]}
};
const ALIASES = [
  [/pechuga de pollo|pollo/i,"pechuga de pollo"],[/pechuga de pavo|pavo cocido/i,"pechuga de pavo"],
  [/pavo picado|carne picada de pavo/i,"pavo picado magro"],[/ternera|vacuno/i,"ternera magra"],
  [/salm[oó]n/i,"salmon"],[/merluza/i,"merluza"],[/bacalao|cod/i,"bacalao"],
  [/gamba|langostino|shrimp/i,"gambas"],[/at[uú]n.*(?:natural|agua)|tuna/i,"atun al natural escurrido"],
  [/clara/i,"claras de huevo"],[/huevo/i,"huevo"],[/yogur griego 0|yogur.*desnatado/i,"yogur griego 0%"],
  [/yogur griego/i,"yogur griego natural"],[/yogur/i,"yogur natural"],[/cottage/i,"queso cottage 2%"],
  [/queso fresco batido/i,"queso fresco batido 0%"],[/avena|oat/i,"copos de avena"],
  [/arroz integral/i,"arroz integral"],[/arroz/i,"arroz blanco"],[/quinoa/i,"quinoa"],
  [/pasta integral/i,"pasta integral"],[/pasta|espagueti|macarr[oó]n/i,"pasta"],
  [/patata|papa/i,"patata"],[/boniato|batata|sweet potato/i,"boniato"],
  [/garbanzo/i,"garbanzos cocidos"],[/lenteja/i,"lentejas cocidas"],[/tofu/i,"tofu"],
  [/tomate/i,"tomate"],[/cebolla/i,"cebolla"],[/pimiento/i,"pimiento rojo"],[/calabac[ií]n/i,"calabacin"],
  [/br[oó]coli/i,"brocoli"],[/espinaca/i,"espinacas"],[/champi/i,"champiñones"],
  [/pepino/i,"pepino"],[/lechuga/i,"lechuga"],[/ar[aá]ndano|blueberr/i,"arandanos"],[/fresa/i,"fresas"],
  [/pl[aá]tano|banana/i,"platano"],[/manzana|apple/i,"manzana"],[/aguacate|avocado/i,"aguacate"],
  [/aceite de oliva/i,"aceite de oliva"],[/pan integral/i,"pan integral"],[/almendra/i,"almendras"],
  [/nueces|walnut/i,"nueces"],[/chia/i,"semillas de chia"],[/miel|honey/i,"miel"],
  [/ajo|garlic/i,"ajo"],[/lim[oó]n|lemon/i,"limon"],[/zanahoria|carrot/i,"zanahoria"],
  [/coliflor|cauliflower/i,"coliflor"],[/salsa de soja|soja/i,"soja"]
];
const round = n => Math.round((Number(n)||0)*10)/10;
export function normalizeFoodName(name=""){
  const value=String(name).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/\([^)]*\)/g," ").replace(/[^a-z0-9% ]/g," ").replace(/\s+/g," ").trim();
  for(const [re,key] of ALIASES)if(re.test(value))return key;
  return value;
}
export function parseQuantityGrams(quantity=""){
  const text=String(quantity||"").toLowerCase().replace(/,/g,".");
  const match=text.match(/(?:^|\s)(\d+(?:\.\d+)?)\s*(kg|kilogramos?|g|gr|gramos?|oz|ounces?|lb|lbs|libras?)\b/i);
  if(!match)return {grams:null,unit:null,value:null,qualifier:/cocid|hervid|asado|horneado|grill|cooked/i.test(text)?"cooked":"raw"};
  const value=Number(match[1]),unit=match[2].toLowerCase();
  const factors={kg:1000,kilogramo:1000,kilogramos:1000,g:1,gr:1,gramo:1,gramos:1,oz:28.3495,ounce:28.3495,ounces:28.3495,lb:453.592,lbs:453.592,libra:453.592,libras:453.592};
  const factor=factors[unit]||1;
  return {grams:round(value*factor),unit,value,qualifier:/cocid|hervid|asado|horneado|grill|cooked/i.test(text)?"cooked":"raw"};
}
export function calculateIngredientNutrition(ingredient){
  const row=Array.isArray(ingredient)?ingredient:[ingredient?.name,ingredient?.quantity,ingredient?.kcal,ingredient?.protein,ingredient?.carbs,ingredient?.fat,ingredient?.rawGrams,ingredient?.cookedGrams,ingredient?.basis];
  const name=String(row[0]||""),quantity=String(row[1]||""),manual=[2,3,4,5].map(i=>Number(row[i])||0);
  const hasManual=manual.some(x=>x>0);
  const parsed=parseQuantityGrams(quantity),rawGrams=Number(row[6])>0?Number(row[6]):(parsed.qualifier==="raw"?parsed.grams:null),cookedGrams=Number(row[7])>0?Number(row[7]):(parsed.qualifier==="cooked"?parsed.grams:null);
  const basis=String(row[8]||parsed.qualifier||"raw").toLowerCase()==="cooked"?"cooked":"raw";
  if(hasManual)return {name,quantity,kcal:round(manual[0]),protein:round(manual[1]),carbs:round(manual[2]),fat:round(manual[3]),rawGrams,cookedGrams,basis,covered:true,source:"recipe-entered-estimate"};
  const key=normalizeFoodName(name),food=FOODS[key],grams=basis==="cooked"?(cookedGrams??parsed.grams):(rawGrams??parsed.grams);
  const values=food?.[basis]||food?.raw;
  if(!values||!(Number(grams)>0))return {name,quantity,kcal:null,protein:null,carbs:null,fat:null,rawGrams,cookedGrams,basis,covered:false,source:"missing-weight-or-food-match"};
  const factor=Number(grams)/100;
  return {name,quantity,kcal:round(values[0]*factor),protein:round(values[1]*factor),carbs:round(values[2]*factor),fat:round(values[3]*factor),rawGrams,cookedGrams,basis,covered:true,source:"generic-food-reference-estimate"};
}
export function calculateRecipeNutrition(recipe={}){
  const ingredients=(recipe.ingredients||[]).map(calculateIngredientNutrition),known=ingredients.filter(x=>x.covered),servings=Math.max(1,Number(recipe.servings)||1),override=recipe.nutritionOverride?.perServing;
  if(override&&["kcal","protein","carbs","fat"].every(k=>Number.isFinite(Number(override[k])))){const perServing=Object.fromEntries(["kcal","protein","carbs","fat"].map(k=>[k,round(override[k])])),total=Object.fromEntries(Object.entries(perServing).map(([k,v])=>[k,Math.round(v*servings)]));return {complete:true,coverage:100,estimated:true,unknownIngredients:[],total,perServing,ingredients,source:"user-entered-recipe-macros"}}
  const totals={kcal:0,protein:0,carbs:0,fat:0};
  for(const item of known)for(const key of Object.keys(totals))totals[key]+=Number(item[key]||0);
  const complete=ingredients.length>0&&known.length===ingredients.length;
  return {complete,coverage:ingredients.length?round(known.length/ingredients.length*100):0,estimated:known.some(x=>x.source!=="recipe-entered-estimate"),unknownIngredients:ingredients.filter(x=>!x.covered).map(x=>x.name),total:Object.fromEntries(Object.entries(totals).map(([k,v])=>[k,Math.round(v)])),perServing:Object.fromEntries(Object.entries(totals).map(([k,v])=>[k,Math.round(v/servings)])),ingredients};
}
export function calculateBatchPortions(recipe,cookedYieldGrams,portionCookedGrams){
  const yieldG=Number(cookedYieldGrams),portionG=Number(portionCookedGrams),nutrition=calculateRecipeNutrition(recipe);
  if(!(yieldG>0&&portionG>0))return {ok:false,error:"Introduce el peso final cocinado y el peso cocinado de cada ración."};
  if(!nutrition.complete)return {ok:false,error:"Completa el peso y los nutrientes de todos los ingredientes antes de calcular el lote.",unknownIngredients:nutrition.unknownIngredients};
  const portions=yieldG/portionG;
  return {ok:true,totalCookedGrams:yieldG,portionCookedGrams:portionG,portions:round(portions),wholePortions:Math.floor(portions),remainderGrams:round(yieldG-Math.floor(portions)*portionG),perPortion:Object.fromEntries(Object.entries(nutrition.total).map(([k,v])=>[k,round(v/portions)])),total:nutrition.total};
}
export function parseShoppingQuantity(quantity){
  const m=String(quantity||"").trim().match(/^(\d+(?:[.,]\d+)?)\s*(.*)$/);
  if(!m)return null;
  return {value:Number(m[1].replace(",",".")),unit:m[2].trim()};
}
export function scaleQuantity(quantity,factor){
  const parsed=parseShoppingQuantity(quantity);
  if(!parsed||!Number.isFinite(factor))return String(quantity||"");
  const amount=round(parsed.value*factor);
  return (Number.isInteger(amount)?String(amount):String(amount).replace(".",","))+(parsed.unit?" "+parsed.unit:"");
}
export function adaptRecipeForGoal(recipe,mode="light"){
  const copy=JSON.parse(JSON.stringify(recipe)),swaps=[];
  const replacements=[
    {test:/nata|crema de leche|heavy cream/i,name:"Yogur griego 0%",factor:1,reason:"Sustituir nata por yogur griego 0%"},
    {test:/mayonesa|mayo/i,name:"Yogur griego 0%",factor:1,reason:"Sustituir mayonesa por yogur griego 0%"},
    {test:/bacon|panceta|guanciale/i,name:"Pechuga de pavo",factor:1,reason:"Cambiar panceta por pavo magro"},
    {test:/chorizo|salchicha/i,name:"Pavo picado magro",factor:1,reason:"Cambiar embutido por pavo picado magro"},
    {test:/queso crema|cream cheese/i,name:"Queso cottage 2%",factor:1,reason:"Cambiar queso crema por cottage 2%"}
  ];
  for(let i=0;i<copy.ingredients.length;i++){
    const row=copy.ingredients[i],name=String(row[0]||""),rule=replacements.find(x=>x.test.test(name));
    if(rule&&mode!=="high-protein"){
      const parsed=parseQuantityGrams(row[1]),grams=Number(row[6])||parsed.grams;
      if(!(grams>0))continue;
      const next=Math.round(grams*rule.factor),unit=String(row[1]).match(/\b(kg|g|gr|gramos?)\b/i)?.[1]||"g";
      copy.ingredients[i]=[rule.name,next+" "+unit,0,0,0,0,next,0,"raw"];
      swaps.push(rule.reason+" ("+name+" → "+rule.name+")");
    }
  }
  if(mode==="high-protein"){\n    const breakfast=copy.category==="Breakfast",name=breakfast?"Claras de huevo":"Pechuga de pollo",grams=(breakfast?100:80)*Math.max(1,Number(copy.servings)||1);\n    copy.ingredients.push([name,grams+" g crudo",0,0,0,0,grams,0,"raw"]);\n    swaps.push("Añadir "+(breakfast?"100 g de claras":"80 g de pechuga de pollo")+" por ración para elevar la proteína.");\n    copy.steps=[...(copy.steps||[]),"Incorpora la proteína añadida y cocínala completamente antes de servir."];\n  }\n  if(mode==="low-carb"){
    for(let i=0;i<copy.ingredients.length;i++){
      const row=copy.ingredients[i],name=String(row[0]||"");
      if(/arroz blanco|pasta|espagueti|macarr[oó]n|patata/i.test(name)){
        const parsed=parseQuantityGrams(row[1]),grams=Number(row[7])||Number(row[6])||parsed.grams;
        if(!(grams>0))continue;
        const replacement=/arroz|patata/i.test(name)?"Coliflor":"Calabacín",next=Math.round(grams*1.5);
        copy.ingredients[i]=[replacement,next+" g",0,0,0,0,next,0,"raw"];
        swaps.push("Cambiar "+name+" por "+replacement.toLowerCase()+" ("+grams+" → "+next+" g).");
      }
    }
  }
  if(!swaps.length&&mode==="light"){for(let i=0;i<copy.ingredients.length;i++){const row=copy.ingredients[i];if(/aceite de oliva/i.test(String(row[0]||""))){const parsed=parseQuantityGrams(row[1]),grams=Number(row[6])||parsed.grams;if(grams>1){const next=Math.max(1,Math.round(grams*.8));copy.ingredients[i]=["Aceite de oliva",next+" g",0,0,0,0,next,0,"raw"];swaps.push("Reducir el aceite medido un 20% ("+grams+" → "+next+" g).");break}}}}\n  if(!swaps.length)return {ok:false,error:"No hay una sustitución segura automática para esta receta. Puedes editar cantidades e ingredientes manualmente."};
  copy.id="adapted-"+(globalThis.crypto?.randomUUID?.()||Date.now().toString(36)),copy.name=copy.name+" · "+({light:"Ligera", "high-protein":"Alta en proteína","low-carb":"Baja en carbohidratos"}[mode]||"Adaptada");
  copy.origin="adapted";copy.sourceTitle=recipe.sourceTitle||recipe.name;copy.nutritionOverride=null;copy.adaptation={mode,swaps,originalRecipeId:recipe.id};
  copy.ingredients=copy.ingredients.map(x=>{if(x.length<9)x.push(0,0,"raw");return x});
  return {ok:true,recipe:copy,swaps};
}
export const NUTRITION_REFERENCE_URL="https://fdc.nal.usda.gov/";
