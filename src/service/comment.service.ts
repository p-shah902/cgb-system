import {Injectable} from '@angular/core';
import {CKEditorCloudConfig, type CKEditorCloudResult, loadCKEditorCloud} from '@ckeditor/ckeditor5-angular';
import {environment} from '../app/core/app-config';
import {ContextConfig} from 'ckeditor5';
import {EditorService} from './editor.service';
import {AuthService} from './auth.service';

const cloudConfig = {
  version: '44.3.0',
  ckbox: {
    version: '2.6.1'
  },
  premium: true
} satisfies CKEditorCloudConfig;


const CLOUD_SERVICES_WEBSOCKET_URL = environment.ckeditorSocketUrl;

@Injectable({
  providedIn: 'root'
})
export class CommentService {

  private context: any;
  private channelId: any;
  private handleContextMenu: ((e: MouseEvent) => void) | null = null;
  private currentUser: any = null;
  private userRole: string | null = null;

  constructor(private editorService: EditorService, private authService: AuthService) {
    // Get current user and role
    this.authService.userDetails$.subscribe(user => {
      this.currentUser = user;
      this.userRole = user?.roleName || null;
    });
  }

  loadPaper(paperId: number) {
    // Destroy existing context if any to prevent conflicts
    if (this.context) {
      this.destroy();
    }
    
    this.channelId = paperId.toString();
    console.log('Loading comment service for paper:', paperId, 'Channel ID:', this.channelId);
    loadCKEditorCloud(cloudConfig).then(this._setupEditor.bind(this)).catch(error => {
      console.error('Error loading CKEditor Cloud for comments:', error);
    });
  }

  private async _setupEditor(cloud: CKEditorCloudResult<typeof cloudConfig>) {
    const {CloudServices, Context} = cloud.CKEditor;
    const {
      CommentsRepository,
      NarrowSidebar,
      WideSidebar,
      CloudServicesCommentsAdapter
    } = cloud.CKEditorPremiumFeatures;

    // Hide comments for Partners users
    const sidebarContainer = document.querySelector('#context-annotations') as HTMLElement;
    const isPartnerUser = this.userRole === 'Partner' || this.userRole === 'Partners';
    
    if (isPartnerUser && sidebarContainer) {
      sidebarContainer.style.display = 'none';
      // Also hide comment indicators
      document.querySelectorAll('.allow-comments').forEach(field => {
        field.classList.remove('has-comment', 'active');
      });
      return; // Don't initialize comments for Partners
    }

    // Ensure sidebar container exists, if not wait a bit and try again
    if (!sidebarContainer) {
      const serviceInstance = this;
      setTimeout(() => {
        const retryContainer = document.querySelector('#context-annotations') as HTMLElement;
        if (retryContainer) {
          // Re-initialize the entire setup since we need the cloud instance
          loadCKEditorCloud(cloudConfig).then((retryCloud) => {
            serviceInstance._setupEditor(retryCloud);
          }).catch(error => {
            console.error('Error loading CKEditor Cloud on retry:', error);
          });
        } else {
          console.error('Comment sidebar container still not found after retry. Comments may not work.');
        }
      }, 500);
      return;
    }
    
    console.log('Comment service initialized successfully for channel:', this.channelId);

    const contextConfig: ContextConfig = {
      plugins: [CloudServices, CommentsRepository, NarrowSidebar, WideSidebar, CloudServicesCommentsAdapter],
      licenseKey: environment.ckEditorLicenceKey,
      sidebar: {
        container: sidebarContainer
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

    // Verify that commentsRepository is properly initialized
    if (!commentsRepository) {
      console.error('CommentsRepository not found. Comments may not work.');
      return;
    }

    const commentThreadsForFields = new Map();

    // Helper function to check if user can resolve comment
    const canResolveComment = (thread: any): boolean => {
      if (!this.currentUser) return false;
      
      const isSecretary = this.userRole === 'Secretary' || this.userRole === 'Super Admin';
      const isCommentOwner = thread.authorId === this.currentUser.id?.toString() || 
                            thread.authorId === this.currentUser.id;
      
      return isSecretary || isCommentOwner;
    };

    // Override comment resolution to check permissions
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

    // Filter out resolved comments - only show unresolved ones
    const existingThreads = commentsRepository.getCommentThreads({channelId});
    for (const thread of existingThreads) {
      // Hide resolved comments - don't process them
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

    // Use event delegation to handle dynamically added fields
    const serviceInstance = this;
    this.handleContextMenu = (e: MouseEvent) => {
      // Don't allow Partners to create comments
      if (serviceInstance.userRole === 'Partner' || serviceInstance.userRole === 'Partners') {
        return;
      }

      const target = e.target as HTMLElement;
      const field = target.closest('.allow-comments') as HTMLElement;
      
      if (!field) {
        return;
      }
      
      console.log('Right-click detected on commentable field:', field.id || 'no-id');
      
      e.preventDefault();
      e.stopPropagation();
      
      // Ensure field has an ID
      if (!field.id) {
        field.id = 'field-' + Math.random().toString(36).substr(2, 9);
      }
      
      const threadId = field.id + ":" + channelId + Date.now();

      try {
        commentsRepository.openNewCommentThread({
          channelId: channelId as any,
          threadId,
          target: () => getAnnotationTarget(field, threadId),
          context: {
            type: 'text',
            value: getCustomContextMessage(field)
          },
          isResolvable: true
        });
      } catch (error) {
        console.error('Error opening comment thread:', error);
      }
    };
    
    // Remove existing listener if any to prevent duplicates
    if (this.handleContextMenu) {
      document.removeEventListener('contextmenu', this.handleContextMenu);
    }
    
    // Attach event listener to document for event delegation
    document.addEventListener('contextmenu', this.handleContextMenu);
    
    // Also ensure existing fields have IDs - wait a bit for DOM to be ready
    setTimeout(() => {
      document.querySelectorAll('.allow-comments').forEach(field => {
        if (!field.id) {
          field.id = 'field-' + Math.random().toString(36).substr(2, 9);
        }
      });
    }, 100);

    commentsRepository.on('change:activeCommentThread', (evt: any, propName: any, activeThread: any) => {
      document.querySelectorAll('.allow-comments.active')
        .forEach(el => el.classList.remove('active'));
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

      if (!fieldElement) {
        return;
      }

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

  destroy() {
    if (this.context) {
      try {
        this.context.destroy();
      } catch (error) {
        console.error('Error destroying comment context:', error);
      }
      this.context = null;
    }
    // Remove event listeners
    if (this.handleContextMenu) {
      document.removeEventListener('contextmenu', this.handleContextMenu);
      this.handleContextMenu = null;
    }
    this.channelId = null;
  }
}
