import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd(); const seen=new Set(); const sections=[];
function visit(name,from) {
 let dir=from;let packageDir;
 while(dir!==path.dirname(dir)){const candidate=path.join(dir,'node_modules',name);if(fs.existsSync(path.join(candidate,'package.json'))){packageDir=candidate;break;}dir=path.dirname(dir);}
 if(!packageDir||seen.has(packageDir))return;seen.add(packageDir);
 const meta=JSON.parse(fs.readFileSync(path.join(packageDir,'package.json'),'utf8'));
 const files=fs.readdirSync(packageDir).filter(f=>/^(licen[sc]e|copying|notice)(\.|$)/i.test(f)&&fs.statSync(path.join(packageDir,f)).isFile());
 sections.push(`## ${meta.name} ${meta.version}\n\nDeclared license: ${typeof meta.license==='string'?meta.license:JSON.stringify(meta.license)}\n\n`+files.map(f=>`### ${f}\n\n`+fs.readFileSync(path.join(packageDir,f),'utf8')).join('\n\n'));
 for(const dependency of Object.keys(meta.dependencies??{}))visit(dependency,packageDir);
}
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));for(const dep of Object.keys(pkg.dependencies))visit(dep,root);
fs.writeFileSync('public/third-party-notices.txt','# PaisaTrail third-party notices\n\nThe following notices preserve licenses for installed production dependencies and their dependencies. Some packages may be tree-shaken from the browser bundle. App branding is purpose-drawn; other interface icons use Lucide. Fonts are served by Google Fonts under their own open-source licenses.\n\n'+sections.join('\n\n----------------------------------------\n\n'));
console.log(`Recorded notices for ${seen.size} production packages.`);
