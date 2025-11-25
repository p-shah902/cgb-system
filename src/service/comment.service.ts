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
    // Only Comment Owner and/or Secretary can resolve comments
    const commentServiceInstance = this;
    const canResolveComment = (thread: any): boolean => {
      // Early return if thread is undefined or null
      if (!thread) {
        console.warn('canResolveComment: Thread is undefined or null');
        return false;
      }
      
      if (!commentServiceInstance.currentUser) {
        console.log('canResolveComment: No current user');
        return false;
      }
      
      const isSecretary = commentServiceInstance.userRole === 'Secretary' || commentServiceInstance.userRole === 'Super Admin';
      
      // Try multiple ways to get authorId from thread
      // CKEditor might store it as thread.authorId, thread.author.id, or in thread.comments[0].authorId
      let authorId = null;
      console.log('THREAD', thread);
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
      
      const currentUserId = commentServiceInstance.currentUser.id;
      
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
        userRole: commentServiceInstance.userRole,
        isSecretary,
        isCommentOwner,
        canResolve
      });
      
      return canResolve;
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
    // Also set isResolvable based on permissions to hide resolve button for unauthorized users
    const existingThreads = commentsRepository.getCommentThreads({channelId});
    for (const thread of existingThreads) {
      // Hide resolved comments - don't process them
      if (!thread.isResolved) {
        // Update isResolvable based on permissions
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
              currentUserId: commentServiceInstance.currentUser?.id,
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
        // Set authorId immediately if we have current user and thread doesn't have authorId
        if (commentServiceInstance.currentUser && commentServiceInstance.currentUser.id) {
          const currentUserId = commentServiceInstance.currentUser.id;
          
          // Try to set authorId on the thread if it's missing
          if (thread.set && typeof thread.set === 'function') {
            try {
              // Check if authorId is missing
              const existingAuthorId = thread.get ? thread.get('authorId') : thread.authorId;
              if (!existingAuthorId) {
                // Set the authorId to current user's ID
                thread.set('authorId', currentUserId);
                console.log('Set authorId on new thread:', {
                  threadId: thread.id,
                  authorId: currentUserId,
                  currentUserId: currentUserId
                });
              }
            } catch (e) {
              console.warn('Could not set authorId on new thread:', e);
            }
          }
        }
        
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
              authorId: currentThread.get ? currentThread.get('authorId') : currentThread.authorId,
              currentUserId: commentServiceInstance.currentUser?.id,
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
        // Check if current user can resolve comments
        // When creating a new comment, the creator is the owner, so they can resolve it
        // Secretary/Super Admin can also resolve any comment
        const canResolve = commentServiceInstance.userRole === 'Secretary' || commentServiceInstance.userRole === 'Super Admin' || true; // Creator can always resolve their own comment
        
        commentsRepository.openNewCommentThread({
          channelId: channelId as any,
          threadId,
          target: () => getAnnotationTarget(field, threadId),
          context: {
            type: 'text',
            value: getCustomContextMessage(field)
          },
          isResolvable: canResolve // Set based on permissions
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
