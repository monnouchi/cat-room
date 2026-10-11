import test from 'node:test';
import assert from 'node:assert/strict';
import {setupCapture} from '../capture.js';
function boot({supported=false,shareError,blobError=false,saveError=false}={}) {
 const elements={};for(const id of ['button','dialog','preview','save','share','close','status'])elements[id]={disabled:false,textContent:'',removeAttribute(){},addEventListener(name,fn){this['on-'+name]=fn}};
 let callback,downloads=0,shares=0,revoked=0;
 elements.dialog.showModal=function(){this.open=true};elements.dialog.close=function(){this.open=false;this['on-close']()};
 setupCapture({...elements,canvas:{toBlob(fn){callback=()=>fn(blobError?null:new Blob(['pixels'],{type:'image/png'}))}},
  navigator:{canShare:()=>supported,share:async()=>{shares++;if(shareError)throw shareError}},
  document:{body:{appendChild(){}},createElement:()=>({click(){if(saveError)throw Error();downloads++},remove(){}})},
  URL:{createObjectURL:()=> 'blob:test',revokeObjectURL:()=>revoked++},File:globalThis.File});
 return {...elements,finish:()=>callback(),downloads:()=>downloads,shares:()=>shares,revoked:()=>revoked};
}
test('capture locks repeated taps, unsupported share falls back to download',async()=>{const b=boot();const pending=b.button.onclick();b.button.onclick();assert.equal(b.button.disabled,true);b.finish();await pending;assert.equal(b.dialog.open,true);assert.equal(b.share.hidden,true);b.save.onclick();assert.equal(b.downloads(),1);b.close.onclick();assert.equal(b.revoked(),1)});
test('native share uses explicit tap and cancellation allows another attempt',async()=>{const b=boot({supported:true,shareError:{name:'AbortError'}});const pending=b.button.onclick();b.finish();await pending;assert.equal(b.shares(),0);assert.equal(b.share.hidden,false);const sending=b.share.onclick();b.share.onclick();await sending;assert.equal(b.shares(),1);assert.equal(b.status.textContent,'');assert.equal(b.share.disabled,false);b.save.onclick();assert.equal(b.downloads(),1)});
test('image and save failures allow recovery',async()=>{for(const options of [{blobError:true},{saveError:true},{supported:true,shareError:{name:'NotAllowedError'}}]){const b=boot(options);const pending=b.button.onclick();b.finish();await pending;assert.equal(b.button.disabled,false);if(options.blobError)assert.match(b.status.textContent,/しゃしん/);if(options.saveError){b.save.onclick();assert.match(b.status.textContent,/ほぞんでき/)}if(options.shareError){await b.share.onclick();assert.match(b.status.textContent,/おくれ/)}b.close.onclick();assert.equal(b.dialog.open,false)}});

test('capture does not depend on animation or persisted state and can reopen',async()=>{const b=boot();for(let i=0;i<2;i++){const pending=b.button.onclick();b.finish();await pending;b.save.onclick();b.save.onclick();assert.equal(b.downloads(),i+1);b.close.onclick();assert.equal(b.dialog.open,false)}});
