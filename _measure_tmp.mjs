import { chromium } from 'playwright';
const BASE='http://127.0.0.1:3414';
const ROUTES=process.argv.slice(2);
const browser=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
for(const route of ROUTES){
  const ctx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,deviceScaleFactor:3,hasTouch:true});
  const page=await ctx.newPage();
  const cdp=await ctx.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
  const reqs=[];
  page.on('response',async r=>{
    let len=0; try{ const b=await r.body(); len=b.length; }catch{}
    reqs.push({url:r.url(),status:r.status(),type:r.request().resourceType(),len});
  });
  await page.addInitScript(()=>{
    window.__lcp=null; window.__cls=0; window.__long=[]; window.__shifts=[];
    new PerformanceObserver(l=>{const e=l.getEntries();const last=e[e.length-1];
      window.__lcp={t:Math.round(last.startTime),size:last.size,url:last.url,
        el:last.element?(last.element.tagName+(last.element.className?('.'+String(last.element.className).split(' ').slice(0,3).join('.')):'')):null};
    }).observe({type:'largest-contentful-paint',buffered:true});
    new PerformanceObserver(l=>{for(const e of l.getEntries()){if(!e.hadRecentInput){window.__cls+=e.value;
      window.__shifts.push({v:+e.value.toFixed(4),t:Math.round(e.startTime),
        srcs:(e.sources||[]).map(s=>s.node?(s.node.tagName+'.'+String(s.node.className||'').split(' ')[0]):'?')});}}
    }).observe({type:'layout-shift',buffered:true});
    new PerformanceObserver(l=>{for(const e of l.getEntries())window.__long.push(Math.round(e.duration));}).observe({type:'longtask',buffered:true});
  });
  const t0=Date.now();
  await page.goto(BASE+route,{waitUntil:'load'});
  await page.waitForTimeout(4000);
  const before=await page.evaluate(()=>({lcp:window.__lcp,cls:window.__cls,shifts:window.__shifts,long:window.__long}));
  // scroll pass
  await page.evaluate(async()=>{for(let y=0;y<document.body.scrollHeight;y+=600){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,90));}});
  await page.waitForTimeout(1500);
  const after=await page.evaluate(()=>({cls:window.__cls,shifts:window.__shifts,long:window.__long,
    nodes:document.querySelectorAll('*').length,
    reveal:document.querySelectorAll('.reveal').length,
    willchange:Array.from(document.querySelectorAll('*')).filter(e=>getComputedStyle(e).willChange!=='auto').length,
    anim:document.getAnimations?document.getAnimations().length:-1}));
  const byType={};
  for(const r of reqs){byType[r.type]=(byType[r.type]||{n:0,b:0});byType[r.type].n++;byType[r.type].b+=r.len;}
  console.log('==== '+route);
  console.log(' LCP', before.lcp);
  console.log(' CLS at load', +before.cls.toFixed(4), ' after scroll', +after.cls.toFixed(4));
  console.log(' shifts', JSON.stringify(after.shifts.slice(0,8)));
  console.log(' longtasks(load)', before.long, 'total after scroll', after.long.length, 'sum', after.long.reduce((a,b)=>a+b,0));
  console.log(' DOM nodes', after.nodes, '.reveal', after.reveal, 'will-change elems', after.willchange, 'running animations', after.anim);
  console.log(' bytes by type', Object.entries(byType).map(([k,v])=>`${k}:${v.n}/${(v.b/1024).toFixed(0)}KB`).join('  '));
  const imgs=reqs.filter(r=>r.type==='image').sort((a,b)=>b.len-a.len).slice(0,12);
  for(const i of imgs) console.log('   IMG',(i.len/1024).toFixed(0)+'KB',i.status,decodeURIComponent(i.url).replace(BASE,''));
  const fonts=reqs.filter(r=>r.type==='font');
  console.log('   FONTS',fonts.length,(fonts.reduce((a,b)=>a+b.len,0)/1024).toFixed(0)+'KB',fonts.map(f=>f.url.split('/').pop()).join(','));
  console.log(' TOTAL', (reqs.reduce((a,b)=>a+b.len,0)/1024).toFixed(0)+'KB in', reqs.length,'requests');
  await ctx.close();
}
await browser.close();
