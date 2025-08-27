import {environment} from '../../environments/environment';

export const baseUri = environment.apiUrl;
// ACCOUNTS API
export const loginUri = baseUri + '/Account/Login';
export const verifyTotp = baseUri + '/Account/verify-TOTP';
export const changePassword = baseUri + '/Account/ChangePassword';

// APPROVAL API
export const multipleStatuUpdate = baseUri + '/Approval/ChangeMultiplePaperStatuses';

// Country API
export const getCountryListUri = baseUri + '/Country/GetCountryList';
export const addCountryListUri = baseUri + '/Country/UpsertCountry';

// Department API
export const getDepartmentListUri = baseUri + '/Department/GetDepartmentList';
export const addDepartmentUri = baseUri + '/Department/UpsertDepartment';

// Dictionaries API
export const getDictionaryItemsListUri = baseUri + '/Dictionaries/GetDictionaryItemsList';
export const getDictionaryListByItemNameUri = baseUri + '/Dictionaries/GetDictionaryListByItemName';
export const upsertDictionariesUri = baseUri + '/Dictionaries/UpsertDictionaries';

// DOC PDF
export const generatePdf = baseUri + '/DocPDF/GeneratePdf';

// Paper API
export const getApprovedPapersForMappingUri = baseUri + '/paper/GetApprovedPapersForMapping';
export const getPaperInboxOutBox = baseUri + '/Paper/GetPaperInOutbox';
export const getArchivedPaperListUri=baseUri+'/Paper/GetArchivedPaperList';

// PaperConfiguration API
export const UpsertApproachToMarkets = baseUri + '/PaperConfiguration/UpsertApproachToMarkets';
export const uploadDoc = baseUri + '/PaperConfiguration/UploadDoc';
export const deleteDocUri = baseUri + '/PaperConfiguration/DeleteDoc';
export const getDocItemsListByPaperIdUri = baseUri + '/PaperConfiguration/GetDocItemsListByPaperId';
export const getPapersList = baseUri + '/PaperConfiguration/GetPapersList';
export const upsertContractAward = baseUri + '/PaperConfiguration/UpsertContractAward';
export const upsertVariationPaper = baseUri + '/PaperConfiguration/UpsertVariationPaper';
export const UpsertApprovalOfSales = baseUri + '/PaperConfiguration/UpsertApprovalOfSales';
export const upsertInfoNoteUri = baseUri + '/PaperConfiguration/UpsertInfoNote';
export const paperFilterList = baseUri + '/PaperConfiguration/PaperFilterList';
export const getPSAJVlist = baseUri + '/PaperConfiguration/GetPSAJVlist';
export const getPaperApprovalList = baseUri + '/PaperConfiguration/GetPaperApprovalList';
export const getPaperStatus = baseUri + '/PaperConfiguration/GetPaperStausList';
export const addPaperApprovalList = baseUri + '/PaperConfiguration/UpsertPaperApproval';
export const approveRejectPaper = baseUri + '/PaperConfiguration/ChangePaperApprovalStatus';
export const getPaperConfigurationsList = baseUri + '/PaperConfiguration/GetPaperConfigurationsList';
export const getPaperDetails = baseUri + '/PaperConfiguration/GetPaperDetailsById';
export const getPaperPreviewById = baseUri + '/PaperConfiguration/GetPaperPreviewById';
export const getPaperApproachToMarketByPaperId = baseUri + '/PaperConfiguration/GetPaperApproachToMarketByPaperId';
export const getPaperContractAwardByPaperId = baseUri + '/PaperConfiguration/GetPaperContractAwardByPaperId';
export const getPaperVariationByPaperId = baseUri + '/PaperConfiguration/GetPaperVariationByPaperId';
export const getPaperApprovalOfSalesByPaperId = baseUri + '/PaperConfiguration/GetPaperApprovalOfSalesByPaperId';
export const getPaperInfoNoteByPaperId = baseUri + '/PaperConfiguration/GetPaperInfoNoteByPaperId';
export const getPaperPreviewByApproachToMarketId = baseUri + '/PaperConfiguration/GetPaperPreviewByApproachToMarketId';
export const getPaperPreviewContractAwardByPaperId = baseUri + '/PaperConfiguration/GetPaperPreviewContractAwardByPaperId';
export const getPaperPreviewVariationByPaperId = baseUri + '/PaperConfiguration/GetPaperPreviewVariationByPaperId';
export const getPaperPreviewApprovalOfSalesByPaperId = baseUri + '/PaperConfiguration/GetPaperPreviewApprovalOfSalesByPaperId';
export const getPaperPreviewInfoNoteByPaperId = baseUri + '/PaperConfiguration/GetPaperPreviewInfoNoteByPaperId';

// Role Management
export const getUserRolesUri = baseUri + '/RoleManagement/GetUserRolesList';
export const getUserParticularsListUri = baseUri + '/RoleManagement/GetUserParticularsList';
export const getUserRoleAccessById = baseUri + '/RoleManagement/GetRoleAccessByUserId';
export const getAllRoleAccessListUri = baseUri + '/RoleManagement/GetAllRoleAccessList';
export const addUserRoles = baseUri + '/RoleManagement/UpsertUserRoles';
export const CreateUserRolesUri = baseUri + '/RoleManagement/CreateRolesWithAccess';
export const UpsertUserRolesUri = baseUri + '/RoleManagement/UpdateRoleAccess';

// Threshold
export const GetThresholdList = baseUri + '/Threshold/GetThresholdList';
export const getThresholdByIdUri = baseUri + '/Threshold/GetThresholdById';
export const CreateThresholdUri = baseUri + '/Threshold/AddThreshold';
export const updateThresholdUri = baseUri + '/Threshold/UpdateThreshold';
export const deleteThresholdByIdUri = baseUri + '/Threshold/DeleteThreshold';

// UserMaster
export const getUserListUri = baseUri + '/UserMaster/GetUsersList';
export const getUserDetailsByIdUri = baseUri + '/UserMaster/GetUserDetailsById';
export const getUserListByRoleId = baseUri + '/UserMaster/GetUserListByRoleId';
export const upsertUserUri = baseUri + '/UserMaster/UpsertUser';
export const getCkEditorToken = baseUri + '/UserMaster/GetCKEditorToken';
export const getAllUserPassChange = baseUri + '/UserMaster/AllUserPassChange';

//Vendor Master
export const getVendorListUri = baseUri + '/VendorMaster/GetVendorsList';
export const getVendorDetailsByIdUri = baseUri + '/VendorMaster/GetVendorDetailsById';
export const upsertVendorsUri = baseUri + '/VendorMaster/UpsertVendors';

// Visitor Log
export const addPaperVisitorLogs = baseUri + '/VisitorLogs/VisitorLogs';
export const getPaperVisitorLogs = baseUri + '/VisitorLogs/GetVisitorLogById';

// Voting
export const getCGBVotingCountByPaper = baseUri + '/Voting/GetCGBVotingCountByPaper';
export const getCGBVotingDataByPaper = baseUri + '/Voting/GetCGBVotingDataByPaper';
export const getCurrentCgbCycle = baseUri + '/Voting/GetCGBVotingCycleData';
export const updatePaperVote = baseUri + '/Voting/UpdateVote';
export const initiateCgbCycle = baseUri + '/Voting/InitiateCGBVotingCycle';
