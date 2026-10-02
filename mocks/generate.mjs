import fs from 'node:fs';
const base = 'public/demo-data';
const write = (path, data) => fs.writeFileSync(`${base}/${path}`, JSON.stringify(data));
const add = (iso, weeks) => { const d = new Date(`${iso}T00:00:00Z`); d.setUTCDate(d.getUTCDate()+weeks*7); return d.toISOString().slice(0,10); };
const categories = [
 ['all','All categories'],['staples','Staples & cooking'],['snacks','Snacks & sweets'],['beverages','Beverages'],['personal','Personal care'],['home','Home essentials']
].map(([id,name])=>({id,name}));
const names = [
 ['Sona Gold Cooking Oil','1 L pouch','staples','festival',3,155],['Niva Classic Atta','5 kg bag','staples','steady',2,190],['Tara Basmati Rice','2 kg bag','staples','festival',3,260],['Daya Toor Dal','1 kg pack','staples','steady',2,140],['Mira Spiced Namkeen','400 g pack','snacks','festival',2,92],['Tara Celebration Mithai','500 g box','snacks','festival',2,220],['Niva Masala Crisps','120 g pack','snacks','promo',1,40],['Sona Roasted Peanuts','250 g pouch','snacks','steady',2,65],['Daya Mango Drink','1 L carton','beverages','seasonal',2,85],['Mira Masala Chai','250 g pack','beverages','steady',2,110],['Tara Lemon Fizz','300 ml bottle','beverages','promo',1,28],['Niva Filter Coffee','200 g pack','beverages','intermittent',3,175],['Sona Herbal Shampoo','400 ml bottle','personal','promo',3,170],['Daya Neem Soap','4 × 100 g','personal','steady',2,90],['Mira Aloe Face Wash','150 ml tube','personal','new_launch',4,135],['Tara Hair Oil','200 ml bottle','personal','steady',3,98],['Niva Laundry Liquid','1 L bottle','home','promo',3,160],['Daya Dishwash Gel','500 ml bottle','home','steady',2,72],['Mira Floor Cleaner','1 L bottle','home','intermittent',3,105],['Sona Fabric Freshener','250 ml spray','home','new_launch',4,145]
];
const products=names.map(([name,pack_label,category,archetype,lead_time_weeks,unit_cost_inr],i)=>({sku_id:`sku_${String(i+1).padStart(2,'0')}`,name,pack_label,category,archetype,lead_time_weeks,unit_cost_inr,unit_price_inr:Math.round(unit_cost_inr*1.4),moq_units:archetype==='intermittent'?96:500,case_pack_units:24,holding_cost_pct_pa:.18,limited_history:archetype==='new_launch'}));
const origins=Array.from({length:10},(_,i)=>add('2025-09-29',i*4)).concat('2026-09-28');
const events=[{week_start:'2025-10-20',name:'Diwali 2025',type:'festival'},{week_start:'2026-11-02',name:'Diwali',type:'festival'},{week_start:'2026-03-02',name:'Holi',type:'festival'},{week_start:'2026-12-21',name:'Year-end',type:'season'}];
const impact={naive:{fill_rate:.88,avg_on_hand_value_inr:350000,lost_margin_inr:92000,total_imbalance_cost_inr:122000},model_90:{fill_rate:.94,avg_on_hand_value_inr:306000,lost_margin_inr:57000,total_imbalance_cost_inr:84000},model_95:{fill_rate:.97,avg_on_hand_value_inr:325000,lost_margin_inr:32000,total_imbalance_cost_inr:65000},model_99:{fill_rate:.99,avg_on_hand_value_inr:390000,lost_margin_inr:14000,total_imbalance_cost_inr:60000}};
write('manifest.json',{schema_version:'1.0.0',data_version:'mock-2026.10',generated_at:'2026-10-02',source:'mock',origins,default_view:{sku_id:'sku_01',horizon_weeks:13,service_level:.95},files:{}});
write('products.json',{categories,products}); write('calendar.json',{events}); write('backtest_summary.json',{basis:{weeks:52,skus:48},impact,frontier:[],metrics:{}});
const probs=[.05,.10,.25,.50,.75,.90,.95,.99]; const keys=probs.map(p=>p.toFixed(2));
for(let i=0;i<products.length;i++){
 const p=products[i]; const baseDemand=p.archetype==='intermittent'?140:p.archetype==='new_launch'?580:950+(i%6)*125;
 const demand=(iso, promo=0)=>{let week=Math.round((Date.parse(iso)-Date.parse('2026-09-28'))/604800000); let festival=(p.archetype==='festival' ? 800*Math.exp(-Math.pow((week-5)/2.3,2)) : 110*Math.exp(-Math.pow((week-5)/2.5,2))); let season=1+0.1*Math.sin(week/7+i); return Math.max(0,Math.round((baseDemand*season+festival)*(1+promo*.012)));};
 const historyWeeks=Array.from({length:156},(_,j)=>add('2026-09-28',j-156));
 const history=historyWeeks.map((week,j)=>p.limited_history&&j<120?null:j===67?null:Math.max(0,Math.round(demand(week)*(1+.07*Math.sin(j*2.7+i))*(j%31===0?.72:1))));
 const backtestWeeks=historyWeeks.slice(-52);
 const blocks=origins.map((origin,oi)=>{
  const make=(promo)=>{const arr=Array.from({length:26},(_,w)=>demand(add(origin,w),promo)*(1+Math.sin(w*1.3+oi+i)*.026));
   const weekly={p10:arr.map((n,w)=>Math.round(n*(.77-w*.002)),p50:arr.map(Math.round),p90:arr.map((n,w)=>Math.round(n*(1.23+w*.002)))};
   const cum_q=Object.fromEntries(keys.map((key,k)=>[key,arr.map((_,h)=>Math.round(arr.slice(0,h+1).reduce((a,b)=>a+b,0)*(1+(probs[k]-.5)*(.25+.07*Math.sqrt(h+1)))))]));
   return {weekly,cum_q}; };
  return {origin,scenarios:Object.fromEntries((oi===10?[0,10,20,30]:[0]).map(v=>[`promo_${v}`,make(v)])),baseline_p50:Array.from({length:26},(_,w)=>Math.round(baseDemand*(1+.04*Math.sin(w)))),drivers:{Trend:65,Seasonality:115,Festival:p.archetype==='festival'?620:90,'Promotion / price':0,Momentum:-38},state:{on_hand:oi===10?1800:2100,on_order:oi===10?900:700},naive_order:4200};
 });
 write(`sku/${p.sku_id}.json`,{sku_id:p.sku_id,history:{week_start:historyWeeks,units_sold:history,stockout_flag:historyWeeks.map((_,j)=>j%31===0?1:0),promo_depth_pct:historyWeeks.map((_,j)=>j%37===0?20:0)},backtest_actuals:{week_start:backtestWeeks,true_demand:backtestWeeks.map(week=>demand(week))},origins:blocks,impact});
 write(`explanations/${p.sku_id}.json`,{sku_id:p.sku_id,meta:{model:'offline mock',prompt_version:'1',generated_at:'2026-10-02'},by_origin:Object.fromEntries(origins.map(origin=>[origin,`${p.name} is tracking ${p.archetype==='festival'?'towards a seasonal lift around Diwali':'close to its usual weekly pattern'}. Recent demand and seasonal behaviour shape the central forecast. The shaded range widens further out because future demand is less certain. Review stock and supplier timing together before committing to an order.`]))});
}
console.log(`Generated ${products.length} fictional products`);
