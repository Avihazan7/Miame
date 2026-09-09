import { chromium } from 'playwright';
const BASE='http://127.0.0.1:3411';
const route=process.argv[2]||'/';
const browser=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const ctx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,deviceScaleFactor:3,hasTouch:true});
const page=await ctx.newPage();
const cdp=await ctx.newCDPSession(page);
await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
const reqs=[];
page.on('response',async r=>{let len=0;try{len=(await r.body()).length}catch{};reqs.push({u:r.url(),t:r.request().resourceType(),len,s:r.status()});});
await page.addInitScript(()=>{
  window.__c=[];window.__s=[];
  new PerformanceObserver(l=>{for(const e of l.getEntries())window.__c.push({t:Math.round(e.startTime),size:e.size,url:e.url,
    el:e.element?(e.element.tagName+'.'+String(e.element.className||'').trim().split(/\s+/).join('.')):null});}).observe({type:'largest-contentful-paint',buffered:true});
  new PerformanceObserver(l=>{for(const e of l.getEntries()){if(e.hadRecentInput)continue;
    window.__s.push({v:+e.value.toFixed(4),t:Math.round(e.startTime),src:(e.sources||[]).map(s=>({n:s.node?s.node.tagName+'.'+String(s.node.className||'').trim().split(/\s+/)[0]:'?',
      prev:s.previousRect?[s.previousRect.x|0,s.previousRect.y|0,s.previousRect.width|0,s.previousRect.height|0]:null,
      cur:s.currentRect?[s.currentRect.x|0,s.currentRect.y|0,s.currentRect.width|0,s.currentRect.height|0]:null}))});}}).observe({type:'layout-shift',buffered:true});
});
await page.goto(BASE+route,{waitUntil:'load'});
await page.waitForTimeout(9000);
const r=await page.evaluate(()=>({c:window.__c,s:window.__s}));
console.log('--- LCP candidates:'); r.c.forEach(c=>console.log('  ',c.t+'ms',c.size,c.el,(c.url||'').replace('http://127.0.0.1:3411','')));
console.log('--- shifts:'); r.s.forEach(x=>console.log('  ',x.t+'ms v='+x.v, JSON.stringify(x.src)));
console.log('--- all image requests:');
reqs.filter(x=>x.t==='image').forEach(x=>console.log('   ',(x.len/1024).toFixed(0)+'KB',decodeURIComponent(x.u).replace(BASE,'')));
// which <img> asked for w=2599
const info=await page.evaluate(()=>Array.from(document.images).map(i=>({src:decodeURIComponent(i.currentSrc||i.src).slice(-90),cls:i.className,w:i.width,h:i.height,nw:i.naturalWidth,loading:i.loading,fp:i.getAttribute('fetchpriority')})));
console.log('--- <img> elements:'); info.forEach(i=>console.log('   ',i.cls||'(no class)','css='+i.w+'x'+i.h,'nat='+i.nw,'fp='+i.fp,i.src));
await browser.close();
