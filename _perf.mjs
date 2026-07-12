import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 });
const cdp = await p.context().newCDPSession(p);
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
let videoBytes = 0, totalBytes = 0;
p.on('response', async r => { const h=r.headers(); const len=+(h['content-length']||0); totalBytes+=len; if(r.url().includes('.mp4')) videoBytes+=len; });
await p.goto('http://localhost:3100/', { waitUntil: 'load' });
// scroll through whole page (simulate a real read) to prove video still isn't fetched
await p.evaluate(async()=>{ for(let y=0;y<document.body.scrollHeight;y+=700){window.scrollTo(0,y); await new Promise(r=>setTimeout(r,120));} });
await p.waitForTimeout(2000);
const lcp = await p.evaluate(()=>new Promise(res=>{let v=0;new PerformanceObserver(l=>{const e=l.getEntries();v=Math.round(e[e.length-1].startTime);}).observe({type:'largest-contentful-paint',buffered:true});setTimeout(()=>res(v),800);}));
console.log('LCP', lcp, 'ms');
console.log('MP4 bytes fetched on load+scroll:', (videoBytes/1024|0)+'KB');
console.log('TOTAL transfer (content-length sum):', (totalBytes/1024|0)+'KB');
// now click play and confirm it DOES load
await p.locator('.fm-video').scrollIntoViewIfNeeded();
await p.evaluate(()=>{ const v=document.querySelector('.fm-video'); v.muted=true; return v.play().catch(()=>{}); });
await p.waitForTimeout(2500);
console.log('MP4 bytes after pressing play:', (videoBytes/1024|0)+'KB (should be >0 now)');
await b.close();
