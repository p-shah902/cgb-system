import {environment} from '../../environments/environment';

export const baseUri = environment.apiUrl;
export const loginUri = baseUri + '/api/Account';
export const getUserRolesUri = baseUri + '/api/RoleManagement/GetUserRolesList';
export const getUserParticularsListUri = baseUri + '/api/RoleManagement/GetUserParticularsList';
export const getAllRoleAccessListUri = baseUri + '/api/RoleManagement/GetAllRoleAccessList';
// export const UpsertUserRolesUri = baseUri + '/api/RoleManagement/ChangeUserRolewithAccess';
export const UpsertUserRolesUri = baseUri + '/api/RoleManagement/UpdateRoleAccess';
export const CreateUserRolesUri = baseUri + '/api/RoleManagement/CreateRoleswithAccess';
export const getUserListUri = baseUri + '/api/UserMaster/GetUsersList';
export const getVendorListUri = baseUri + '/api/VendorMaster/GetVendorsList';
export const upsertVendorsUri = baseUri + '/api/VendorMaster/UpsertVendors';
export const upsertUserUri = baseUri + '/api/UserMaster/UpsertUser';
export const getDepartmentListUri = baseUri + '/api/GeneralMethod/GetDepartmentList';
export const getDictionaryItemsListUri = baseUri + '/api/GeneralMethod/GetDictionaryItemsList';
export const getDictionaryListByItemNameUri = baseUri + '/api/GeneralMethod/GetDictionaryListByItemName';
export const upsertDictionariesUri = baseUri + '/api/GeneralMethod/UpsertDictionaries';
export const getCountryListUri = baseUri + '/api/GeneralMethod/GetCountryList';
export const getPaperConfigurationsList = baseUri + '/api/PaperConfiguration/GetPaperConfigurationsList';
export const uploadDoc = baseUri + '/api/PaperConfiguration/UploadDoc';
export const UpsertApproachToMarkets = baseUri + '/api/PaperConfiguration/UpsertApproachToMarkets';
export const upsertContractAward = baseUri + '/api/PaperConfiguration/UpsertContractAward';
export const getVendorDetailsByIdUri = baseUri + '/api/VendorMaster/GetVendorDetailsById';
export const getUserDetailsByIdUri = baseUri + '/api/UserMaster/GetUserDetailsById';
export const getPaperDetails = baseUri + '/api/PaperConfiguration/GetPaperDetailsById';
export const getPaperStatus = baseUri + '/api/PaperConfiguration/GetPaperStausList';
export const approveRejectPaper = baseUri + '/api/PaperConfiguration/ChangePaperApprovalStatus';
export const addPaperVisitorLogs = baseUri + '/api/GeneralMethod/VisitorLogs';
export const getPaperVisitorLogs = baseUri + '/api/GeneralMethod/GetVisitorLogsById';
export const multipleStatuUpdate = baseUri + '/api/Approval/ChangeMultiplePaperStatuses';
export const getPaperPreviewById = baseUri + '/api/PaperConfiguration/GetPaperPreviewById';
export const initiateCgbCycle = baseUri + '/api/Voting/InitiateCGBVotingCycle';
export const getCkEditorToken = baseUri + '/api/UserMaster/GetCKEditorToken';
export const getCurrentCgbCycle = baseUri + '/api/Voting/GetCGBVotingCycleData';
export const updatePaperVote = baseUri + '/api/Voting/UpdateVote';
export const getPaperInboxOutBox = baseUri + '/api/Paper/GetPaperInOutbox';
