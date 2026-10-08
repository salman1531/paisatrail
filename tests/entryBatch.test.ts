import {describe,it,expect,vi} from 'vitest';
import {insertEntriesOnce} from '../src/entryBatch';
import type {Entry} from '../src/types';
const a:Entry={id:'a',user_id:'u',category_id:'e',subcategory_id:null,date:'2026-10-08',amount_minor:100,currency:'PKR',notes:'',withdrawal:false};
const b={...a,id:'b'};
describe('retry-safe entry insertion',()=>{
 it('saves identical purchases as two independent records in one statement',async()=>{const insert=vi.fn().mockResolvedValue(undefined);await insertEntriesOnce([a,b],insert,async()=>[]);expect(insert).toHaveBeenCalledOnce();expect(insert).toHaveBeenCalledWith([a,b]);});
 it('recognizes an exact retry without inserting again',async()=>{const insert=vi.fn();await insertEntriesOnce([a,b],insert,async()=>[a,b]);expect(insert).not.toHaveBeenCalled();});
 it('reconciles a lost response after server commit',async()=>{let saved:Entry[]=[];const insert=vi.fn(async()=>{saved=[a,b];throw new Error('Connection lost');});await expect(insertEntriesOnce([a,b],insert,async()=>saved)).resolves.toBeUndefined();expect(insert).toHaveBeenCalledOnce();});
 it('reports failed atomic writes and allows a retry with the same identities',async()=>{const insert=vi.fn().mockRejectedValueOnce(new Error('Invalid category')).mockResolvedValueOnce(undefined);await expect(insertEntriesOnce([a,b],insert,async()=>[])).rejects.toThrow('Invalid category');await expect(insertEntriesOnce([a,b],insert,async()=>[])).resolves.toBeUndefined();expect(insert).toHaveBeenNthCalledWith(2,[a,b]);});
 it('never treats another payload or partial saved records as an identical retry',async()=>{const insert=vi.fn();await expect(insertEntriesOnce([a,b],insert,async()=>[a])).rejects.toThrow('Refresh Money Log');await expect(insertEntriesOnce([a],insert,async()=>[{...a,amount_minor:999}])).rejects.toThrow('different details');expect(insert).not.toHaveBeenCalled();});
 it('rejects duplicate identities and mixed owners before database operations',async()=>{const insert=vi.fn(),read=vi.fn();await expect(insertEntriesOnce([a,a],insert,read)).rejects.toThrow('unique IDs');await expect(insertEntriesOnce([a,{...b,user_id:'other'}],insert,read)).rejects.toThrow('same account');expect(read).not.toHaveBeenCalled();});
});
