import test from 'node:test';
import assert from 'node:assert/strict';
import {computeAirfoilAnalysis} from '../src/airfoil-analysis.js';

test('positive angle of attack yields higher relative pressure on lower surface',()=>{
  const a=computeAirfoilAnalysis({alpha:8,flap:10,speed:80,density:1.225,cl:0.95});
  assert.ok(a.pressureLowerPa>a.pressureUpperPa);
  assert.ok(a.deltaPressurePa>0);
});

test('stall flag activates beyond critical angle estimate',()=>{
  const a=computeAirfoilAnalysis({alpha:26,flap:0,speed:70,density:1.225,cl:1.8});
  assert.equal(a.stall,true);
});

test('pressure distribution arrays are complete and finite',()=>{
  const a=computeAirfoilAnalysis({alpha:4,flap:5,speed:60,density:1.1,cl:0.7});
  assert.equal(a.upper.length,25);assert.equal(a.lower.length,25);
  for(const p of [...a.upper,...a.lower]){assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.cp));}
});
