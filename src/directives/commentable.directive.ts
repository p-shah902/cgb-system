import {Directive, ElementRef, Input, OnInit, OnChanges} from '@angular/core';
import {CKEditorCloudConfig, type CKEditorCloudResult, loadCKEditorCloud} from '@ckeditor/ckeditor5-angular';
import {ContextConfig} from 'ckeditor5';
import {environment} from '../app/core/app-config';
import {EditorService} from '../service/editor.service';

const cloudConfig = {
  version: '44.3.0',
  ckbox: {
    version: '2.6.1'
  },
  premium: true
} satisfies CKEditorCloudConfig;

const CLOUD_SERVICES_TOKEN_URL = environment.ckeditorTokenUrl
const CLOUD_SERVICES_WEBSOCKET_URL = environment.ckeditorSocketUrl;

@Directive({
  standalone: true,
  selector: '[commentable]'
})
export class CommentableDirective implements OnChanges {
  @Input('commentable') channelId: string = "";

  // We'll hold a reference to the CKEditor context so we can destroy it later.
  private context: any;

  constructor(private el: ElementRef, private editorService: EditorService) {
    console.log('CHANNEL ID', this.channelId);
  }

  ngOnDestroy(): void {
    if (this.context) {
      this.context.destroy();
    }
  }

  public ngOnChanges(): void {
    if (this.channelId && !this.context) {
      // loadCKEditorCloud(cloudConfig).then(this._setupEditor.bind(this));
    }
  }

  private async _setupEditor(cloud: CKEditorCloudResult<typeof cloudConfig>) {
    const {CloudServices, Context} = cloud.CKEditor;
    const {
      CommentsRepository,
      NarrowSidebar,
      WideSidebar,
      CloudServicesCommentsAdapter
    } = cloud.CKEditorPremiumFeatures;

    const contextConfig: ContextConfig = {
      plugins: [CloudServices, CommentsRepository, NarrowSidebar, WideSidebar, CloudServicesCommentsAdapter],
      licenseKey: environment.ckEditorLicenceKey,
      sidebar: {
        container: document.querySelector('#context-annotations') as HTMLElement
      },
      comments: {
        editorConfig: {}
      },
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
        channelId: this.channelId
      }
    };
    this.context = await Context.create(contextConfig);
    const commentsRepository = this.context.plugins.get(CommentsRepository);
    const annotations = this.context.plugins.get('Annotations');
    const channelId = this.channelId;

    const commentThreadsForFields = new Map();

    const existingThreads = commentsRepository.getCommentThreads({channelId});
    console.log('LOg LIST LOADED', existingThreads);
    for (const thread of existingThreads) {
      if (!thread.isResolved) {
        handleNewCommentThread(thread.id);
      }
    }

    commentsRepository.on('addCommentThread:' + channelId, (evt: any, data: any) => {
      handleNewCommentThread(data.threadId);
    }, {priority: 'low'});

    commentsRepository.on('resolveCommentThread:' + channelId, (evt: any, data: any) => {
      handleRemovedCommentThread(data.threadId);
    }, {priority: 'low'});

    commentsRepository.on('reopenCommentThread:' + channelId, (evt: any, data: any) => {
      handleNewCommentThread(data.threadId);
    }, {priority: 'low'});

    commentsRepository.on('removeCommentThread:' + channelId, (evt: any, data: any) => {
      handleRemovedCommentThread(data.threadId);
    }, {priority: 'low'});

    const field: HTMLElement = this.el.nativeElement;
    if (!field.id) {
      field.id = 'field-' + Math.random().toString(36).substr(2, 9);
    }

    field.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      const threadId = field.id + ":" + this.channelId + Date.now();

      commentsRepository.openNewCommentThread({
        channelId: channelId as any,
        threadId,
        target: () => getAnnotationTarget(field, threadId),
        context: {
          type: 'text',
          value: getCustomContextMessage(field)
        },
        isResolvable: true
      })
    });

    commentsRepository.on('change:activeCommentThread', (evt: any, propName: any, activeThread: any) => {
      field.classList.remove('active');
      if (activeThread && activeThread.channelId === channelId) {
        const targetField = document.getElementById(activeThread.id.split(':')[0]);
        if (targetField) {
          targetField.classList.add('active');
        }
      }
    });

    function getCustomContextMessage(field: HTMLElement): string {
      // Customize this message as per your application.
      const label = field.previousElementSibling ? field.previousElementSibling.textContent : '';
      return `${label} ${(field as HTMLInputElement).value}`;
    }

    function getAnnotationTarget(target: HTMLElement, threadId: string): HTMLElement | null {
      const thread = commentsRepository.getCommentThread(threadId);
      return thread?.isResolved ? null : target;
    }

    function handleNewCommentThread(threadId: string) {
      const thread = commentsRepository.getCommentThread(threadId);
      if (!thread) {
        return;
      }
      const fieldElement = document.getElementById(threadId.split(':')[0]);
      console.log('d', threadId.split(':')[0]);
      if (!fieldElement) {
        return;
      }

      console.log('THEAD', thread);

      if (!thread.isAttached) {
        thread.attachTo(() => thread.isResolved ? null : fieldElement);
      }
      fieldElement.classList.add('has-comment');
      const openThreads = commentThreadsForFields.get(fieldElement.id) || [];
      if (!openThreads.length) {
        // @ts-ignore: accessing internal controller
        const threadView = commentsRepository._threadToController.get(thread)?.view;
        if (threadView) {
          const annotation = annotations.collection.getByInnerView(threadView);
          if (annotation) {
            annotation.focusableElements.add(fieldElement);
          }
        }
      }
      openThreads.push(thread);
      commentThreadsForFields.set(fieldElement.id, openThreads);
    }

    function handleRemovedCommentThread(threadId: string) {
      const fieldId = threadId.split(':')[0];
      const fieldElement = document.getElementById(fieldId);
      if (!fieldElement) {
        return;
      }
      const openThreads = commentThreadsForFields.get(fieldId) || [];
      const threadIndex = openThreads.findIndex((openThread: any) => openThread.id === threadId);
      if (threadIndex !== -1) {
        openThreads.splice(threadIndex, 1);
      }

      if (threadIndex === 0) {
        const thread = commentsRepository.getCommentThread(threadId);
        // @ts-ignore
        const threadController = commentsRepository._threadToController.get(thread);
        if (threadController) {
          const threadView = threadController.view;
          const annotation = annotations.collection.getByInnerView(threadView);
          if (annotation) {
            annotation.focusableElements.remove(fieldElement);
          }
        }
        const newActiveThread = openThreads[0];
        if (newActiveThread) {
          // @ts-ignore
          const newThreadView = commentsRepository._threadToController.get(newActiveThread)?.view;
          if (newThreadView) {
            const newAnnotation = annotations.collection.getByInnerView(newThreadView);
            if (newAnnotation) {
              newAnnotation.focusableElements.add(fieldElement);
            }
          }
        }
      }

      if (openThreads.length === 0) {
        fieldElement.classList.remove('has-comment', 'active');
      }
      commentThreadsForFields.set(fieldId, openThreads);
    }
  }
}
