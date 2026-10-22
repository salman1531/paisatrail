/** Put repeated public navigation and footer outside the main landmark. */
export function accessiblePublicHtml(html,{development=false}={}){
 if(!/<body\b/.test(html)||html.includes('class="skip-link"'))return html;
 html=html.replace(/(<body\b[^>]*>)\s*(<main\b[^>]*>)\s*(<nav\b[\s\S]*?<\/nav>)/,'$1$3$2');
 html=html.replace(/(<footer\b[\s\S]*?<\/footer>)\s*<\/main>/,'</main>$1');
 let target='main-content';
 html=html.replace(/<main\b([^>]*)>/,(_tag,attrs)=>{
  const id=attrs.match(/\bid="([^"]+)"/);if(id)target=id[1];else attrs+=' id="main-content"';
  if(!/\btabindex=/.test(attrs))attrs+=' tabindex="-1"';
  return '<main'+attrs+'>';
 });
 html=html.replace(/(<body\b[^>]*>)/,'$1<a class="skip-link" href="#'+target+'">Skip to main content</a>');
 if(development)html=html.replace('</body>','<script type="module" src="/src/a11y/dev-audit.ts"></script></body>');
 return html;
}
