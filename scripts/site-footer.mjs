// Public navigation is shared by the app and generated documents.
export function footerGroups(email = '') {
  const support = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? [{label:'Contact support',href:`mailto:${email}?subject=PaisaTrace%20support`}] : [];
  return [
    {title:'Explore',links:[{label:'Home',href:'/'},{label:'About PaisaTrace',href:'/about'},{label:'Blog',href:'/blog'},{label:'Demo workspace',href:'/demo/overview'}]},
    {title:'Account',links:[{label:'Account sign-in',href:'/login'},{label:'Create an account',href:'/signup'},{label:'Reset password',href:'/forgot-password'}]},
    {title:'Help',links:[{label:'User guide',href:'/guide'},...support]},
    {title:'Legal',links:[{label:'Privacy policy',href:'/privacy'},{label:'Terms and conditions',href:'/terms'},{label:'Third-party notices',href:'/third-party-notices.txt'}]},
  ];
}
const escape = value => value.replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
export function staticFooter(email) {
  return `<footer class="site-footer" aria-label="Site information"><div class="site-footer-intro"><a class="footer-brand" href="/">PaisaTrace</a><p>Track, plan and review your money.</p></div><div class="site-footer-groups">${footerGroups(email).map(group=>`<nav aria-label="Footer ${group.title}"><h2>${group.title}</h2>${group.links.map(link=>`<a href="${escape(link.href)}">${escape(link.label)}</a>`).join('')}</nav>`).join('')}</div><div class="site-footer-bottom"><span>Personal finance, at your pace.</span><span class="powered-by">Powered by <a href="https://www.hirubix.com/" target="_blank" rel="noopener noreferrer">Rubix Labs</a></span></div></footer>`;
}
