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
  
  export interface ParticularType {
    typeId: number;
    typeName: string;
    particulars: Particular[];
  }

  export interface UpsertUserRolesPaylod{
    roleId: number;
    roleName: string;
    description: string;
    accessId: number[];
    sectionId: number[] | null;
    isReadAccess: boolean;
    isWriteAccess: boolean;
  }

  export interface UserRole{
    id: number;
    name:string;
    description:string;
    createdDate:string;
  }

  export interface UserRoleAccess{
    roleId:number;
    roleName:string;
    typeId: number;
    typeName:string;
    particularsId: number;
    particularsName: string;
    isWriteAccess: boolean;
    isReadAccess: boolean;
      
  }

  export interface AuthResponse{
    token:string;
    userRoleAccesses:UserRoleAccess[];
    success:boolean;
  }

  // export 