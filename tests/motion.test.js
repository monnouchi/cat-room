import test from 'node:test';import assert from 'node:assert/strict';import {catPose,pawStep} from '../motion.js';import {restore,snapshot} from '../state.js';
test('normal and food routes are continuous and always walk head first',()=>{
 for(const [food,water] of [[false,false],[true,false],[false,true]])for(let p=0;p<120;p+=.01){
  const a=catPose(p,food,water),b=catPose(p+.005,food,water);
  assert.ok(Number.isFinite(a.x+a.y+a.distance+a.strength));
  assert.ok(Math.hypot(b.x-a.x,b.y-a.y)<.5,'position jumps at a transition');
  if(a.mode==='walk'&&b.mode==='walk'&&Math.abs(b.x-a.x)>.000001)assert.ok((b.x-a.x)*a.facing>0,'walking backwards');
  if(a.turnProgress!==undefined)assert.ok(Math.hypot(b.x-a.x,b.y-a.y)<.00001,'turn should happen in place');
 }
});
test('box is inspected from its front; entry slows down and stays occluded',()=>{
 const inspect=catPose(75);assert.equal(inspect.mode,'inspect');assert.equal(inspect.x,746);assert.ok(inspect.y>463);
 const entering=catPose(77);assert.equal(entering.occlude,true);assert.ok(entering.y<inspect.y);assert.ok(entering.x>=723&&entering.x<=824);
 assert.equal(catPose(79).mode,'box');assert.ok(catPose(76.01).strength<catPose(77).strength);
});
test('food stops with nose at the bowl, turns before leaving and returns to the rug',()=>{
 const meal=catPose(70,true);assert.equal(meal.mode,'eat');assert.equal(meal.x-34,150);assert.equal(meal.facing,-1);
 const turn=catPose(73,true);assert.ok(turn.turnProgress>0);assert.equal(turn.x,meal.x);
 assert.equal(catPose(75,true).facing,1);assert.equal(catPose(77,true).facing,1);
 assert.equal(catPose(0,true).x,catPose(119.999,true).x);assert.equal(catPose(0,true).y,catPose(119.999,true).y);
});
test('four paws have distinct phases, ground contact and bounded swings',()=>{
 for(let leg=0;leg<4;leg++){let contact=0;for(let d=0;d<36;d+=.1){const step=pawStep(d,leg);assert.ok(Math.abs(step.x)<=7.001);assert.ok(step.lift>=0&&step.lift<=8.001);if(step.lift===0)contact++}assert.ok(contact>200)}
 assert.ok(new Set([0,1,2,3].map(i=>JSON.stringify(pawStep(4,i)))).size>=3);
 assert.deepEqual(pawStep(7,0,0),{x:0,lift:0});
});
test('wake and stretch precede locomotion; chosen detour survives reload',()=>{
 assert.equal(catPose(49).mode,'wake');assert.equal(catPose(53).mode,'stretch');assert.ok(catPose(57).turnProgress>0);
 const raw=JSON.stringify(snapshot(66,1000,{foodRoute:true,routeChosen:true,foodVisible:true}));
 const reloaded=restore(raw,1000);assert.equal(reloaded.foodRoute,true);assert.equal(catPose(reloaded.phase,reloaded.foodRoute).x,catPose(66,true).x);
 assert.equal(restore(raw,121000).foodRoute,false);
});

test('forward contacts follow hind then fore on each side',()=>{
 for(const [distance,leg] of [[0,3],[9,2],[18,1],[27,0]]){
  const contact=pawStep(distance,leg);assert.equal(contact.x,-7);assert.equal(contact.lift,0);
 }
});

test('water is a stationary visit with nose at its own bowl and no eating overlap',()=>{
 const drink=catPose(70,false,true);assert.equal(drink.mode,'drink');assert.equal(drink.x-34,230);assert.equal(drink.y,507);assert.equal(drink.strength,0);
 assert.equal(catPose(67,false,true).mode,'walk');assert.equal(catPose(73,false,true).turnProgress,.5);
 assert.equal(catPose(70,true,true).mode,'eat');
});
test('box entry, seated turn and exit keep a continuous compact silhouette',()=>{
 for(const [food,water,start,end] of [[false,false,76,101],[true,false,98,109],[false,true,98,109]]){
  let previous;
  for(let p=start;p<end;p+=.01){const pose=catPose(p,food,water);const blend=pose.boxBlend??0;assert.ok(blend>=0&&blend<=1);if(previous!==undefined)assert.ok(Math.abs(blend-previous)<.02);previous=blend;}
 }
 assert.equal(catPose(82).boxBlend,1);assert.ok(catPose(99).boxBlend>catPose(100).boxBlend);
});
