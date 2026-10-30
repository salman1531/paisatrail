import { useEffect, useRef, useId, createContext, useContext, type ReactNode } from 'react';
import { X } from 'lucide-react';

const DialogCloseContext=createContext<()=>void>(()=>{});
export const useDialogClose=()=>useContext(DialogCloseContext);
export default function Modal({ title, children, close, wide = false, className = '' }: { className?:string; wide?: boolean; title: string; children: ReactNode; close: () => void }) {
  const titleId=useId();
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const old = document.activeElement as HTMLElement | null;
    const dialog = ref.current!;
    const x = window.scrollX, y = window.scrollY;
    const body = document.body;
    const saved = { position: body.style.position, top: body.style.top, left: body.style.left, width: body.style.width, overflow: body.style.overflow };
    Object.assign(body.style, { position: 'fixed', top: `-${y}px`, left: `-${x}px`, width: '100%', overflow: 'hidden' });
    dialog.showModal();
    dialog.querySelector<HTMLElement>('[data-autofocus]')?.focus();
    const viewport=window.visualViewport;
    const fitKeyboard=()=>{if(window.innerWidth<=800&&!className.includes('workspace-more-sheet')){const height=viewport?.height??window.innerHeight;dialog.style.setProperty('--dialog-viewport',height+'px');dialog.style.setProperty('--dialog-offset',(viewport?.offsetTop??0)+'px');dialog.style.maxHeight=`${Math.max(180,height-24)}px`;dialog.style.top=`${viewport?.offsetTop??0}px`;dialog.style.bottom='auto';dialog.style.margin='12px auto';}else{dialog.style.maxHeight='';dialog.style.top='';dialog.style.bottom='';dialog.style.margin='';}};
    fitKeyboard();viewport?.addEventListener('resize',fitKeyboard);viewport?.addEventListener('scroll',fitKeyboard);window.addEventListener('resize',fitKeyboard);
    return () => {
      viewport?.removeEventListener('resize',fitKeyboard);viewport?.removeEventListener('scroll',fitKeyboard);window.removeEventListener('resize',fitKeyboard);
      dialog.close();
      Object.assign(body.style, saved);
      old?.focus({ preventScroll: true });
      window.scrollTo({ left: x, top: y, behavior: 'instant' });
    };
  }, []);
  return <dialog className={['workspace-dialog',wide?'wide-dialog':'',className].filter(Boolean).join(' ')} ref={ref} onCancel={e => { e.preventDefault(); close(); }} onClick={e => { if (e.target === e.currentTarget) close(); }} aria-labelledby={titleId}><DialogCloseContext.Provider value={close}><div className="modal-content"><div className="modal-head"><h2 id={titleId}>{title}</h2><button className="icon-button" onClick={close} aria-label="Close dialog"><X size={20}/></button></div>{children}</div></DialogCloseContext.Provider></dialog>;
}
