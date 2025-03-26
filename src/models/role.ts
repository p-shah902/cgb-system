export interface ApiResponse<T> {
  message: string;
  errorMessages: any;
  exception: any;
  data: T;
  status: boolean;
}

export interface Particular {
  particularsId: number;
  particularsName: string;
  description: string;
}

export interface UserRoleAccesses {
  particularId: number;
  particularsName: string;
  accessName: string,
  accessId: number,
  usersAceess: UserAccess[]
}

export interface UserAccess {
  id: number,
  particularId: number,
  roleId: number,
  description: string,
  isReadAccess: boolean,
  isWriteAccess: boolean
}

export interface ParticularType {
  typeId: number;
  typeName: string;
  particulars: Particular[];
}

export interface UpsertUserRolesPaylod {
  roleId: number;
  roleName: string;
  description: string;
  accessId: number[];
  sectionId: number[] | null;
  isReadAccess: boolean;
  isWriteAccess: boolean;
}

export interface UserRole {
  id: number;
  name: string;
  description: string;
  createdDate: string;
}

export interface UserRoleAccess {
  roleId: number;
  roleName: string;
  typeId: number;
  typeName: string;
  particularsId: number;
  particularsName: string;
  isWriteAccess: boolean;
  isReadAccess: boolean;

}

export interface AuthResponse {
  message: string,
  data: any,
  status: boolean;
}

// export
