import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
import {flowPosition,AIRFLOW_DEFAULT_COUNT,FLOW_SPAN_METERS} from '../src/airflow.js';
test('GLB provided by user is bundled and self-consistent',()=>{
 const f=new URL('../assets/models/airbus_a380.glb',import.meta.url);
 const b=readFileSync(f);
 assert.equal(b.toString('ascii',0,4),'glTF');
 assert.equal(b.readUInt32LE(4),2);
 assert.equal(b.readUInt32LE(8),b.length);
 assert.ok(b.length>4_000_000);
 const jsonLength=b.readUInt32LE(12);
 const json=JSON.parse(b.subarray(20,20+jsonLength).toString('utf8'));
 assert.equal(json.asset.extras.author.includes('Brout'),true);
 assert.ok(json.meshes.length>0);
});
test('A380 airflow has hundreds of visible tracers on flight and lab',()=>{
 assert.ok(AIRFLOW_DEFAULT_COUNT>=150);
 assert.ok(FLOW_SPAN_METERS>=140);
 const positions=Array.from({length:AIRFLOW_DEFAULT_COUNT},(_,i)=>flowPosition(i,(i+.5)/AIRFLOW_DEFAULT_COUNT,8));
 assert.equal(positions.length,AIRFLOW_DEFAULT_COUNT);
 assert.ok(positions.some(p=>p.z>40));
 assert.ok(positions.some(p=>p.z< -40));
 assert.ok(positions.some(p=>Math.abs(p.x)>35));
 for(const p of positions){assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.y)&&Number.isFinite(p.z));}
});
test('airflow has correct nose-to-tail direction for increasing phase',()=>{
 const first=flowPosition(1,.1),second=flowPosition(1,.2);
 assert.ok(second.z<first.z);
});
