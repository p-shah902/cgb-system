import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../service/auth.service';
import { ToastService } from '../../service/toast.service';
import { NgbToastModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgbToastModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  public toastService = inject(ToastService);

  isSubmitting = false;

  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  get email() {
    return this.loginForm.get('email');
  }

  get password() {
    return this.loginForm.get('password');
  }

  onSubmit() {
    if (this.loginForm.invalid || this.isSubmitting) {
      this.toastService.show('Please Fill All Required Fields', 'danger');
      return;
    }

    this.isSubmitting = true;

    const { email, password } = this.loginForm.value;

    this.authService.login(email, password).subscribe({
      next: ({ status }) => {
        if (!status) {
          this.toastService.show('Invalid Credentials', 'danger');
          return;
        }
        this.toastService.show('Login Successfully', 'success');
        this.router.navigate(['/inboxoutbox']);
      },
      error: err => {
        console.error('Login error:', err);
        this.toastService.show('Something went wrong. Try again.', 'danger');
      },
      complete: () => {
        this.isSubmitting = false;
        this.loginForm.reset();
      }
    });
  }
}
