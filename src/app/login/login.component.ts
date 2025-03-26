import {Component, inject, Inject} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {AuthService} from '../../service/auth.service';
import {Router} from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {

  // constructor(
  //   private authService: AuthService,
  //   private router: Router
  // ) {}

  authService = inject(AuthService);
  router = inject(Router);

  email: string = '';
  password: string = '';
  isFormValid: boolean = false;

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
      return;
    }

    this.authService.login(this.email, this.password).subscribe({
      next: (response) => {
        if (!response.status) {
          return;
        }

        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        console.error('Login error:', error);
      }
    });


    this.email = "";
    this.password = "";
  }

}
