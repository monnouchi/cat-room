import test from 'node:test';import assert from 'node:assert/strict';import {restore,snapshot,weatherAt} from '../state.js';
test('empty and damaged storage starts gently',()=>{for(const raw of [null,'{','null','{}','{"version":1,"time":0,"phase":-1}'])assert.equal(restore(raw,100).phase,0)});
test('return advances, reload preserves, clock reversal is harmless',()=>{const raw=JSON.stringify(snapshot(12,1000));assert.equal(restore(raw,1000).phase,12);assert.equal(restore(raw,6000).phase,17);assert.equal(restore(raw,0).phase,12)});
test('long absence remains bounded and valid',()=>{const s=restore(JSON.stringify(snapshot(3,0)),1e15);assert.ok(s.phase>=0&&s.phase<120);assert.equal(s.away,604800000)});
test('legacy pause is discarded and muted remains saved',()=>{const s=restore('{"version":1,"phase":12,"time":1000,"paused":true,"muted":true}',50000);assert.equal(s.phase,61);assert.equal(s.muted,true);assert.equal('paused' in s,false);assert.equal('paused' in snapshot(12,1000,{paused:true,muted:true}),false)});
test('invalid sound preference is safe',()=>{const s=restore('{"version":1,"phase":0,"time":1,"paused":"true","muted":"true"}',1);assert.equal(s.muted,false)});
test('narration defaults on and persists explicit off across reload',()=>{assert.equal(restore('{"version":1,"phase":0,"time":1}',1).showText,true);assert.equal(restore(JSON.stringify(snapshot(12,1000,{showText:false})),2000).showText,false)});

test('game weather changes slowly and has clear and rainy periods',()=>{
 assert.equal(weatherAt(0),'clear');assert.equal(weatherAt(2700000*4),'rain');
 assert.equal(weatherAt(2700000*4+2699999),'rain');assert.equal(weatherAt(2700000*6),'clear');
});
