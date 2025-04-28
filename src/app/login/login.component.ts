import {Component, inject, Inject} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {AuthService} from '../../service/auth.service';
import {Router} from '@angular/router';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../service/toast.service';
import { NgbToastModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule,CommonModule,NgbToastModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {

  // constructor(
  //   private authService: AuthService,
  //   private router: Router
  // ) {}

  private authService = inject(AuthService);
  private router = inject(Router);
  public toastService = inject(ToastService);

  email: string = '';
  password: string = '';
  isFormValid: boolean = false;
  isSubmitting:boolean=false;

  onEmailChange(): void {
    this.validateForm();
  }

  onPasswordChange(): void {
    this.validateForm();
  }


  validateForm(): void {
    const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
    this.isFormValid = emailRegex.test(this.email) && this.password.length > 4;
  }

  onSubmit() {
    console.log(this.email);
    console.log(this.password);

    if (!this.isFormValid) {
      this.toastService.show('Please Fill All Required Fields','danger');
      return;
    }

    if (this.isSubmitting) return;
    this.isSubmitting=true;
    this.authService.login(this.email, this.password).subscribe({
      next: (response) => {
        if (!response.status) {

          this.toastService.show('Invalid Credentials','danger');
          return;
        }
        console.log("Login Successfully");
        this.toastService.show('Login Successfully','success');
        this.router.navigate(['/inboxoutbox']);
      },
      error: (error) => {
        console.error('Login error:', error);
      },complete:()=>{
        this.isSubmitting=false;
      }
    });


    this.email = "";
    this.password = "";
  }

}
