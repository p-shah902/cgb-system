import {Component, inject, Renderer2, ViewChild, ElementRef} from '@angular/core';
import {CKEditorModule, loadCKEditorCloud, CKEditorCloudResult} from '@ckeditor/ckeditor5-angular';
import type {ClassicEditor, EditorConfig} from 'https://cdn.ckeditor.com/typings/ckeditor5.d.ts';
import {
    FormBuilder,
    FormArray,
    FormGroup,
    Validators,
    ReactiveFormsModule,
    AbstractControl,
    ValidationErrors, FormsModule
} from '@angular/forms';
import {NgbToastModule} from '@ng-bootstrap/ng-bootstrap';
import {CommonModule} from '@angular/common';
import {environment} from '../../environments/environment';
import {Select2} from 'ng-select2-component';
import {DictionaryService} from '../../service/dictionary.service';
import {Generalervice} from '../../service/general.service';
import {UploadService} from '../../service/document.service';
import {ToastService} from '../../service/toast.service';
import {Router, ActivatedRoute} from '@angular/router';
import {DictionaryDetail} from '../../models/dictionary';
import {UserDetails} from '../../models/user';
import {UserService} from '../../service/user.service';
import {PaperService} from '../../service/paper.service';
import {CountryDetail} from '../../models/general';
import {PaperStatusType} from '../../models/paper';
import {VendorService} from '../../service/vendor.service';
import {VendorDetail} from '../../models/vendor';
import {CURRENCY_LIST} from '../../utils/constant';

@Component({
    selector: 'app-template2',
    standalone: true,
    imports: [CommonModule, CKEditorModule, FormsModule, ReactiveFormsModule, Select2, NgbToastModule],
    templateUrl: './template2.component.html',
    styleUrl: './template2.component.scss'
})
export class Template2Component {
    private readonly userService = inject(UserService);
    private readonly paperService = inject(PaperService);
    private readonly vendorService = inject(VendorService);
    private searchTimeout: any;
    public Editor: typeof ClassicEditor | null = null;
    public config: EditorConfig | null = null;
    @ViewChild('searchInput') searchInput!: ElementRef;
    generalInfoForm!: FormGroup;
    isExpanded: boolean = true; // Default expanded
    paperId: string | null = null;
    isCopy = false;
    submitted = false;
    highlightClass = 'highlight';
    paperStatusId: number | null = null;
    paperDetails: any = null;
    vendorList: VendorDetail[] = []
    userDetails: UserDetails[] = [];
    procurementTagUsers: any[] = [];
    countryDetails: CountryDetail[] = [];
    paperStatusList: PaperStatusType[] = [];

    // Global variables for dropdown selections
    currenciesData: DictionaryDetail[] = [];
    globalCGBData: DictionaryDetail[] = [];
    operatingFunctionsData: DictionaryDetail[] = [];
    proposedCMLData: DictionaryDetail[] = [];
    psaData: DictionaryDetail[] = [];
    remunerationTypeData: DictionaryDetail[] = [];
    sourcingRigorData: DictionaryDetail[] = [];
    sourcingTypeData: DictionaryDetail[] = [];
    subsectorData: DictionaryDetail[] = [];

    public psaJvOptions = [
        {value: 'ACG', label: 'ACG'},
        {value: 'Shah Deniz', label: 'Shah Deniz'},
        {value: 'SCP', label: 'SCP'},
        {value: 'BTC', label: 'BTC'},
        {value: 'Sh-Asiman', label: 'Sh-Asiman'},
        {value: 'BP Group', label: 'BP Group'}
    ];

    constructor(private router: Router, private route: ActivatedRoute, private dictionaryService: DictionaryService,
                private fb: FormBuilder, private countryService: Generalervice, private renderer: Renderer2, private uploadService: UploadService, public toastService: ToastService,
    ) {
    }

    public ngOnInit(): void {
        loadCKEditorCloud({
            version: '44.3.0',
            premium: true
        }).then(this._setupEditor.bind(this));


        this.route.paramMap.subscribe(params => {
            this.paperId = params.get('id');
            if (this.paperId) {
            }
            console.log('Paper ID:', this.paperId);
        });

        this.route.queryParamMap.subscribe(queryParams => {
            this.isCopy = queryParams.get('isCopy') === 'true';
            console.log('Is Copy:', this.isCopy);
        });

        this.loadForm()
        this.loadDictionaryItems()
        this.loadUserDetails()
        this.loadCountry();
        this.loadPaperStatusListData();
        this.loadVendoreDetails()
        this.onLTCCChange()
        this.alignGovChange()
        this.conflictIntrestChanges()
        this.restrospectiveChanges()
        this.addRow()
        this.addBidRow()
        this.addCommericalEvaluationRow()
        this.setupPSAListeners()
        this.setupPSACalculations()
        this.setupMethodologyListeners()


        // Subscribe to changes in originalCurrency or contractValueUsd
        this.generalInfoForm.get('generalInfo.currencyCode')?.valueChanges.subscribe(() => {
            this.updateExchangeRate();
        });

        this.generalInfoForm.get('generalInfo.totalAwardValueUSD')?.valueChanges.subscribe(() => {
            this.updateContractValueOriginalCurrency();
        });

        this.generalInfoForm.get('generalInfo.psajv')?.valueChanges.subscribe(() => {
            this.onSelectChange();
        });
    }

    loadForm() {
        this.generalInfoForm = this.fb.group({
            generalInfo: this.fb.group({
                paperProvision: ['', Validators.required],
                cgbAtmRefNo: ['', Validators.required],
                cgbApprovalDate: [{value: '', disabled: true}],
                isChangeinApproachMarket: [false],
                cgbItemRefNo: [''],
                cgbCirculationDate: [''],
                contractNo: ['', Validators.required],
                contactNo: ['', Validators.required],
                vendorId: [null],
                purposeRequired: ['', Validators.required],
                globalCGB: ['', Validators.required],
                bltMember: [null, [Validators.required, Validators.pattern("^[0-9]+$")]],
                operatingFunction: ['', Validators.required],
                subSector: ['', Validators.required],
                sourcingType: ['', Validators.required],
                camUserId: [null, [Validators.required, Validators.pattern("^[0-9]+$")]],
                vP1UserId: [null, [Validators.required, Validators.pattern("^[0-9]+$")]],
                procurementSPAUsers: [[], Validators.required],
                pdManagerName: [null, Validators.required],
                isPHCA: [false],
                currencyCode: [''],
                totalAwardValueUSD: [0], // Number input
                exchangeRate: [0], // Number input
                contractValue: [0],
                remunerationType: ['', Validators.required],
                isPaymentRequired: [false],
                prePayPercent: [0],
                prePayAmount: [{value: null, disabled: true}],
                workspaceNo: [''],
                isSplitAward: [false],
                psajv: [[], Validators.required],
                isLTCC: [false],
                ltccNotes: [''],
                isGovtReprAligned: [false],
                govtReprAlignedComment: [''],
                contractSpendCommitment: [''],
            }),
            procurementDetails: this.fb.group({
                supplierAwardRecommendations: ['', Validators.required],
                legalEntitiesAwarded: this.fb.array([]),
                isConflictOfInterest: [false],
                conflictOfInterestComment: [''],
                isRetrospectiveApproval: [false],
                retrospectiveApprovalReason: [''],
                nationalContent: [''],
            }),
            ccd: this.fb.group({
                isHighRiskContract: [false],
                cddCompleted: [''],
                highRiskExplanation: [''],
                flagRaisedCDD: [''],
                additionalCDD: [''],

            }),
            evaluationSummary: this.fb.group({
                invitedBidders: [0],
                submittedBids: [0],
                previousContractLearning: [''],
                performanceImprovements: [''],
                benchMarking: [''],
                commericalEvaluation: this.fb.array([]),
                supplierTechnical: this.fb.array([]),
            }),
            additionalDetails: this.fb.group({
                contractualControls: [''],
                contractCurrencyLinktoBaseCost: [false],
                explanationsforBaseCost: [''],
                riskMitigation: this.fb.array([]),
            }),
            valueDelivery: this.fb.group({
                costReductionPercent: [0],
                costReductionValue: [0],
                costReductionRemarks: [''],
                operatingEfficiencyValue: [0],
                operatingEfficiencyPercent: [0],
                operatingEfficiencyRemarks: [''],
                costAvoidanceValue: [0],
                costAvoidancePercent: [0],
                costAvoidanceRemarks: [''],
            }, {validators: this.requireAllIfAny}),
            costAllocation: this.fb.group({
                contractCommittee_SDCC: [{value: false, disabled: true}],
                contractCommittee_SCP_Co_CC: [{value: false, disabled: true}],
                contractCommittee_SCP_Co_CCInfoNote: [{value: false, disabled: true}],
                contractCommittee_BTC_CC: [{value: false, disabled: true}],
                contractCommittee_BTC_CCInfoNote: [{value: false, disabled: true}],
                contractCommittee_CGB: [false], //TODO discuss
                coVenturers_CMC: [{value: false, disabled: true}],
                coVenturers_SDMC: [{value: false, disabled: true}],
                coVenturers_SCP: [{value: false, disabled: true}],
                coVenturers_SCP_Board: [{value: false, disabled: true}],
                steeringCommittee_SC: [{value: false, disabled: true}],
                isACG: [{value: false, disabled: true}],
                isShah: [{value: false, disabled: true}],
                isSCP: [{value: false, disabled: true}],
                isBTC: [{value: false, disabled: true}],
                isAsiman: [{value: false, disabled: true}],
                isBPGroup: [{value: false, disabled: true}],
                // Percentage fields with validation (0-100)
                percentage_isACG: [{value: '', disabled: true}, [Validators.min(0), Validators.max(100)]],
                percentage_isShah: [{value: '', disabled: true}, [Validators.min(0), Validators.max(100)]],
                percentage_isSCP: [{value: '', disabled: true}, [Validators.min(0), Validators.max(100)]],
                percentage_isBTC: [{value: '', disabled: true}, [Validators.min(0), Validators.max(100)]],
                percentage_isAsiman: [{value: '', disabled: true}, [Validators.min(0), Validators.max(100)]],
                percentage_isBPGroup: [{value: '', disabled: true}, [Validators.min(0), Validators.max(100)]],

                value_isACG: [{value: '', disabled: true}],
                value_isShah: [{value: '', disabled: true}],
                value_isSCP: [{value: '', disabled: true}],
                value_isBTC: [{value: '', disabled: true}],
                value_isAsiman: [{value: '', disabled: true}],
                value_isBPGroup: [{value: '', disabled: true}],

                totalPercentage: [{value: 0, disabled: true}, [Validators.min(0), Validators.max(100)]],
                totalValue: [{value: 0, disabled: true}]
            }),
            costSharing: this.fb.group({
                isCapex: [false],
                isFixOpex: [false],
                isVariableOpex: [false],
                isInventoryItems: [false],
                capexMethodology: [{value: '', disabled: true}],
                fixOpexMethodology: [{value: '', disabled: true}],
                variableOpexMethodology: [{value: '', disabled: true}],
                inventoryItemsMethodology: [{value: '', disabled: true}]
            }),
            consultation: this.fb.array([]),

        });

    }

    get generalInfo() {
        return this.generalInfoForm.get('generalInfo');
    }

    get procurementDetailsInfo() {
        return this.generalInfoForm.get('generalInfo');
    }

    private _setupEditor(cloud: CKEditorCloudResult<{ version: '44.3.0', premium: true }>) {
        const {
            ClassicEditor,
            Essentials,
            Paragraph,
            Bold,
            Italic,
            Underline,
            Strikethrough,
            BlockQuote,
            Link
        } = cloud.CKEditor;

        const {FormatPainter} = cloud.CKEditorPremiumFeatures;

        this.Editor = ClassicEditor;
        this.config = {
            licenseKey: environment.ckEditorLicenceKey,
            plugins: [
                Essentials, Paragraph, Bold, Italic, Underline, Strikethrough,
                BlockQuote, Link, FormatPainter
            ],
            toolbar: [
                'undo', 'redo', '|', 'bold', 'italic', 'underline', 'strikethrough', '|',
                'numberedList', 'bulletedList', 'blockquote', 'link', '|', 'formatPainter'
            ],
            fontSize: {
                options: [10, 12, 14, 16, 18, 20, 24, 28, 32, 36],
                supportAllValues: true
            },
            ui: {
                viewportOffset: {top: 50, bottom: 50}  // Adjust editor's viewport
            }
        };
    }

    scrollToSection(event: Event) {
        const selectedValue = (event.target as HTMLSelectElement).value;
        const section = document.getElementById(selectedValue);

        if (section) {
            section.scrollIntoView({behavior: 'smooth', block: 'start'});
        }
    }

    onSearch(target: EventTarget | null) {
        if (!target) return;

        const inputElement = target as HTMLInputElement;
        const searchText = inputElement.value.trim().toLowerCase();

        // Remove old highlights if input is empty
        if (!searchText) {
            document.querySelectorAll(`.${this.highlightClass}`).forEach(el => {
                this.renderer.removeClass(el, this.highlightClass);
            });
            return;
        }

        // Clear previous timeout to debounce
        clearTimeout(this.searchTimeout);

        // Delay search execution
        this.searchTimeout = setTimeout(() => {
            // Remove old highlights
            document.querySelectorAll(`.${this.highlightClass}`).forEach(el => {
                this.renderer.removeClass(el, this.highlightClass);
            });

            // Find label that matches the search text
            const labels = Array.from(document.querySelectorAll('label'));
            const matchingLabel = labels.find(label => label.textContent?.toLowerCase().includes(searchText));

            if (matchingLabel) {
                // Add highlight to the label
                this.renderer.addClass(matchingLabel, this.highlightClass);

                // Scroll into view
                matchingLabel.scrollIntoView({behavior: 'smooth', block: 'center'});
            }
        }, 500); // Adjust delay as needed
    }

    loadDictionaryItems() {
        this.dictionaryService.getDictionaryItemList().subscribe({
            next: (response) => {
                if (response.status && response.data) {
                    const itemData = response.data;
                    if (itemData.length > 0) {
                        itemData.forEach((item) => {
                            this.loadDictionaryDetails(item.itemName);
                        });
                    }
                }
            }, error: (error) => {
                console.log('error', error);
            }
        })
    }

    loadDictionaryDetails(itemName: string) {
        this.dictionaryService.getDictionaryListByItem(itemName).subscribe({
            next: (response) => {
                if (response.status && response.data) {
                    console.log('Dictionary Detail:', response.data);

                    switch (itemName) {
                        case 'Currencies':
                            this.currenciesData = response.data || [];
                            break;

                        case 'Global CGB':
                            this.globalCGBData = response.data || [];
                            break;

                        case 'Operating Functions':
                            this.operatingFunctionsData = response.data || [];
                            break;

                        case 'Proposed CML':
                            this.proposedCMLData = response.data || [];
                            break;

                        case 'PSA':
                            this.psaData = response.data || [];
                            break;

                        case 'Remuneration Type':
                            this.remunerationTypeData = response.data || [];
                            break;

                        case 'Sourcing Rigor':
                            this.sourcingRigorData = response.data || [];
                            break;

                        case 'Sourcing Type':
                            this.sourcingTypeData = response.data || [];
                            break;

                        case 'Subsector':
                            this.subsectorData = response.data || [];
                            break;

                        default:
                            console.log('Unknown item:', itemName);
                            break;
                    }
                }
            },
            error: (error) => {
                console.log('Error:', error);
            }
        });
    }

    loadUserDetails() {
        this.userService.getUserDetailsList().subscribe({
            next: (response) => {
                if (response.status && response.data) {
                    this.userDetails = response.data;
                    this.procurementTagUsers = response.data.filter(user => user.roleName === 'Procurement Tag').map(t => ({
                        label: t.displayName,
                        value: t.id
                    }));

                }
            }, error: (error) => {
                console.log('error', error);
            }
        })
    }

    loadCountry() {
        this.countryService.getCountryDetails().subscribe({
            next: (reponse) => {
                if (reponse.status && reponse.data) {

                    this.countryDetails = reponse.data || [];
                }
            },
            error: (error) => {
                console.log('error', error);
            },
        });
    }

    loadPaperStatusListData() {
        this.paperService.getPaperStatusList().subscribe({
            next: (reponse) => {
                if (reponse.status && reponse.data) {

                    this.paperStatusList = reponse.data || [];
                }
            },
            error: (error) => {
                console.log('error', error);
            },
        });
    }

    loadVendoreDetails() {

        this.vendorService.getVendorDetailsList().subscribe({
            next: (reponse) => {
                if (reponse.status && reponse.data) {
                    this.vendorList = reponse.data;
                    console.log('vendor:', this.vendorList);
                }
            },
            error: (error) => {
                console.log('error', error);
            },
        });
    }

    onSelectChange() {

        const selectedOptions = this.generalInfoForm.get('generalInfo.psajv')?.value || [];

        const costAllocationControl = this.generalInfoForm.get('costAllocation');
        if (costAllocationControl) {
            const mapping: { [key: string]: string } = {
                "ACG": "isACG",
                "Shah Deniz": "isShah",
                "SCP": "isSCP",
                "BTC": "isBTC",
                "Sh-Asiman": "isAsiman",
                "BP Group": "isBPGroup"
            };

            Object.keys(mapping).forEach((key) => {
                const controlName = mapping[key];
                const isSelected = selectedOptions.includes(key);
                costAllocationControl.get(controlName)?.setValue(isSelected);
            });
        }

    }

    setupPSAListeners() {
        const psaControls = [
            {checkbox: 'isACG', percentage: 'percentage_isACG', value: 'value_isACG'},
            {checkbox: 'isShah', percentage: 'percentage_isShah', value: 'value_isShah'},
            {checkbox: 'isSCP', percentage: 'percentage_isSCP', value: 'value_isSCP'},
            {checkbox: 'isBTC', percentage: 'percentage_isBTC', value: 'value_isBTC'},
            {checkbox: 'isAsiman', percentage: 'percentage_isAsiman', value: 'value_isAsiman'},
            {checkbox: 'isBPGroup', percentage: 'percentage_isBPGroup', value: 'value_isBPGroup'}
        ];

        psaControls.forEach(({checkbox, percentage, value}) => {
            this.generalInfoForm.get(`costAllocation.${checkbox}`)?.valueChanges.subscribe((isChecked) => {
                const percentageControl = this.generalInfoForm.get(`costAllocation.${percentage}`);
                const valueControl = this.generalInfoForm.get(`costAllocation.${value}`);

                //checkboxes
                const ACG1 = this.generalInfoForm.get(`costAllocation.coVenturers_CMC`)
                const ACG2 = this.generalInfoForm.get(`costAllocation.steeringCommittee_SC`)

                const SD1 = this.generalInfoForm.get(`costAllocation.contractCommittee_SDCC`)
                const SD2 = this.generalInfoForm.get(`costAllocation.coVenturers_SDMC`)

                const SCP1 = this.generalInfoForm.get(`costAllocation.contractCommittee_SCP_Co_CC`)
                const SCP2 = this.generalInfoForm.get(`costAllocation.contractCommittee_SCP_Co_CCInfoNote`)
                const SCP3 = this.generalInfoForm.get(`costAllocation.coVenturers_SCP`)

                const BTC1 = this.generalInfoForm.get(`costAllocation.contractCommittee_BTC_CC`)
                const BTC2 = this.generalInfoForm.get(`costAllocation.contractCommittee_BTC_CCInfoNote`)
                const BTC3 = this.generalInfoForm.get(`costAllocation.coVenturers_SCP_Board`)


                if (isChecked) {
                    percentageControl?.enable();
                    valueControl?.disable();

                    if (checkbox === "isACG") {
                        ACG1?.enable();
                        ACG2?.enable();
                    } else if (checkbox === "isShah") {
                        SD1?.enable();
                        SD2?.enable();
                    } else if (checkbox === "isSCP") {
                        SCP1?.enable();
                        SCP2?.enable();
                        SCP3?.enable();
                    } else if (checkbox === "isBTC") {
                        BTC1?.enable();
                        BTC2?.enable();
                        BTC3?.enable();
                    }

                } else {
                    percentageControl?.reset();
                    percentageControl?.disable();
                    valueControl?.reset();
                    valueControl?.disable();

                    if (checkbox === "isACG") {
                        ACG1?.disable();
                        ACG1?.reset();
                        ACG2?.disable();
                        ACG2?.reset();
                    } else if (checkbox === "isShah") {
                        SD1?.disable();
                        SD1?.reset();
                        SD2?.disable();
                        SD2?.reset();
                    } else if (checkbox === "isSCP") {
                        SCP1?.enable();
                        SCP2?.enable();
                        SCP3?.enable();
                        SCP1?.reset();
                        SCP2?.reset();
                        SCP3?.reset();
                    } else if (checkbox === "isBTC") {
                        BTC1?.disable();
                        BTC2?.disable();
                        BTC3?.disable();
                        BTC1?.reset();
                        BTC2?.reset();
                        BTC3?.reset();
                    }
                }
            });
        });

        // Listen for changes in percentage and value fields to update total
        psaControls.forEach(({percentage, value}) => {
            this.generalInfoForm.get(`costAllocation.${percentage}`)?.valueChanges.subscribe(() => this.calculateTotal());
            this.generalInfoForm.get(`costAllocation.${value}`)?.valueChanges.subscribe(() => this.calculateTotal());
        });
    }

    setupPSACalculations() {
        const psaControls = [
            {percentage: 'percentage_isACG', value: 'value_isACG'},
            {percentage: 'percentage_isShah', value: 'value_isShah'},
            {percentage: 'percentage_isSCP', value: 'value_isSCP'},
            {percentage: 'percentage_isBTC', value: 'value_isBTC'},
            {percentage: 'percentage_isAsiman', value: 'value_isAsiman'},
            {percentage: 'percentage_isBPGroup', value: 'value_isBPGroup'}
        ];

        psaControls.forEach(({percentage, value}) => {
            this.generalInfoForm.get(`costAllocation.${percentage}`)?.valueChanges.subscribe((percentageValue) => {
                const contractValue = this.generalInfoForm.get('generalInfo.totalAwardValueUSD')?.value || 0;

                if (percentageValue >= 0 && percentageValue <= 100) {
                    const calculatedValue = (percentageValue / 100) * contractValue;
                    this.generalInfoForm.get(`costAllocation.${value}`)?.setValue(calculatedValue, {emitEvent: false});
                  this.calculateTotal()
                }
            });
        });
    }

    calculateTotal() {
        const costAllocation = this.generalInfoForm.get('costAllocation') as FormGroup;

        let totalPercentage = 0;
        let totalValue = 0;

        const percentageFields = ['percentage_isACG', 'percentage_isShah', 'percentage_isSCP', 'percentage_isBTC', 'percentage_isAsiman', 'percentage_isBPGroup'];
        const valueFields = ['value_isACG', 'value_isShah', 'value_isSCP', 'value_isBTC', 'value_isAsiman', 'value_isBPGroup'];

        percentageFields.forEach((field) => {
            const value = costAllocation.get(field)?.value;
            if (!isNaN(value) && value !== null && value !== '') {
                totalPercentage += Number(value);
            }
        });

        valueFields.forEach((field) => {
            const value = costAllocation.get(field)?.value;
            if (!isNaN(value) && value !== null && value !== '') {
                totalValue += Number(value);
            }
        });

        // Update total fields
        costAllocation.get('totalPercentage')?.setValue(totalPercentage, {emitEvent: false});
        costAllocation.get('totalValue')?.setValue(totalValue, {emitEvent: false});
    }

    setupMethodologyListeners() {
        const controls = [
            {checkbox: 'isCapex', methodology: 'capexMethodology'},
            {checkbox: 'isFixOpex', methodology: 'fixOpexMethodology'},
            {checkbox: 'isInventoryItems', methodology: 'inventoryItemsMethodology'},
            {checkbox: 'isVariableOpex', methodology: 'variableOpexMethodology'}
        ];

        controls.forEach(({checkbox, methodology}) => {
            this.generalInfoForm.get(`costSharing.${checkbox}`)?.valueChanges.subscribe((isChecked) => {
                const methodControl = this.generalInfoForm.get(`costSharing.${methodology}`);

                if (isChecked) {
                    methodControl?.enable();
                } else {
                    methodControl?.reset(); // Clears value and sets it to default (empty string in your case)
                    methodControl?.disable();
                }
            });
        });
    }

    requireAllIfAny(group: AbstractControl): ValidationErrors | null {
        const validateGroup = (fields: string[]) => {
            const values = fields.map(field => group.get(field)?.value);
            const hasValue = values.some(val => val);  // If at least one field has a value
            const allFilled = values.every(val => val); // If all fields are filled

            return hasValue && !allFilled ? {requireAllFields: true} : null;
        };

        // Apply validation for each group separately
        const errors = {
            costReduction: validateGroup(['costReductionPercent', 'costReductionValue', 'costReductionRemarks']),
            operatingEfficiency: validateGroup(['operatingEfficiencyPercent', 'operatingEfficiencyValue', 'operatingEfficiencyRemarks']),
            costAvoidance: validateGroup(['costAvoidancePercent', 'costAvoidanceValue', 'costAvoidanceRemarks'])
        };

        return Object.values(errors).some(error => error) ? errors : null;
    }

    updateExchangeRate() {
        const originalCurrency = this.generalInfoForm.get('generalInfo.currencyCode')?.value;
        const currencyItem = this.currenciesData.find((item) => item.id === Number(originalCurrency)) || null
        const currency = CURRENCY_LIST.find(c => c.code === currencyItem?.itemValue);
        const exchangeRate = currency ? currency.rate : 0;

        this.generalInfoForm.get('generalInfo.exchangeRate')?.setValue(exchangeRate);
        this.updateContractValueOriginalCurrency();
    }

    updateContractValueOriginalCurrency() {
        const contractValueUsd = Number(this.generalInfoForm.get('generalInfo.totalAwardValueUSD')?.value) || 0;
        const exchangeRate = Number(this.generalInfoForm.get('generalInfo.exchangeRate')?.value) || 0;

        const convertedValue = contractValueUsd * exchangeRate;
        this.generalInfoForm.get('generalInfo.contractValue')?.setValue(convertedValue);
    }

    alignGovChange() {
        this.generalInfoForm.get('generalInfo.isGovtReprAligned')?.valueChanges.subscribe((value) => {
            if (value === true) {
                this.generalInfoForm.get('generalInfo.govtReprAlignedComment')?.setValidators([Validators.required]);
            } else {
                this.generalInfoForm.get('generalInfo.govtReprAlignedComment')?.clearValidators();
            }
            this.generalInfoForm.get('generalInfo.govtReprAlignedComment')?.updateValueAndValidity(); // Refresh validation
        });
    }


    onLTCCChange() {
        this.generalInfoForm.get('generalInfo.isLTCC')?.valueChanges.subscribe((value) => {
            if (value === true) {
                this.generalInfoForm.get('generalInfo.ltccNotes')?.setValidators([Validators.required]);
            } else {
                this.generalInfoForm.get('generalInfo.ltccNotes')?.clearValidators();
            }
            this.generalInfoForm.get('generalInfo.ltccNotes')?.updateValueAndValidity(); // Refresh validation
        });
    }

    conflictIntrestChanges() {
        this.generalInfoForm.get('generalInfo.isConflictOfInterest')?.valueChanges.subscribe((value) => {
            if (value === true) {
                this.generalInfoForm.get('generalInfo.conflictOfInterestComment')?.setValidators([Validators.required]);
            } else {
                this.generalInfoForm.get('generalInfo.conflictOfInterestComment')?.clearValidators();
            }
            this.generalInfoForm.get('generalInfo.conflictOfInterestComment')?.updateValueAndValidity(); // Refresh validation
        });
    }

    restrospectiveChanges() {
        this.generalInfoForm.get('generalInfo.isRetrospectiveApproval')?.valueChanges.subscribe((value) => {
            if (value === true) {
                this.generalInfoForm.get('generalInfo.retrospectiveApprovalReason')?.setValidators([Validators.required]);
            } else {
                this.generalInfoForm.get('generalInfo.retrospectiveApprovalReason')?.clearValidators();
            }
            this.generalInfoForm.get('generalInfo.retrospectiveApprovalReason')?.updateValueAndValidity(); // Refresh validation
        });
    }

    setPaperStatus(status: string): void {
        if (!this.paperStatusList?.length) return; // Check if list exists & is not empty

        this.paperStatusId = this.paperStatusList.find(item => item.paperStatus === status)?.id ?? null;

    }

    onSubmit() {
        this.submitted = true;
        console.log("==this.generalInfoForm?.value?", this.generalInfoForm)
        if (!this.paperStatusId) {
            this.toastService.show("Paper status id not found", "danger")
            return
        }

        const generalInfoValue = this.generalInfoForm?.value?.generalInfo
        const procurementValue = this.generalInfoForm?.value?.procurementDetails
        const ccdValue = this.generalInfoForm?.value?.ccd
        const additionalDetailsValue = this.generalInfoForm?.value?.additionalDetails
        const evaluationSummaryValue = this.generalInfoForm?.value?.evaluationSummary

        const costSharingValues = this.generalInfoForm?.value?.costSharing
        const valueDeliveryValues = this.generalInfoForm?.value?.valueDelivery
        const costAllocationValues = this.generalInfoForm?.value?.costAllocation
        const consultationsValue = this.generalInfoForm?.value?.consultation

        // Mapping PSAs from the costAllocation object
        const psaMappings = [
            {key: "isACG", name: "ACG"},
            {key: "isShah", name: "Shah Deniz"},
            {key: "isSCP", name: "SCP"},
            {key: "isBTC", name: "BTC"},
            {key: "isAsiman", name: "Sh-Asiman"},
            {key: "isBPGroup", name: "BP Group"}
        ];

        const costAllocationJVApproval = psaMappings
            .map((psa, index) => {
                const percentageKey = `percentage_${psa.key}`;
                const valueKey = `value_${psa.key}`;

                if (costAllocationValues[percentageKey] !== undefined) {
                    return {
                        id: index,
                        psaName: psa.name,
                        psaValue: true,
                        percentage: costAllocationValues[percentageKey] || 0,
                        value: costAllocationValues[valueKey] || 0
                    };
                }
                return null;
            })
            .filter(item => item !== null);

        const params = {
            papers: {
                paperStatusId: this.paperStatusId,
                paperProvision: generalInfoValue?.paperProvision,
                purposeRequired: generalInfoValue?.purposeRequired,
                isActive: true,
                ...(this.paperId && !this.isCopy ? {id: Number(this.paperId)} : {})
            },
            contractAward: {
                ...generalInfoValue, ...ccdValue,
                supplierAwardRecommendations:procurementValue.supplierAwardRecommendations || "",
                isConflictOfInterest: procurementValue.isConflictOfInterest || false,
                conflictOfInterestComment: procurementValue.conflictOfInterestComment || "",
                isRetrospectiveApproval: procurementValue.isRetrospectiveApproval || false,
                retrospectiveApprovalReason: procurementValue.retrospectiveApprovalReason || "",
                nationalContent: procurementValue.nationalContent || "",
                invitedBidders: evaluationSummaryValue?.invitedBidders || 0,
                submittedBids: evaluationSummaryValue?.submittedBids || 0,
                previousContractLearning: evaluationSummaryValue?.previousContractLearning || "",
                performanceImprovements: evaluationSummaryValue?.performanceImprovements || "",
                benchMarking: evaluationSummaryValue?.benchMarking || "",
                contractualControls: additionalDetailsValue?.contractualControls || "",
                contractCurrencyLinktoBaseCost: additionalDetailsValue?.contractCurrencyLinktoBaseCost || false,
                explanationsforBaseCost: additionalDetailsValue?.explanationsforBaseCost || "",
                contractSpendCommitment: "",
                psajv: generalInfoValue?.psajv?.join(',') || "",
                procurementSPAUsers: generalInfoValue?.procurementSPAUsers?.join(',') || "",
            },
            consultations: consultationsValue,
            riskMitigation: additionalDetailsValue.riskMitigation,
            commericalEvaluation: evaluationSummaryValue.commericalEvaluation,
            supplierTechnical: evaluationSummaryValue.supplierTechnical,
            valueDeliveriesCostSharings: {
                costReductionPercent: valueDeliveryValues?.costReductionPercent || 0,
                costReductionValue: valueDeliveryValues?.costReductionValue || 0,
                costReductionRemarks: valueDeliveryValues?.costReductionRemarks || "",
                operatingEfficiencyValue: valueDeliveryValues?.operatingEfficiencyValue || 0,
                operatingEfficiencyPercent: valueDeliveryValues?.operatingEfficiencyPercent || 0,
                operatingEfficiencyRemarks: valueDeliveryValues?.operatingEfficiencyRemarks || "",
                costAvoidanceValue: valueDeliveryValues?.costAvoidanceValue || 0,
                costAvoidancePercent: valueDeliveryValues?.costAvoidancePercent || 0,
                costAvoidanceRemarks: valueDeliveryValues?.costAvoidanceRemarks || "",
                capexMethodology: costSharingValues.capexMethodology || "",
                fixOpexMethodology: costSharingValues.fixOpexMethodology || "",
                variableOpexMethodology: costSharingValues.variableOpexMethodology || "",
                inventoryItemsMethodology: costSharingValues.inventoryItemsMethodology || "",
            },
            costAllocationJVApproval: costAllocationJVApproval,
            jvApproval: {
                // ...costAllocationValues,
                contractCommittee_SDCC: costAllocationValues?.contractCommittee_SDCC || false,
                contractCommittee_SCP_Co_CC: costAllocationValues?.contractCommittee_SCP_Co_CC || false,
                contractCommittee_SCP_Co_CCInfoNote: costAllocationValues?.contractCommittee_SCP_Co_CCInfoNote || false,
                contractCommittee_BTC_CC: costAllocationValues?.contractCommittee_BTC_CC || false,
                contractCommittee_BTC_CCInfoNote: costAllocationValues?.contractCommittee_BTC_CCInfoNote || false,
                contractCommittee_CGB: costAllocationValues?.contractCommittee_CGB || false,
                coVenturers_CMC: costAllocationValues?.coVenturers_CMC || false,
                coVenturers_SDMC: costAllocationValues?.coVenturers_SDMC || false,
                coVenturers_SCP: costAllocationValues?.coVenturers_SCP || false,
                coVenturers_SCP_Board: costAllocationValues?.coVenturers_SCP_Board || false,
                steeringCommittee_SC: costAllocationValues?.steeringCommittee_SC || false,
            },
          legalEntitiesAwarded: procurementValue.legalEntitiesAwarded || []
        }

        console.log("==params", params)

        if (this.generalInfoForm.valid) {
            this.paperService.upsertContractAward(params).subscribe({
                next: (response) => {
                    if (response.status && response.data) {
                        this.generalInfoForm.reset();
                        this.submitted = false;
                        this.toastService.show(response.message || "Added Successfully", 'success');
                        setTimeout(() => {
                            this.router.navigate(['/paperconfiguration']);
                        }, 2000);
                    } else {
                        this.toastService.show(response.message || "Something went wrong.", 'danger');
                    }
                },
                error: (error) => {
                    console.log('Error', error);
                    this.toastService.show("Something went wrong.", 'danger');
                },
            });
        } else {
            console.log("Form is invalid");
        }
    }

    get riskMitigation(): FormArray {
        return this.generalInfoForm.get('additionalDetails.riskMitigation') as FormArray;
    }

    // Add a new risk row
    addRow(isFirst = false) {
        if (isFirst && this.paperDetails) {
            const riskMitigationsData = this.paperDetails.riskMitigations || []
            const riskMitigationArray = this.riskMitigation;
            riskMitigationArray.clear(); // Clear existing controls

            // riskMitigationsData?.forEach((item, index) => {
            //   riskMitigationArray.push(
            //     this.fb.group({
            //       srNo: item.srNo || this.generateId(index), // Use API value or generate ID
            //       risks: [item.risks || '', Validators.required],
            //       mitigations: [item.mitigations || '', Validators.required],
            //       id: [item.id]
            //     })
            //   );
            // });
        } else {
            this.riskMitigation.push(
                this.fb.group({
                    srNo: this.generateId(this.riskMitigation.length),
                    risks: ['', Validators.required],
                    mitigations: ['', Validators.required],
                    id: [0]
                })
            );
        }
    }

    // Remove a risk row
    removeRow(index: number) {
        if (this.riskMitigation.length > 1) {
            this.riskMitigation.removeAt(index);
        }
    }

    get commericalEvaluation(): FormArray {
        return this.generalInfoForm.get('evaluationSummary.commericalEvaluation') as FormArray;
    }

    // Add a new risk row
    addCommericalEvaluationRow(isFirst = false) {
        if (isFirst && this.paperDetails) {
            // const riskMitigationsData = this.paperDetails.riskMitigations || []
            // const riskMitigationArray = this.commericalEvaluation;
            // riskMitigationArray.clear(); // Clear existing controls

            // riskMitigationsData?.forEach((item, index) => {
            //   riskMitigationArray.push(
            //     this.fb.group({
            //       srNo: item.srNo || this.generateId(index), // Use API value or generate ID
            //       risks: [item.risks || '', Validators.required],
            //       mitigations: [item.mitigations || '', Validators.required],
            //       id: [item.id]
            //     })
            //   );
            // });
        } else {
            this.commericalEvaluation.push(
                this.fb.group({
                    legalName: ['', Validators.required],
                    totalValue: [null, [Validators.required, Validators.pattern("^[0-9]+$")]],
                    id: [0]
                })
            );
        }
    }

    // Remove a risk row
    removeCommericalEvaluation(index: number) {
        if (this.commericalEvaluation.length > 1) {
            this.commericalEvaluation.removeAt(index);
        }
    }

    get supplierTechnical(): FormArray {
        return this.generalInfoForm.get('evaluationSummary.supplierTechnical') as FormArray;
    }

    // Add a new risk row
    addSupplierTechnicalnRow(isFirst = false) {
        if (isFirst && this.paperDetails) {
            // const riskMitigationsData = this.paperDetails.riskMitigations || []
            // const riskMitigationArray = this.commericalEvaluation;
            // riskMitigationArray.clear(); // Clear existing controls

            // riskMitigationsData?.forEach((item, index) => {
            //   riskMitigationArray.push(
            //     this.fb.group({
            //       srNo: item.srNo || this.generateId(index), // Use API value or generate ID
            //       risks: [item.risks || '', Validators.required],
            //       mitigations: [item.mitigations || '', Validators.required],
            //       id: [item.id]
            //     })
            //   );
            // });
        } else {
            this.supplierTechnical.push(
                this.fb.group({
                    legalName: ['', Validators.required],
                    resultOfHSSE: ['', Validators.required],
                    commentary: [''],
                    thresholdPercent: [null, [Validators.required, Validators.pattern("^[0-9]+$")]],
                    technicalScorePercent: [null, [Validators.required, Validators.pattern("^[0-9]+$")]],
                    isTechnical: [false],
                    id: [0]
                })
            );
        }
    }

    // Remove a risk row
    removeSupplierTechnical(index: number) {
        if (this.supplierTechnical.length > 1) {
            this.supplierTechnical.removeAt(index);
        }
    }

    // Generate ID dynamically (001, 002, etc.)
    generateId(index: number): string {
        return (index + 1).toString().padStart(3, '0');
    }

    get consultationRows(): FormArray {
        return this.generalInfoForm.get('consultation') as FormArray;
    }

    addConsultationRow(isFirst = false) {
        if (isFirst && this.paperDetails) {
            // const riskMitigationsData = this.paperDetails.consultationsDetails || []
            // const riskMitigationArray = this.consultationRows;
            // riskMitigationArray.clear(); // Clear existing controls
            //
            // riskMitigationsData.forEach((item, index) => {
            //   riskMitigationArray.push(
            //     this.fb.group({
            //       psa: [item.psa, Validators.required],
            //       isNoExistingBudget: [item.isNoExistingBudget], // Checkbox
            //       technicalCorrect: [item.technicalCorrectId, Validators.required],
            //       budgetStatement: [item.budgetStatementId, Validators.required],
            //       jvReview: [item.jvReviewId, Validators.required],
            //       id: [item.id]
            //     })
            //   );
            // });
        } else {
            this.consultationRows.push(
                this.fb.group({
                    psa: ['', Validators.required],
                    isNoExistingBudget: [false], // Checkbox
                    technicalCorrect: [null, Validators.required],
                    budgetStatement: [null, Validators.required],
                    jvReview: [null, Validators.required],
                    id: [0]
                })
            );
        }
    }


    // Function to remove a row
    removeConsultationRow(index: number) {
        if (this.consultationRows.length > 1) {
            this.consultationRows.removeAt(index);
        }
    }

    get inviteToBid(): FormArray {
        return this.generalInfoForm.get('procurementDetails.legalEntitiesAwarded') as FormArray;
    }

    addBidRow(isFirst = false) {
        if (isFirst && this.paperDetails) {
            // const riskMitigationsData = this.paperDetails.bidInvites || []
            // const riskMitigationArray = this.inviteToBid;
            // riskMitigationArray.clear(); // Clear existing controls
            //
            // riskMitigationsData.forEach((item, index) => {
            //   riskMitigationArray.push(
            //     this.fb.group({
            //       legalName: [item.legalName, Validators.required],
            //       isLocalOrJV: [item.isLocalOrJV], // Checkbox
            //       countryId: [item.countryId, Validators.required],
            //       parentCompanyName: [item.parentCompanyName],
            //       remarks: [item.remarks],
            //       id: [item.id]
            //     })
            //   );
            // });
        } else {
            this.inviteToBid.push(
                this.fb.group({
                    legalName: ['', Validators.required],
                    isLocalOrJV: [false],
                    contractStartDate: [''],
                    contractEndDate: [''],
                    extensionOption: [''],
                  currencyCode: [''],
                  totalAwardValueUSD: [0],
                  exchangeRate: [0],
                  contractValue: [0],
                    id: [0]
                })
            );
        }
    }


    // Remove an inviteToBid row
    removeBidRow(index: number) {
        if (this.inviteToBid.length > 1) {
            this.inviteToBid.removeAt(index);
        }
    }


    toggleComments() {
        this.isExpanded = !this.isExpanded;
    }

}
