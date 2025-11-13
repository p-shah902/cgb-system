export interface UserDetails {
  id: number,
  email: string,
  password: string | null,
  departmentId: number,
  departmentName: string,
  roleId: number,
  roleName: string,
  phone: string,
  displayName: string,
  isActive: boolean,
  isViewPaper: boolean,
  isEditPaper: boolean,
  isAssignRoles: boolean,
  createdDate: string,
  modifiedDate: string,
  tempRoleId: number,
  isTOPTUser: boolean
}

export interface LoginUser {
  id: number,
  isActive: boolean,
  departmentId: number,
  displayName: string,
  email: string,
  roleId: number
  roleName: string
}

export interface GetUsersListFilter {
  username?: string;
  email?: string;
  roleName?: string;
  departmentName?: string;
}

export interface GetUsersListPaging {
  start: number;
  length: number;
}

export interface GetUsersListRequest {
  filter?: GetUsersListFilter;
  paging?: GetUsersListPaging;
}