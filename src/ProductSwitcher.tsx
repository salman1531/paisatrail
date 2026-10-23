import {ArrowLeftRight} from 'lucide-react';
import './product-switcher.css';

export function ProductSwitchLink({product,demo=false}:{product:'personal'|'shared';demo?:boolean}) {
  const href=demo?(product==='personal'?'/shared-demo/dashboard':'/demo/overview'):'/products';
  return <a className="product-switch-link" href={href}><ArrowLeftRight size={16} aria-hidden="true"/><span>Switch product</span></a>;
}

export default function ProductSwitcher({product,demo=false}:{product:'personal'|'shared';demo?:boolean}) {
  return <nav className="workspace-product-bar" aria-label="Product switcher"><span className="current-product">{product==='personal'?'Personal Finance':'Shared Expenses'}{demo&&<small>Demo</small>}</span><ProductSwitchLink product={product} demo={demo}/></nav>;
}
