import {Component, ViewEncapsulation,Input, type OnInit, OnChanges, ElementRef, forwardRef, ViewChild, inject} from '@angular/core';
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
  ButtonView as ButtonViewType
} from 'https://cdn.ckeditor.com/typings/ckeditor5.d.ts';
import {environment} from '../../app/core/app-config';
import {AuthService} from '../../service/auth.service';
import {EditorService} from '../../service/editor.service';

const CLOUD_SERVICES_TOKEN_URL = environment.ckeditorTokenUrl
const CLOUD_SERVICES_WEBSOCKET_URL = environment.ckeditorSocketUrl;

const cloudConfig = {
  version: '44.3.0',
  ckbox: {
    version: '2.6.1'
  },
  premium: true
} satisfies CKEditorCloudConfig;

@Component({
  selector: 'app-editor',
  standalone: true,
  imports: [CommonModule, CKEditorModule],
  templateUrl: './editor.component.html',
  styleUrl: './editor.component.scss',
  encapsulation: ViewEncapsulation.None,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => EditorComponent),
      multi: true
    }
  ]
})
export class EditorComponent implements OnInit, OnChanges, ControlValueAccessor {
  @ViewChild('editorToolbarElement') private editorToolbar!: ElementRef<HTMLDivElement>;
  @ViewChild('editorMenuBarElement') private editorMenuBar!: ElementRef<HTMLDivElement>;
  @ViewChild('editorAnnotationsElement') private editorAnnotations!: ElementRef<HTMLDivElement>;
  @ViewChild('editorPresenceElement') private editorPresence!: ElementRef<HTMLDivElement>;
  @ViewChild('editorOutlineElement') private editorOutline!: ElementRef<HTMLDivElement>;
  @ViewChild('editorContainerElement') private editorContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('editorRevisionHistoryElement') private editorRevisionHistory!: ElementRef<HTMLDivElement>;
  @ViewChild('editorRevisionHistoryEditorElement') private editorRevisionHistoryEditor!: ElementRef<HTMLDivElement>;
  @ViewChild('editorRevisionHistorySidebarElement') private editorRevisionHistorySidebar!: ElementRef<HTMLDivElement>;
  @Input() paperId: string  = "";
  @Input() disabled: boolean = false;
  private editorInstance: DecoupledEditor | null = null;

  public Editor: typeof DecoupledEditor | null = null;
  public config: EditorConfig | null = null;
  public authService = inject(AuthService)
  public editorService = inject(EditorService)

  value: string = '';

  onChange = (_: any) => {};
  onTouched = () => {};

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

  // Simple textarea fallback handler
  onEditorTextInput(event: Event): void {
    const val = (event.target as HTMLTextAreaElement)?.value || '';
    this.value = val;
    this.onChange(val);
  }

  private _setupEditor(cloud: CKEditorCloudResult<typeof cloudConfig>) {
    const {
      DecoupledEditor,
      Plugin,
      ButtonView,
      Alignment,
      Autoformat,
      AutoImage,
      AutoLink,
      Autosave,
      BalloonToolbar,
      Bold,
      CloudServices,
      Heading,
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
      Mention,
      RemoveFormat,
      Table,
      TableCaption,
      TableCellProperties,
      TableColumnResize,
      TableProperties,
      TableToolbar,
      Underline
    } = cloud.CKEditor;

    const {
      Comments,
      DocumentOutline,
      ImportWord,
      PresenceList,
      RealTimeCollaborativeComments,
      RealTimeCollaborativeEditing,
      RealTimeCollaborativeRevisionHistory,
      RealTimeCollaborativeTrackChanges,
      RevisionHistory,
      TableOfContents,
      TrackChanges,
      TrackChangesData,
      TrackChangesPreview
    } = cloud.CKEditorPremiumFeatures;

    class AnnotationsSidebarToggler extends Plugin {
      public declare toggleButton: ButtonViewType;

      static get requires() {
        return ['AnnotationsUIs'];
      }

      static get pluginName() {
        return 'AnnotationsSidebarToggler';
      }

      init() {
        this.toggleButton = new ButtonView(this.editor.locale);

        const NON_COLLAPSE_ANNOTATION_ICON =
          '<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" transform="matrix(-1,0,0,1,0,0)"><path d="M11.463 5.187a.888.888 0 1 1 1.254 1.255L9.16 10l3.557 3.557a.888.888 0 1 1-1.254 1.255L7.26 10.61a.888.888 0 0 1 .16-1.382l4.043-4.042z"></path></svg>';
        const COLLAPSE_ANNOTATION_ICON =
          '<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" transform="matrix(1,0,0,1,0,0)"><path d="M11.463 5.187a.888.888 0 1 1 1.254 1.255L9.16 10l3.557 3.557a.888.888 0 1 1-1.254 1.255L7.26 10.61a.888.888 0 0 1 .16-1.382l4.043-4.042z"/></svg>';

        const annotationsUIsPlugin = this.editor.plugins.get('AnnotationsUIs');
        const annotationsContainer = this.editor.config.get('sidebar.container')!;
        const sidebarContainer = annotationsContainer.parentElement!;

        this.toggleButton.set({
          label: 'Toggle annotations sidebar',
          tooltip: 'Hide annotations sidebar',
          tooltipPosition: 'se',
          icon: COLLAPSE_ANNOTATION_ICON
        });

        this.toggleButton.on('execute', () => {
          // Toggle a CSS class on the annotations sidebar container to manage the visibility of the sidebar.
          annotationsContainer.classList.toggle('ck-hidden');

          // Change the look of the button to reflect the state of the annotations container.
          if (annotationsContainer.classList.contains('ck-hidden')) {
            this.toggleButton.icon = NON_COLLAPSE_ANNOTATION_ICON;
            this.toggleButton.tooltip = 'Show annotations sidebar';
            annotationsUIsPlugin.switchTo('inline');
          } else {
            this.toggleButton.icon = COLLAPSE_ANNOTATION_ICON;
            this.toggleButton.tooltip = 'Hide annotations sidebar';
            annotationsUIsPlugin.switchTo('wideSidebar');
          }

          // Keep the focus in the editor whenever the button is clicked.
          this.editor.editing.view.focus();
        });

        this.toggleButton.render();

        sidebarContainer.insertBefore(this.toggleButton.element!, annotationsContainer);
      }

      override destroy() {
        this.toggleButton.element!.remove();

        return super.destroy();
      }
    }

    class DocumentOutlineToggler extends Plugin {
      public declare toggleButton: ButtonViewType;

      static get pluginName() {
        return 'DocumentOutlineToggler';
      }

      init() {
        this.toggleButton = new ButtonView(this.editor.locale);

        const DOCUMENT_OUTLINE_ICON =
          '<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M5 9.5a.5.5 0 0 0 .5-.5v-.5A.5.5 0 0 0 5 8H3.5a.5.5 0 0 0-.5.5V9a.5.5 0 0 0 .5.5H5Z"/><path d="M5.5 12a.5.5 0 0 1-.5.5H3.5A.5.5 0 0 1 3 12v-.5a.5.5 0 0 1 .5-.5H5a.5.5 0 0 1 .5.5v.5Z"/><path d="M5 6.5a.5.5 0 0 0 .5-.5v-.5A.5.5 0 0 0 5 5H3.5a.5.5 0 0 0-.5.5V6a.5.5 0 0 0 .5.5H5Z"/><path clip-rule="evenodd" d="M2 19a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H2Zm6-1.5h10a.5.5 0 0 0 .5-.5V3a.5.5 0 0 0-.5-.5H8v15Zm-1.5-15H2a.5.5 0 0 0-.5.5v14a.5.5 0 0 0 .5.5h4.5v-15Z"/></svg>';
        const COLLAPSE_OUTLINE_ICON =
          '<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M11.463 5.187a.888.888 0 1 1 1.254 1.255L9.16 10l3.557 3.557a.888.888 0 1 1-1.254 1.255L7.26 10.61a.888.888 0 0 1 .16-1.382l4.043-4.042z"/></svg>';

        const documentOutlineContainer = this.editor.config.get('documentOutline.container')!;
        const sidebarContainer = documentOutlineContainer.parentElement!;

        this.toggleButton.set({
          label: 'Toggle document outline',
          tooltip: 'Hide document outline',
          tooltipPosition: 'se',
          icon: COLLAPSE_OUTLINE_ICON
        });

        this.toggleButton.on('execute', () => {
          // Toggle a CSS class on the document outline container to manage the visibility of the outline.
          documentOutlineContainer.classList.toggle('ck-hidden');

          // Change the look of the button to reflect the state of the document outline feature.
          if (documentOutlineContainer.classList.contains('ck-hidden')) {
            this.toggleButton.icon = DOCUMENT_OUTLINE_ICON;
            this.toggleButton.tooltip = 'Show document outline';
          } else {
            this.toggleButton.icon = COLLAPSE_OUTLINE_ICON;
            this.toggleButton.tooltip = 'Hide document outline';
          }

          // Keep the focus in the editor whenever the button is clicked.
          this.editor.editing.view.focus();
        });

        this.toggleButton.render();

        sidebarContainer.insertBefore(this.toggleButton.element!, documentOutlineContainer);
      }

      override destroy() {
        this.toggleButton.element!.remove();

        return super.destroy();
      }
    }

    this.Editor = DecoupledEditor;
    this.config = {
      toolbar: {
        items: [
          'trackChanges',
          'comment',
          '|',
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
        CloudServices,
        Comments,
        DocumentOutline,
        Heading,
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
        ImportWord,
        Indent,
        IndentBlock,
        Italic,
        Link,
        LinkImage,
        List,
        ListProperties,
        Mention,
        PresenceList,
        RealTimeCollaborativeComments,
        RealTimeCollaborativeEditing,
        RealTimeCollaborativeRevisionHistory,
        RealTimeCollaborativeTrackChanges,
        RemoveFormat,
        RevisionHistory,
        Table,
        TableCaption,
        TableCellProperties,
        TableColumnResize,
        TableOfContents,
        TableProperties,
        TableToolbar,
        TrackChanges,
        TrackChangesData,
        TrackChangesPreview,
        Underline
      ],
      extraPlugins: [DocumentOutlineToggler, AnnotationsSidebarToggler],
      balloonToolbar: ['comment', '|', 'bold', 'italic', '|', 'link', 'insertImage', '|', 'bulletedList', 'numberedList'],
      cloudServices: {
        tokenUrl: () => {
          return new Promise((resolve, reject) => {
            this.editorService.isTokenSubject$.subscribe(value => {
              return resolve(value);
            })
          })
        },
        // tokenUrl: CLOUD_SERVICES_TOKEN_URL + `&user.name=${this.authService.getUser()?.displayName}&user.email=${this.authService.getUser()?.email}&sub=${this.authService.getUser()?.id}`,
        webSocketUrl: CLOUD_SERVICES_WEBSOCKET_URL
      },
      collaboration: {
        channelId: this.paperId || ""
      },
      users: {
        getInitialsCallback: (name: string) => {
          // Compute initials from the user's name.
          const names = name.split(' ');
          return names.length > 1
            ? names[0].charAt(0) + names[1].charAt(0)
            : name.charAt(0);
        }
      },
      comments: {
        editorConfig: {
          extraPlugins: [Autoformat, Bold, Italic, List, Mention],
          mention: {
            feeds: [
              {
                marker: '@',
                feed: [
                  /* See: https://ckeditor.com/docs/ckeditor5/latest/features/mentions.html#comments-with-mentions */
                ]
              }
            ]
          }
        }
      },
      documentOutline: {
        container: this.editorOutline.nativeElement
      },
      image: {
        toolbar: [
          'toggleImageCaption',
          'imageTextAlternative',
          '|',
          'imageStyle:inline',
          'imageStyle:wrapText',
          'imageStyle:breakText',
          '|',
          'resizeImage',
          '|',
          'ckboxImageEdit'
        ]
      },
      initialData: this.value || '',
      licenseKey: environment.ckEditorLicenceKey,
      link: {
        addTargetToExternalLinks: true,
        defaultProtocol: 'https://',
        decorators: {
          toggleDownloadable: {
            mode: 'manual',
            label: 'Downloadable',
            attributes: {
              download: 'file'
            }
          }
        }
      },
      list: {
        properties: {
          styles: true,
          startIndex: true,
          reversed: true
        }
      },
      mention: {
        feeds: [
          {
            marker: '@',
            feed: [
              /* See: https://ckeditor.com/docs/ckeditor5/latest/features/mentions.html */
            ]
          }
        ]
      },
      menuBar: {
        isVisible: false
      },
      placeholder: 'Type or paste your content here!',
      presenceList: {
        container: this.editorPresence.nativeElement
      },
      revisionHistory: {
        editorContainer: this.editorContainer.nativeElement,
        viewerContainer: this.editorRevisionHistory.nativeElement,
        viewerEditorElement: this.editorRevisionHistoryEditor.nativeElement,
        viewerSidebarContainer: this.editorRevisionHistorySidebar.nativeElement,
        resumeUnsavedRevision: true
      },
      sidebar: {
        container: this.editorAnnotations.nativeElement
      },
      table: {
        contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells', 'tableProperties', 'tableCellProperties']
      },
      autosave: {
        save: editor => {
          console.log('======', editor);
          return new Promise((resolve, reject) => resolve(1));
        },
        waitingTime: 2000
      }
    };

    configUpdateAlert(this.config);
  }

  public onReady(editor: DecoupledEditor): void {
    this.editorInstance = editor;
    Array.from(this.editorToolbar.nativeElement.children).forEach(child => child.remove());
    Array.from(this.editorMenuBar.nativeElement.children).forEach(child => child.remove());

    editor.execute('trackChanges');

    this.editorToolbar.nativeElement.appendChild(editor.ui.view.toolbar.element!);
    this.editorMenuBar.nativeElement.appendChild(editor.ui.view.menuBarView.element!);
    
    // Set initial read-only state
    if (this.disabled) {
      editor.enableReadOnlyMode('restricted-editing');
    }
  }

  ngOnChanges(): void {
    // Update editor read-only state when disabled input changes
    if (this.editorInstance) {
      if (this.disabled) {
        this.editorInstance.enableReadOnlyMode('restricted-editing');
      } else {
        this.editorInstance.disableReadOnlyMode('restricted-editing');
      }
    }
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

  if (!isModifiedByUser(config.cloudServices?.tokenUrl, '<YOUR_CLOUD_SERVICES_TOKEN_URL>')) {
    valuesToUpdate.push('CLOUD_SERVICES_TOKEN_URL');
  }

  if (!isModifiedByUser(config.cloudServices?.webSocketUrl, '<YOUR_CLOUD_SERVICES_WEBSOCKET_URL>')) {
    valuesToUpdate.push('CLOUD_SERVICES_WEBSOCKET_URL');
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
