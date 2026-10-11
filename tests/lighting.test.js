import test from 'node:test';import assert from 'node:assert/strict';import {sunAt,windowLightPoints,daylightAt,shadeAt,setupLight} from '../lighting.js';import {restore,snapshot} from '../state.js';
const time=hour=>new Date(2026,9,10,hour,0,0);
test('south-facing equinox light shifts right in morning and left in afternoon',()=>{
 const distances=[];
 for(const hour of [8,10,12,14,16]){
  const sun=sunAt(time(hour)),points=windowLightPoints(sun);assert.equal(sun.visible,true);assert.equal(points.length,4);
  for(const point of points)assert.ok(point.every(Number.isFinite));
  if(hour<12)assert.ok(points[3][0]>141);if(hour>12)assert.ok(points[3][0]<141);
  distances.push(Math.hypot(points[3][0]-141,points[3][1]-365));
 }
 assert.ok(distances[0]>distances[1]&&distances[1]>distances[2]);assert.ok(distances[4]>distances[3]&&distances[3]>distances[2]);
 assert.ok(Math.abs(sunAt(time(12)).altitude-55)<.00001);assert.ok(Math.abs(sunAt(time(12)).azimuth-180)<.00001);
 assert.ok(Math.abs(windowLightPoints(sunAt(time(12)))[0][0]-141)<.00001);
});
test('rain, horizon and back side never cast direct light; dawn changes continuously',()=>{
 for(const hour of [0,6,18,23])assert.deepEqual(windowLightPoints(sunAt(time(hour))),[]);
 assert.deepEqual(windowLightPoints(sunAt(time(12),true)),[]);assert.equal(sunAt(time(12),false,0).visible,false);
 const before=new Date(2026,9,10,6,0,0),after=new Date(2026,9,10,6,0,1);assert.ok(Math.abs(daylightAt(before)-daylightAt(after))<.001);
});
test('lights transition gently, limit repeated taps and persist with a visible night floor',()=>{
 let now=0;const callbacks=[],changes=[],button={setAttribute(){}};
 const control=setupLight({button,initial:true,onChange:value=>changes.push(value),now:()=>now,schedule:fn=>callbacks.push(fn)});
 button.onclick();button.onclick();assert.deepEqual(changes,[false]);assert.equal(control.level(),1);now=350;assert.equal(control.level(),.5);assert.equal(control.level(now,true),0);now=700;assert.equal(control.level(),0);callbacks[0]();assert.equal(button.disabled,false);
 assert.equal(restore(JSON.stringify(snapshot(12,1000,{lightsOn:false})),2000).lightsOn,false);
 assert.equal(restore('{"version":1,"phase":0,"time":1}',1).lightsOn,true);
 assert.ok(shadeAt(0,0)<=.5);assert.ok(shadeAt(0,1)<shadeAt(0,0));assert.ok(shadeAt(1,0)<shadeAt(0,0));
});
