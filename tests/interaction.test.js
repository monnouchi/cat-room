import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import {KEY,restore,snapshot,weatherAt} from '../state.js';import {setupActions,reactionFor} from '../actions.js';import {setupSettings} from '../settings.js';import {catPose,pawStep} from '../motion.js';import {daylightAt,sunAt,windowLightPoints,mixColor,shadeAt,setupLight} from '../lighting.js';
function boot(raw=null,blocked=false,reduced=false){const items={},timers=[],listeners={},lines=[],arcs=[];let next,now=0;let writes=0;const context=new Proxy({},{get:(_,key)=>key==='createLinearGradient'?()=>({addColorStop(){}}):key==='lineTo'?(x,y)=>lines.push([x,y]):key==='arc'?(...args)=>arcs.push(args):()=>{}});const element=id=>items[id]??=(id==='room'?{getContext:()=>context}:{textContent:'',disabled:false,setAttribute(){},focus(){},contains(){return false}});const sandbox={KEY,restore,snapshot,weatherAt,catPose,pawStep,daylightAt,sunAt,windowLightPoints,mixColor,shadeAt,setupLight:options=>setupLight({...options,now:()=>now,schedule:(fn,ms)=>timers.push({fn,ms,timeout:true})}),reactionFor,setupSettings:options=>setupSettings({...options,document:{addEventListener:(name,fn)=>listeners[name]=fn}}),setupActions:options=>setupActions({...options,schedule:(fn,ms)=>timers.push({fn,ms,timeout:true})}),Math,Date,JSON,performance:{now:()=>now},localStorage:{getItem(){if(blocked)throw Error();return raw},setItem(){if(blocked)throw Error();writes++}},document:{hidden:false,querySelector:()=>element('room'),getElementById:element,addEventListener:(name,fn)=>listeners[name]=fn},window:{addEventListener:(name,fn)=>listeners[name]=fn},matchMedia:()=>({matches:reduced}),requestAnimationFrame:fn=>{next=fn;return 1},cancelAnimationFrame:()=>{next=null},setInterval:(fn,ms)=>timers.push({fn,ms})};vm.runInNewContext(fs.readFileSync(new URL('../app.js',import.meta.url),'utf8').replace(/^import .*\n/gm,''),sandbox);return {items,timers,listeners,sandbox,lines,arcs,read:name=>vm.runInContext(name,sandbox),frame:t=>{now=t;next?.(t)},writes:()=>writes}}
test('device actions lock repeats without imposing cat response',()=>{const b=boot();b.frame(16);b.items.sound.onclick();b.items.sound.onclick();assert.equal(b.items.sound.disabled,true);b.items.feed.onclick();b.items.feed.onclick();assert.equal(b.items.feed.disabled,true);b.frame(2000);b.timers.find(x=>x.ms===8000).fn();assert.equal(b.items.feed.disabled,false)});
test('storage denied, reload and hidden frame lifecycle',()=>{for(const raw of [null,'bad',JSON.stringify(snapshot(80,Date.now()))]){const b=boot(raw,true);b.frame(16);b.frame(32);assert.ok(b.items.activity.textContent);b.items.feed.onclick();b.listeners.pagehide();b.sandbox.document.hidden=true;b.listeners.visibilitychange();b.sandbox.document.hidden=false;b.listeners.visibilitychange();b.frame(50)}});
test('long-running canvas animation remains finite',()=>{const b=boot();for(let i=0;i<76000;i++)b.frame(i*16);assert.ok(b.items.activity.textContent)});
test('reload ignores old pause and restores mute',()=>{const b=boot(JSON.stringify(snapshot(12,Date.now(),{paused:true,muted:true})));b.frame(16);assert.equal(b.items.pause,undefined);assert.equal(b.items.mute.textContent,'おとをいれる');b.items.mute.onclick();assert.equal(b.writes(),1)});
test('minimal UI removes requested copy and vague actions',()=>{const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');for(const copy of ['ねこの名前は、まだ仮。','試作 / 01','ねこだけの時間','この部屋の中だけの、小さな出来事です。','箱の向こうで、かさっと音がした。','id="watch"','id="tell"','id="pause"','ROOM 01','TODAY','LITTLE'])assert.equal(html.includes(copy),false);for(const id of ['feed','sound','capture'])assert.equal(html.includes(`id="${id}"`),true)});
test('analog hands follow local time with reduced motion and after return',()=>{const b=boot(JSON.stringify(snapshot(12,Date.now())),false,true);let hour=9,minute=30;b.sandbox.Date=class extends Date {getHours(){return hour}getMinutes(){return minute}getSeconds(){return 0}};b.frame(16);assert.ok(b.lines.some(([x,y])=>Math.abs(x-540)<.001&&Math.abs(y-160)<.001));b.lines.length=0;hour=12;minute=0;for(const timer of b.timers.filter(x=>x.ms===1000))timer.fn();assert.ok(b.lines.some(([x,y])=>Math.abs(x-540)<.001&&Math.abs(y-110)<.001));assert.ok(b.lines.some(([x,y])=>Math.abs(x-540)<.001&&Math.abs(y-118)<.001));b.sandbox.document.hidden=true;b.listeners.visibilitychange();b.sandbox.document.hidden=false;b.listeners.visibilitychange();b.frame(5000);assert.equal(b.items.pause,undefined)});

test('reduced motion still advances cat time without a manual pause',()=>{
 const b=boot(JSON.stringify(snapshot(39.5,Date.now())),false,true);b.frame(16);
 assert.match(b.items.activity.textContent,/おひるね/);b.frame(1500);
 for(const timer of b.timers.filter(x=>x.ms===1000))timer.fn();
 assert.match(b.items.activity.textContent,/ねがえり/);assert.equal(b.items.pause,undefined);
});

test('saved narration preference folds narrative regions and preserves device labels',()=>{
 const b=boot(JSON.stringify(snapshot(12,Date.now(),{showText:false})));
 b.frame(16);assert.equal(b.items['narration-status'].hidden,true);
 assert.equal(b.items['narration-greeting'].hidden,true);assert.equal(b.items.sound.hidden,undefined);
 b.items['show-text'].checked=true;b.items['show-text'].onchange();
 assert.equal(b.items['narration-status'].hidden,false);assert.equal(b.writes(),1);
});

test('door bell effect appears even muted and expires; reduced motion keeps stable ripples',()=>{
 for(const reduced of [false,true]){
  const b=boot(JSON.stringify(snapshot(12,Date.now(),{muted:true})),false,reduced);
  b.frame(16);b.arcs.length=0;b.items.sound.onclick();
  const ripples=b.arcs.filter(args=>args[2]>=16);assert.equal(ripples.length,4);if(reduced)assert.deepEqual(ripples.map(args=>args[2]),[19,19,27,27]);
  b.items.sound.onclick();assert.equal(b.items.sound.disabled,true);
  b.arcs.length=0;b.frame(2500);
  for(const timer of b.timers.filter(x=>x.ms===1000))timer.fn();
  assert.equal(b.arcs.filter(args=>args[2]>=16).length,0);
 }
});
test('hour and door ripples coexist at their own positions and expire together',()=>{
 for(const reduced of [false,true]){
  const b=boot(JSON.stringify(snapshot(12,Date.now(),{muted:true})),false,reduced);
  let clockTime=new Date(2026,9,10,10,59,59).getTime();
  b.sandbox.Date=class extends Date {constructor(...args){super(...(args.length?args:[clockTime]))}};
  const clockTimer=b.timers.find(x=>x.ms===1000);clockTimer.fn();clockTime+=1000;clockTimer.fn();
  b.arcs.length=0;b.items.sound.onclick();
  assert.equal(b.arcs.filter(args=>args[2]>=43).length,2);
  assert.equal(b.arcs.filter(args=>args[2]>=16&&args[2]<43).length,4);
  if(reduced)assert.deepEqual(b.arcs.filter(args=>args[2]>=43).map(args=>args[2]),[48,61]);
  b.arcs.length=0;b.frame(3000);for(const timer of b.timers.filter(x=>x.ms===1000))timer.fn();
  assert.equal(b.arcs.filter(args=>args[2]>=16).length,0);
 }
});

test('feeding again after a meal remains visible for a later visit',()=>{
 const b=boot(JSON.stringify(snapshot(80,Date.now(),{foodRoute:true,routeChosen:true,mealConsumed:true})));
 b.frame(16);b.items.feed.onclick();assert.equal(b.read('foodVisible'),true);
 b.frame(48);assert.equal(b.read('foodVisible'),true);
});
