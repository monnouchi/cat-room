import {KEY,restore,snapshot,weatherAt} from './state.js';
import {setupActions,reactionFor} from './actions.js';
import {setupSettings} from './settings.js';
import {catPose,pawStep} from './motion.js';
import {daylightAt,sunAt,windowLightPoints,mixColor,shadeAt,setupLight} from './lighting.js';
const canvas=document.querySelector('#room'),c=canvas.getContext('2d');
let reactionUntil=0,reactionKind='',foodVisible=false,doorUntil=0,hourUntil=0,feedUntil=0,pendingReaction,foodRoute=false,waterRoute=false,routeChosen=false,mealConsumed=false;
let raw;try{raw=localStorage.getItem(KEY)}catch{}
const motionPreference=matchMedia('(prefers-reduced-motion: reduce)');
const saved=restore(raw,Date.now());foodRoute=saved.foodRoute??false;waterRoute=saved.waterRoute??false;routeChosen=saved.routeChosen??false;foodVisible=saved.foodVisible??false;mealConsumed=saved.mealConsumed??false;let phase=saved.phase,muted=saved.muted??false,lightsOn=saved.lightsOn??true,showText=saved.showText??true,reducedMotion=motionPreference.matches,last=0,raf=0,lastDraw=0,reducedAt=performance.now(),hiddenAt;
const $=id=>document.getElementById(id);
if(saved.away>60000)$('welcome').textContent=saved.away>3600000?'おかえり。いないあいだ、はこにはいったり、おひるねしたり。':'おかえり。さっき、みみがぴくっとしたよ。';
function persist(){try{localStorage.setItem(KEY,JSON.stringify(snapshot(phase,Date.now(),{muted,lightsOn,showText,foodRoute,waterRoute,routeChosen,foodVisible,mealConsumed})))}catch{}}
const rect=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(x,y,w,h)};
function oval(x,y,rx,ry,col){c.fillStyle=col;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill()}
function path(points,col){c.fillStyle=col;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill()}
function scenery(){
  const rainy=weatherAt(Date.now())==='rain',day=daylightAt(new Date());
  c.save();c.beginPath();c.rect(141,88,215,187);c.clip();
  const sky=c.createLinearGradient(0,88,0,275);
  sky.addColorStop(0,mixColor('#334451',rainy?'#a7b7bc':'#c4dcd9',day));sky.addColorStop(1,mixColor('#536371',rainy?'#c5ced0':'#e6ead9',day));
  rect(141,88,215,187,sky);
  oval(185,128,40,12,mixColor('#455461',rainy?'#b8c4c8':'#e8eee4',day));oval(310,111,51,14,mixColor('#455461',rainy?'#b8c4c8':'#e8eee4',day));
  path([[140,246],[185,220],[245,232],[310,205],[357,216],[357,277],[140,277]],mixColor('#52635c',rainy?'#a6b3a5':'#b4c6a9',day));
  for(const [x,y,size] of [[163,240,25],[297,224,35],[341,249,27]]){
    rect(x-2,y,4,65,mixColor('#424e4b',rainy?'#8f9a87':'#a4ac8b',day));
    oval(x,y,size,size*1.15,mixColor('#53645a',rainy?'#95a692':'#9fb78f',day));
    oval(x+size*.6,y+8,size*.65,size*.75,mixColor('#4b5c52',rainy?'#8f9f8c':'#99b188',day));
  }
  if(rainy){
    c.strokeStyle='rgba(234,244,245,.45)';c.lineWidth=1;
    const time=reducedMotion?0:performance.now()/1000;
    for(let i=0;i<18;i++){const x=144+(i*41)%210,y=88+((i*37+time*55)%187);c.beginPath();c.moveTo(x,y);c.lineTo(x-4,y+13);c.stroke()}
  }
  if(day<.1&&!rainy){oval(310,119,9,9,'#c9d4c9');oval(314,116,8,8,'#394b57')}
  path([[144,88],[189,88],[290,275],[245,275]],'rgba(255,255,255,.09)');c.restore();
}
function room(){const sway=reducedMotion?0:Math.sin(phase*.7)*1.5;rect(0,0,960,640,'#ded8c9');rect(0,0,960,365,'#e9e4d8');path([[0,365],[960,365],[960,640],[0,640]],'#cab99b');for(let y=395;y<640;y+=53){rect(0,y,960,2,'#bcaa8e');for(let x=(y%2)*120;x<960;x+=240)rect(x,y-50,1,50,'#c0af94')}
rect(0,356,960,12,'#b9ad96');rect(867,105,69,250,'#c2b9a6');rect(874,112,55,241,'#d1c8b5');oval(916,243,3,3,'#9b896c');rect(849,206,9,18,'#a69b83');oval(853,212,2,2,performance.now()<doorUntil?'#f4d893':'#d6cdbb');rect(120,69,258,228,'#c1b8a3');rect(130,78,238,208,'#d4e0dc');scenery();rect(242,80,9,204,'#f8f4e8');rect(130,177,237,8,'#f8f4e8');rect(107,287,286,13,'#b3a58c');
rect(667,174,150,9,'#b6a88d');rect(683,183,6,18,'#b6a88d');rect(795,183,6,18,'#b6a88d');rect(720,126,30,48,'#c79d80');oval(735,127,15,5,'#a77f62');c.strokeStyle='#7e9676';c.lineWidth=5;c.beginPath();c.moveTo(735,131);c.lineTo(729+sway,94);c.stroke();oval(718+sway,100,14,6,'#8a9d79');oval(741+sway,110,14,6,'#78916e');rect(768,143,24,31,'#e6dbbe');rect(772,136,16,8,'#c5bba5');
oval(389,475,136,52,'#adad91');oval(389,470,128,46,'#bfc0a4');for(let i=0;i<5;i++){c.strokeStyle='#a8ad92';c.lineWidth=1;c.beginPath();c.ellipse(389,470,110-i*15,38-i*5,0,0,7);c.stroke()}
oval(150,473,27,9,'#a99a7e');oval(150,468,24,8,'#ddd0b7');oval(150,466,18,4,'#c3aa86');
boxBack();
oval(575,517,10,8,'#b88270');c.strokeStyle='#ae7865';c.lineWidth=2;c.beginPath();c.arc(575,517,6,0,7);c.stroke();}
function boxBack(){
  oval(776,464,73,16,'#ad9b7c');
  path([[704,384],[839,384],[829,463],[714,463]],'#a78359');
  path([[719,389],[827,389],[820,462],[722,462]],'#795b3d');
  path([[704,384],[729,366],[856,365],[839,384]],'#d2aa75');
  path([[704,384],[680,366],[709,352],[730,368]],'#d8b27f');
  path([[839,384],[863,358],[836,349],[815,367]],'#cfaa75');
}
function boxFront(){
  c.fillStyle='#b98d5e';c.beginPath();
  c.moveTo(704,384);c.lineTo(839,384);c.lineTo(829,463);c.lineTo(714,463);c.closePath();
  c.moveTo(727,463);c.lineTo(727,425);c.quadraticCurveTo(727,398,774,398);
  c.quadraticCurveTo(821,398,821,425);c.lineTo(821,463);c.closePath();c.fill('evenodd');
  rect(758,386,27,7,'#c49c70');
}
function waterBowl(pose){
  oval(230,512,36,10,'rgba(105,105,94,.18)');
  oval(230,507,34,12,'#e6e5d9');oval(230,503,31,10,'#f5f3e8');
  oval(230,503,25,7,'#9abcc5');
  c.strokeStyle='rgba(242,251,250,.65)';c.lineWidth=1;
  c.beginPath();c.ellipse(230,502,19,4,0,Math.PI,Math.PI*2);c.stroke();
  if(pose.mode==='drink'){
    const cycle=reducedMotion ? .35 : (phase*3)%1;
    c.strokeStyle=`rgba(235,249,250,${.45*(1-cycle)})`;
    c.beginPath();c.ellipse(230,503,4+cycle*16,1.3+cycle*4,0,0,Math.PI*2);c.stroke();
  }
}
function ceilingLamp(){
  const level=lightControl.level(performance.now(),reducedMotion);
  rect(447,0,2,27,'#ada58f');
  oval(448,32,24,9,'#c5bba4');oval(448,35,18,5,mixColor('#c0c2b6','#f2d6a0',level));
}
function illumination(){
  const day=daylightAt(new Date()),level=lightControl.level(performance.now(),reducedMotion);
  rect(0,0,960,640,`rgba(28,42,64,${shadeAt(day,level)})`);
  rect(0,0,960,640,`rgba(255,215,153,${.08*level*(1-day)})`);
}
function airConditioner(){
  c.save();
  oval(739,88,74,5,'rgba(104,99,81,.08)');
  c.fillStyle='#e3dfd3';c.beginPath();c.roundRect(659,42,158,48,7);c.fill();
  rect(670,51,135,20,'#eeeadf');rect(676,80,122,4,'#bcbcae');
  rect(683,81,108,1,'#d4d4c6');oval(799,76,2,1,'#91ad90');
  if(!reducedMotion){
    const drift=Math.sin(phase*.8)*3;
    c.strokeStyle='rgba(236,241,230,.12)';c.lineWidth=2;
    for(let i=0;i<3;i++){
      c.beginPath();c.moveTo(688+i*17,94);
      c.bezierCurveTo(688+i*17,110,705+i*13+drift,114,706+i*13+drift,132);c.stroke();
    }
  }
  c.restore();
}
function chimeEffect(){
  const remaining=doorUntil-performance.now();if(remaining<=0)return;
  const progress=Math.min(1,Math.max(0,1-remaining/2000));
  c.save();c.translate(853,197);c.scale(2,2);
  c.globalAlpha=reducedMotion ? .65 : Math.min(1,remaining/450)*.8;
  oval(0,0,14,14,'rgba(247,238,207,.55)');
  c.strokeStyle='#8f9178';c.lineWidth=1.8;c.lineCap='round';
  c.beginPath();c.moveTo(-7,5);c.lineTo(-5,1);c.lineTo(-5,-4);
  c.quadraticCurveTo(-5,-10,0,-10);c.quadraticCurveTo(5,-10,5,-4);
  c.lineTo(5,1);c.lineTo(7,5);c.closePath();c.stroke();
  oval(0,8,2,2,'#8f9178');
  c.strokeStyle='rgba(143,145,120,.4)';c.lineWidth=1.3;
  for(let i=0;i<2;i++){
    const radius=reducedMotion?19+i*8:16+((progress+i*.4)%1)*17;
    c.beginPath();c.arc(0,0,radius,-.7,.7);c.stroke();
    c.beginPath();c.arc(0,0,radius,Math.PI-.7,Math.PI+.7);c.stroke();
  }
  c.restore();
}
function hourEffect(){
  const remaining=hourUntil-performance.now();if(remaining<=0)return;
  const progress=Math.min(1,Math.max(0,1-remaining/2500));
  c.save();c.translate(540,135);
  c.globalAlpha=reducedMotion ? .55 : Math.min(1,remaining/600)*.6;
  c.strokeStyle='#9c977d';c.lineWidth=1.6;
  for(let i=0;i<2;i++){
    const radius=reducedMotion?48+i*13:43+((progress+i*.45)%1)*35;
    c.beginPath();c.arc(0,0,radius,0,Math.PI*2);c.stroke();
  }
  c.restore();
}
function feeder(){
  oval(150,446,35,9,'#9c927b33');
  rect(125,395,50,47,'#ccc8b7');oval(150,395,25,8,'#dedacc');
  rect(136,409,28,13,'#f0ecdf');rect(145,431,11,13,'#908875');
  oval(150,451,30,7,'#d5d0be');
  if(foodVisible){
    for(const [x,y] of [[140,467],[148,464],[155,468],[160,465],[147,470],[153,471]])oval(x,y,3,2,'#a47c51');
    if(!reducedMotion&&performance.now()<feedUntil){
      const drop=(performance.now()%650)/650;
      if(feedUntil-performance.now()>300)oval(150,445+drop*17,2,2,'#a47c51');
    }
  }
}
function clock(now=new Date()){
  c.save();
  rect(490,108,100,179,'#aa8d6d');oval(540,108,50,24,'#aa8d6d');
  rect(499,176,82,102,'#786c57');
  oval(540,135,38,38,'#8d765b');oval(540,135,33,33,'#f0e9d5');
  c.strokeStyle='#9e9279';c.lineWidth=1.5;
  for(let i=0;i<12;i++){
    const angle=i*Math.PI/6;c.beginPath();
    c.moveTo(540+Math.sin(angle)*27,135-Math.cos(angle)*27);
    c.lineTo(540+Math.sin(angle)*30,135-Math.cos(angle)*30);c.stroke();
  }
  const minutes=now.getMinutes()+now.getSeconds()/60;
  const hours=(now.getHours()%12)+minutes/60;
  function hand(angle,length,width){c.strokeStyle='#655c49';c.lineWidth=width;c.lineCap='round';c.beginPath();c.moveTo(540,135);c.lineTo(540+Math.sin(angle)*length,135-Math.cos(angle)*length);c.stroke()}
  hand(hours*Math.PI/6,17,3);hand(minutes*Math.PI/30,25,2);oval(540,135,3,3,'#655c49');
  c.translate(540,183);c.rotate(reducedMotion?0:Math.sin(phase*3)*.13);
  rect(-1,0,2,59,'#c7b085');
  oval(0,64,13,13,'#e4c886');oval(5,60,11,11,'#786c57');
  c.restore();
}
function sunlight(){
  const now=new Date(),rainy=weatherAt(Date.now())==='rain',sun=sunAt(now,rainy);
  if(rainy){rect(0,0,960,640,'rgba(92,114,137,.08)');return}
  if(!sun.visible)return;
  c.save();const light=c.createLinearGradient(0,365,0,620);
  const amount=.24*daylightAt(now)*Math.min(1,sun.incidence/.574);
  light.addColorStop(0,`rgba(255,252,226,${amount})`);
  light.addColorStop(.75,`rgba(255,252,226,${amount*.55})`);
  light.addColorStop(1,'rgba(255,252,226,0)');c.filter='blur(18px)';
  c.beginPath();c.rect(0,365,960,275);c.clip();path(windowLightPoints(sun),light);c.restore();
}
function cat(x,y,mode,t,pose){c.save();c.translate(x,y);const turning=Math.sin((pose.turnProgress??0)*Math.PI),boxed=pose.boxBlend??0;c.scale(-pose.facing*(1-turning*.18),1);const breathe=reducedMotion?0:Math.sin(t*1.8)*1.5;const curious=performance.now()<reactionUntil&&reactionKind!=='ignore';const looking=curious&&reactionKind==='look';const twitch=curious?(reducedMotion?3:Math.sin(t*9)*4):0;oval(0,9+28*boxed,58-24*boxed,12-4*boxed,'#7e70522b');c.strokeStyle='#c39a69';c.lineCap='round';c.lineWidth=16;c.beginPath();c.moveTo(27,-10+32*boxed);c.quadraticCurveTo(66-27*boxed,-8+34*boxed,56-31*boxed+(reducedMotion?0:Math.sin(t*2)*6)*(1-boxed),-33+45*boxed);c.stroke();
if(mode==='sleep'||mode==='roll'||(mode==='settle'&&pose.settle>=.5)){c.rotate(mode==='roll'?Math.sin(t)*.2:0);oval(0,-12,51,27+breathe,'#dec19a');oval(-29,-20+(looking?-3:0),26,22,'#edcfaa');path([[-49,-32],[-48+twitch,-56],[-30,-38]],'#edcfaa');path([[-21,-35],[-10-twitch,-53],[-6,-28]],'#edcfaa');path([[-45,-36],[-44,-49],[-34,-37]],'#c99583');if(looking){oval(-40,-22,2,3,'#655c44');oval(-21,-22,2,3,'#655c44')}else{c.strokeStyle='#866a50';c.lineWidth=2;c.beginPath();c.moveTo(-45,-21);c.quadraticCurveTo(-40,-17,-35,-21);c.moveTo(-26,-21);c.quadraticCurveTo(-21,-17,-16,-21);c.stroke()}oval(-30,-14,3,2,'#b18276');oval(4,4,23,7,'#edd1ad');}
else{
  const stretch=mode==='stretch'?(pose.stretchAmount??1):0;
  const settling=mode==='settle'?Math.min(1,pose.settle*2):mode==='wake'?1-pose.rise:0;
  const bob=mode==='walk'&&!reducedMotion?Math.sin(pose.distance/36*Math.PI*4)*pose.strength:0;
  function leg(i){
    const px=[-25,26,-24,27][i];
    const step=mode==='walk'?pawStep(pose.distance,i,reducedMotion?0:pose.strength):
      pose.turnProgress!==undefined&&!reducedMotion?pawStep(pose.turnProgress*36,i,.45*Math.sin(pose.turnProgress*Math.PI)):{x:0,lift:0};
    const height=16-settling*9-boxed*8;
    oval(px+(i%2===0?-28*stretch:0)+step.x,11+28*boxed-height-step.lift,7,height,i<2?'#c8a77f':'#edcfaa');
  }
  leg(0);leg(1);
  oval(0,-28+16*settling+bob+48*boxed,40+24*stretch+11*settling-5*boxed,27-9*stretch-9*boxed+breathe,'#dec19a');
  leg(2);leg(3);
  const hx=(-34-27*stretch+5*settling+28*boxed)*(1-turning),hy=mode==='drink'?-14+(reducedMotion?0:Math.sin(t*6)*.6):mode==='eat'?-18+(reducedMotion?0:Math.sin(t*3)*5):mode==='inspect'?-47-17*Math.sin(pose.inspect*Math.PI):-47+21*stretch+27*settling+bob*.8+55*boxed;oval(hx,hy,25-3*boxed,23-3*boxed,'#edcfaa');const ear=curious?twitch:Math.sin(t*3)> .98?3:0;path([[hx-21,hy-11],[hx-20-ear,hy-37+10*boxed],[hx-4,hy-20]],'#edcfaa');path([[hx+4,hy-20],[hx+20,hy-36+10*boxed],[hx+23,hy-9]],'#edcfaa');path([[hx-17,hy-15],[hx-17-ear,hy-29+8*boxed],[hx-7,hy-19]],'#c99583');const blink=Math.sin(t*.8)>.985||settling>.6;oval(hx-10,hy,3,blink?1:4,'#655c44');oval(hx+10,hy,3,blink?1:4,'#655c44');oval(hx,hy+7,3,2,'#b18276');if(mode==='drink'){const lap=reducedMotion ? .35 : Math.max(0,Math.sin((t-68)*Math.PI*6));c.strokeStyle='#c69691';c.lineWidth=1.8;c.beginPath();c.moveTo(hx,hy+9);c.lineTo(hx,hy+9+lap*3);c.stroke()}c.strokeStyle='#9b8166';c.lineWidth=1;for(const side of [-1,1])for(let i=0;i<2;i++){c.beginPath();c.moveTo(hx+side*8,hy+8+i*3);c.lineTo(hx+side*30,hy+5+i*8);c.stroke()}}
c.restore()}
function draw(){
  if(pendingReaction&&performance.now()>=pendingReaction.at){reactionKind=pendingReaction.kind;reactionUntil=performance.now()+3500;pendingReaction=undefined}
  if(phase<40){routeChosen=false;foodRoute=false;waterRoute=false;mealConsumed=false}
  if(phase>=56&&!routeChosen){routeChosen=true;foodRoute=phase<59&&foodVisible&&Math.random()<.35;waterRoute=phase<59&&!foodRoute&&Math.random()<.28}
  const pose=catPose(phase,foodRoute,waterRoute);
  if(foodRoute&&phase>=72&&!mealConsumed){foodVisible=false;mealConsumed=true;}
  room();ceilingLamp();airConditioner();feeder();waterBowl(pose);clock();
  if(!pose.occlude)boxFront();
  cat(pose.x,pose.y,pose.mode==='box'?'sit':pose.mode,phase,pose);
  if(pose.occlude)boxFront();
  sunlight();illumination();chimeEffect();hourEffect();
  $('activity').textContent={sleep:'すやすや、おひるね。',roll:'ころん。ねがえり。',stretch:'ぐーっと、ひとのび。',wake:'すんすん。',inspect:'すんすん。',walk:'へやを、ひとまわり。',box:'やっぱり、はこがすき。',sit:'すんすん。',eat:'すんすん。',drink:'すんすん。',settle:'すやすや、おひるね。'}[pose.mode];
}
function tick(time){if(last&&!reducedMotion)phase=(phase+Math.min((time-last)/1000,.1))%120;last=time;if(!lastDraw||time-lastDraw>=33||reducedMotion){draw();lastDraw=time}if(!reducedMotion)raf=requestAnimationFrame(tick)}
setupSettings({button:$('settings-button'),panel:$('settings-panel'),toggle:$('show-text'),
  narration:[$('narration-status'),$('narration-greeting')],initial:showText,
  onChange:value=>{showText=value;persist()}});
const lightControl=setupLight({button:$('light'),initial:lightsOn,
  onChange:value=>{lightsOn=value;persist();draw()}});
const controls=setupActions({sound:$('sound'),feed:$('feed'),mute:$('mute'),initialMuted:muted,
  onMute:value=>{muted=value;persist()},onAction:kind=>{
    const now=performance.now();
    if(kind==='door')doorUntil=now+2000;
    if(kind==='hour')hourUntil=now+2500;
    if(kind==='food'){foodVisible=true;feedUntil=now+2000;}
    if(!pendingReaction&&now>=reactionUntil){
      const mood=reactionFor(phase,Math.random,catPose(phase,foodRoute,waterRoute).mode);
      pendingReaction={kind:mood,at:now+600+Math.random()*1800};
    }
    draw();
}});
setInterval(()=>controls.clockTick(new Date(),!document.hidden),1000);
setInterval(()=>{
  if(reducedMotion&&!document.hidden){
    const now=performance.now();phase=(phase+Math.max(0,now-reducedAt)/1000)%120;
    reducedAt=now;draw();
  }
},1000);
setInterval(persist,10000);
motionPreference.addEventListener?.('change',event=>{
  reducedMotion=event.matches;cancelAnimationFrame(raf);last=0;lastDraw=0;
  reducedAt=performance.now();if(!document.hidden)raf=requestAnimationFrame(tick);
});
document.addEventListener('visibilitychange',()=>{
  if(document.hidden){hiddenAt=Date.now();cancelAnimationFrame(raf);last=0;persist()}
  else{
    if(hiddenAt!==undefined)phase=(phase+Math.max(0,Date.now()-hiddenAt)/1000)%120;
    hiddenAt=undefined;reducedAt=performance.now();last=0;persist();raf=requestAnimationFrame(tick);
  }
});
window.addEventListener('pagehide',persist);requestAnimationFrame(tick);
