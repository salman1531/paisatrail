import {filtered} from './finance';
import type {Filter, Ledger} from './types';

export function spendingBreakdown(ledger:Ledger, filter:Filter, by:'category'|'subcategory') {
  const categories=new Map(ledger.categories.map(c=>[c.id,c]));
  const children=new Map((ledger.subcategories??[]).map(s=>[s.id,s]));
  const groups=new Map<string,{key:string;name:string;parent:string;archived:boolean;amount:number}>();
  for(const entry of filtered(ledger.entries,{...filter,category:'all'})) {
    const category=categories.get(entry.category_id);
    if(entry.currency!==ledger.profile.currency || category?.kind!=='expense')continue;
    const child=entry.subcategory_id?children.get(entry.subcategory_id):undefined;
    const detailed=by==='subcategory';
    const key=detailed?`${category.id}/${child?.id??'direct'}`:category.id;
    const name=detailed&&child?child.name:category.name;
    const parent=detailed&&child?category.name:detailed?'No subcategory':'';
    const group=groups.get(key)??{key,name,parent,archived:category.archived||Boolean(detailed&&child?.archived),amount:0};
    group.amount+=entry.amount_minor;groups.set(key,group);
  }
  return [...groups.values()].filter(r=>r.amount>0).sort((a,b)=>b.amount-a.amount||a.name.localeCompare(b.name));
}
