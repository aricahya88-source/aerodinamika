import test from 'node:test';
import assert from 'node:assert/strict';
import {AIRCRAFT,FlightModel,labCalculation,speedOfSoundAtAltitude} from '../src/physics.js';
import {validateLivery} from '../src/livery.js';
test('A380 dimensions and weight class follow Airbus reference specs',()=>{
 assert.equal(AIRCRAFT.length,72.7);assert.equal(AIRCRAFT.span,79.8);
 assert.equal(AIRCRAFT.wingArea,845);assert.equal(AIRCRAFT.engines,4);
 assert.equal(AIRCRAFT.maxTakeoffMass,575000);assert.ok(AIRCRAFT.mass<AIRCRAFT.maxTakeoffMass);
 assert.equal(AIRCRAFT.maxThrust,AIRCRAFT.engines*AIRCRAFT.thrustPerEngine);
});
test('lift at reference A380 takeoff high-lift condition can exceed reference weight',()=>{
 const r=labCalculation({speed:80,alpha:10,flap:15});
 assert.ok(r.lift>AIRCRAFT.mass*9.80665);
 assert.ok(r.drag>0);
});
test('atmospheric speed of sound decreases by 11km',()=>{
 assert.ok(speedOfSoundAtAltitude(0)>speedOfSoundAtAltitude(11000));
});
test('shared livery validation preserves sane color and length limits',()=>{
 const l=validateLivery({name:'N'.repeat(70),primary:'not a hex',secondary:'#abcdef',opacity:999});
 assert.equal(l.name.length,24);assert.equal(l.primary,'#1b6ba2');assert.equal(l.secondary,'#abcdef');assert.ok(l.opacity<=.65);
});
test('flight telemetry includes physically dimensional Mach estimate',()=>{
 const model=new FlightModel();model.setControl('throttle',1);for(let i=0;i<600;i++)model.step(1/60);
 assert.ok(Number.isFinite(model.telemetry().mach));
});
