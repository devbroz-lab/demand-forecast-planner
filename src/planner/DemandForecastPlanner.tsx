'use client';
import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { ArrowUpRight, BarChart3, CalendarDays, ChevronDown, CircleHelp, Clock3, Info, SlidersHorizontal, Sparkles, TrendingUp, TriangleAlert, X } from 'lucide-react';
import { ResponsiveContainer, ComposedChart, Area, Line, CartesianGrid, XAxis, YAxis, Tooltip, ReferenceLine, ReferenceArea } from 'recharts';
import { Button } from '@/components/ui/button';
import { loadProduct, loadShell } from './data/load';
import type { BacktestSummary, CalendarFile, Manifest, ProductsFile, SkuFile } from './data/types';
import { recommendOrder } from './core/reorder';
import { addWeeks, date, money, riskLabel, shortMoney, units } from './core/format';
import { en, type DfpStrings } from './strings/en';
import s from './DemandForecastPlanner.module.css';

type Event = {name: 'demo_opened' | 'sku_selected' | 'service_level_changed' | 'time_machine_used' | 'scenario_toggled' | 'cta_clicked'; [key: string]: string | number};
export interface DemandForecastPlannerProps { dataBaseUrl: string; ctaHref: string; theme?: Record<string,string>; onEvent?: (event: Event) => void; strings?: Partial<DfpStrings>; className?: string }
type State = {category: string; sku: string; horizon: 4|8|13|26; service: .9|.95|.99; origin: number; delay: 0|1|2|4; promo: 0|10|20|30; baseline: boolean; stock: number|null; view: 'chart'|'table'};
type Action = {type: keyof State; value: State[keyof State]} | {type:'originReset'; value:number};
const initial: State = {category:'all',sku:'',horizon:13,service:.95,origin:10,delay:0,promo:0,baseline:true,stock:null,view:'chart'};
function reducer(state: State, action: Action): State {
 if(action.type==='originReset') return {...state,origin:action.value,delay:0,promo:0,stock:null};
 return {...state,[action.type]:action.value};
}
const basePath = (url: string) => url.endsWith('/') ? url : `${url}/`;
const driverNames = ['Trend','Seasonality','Festival','Promotion / price','Momentum'];
const percent = (value?: number) => value == null ? '—' : `${Math.round(value * 100)}%`;
const moneyOrDash = (value?: number) => value == null ? '—' : shortMoney(value);

export function DemandForecastPlanner({dataBaseUrl,ctaHref,theme,onEvent,strings,className}:DemandForecastPlannerProps){
 const t = {...en,...strings};
 const tourSteps = t.tourSteps ?? en.tourSteps;
 const base = basePath(dataBaseUrl);
 const [state,dispatch] = useReducer(reducer,initial);
 const [shell,setShell] = useState<{manifest:Manifest;products:ProductsFile;calendar:CalendarFile;backtest:BacktestSummary}|null>(null);
 const [skuData,setSkuData] = useState<SkuFile|null>(null);
 const [explanations,setExplanations] = useState<Record<string,string>|null>(null);
 const [error,setError] = useState(''); const [productError,setProductError] = useState('');
 const [loading,setLoading] = useState(true); const [productLoading,setProductLoading] = useState(false);
 const [drawer,setDrawer] = useState(false);
 const [tourStep,setTourStep] = useState<number|null>(null);
 const [tourStarted,setTourStarted] = useState(false);
 const tourDialog=useRef<HTMLDivElement>(null);
 const tourTrigger=useRef<HTMLButtonElement>(null);
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
 const result=useMemo(()=>product&&origin&&forecast?recommendOrder({cumQ:forecast.cum_q,leadTimeWeeks:product.lead_time_weeks+state.delay,reviewWeeks:1,serviceLevel:state.service,onHand,onOrder:origin.state.on_order,casePack:product.case_pack_units,moq:product.moq_units,unitCost:product.unit_cost}):null,[product,origin,forecast,state.service,state.delay,onHand]);
 const change=(type:keyof State,value:State[keyof State])=>dispatch({type,value});
 const chooseCategory=(category:string)=>{change('category',category);const next=shell?.products.products.find(p=>category==='all'||p.category===category);if(next){change('sku',next.sku_id);emit({name:'sku_selected',skuId:next.sku_id});}};
 const chooseSku=(sku:string)=>{change('sku',sku);emit({name:'sku_selected',skuId:sku});};
 const closeTour=()=>{setTourStep(null);setDrawer(false);tourTrigger.current?.focus();};
 useEffect(()=>{if(!loading && shell && skuData && !tourStarted){setTourStarted(true);setTourStep(0);}},[loading,shell,skuData,tourStarted]);
 useEffect(()=>{if(tourStep===null)return;const isMobile=window.matchMedia('(max-width:767px)').matches;setDrawer(false);const timer=window.setTimeout(()=>{const id=tourSteps[tourStep]?.id;const target=isMobile&&(id==='selection'||id==='scenarios')?document.querySelector('[data-tour-target="mobile-controls"]'):document.querySelector(`[data-tour-target="${id}"]`);if(!isMobile||id!=='selection'&&id!=='scenarios')target?.scrollIntoView({behavior:'smooth',block:'center'});tourDialog.current?.focus();},180);return()=>window.clearTimeout(timer);},[tourStep,tourSteps]);
 useEffect(()=>{if(tourStep===null)return;const onKey=(e:KeyboardEvent)=>{if(e.key==='Escape'){e.preventDefault();closeTour();}if(e.key==='Tab'){const buttons=tourDialog.current?.querySelectorAll<HTMLButtonElement>('button:not([disabled])');if(!buttons?.length)return;const first=buttons[0],last=buttons[buttons.length-1];if(e.shiftKey && (document.activeElement===first || document.activeElement===tourDialog.current)){e.preventDefault();last?.focus();}else if(!e.shiftKey && document.activeElement===last){e.preventDefault();first?.focus();}}};document.addEventListener('keydown',onKey);return()=>document.removeEventListener('keydown',onKey);},[tourStep]);
 const highlight=(id:string)=>tourStep!==null&&tourSteps[tourStep]?.id===id?s['tourHighlight']:'';
 const chartData=useMemo(()=>{
  if(!skuData||!origin||!forecast)return [];
  const historyIndex=skuData.history.week_start.findIndex(d=>d>=origin.origin);
  const end=historyIndex<0?skuData.history.week_start.length:historyIndex;
  const history=skuData.history.week_start.slice(Math.max(0,end-104),end).map((week,j,arr)=>{
   const index=end-arr.length+j;
   return {week,observed:skuData.history.units_sold[index],stockout:skuData.history.stockout_flag[index]===1,promo:(skuData.history.promo_depth_pct[index]??0)>0,kind:'history' as const};
  });
  const future=Array.from({length:state.horizon},(_,i)=>{const week=addWeeks(origin.origin,i);const actualIdx=skuData.backtest_actuals.week_start.indexOf(week);return {week,forecast:forecast.weekly.p50[i],low:forecast.weekly.p10[i],high:forecast.weekly.p90[i],baseline:origin.baseline_p50[i],actual:past&&actualIdx>=0?skuData.backtest_actuals.true_demand[actualIdx]:undefined,stockout:false,promo:false,kind:'future' as const};});
  return [...history,...future];
 },[skuData,origin,forecast,state.horizon,past]);
 const peak=chartData.filter(d=>d.kind==='future').reduce<{week:string;forecast:number}|null>((acc,d)=>('forecast'in d && typeof d.forecast==='number'&&(!acc||d.forecast>acc.forecast)?{week:d.week,forecast:d.forecast}:acc),null);
 const event=peak? shell?.calendar.events.find(e=>e.week_start===peak.week):undefined;
 const orderDate=result?.orderBy.kind==='week'&&origin?date(addWeeks(origin.origin,result.orderBy.weeksFromOrigin)):null;
 const orderTiming=result?.orderBy.kind==='not-needed'?`No replenishment needed in the next ${result.orderBy.withinWeeks} weeks`:result?.orderBy.kind==='week'?`By ${orderDate}`:'Due now';
 const modelImpact=skuData?.impact[`model_${Math.round(state.service*100)}`];
 const naiveImpact=skuData?.impact['naive'];
 const driverMax=Math.max(1,...driverNames.map(name=>Math.abs(origin?.drivers[name]??0)));
 const rowNotes=(week:string,row:{stockout?:boolean;promo?:boolean})=>{
  const notes:string[]=[];
  const name=shell?.calendar.events.find(e=>e.week_start===week)?.name;
  if(name)notes.push(name);
  if(row.stockout)notes.push('Stockout');
  if(row.promo)notes.push('Promotion');
  return notes.length?notes.join(' · '):'—';
 };
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
   <Tooltip content={({active,payload,label})=>{if(!active||!payload?.length)return null; const row=payload[0]?.payload as {stockout?:boolean;promo?:boolean}|undefined; return <div className={s['tooltip']}><strong>Week of {date(label as string)}</strong>{payload.filter(item=>item.value!=null && item.dataKey!=='stockout' && item.dataKey!=='promo').map(item=><div key={String(item.dataKey)}>{item.name}: {units(Number(item.value))} units</div>)}{rowNotes(String(label),row??{})!=='—'&&<em>{rowNotes(String(label),row??{})}</em>}</div>;}}/>
   {origin&&<ReferenceArea x1={origin.origin} x2={chartData.at(-1)?.week ?? origin.origin} fill="var(--_accent-soft)" fillOpacity={.2} strokeOpacity={0}/>} {origin&&<ReferenceLine x={origin.origin} stroke="var(--_border-strong)" strokeDasharray="3 3"/>}
   {shell?.calendar.events.filter(e=>chartData.some(d=>d.week===e.week_start)).map(e=><ReferenceLine key={e.week_start} x={e.week_start} stroke="var(--_event)" strokeDasharray="2 4" label={{value:e.name,position:'insideTopLeft',fill:'var(--_event)',fontSize:10}}/>)}
   <Area type="monotone" dataKey="high" name="Likely high" stroke="none" fill="var(--_accent-soft)" fillOpacity={1} isAnimationActive={false}/><Area type="monotone" dataKey="low" name="Likely low" stroke="none" fill="var(--_surface)" fillOpacity={1} isAnimationActive={false}/>
   <Line type="monotone" dataKey="observed" name="Observed sales" stroke="var(--_muted)" strokeWidth={1.5} connectNulls={false} isAnimationActive={false} dot={(props: {key?:string;cx?:number;cy?:number;payload?:{stockout?:boolean;promo?:boolean}})=>{const {key,cx,cy,payload}=props; if(cx==null||cy==null)return <g key={key}/>; if(payload?.stockout)return <circle key={key} cx={cx} cy={cy} r={3.5} fill="var(--_warning)"/>; if(payload?.promo)return <circle key={key} cx={cx} cy={cy} r={3.5} fill="var(--_compare)"/>; return <g key={key}/>;}}/>
   {state.baseline&&<Line type="monotone" dataKey="baseline" name="Simple baseline" stroke="var(--_compare)" strokeWidth={1.5} strokeDasharray="5 5" dot={false} isAnimationActive={false}/>}
   <Line type="monotone" dataKey="forecast" name="Forecast" stroke="var(--_accent)" strokeWidth={3} dot={false} isAnimationActive={false}/>
   {past&&<Line type="monotone" dataKey="actual" name="Actual demand" stroke="var(--_text)" strokeWidth={2} dot={{r:2,fill:'var(--_text)'}} isAnimationActive={false}/>}
  </ComposedChart></ResponsiveContainer></div>
  <div className={s['legend']}><span><i className={s['legendForecast']}/> Forecast (most likely)</span><span><i className={s['legendRange']}/> Likely range (80%)</span><span><i className={s['legendObserved']}/> Observed sales</span><span><i className={s['legendStockout']}/> Stockout week</span><span><i className={s['legendPromo']}/> Promotion week</span>{state.baseline&&<span><i className={s['legendBaseline']}/> Simple baseline</span>}{past&&<span><i className={s['legendActual']}/> Actual demand</span>}</div>
 </div>;
 const table=<div className={s['tableScroll']}><table><thead><tr>{['Week of','Observed','Forecast','Likely low','Likely high','Baseline','Actual','Event'].map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{chartData.map(d=><tr key={d.week}><td>{date(d.week)}</td>{(['observed','forecast','low','high','baseline','actual'] as const).map(k=><td key={k}>{k==='baseline'&&!state.baseline?'—':k==='actual'&&!past?'—':typeof d[k as keyof typeof d]==='number'?units(Number(d[k as keyof typeof d])):'—'}</td>)}<td>{rowNotes(d.week,d)}</td></tr>)}</tbody></table></div>;
  const style=theme?Object.fromEntries(Object.entries(theme).map(([key,value])=>[key.startsWith('--dfp-')?key:`--dfp-${key}`,value])) as React.CSSProperties:undefined;
  const replay = origin?.replay;
  return <div className={`${s['root']} ${className??''}`} style={style}>
   <div className={s['topline']}><div className={s['brand']}><span className={s['brandMark']}><BarChart3 size={17}/></span><span>{t.brand}</span><span className={s['edition']}>{t.edition}</span></div><div className={s['topRight']}>{t.workspace}</div></div>
   <header className={s['header']}><div><div className={s['eyebrow']}>{t.eyebrow}</div><h1>{t.title}</h1><p>{t.subtitle}</p></div><Button ref={tourTrigger} variant="outline" className={s['tourTrigger']} onClick={()=>{setDrawer(false);setTourStep(0)}}><CircleHelp size={16}/> {t.tourButton}</Button></header>
   <main className={s['main']}>
    {loading?<div className={s['skeletonGrid']}><div className={s['skeleton']}/><div className={s['skeleton']}/></div>:error?<div className={s['error']}><TriangleAlert size={20}/>{error}<Button variant="outline" onClick={()=>setRetryKey(v=>v+1)}>Retry</Button></div>:shell&&<>
     <div data-tour-target="selection" className={`${s['selectionRow']} ${s['desktopTourTarget']} ${highlight('selection')}`}><div className={s['sectionHeading']}><span className={s['sectionIndex']}>WORKSPACE / 01</span><h2>{t.productAnalysis}</h2></div>{controls}<div className={s['dataStamp']}>{t.dataThrough.toUpperCase()}<br/><strong>{date(shell.manifest.history_through)}</strong></div></div>
     {productError&&<div className={s['error']}><TriangleAlert size={18}/>{productError}<Button variant="outline" onClick={()=>setSkuRetry(v=>v+1)}>Retry</Button></div>}
     <div className={`${s['analysisGrid']} ${productLoading?s['loadingContent']:''}`}>
      <div className={s['analysisMain']}>
       <section data-tour-target="metrics" className={`${s['metricGrid']} ${highlight('metrics')}`} aria-label="Planning measures">
        <div className={s['metric']}><span>Recommended quantity</span><strong>{units(result?.orderQty??0)} <small>units</small></strong><p>{orderTiming}</p></div>
        <div className={s['metric']}><span>Cash commitment</span><strong>{result?shortMoney(result.cash):'—'}</strong><p>{product?`at ${money(product.unit_cost)} / unit`:'—'}</p></div>
        <div className={s['metric']}><span>Risk before arrival</span><strong>{result?riskLabel(result.leadTimeRisk):'—'}</strong><p>Stockout probability</p></div>
        <div className={s['metric']}><span>Safety stock</span><strong>{units(result?.safetyStock??0)} <small>units</small></strong><p>{Math.round(state.service*100)}% service target</p></div>
       </section>
       <section data-tour-target="forecast" className={`${s['forecastSection']} ${highlight('forecast')}`}><div className={s['panelTop']}><div><span className={s['sectionIndex']}>DEMAND SIGNAL</span><h2>{t.forecast}</h2><p>{t.forecastNote}</p></div><div className={s['viewSwitch']}><Button variant="ghost" className={state.view==='chart'?s['selected']:''} onClick={()=>change('view','chart')}>Chart</Button><Button variant="ghost" className={state.view==='table'?s['selected']:''} onClick={()=>change('view','table')}>Table</Button></div></div>
        <div className={s['chartToolbar']}><div className={s['horizon']}><span>PLANNING HORIZON</span><div className={s['segment']}>{([4,8,13,26] as const).map(v=><Button variant="ghost" key={v} className={state.horizon===v?s['selected']:''} onClick={()=>change('horizon',v)}>{v}w</Button>)}</div></div><label className={s['check']}><input type="checkbox" checked={state.baseline} onChange={e=>change('baseline',e.target.checked)}/> Compare baseline</label></div>
        {state.view==='chart'?renderChart():table}
        <p className={s['chartSummary']}>{peak?`Peak outlook: ${units(peak.forecast)} units, week of ${date(peak.week)}${event?` · ${event.name}`:''}.`:''}</p>
       </section>
       <section data-tour-target="replay" className={`${s['replayPanel']} ${highlight('replay')}`}><div className={s['replay']}><div className={s['replayHeader']}><div><Clock3 size={16}/><strong>{t.replay}</strong>{past&&<span className={s['replayBadge']}>{t.historicalView.toUpperCase()}</span>}</div><span>{origin?date(origin.origin):'—'}</span></div><input type="range" aria-label={`Forecast origin ${state.origin+1} of ${shell.manifest.origins.length}, ${date(shell.manifest.origins[state.origin] ?? shell.manifest.history_through)}`} min="0" max={shell.manifest.origins.length-1} value={state.origin} onChange={e=>{const value=Number(e.target.value);dispatch({type:'originReset',value});emit({name:'time_machine_used',origin:shell.manifest.origins[value] ?? shell.manifest.history_through})}}/><div className={s['replayEnds']}><span>{date(shell.manifest.origins[0] ?? shell.manifest.history_through)}</span><span>{t.latest} · {date(shell.manifest.origins.at(-1) ?? shell.manifest.history_through)}</span></div></div>
        {past&&replay&&<div className={s['outcome']}><h3>{t.outcome}</h3><div className={s['outcomeGrid']}>{(['naive','model'] as const).map(key=>{const row=replay[key];return <div className={s['outcomeCard']} key={key}><span>{key==='naive'?t.ruleOfThumb:t.modelOrder}</span><dl><dt>Order</dt><dd>{units(row.order_units)} units</dd><dt>Before delivery</dt><dd>{row.stockout_before_delivery?'Ran out':'Held'}</dd><dt>Shortfall</dt><dd>{units(row.shortfall_units)}</dd><dt>Left over</dt><dd>{units(row.leftover_units)}</dd><dt>Lost margin</dt><dd>{shortMoney(row.lost_margin)}</dd><dt>Holding cost</dt><dd>{shortMoney(row.holding_cost)}</dd><dt>Cash</dt><dd>{shortMoney(row.cash)}</dd></dl></div>;})}</div></div>}
       </section>
       <section data-tour-target="drivers" className={`${s['whySection']} ${highlight('drivers')}`}><div className={s['panelTop']}><div><span className={s['sectionIndex']}>MODEL INTERPRETATION</span><h2>{t.why}</h2></div><Sparkles className={s['sparkle']} size={18}/></div><p className={s['whyText']}>{explanations?.[origin?.origin??'']??t.explanationMissing}</p><div className={s['drivers']}>{driverNames.map(name=>{const v=origin?.drivers[name]??0;return <div className={s['driver']} key={name}><span>{name}</span><div className={s['driverTrack']}><i className={v>=0?s['positive']:s['negative']} style={{width:`${Math.min(Math.abs(v)/driverMax*100,100)}%`}}/></div><strong>{v>=0?'+':'−'}{units(Math.abs(v))} <small>units/wk</small></strong></div>})}</div></section>
      </div>
      <aside className={s['analysisAside']} aria-label="Replenishment analysis">
       <section data-tour-target="replenishment" className={`${s['orderPanel']} ${highlight('replenishment')}`}><div className={s['orderHead']}><span className={s['sectionIndex']}>REPLENISHMENT LOGIC</span><TrendingUp size={17}/></div><h2>{t.recommendation}</h2><p className={s['orderIntro']}>{product?.name??'Selected product'} · {product?.pack_label}</p>{product?.limited_history&&<span className={s['badge']}>Limited history</span>}
        <div className={s['orderHero']}><span>CALCULATED REPLENISHMENT</span><div><strong>{units(result?.orderQty??0)}</strong><span>units</span></div><p className={s['orderTiming']}><CalendarDays size={15}/>{orderTiming}</p></div>
        <div className={s['orderStats']}><div><span>Available + incoming</span><strong>{units(onHand+(origin?.state.on_order??0))}</strong><small>units</small></div><div><span>Cash commitment</span><strong>{result?shortMoney(result.cash):'—'}</strong><small>estimated</small></div></div>
        <div className={s['orderSub']}><div><span>Risk after replenishment</span><strong>{result?riskLabel(result.coverRisk):'—'}</strong></div><div><span>Expected stock left</span><strong>{result?`${units(result.expectedLeft)} units`:'—'}</strong></div><div><span>Supplier lead time</span><strong>{product?`${product.lead_time_weeks} weeks`:'—'}</strong></div><div><span>Case pack / minimum</span><strong>{product?`${units(product.case_pack_units)} / ${units(product.moq_units)}`:'—'}</strong></div></div>
        <p className={s['orderFoot']}><Info size={14}/>{t.horizonNote}</p>
       </section>
       <section data-tour-target="scenarios" className={`${s['scenarioPanel']} ${highlight('scenarios')}`}><div className={s['panelTop']}><div><span className={s['sectionIndex']}>SENSITIVITY CONTROLS</span><h2>{t.scenarios}</h2></div><SlidersHorizontal size={18}/></div>{scenarios}</section>
      </aside>
     </div>
     <section data-tour-target="impact" className={`${s['impactSection']} ${highlight('impact')}`}><div className={s['impactHeading']}><div><span className={s['sectionIndex']}>MODEL COMPARISON</span><h2>{t.impact}</h2></div><span>VS RULE-OF-THUMB BASELINE</span></div><div className={s['impactGrid']}><div><span>Fill rate</span><strong>{percent(modelImpact?.fill_rate)}</strong><small>{naiveImpact?`vs ${Math.round(naiveImpact.fill_rate*100)}% baseline`:'—'}</small></div><div><span>Average inventory value</span><strong>{moneyOrDash(modelImpact?.avg_on_hand_value)}</strong><small>{naiveImpact?`vs ${shortMoney(naiveImpact.avg_on_hand_value)} baseline`:'—'}</small></div><div><span>Lost margin</span><strong>{moneyOrDash(modelImpact?.lost_margin)}</strong><small>{naiveImpact?`vs ${shortMoney(naiveImpact.lost_margin)} baseline`:'—'}</small></div><div><span>Total imbalance cost</span><strong>{moneyOrDash(modelImpact?.total_imbalance_cost)}</strong><small>{naiveImpact?`vs ${shortMoney(naiveImpact.total_imbalance_cost)} baseline`:'—'}</small></div></div><p className={s['basis']}>Historical comparison · {shell.backtest.basis.weeks} weeks · {shell.backtest.basis.skus} products · simple ordering baseline</p></section>
    </>}
   </main>
   <footer id="contact" className={s['footer']}><span>{t.brand} <span className={s['brandDot']}>·</span> {t.edition}</span><a href={ctaHref} onClick={()=>emit({name:'cta_clicked'})}>{t.cta} <ArrowUpRight size={13}/></a></footer>
   <div className={s['mobileBar']}><Button data-tour-target="mobile-controls" className={tourStep!==null&&(tourSteps[tourStep]?.id==='selection'||tourSteps[tourStep]?.id==='scenarios')?s['tourHighlight']:''} variant="outline" onClick={()=>setDrawer(true)}><SlidersHorizontal size={17}/> Controls</Button><Button variant="outline" onClick={()=>setTourStep(0)}><CircleHelp size={16}/> Tour</Button></div>
   {drawer&&<div className={s['drawerBackdrop']} onClick={()=>setDrawer(false)}><div className={s['drawer']} role="dialog" aria-modal={tourStep===null} aria-label="Planner controls" onClick={e=>e.stopPropagation()}><div className={s['drawerHead']}><h2>Planner controls</h2><Button variant="ghost" size="icon" aria-label="Close controls" onClick={()=>setDrawer(false)}><X size={20}/></Button></div>{controls}<div data-tour-target="scenarios" className={`${s['drawerMore']} ${highlight('scenarios')}`}>{scenarios}</div><Button className={s['drawerDone']} onClick={()=>setDrawer(false)}>Done</Button></div></div>}
   {tourStep!==null&&<div className={s['tourOverlay']} role="presentation"><div className={s['tourShade']} onClick={closeTour}/><div ref={tourDialog} className={s['tourDialog']} role="dialog" aria-modal="true" aria-labelledby="tour-title" aria-describedby="tour-description" tabIndex={-1}><div className={s['tourTop']}><span>WORKSPACE TOUR · {tourStep+1} / {tourSteps.length}</span><Button variant="ghost" size="icon" aria-label="Close tour" onClick={closeTour}><X size={17}/></Button></div><h2 id="tour-title">{tourSteps[tourStep]?.title}</h2><p id="tour-description">{tourSteps[tourStep]?.body}</p><div className={s['tourProgress']}>{tourSteps.map((step,i)=><i key={step.id} className={i<=tourStep?s['tourProgressActive']:''}/>)}</div><div className={s['tourActions']}><Button variant="ghost" onClick={closeTour}>Skip tour</Button><div><Button variant="outline" disabled={tourStep===0} onClick={()=>setTourStep(step=>step===null?step:Math.max(0,step-1))}>Back</Button><Button onClick={()=>tourStep===tourSteps.length-1?closeTour():setTourStep(step=>step===null?step:step+1)}>{tourStep===tourSteps.length-1?'Finish':'Next'}</Button></div></div></div></div>}
  </div>;
}
