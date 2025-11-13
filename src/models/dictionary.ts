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

export interface GetDictionaryItemsListFilter {
  itemNames?: string;
}

export interface GetDictionaryItemsListPaging {
  start: number;
  length: number;
}

export interface GetDictionaryItemsListRequest {
  filter?: GetDictionaryItemsListFilter;
  paging?: GetDictionaryItemsListPaging;
}