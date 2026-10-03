import { describe, expect, it } from 'vitest';
import { recommendOrder, type QuantileTable } from './reorder';
const keys = ['0.05','0.10','0.25','0.50','0.75','0.90','0.95','0.99'] as const;
const table = Object.fromEntries(keys.map(k=>[k,Array.from({length:26},(_,i)=>Math.round((i+1)*(k==='0.95'?1300:k==='0.50'?975:800+Number(k)*500)))])) as QuantileTable;
const input = {cumQ:table,leadTimeWeeks:3,reviewWeeks:1 as const,serviceLevel:.95 as const,onHand:1800,onOrder:900,casePack:24,moq:500,unitCost:155};
describe('reorder recommendation',()=>{
 it('rounds the worked example to 2,520 units',()=>{const result=recommendOrder(input);expect(result.orderUpTo).toBe(5200);expect(result.safetyStock).toBe(1300);expect(result.orderQty).toBe(2520);expect(result.cash).toBe(390600)});
 it('does not order beyond the stock target',()=>expect(recommendOrder({...input,onHand:6000,onOrder:0}).orderQty).toBe(0));
 it('rounds the supplier minimum to whole cases',()=>expect(recommendOrder({...input,onHand:5150,onOrder:0}).orderQty).toBe(504));
});
