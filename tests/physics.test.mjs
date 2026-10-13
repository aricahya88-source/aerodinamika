import test from 'node:test';
import assert from 'node:assert/strict';
import {FlightModel,labCalculation,aeroCoefficients,densityAtAltitude,DEFAULT_LAB,AIRCRAFT} from '../src/physics.js';
import {rotate,invRotate,V,Q,integrateQuaternion,length} from '../src/math.js';
const eq=(a,b,eps=1e-8)=>assert.ok(Math.abs(a-b)<=eps,`${a} ~ ${b}`);

test('zero relative airspeed gives zero lift and drag',()=>{
  const p=labCalculation({...DEFAULT_LAB,speed:0,wind:0});eq(p.lift,0);eq(p.drag,0);
});
test('double airspeed leads to 4x lift and drag under fixed coefficients',()=>{
  const p=labCalculation({...DEFAULT_LAB,speed:20}),q=labCalculation({...DEFAULT_LAB,speed:40});
  eq(q.lift/p.lift,4);eq(q.drag/p.drag,4);
});
test('lift scales linearly with density at fixed speed',()=>{
  const p=labCalculation({...DEFAULT_LAB,density:1.2}),q=labCalculation({...DEFAULT_LAB,density:.6});
  eq(q.lift/p.lift,.5);
});
test('stall coefficient decreases after high angle of attack',()=>{
  const high=aeroCoefficients(15),stalled=aeroCoefficients(27);
  assert.ok(stalled.cl<high.cl);assert.ok(stalled.cd>high.cd);
});
test('altitude reduces density',()=>{
  assert.ok(densityAtAltitude(5000)<densityAtAltitude(0));eq(densityAtAltitude(0),1.225);
});
test('headwind changes airspeed but not ground-relative input',()=>{
  const calm=labCalculation({...DEFAULT_LAB,wind:0});
  const headwind=labCalculation({...DEFAULT_LAB,wind:10});
  eq(headwind.airspeed,calm.airspeed+10);assert.ok(headwind.lift>calm.lift);
});
test('flap increases lift and drag in nominal operating range',()=>{
  const clean=labCalculation({...DEFAULT_LAB,flap:0});
  const flap=labCalculation({...DEFAULT_LAB,flap:20});
  assert.ok(flap.lift>clean.lift);assert.ok(flap.drag>clean.drag);
});
test('quaternion rotation and inverse conserve vector',()=>{
  const q=integrateQuaternion(Q(),V(.2,.4,-.35),.5);
  const v=V(1,2,3);const transformed=invRotate(rotate(v,q),q);
  eq(transformed.x,v.x,1e-10);eq(transformed.y,v.y,1e-10);eq(transformed.z,v.z,1e-10);
});
test('aircraft accelerates from rest under throttle',()=>{
  const m=new FlightModel();m.setControl('throttle',1);
  for(let i=0;i<6*60;i++)m.step(1/60);
  assert.ok(m.velocity.z>11);assert.ok(m.position.z>-340);
  assert.ok(m.onGround);
});
test('aircraft can rotate and take off with elevator',()=>{
  const m=new FlightModel();m.setControl('throttle',1);
  for(let i=0;i<25*60;i++){
    if(m.last.airspeed>26)m.setControl('pitch',.6);
    m.step(1/60);
    if(!m.onGround)break;
  }
  assert.equal(m.onGround,false);
  assert.ok(m.last.lift>AIRCRAFT.mass*9.80665*.93);
});
test('reset restores initial state and no wind',()=>{
  const m=new FlightModel();m.setControl('throttle',1);m.setWeather({turbulence:4,windSpeed:10});
  for(let i=0;i<300;i++)m.step(1/60);
  m.reset();eq(m.position.z,-370);eq(m.time,0);assert.equal(m.onGround,true);eq(m.windSpeed,0);
});
