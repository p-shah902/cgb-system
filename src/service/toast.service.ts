import { Injectable } from '@angular/core';
import { NgbToast } from '@ng-bootstrap/ng-bootstrap';
import { HttpErrorResponse } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ToastService {

  constructor() { }

  toasts: any[] = [];

  show(message: string, type: 'success' | 'danger' | 'warning' | 'info' = 'success') {
    this.toasts.push({ message, type });
  }

  remove(toast: any) {
    this.toasts = this.toasts.filter(t => t !== toast);
  }

  clear() {
    this.toasts.splice(0, this.toasts.length);
  }

  /**
   * Extracts error messages from backend error response and displays them in toaster
   * Handles error format: { errors: { PaperIds: ["One or more PaperIds already exist in this cycle."] } }
   * @param error - The error object from HTTP request (can be HttpErrorResponse or any error object)
   * @param defaultMessage - Default message to show if no error messages found
   */
  showError(error: any, defaultMessage: string = 'Something went wrong'): void {
    let errorMessage = defaultMessage;

    // Handle HttpErrorResponse
    if (error instanceof HttpErrorResponse) {
      const errorBody = error.error;
      
      // Check for errors object with nested error arrays
      if (errorBody?.errors && typeof errorBody.errors === 'object') {
        const errorMessages: string[] = [];
        
        // Extract all error messages from the errors object
        Object.keys(errorBody.errors).forEach(key => {
          const errorArray = errorBody.errors[key];
          if (Array.isArray(errorArray)) {
            errorArray.forEach((msg: string) => {
              if (msg) {
                errorMessages.push(msg);
              }
            });
          } else if (typeof errorArray === 'string') {
            errorMessages.push(errorArray);
          }
        });

        if (errorMessages.length > 0) {
          errorMessage = errorMessages.join(', ');
        } else if (errorBody.message) {
          errorMessage = errorBody.message;
        }
      } 
      // Check for direct message property
      else if (errorBody?.message) {
        errorMessage = errorBody.message;
      }
    }
    // Handle plain error object (non-HttpErrorResponse)
    else if (error?.error) {
      const errorBody = error.error;
      
      if (errorBody?.errors && typeof errorBody.errors === 'object') {
        const errorMessages: string[] = [];
        
        Object.keys(errorBody.errors).forEach(key => {
          const errorArray = errorBody.errors[key];
          if (Array.isArray(errorArray)) {
            errorArray.forEach((msg: string) => {
              if (msg) {
                errorMessages.push(msg);
              }
            });
          } else if (typeof errorArray === 'string') {
            errorMessages.push(errorArray);
          }
        });

        if (errorMessages.length > 0) {
          errorMessage = errorMessages.join(', ');
        } else if (errorBody.message) {
          errorMessage = errorBody.message;
        }
      } else if (errorBody?.message) {
        errorMessage = errorBody.message;
      }
    }
    // Handle direct errors object
    else if (error?.errors && typeof error.errors === 'object') {
      const errorMessages: string[] = [];
      
      Object.keys(error.errors).forEach(key => {
        const errorArray = error.errors[key];
        if (Array.isArray(errorArray)) {
          errorArray.forEach((msg: string) => {
            if (msg) {
              errorMessages.push(msg);
            }
          });
        } else if (typeof errorArray === 'string') {
          errorMessages.push(errorArray);
        }
      });

      if (errorMessages.length > 0) {
        errorMessage = errorMessages.join(', ');
      }
    }
    // Handle string error
    else if (typeof error === 'string') {
      errorMessage = error;
    }

    this.show(errorMessage, 'danger');
  }

}
