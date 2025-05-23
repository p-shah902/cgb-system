export interface Item {
  id: number;
  itemName: string;
}

export interface DictionaryDetail {
  id: number;
  itemName: string;
  itemValue: string;
  isActive: boolean;
  createdBy: string | null;
  createdDate: string;
  modifiedBy: string | null;
  modifiedDate: string;
}
