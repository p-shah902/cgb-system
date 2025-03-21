import { Component, inject } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DummyCompComponent } from '../dummy-comp/dummy-comp.component';
import { CKEditorModule, loadCKEditorCloud, CKEditorCloudResult } from '@ckeditor/ckeditor5-angular';
import type { ClassicEditor, EditorConfig } from 'https://cdn.ckeditor.com/typings/ckeditor5.d.ts';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
@Component({
  selector: 'app-template1',
  standalone: true,
  imports: [CommonModule, CKEditorModule, FormsModule, ReactiveFormsModule],
  templateUrl: './template1.component.html',
  styleUrls: ['./template1.component.scss'],
})
export class Template1Component {
  generalInfoForm!: FormGroup;
  constructor(private fb: FormBuilder) { }

  public Editor: typeof ClassicEditor | null = null;
  public config: EditorConfig | null = null;

  public ngOnInit(): void {
    loadCKEditorCloud({
      version: '44.3.0',
      premium: true
    }).then(this._setupEditor.bind(this));

    this.generalInfoForm = this.fb.group({
      provisionOf: ['', Validators.required],
      cgbItemRef: [{ value: '', disabled: true }],
      cgbCirculationDate: [{ value: '', disabled: true }],
      whyIsThisWorkRequired: ['', Validators.required],
      scopeOfWork: [''],
      globalCgb: ['', Validators.required],
      bltMember: ['', Validators.required],
      operatingFunction: ['', Validators.required],
      subsector: ['', Validators.required],
      sourcingType: ['', Validators.required],
      contractAccountableManager: [{ value: '', disabled: true }],
      vp1: ['', Validators.required],
      procurementSpa: ['', Validators.required],
      pdm: ['', Validators.required],
      contractValueUsd: ['', Validators.required],
      originalCurrency: [''],
      exchangeRate: [{ value: '', disabled: true }],
      contractValueOriginalCurrency: [{ value: '', disabled: true }],
      contractStartDate: ['', Validators.required],
      contractEndDate: ['', Validators.required],
      phca: [''],
      psaJv: [''],
      ltcc: [''],
      ltccNote: [''],
      alignedWithGovernmentRep: ['', Validators.required],
      governmentRepComment: [''],
      conflictOfInterest: ['', Validators.required],
      conflictOfInterestComments: [''],
      nationalContent: ['']
    });
  }
  onSubmit(): void {
    if (this.generalInfoForm.valid) {
      console.log(this.generalInfoForm.value);
    } else {
      console.log("Form is invalid");
    }
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


    this.Editor = ClassicEditor;
    this.config = {
      licenseKey: 'eyJhbGciOiJFUzI1NiJ9.eyJleHAiOjE3NzMwMTQzOTksImp0aSI6IjQyYjY3MzM5LTliZWMtNDM4Yi1iNDI1LTBkMjQwMTA5NGVmYSIsImxpY2Vuc2VkSG9zdHMiOlsiMTI3LjAuMC4xIiwibG9jYWxob3N0IiwiMTkyLjE2OC4qLioiLCIxMC4qLiouKiIsIjE3Mi4qLiouKiIsIioudGVzdCIsIioubG9jYWxob3N0IiwiKi5sb2NhbCJdLCJ1c2FnZUVuZHBvaW50IjoiaHR0cHM6Ly9wcm94eS1ldmVudC5ja2VkaXRvci5jb20iLCJkaXN0cmlidXRpb25DaGFubmVsIjpbImNsb3VkIiwiZHJ1cGFsIl0sImxpY2Vuc2VUeXBlIjoiZGV2ZWxvcG1lbnQiLCJmZWF0dXJlcyI6WyJEUlVQIl0sInZjIjoiNzUzNGFkZTYifQ.ptjYqAzuyzYYdfXiEUfb2mQrv7-3XqE05iiZULTOdDBOVgDmYdcViq1PnQr8S4phuDtWIaUe8mukF_hb_OsGnA', // Replace with your CKEditor license key
      plugins: [
        Essentials, Paragraph, Bold, Italic, Underline, Strikethrough,
        BlockQuote, Link
      ],
      toolbar: [
        'undo', 'redo', '|', 'bold', 'italic', 'underline', 'strikethrough', '|',
        'numberedList', 'bulletedList', 'blockquote', 'link', '|'
      ],
      fontSize: {
        options: [10, 12, 14, 16, 18, 20, 24, 28, 32, 36],
        supportAllValues: true
      },
      ui: {
        viewportOffset: { top: 50, bottom: 50 }  // Adjust editor's viewport
      }
    };
  }

  private readonly _mdlSvc = inject(NgbModal);


  isExpanded: boolean = true; // Default expanded

  toggleComments() {
    this.isExpanded = !this.isExpanded;
  }


  openModal() {
    const modalRef = this._mdlSvc.open(DummyCompComponent);
    modalRef.result.then((result) => {
      if (result) {
        console.log(result);
      }
    });
  }
}
