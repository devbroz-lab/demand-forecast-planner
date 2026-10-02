'use client';
import { useEffect, useMemo, useReducer, useState } from 'react';
import { ArrowRight, ArrowUpRight, BarChart3, CalendarDays, ChevronDown, CircleHelp, Clock3, Download, Info, Menu, RotateCcw, SlidersHorizontal, Sparkles, TrendingUp, TriangleAlert, X } from 'lucide-react';
import { ResponsiveContainer, ComposedChart, Area, Line, CartesianGrid, XAxis, YAxis, Tooltip, ReferenceLine, ReferenceArea } from 'recharts';
import { Button } from '@/components/ui/button';
import { loadProduct, loadShell } from './data/load';
import type { BacktestSummary, CalendarFile, Manifest, Origin, Product, ProductsFile, SkuFile } from './data/types';
import { recommendOrder, quantile } from './core/reorder';
import { addWeeks, date, money, riskLabel, shortMoney, units } from './core/format';
import { en, type DfpStrings } from './strings/en';
import s from './DemandForecastPlanner.module.css';

type Tab = 'planner' | 'how-it-works' | 'assumptions';
type Event = {name: 'demo_opened' | 'sku_selected' | 'service_level_changed' | 'time_machine_used' | 'scenario_toggled' | 'tab_opened' | 'cta_clicked' | 'dataset_downloaded'; [key: string]: string | number};
export interface DemandForecastPlannerProps { dataBaseUrl: string; ctaHref: string; theme?: Record<string,string>; onEvent?: (event: Event) => void; analyticsEnabled?: boolean; strings?: Partial<DfpStrings>; initialTab?: Tab; className?: string }
type State = {category: string; sku: string; horizon: 4|8|13|26; service: .9|.95|.99; origin: number; delay: 0|1|2|4; promo: 0|10|20|30; baseline: boolean; stock: number|null; tab: Tab; view: 'chart'|'table'};
type Action = {type: keyof State; value: State[keyof State]} | {type:'originReset'; value:number};
const initial: State = {category:'all',sku:'',horizon:13,service:.95,origin:10,delay:0,promo:0,baseline:true,stock:null,tab:'planner',view:'chart'};
function reducer(state: State, action: Action): State {
 if(action.type==='originReset') return {...state,origin:action.value,delay:0,promo:0,stock:null};
 return {...state,[action.type]:action.value};
}
const basePath = (url: string) => url.endsWith('/') ? url : `${url}/`;
const driverNames = ['Trend','Seasonality','Festival','Promotion / price','Momentum'];

export function DemandForecastPlanner({dataBaseUrl,ctaHref,theme,onEvent,analyticsEnabled=false,strings,initialTab='planner',className}:DemandForecastPlannerProps){
 const t = {...en,...strings};
 const base = basePath(dataBaseUrl);
 const [state,dispatch] = useReducer(reducer,{...initial,tab:initialTab});
 const [shell,setShell] = useState<{manifest:Manifest;products:ProductsFile;calendar:CalendarFile;backtest:BacktestSummary}|null>(null);
 const [skuData,setSkuData] = useState<SkuFile|null>(null);
 const [explanations,setExplanations] = useState<Record<string,string>|null>(null);
 const [error,setError] = useState(''); const [productError,setProductError] = useState('');
 const [loading,setLoading] = useState(true); const [productLoading,setProductLoading] = useState(false);
 const [drawer,setDrawer] = useState(false);
 const [retryKey,setRetryKey] = useState(0); const [skuRetry,setSkuRetry] = useState(0);
 const emit = (event:Event) => onEvent?.(event);
 useEffect(()=>{emit({name:'demo_opened'});},[]);
 useEffect(()=>{let active=true; setLoading(true); loadShell(base).then(data=>{if(!active)return;setShell(data);dispatch({type:'sku',value:data.manifest.default_view.sku_id});dispatch({type:'horizon',value:data.manifest.default_view.horizon_weeks});dispatch({type:'service',value:data.manifest.default_view.service_level});dispatch({type:'originReset',value:data.manifest.origins.length-1});setLoading(false);setError('');}).catch(e=>{if(active){setError(e.message);setLoading(false);}});return()=>{active=false};},[base,retryKey]);
 useEffect(()=>{if(!state.sku)return;let active=true;setProductLoading(true);setProductError('');loadProduct(base,state.sku,skuRetry>0).then(([data,why])=>{if(active){setSkuData(data);setExplanations(why.by_origin);setProductLoading(false);}}).catch(()=>{if(active){setProductError('This product could not be loaded. Please try again.');setProductLoading(false);}});return()=>{active=false};},[base,state.sku,skuRetry]);
 const product = shell?.products.products.find(p=>p.sku_id===skuData?.sku_id);
 const origin = skuData?.origins[state.origin];
 const past = !!shell && state.origin<shell.manifest.origins.length-1;
 const forecast=origin?.scenarios[`promo_${past?0:state.promo}`] ?? origin?.scenarios['promo_0'];
 const onHand=state.stock??origin?.state.on_hand??0;
 const result=useMemo(()=>product&&origin&&forecast?recommendOrder({cumQ:forecast.cum_q,leadTimeWeeks:product.lead_time_weeks+state.delay,reviewWeeks:1,serviceLevel:state.service,onHand,onOrder:origin.state.on_order,casePack:product.case_pack_units,moq:product.moq_units,unitCostInr:product.unit_cost_inr}):null,[product,origin,forecast,state.service,state.delay,onHand]);
 const change=(type:keyof State,value:State[keyof State])=>dispatch({type,value});
 const chooseCategory=(category:string)=>{change('category',category);const next=shell?.products.products.find(p=>category==='all'||p.category===category);if(next){change('sku',next.sku_id);emit({name:'sku_selected',skuId:next.sku_id});}};
 const chooseSku=(sku:string)=>{change('sku',sku);emit({name:'sku_selected',skuId:sku});};
 const chooseTab=(tab:Tab)=>{change('tab',tab);emit({name:'tab_opened',tab});};
 const cta=<Button asChild className={s['cta']}><a href={ctaHref} onClick={()=>emit({name:'cta_clicked'})}>{t.cta}<ArrowUpRight size={16}/></a></Button>;
 const chartData=useMemo(()=>{
  if(!skuData||!origin||!forecast)return [];
  const historyIndex=skuData.history.week_start.findIndex(d=>d>=origin.origin);
  const end=historyIndex<0?skuData.history.week_start.length:historyIndex;
  const history=skuData.history.week_start.slice(Math.max(0,end-52),end).map((week,j,arr)=>({week,observed:skuData.history.units_sold[end-arr.length+j],stockout:skuData.history.stockout_flag[end-arr.length+j]===1,kind:'history'}));
  const future=Array.from({length:state.horizon},(_,i)=>{const week=addWeeks(origin.origin,i);const actualIdx=skuData.backtest_actuals.week_start.indexOf(week);return {week,forecast:forecast.weekly.p50[i],low:forecast.weekly.p10[i],high:forecast.weekly.p90[i],baseline:origin.baseline_p50[i],actual:past&&actualIdx>=0?skuData.backtest_actuals.true_demand[actualIdx]:undefined,kind:'future'};});
  return [...history,...future];
 },[skuData,origin,forecast,state.horizon,past]);
 const peak=chartData.filter(d=>d.kind==='future').reduce<{week:string;forecast:number}|null>((acc,d)=>('forecast'in d && typeof d.forecast==='number'&&(!acc||d.forecast>acc.forecast)?{week:d.week,forecast:d.forecast}:acc),null);
 const event=peak? shell?.calendar.events.find(e=>e.week_start===peak.week):undefined;
 const orderDate=result?.orderBy.kind==='week'&&origin?date(addWeeks(origin.origin,result.orderBy.weeksFromOrigin)):null;
 const orderTiming=result?.orderBy.kind==='not-needed'?`No order needed in the next ${result.orderBy.withinWeeks} weeks`:result?.orderBy.kind==='week'?`Latest safe order date · ${orderDate}`:'Order now';
 const controls=<div className={s['controls']}>
  <div className={s['controlGroup']}><label htmlFor="dfp-category">Category</label><div className={s['selectWrap']}><select id="dfp-category" value={state.category} onChange={e=>chooseCategory(e.target.value)}>{shell?.products.categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select><ChevronDown size={16}/></div></div>
  <div className={s['controlGroup']}><label htmlFor="dfp-product">Product</label><div className={s['selectWrap']}><select id="dfp-product" value={state.sku} onChange={e=>chooseSku(e.target.value)}>{shell?.products.products.filter(p=>state.category==='all'||p.category===state.category).map(p=><option key={p.sku_id} value={p.sku_id}>{p.name} · {p.pack_label}</option>)}</select><ChevronDown size={16}/></div></div>
 </div>;
 const scenarios=<div className={s['scenarios']}>
  <div className={s['field']}><div className={s['fieldLabel']}>Service level <span title="Target chance of having enough stock">ⓘ</span></div><div className={s['segment']} role="radiogroup" aria-label="Service level">{([.9,.95,.99] as const).map(v=><Button key={v} variant="ghost" role="radio" aria-checked={state.service===v} className={state.service===v?s['selected']:''} onClick={()=>{change('service',v);emit({name:'service_level_changed',level:v})}}>{Math.round(v*100)}%</Button>)}</div></div>
  <div className={s['field']}><div className={s['fieldLabel']}>Supplier delay <span>weeks</span></div><div className={s['segment']} role="radiogroup" aria-label="Supplier delay" title={past?'What-if controls are unavailable in replay':undefined}>{([0,1,2,4] as const).map(v=><Button key={v} variant="ghost" role="radio" disabled={past} aria-checked={state.delay===v} className={state.delay===v?s['selected']:''} onClick={()=>{change('delay',v);emit({name:'scenario_toggled',scenario:'delay',value:v})}}>{v===0?'None':`+${v}`}</Button>)}</div></div>
  <div className={s['field']}><div className={s['fieldLabel']}>Promotion <span>depth</span></div><div className={s['segment']} role="radiogroup" aria-label="Promotion depth" title={past?'What-if controls are unavailable in replay':undefined}>{([0,10,20,30] as const).map(v=><Button key={v} variant="ghost" role="radio" disabled={past} aria-checked={state.promo===v} className={state.promo===v?s['selected']:''} onClick={()=>{change('promo',v);emit({name:'scenario_toggled',scenario:'promo',value:v})}}>{v===0?'Off':`${v}%`}</Button>)}</div></div>
  <div className={s['field']}><label className={s['fieldLabel']} htmlFor="dfp-stock">Stock on hand <span>units</span></label><input id="dfp-stock" type="number" min="0" step="1" disabled={past} title={past?'Stock override is unavailable in replay':undefined} value={state.stock??origin?.state.on_hand??0} onChange={e=>change('stock',e.target.value===''?null:Math.max(0,Number(e.target.value)))} /></div>
  {past&&<p className={s['disabledNote']}><Info size={14}/> What-if controls are unavailable in replay.</p>}
 </div>;
 const renderChart=()=> <div className={s['chartShell']}>
  <div className={s['chartArea']} role="img" aria-label="Observed weekly sales, forecast, likely range and optional baseline"><ResponsiveContainer width="100%" height="100%"><ComposedChart data={chartData} margin={{top:20,right:12,bottom:4,left:-20}}>
   <CartesianGrid vertical={false} stroke="var(--_border)" strokeDasharray="3 5"/><XAxis dataKey="week" tickFormatter={v=>new Date(`${v}T00:00:00Z`).toLocaleDateString('en-GB',{month:'short',timeZone:'UTC'})} minTickGap={38} tickLine={false} axisLine={false} tick={{fill:'var(--_muted)',fontSize:11}} dy={10}/><YAxis tickFormatter={v=>units(v)} tickLine={false} axisLine={false} tick={{fill:'var(--_muted)',fontSize:11}} width={57}/>
   <Tooltip content={({active,payload,label})=>active&&payload?.length?<div className={s['tooltip']}><strong>Week of {date(label as string)}</strong>{payload.filter(item=>item.value!=null).map(item=><div key={item.dataKey}>{item.name}: {units(Number(item.value))} units</div>)}{shell?.calendar.events.find(e=>e.week_start===label)&&<em>{shell.calendar.events.find(e=>e.week_start===label)?.name}</em>}</div>:null}/>
   {origin&&<ReferenceArea x1={origin.origin} x2={chartData.at(-1)?.week ?? origin.origin} fill="var(--_accent-soft)" fillOpacity={.2} strokeOpacity={0}/>} {origin&&<ReferenceLine x={origin.origin} stroke="var(--_border-strong)" strokeDasharray="3 3"/>}
   {shell?.calendar.events.filter(e=>chartData.some(d=>d.week===e.week_start)).map(e=><ReferenceLine key={e.week_start} x={e.week_start} stroke="var(--_event)" strokeDasharray="2 4" label={{value:e.name,position:'insideTopLeft',fill:'var(--_event)',fontSize:10}}/>)}
   <Area type="monotone" dataKey="high" name="Likely high" stroke="none" fill="var(--_accent-soft)" fillOpacity={1} isAnimationActive={false}/><Area type="monotone" dataKey="low" name="Likely low" stroke="none" fill="var(--_surface)" fillOpacity={1} isAnimationActive={false}/>
   <Line type="monotone" dataKey="observed" name="Observed sales" stroke="var(--_muted)" strokeWidth={1.5} dot={false} connectNulls={false} isAnimationActive={false}/>
   {state.baseline&&<Line type="monotone" dataKey="baseline" name="Simple baseline" stroke="var(--_compare)" strokeWidth={1.5} strokeDasharray="5 5" dot={false} isAnimationActive={false}/>}
   <Line type="monotone" dataKey="forecast" name="Forecast" stroke="var(--_accent)" strokeWidth={3} dot={false} isAnimationActive={false}/>
   {past&&<Line type="monotone" dataKey="actual" name="Actual demand" stroke="var(--_text)" strokeWidth={2} dot={{r:2,fill:'var(--_text)'}} isAnimationActive={false}/>}
  </ComposedChart></ResponsiveContainer></div>
  <div className={s['legend']}><span><i className={s['legendForecast']}/> Forecast (most likely)</span><span><i className={s['legendRange']}/> Likely range (80%)</span><span><i className={s['legendObserved']}/> Observed sales</span>{state.baseline&&<span><i className={s['legendBaseline']}/> Simple baseline</span>}{past&&<span><i className={s['legendActual']}/> Actual (synthetic)</span>}</div>
 </div>;
 const table=<div className={s['tableScroll']}><table><thead><tr>{['Week of','Observed','Forecast','Likely low','Likely high','Baseline','Actual','Event'].map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{chartData.map(d=><tr key={d.week}><td>{date(d.week)}</td>{(['observed','forecast','low','high','baseline','actual'] as const).map(k=><td key={k}>{k==='baseline'&&!state.baseline?'—':k==='actual'&&!past?'—':typeof d[k as keyof typeof d]==='number'?units(Number(d[k as keyof typeof d])):'—'}</td>)}<td>{shell?.calendar.events.find(e=>e.week_start===d.week)?.name??'—'}</td></tr>)}</tbody></table></div>;
 const style=theme?Object.fromEntries(Object.entries(theme).map(([key,value])=>[key.startsWith('--dfp-')?key:`--dfp-${key}`,value])) as React.CSSProperties:undefined;
 return <div className={`${s['root']} ${className??''}`} style={style}>
  <div className={s['topline']}><div className={s['brand']}><span className={s['brandMark']}><BarChart3 size={17}/></span><span>FORECAST<span className={s['brandDot']}>.</span> LAB</span><span className={s['edition']}>INTERACTIVE DEMO</span></div><div className={s['topRight']}><span className={s['liveDot']}/> PLANNER / 01</div></div>
  <header className={s['header']}><div><div className={s['eyebrow']}><span className={s['eyebrowLine']}/>{t.eyebrow}</div><h1>{t.title}</h1><p>{t.subtitle}</p></div><div className={s['headerCta']}>{cta}</div></header>
  <div className={s['disclosure']}><div className={s['disclosureIcon']}><Info size={18}/></div><div><strong>Synthetic-data demo</strong><p>{t.disclosure} {analyticsEnabled&&t.analytics}</p></div><span className={s['mockTag']}>MOCK DATA</span></div>
  <nav className={s['tabs']} role="tablist" aria-label="Demo sections">{([['planner',t.planner],['how-it-works',t.how],['assumptions',t.assumptions]] as [Tab,string][]).map(([key,label])=><Button variant="ghost" role="tab" aria-selected={state.tab===key} key={key} className={`${s['tab']} ${state.tab===key?s['activeTab']:''}`} onClick={()=>chooseTab(key)}>{label}</Button>)}<span className={s['tabVersion']}>{shell?.manifest.data_version??'DEMO V1.0'}</span></nav>
  {state.tab==='planner'?<main className={s['main']}>
   {loading?<div className={s['skeletonGrid']}><div className={s['skeleton']}/><div className={s['skeleton']}/></div>:error?<div className={s['error']}><TriangleAlert size={20}/>{error}<Button variant="outline" onClick={()=>setRetryKey(v=>v+1)}>Retry</Button></div>:shell&&<>
    <div className={s['selectionRow']}><div className={s['sectionHeading']}><span className={s['sectionIndex']}>01 / SELECT</span><h2>Your planning view</h2></div>{controls}<div className={s['dataStamp']}><span className={s['liveDot']}/> LATEST DATA<br/><strong>{date(shell.manifest.origins.at(-1)??'2026-09-28')}</strong></div></div>
    {productError&&<div className={s['error']}><TriangleAlert size={18}/>{productError}<Button variant="outline" onClick={()=>setSkuRetry(v=>v+1)}>Retry</Button></div>}
    <div className={`${s['content']} ${productLoading?s['loadingContent']:''}`}>
     <div className={s['leftColumn']}>
      <section className={s['forecastSection']}><div className={s['panelTop']}><div><span className={s['sectionIndex']}>02 / ANTICIPATE</span><h2>{t.forecast}</h2><p>What demand could look like, week by week.</p></div><div className={s['viewSwitch']}><Button variant="ghost" className={state.view==='chart'?s['selected']:''} onClick={()=>change('view','chart')}>Chart</Button><Button variant="ghost" className={state.view==='table'?s['selected']:''} onClick={()=>change('view','table')}>Table</Button></div></div>
       <div className={s['chartToolbar']}><div className={s['horizon']}><span>PLANNING HORIZON</span><div className={s['segment']}>{([4,8,13,26] as const).map(v=><Button variant="ghost" key={v} className={state.horizon===v?s['selected']:''} onClick={()=>change('horizon',v)}>{v}w</Button>)}</div></div><label className={s['check']}><input type="checkbox" checked={state.baseline} onChange={e=>change('baseline',e.target.checked)}/> Compare simple baseline</label></div>
       {state.view==='chart'?renderChart():table}
       <p className={s['chartSummary']}>{peak?`Demand is expected to peak at ${units(peak.forecast)} units in the week of ${date(peak.week)}${event?` (${event.name})`:''}.`:''}</p>
       <div className={s['replay']}><div className={s['replayHeader']}><div><Clock3 size={16}/><strong>Time machine</strong>{past&&<span className={s['replayBadge']}>REPLAY</span>}</div><span>{origin?date(origin.origin):'—'}</span></div><input type="range" aria-label={`Forecast origin ${state.origin+1} of ${shell.manifest.origins.length}, ${date(shell.manifest.origins[state.origin] ?? '2026-09-28')}`} min="0" max={shell.manifest.origins.length-1} value={state.origin} onChange={e=>{const value=Number(e.target.value);dispatch({type:'originReset',value});emit({name:'time_machine_used',origin:shell.manifest.origins[value] ?? '2026-09-28'})}}/><div className={s['replayEnds']}><span>29 Sep 2025</span><span>Latest · 28 Sep 2026</span></div>{past&&<p className={s['groundTruth']}><Info size={14}/>{t.groundTruth}</p>}</div>
      </section>
      <section className={s['whySection']}><div className={s['panelTop']}><div><span className={s['sectionIndex']}>03 / UNDERSTAND</span><h2>{t.why}</h2></div><Sparkles className={s['sparkle']} size={18}/></div><p className={s['whyText']}>{explanations?.[origin?.origin??'']??'The explanation for this forecast is temporarily unavailable.'}</p><div className={s['drivers']}>{driverNames.map(name=>{const v=origin?.drivers[name]??0;return <div className={s['driver']} key={name}><span>{name}</span><div className={s['driverTrack']}><i className={v>=0?s['positive']:s['negative']} style={{width:`${Math.min(Math.abs(v)/700*100,100)}%`}}/></div><strong>{v>=0?'+':'−'}{units(Math.abs(v))} <small>units/wk</small></strong></div>})}</div><p className={s['provenance']}>{t.provenance}</p></section>
     </div>
     <div className={s['rightColumn']}>
      <section className={s['orderPanel']}><div className={s['orderHead']}><span className={s['sectionIndex']}>THE DECISION / 01</span><div className={s['orderSymbol']}><TrendingUp size={20}/></div></div><h2>{t.recommendation}</h2><p className={s['orderIntro']}>For {product?.name??'this product'} <span>·</span> {product?.pack_label}</p>{product?.limited_history&&<span className={s['badge']}>Limited history</span>}
       <div className={s['orderHero']}><span>RECOMMENDED QUANTITY</span><div><strong>{units(result?.orderQty??0)}</strong><span>units</span></div><p className={s['orderTiming']}><CalendarDays size={16}/>{orderTiming}</p></div>
       <div className={s['orderStats']}><div><span>Cash commitment</span><strong>{shortMoney(result?.cashInr??0)}</strong><small>at {money(product?.unit_cost_inr??0)} / unit</small></div><div><span>Risk before arrival</span><strong>{result?riskLabel(result.leadTimeRisk):'—'}</strong><small>at current stock</small></div></div>
       <div className={s['orderSub']}><div><span>Risk after order</span><strong>{result?riskLabel(result.coverRisk):'—'}</strong></div><div><span>Safety stock</span><strong>{units(result?.safetyStock??0)} units</strong></div><div><span>Expected stock left</span><strong>{units(result?.expectedLeft??0)} units</strong></div><div><span>Stock on hand + on order</span><strong>{units(onHand+(origin?.state.on_order??0))} units</strong></div></div>
       <p className={s['orderFoot']}><Info size={14}/>{t.horizonNote}</p>
      </section>
      <section className={s['scenarioPanel']}><div className={s['panelTop']}><div><span className={s['sectionIndex']}>ADJUST THE PLAN</span><h2>What if things change?</h2></div><SlidersHorizontal size={18}/></div>{scenarios}</section>
     </div>
    </div>
    <section className={s['impactSection']}><div className={s['impactHeading']}><div><span className={s['sectionIndex']}>04 / THE OUTCOME</span><h2>{t.impact}</h2></div><span>MODEL VS RULE OF THUMB <ArrowRight size={15}/></span></div><div className={s['impactGrid']}><div><span>Fill rate</span><strong>{Math.round((skuData?.impact[`model_${Math.round(state.service*100)}`]?.fill_rate??.97)*100)}%</strong><small>vs {Math.round((skuData?.impact['naive']?.fill_rate??.88)*100)}% baseline <b>↑ improved</b></small></div><div><span>Average inventory value</span><strong>{shortMoney(skuData?.impact[`model_${Math.round(state.service*100)}`]?.avg_on_hand_value_inr??325000)}</strong><small>vs {shortMoney(skuData?.impact['naive']?.avg_on_hand_value_inr??350000)} baseline</small></div><div><span>Lost margin</span><strong>{shortMoney(skuData?.impact[`model_${Math.round(state.service*100)}`]?.lost_margin_inr??32000)}</strong><small>vs {shortMoney(skuData?.impact['naive']?.lost_margin_inr??92000)} baseline <b>↓ reduced</b></small></div><div><span>Total imbalance cost</span><strong>{shortMoney(skuData?.impact[`model_${Math.round(state.service*100)}`]?.total_imbalance_cost_inr??65000)}</strong><small>vs {shortMoney(skuData?.impact['naive']?.total_imbalance_cost_inr??122000)} baseline</small></div></div><p className={s['basis']}>Backtest on {shell.backtest.basis.weeks} weeks of demo data, {shell.backtest.basis.skus} SKUs, vs a simple rule-of-thumb policy.</p></section>
   </>}
  </main>:<div className={s['infoPage']}><span className={s['sectionIndex']}>{state.tab==='how-it-works'?'THE METHOD / 02':'THE FINE PRINT / 03'}</span><h2>{state.tab==='how-it-works'?t.how:t.assumptions}</h2>{state.tab==='how-it-works'?<><p>We start with past sales, seasonality, promotions and events to estimate a likely range of weekly demand. The middle line is the most likely forecast; the shaded band is the 80% likely range.</p><h3>From forecast to order</h3><p>The planner adds demand over the supplier lead time and the next weekly review. It chooses a stock target for your selected service level, subtracts what you already have or have ordered, then rounds up to full cases and the supplier minimum.</p><h3>Testing against a simple rule</h3><p>Impact compares the model against a rule-of-thumb ordering policy across a synthetic 52-week backtest. Use the time machine to see what a past forecast looked like before actual demand became known.</p></>:<><p>Everything here is fictional. Product names, demand, forecasts, explanations and outcomes are synthetic examples, not measured business results.</p><h3>What the numbers mean</h3><p>Forecasts and explanations were produced offline. Order quantities and risks are recalculated in your browser. The likely range is not a guarantee, and backtested differences should not be treated as expected savings on your data.</p><h3>What is not included</h3><p>This demo does not account for expiry, supplier capacity, multiple warehouses, varying transport costs or real-time inventory feeds. No selection is saved or sent to a server.</p></>}</div>}
  <footer className={s['footer']}><span>FORECAST. LAB <span className={s['brandDot']}>·</span> BUILT FOR BETTER DECISIONS</span><span>DEMO DATA · NOT A LIVE BUSINESS FORECAST</span><div>{cta}</div></footer>
  {state.tab==='planner'&&<div className={s['mobileBar']}><Button variant="outline" onClick={()=>setDrawer(true)}><SlidersHorizontal size={17}/> Controls</Button>{cta}</div>}
  {drawer&&<div className={s['drawerBackdrop']} onClick={()=>setDrawer(false)}><div className={s['drawer']} role="dialog" aria-modal="true" aria-label="Planner controls" onClick={e=>e.stopPropagation()}><div className={s['drawerHead']}><h2>Planner controls</h2><Button variant="ghost" size="icon" aria-label="Close controls" onClick={()=>setDrawer(false)}><X size={20}/></Button></div>{controls}<div className={s['drawerMore']}>{scenarios}</div><Button className={s['drawerDone']} onClick={()=>setDrawer(false)}>Done</Button></div></div>}
 </div>;
}
