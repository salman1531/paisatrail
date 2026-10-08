import type {Kind} from './types';
// One home for each starter spending choice; user-created hierarchies remain editable.
export const starterCategories: {name:string;kind:Kind;essential?:boolean;children:{name:string;emergency?:boolean}[]}[] = [
  {name:'Food',kind:'expense',essential:true,children:[{name:'Groceries'},{name:'Dining'},{name:'Coffee'}]},
  {name:'Home',kind:'expense',essential:true,children:[{name:'Rent'},{name:'Bills'},{name:'Home maintenance'}]},
  {name:'Transport',kind:'expense',essential:true,children:[{name:'Petrol'},{name:'Public transport'},{name:'Travel'}]},
  {name:'Shopping',kind:'expense',children:[{name:'Clothing'},{name:'Personal care'}]},
  {name:'Health',kind:'expense',essential:true,children:[{name:'Healthcare'},{name:'Insurance'},{name:'Fitness'}]},
  {name:'Education',kind:'expense',children:[{name:'Tuition'},{name:'Books & courses'}]},
  {name:'Leisure',kind:'expense',children:[{name:'Entertainment'},{name:'Subscriptions'}]},
  {name:'Family & giving',kind:'expense',children:[{name:'Childcare'},{name:'Pets'},{name:'Gifts & charity'}]},
  {name:'Savings',kind:'saving',children:[{name:'Emergency fund',emergency:true},{name:'Travel savings'},{name:'Home deposit'},{name:'Car savings'},{name:'Education savings'},{name:'Wedding savings'},{name:'Retirement savings'},{name:'Rainy-day savings'}]},
  {name:'Investments',kind:'investment',children:[{name:'Stocks'},{name:'Mutual funds'},{name:'ETFs'},{name:'Bonds'},{name:'Gold'},{name:'Real estate'},{name:'Retirement investments'}]},
  {name:'Salary',kind:'income',children:[]},
  {name:'Business',kind:'income',children:[]},
  {name:'Freelance',kind:'income',children:[]},
  {name:'Gifts',kind:'income',children:[]},
  {name:'Rental income',kind:'income',children:[]},
  {name:'Investment returns',kind:'income',children:[]},
  {name:'Other income',kind:'income',children:[]}
];
