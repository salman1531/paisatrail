/** Shared monogram asset, also used as the browser icon. */
export default function BrandMark({size=32}:{size?:number}) {
 return <img className="brand-icon" src="/favicon.svg" width={size} height={size} alt="" aria-hidden="true" draggable={false}/>;
}
