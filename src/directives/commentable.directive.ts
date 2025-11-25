import {Directive, ElementRef, Input, OnInit, OnChanges} from '@angular/core';
import {CKEditorCloudConfig, type CKEditorCloudResult, loadCKEditorCloud} from '@ckeditor/ckeditor5-angular';
import {ContextConfig} from 'ckeditor5';
import {environment} from '../app/core/app-config';
import {EditorService} from '../service/editor.service';
import {AuthService} from '../service/auth.service';

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
  private currentUser: any = null;
  private userRole: string | null = null;

  constructor(private el: ElementRef, private editorService: EditorService, private authService: AuthService) {
    console.log('CHANNEL ID', this.channelId);
    // Get current user and role
    this.authService.userDetails$.subscribe(user => {
      this.currentUser = user;
      this.userRole = user?.roleName || null;
    });
  }

  ngOnDestroy(): void {
    if (this.context) {
      this.context.destroy();
    }
  }

  public ngOnChanges(): void {
    // Don't initialize comments for Partners users
    if (this.userRole === 'Partner' || this.userRole === 'Partners') {
      return;
    }
    
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

    // Helper function to check if user can resolve comment
    // Only Comment Owner and/or Secretary can resolve comments
    const directiveInstance = this;
    const canResolveComment = (thread: any): boolean => {
      // Early return if thread is undefined or null
      if (!thread) {
        console.warn('canResolveComment: Thread is undefined or null');
        return false;
      }
      
      if (!directiveInstance.currentUser) {
        console.log('canResolveComment: No current user');
        return false;
      }
      
      const isSecretary = directiveInstance.userRole === 'Secretary' || directiveInstance.userRole === 'Super Admin';
      
      // Try multiple ways to get authorId from thread
      // CKEditor might store it as thread.authorId, thread.author.id, or in thread.comments[0].authorId
      let authorId = null;
      
      // Try direct property first
      if (thread && thread.authorId) {
        authorId = thread.authorId;
      }
      // Try nested author object
      else if (thread && thread.author && thread.author.id) {
        authorId = thread.author.id;
      }
      // Try from first comment if available
      else if (thread && thread.comments && Array.isArray(thread.comments) && thread.comments.length > 0) {
        const firstComment = thread.comments[0];
        if (firstComment && firstComment.authorId) {
          authorId = firstComment.authorId;
        } else if (firstComment && firstComment.author && firstComment.author.id) {
          authorId = firstComment.author.id;
        }
      }
      // Try using getter method if available
      else if (thread && typeof thread.get === 'function') {
        try {
          authorId = thread.get('authorId') || (thread.get('author') && thread.get('author').id);
        } catch (e) {
          console.warn('Could not get authorId from thread using get method:', e);
        }
      }
      
      // If still no authorId, try to get it from the comments repository or thread data
      if (!authorId && thread && typeof thread.toJSON === 'function') {
        try {
          const threadData = thread.toJSON();
          authorId = threadData.authorId || threadData.author?.id || 
                     (threadData.comments && threadData.comments[0]?.authorId) ||
                     (threadData.comments && threadData.comments[0]?.author?.id);
        } catch (e) {
          console.warn('Could not get authorId from thread.toJSON():', e);
        }
      }
      
      const currentUserId = directiveInstance.currentUser.id;
      
      // Log full thread structure for debugging
      console.log('Thread structure:', {
        thread: thread,
        threadKeys: Object.keys(thread || {}),
        authorId: authorId,
        threadAuthor: thread.author,
        threadComments: thread.comments,
        threadToJSON: thread && typeof thread.toJSON === 'function' ? thread.toJSON() : null,
        currentUserId: currentUserId
      });
      
      // If authorId is still not found, check if thread has a get method to access properties
      if (!authorId && thread.get) {
        try {
          authorId = thread.get('authorId') || thread.get('author')?.id;
        } catch (e) {
          console.warn('Could not get authorId from thread:', e);
        }
      }
      
      const isCommentOwner = authorId && (
        authorId === currentUserId?.toString() || 
        authorId === currentUserId ||
        String(authorId) === String(currentUserId) ||
        Number(authorId) === Number(currentUserId)
      );
      
      const canResolve = isSecretary || isCommentOwner;
      
      console.log('canResolveComment check:', {
        threadId: thread.id,
        authorId: authorId,
        currentUserId: currentUserId,
        userRole: directiveInstance.userRole,
        isSecretary,
        isCommentOwner,
        canResolve
      });
      
      return canResolve;
    };

    // Override comment resolution to check permissions
    // Only Comment Owner and/or Secretary can resolve comments
    if (commentsRepository.resolveCommentThread && typeof commentsRepository.resolveCommentThread === 'function') {
      const originalResolveThread = commentsRepository.resolveCommentThread.bind(commentsRepository);
      commentsRepository.resolveCommentThread = function(threadId: string) {
        const thread = commentsRepository.getCommentThread(threadId);
        if (thread && !canResolveComment(thread)) {
          console.warn('Only Comment Owner or Secretary can resolve comments');
          return;
        }
        return originalResolveThread(threadId);
      };
    } else {
      console.warn('resolveCommentThread method not available on CommentsRepository');
    }

    const existingThreads = commentsRepository.getCommentThreads({channelId});
    console.log('LOg LIST LOADED', existingThreads);
    for (const thread of existingThreads) {
      // Hide resolved comments - don't process them
      if (!thread.isResolved) {
        // Update isResolvable based on permissions to hide resolve button for unauthorized users
        // Use setTimeout to ensure thread is fully initialized
        setTimeout(() => {
          // Re-check thread exists and has set method
          if (!thread) {
            console.warn('Thread is undefined in setTimeout callback');
            return;
          }
          if (thread.set && typeof thread.set === 'function') {
            const canResolve = canResolveComment(thread);
            console.log('Setting isResolvable for existing thread:', {
              threadId: thread.id,
              authorId: thread.authorId,
              currentUserId: directiveInstance.currentUser?.id,
              canResolve
            });
            try {
              thread.set('isResolvable', canResolve);
            } catch (e) {
              console.warn('Could not set isResolvable on thread:', e);
            }
          }
        }, 100);
        handleNewCommentThread(thread.id);
      }
    }

    commentsRepository.on('addCommentThread:' + channelId, (evt: any, data: any) => {
      const thread = commentsRepository.getCommentThread(data.threadId);
      if (thread && !thread.isResolved) {
        // Update isResolvable based on permissions for newly added threads
        // Use setTimeout to ensure thread is fully initialized with authorId
        setTimeout(() => {
          // Re-fetch thread to ensure it still exists
          const currentThread = commentsRepository.getCommentThread(data.threadId);
          if (!currentThread) {
            console.warn('Thread is undefined in setTimeout callback for new thread');
            return;
          }
          if (currentThread.set && typeof currentThread.set === 'function') {
            const canResolve = canResolveComment(currentThread);
            console.log('Setting isResolvable for new thread:', {
              threadId: currentThread.id,
              authorId: currentThread.authorId,
              currentUserId: directiveInstance.currentUser?.id,
              canResolve
            });
            try {
              currentThread.set('isResolvable', canResolve);
            } catch (e) {
              console.warn('Could not set isResolvable on new thread:', e);
            }
          }
        }, 100);
      }
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
      // Don't allow Partners to create comments
      if (this.userRole === 'Partner' || this.userRole === 'Partners') {
        e.preventDefault();
        return;
      }

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
      
      // Hide resolved comments - don't process them
      if (thread.isResolved) {
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
