import {Component, ViewEncapsulation, type OnInit, ElementRef, ViewChild, inject, forwardRef } from '@angular/core';
import {CommonModule} from '@angular/common';
import {
  loadCKEditorCloud,
  CKEditorModule,
  type CKEditorCloudResult,
  type CKEditorCloudConfig
} from '@ckeditor/ckeditor5-angular';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

import type {
  DecoupledEditor,
  EditorConfig,
} from 'https://cdn.ckeditor.com/typings/ckeditor5.d.ts';
import {environment} from '../../environments/environment';
import {AuthService} from '../../service/auth.service';

const cloudConfig = {
  version: '44.3.0',
  ckbox: {
    version: '2.6.1'
  },
  premium: true
} satisfies CKEditorCloudConfig;

@Component({
  selector: 'app-editor-normal',
  standalone: true,
  imports: [CommonModule, CKEditorModule],
  templateUrl: './editor-normal.component.html',
  styleUrl: './editor-normal.component.scss',
  encapsulation: ViewEncapsulation.None,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => EditorNormalComponent),
      multi: true
    }
  ]
})
export class EditorNormalComponent implements OnInit, ControlValueAccessor  {
  @ViewChild('editorToolbarElement') private editorToolbar!: ElementRef<HTMLDivElement>;
  @ViewChild('editorMenuBarElement') private editorMenuBar!: ElementRef<HTMLDivElement>;
  value: string = '';

  onChange = (_: any) => {};
  onTouched = () => {};
  public Editor: typeof DecoupledEditor | null = null;
  public config: EditorConfig | null = null;
  public authService = inject(AuthService)

  public ngOnInit(): void {
    loadCKEditorCloud(cloudConfig).then(this._setupEditor.bind(this));
  }

  // ControlValueAccessor methods
  writeValue(value: any): void {
    this.value = value || '';
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  onEditorChange({ editor }: any): void {
    const data = editor.getData();
    this.value = data;
    this.onChange(data);
  }

  private _setupEditor(cloud: CKEditorCloudResult<typeof cloudConfig>) {
    const {
      DecoupledEditor,
      Alignment,
      AutoImage,
      AutoLink,
      Autosave,
      BalloonToolbar,
      Bold,
      ImageBlock,
      ImageCaption,
      ImageEditing,
      ImageInline,
      ImageInsert,
      ImageInsertViaUrl,
      ImageResize,
      ImageStyle,
      ImageTextAlternative,
      ImageToolbar,
      ImageUpload,
      ImageUtils,
      Italic,
      Link,
      LinkImage,
      List,
      ListProperties,
      Table,
      TableCaption,
      TableCellProperties,
      TableColumnResize,
      TableProperties,
      TableToolbar,
      Underline,
      Indent,
      IndentBlock,
    } = cloud.CKEditor;

    const {
      TableOfContents,
    } = cloud.CKEditorPremiumFeatures;

    this.Editor = DecoupledEditor;
    this.config = {
      toolbar: {
        items: [
          'bold',
          'italic',
          'underline',
          '|',
          'link',
          'insertImage',
          'insertTable',
          '|',
          'alignment',
          '|',
          'bulletedList',
          'numberedList',
          'outdent',
          'indent'
        ],
        shouldNotGroupWhenFull: false
      },
      plugins: [
        Alignment,
        AutoImage,
        AutoLink,
        Autosave,
        BalloonToolbar,
        Bold,
        ImageBlock,
        ImageCaption,
        ImageEditing,
        ImageInline,
        ImageInsert,
        ImageInsertViaUrl,
        ImageResize,
        ImageStyle,
        ImageTextAlternative,
        ImageToolbar,
        ImageUpload,
        ImageUtils,
        Indent,
        IndentBlock,
        Italic,
        Link,
        LinkImage,
        List,
        ListProperties,
        Table,
        TableCaption,
        TableCellProperties,
        TableColumnResize,
        TableOfContents,
        TableProperties,
        TableToolbar,
        Underline
      ],
      balloonToolbar: ['bold', 'italic', '|', 'link', 'insertImage', '|', 'bulletedList', 'numberedList'],
      initialData: this.value || "",
      licenseKey: environment.ckEditorLicenceKey,
      menuBar: {
        isVisible: false
      }
    };

    configUpdateAlert(this.config);
  }

  public onReady(editor: DecoupledEditor): void {
    Array.from(this.editorToolbar.nativeElement.children).forEach(child => child.remove());
    Array.from(this.editorMenuBar.nativeElement.children).forEach(child => child.remove());

    this.editorToolbar.nativeElement.appendChild(editor.ui.view.toolbar.element!);
    this.editorMenuBar.nativeElement.appendChild(editor.ui.view.menuBarView.element!);
  }
}

/**
 * This function exists to remind you to update the config needed for premium features.
 * The function can be safely removed. Make sure to also remove call to this function when doing so.
 */
function configUpdateAlert(config: any) {
  if ((configUpdateAlert as any).configUpdateAlertShown) {
    return;
  }

  const isModifiedByUser = (currentValue: string | undefined, forbiddenValue: string) => {
    if (currentValue === forbiddenValue) {
      return false;
    }

    if (currentValue === undefined) {
      return false;
    }

    return true;
  };

  const valuesToUpdate = [];

  (configUpdateAlert as any).configUpdateAlertShown = true;

  if (!isModifiedByUser(config.licenseKey, '<YOUR_LICENSE_KEY>')) {
    valuesToUpdate.push('LICENSE_KEY');
  }

  if (valuesToUpdate.length) {
    window.alert(
      [
        'Please update the following values in your editor config',
        'to receive full access to Premium Features:',
        '',
        ...valuesToUpdate.map(value => ` - ${value}`)
      ].join('\n')
    );
  }
}
