export type ActiveFilter = {key:string;label:string;remove:()=>void};
export default function ActiveFilterChips({filters,clear}:{filters:ActiveFilter[];clear:()=>void}) {
 if(!filters.length)return <p className="log-scope-default">All categories · All currencies</p>;
 return <div className="active-filter-chips" aria-label="Applied entry filters">{filters.map(filter=><button key={filter.key} type="button" className="filter-chip" aria-label={'Remove '+filter.label+' filter'} onClick={filter.remove}><span>{filter.label}</span><span aria-hidden="true">×</span></button>)}<button className="text-button clear-filter-chips" onClick={clear}>Clear entry filters</button></div>;
}
