export const homeDescription: string;
export function replaceRoot(html:string,body:string):string;
export function homepageHtml(html:string,body:string):string;
export function privateShellHtml(html:string):string;
export function readHomeBody(workspace?:string):Promise<string>;

export const landingMetadata:Record<string,{title:string;description:string;path:string}>;
export function landingHtml(html:string,body:string,workspace:string,origin:string,indexable:boolean):string;
