import test from "node:test";
import assert from "node:assert/strict";
import {validateSector,summarizeLogbook} from "../rumbo-next/flight-intelligence.js";
import {classifyDuty,buildMonthlyPlan,buildMonthCells} from "../rumbo-next/monthly-planner.js";
import {validateWorkout,suggestTraining,workoutStats,ROUTINES} from "../rumbo-next/training-intelligence.js";
import {parseRosterText} from "../rumbo-next/roster-import.js";

test("logbook rejects invalid ICAO and impossible block times",()=>{
 assert.equal(validateSector({date:"2026-11-01",from:"DOH",to:"LHR",hours:7}).length,2);
 assert.equal(validateSector({date:"2026-11-01",from:"OTHH",to:"EGLL",hours:7}).length,0);
});
test("logbook analytics aggregate recorded sectors",()=>{
 const x=summarizeLogbook([{date:"2026-11-01",from:"OTHH",to:"EGLL",hours:7},{date:"2026-11-02",from:"EGLL",to:"OTHH",hours:6}]);
 assert.equal(x.sectors,2);assert.equal(x.hours,13);assert.equal(x.airports,2);
});
test("roster classifier distinguishes standby, OFF and training",()=>{
 assert.equal(classifyDuty({code:"PSBY"}),"STANDBY");
 assert.equal(classifyDuty({code:"OFF"}),"OFF");
 assert.equal(classifyDuty({code:"GRND"}),"TRAINING");
});
test("monthly plan never treats an unassigned date as confirmed OFF",()=>{
 const p=buildMonthlyPlan([{date:"2026-11-01",code:"QR123"}],2026,10);
 assert.ok(p.some(x=>x.kind==="verify"));
 assert.ok(!p.some(x=>x.kind==="availability"&&x.date==="2026-11-02"));
 assert.equal(buildMonthCells(2026,10,[]).length%7,0);
});
test("training proposals only target dates without imported duties",()=>{
 const p=suggestTraining([{date:"2026-11-01",code:"QR123"}],2026,10,[]);
 assert.ok(p.every(x=>x.date!=="2026-11-01"));
 assert.ok(p.every(x=>x.status==="candidate"));
 assert.ok(ROUTINES.length>=5);
});
test("workout validation rejects empty and oversized sessions",()=>{
 assert.ok(validateWorkout({date:"2026-11-01",type:"Strength",minutes:0}).length);
 assert.equal(validateWorkout({date:"2026-11-01",type:"Strength",minutes:45}).length,0);
 assert.equal(workoutStats([{minutes:30,type:"Cardio"}]).minutes,30);
});
test("CSV parser handles quoted comma fields and European date",()=>{
 const rows=parseRosterText('Date,Flight,Route\n01/11/2026,QR123,"DOH, LHR"');
 assert.equal(rows.length,1);assert.equal(rows[0].date,"2026-11-01");assert.equal(rows[0].code,"QR123");
});
