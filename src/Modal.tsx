import { useEffect, useRef, useId, type ReactNode } from 'react';
import { X } from 'lucide-react';

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
    const viewport=window.visualViewport;
    const fitKeyboard=()=>{if(className==='entry-dialog'&&window.innerWidth<=700){const height=viewport?.height??window.innerHeight;dialog.style.maxHeight=`${Math.max(180,height-24)}px`;dialog.style.top=`${viewport?.offsetTop??0}px`;dialog.style.bottom='auto';dialog.style.margin='12px auto';}else if(className==='entry-dialog'){dialog.style.maxHeight='';dialog.style.top='';dialog.style.bottom='';dialog.style.margin='';}};
    fitKeyboard();viewport?.addEventListener('resize',fitKeyboard);viewport?.addEventListener('scroll',fitKeyboard);window.addEventListener('resize',fitKeyboard);
    return () => {
      viewport?.removeEventListener('resize',fitKeyboard);viewport?.removeEventListener('scroll',fitKeyboard);window.removeEventListener('resize',fitKeyboard);
      dialog.close();
      Object.assign(body.style, saved);
      old?.focus({ preventScroll: true });
      window.scrollTo({ left: x, top: y, behavior: 'instant' });
    };
  }, []);
  return <dialog className={[wide?'wide-dialog':'',className].filter(Boolean).join(' ')} ref={ref} onCancel={e => { e.preventDefault(); close(); }} onClick={e => { if (e.target === e.currentTarget) close(); }} aria-labelledby={titleId}><div className="modal-content"><div className="modal-head"><h2 id={titleId}>{title}</h2><button className="icon-button" onClick={close} aria-label="Close dialog"><X size={20}/></button></div>{children}</div></dialog>;
}
