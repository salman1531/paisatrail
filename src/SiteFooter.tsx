import BrandMark from './BrandMark';
import './site-footer.css';
import {footerGroups} from '../scripts/site-footer.mjs';

export default function SiteFooter({compact=false}:{compact?:boolean}) {
 const groups=footerGroups(import.meta.env.VITE_CONTACT_EMAIL??'');
 const links=<div className="site-footer-groups">{groups.map(group=><nav key={group.title} aria-label={`Footer ${group.title}`}><h2>{group.title}</h2>{group.links.map(link=><a key={link.href} href={link.href}>{link.label}</a>)}</nav>)}</div>;
 const credit=<span className="powered-by">Powered by <a href="https://www.hirubix.com/" target="_blank" rel="noopener noreferrer">Rubix Labs</a></span>;
 return <footer className={`site-footer${compact?' compact-footer':''}`} aria-label="Site information">{compact?<>{credit}<details><summary>Help & information</summary>{links}</details></>:<><div className="site-footer-intro"><a className="footer-brand" href="/"><BrandMark size={28}/>PaisaTrace</a><p>Track, plan and review your money.</p></div>{links}<div className="site-footer-bottom"><span>Personal finance, at your pace.</span>{credit}</div></>}</footer>;
}
