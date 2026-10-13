import {ArrowRight,BookOpen,ChartNoAxesCombined,CalendarDays,PiggyBank} from 'lucide-react';
import BrandMark from './BrandMark';
import SiteFooter from './SiteFooter';
const features=[
 {title:'Money Log',text:'Everything you earn, spend and set aside. Find records quickly and export them to Excel.',path:'money-log',Icon:CalendarDays},
 {title:'Money Plan',text:'Give your goals a plan. Set spending limits and see what you have put aside.',path:'money-plan',Icon:PiggyBank},
 {title:'Reports',text:'See where your money goes. Explore categories and compare your recorded activity.',path:'reports',Icon:ChartNoAxesCombined},
];
export default function Home(){return <main className="home-page">
 <header><a href="/" className="brand"><BrandMark/>PaisaTrace</a><nav aria-label="Get started"><a href="/guide" className="home-guide-link"><BookOpen size={18}/>User guide</a><a href="/login" className="button">Sign in</a></nav></header>
 <section className="home-hero"><div className="home-hero-copy"><p className="eyebrow">YOUR MONEY. A LITTLE CLEARER.</p><h1>Track spending.<br/>Know what remains.</h1><p>See your budget remaining, record everyday spending, and make room for your goals.</p><div className="home-actions"><a className="button" href="/signup">Create free account<ArrowRight size={18}/></a><a className="button secondary" href="/demo/overview">Explore the demo</a></div><ul className="home-benefits"><li>Free personal use</li><li>No bank connection</li><li>Your own private ledger</li></ul></div><a href="/demo/overview" className="home-preview"><div className="home-preview-label"><span className="home-preview-dot"/>A look inside PaisaTrace</div><img src="/guide-images/overview.jpg" width="1280" height="900" alt="A fictional PaisaTrace overview with spending and budget remaining"/><span className="home-preview-caption">Explore a sample monthly overview<ArrowRight size={18}/></span></a></section>
 <section className="home-tools" aria-labelledby="home-tools-heading"><div className="home-section-heading"><p className="eyebrow">LESS GUESSWORK. MORE CLARITY.</p><h2 id="home-tools-heading">Your money, in one place.</h2><p>Start with an entry. Add a plan when you are ready.</p></div><div className="home-features">{features.map(({title,text,path,Icon})=><a key={path} href={`/demo/${path}`} className="home-feature"><span className="home-feature-icon"><Icon size={24}/></span><h3>{title}</h3><p>{text}</p><span className="home-feature-action">Try {title}<ArrowRight size={17}/></span></a>)}</div></section>
 <section className="home-start"><div><h2>A little clarity starts with one entry.</h2><p>Try the sample workspace first, or create an account for your own records.</p></div><a className="button" href="/demo/overview">Try the demo<ArrowRight size={18}/></a></section>
 <SiteFooter/>
 </main>;}
