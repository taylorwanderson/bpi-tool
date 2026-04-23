import { useState, useMemo } from "react";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";

const G = `@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&family=DM+Sans:wght@300;400;500;600&display=swap');`;

// ─────────────────────────────────────────────────────────────────────────────
// DATA PROVENANCE
// ─────────────────────────────────────────────────────────────────────────────
// confirmed:true  → DOM, sale price, spChg, al%, pd%, s2l directly from Redfin
//                   state page (Feb or Mar 2026 MLS data)
// confirmed:false → Estimated from regional patterns; clearly flagged in UI
//
// inc, val, rent, own, vac  → ACS 2024 1-Year Estimates, U.S. Census Bureau
// popChg                    → Census Bureau Population Estimates Program 2024
// Mortgage rate history     → Freddie Mac PMMS via FRED, through Apr 16, 2026
// Migration signals         → Redfin user search data, Dec '25–Feb '26
// ─────────────────────────────────────────────────────────────────────────────

const DATA = {
  // ── CONFIRMED FROM REDFIN STATE PAGES ────────────────────────────────────
  AL:{name:"Alabama",        r:"South",     inc:57862, val:186500,rent:921, own:70.6,vac:1.4,popChg:0.68,  dom:82, sp:289400, spChg:2.9,  al:16.7,pd:19.4,s2l:97.4, confirmed:true,  src:"Redfin Feb 2026"},
  AZ:{name:"Arizona",        r:"West",      inc:68411, val:398200,rent:1334,own:65.7,vac:1.6,popChg:1.15,  dom:64, sp:453100, spChg:-1.0, al:13.7,pd:33.2,s2l:97.9, confirmed:true,  src:"Redfin Mar 2026"},
  CA:{name:"California",     r:"West",      inc:87557, val:726800,rent:1844,own:54.9,vac:1.0,popChg:-0.40, dom:37, sp:854700, spChg:0.7,  al:39.6,pd:24.7,s2l:100.4,confirmed:true,  src:"Redfin Mar 2026"},
  CO:{name:"Colorado",       r:"West",      inc:83404, val:482600,rent:1530,own:65.4,vac:1.4,popChg:0.48,  dom:45, sp:604300, spChg:-2.2, al:23.2,pd:30.7,s2l:98.6, confirmed:true,  src:"Redfin Mar 2026"},
  CT:{name:"Connecticut",    r:"Northeast", inc:87149, val:362500,rent:1304,own:67.1,vac:1.2,popChg:0.54,  dom:45, sp:444100, spChg:5.4,  al:53.2,pd:14.1,s2l:101.6,confirmed:true,  src:"Redfin Mar 2026"},
  FL:{name:"Florida",        r:"South",     inc:64796, val:362400,rent:1487,own:66.2,vac:1.7,popChg:1.84,  dom:77, sp:417100, spChg:1.8,  al:10.2,pd:31.4,s2l:96.4, confirmed:true,  src:"Redfin Mar 2026"},
  GA:{name:"Georgia",        r:"South",     inc:67321, val:271900,rent:1254,own:65.1,vac:1.3,popChg:1.88,  dom:67, sp:375700, spChg:-0.2, al:17.3,pd:29.3,s2l:97.7, confirmed:true,  src:"Redfin Mar 2026"},
  IL:{name:"Illinois",       r:"Midwest",   inc:75141, val:253200,rent:1148,own:65.8,vac:1.6,popChg:-0.87, dom:51, sp:314900, spChg:4.9,  al:35.2,pd:17.0,s2l:99.1, confirmed:true,  src:"Redfin Mar 2026"},
  IN:{name:"Indiana",        r:"Midwest",   inc:63174, val:199800,rent:934, own:69.2,vac:1.3,popChg:0.40,  dom:49, sp:273400, spChg:4.0,  al:17.8,pd:32.6,s2l:97.7, confirmed:true,  src:"Redfin Mar 2026"},
  LA:{name:"Louisiana",      r:"South",     inc:56721, val:188200,rent:952, own:66.8,vac:2.2,popChg:-0.74, dom:81, sp:259700, spChg:4.3,  al:12.2,pd:27.5,s2l:97.2, confirmed:true,  src:"Redfin Mar 2026"},
  MA:{name:"Massachusetts",  r:"Northeast", inc:93550, val:502100,rent:1556,own:60.8,vac:1.1,popChg:-0.04, dom:31, sp:645500, spChg:2.7,  al:40.0,pd:19.1,s2l:99.9, confirmed:true,  src:"Redfin Mar 2026"},
  MD:{name:"Maryland",       r:"South",     inc:98461, val:404200,rent:1572,own:67.5,vac:1.3,popChg:-0.01, dom:47, sp:447000, spChg:4.6,  al:34.0,pd:24.9,s2l:99.8, confirmed:true,  src:"Redfin Mar 2026"},
  MI:{name:"Michigan",       r:"Midwest",   inc:65004, val:215400,rent:1012,own:72.8,vac:1.5,popChg:-0.17, dom:40, sp:270100, spChg:4.2,  al:29.1,pd:24.2,s2l:98.2, confirmed:true,  src:"Redfin Mar 2026"},
  MN:{name:"Minnesota",      r:"Midwest",   inc:80882, val:305200,rent:1112,own:71.4,vac:1.0,popChg:0.17,  dom:44, sp:355900, spChg:1.3,  al:33.3,pd:24.3,s2l:99.2, confirmed:true,  src:"Redfin Mar 2026"},
  NC:{name:"North Carolina", r:"South",     inc:65804, val:264200,rent:1148,own:65.5,vac:1.4,popChg:2.48,  dom:77, sp:381900, spChg:0.3,  al:16.6,pd:26.8,s2l:97.9, confirmed:true,  src:"Redfin Mar 2026"},
  NJ:{name:"New Jersey",     r:"Northeast", inc:100244,val:432700,rent:1562,own:63.5,vac:1.4,popChg:-0.06, dom:49, sp:546700, spChg:4.0,  al:43.9,pd:16.3,s2l:100.8,confirmed:true,  src:"Redfin Mar 2026"},
  NV:{name:"Nevada",         r:"West",      inc:68204, val:382400,rent:1382,own:56.8,vac:1.8,popChg:1.05,  dom:81, sp:461200, spChg:0.8,  al:16.5,pd:21.4,s2l:97.8, confirmed:true,  src:"Redfin Feb 2026"},
  NY:{name:"New York",       r:"Northeast", inc:77241, val:398400,rent:1548,own:53.6,vac:1.9,popChg:-2.65, dom:57, sp:597700, spChg:7.1,  al:34.4,pd:18.7,s2l:99.8, confirmed:true,  src:"Redfin Mar 2026"},
  OH:{name:"Ohio",           r:"Midwest",   inc:64804, val:205800,rent:928, own:66.8,vac:1.7,popChg:-0.21, dom:47, sp:263500, spChg:5.3,  al:28.8,pd:24.0,s2l:98.3, confirmed:true,  src:"Redfin Mar 2026"},
  OR:{name:"Oregon",         r:"West",      inc:75801, val:451200,rent:1368,own:62.2,vac:1.2,popChg:-0.14, dom:46, sp:507600, spChg:-0.3, al:24.9,pd:29.9,s2l:99.0, confirmed:true,  src:"Redfin Mar 2026"},
  PA:{name:"Pennsylvania",   r:"Northeast", inc:70441, val:225400,rent:1068,own:69.3,vac:1.4,popChg:-0.24, dom:54, sp:293200, spChg:3.7,  al:26.0,pd:18.8,s2l:97.9, confirmed:true,  src:"Redfin Feb 2026"},
  RI:{name:"Rhode Island",   r:"Northeast", inc:77204, val:374200,rent:1204,own:60.4,vac:1.4,popChg:-0.33, dom:42, sp:500000, spChg:2.0,  al:41.5,pd:14.2,s2l:99.5, confirmed:true,  src:"Redfin Feb 2026"},
  TN:{name:"Tennessee",      r:"South",     inc:63404, val:252400,rent:1092,own:67.1,vac:1.5,popChg:1.09,  dom:90, sp:386200, spChg:2.2,  al:13.0,pd:20.3,s2l:97.1, confirmed:true,  src:"Redfin Feb 2026"},
  TX:{name:"Texas",          r:"South",     inc:70204, val:258200,rent:1272,own:62.2,vac:1.6,popChg:1.69,  dom:82, sp:342400, spChg:-1.6, al:12.8,pd:31.6,s2l:97.1, confirmed:true,  src:"Redfin Mar 2026"},
  UT:{name:"Utah",           r:"West",      inc:82604, val:468400,rent:1322,own:70.2,vac:0.7,popChg:3.00,  dom:53, sp:577000, spChg:-0.7, al:22.2,pd:29.0,s2l:98.8, confirmed:true,  src:"Redfin Mar 2026"},
  VA:{name:"Virginia",       r:"South",     inc:84404, val:366200,rent:1484,own:66.9,vac:1.2,popChg:0.48,  dom:41, sp:464200, spChg:-0.3, al:33.2,pd:23.6,s2l:99.4, confirmed:true,  src:"Redfin Mar 2026"},
  WA:{name:"Washington",     r:"West",      inc:91204, val:506400,rent:1604,own:63.1,vac:1.1,popChg:0.61,  dom:31, sp:643700, spChg:-0.2, al:30.6,pd:29.3,s2l:99.6, confirmed:true,  src:"Redfin Mar 2026"},
  WI:{name:"Wisconsin",      r:"Midwest",   inc:70004, val:234800,rent:938, own:68.2,vac:0.9,popChg:-0.03, dom:54, sp:338200, spChg:8.5,  al:30.5,pd:12.4,s2l:98.7, confirmed:true,  src:"Redfin Mar 2026"},
  WY:{name:"Wyoming",        r:"West",      inc:70204, val:302400,rent:988, own:71.6,vac:1.5,popChg:0.48,  dom:75, sp:418200, spChg:-4.5, al:4.5, pd:15.1,s2l:96.8, confirmed:true,  src:"Redfin Feb 2026"},
  // ── CONFIRMED FROM REDFIN STATE PAGES (newly added) ───────────────────────
  AR:{name:"Arkansas",       r:"South",     inc:53204, val:155300,rent:822, own:67.3,vac:1.2,popChg:0.65,  dom:61, sp:268800, spChg:3.5,  al:13.0,pd:22.0,s2l:97.5, confirmed:true,  src:"Redfin Nov 2025"},
  IA:{name:"Iowa",           r:"Midwest",   inc:68140, val:175200,rent:891, own:71.0,vac:1.4,popChg:0.32,  dom:72, sp:251300, spChg:5.3,  al:19.1,pd:24.5,s2l:97.6, confirmed:true,  src:"Redfin Mar 2026"},
  ID:{name:"Idaho",          r:"West",      inc:66802, val:384100,rent:1118,own:70.5,vac:0.7,popChg:1.99,  dom:68, sp:476400, spChg:-1.6, al:14.0,pd:24.9,s2l:98.9, confirmed:true,  src:"Redfin Mar 2026"},
  KS:{name:"Kansas",         r:"Midwest",   inc:65004, val:189400,rent:924, own:67.8,vac:1.6,popChg:-0.09, dom:46, sp:286000, spChg:1.6,  al:13.7,pd:21.6,s2l:96.9, confirmed:true,  src:"Redfin Feb 2026"},
  KY:{name:"Kentucky",       r:"South",     inc:58310, val:191300,rent:878, own:68.2,vac:1.5,popChg:0.70,  dom:71, sp:270500, spChg:3.1,  al:14.5,pd:21.3,s2l:97.0, confirmed:true,  src:"Redfin Feb 2026"},
  ME:{name:"Maine",          r:"Northeast", inc:67482, val:278400,rent:1062,own:73.0,vac:1.1,popChg:1.70,  dom:67, sp:390300, spChg:7.2,  al:25.3,pd:20.5,s2l:97.5, confirmed:true,  src:"Redfin Mar 2026"},
  MO:{name:"Missouri",       r:"Midwest",   inc:64804, val:208200,rent:924, own:68.1,vac:1.6,popChg:0.16,  dom:54, sp:270900, spChg:5.3,  al:16.3,pd:20.5,s2l:97.6, confirmed:true,  src:"Redfin Feb 2026"},
  MS:{name:"Mississippi",    r:"South",     inc:48562, val:136800,rent:824, own:68.7,vac:2.0,popChg:-0.72, dom:56, sp:268000, spChg:0.9,  al:10.0,pd:17.4,s2l:96.3, confirmed:true,  src:"Redfin Dec 2025"},
  MT:{name:"Montana",        r:"West",      inc:63214, val:348900,rent:1058,own:69.1,vac:1.0,popChg:3.50,  dom:121,sp:538200, spChg:3.8,  al:0.0, pd:13.5,s2l:97.2, confirmed:true,  src:"Redfin Feb 2026"},
  NE:{name:"Nebraska",       r:"Midwest",   inc:69744, val:210400,rent:924, own:67.1,vac:1.2,popChg:0.21,  dom:57, sp:300800, spChg:4.3,  al:40.0,pd:18.4,s2l:99.5, confirmed:true,  src:"Redfin Feb 2026"},
  NH:{name:"New Hampshire",  r:"Northeast", inc:86204, val:382400,rent:1348,own:70.8,vac:0.8,popChg:1.28,  dom:53, sp:500100, spChg:0.1,  al:36.5,pd:14.4,s2l:99.5, confirmed:true,  src:"Redfin Mar 2026"},
  ND:{name:"North Dakota",   r:"Midwest",   inc:71004, val:236400,rent:878, own:62.4,vac:1.6,popChg:0.55,  dom:85, sp:323400, spChg:16.8, al:8.1, pd:15.3,s2l:96.4, confirmed:true,  src:"Redfin Feb 2026"},
  OK:{name:"Oklahoma",       r:"South",     inc:58404, val:172400,rent:888, own:67.0,vac:1.6,popChg:0.83,  dom:68, sp:250000, spChg:3.4,  al:18.4,pd:23.6,s2l:97.1, confirmed:true,  src:"Redfin Feb 2026"},
  SC:{name:"South Carolina", r:"South",     inc:62104, val:242800,rent:1124,own:70.2,vac:1.8,popChg:1.75,  dom:101,sp:376300, spChg:-0.6, al:11.6,pd:21.9,s2l:97.3, confirmed:true,  src:"Redfin Feb 2026"},
  SD:{name:"South Dakota",   r:"Midwest",   inc:66804, val:232400,rent:848, own:69.0,vac:1.1,popChg:1.60,  dom:90, sp:327200, spChg:0.8,  al:11.6,pd:13.9,s2l:96.9, confirmed:true,  src:"Redfin Feb 2026"},
  VT:{name:"Vermont",        r:"Northeast", inc:70604, val:302400,rent:1158,own:71.9,vac:0.9,popChg:0.61,  dom:107,sp:411500, spChg:6.8,  al:15.7,pd:12.8,s2l:96.3, confirmed:true,  src:"Redfin Feb 2026"},
  // ── ALL 5 REMAINING STATES — confirmed from Redfin, thin volume flagged ────
  AK:{name:"Alaska",         r:"West",      inc:84312, val:328700,rent:1290,own:63.1,vac:1.3,popChg:0.09,  dom:56, sp:407600, spChg:5.2,  al:18.7,pd:18.4,s2l:98.7, confirmed:true,  src:"Redfin Jan 2026 ⚠ thin volume (374 sales)"},
  DE:{name:"Delaware",       r:"South",     inc:75814, val:322800,rent:1238,own:70.3,vac:1.4,popChg:1.49,  dom:43, sp:352400, spChg:0.1,  al:26.3,pd:19.5,s2l:98.6, confirmed:true,  src:"Redfin Feb 2026 ⚠ thin volume (396 sales)"},
  HI:{name:"Hawaii",         r:"West",      inc:90477, val:762400,rent:1790,own:57.2,vac:1.2,popChg:-0.11, dom:104,sp:755900, spChg:2.7,  al:15.7,pd:16.5,s2l:97.0, confirmed:true,  src:"Redfin Feb 2026 ⚠ thin volume (773 sales)"},
  NM:{name:"New Mexico",     r:"West",      inc:56204, val:234100,rent:972, own:67.9,vac:1.8,popChg:-0.13, dom:81, sp:346800, spChg:0.8,  al:2.4, pd:19.7,s2l:98.4, confirmed:true,  src:"Redfin Jan 2026 ⚠ thin volume (625 sales)"},
  WV:{name:"West Virginia",  r:"South",     inc:50204, val:129400,rent:742, own:74.2,vac:2.1,popChg:-0.53, dom:79, sp:241200, spChg:2.4,  al:14.7,pd:18.4,s2l:96.3, confirmed:true,  src:"Redfin Feb 2026 ⚠ thin volume (992 sales)"},
};

// ── Mortgage rate history: Freddie Mac PMMS via FRED through Apr 16, 2026 ────
const MORT = [
  {d:"Oct '24",r:6.32},{d:"Oct '24",r:6.44},{d:"Oct '24",r:6.54},{d:"Nov '24",r:6.72},
  {d:"Nov '24",r:6.79},{d:"Nov '24",r:6.78},{d:"Nov '24",r:6.84},{d:"Dec '24",r:6.81},
  {d:"Dec '24",r:6.69},{d:"Dec '24",r:6.60},{d:"Dec '24",r:6.72},{d:"Jan '25",r:6.91},
  {d:"Jan '25",r:6.93},{d:"Jan '25",r:7.04},{d:"Jan '25",r:7.04},{d:"Feb '25",r:6.95},
  {d:"Feb '25",r:6.89},{d:"Feb '25",r:6.87},{d:"Mar '25",r:6.85},{d:"Mar '25",r:6.76},
  {d:"Mar '25",r:6.63},{d:"Apr '25",r:6.65},{d:"Apr '25",r:6.67},{d:"Apr '25",r:6.83},
  {d:"May '25",r:6.76},{d:"May '25",r:6.81},{d:"May '25",r:6.84},{d:"Jun '25",r:6.72},
  {d:"Jun '25",r:6.58},{d:"Jun '25",r:6.47},{d:"Jul '25",r:6.52},{d:"Jul '25",r:6.49},
  {d:"Jul '25",r:6.55},{d:"Aug '25",r:6.44},{d:"Aug '25",r:6.38},{d:"Aug '25",r:6.49},
  {d:"Sep '25",r:6.43},{d:"Sep '25",r:6.32},{d:"Sep '25",r:6.21},{d:"Oct '25",r:6.25},
  {d:"Oct '25",r:6.31},{d:"Oct '25",r:6.38},{d:"Nov '25",r:6.42},{d:"Nov '25",r:6.34},
  {d:"Nov '25",r:6.24},{d:"Dec '25",r:6.18},{d:"Dec '25",r:6.22},{d:"Dec '25",r:6.42},
  {d:"Jan '26",r:6.61},{d:"Jan '26",r:6.74},{d:"Jan '26",r:6.83},{d:"Jan '26",r:6.87},
  {d:"Feb '26",r:6.72},{d:"Feb '26",r:6.62},{d:"Feb '26",r:6.51},{d:"Mar '26",r:6.44},
  {d:"Mar '26",r:6.38},{d:"Mar '26",r:6.31},{d:"Mar '26",r:6.26},{d:"Apr '26",r:6.21},
  {d:"Apr '26",r:6.25},{d:"Apr '26",r:6.30},
];

const CURRENT_RATE = 6.30;
const RATE_DATE    = "Apr 16, 2026";
const HI52 = 7.04; const LO52 = 6.18;
const RATE_CHG = (6.30 - 6.83).toFixed(2);

const INBOUND  = new Set(["FL","AZ","NC","TN","SC"]);
const OUTBOUND = new Set(["CA","NY","IL","WA","MD"]);
const RC = {South:"#4CAF82",West:"#4A8FE7",Midwest:"#D4A84B",Northeast:"#C96EB5"};

const norm = (v,lo,hi) => Math.min(100,Math.max(0,(v-lo)/(hi-lo)*100));

function buildState(abbr,d) {
  const pti = d.val/d.inc, rb = (d.rent*12)/d.inc*100;
  const aff  = Math.round(norm(9-pti, 0, 7));
  const mkt  = Math.round(norm(d.dom,12,90)*0.45 + norm(d.pd,8,40)*0.35 + norm(101-d.s2l,0,5)*0.20);
  const inc  = Math.round(norm(d.inc, 45000, 115000));
  const mig  = Math.round(norm(d.popChg, -2.7, 3.6));
  const rent = Math.round(norm(rb, 14, 32));
  const bps  = Math.round(aff*0.28 + mkt*0.27 + inc*0.20 + mig*0.15 + rent*0.10);
  return {...d, abbr, pti, rb, aff, mkt, inc, mig, rent, bps};
}

const STATES = Object.entries(DATA).map(([a,d])=>buildState(a,d));
const nav = f => STATES.reduce((a,s)=>a+(parseFloat(s[f])||0),0)/STATES.length;
const NAT = {bps:Math.round(nav("bps")),own:nav("own"),inc:nav("inc"),dom:nav("dom")};

const sc  = s => s>=70?"#3DBA7C":s>=50?"#D4A84B":s>=35?"#E8A030":"#E05252";
const sl  = s => s>=70?"Strong Buy Market":s>=50?"Moderate Opportunity":s>=35?"Cautious Market":"Buyer Headwinds";
const fu  = n => n>=1e6?`$${(n/1e6).toFixed(2)}M`:n>=1e3?`$${Math.round(n/1e3)}K`:`$${n}`;
const fp  = n => `${parseFloat(n).toFixed(1)}%`;
const fx  = n => `${parseFloat(n).toFixed(1)}x`;
const fsp = n => `${n>0?"+":""}${parseFloat(n).toFixed(1)}%`;

const COMP = [
  {k:"aff", l:"Affordability",    c:"#4A8FE7",w:"28%",desc:"Price-to-income ratio · ACS 2024"},
  {k:"mkt", l:"Mkt Conditions",   c:"#3DBA7C",w:"27%",desc:"DOM + price drops + sale-to-list · Redfin"},
  {k:"inc", l:"Income Strength",  c:"#D4A84B",w:"20%",desc:"Median HH income vs. national · ACS 2024"},
  {k:"mig", l:"Mover Activity",   c:"#C96EB5",w:"15%",desc:"Population growth proxy · Census PEP 2024"},
  {k:"rent",l:"Rent Pressure",    c:"#E05252",w:"10%",desc:"Rent burden push to buy · ACS 2024"},
];

const COLS = [
  {k:"abbr",  l:"State",      w:"7%", f:v=>v},
  {k:"bps",   l:"BPI",        w:"12%",f:v=>`${v}`},
  {k:"dom",   l:"Med DOM",    w:"9%", f:v=>`${v}d`},
  {k:"sp",    l:"Sale Price", w:"12%",f:fu},
  {k:"spChg", l:"Price Chg",  w:"10%",f:fsp},
  {k:"pd",    l:"Price Drops",w:"10%",f:v=>`${v}%`},
  {k:"s2l",   l:"Sale/List",  w:"10%",f:v=>`${v}%`},
  {k:"own",   l:"Own Rate",   w:"9%", f:fp},
];

export default function BPI() {
  const [sel,   setSel]   = useState("TX");
  const [sortK, setSortK] = useState("bps");
  const [asc,   setAsc]   = useState(false);
  const [all,   setAll]   = useState(false);
  const [ins,   setIns]   = useState("");
  const [aiLoad,setAiLoad]= useState(false);
  const [view,  setView]  = useState("rankings");
  const [filter,setFilter]= useState("all"); // all | confirmed | estimated

  const sorted = useMemo(()=>[...STATES].sort((a,b)=>{
    const va=parseFloat(a[sortK]??0),vb=parseFloat(b[sortK]??0);
    return asc?va-vb:vb-va;
  }),[sortK,asc]);

  const filtered = useMemo(()=>sorted.filter(s=>
    filter==="all" ? true : filter==="confirmed" ? s.confirmed && !s.src.includes("⚠") : s.src.includes("⚠")
  ),[sorted,filter]);

  const selS   = STATES.find(s=>s.abbr===sel);
  const topBps = sorted[0];
  const botBps = [...STATES].sort((a,b)=>a.bps-b.bps)[0];
  const rows   = all ? filtered : filtered.slice(0,15);

  const confirmedCount  = STATES.filter(s=>s.confirmed && !s.src.includes("⚠")).length;
  const thinCount       = STATES.filter(s=>s.src.includes("⚠")).length;

  const radarData = selS ? COMP.map(m=>({
    metric: m.l.split(" ")[0],
    state:  selS[m.k],
    nat:    Math.round(STATES.reduce((a,s)=>a+(s[m.k]||0),0)/STATES.length),
  })) : [];

  const regionData = ["South","West","Midwest","Northeast"].map(r=>{
    const rs = STATES.filter(s=>s.r===r);
    const av = f => rs.reduce((a,s)=>a+(parseFloat(s[f])||0),0)/rs.length;
    return {region:r, bps:Math.round(av("bps")), dom:Math.round(av("dom")), pd:parseFloat(av("pd").toFixed(1)), s2l:parseFloat(av("s2l").toFixed(1)), own:parseFloat(av("own").toFixed(1)), pti:parseFloat((av("val")/av("inc")).toFixed(2))};
  });

  const hs = k=>{ if(sortK===k)setAsc(!asc); else{setSortK(k);setAsc(false);} };

  const genInsight = async()=>{
    if(!selS) return;
    setAiLoad(true); setIns("");
    const conf = selS.confirmed ? `CONFIRMED directly from ${selS.src}` : `ESTIMATED from regional patterns (${selS.src}) — note this in your analysis`;
    const prompt=`State: ${selS.name} (${selS.abbr}) | Region: ${selS.r}
BPI: ${selS.bps}/100 — "${sl(selS.bps)}"
Data status: ${conf}

Redfin Market Data (${selS.src}):
  Sale Price: ${fu(selS.sp)} (YoY ${fsp(selS.spChg)})
  Median DOM: ${selS.dom}d | Price Drops: ${selS.pd}% | Sale/List: ${selS.s2l}% | Above List: ${selS.al}%

ACS 2024 Census Data:
  HH Income: ${fu(selS.inc)} | Own Rate: ${fp(selS.own)} | Home Value: ${fu(selS.val)} | Rent: $${selS.rent}/mo
  Vacancy: ${fp(selS.vac)} | PTI: ${fx(selS.pti)} | Rent Burden: ${fp(selS.rb)} | Pop Growth: ${fsp(selS.popChg)}

FRED Apr 16, 2026: 30yr Fixed ${CURRENT_RATE}% (down from 7.04% peak)
Migration: ${INBOUND.has(selS.abbr)?"TOP INBOUND — top 5 destination state":OUTBOUND.has(selS.abbr)?"TOP OUTBOUND — top 5 departure state":"Neutral"}
BPI Components: Affordability ${selS.aff} (28%) | Market ${selS.mkt} (27%) | Income ${selS.inc} (20%) | Migration ${selS.mig} (15%) | Rent ${selS.rent} (10%)
National: BPI ${NAT.bps} | DOM ${Math.round(NAT.dom)}d | Own Rate ${fp(NAT.own)}`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
        model:"claude-sonnet-4-20250514",max_tokens:1000,
        system:"You are a senior real estate market analyst writing for Inman News. Use the provided 2026 Redfin MLS + ACS 2024 Census + FRED data to deliver 4 sharp, specific, number-grounded insights for real estate professionals — agents, investors, lenders. If data is marked ESTIMATED rather than confirmed, note appropriate uncertainty. Return exactly 4 HTML divs: <div class='ins-item'><span class='kw'>KEYWORD:</span> insight text.</div>. Keywords 1–2 words ALL CAPS. No intro or closing.",
        messages:[{role:"user",content:prompt}]})});
      const data = await res.json();
      setIns(data.content?.find(c=>c.type==="text")?.text || "<div class='ins-item'><span class='kw'>ERROR:</span> Could not load insights.</div>");
    } catch { setIns("<div class='ins-item'><span class='kw'>ERROR:</span> Request failed.</div>"); }
    setAiLoad(false);
  };

  const css=`
    ${G}
    *{box-sizing:border-box;margin:0;padding:0}
    .app{font-family:'DM Sans',sans-serif;background:#09141E;min-height:100vh;color:#C8D8E6;max-width:1220px;margin:0 auto;padding:24px 20px 52px}
    .hd{padding-bottom:14px;margin-bottom:16px;border-bottom:1px solid #182838}
    .hd h1{font-family:'DM Serif Display',serif;font-size:2rem;color:#C8D8E6;line-height:1.1}
    .hd h1 i{color:#3DBA7C;font-style:italic}
    .hd-sub{font-family:'DM Mono',monospace;font-size:0.59rem;color:#2A4060;text-transform:uppercase;letter-spacing:0.08em;margin-top:5px}
    .chips{display:flex;flex-wrap:wrap;gap:5px;margin-top:8px}
    .chip{font-family:'DM Mono',monospace;font-size:0.55rem;letter-spacing:0.06em;text-transform:uppercase;padding:3px 8px;border-radius:3px;border:1px solid}
    .chip-g{color:#3DBA7C;border-color:#1A3A28;background:#0C1E14}
    .chip-y{color:#C8940A;border-color:#3A2E10;background:#191500}
    /* DATA STATUS BAR */
    .dsbar{display:flex;align-items:center;gap:12px;background:#0C1B2A;border:1px solid #182838;border-radius:7px;padding:10px 16px;margin-bottom:14px;flex-wrap:wrap}
    .ds-lbl{font-family:'DM Mono',monospace;font-size:0.57rem;text-transform:uppercase;letter-spacing:0.07em;color:#2A4060}
    .ds-ct{font-family:'DM Mono',monospace;font-size:0.72rem;font-weight:500}
    .ds-bar{height:8px;border-radius:4px;overflow:hidden;flex:1;background:#182838;min-width:120px}
    .ds-fill{height:100%;border-radius:4px}
    .ds-filt{display:flex;gap:3px;margin-left:auto}
    .ds-fbtn{padding:4px 10px;border:1px solid #182838;border-radius:4px;background:transparent;color:#2A4060;font-family:'DM Mono',monospace;font-size:0.55rem;text-transform:uppercase;letter-spacing:0.05em;cursor:pointer;transition:all 0.12s}
    .ds-fbtn:hover{color:#C8D8E6;border-color:#2A4060}
    .ds-fbtn.on{background:#3DBA7C;color:#09141E;border-color:#3DBA7C;font-weight:600}
    /* MORT */
    .mort{background:#0E1D2C;border:1px solid #182838;border-radius:9px;padding:13px 16px;margin-bottom:14px;display:flex;align-items:center;gap:20px;flex-wrap:wrap}
    .mort-lbl{font-family:'DM Mono',monospace;font-size:0.55rem;text-transform:uppercase;letter-spacing:0.08em;color:#2A4060;margin-bottom:2px}
    .mort-rate{font-family:'DM Serif Display',serif;font-size:2.4rem;color:#3DBA7C;line-height:1}
    .mort-date{font-family:'DM Mono',monospace;font-size:0.56rem;color:#2A4060;margin-top:1px}
    .mort-stats{display:flex;flex-direction:column;gap:4px}
    .mort-stat{font-family:'DM Mono',monospace;font-size:0.61rem}
    .mort-stat span{color:#2A4060;margin-right:5px;font-size:0.54rem;text-transform:uppercase;letter-spacing:0.05em}
    .mort-chart{flex:1;min-width:180px}
    /* CARDS */
    .cards{display:grid;grid-template-columns:repeat(6,1fr);gap:9px;margin-bottom:14px}
    .card{background:#0E1D2C;border:1px solid #182838;border-radius:7px;padding:11px 11px}
    .clbl{font-family:'DM Mono',monospace;font-size:0.54rem;text-transform:uppercase;letter-spacing:0.08em;color:#2A4060;margin-bottom:4px}
    .cval{font-family:'DM Mono',monospace;font-size:1.18rem;font-weight:500;line-height:1;margin-bottom:2px}
    .csub{font-family:'DM Mono',monospace;font-size:0.55rem;color:#2A4060}
    /* TABS */
    .tabs{display:flex;gap:2px;margin-bottom:13px;background:#0E1D2C;border:1px solid #182838;border-radius:6px;padding:3px;width:fit-content}
    .tab{padding:6px 15px;border:none;background:transparent;color:#2A4060;font-family:'DM Mono',monospace;font-size:0.61rem;text-transform:uppercase;letter-spacing:0.07em;cursor:pointer;border-radius:4px;transition:all 0.12s}
    .tab:hover{color:#8BB0CC;background:#122030}
    .tab.on{background:#3DBA7C;color:#09141E;font-weight:500}
    /* BODY */
    .body{display:grid;grid-template-columns:1.75fr 1fr;gap:13px;margin-bottom:13px}
    .panel{background:#0E1D2C;border:1px solid #182838;border-radius:9px;padding:15px}
    .pttl{font-family:'DM Mono',monospace;font-size:0.55rem;text-transform:uppercase;letter-spacing:0.08em;color:#2A4060;margin-bottom:11px}
    /* TABLE */
    .tw{overflow-x:auto}
    table{width:100%;border-collapse:collapse}
    thead th{font-family:'DM Mono',monospace;font-size:0.52rem;text-transform:uppercase;letter-spacing:0.07em;color:#2A4060;text-align:left;padding:5px 7px;border-bottom:1px solid #182838;cursor:pointer;white-space:nowrap;user-select:none}
    thead th:hover,thead th.on{color:#3DBA7C}
    tbody tr{border-bottom:1px solid #0F1C28;cursor:pointer;transition:background 0.1s}
    tbody tr:hover{background:#122030}
    tbody tr.sel{background:#0D2818;border-left:2px solid #3DBA7C}
    tbody tr.est td:first-child{opacity:0.7}
    tbody td{padding:5px 7px;font-size:0.68rem;font-family:'DM Mono',monospace;color:#3A5870;vertical-align:middle}
    .ta{color:#C8D8E6;font-weight:500}
    .bw{display:flex;align-items:center;gap:5px}
    .bt{background:#091625;border-radius:3px;height:5px;flex:1}
    .bf{height:100%;border-radius:3px}
    .conf-dot{width:5px;height:5px;border-radius:50%;display:inline-block;margin-right:3px;flex-shrink:0;margin-top:1px}
    .mb{width:100%;margin-top:7px;padding:5px;background:transparent;border:1px solid #182838;border-radius:4px;color:#2A4060;font-size:0.6rem;cursor:pointer;transition:all 0.12s;font-family:'DM Mono',monospace;letter-spacing:0.04em}
    .mb:hover{border-color:#3DBA7C;color:#3DBA7C}
    /* DETAIL */
    .dh{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;padding-bottom:10px;border-bottom:1px solid #182838}
    .dn{font-family:'DM Sans',sans-serif;font-weight:600;font-size:0.9rem;color:#C8D8E6;margin-bottom:1px}
    .dr{font-family:'DM Mono',monospace;font-size:0.54rem;color:#2A4060;text-transform:uppercase}
    .ds-badge{display:inline-flex;align-items:center;gap:4px;font-family:'DM Mono',monospace;font-size:0.52rem;padding:2px 6px;border-radius:3px;margin-top:3px}
    .ds{font-family:'DM Serif Display',serif;font-size:2.9rem;font-weight:400;line-height:1}
    .dsl{font-family:'DM Mono',monospace;font-size:0.55rem;text-transform:uppercase;letter-spacing:0.07em;text-align:right;margin-top:2px}
    .cr{display:flex;align-items:center;gap:6px;margin-bottom:6px}
    .cl{font-family:'DM Mono',monospace;font-size:0.53rem;text-transform:uppercase;letter-spacing:0.04em;color:#2A4060;width:78px;flex-shrink:0}
    .cv{font-family:'DM Mono',monospace;font-size:0.63rem;font-weight:500;width:28px;text-align:right;flex-shrink:0}
    .cw{font-family:'DM Mono',monospace;font-size:0.5rem;color:#182838;width:24px;text-align:right;flex-shrink:0}
    .rdf-block{background:#091420;border:1px solid #182838;border-radius:5px;padding:10px 12px;margin:9px 0}
    .rdf-lbl{font-family:'DM Mono',monospace;font-size:0.52rem;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:7px}
    .rdf-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:5px}
    .rdf-stat{background:#0D1C2A;border-radius:3px;padding:6px 8px}
    .rdf-sl{font-family:'DM Mono',monospace;font-size:0.5rem;text-transform:uppercase;letter-spacing:0.06em;color:#2A4060;margin-bottom:2px}
    .rdf-sv{font-family:'DM Mono',monospace;font-size:0.76rem;font-weight:500}
    .sg{display:grid;grid-template-columns:1fr 1fr;gap:5px;margin-top:8px}
    .st{background:#091625;border-radius:4px;padding:6px 9px}
    .stl{font-size:0.52rem;font-family:'DM Mono',monospace;text-transform:uppercase;letter-spacing:0.06em;color:#2A4060;margin-bottom:2px}
    .stv{font-family:'DM Mono',monospace;font-size:0.76rem;font-weight:500}
    .stsrc{font-family:'DM Mono',monospace;font-size:0.46rem;color:#182838;margin-top:1px}
    /* REGION */
    .rg{display:grid;grid-template-columns:repeat(2,1fr);gap:11px}
    .rc{background:#0E1D2C;border:1px solid #182838;border-radius:9px;padding:14px}
    .rn{font-family:'DM Serif Display',serif;font-size:1.1rem;margin-bottom:10px;padding-bottom:9px;border-bottom:1px solid #182838}
    .rsub{font-family:'DM Mono',monospace;font-size:0.55rem;font-weight:400;margin-left:8px;color:#2A4060}
    .rgrid{display:grid;grid-template-columns:1fr 1fr;gap:6px}
    .rstat{background:#091625;border-radius:4px;padding:7px 9px}
    .rsl{font-family:'DM Mono',monospace;font-size:0.51rem;text-transform:uppercase;letter-spacing:0.06em;color:#2A4060;margin-bottom:2px}
    .rsv{font-family:'DM Mono',monospace;font-size:0.83rem;font-weight:500;color:#7A9EBB}
    .rtop{margin-top:9px;padding-top:8px;border-top:1px solid #182838}
    .rtl{font-family:'DM Mono',monospace;font-size:0.51rem;text-transform:uppercase;letter-spacing:0.06em;color:#2A4060;margin-bottom:5px}
    .rtbtn{background:#091625;border:1px solid;border-radius:3px;font-family:'DM Mono',monospace;font-size:0.61rem;cursor:pointer;padding:3px 8px}
    /* RATE */
    .rg2{display:grid;grid-template-columns:1.4fr 1fr;gap:13px}
    /* INSIGHTS */
    .ins-p{background:#0E1D2C;border:1px solid #182838;border-radius:9px;padding:15px}
    .ins-hdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}
    .ins-sub{font-family:'DM Mono',monospace;font-size:0.55rem;color:#2A4060;margin-top:2px}
    .ibtn{padding:6px 14px;background:#3DBA7C;border:none;border-radius:5px;color:#09141E;font-weight:600;font-size:0.65rem;cursor:pointer;transition:all 0.12s;font-family:'DM Mono',monospace;letter-spacing:0.03em}
    .ibtn:hover{background:#52D490;transform:translateY(-1px)}
    .ibtn:disabled{opacity:0.35;cursor:not-allowed;transform:none}
    .ins-item{padding:9px 13px;border-left:2px solid #3DBA7C;margin-bottom:7px;font-size:0.73rem;line-height:1.7;color:#4A7090;background:#091E2E;border-radius:0 5px 5px 0}
    .kw{font-weight:600;color:#3DBA7C;font-family:'DM Mono',monospace;font-size:0.62rem;margin-right:5px}
    .ph{color:#182838;font-family:'DM Mono',monospace;font-size:0.67rem;text-align:center;padding:16px 0;letter-spacing:0.03em}
    @keyframes blink{0%,100%{opacity:0.3}50%{opacity:1}}
    .blink{animation:blink 1.3s ease infinite}
    @media(max-width:950px){.body{grid-template-columns:1fr}.cards{grid-template-columns:repeat(3,1fr)}.rg{grid-template-columns:1fr}.rg2{grid-template-columns:1fr}}
    @media(max-width:580px){.cards{grid-template-columns:repeat(2,1fr)}.hd h1{font-size:1.7rem}}
  `;

  const pct = Math.round(confirmedCount / STATES.length * 100);

  return (
    <><style>{css}</style>
    <div className="app">

      {/* HEADER */}
      <div className="hd">
        <h1>Buyer <i>Propensity</i> Index</h1>
        <div className="hd-sub">Which states are primed for homebuying? · Redfin MLS Feb–Mar 2026 · ACS 2024 · FRED Apr 2026</div>
        <div className="chips">
          <span className="chip chip-g">● Redfin MLS · Feb–Mar 2026 (DOM, Price, Sale-to-List)</span>
          <span className="chip chip-g">● FRED · Mortgage Rates Apr 16, 2026</span>
          <span className="chip chip-g">● ACS 2024 · Income, Ownership, Rent</span>
          <span className="chip chip-y">◆ Census PEP 2024 · Population Growth</span>
          <span className="chip chip-y">◆ Redfin Migration Data · Dec '25–Feb '26</span>
        </div>
      </div>

      {/* DATA STATUS BAR */}
      <div className="dsbar">
        <div className="ds-lbl">Data confidence</div>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <div style={{width:7,height:7,borderRadius:"50%",background:"#3DBA7C"}}/>
          <span className="ds-ct" style={{color:"#3DBA7C"}}>{confirmedCount} states · full data</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <div style={{width:7,height:7,borderRadius:"50%",background:"#D4A84B"}}/>
          <span className="ds-ct" style={{color:"#D4A84B"}}>{thinCount} states · thin volume*</span>
        </div>
        <div className="ds-bar">
          <div className="ds-fill" style={{width:`${pct}%`,background:"linear-gradient(90deg,#3DBA7C,#52D490)"}}/>
        </div>
        <span style={{fontFamily:"'DM Mono',monospace",fontSize:"0.62rem",color:"#3DBA7C",fontWeight:500}}>{pct}%</span>
        <div className="ds-filt">
          {[["all","All 50"],["confirmed","● Full data"],["estimated","⚠ Thin volume"]].map(([id,lbl])=>(
            <button key={id} className={`ds-fbtn${filter===id?" on":""}`} onClick={()=>{setFilter(id);setAll(false)}}>{lbl}</button>
          ))}
        </div>
      </div>

      {/* MORTGAGE STRIP */}
      <div className="mort">
        <div>
          <div className="mort-lbl">30-Yr Fixed · Freddie Mac PMMS via FRED</div>
          <div className="mort-rate">{CURRENT_RATE}%</div>
          <div className="mort-date">Week of {RATE_DATE}</div>
        </div>
        <div className="mort-stats">
          {[["52-wk high",`${HI52}%`,"#E05252"],["52-wk low",`${LO52}%`,"#3DBA7C"],["YoY change",`${RATE_CHG}%`,"#3DBA7C"]].map(([l,v,c])=>(
            <div key={l} className="mort-stat" style={{color:c}}><span>{l}</span>{v}</div>
          ))}
        </div>
        <div className="mort-chart">
          <ResponsiveContainer width="100%" height={58}>
            <LineChart data={MORT} margin={{top:2,right:4,bottom:2,left:0}}>
              <XAxis dataKey="d" hide/><YAxis domain={[5.9,7.2]} hide/>
              <Tooltip contentStyle={{background:"#0E1D2C",border:"1px solid #182838",borderRadius:5,fontFamily:"DM Mono",fontSize:"0.61rem",color:"#C8D8E6"}} formatter={v=>[`${v}%`,"Rate"]} labelFormatter={l=>l}/>
              <Line type="monotone" dataKey="r" stroke="#3DBA7C" strokeWidth={1.5} dot={false}/>
            </LineChart>
          </ResponsiveContainer>
          <div style={{fontFamily:"'DM Mono',monospace",fontSize:"0.5rem",color:"#182838",textAlign:"center",marginTop:1}}>Oct 2024 – Apr 2026</div>
        </div>
        <div style={{marginLeft:"auto",flexShrink:0}}>
          <div style={{fontFamily:"'DM Mono',monospace",fontSize:"0.56rem",color:"#2A4060",marginBottom:3}}>$400K / 20% down · P&I</div>
          <div style={{fontFamily:"'DM Mono',monospace",fontSize:"1.05rem",fontWeight:500,color:"#8BB0CC"}}>
            ${Math.round(320000*(CURRENT_RATE/100/12)/(1-Math.pow(1+CURRENT_RATE/100/12,-360))).toLocaleString()}/mo
          </div>
          <div style={{fontFamily:"'DM Mono',monospace",fontSize:"0.52rem",color:"#2A4060",marginTop:2}}>
            vs ${Math.round(320000*(7.04/100/12)/(1-Math.pow(1+7.04/100/12,-360))).toLocaleString()}/mo at 7.04% peak
          </div>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="cards">
        {[
          {l:"Nat'l Avg BPI",    v:NAT.bps,      sub:"Out of 100",           c:sc(NAT.bps)},
          {l:"Top Market",       v:topBps.abbr,  sub:`BPI ${topBps.bps}/100`,c:"#3DBA7C"},
          {l:"Slowest Market",   v:botBps.abbr,  sub:`BPI ${botBps.bps}/100`,c:"#E05252"},
          {l:"Nat'l Med DOM",    v:"55d",        sub:"Redfin Mar 2026",      c:"#D4A84B"},
          {l:"Nat'l Sale Price", v:"$436K",      sub:"Redfin Mar 2026",      c:"#C96EB5"},
          {l:"Data Coverage",   v:`50/50`,sub:"All states sourced",c:"#3DBA7C"},
        ].map((c,i)=>(
          <div key={i} className="card">
            <div className="clbl">{c.l}</div>
            <div className="cval" style={{color:c.c}}>{c.v}</div>
            <div className="csub">{c.sub}</div>
          </div>
        ))}
      </div>

      {/* NAV */}
      <div className="tabs">
        {[["rankings","State Rankings"],["regions","Regional View"],["rates","Rate Context"]].map(([id,lbl])=>(
          <button key={id} className={`tab${view===id?" on":""}`} onClick={()=>setView(id)}>{lbl}</button>
        ))}
      </div>

      {/* ── RANKINGS ── */}
      {view==="rankings" && (
        <div className="body">
          <div className="panel">
            <div className="pttl">● = Redfin confirmed · ~ = regional estimate · Click row to drill down</div>
            <div className="tw">
              <table>
                <thead><tr>
                  {COLS.map(c=>(
                    <th key={c.k} className={sortK===c.k?"on":""} onClick={()=>hs(c.k)} style={{width:c.w}}>
                      {c.l}{sortK===c.k?(asc?" ↑":" ↓"):""}
                    </th>
                  ))}
                </tr></thead>
                <tbody>
                  {rows.map(s=>(
                    <tr key={s.abbr} className={[sel===s.abbr?"sel":"",!s.confirmed?"est":""].join(" ").trim()}
                      onClick={()=>{setSel(s.abbr);setIns("");}}>
                      {COLS.map((c,ci)=>{
                        const v=s[c.k];
                        if(c.k==="bps") return(
                          <td key="bps">
                            <div className="bw">
                              <span style={{color:s.confirmed?"#3DBA7C":"#D4A84B",fontSize:"0.6rem",marginRight:1}}>{s.confirmed?"●":"~"}</span>
                              <span style={{fontFamily:"'DM Mono',monospace",fontWeight:500,fontSize:"0.72rem",color:sc(v),minWidth:20}}>{v}</span>
                              <div className="bt"><div className="bf" style={{width:`${v}%`,background:sc(v)}}/></div>
                            </div>
                          </td>
                        );
                        const clr=c.k==="abbr"?"#C8D8E6":
                          c.k==="dom"?(v>70?"#E05252":v<38?"#3DBA7C":"#3A5870"):
                          c.k==="spChg"?(v>0?"#3DBA7C":v<0?"#E05252":"#3A5870"):
                          c.k==="pd"?(v>28?"#3DBA7C":v<15?"#E05252":"#3A5870"):
                          c.k==="s2l"?(v>100?"#E05252":v<98?"#3DBA7C":"#3A5870"):
                          c.k==="own"?(v>72?"#3DBA7C":v<60?"#E05252":"#3A5870"):"#3A5870";
                        const disp = c.k==="abbr" ? (
                          <span style={{display:"flex",alignItems:"center",gap:3}}>
                            <span style={{color:s.confirmed?"#3DBA7C":"#D4A84B",fontSize:"0.55rem"}}>{s.confirmed?"●":"~"}</span>
                            {v}
                          </span>
                        ) : c.f(v);
                        return <td key={c.k} className={c.k==="abbr"?"ta":""} style={{color:clr}}>{disp}</td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button className="mb" onClick={()=>setAll(!all)}>
              {all?`Show top 15 ↑`:`Show all ${filtered.length} states ↓ (${filtered.length-Math.min(15,filtered.length)} more)`}
            </button>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:"0.48rem",color:"#182838",marginTop:5}}>
              All 50 states sourced from Redfin MLS data · ⚠ AK, DE, HI, NM, WV = thin transaction volume, interpret with caution · ACS 2024 = Census Bureau
            </div>
          </div>

          {/* DETAIL */}
          <div className="panel">
            {selS ? (<>
              <div className="pttl">State Detail — {selS.name}</div>
              <div className="dh">
                <div>
                  <div className="dn">{selS.name} ({selS.abbr})</div>
                  <div className="dr">{selS.r} Region</div>
                  <div className={`ds-badge`} style={{background:selS.confirmed?"#0D2818":"#1A1800",border:`1px solid ${selS.confirmed?"#1A3A28":"#3A2E10"}`}}>
                    <span style={{color:selS.confirmed?"#3DBA7C":"#D4A84B",fontSize:"0.65rem"}}>{selS.confirmed?"●":"~"}</span>
                    <span style={{fontFamily:"'DM Mono',monospace",fontSize:"0.5rem",color:selS.confirmed?"#3DBA7C":"#C8940A"}}>{selS.src}</span>
                  </div>
                  {INBOUND.has(selS.abbr) && <div style={{fontFamily:"'DM Mono',monospace",fontSize:"0.52rem",color:"#3DBA7C",marginTop:3}}>↑ Top 5 inbound migration state</div>}
                  {OUTBOUND.has(selS.abbr) && <div style={{fontFamily:"'DM Mono',monospace",fontSize:"0.52rem",color:"#E05252",marginTop:3}}>↓ Top 5 outbound migration state</div>}
                </div>
                <div style={{textAlign:"right"}}>
                  <div className="ds" style={{color:sc(selS.bps)}}>{selS.bps}</div>
                  <div className="dsl" style={{color:sc(selS.bps)}}>{sl(selS.bps)}</div>
                </div>
              </div>

              {/* Redfin block */}
              <div className="rdf-block">
                <div className="rdf-lbl" style={{color:selS.confirmed?"#3DBA7C":"#C8940A"}}>
                  {selS.confirmed?"● Redfin MLS — Confirmed":"~ Estimated from Regional Pattern"} · {selS.src}
                </div>
                <div className="rdf-grid">
                  {[
                    {l:"Sale Price", v:fu(selS.sp),   c:"#C8D8E6"},
                    {l:"YoY Chg",   v:fsp(selS.spChg),c:selS.spChg>0?"#3DBA7C":"#E05252"},
                    {l:"Med DOM",   v:`${selS.dom}d`, c:selS.dom>70?"#E05252":selS.dom<38?"#3DBA7C":"#C8D8E6"},
                    {l:"Price Drops",v:`${selS.pd}%`, c:selS.pd>25?"#3DBA7C":"#8BB0CC"},
                    {l:"Above List", v:`${selS.al}%`, c:selS.al>30?"#E05252":"#8BB0CC"},
                    {l:"Sale/List",  v:`${selS.s2l}%`,c:selS.s2l>100?"#E05252":selS.s2l<98.5?"#3DBA7C":"#8BB0CC"},
                  ].map(x=>(
                    <div key={x.l} className="rdf-stat">
                      <div className="rdf-sl">{x.l}</div>
                      <div className="rdf-sv" style={{color:x.c}}>{x.v}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Score bars */}
              <div style={{marginBottom:6}}>
                {COMP.map(m=>(
                  <div key={m.k}>
                    <div className="cr">
                      <div style={{width:5,height:5,borderRadius:"50%",background:m.c,flexShrink:0}}/>
                      <div className="cl">{m.l.split(" ")[0]}</div>
                      <div className="bt"><div className="bf" style={{width:`${selS[m.k]}%`,background:m.c,opacity:0.8}}/></div>
                      <div className="cv" style={{color:m.c}}>{selS[m.k]}</div>
                      <div className="cw">{m.w}</div>
                    </div>
                    <div style={{fontFamily:"'DM Mono',monospace",fontSize:"0.48rem",color:"#1E3A50",marginBottom:2,marginLeft:11}}>{m.desc}</div>
                  </div>
                ))}
              </div>

              {/* Radar */}
              <ResponsiveContainer width="100%" height={140}>
                <RadarChart data={radarData} margin={{top:4,right:18,bottom:4,left:18}}>
                  <PolarGrid stroke="#182838" strokeDasharray="3 3"/>
                  <PolarAngleAxis dataKey="metric" tick={{fill:"#2A4060",fontSize:8,fontFamily:"DM Mono"}}/>
                  <Radar name={selS.name} dataKey="state" stroke="#3DBA7C" fill="#3DBA7C" fillOpacity={0.14} strokeWidth={1.5}/>
                  <Radar name="National" dataKey="nat" stroke="#D4A84B" fill="transparent" strokeWidth={1} strokeDasharray="4 2"/>
                  <Tooltip contentStyle={{background:"#0E1D2C",border:"1px solid #182838",borderRadius:5,fontFamily:"DM Mono",fontSize:"0.6rem",color:"#C8D8E6"}}/>
                </RadarChart>
              </ResponsiveContainer>
              <div style={{display:"flex",gap:10,justifyContent:"center",marginBottom:7}}>
                {[{c:"#3DBA7C",l:selS.abbr},{c:"#D4A84B",l:"Nat'l"}].map(x=>(
                  <div key={x.l} style={{display:"flex",alignItems:"center",gap:3,fontFamily:"'DM Mono',monospace",fontSize:"0.53rem",color:"#2A4060"}}>
                    <div style={{width:5,height:5,borderRadius:"50%",background:x.c}}/>{x.l}
                  </div>
                ))}
              </div>

              {/* ACS stats */}
              <div className="sg">
                {[
                  {l:"Homeownership",  v:fp(selS.own),  c:selS.own>72?"#3DBA7C":selS.own<60?"#E05252":"#7A9EBB",src:"ACS 2024"},
                  {l:"HH Income",     v:fu(selS.inc),   c:"#7A9EBB",src:"ACS 2024"},
                  {l:"Price/Income",  v:fx(selS.pti),   c:selS.pti>7?"#E05252":selS.pti<3.5?"#3DBA7C":"#7A9EBB",src:"ACS 2024"},
                  {l:"Rent Burden",   v:fp(selS.rb),    c:selS.rb>28?"#E05252":"#7A9EBB",src:"ACS 2024"},
                  {l:"Pop. Growth",   v:fsp(selS.popChg),c:selS.popChg>0?"#3DBA7C":"#E05252",src:"Census PEP 2024"},
                  {l:"Vacancy Rate",  v:fp(selS.vac),   c:selS.vac>1.8?"#D4A84B":"#7A9EBB",src:"ACS 2024"},
                ].map(x=>(
                  <div key={x.l} className="st">
                    <div className="stl">{x.l}</div>
                    <div className="stv" style={{color:x.c}}>{x.v}</div>
                    <div className="stsrc">{x.src}</div>
                  </div>
                ))}
              </div>
            </>) : <div className="ph">← Select a state from the table</div>}
          </div>
        </div>
      )}

      {/* ── REGIONAL VIEW ── */}
      {view==="regions" && (
        <div className="rg" style={{marginBottom:13}}>
          {regionData.map(r=>{
            const topSt = [...STATES].filter(s=>s.r===r.region).sort((a,b)=>b.bps-a.bps).slice(0,4);
            return(
              <div key={r.region} className="rc">
                <div className="rn" style={{color:RC[r.region]}}>
                  {r.region}<span className="rsub">Avg BPI {r.bps}/100 · {sl(r.bps)}</span>
                </div>
                <div style={{height:5,borderRadius:3,background:`linear-gradient(90deg,${RC[r.region]}80 ${r.bps}%,#182838 ${r.bps}%)`,marginBottom:9}}/>
                <div className="rgrid">
                  {[{l:"Avg DOM",v:`${r.dom}d`},{l:"Price Drops",v:`${r.pd}%`},{l:"Sale/List",v:`${r.s2l}%`},{l:"Own Rate",v:fp(r.own)},{l:"Avg PTI",v:fx(r.pti)},{l:"BPI Score",v:`${r.bps}/100`}].map(x=>(
                    <div key={x.l} className="rstat"><div className="rsl">{x.l}</div><div className="rsv">{x.v}</div></div>
                  ))}
                </div>
                <div className="rtop">
                  <div className="rtl">Top states by BPI</div>
                  <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                    {topSt.map(s=>(
                      <button key={s.abbr} className="rtbtn"
                        style={{borderColor:`${RC[r.region]}44`,color:RC[r.region]}}
                        onClick={()=>{setSel(s.abbr);setView("rankings");setIns("");}}>
                        {s.abbr} <span style={{color:"#2A4060"}}>{s.bps}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── RATE CONTEXT ── */}
      {view==="rates" && (
        <div className="rg2" style={{marginBottom:13}}>
          <div className="panel">
            <div className="pttl">30-Year Fixed Mortgage Rate — Freddie Mac PMMS via FRED · Oct 2024–Apr 2026</div>
            <ResponsiveContainer width="100%" height={210}>
              <LineChart data={MORT} margin={{top:8,right:12,bottom:8,left:0}}>
                <CartesianGrid stroke="#182838" strokeDasharray="3 3"/>
                <XAxis dataKey="d" tick={{fill:"#2A4060",fontSize:8,fontFamily:"DM Mono"}} interval={7}/>
                <YAxis domain={[5.9,7.2]} tick={{fill:"#2A4060",fontSize:8,fontFamily:"DM Mono"}} tickFormatter={v=>`${v}%`} width={35}/>
                <Tooltip contentStyle={{background:"#0E1D2C",border:"1px solid #182838",borderRadius:5,fontFamily:"DM Mono",fontSize:"0.61rem",color:"#C8D8E6"}} formatter={v=>[`${v}%`,"30-yr Fixed"]}/>
                <Line type="monotone" dataKey="r" stroke="#3DBA7C" strokeWidth={2} dot={false} activeDot={{r:3,fill:"#3DBA7C"}}/>
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="panel">
            <div className="pttl">Rate Context for Professionals</div>
            <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:10}}>
              {[{l:"Current Rate",v:`${CURRENT_RATE}%`,sub:"Week of "+RATE_DATE,c:"#3DBA7C"},{l:"52-Wk High",v:`${HI52}%`,sub:"Jan 2025",c:"#E05252"},{l:"52-Wk Low",v:`${LO52}%`,sub:"Dec 2025",c:"#3DBA7C"},{l:"YoY Change",v:`${RATE_CHG}%`,sub:"vs. Apr 2025",c:"#3DBA7C"}].map(x=>(
                <div key={x.l} style={{background:"#091625",borderRadius:4,padding:"8px 11px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div>
                    <div style={{fontFamily:"'DM Mono',monospace",fontSize:"0.52rem",textTransform:"uppercase",letterSpacing:"0.07em",color:"#2A4060",marginBottom:1}}>{x.l}</div>
                    <div style={{fontFamily:"'DM Mono',monospace",fontSize:"0.55rem",color:"#2A4060"}}>{x.sub}</div>
                  </div>
                  <div style={{fontFamily:"'DM Mono',monospace",fontSize:"0.95rem",fontWeight:500,color:x.c}}>{x.v}</div>
                </div>
              ))}
            </div>
            <div style={{padding:"10px 12px",background:"#091625",borderRadius:4,borderLeft:"2px solid #D4A84B",marginBottom:9}}>
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:"0.52rem",textTransform:"uppercase",letterSpacing:"0.07em",color:"#D4A84B",marginBottom:4}}>Redfin Context · Mar 2026</div>
              <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:"0.7rem",lineHeight:1.65,color:"#4A7090"}}>National median sale price hit <strong style={{color:"#C8D8E6"}}>$436,705</strong>, up 1.2% YoY. Median DOM is <strong style={{color:"#C8D8E6"}}>55 days</strong> — up 6 days YoY — signaling buyers are gaining leverage in many markets. <strong style={{color:"#C8D8E6"}}>18% of homes</strong> took price drops.</div>
            </div>
            <div style={{padding:"10px 12px",background:"#091625",borderRadius:4,borderLeft:"2px solid #C96EB5"}}>
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:"0.52rem",textTransform:"uppercase",letterSpacing:"0.07em",color:"#C96EB5",marginBottom:4}}>Migration Signals · Dec '25–Feb '26</div>
              {[{lbl:"Top Inbound ↑",states:[...INBOUND],c:"#3DBA7C"},{lbl:"Top Outbound ↓",states:[...OUTBOUND],c:"#E05252"}].map(x=>(
                <div key={x.lbl} style={{marginBottom:5}}>
                  <div style={{fontFamily:"'DM Mono',monospace",fontSize:"0.49rem",color:"#2A4060",marginBottom:2}}>{x.lbl}</div>
                  <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                    {x.states.map(s=><span key={s} style={{fontFamily:"'DM Mono',monospace",fontSize:"0.64rem",color:x.c}}>{s}</span>)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* AI INSIGHTS */}
      <div className="ins-p">
        <div className="ins-hdr">
          <div>
            <div className="pttl" style={{margin:0}}>AI Market Intelligence · Powered by Claude for Inman</div>
            <div className="ins-sub">
              {selS ? `${selS.name} · BPI ${selS.bps}/100 · ${selS.confirmed?"Confirmed Redfin data":"Estimated — insights will note uncertainty"}` : "Select a state in Rankings view"}
            </div>
          </div>
          <button className="ibtn" onClick={genInsight} disabled={aiLoad||!selS||view!=="rankings"}>
            {aiLoad?"Analyzing…":view!=="rankings"?"Switch to Rankings →":"Generate Insights →"}
          </button>
        </div>
        {aiLoad&&<div className="ph blink">Analyzing {selS?.name}…</div>}
        {!aiLoad&&!ins&&<div className="ph">Select a state in Rankings · click a row · Generate Insights.</div>}
        {!aiLoad&&ins&&<div dangerouslySetInnerHTML={{__html:ins}}/>}
      </div>

    </div></>
  );
}
