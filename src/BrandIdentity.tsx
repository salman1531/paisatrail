import BrandMark from './BrandMark';
import './brand.css';
/** Keep the visible brand identical in public, account and workspace headers. */
export default function BrandIdentity(){
 return <span className="brand-lockup"><BrandMark size={36}/><span className="brand-wordmark">PaisaTrace</span></span>;
}
