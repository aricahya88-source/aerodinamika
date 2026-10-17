import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {MODEL_SOURCES,MODEL_SOURCE_KEY,getModelSource} from '../src/glb-aircraft.js';

test('A380 GLB bundled is a valid binary glTF container',()=>{
 const file=new URL('../assets/models/a380-aerolab.glb',import.meta.url);
 assert.ok(existsSync(file));
 const buffer=readFileSync(file);
 assert.equal(buffer.toString('ascii',0,4),'glTF');
 assert.equal(buffer.readUInt32LE(4),2);
 assert.equal(buffer.readUInt32LE(8),buffer.length);
 assert.ok(buffer.length>1000);
});
test('A380 external model attribution and offline fallback are defined',()=>{
 assert.ok(MODEL_SOURCES.community.url.includes('amvlab'));
 assert.ok(MODEL_SOURCES.bundled.url.endsWith('a380-aerolab.glb'));
 assert.equal(MODEL_SOURCES.procedural.url,null);
 assert.equal(typeof MODEL_SOURCE_KEY,'string');
 assert.equal(getModelSource(),'community'); // no localStorage in Node
});
