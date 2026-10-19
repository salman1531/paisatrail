/** Opt-in, on-device aggregate diagnostics. No collector, user IDs, amounts or free text. */
export const metricsKey='paisatrace-recording-diagnostics';
const consentKey='paisatrace-recording-diagnostics-enabled';
export type RecordingEvent='started'|'completed'|'failed'|'validation_failed'|'corrected'|'goal_linked'|'receipt_matched';
const events:RecordingEvent[]=['started','completed','failed','validation_failed','corrected','goal_linked','receipt_matched'];
export type RecordingMetrics={counts:Partial<Record<RecordingEvent,number>>;completionBuckets:Record<string,number>};
export function enabledMetrics(){try{return localStorage.getItem(consentKey)==='true';}catch{return false;}}
export function readRecordingMetrics():RecordingMetrics{try{const data=JSON.parse(localStorage.getItem(metricsKey)??'{}');return{counts:Object.fromEntries(events.map(key=>[key,Number.isSafeInteger(data.counts?.[key])&&data.counts[key]>=0?data.counts[key]:0])),completionBuckets:Object.fromEntries(['under10s','10to30s','over30s'].map(key=>[key,Number.isSafeInteger(data.completionBuckets?.[key])&&data.completionBuckets[key]>=0?data.completionBuckets[key]:0]))};}catch{return{counts:{},completionBuckets:{}};}}
export function enableRecordingMetrics(enabled:boolean){try{localStorage.setItem(consentKey,String(enabled));if(!enabled)localStorage.removeItem(metricsKey);}catch{/* Diagnostics must never interrupt recording. */}}
export function recordingMetric(event:RecordingEvent,elapsedMs?:number){if(!enabledMetrics()||!events.includes(event))return;try{const next=readRecordingMetrics();next.counts[event]=(next.counts[event]??0)+1;if(event==='completed'&&typeof elapsedMs==='number'&&elapsedMs>=0&&Number.isFinite(elapsedMs)){const key=elapsedMs<10000?'under10s':elapsedMs<=30000?'10to30s':'over30s';next.completionBuckets[key]=(next.completionBuckets[key]??0)+1;}localStorage.setItem(metricsKey,JSON.stringify(next));}catch{/* Optional, no effect on financial writes. */}}
