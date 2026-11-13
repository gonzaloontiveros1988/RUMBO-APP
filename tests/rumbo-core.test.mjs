import {flightMapData} from "../rumbo-next/flight-map.js";
import test from "node:test";
import assert from "node:assert/strict";
import {validateSector,summarizeLogbook} from "../rumbo-next/flight-intelligence.js";
import {classifyDuty,buildMonthlyPlan,buildMonthCells} from "../rumbo-next/monthly-planner.js";
import {validateWorkout,suggestTraining,adaptiveTrainingPlan,workoutStats,ROUTINES} from "../rumbo-next/training-intelligence.js";
import {EXERCISES,suggestNextLoad,validateExerciseEntry} from "../rumbo-next/fitness-engine.js";
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
 const p=buildMonthlyPlan([{date:"2026-11-01",code:"QR123"},{date:"2026-11-03",code:"QR456"}],2026,10);
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

test("flight map accepts ICAO logbook codes and converts them to mapped IATA airports",()=>{
 const m=flightMapData([{from:"OTHH",to:"EGLL",hours:6.5}]);
 assert.equal(m.sectors,1);assert.equal(m.airportCount,2);assert.equal(m.countryCount,2);
});

import {parseWaderCsv} from "../rumbo-next/wader-import.js";

test("Wader CSV separates dated flights, simulator sessions and previous experience",()=>{
 const csv=[
 "isPreviousExperience,isSimulator,flightDate,flightNumber,depAirport,arrAirport,aircraftType,function,totalTime,picTime,dualTime,crossCountryTime,ifrTime,nightTime,sicTime,picusTime,dayTakeoffs,nightTakeoffs,dayLandings,nightLandings,aircraftTailnumber",
 "false,false,2026-11-08,QR101,DOH,LHR,A320,Captain,390,390,0,390,360,45,0,0,1,0,1,0,A7-ABC",
 "false,true,2026-11-09,SIM01,DOH,,A320,FO,120,0,120,0,60,0,120,0,0,0,0,0,",
 "true,false,,, , ,A320,Previous experience,75480,60000,15480,40000,30000,8000,15480,0,0,0,0,0,"
 ].join("\n");
 const parsed=parseWaderCsv(csv);
 assert.equal(parsed.flights.length,1);
 assert.equal(parsed.simulators.length,1);
 assert.equal(parsed.summary.recordedFlightHours,6.5);
 assert.equal(parsed.summary.previousExperienceHours,1258);
 assert.equal(parsed.summary.allTimeHours,1264.5);
 assert.equal(parsed.flights[0].from,"DOH");
 assert.equal(parsed.flights[0].to,"LHR");
});
test("Wader CSV reports date range and potential duplicate candidates",()=>{
 const csv=["isPreviousExperience,isSimulator,flightDate,flightNumber,depAirport,arrAirport,aircraftType,function,totalTime","false,false,2026-11-01,QR1,DOH,LHR,A320,Captain,60","false,false,2026-11-01,QR1,DOH,LHR,A320,Captain,60"].join("\n");
 const parsed=parseWaderCsv(csv);
 assert.equal(parsed.summary.duplicateCandidates,1);
 assert.equal(parsed.summary.dateFrom,"2026-11-01");
 assert.equal(parsed.summary.dateTo,"2026-11-01");
});

import {expandReminders,reminderLabel} from "../rumbo-next/reminders.js";
test("monthly family reminders repeat on the same day and clamp at month end",()=>{
 const r=expandReminders([{id:"bill",title:"Pay electricity",startDate:"2026-11-05",repeat:"monthly"}],"2026-11-01","2027-02-28");
 assert.deepEqual(r.map(x=>x.date),["2026-11-05","2026-12-05","2027-01-05","2027-02-05"]);
});
test("weekly, yearly and one-off reminders expand only in the selected date range",()=>{
 const reminders=[
  {id:"school",title:"Backpack",startDate:"2026-11-07",repeat:"weekly"},
  {id:"birthday",title:"Birthday",startDate:"2026-11-12",repeat:"yearly"},
  {id:"once",title:"Appointment",startDate:"2026-11-10",repeat:"none"}
 ];
 const r=expandReminders(reminders,"2026-11-07","2026-11-21");
 assert.deepEqual(r.map(x=>x.date),["2026-11-07","2026-11-10","2026-11-12","2026-11-14","2026-11-21"]);
 assert.equal(reminderLabel("monthly"),"Cada mes");
});

test("completion is stored per occurrence without completing future monthly reminders",()=>{
 const r=expandReminders([{id:"bill",title:"Electricity",startDate:"2026-11-05",repeat:"monthly",completedDates:["2026-11-05"]}],"2026-11-01","2027-01-31");
 assert.deepEqual(r.map(x=>x.done),[true,false,false]);
});

import {makeMealWeek,financeSummary} from "../rumbo-next/life-intelligence.js";
test("meal planner creates breakfast, lunch and dinner for each day and adapts to roster",()=>{
 const plan=makeMealWeek("2026-11-01",[
  {date:"2026-11-01",code:"QR123",kind:"FLIGHT"},
  {date:"2026-11-02",code:"PSBY",kind:"PSBY"},
  {date:"2026-11-03",code:"OFF",kind:"OFF"}
 ]);
 assert.equal(plan.length,21);
 assert.equal(plan.filter(x=>x.date==="2026-11-01").length,3);
 assert.ok(plan.filter(x=>x.date==="2026-11-01").every(x=>x.context.includes("Flight duty")));
 assert.ok(plan.filter(x=>x.date==="2026-11-02").every(x=>x.context.includes("Standby")));
 assert.ok(plan.filter(x=>x.date==="2026-11-03").every(x=>x.context.includes("Roster OFF")));
});
test("household finance totals stay separated by currency",()=>{
 const summary=financeSummary([
  {date:new Date().toISOString().slice(0,7)+"-01",amount:100,currency:"QAR"},
  {date:new Date().toISOString().slice(0,7)+"-02",amount:50,currency:"EUR"}
 ]);
 assert.equal(summary.byCurrency.QAR,100);
 assert.equal(summary.byCurrency.EUR,50);
});

import {extractDutyTimes} from "../rumbo-next/qatar-pdf-import.js";
test("Qatar roster time extraction keeps report and explicit release times separate",()=>{
 const times=extractDutyTimes("RPT: 05:40 DUTY END: 15:25");
 assert.equal(times.reportTime,"05:40");
 assert.equal(times.endTime,"15:25");
 const partial=extractDutyTimes("RPT: 06:10 PSBY");
 assert.equal(partial.reportTime,"06:10");
 assert.equal(partial.endTime,"");
});
test("Qatar roster takes first and last event times, including training and next-day arrivals",()=>{
 const flight=extractDutyTimes("RPT: 16:50 DOH 18:05 ALA 01:30(+1)");
 assert.equal(flight.reportTime,"16:50");
 assert.equal(flight.endTime,"01:30");
 assert.equal(flight.endDayOffset,1);
 const training=extractDutyTimes("RPT:10:30 A321 DOH 10:30 10:35 RPT:10:35 321DR DOH 10:35 11:35");
 assert.equal(training.reportTime,"10:30");
 assert.equal(training.endTime,"11:35");
});
test("CSV roster parser preserves duty end time when supplied",()=>{
 const rows=parseRosterText("Date,Flight,Report Time,End Time,Route\n12/11/2026,QR123,05:40,14:15,DOH-LHR");
 assert.equal(rows[0].reportTime,"05:40");
 assert.equal(rows[0].endTime,"14:15");
});

test("adaptive fitness does not collapse every moderate-readiness day into mobility",()=>{
 const plan=adaptiveTrainingPlan([],[],{goal:"strength",setting:"gym",daysPerWeek:3,availableMinutes:45,readiness:"Moderate",fatigue:3,sleepHours:7},"2026-11-16");
 assert.ok(plan.some(x=>x.type==="Strength"));
 assert.ok(plan.every(x=>x.minutes<=45));
 assert.ok(plan.length<=6);
});
test("adaptive fitness provides exercise variety and keeps heavy work away from post-flight days",()=>{
 const duties=[{date:"2026-11-17",code:"QR123",kind:"FLIGHT"}];
 const plan=adaptiveTrainingPlan(duties,[],{goal:"strength",setting:"gym",daysPerWeek:3,availableMinutes:45,readiness:"Good",fatigue:1,sleepHours:8},"2026-11-16");
 assert.ok(!plan.some(x=>x.date==="2026-11-17"));
 const next=plan.find(x=>x.date==="2026-11-18");
 assert.ok(!next||next.intensity==="low");
});
test("exercise catalogue validates set, rep and load entries",()=>{
 assert.ok(EXERCISES.length>=10);
 assert.equal(validateExerciseEntry({exerciseId:"bench-press",sets:3,reps:8,weight:40,rpe:7}).length,0);
 assert.ok(validateExerciseEntry({exerciseId:"unknown",sets:0,reps:0,weight:-1,rpe:11}).length>=4);
});
test("load progression only increases after a controlled high-rep set",()=>{
 const history=[{date:"2026-11-12",exercises:[{exerciseId:"bench-press",sets:3,reps:12,weight:40,rpe:7}]}];
 assert.equal(suggestNextLoad(history,"bench-press").status,"increase");
 assert.equal(suggestNextLoad([{date:"2026-11-12",exercises:[{exerciseId:"bench-press",sets:3,reps:6,weight:40,rpe:9.5}]}],"bench-press").status,"hold");
});
