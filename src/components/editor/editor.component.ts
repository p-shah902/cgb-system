import {Component, ViewEncapsulation, type OnInit, ElementRef, ViewChild, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {
  loadCKEditorCloud,
  CKEditorModule,
  type CKEditorCloudResult,
  type CKEditorCloudConfig
} from '@ckeditor/ckeditor5-angular';

import type {
  DecoupledEditor,
  EditorConfig,
  ButtonView as ButtonViewType
} from 'https://cdn.ckeditor.com/typings/ckeditor5.d.ts';
import {environment} from '../../environments/environment';
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
  encapsulation: ViewEncapsulation.None
})
export class EditorComponent implements OnInit {
  @ViewChild('editorToolbarElement') private editorToolbar!: ElementRef<HTMLDivElement>;
  @ViewChild('editorMenuBarElement') private editorMenuBar!: ElementRef<HTMLDivElement>;
  @ViewChild('editorAnnotationsElement') private editorAnnotations!: ElementRef<HTMLDivElement>;
  @ViewChild('editorPresenceElement') private editorPresence!: ElementRef<HTMLDivElement>;
  @ViewChild('editorOutlineElement') private editorOutline!: ElementRef<HTMLDivElement>;
  @ViewChild('editorContainerElement') private editorContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('editorRevisionHistoryElement') private editorRevisionHistory!: ElementRef<HTMLDivElement>;
  @ViewChild('editorRevisionHistoryEditorElement') private editorRevisionHistoryEditor!: ElementRef<HTMLDivElement>;
  @ViewChild('editorRevisionHistorySidebarElement') private editorRevisionHistorySidebar!: ElementRef<HTMLDivElement>;

  public Editor: typeof DecoupledEditor | null = null;
  public config: EditorConfig | null = null;
  public authService = inject(AuthService)
  public editorService = inject(EditorService)

  public ngOnInit(): void {
    loadCKEditorCloud(cloudConfig).then(this._setupEditor.bind(this));
  }

  private _setupEditor(cloud: CKEditorCloudResult<typeof cloudConfig>) {
    const loginService = this.authService;
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
      Bookmark,
      CKBox,
      CKBoxImageEdit,
      CloudServices,
      Code,
      Emoji,
      Essentials,
      FindAndReplace,
      FontBackgroundColor,
      FontColor,
      FontFamily,
      FontSize,
      Heading,
      HorizontalLine,
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
      PageBreak,
      Paragraph,
      PasteFromOffice,
      PictureEditing,
      RemoveFormat,
      SpecialCharacters,
      SpecialCharactersArrows,
      SpecialCharactersCurrency,
      SpecialCharactersEssentials,
      SpecialCharactersLatin,
      SpecialCharactersMathematical,
      SpecialCharactersText,
      Strikethrough,
      Subscript,
      Superscript,
      Table,
      TableCaption,
      TableCellProperties,
      TableColumnResize,
      TableProperties,
      TableToolbar,
      TextTransformation,
      TodoList,
      Underline
    } = cloud.CKEditor;

    const {
      CaseChange,
      Comments,
      DocumentOutline,
      ExportPdf,
      ExportWord,
      FormatPainter,
      ImportWord,
      MergeFields,
      MultiLevelList,
      Pagination,
      PasteFromOfficeEnhanced,
      PresenceList,
      RealTimeCollaborativeComments,
      RealTimeCollaborativeEditing,
      RealTimeCollaborativeRevisionHistory,
      RealTimeCollaborativeTrackChanges,
      RevisionHistory,
      SlashCommand,
      TableOfContents,
      Template,
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
          'previousPage',
          'nextPage',
          '|',
          'revisionHistory',
          'trackChanges',
          'comment',
          '|',
          'insertMergeField',
          'previewMergeFields',
          '|',
          'formatPainter',
          '|',
          'heading',
          '|',
          'fontSize',
          'fontFamily',
          'fontColor',
          'fontBackgroundColor',
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
          'multiLevelList',
          'todoList',
          'outdent',
          'indent'
        ],
        shouldNotGroupWhenFull: false
      },
      plugins: [
        Alignment,
        Autoformat,
        AutoImage,
        AutoLink,
        Autosave,
        BalloonToolbar,
        Bold,
        Bookmark,
        CaseChange,
        CKBox,
        CKBoxImageEdit,
        CloudServices,
        Code,
        Comments,
        DocumentOutline,
        Emoji,
        Essentials,
        ExportPdf,
        ExportWord,
        FindAndReplace,
        FontBackgroundColor,
        FontColor,
        FontFamily,
        FontSize,
        FormatPainter,
        Heading,
        HorizontalLine,
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
        MergeFields,
        MultiLevelList,
        PageBreak,
        Pagination,
        Paragraph,
        PasteFromOffice,
        PasteFromOfficeEnhanced,
        PictureEditing,
        PresenceList,
        RealTimeCollaborativeComments,
        RealTimeCollaborativeEditing,
        RealTimeCollaborativeRevisionHistory,
        RealTimeCollaborativeTrackChanges,
        RemoveFormat,
        RevisionHistory,
        SlashCommand,
        SpecialCharacters,
        SpecialCharactersArrows,
        SpecialCharactersCurrency,
        SpecialCharactersEssentials,
        SpecialCharactersLatin,
        SpecialCharactersMathematical,
        SpecialCharactersText,
        Strikethrough,
        Subscript,
        Superscript,
        Table,
        TableCaption,
        TableCellProperties,
        TableColumnResize,
        TableOfContents,
        TableProperties,
        TableToolbar,
        Template,
        TextTransformation,
        TodoList,
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
            this.editorService.getEditorToken().subscribe((value: any) => {
              return resolve(value.data);
            }, error => {
              reject(error);
            })
          })
        },
        // tokenUrl: CLOUD_SERVICES_TOKEN_URL + `&user.name=${this.authService.getUser()?.displayName}&user.email=${this.authService.getUser()?.email}&sub=${this.authService.getUser()?.id}`,
        webSocketUrl: CLOUD_SERVICES_WEBSOCKET_URL
      },
      collaboration: {
        channelId: "paper0"
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
      exportPdf: {
        stylesheets: [
          './export-style.css',
          'https://cdn.ckeditor.com/ckeditor5/44.3.0/ckeditor5.css',
          'https://cdn.ckeditor.com/ckeditor5-premium-features/44.3.0/ckeditor5-premium-features.css'
        ],
        fileName: 'export-pdf-demo.pdf',
        converterOptions: {
          format: 'A4',
          margin_top: '20mm',
          margin_bottom: '20mm',
          margin_right: '12mm',
          margin_left: '12mm',
          page_orientation: 'portrait'
        }
      },
      exportWord: {
        stylesheets: [
          './export-style.css',
          'https://cdn.ckeditor.com/ckeditor5/44.3.0/ckeditor5.css',
          'https://cdn.ckeditor.com/ckeditor5-premium-features/44.3.0/ckeditor5-premium-features.css'
        ],
        fileName: 'export-word-demo.docx',
        converterOptions: {
          document: {
            orientation: 'portrait',
            size: 'A4',
            margins: {
              top: '20mm',
              bottom: '20mm',
              right: '12mm',
              left: '12mm'
            }
          }
        }
      },
      fontFamily: {
        supportAllValues: true
      },
      fontSize: {
        options: [10, 12, 14, 'default', 18, 20, 22],
        supportAllValues: true
      },
      heading: {
        options: [
          {
            model: 'paragraph',
            title: 'Paragraph',
            class: 'ck-heading_paragraph'
          },
          {
            model: 'heading1',
            view: 'h1',
            title: 'Heading 1',
            class: 'ck-heading_heading1'
          },
          {
            model: 'heading2',
            view: 'h2',
            title: 'Heading 2',
            class: 'ck-heading_heading2'
          },
          {
            model: 'heading3',
            view: 'h3',
            title: 'Heading 3',
            class: 'ck-heading_heading3'
          },
          {
            model: 'heading4',
            view: 'h4',
            title: 'Heading 4',
            class: 'ck-heading_heading4'
          },
          {
            model: 'heading5',
            view: 'h5',
            title: 'Heading 5',
            class: 'ck-heading_heading5'
          },
          {
            model: 'heading6',
            view: 'h6',
            title: 'Heading 6',
            class: 'ck-heading_heading6'
          }
        ]
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
      initialData: 'Write here',
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
        isVisible: true
      },
      mergeFields: {
        /* Read more: https://ckeditor.com/docs/ckeditor5/latest/features/merge-fields.html#configuration */
      },
      pagination: {
        pageWidth: '21cm',
        pageHeight: '29.7cm',
        pageMargins: {
          top: '20mm',
          bottom: '20mm',
          right: '12mm',
          left: '12mm'
        }
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
      template: {
        definitions: [
          {
            title: 'Introduction',
            description: 'Simple introduction to an article',
            icon: '<svg width="45" height="45" viewBox="0 0 45 45" fill="none" xmlns="http://www.w3.org/2000/svg">\n    <g id="icons/article-image-right">\n        <rect id="icon-bg" width="45" height="45" rx="2" fill="#A5E7EB"/>\n        <g id="page" filter="url(#filter0_d_1_507)">\n            <path d="M9 41H36V12L28 5H9V41Z" fill="white"/>\n            <path d="M35.25 12.3403V40.25H9.75V5.75H27.7182L35.25 12.3403Z" stroke="#333333" stroke-width="1.5"/>\n        </g>\n        <g id="image">\n            <path id="Rectangle 22" d="M21.5 23C21.5 22.1716 22.1716 21.5 23 21.5H31C31.8284 21.5 32.5 22.1716 32.5 23V29C32.5 29.8284 31.8284 30.5 31 30.5H23C22.1716 30.5 21.5 29.8284 21.5 29V23Z" fill="#B6E3FC" stroke="#333333"/>\n            <path id="Vector 1" d="M24.1184 27.8255C23.9404 27.7499 23.7347 27.7838 23.5904 27.9125L21.6673 29.6268C21.5124 29.7648 21.4589 29.9842 21.5328 30.178C21.6066 30.3719 21.7925 30.5 22 30.5H32C32.2761 30.5 32.5 30.2761 32.5 30V27.7143C32.5 27.5717 32.4391 27.4359 32.3327 27.3411L30.4096 25.6268C30.2125 25.451 29.9127 25.4589 29.7251 25.6448L26.5019 28.8372L24.1184 27.8255Z" fill="#44D500" stroke="#333333" stroke-linejoin="round"/>\n            <circle id="Ellipse 1" cx="26" cy="25" r="1.5" fill="#FFD12D" stroke="#333333"/>\n        </g>\n        <rect id="Rectangle 23" x="13" y="13" width="12" height="2" rx="1" fill="#B4B4B4"/>\n        <rect id="Rectangle 24" x="13" y="17" width="19" height="2" rx="1" fill="#B4B4B4"/>\n        <rect id="Rectangle 25" x="13" y="21" width="6" height="2" rx="1" fill="#B4B4B4"/>\n        <rect id="Rectangle 26" x="13" y="25" width="6" height="2" rx="1" fill="#B4B4B4"/>\n        <rect id="Rectangle 27" x="13" y="29" width="6" height="2" rx="1" fill="#B4B4B4"/>\n        <rect id="Rectangle 28" x="13" y="33" width="16" height="2" rx="1" fill="#B4B4B4"/>\n    </g>\n    <defs>\n        <filter id="filter0_d_1_507" x="9" y="5" width="28" height="37" filterUnits="<!--user-->SpaceOnUse" color-interpolation-filters="sRGB">\n            <feFlood flood-opacity="0" result="BackgroundImageFix"/>\n            <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>\n            <feOffset dx="1" dy="1"/>\n            <feComposite in2="hardAlpha" operator="out"/>\n            <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.29 0"/>\n            <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_1_507"/>\n            <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_1_507" result="shape"/>\n        </filter>\n    </defs>\n</svg>\n',
            data: "<h2>Introduction</h2><p>In today's fast-paced world, keeping up with the latest trends and insights is essential for both personal growth and professional development. This article aims to shed light on a topic that resonates with many, providing valuable information and actionable advice. Whether you're seeking to enhance your knowledge, improve your skills, or simply stay informed, our comprehensive analysis offers a deep dive into the subject matter, designed to empower and inspire our readers.</p>"
          }
        ]
      }
    };

    configUpdateAlert(this.config);
  }

  public onReady(editor: DecoupledEditor): void {
    Array.from(this.editorToolbar.nativeElement.children).forEach(child => child.remove());
    Array.from(this.editorMenuBar.nativeElement.children).forEach(child => child.remove());

    editor.execute('trackChanges');

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
