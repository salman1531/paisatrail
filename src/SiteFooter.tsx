import {APP_VERSION} from './version';
import BrandIdentity from './BrandIdentity';
import './site-footer.css';
import {footerGroups} from '../scripts/site-footer.mjs';

export default function SiteFooter({compact=false,workspace=false}:{compact?:boolean;workspace?:boolean}) {
 const groups=footerGroups(import.meta.env.VITE_CONTACT_EMAIL??'');
 const links=<div className="site-footer-groups">{groups.map(group=><nav key={group.title} aria-label={`Footer ${group.title}`}><h2>{group.title}</h2>{group.links.map(link=><a key={link.href} href={link.href}>{link.label}</a>)}</nav>)}</div>;
 const credit=<span className="powered-by">Powered by <a href="https://www.hirubix.com/" target="_blank" rel="noopener noreferrer">Rubix Labs</a></span>;
 if(workspace)return <footer className="workspace-footer" aria-label="Site information"><nav aria-label="Help and policies"><a href="/guide">Help</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a></nav><span className="app-version">v{APP_VERSION}</span>{credit}</footer>;
 return <footer className={`site-footer${compact?' compact-footer':''}`} aria-label="Site information">{compact?<>{credit}<details><summary>Help & information</summary>{links}</details></>:<><div className="site-footer-intro"><a className="footer-brand" href="/"><BrandIdentity/></a><p>Personal Finance and Shared Expenses. One account.</p></div>{links}<div className="site-footer-bottom"><span>Your own money and shared costs, kept separate.</span>{credit}</div></>}</footer>;
}
