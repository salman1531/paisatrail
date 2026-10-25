// Progressive enhancement for the same native disclosures rendered by PublicNav.
for(const type of ['keydown','pointerdown','click'])document.addEventListener(type,event=>{
 for(const menu of document.querySelectorAll('details[data-dismiss-menu][open]')){
  if(type==='keydown'&&event.key==='Escape'){menu.open=false;menu.querySelector('summary')?.focus();}
  else if(type==='pointerdown'&&!menu.contains(event.target))menu.open=false;
  else if(type==='click'&&event.target.closest('a'))menu.open=false;
 }
});
