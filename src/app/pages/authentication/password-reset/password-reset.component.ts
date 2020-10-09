import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { LoaderService } from 'src/app/core/services/loader.service';
import { StorageService } from 'src/app/core/services/storage.service';
import { UserService } from 'src/app/core/services/user.service';
import { RegexEnum } from 'src/app/shared/utils/regex.enum';
import { MustMatch } from 'src/app/shared/validators/must-match.validator';

@Component({
  selector: 'app-password-reset',
  templateUrl: './password-reset.component.html',
  styleUrls: ['./password-reset.component.scss']
})
export class PasswordResetComponent implements OnInit {

  private token = null;
  public form: FormGroup;
  public submitted = false;
  public tokenStatus: boolean;

  constructor(
    private activatedRoute: ActivatedRoute,
    private formBuilder: FormBuilder,
    private loader: LoaderService,
    private messageService: MessageService,
    private router: Router,
    private storageService: StorageService,
    private userService: UserService
  ) { }

  ngOnInit(): void {
    this.loader.enable();
    this.buildForm();
    this.getTokenStatus();
  }

  get f() {
    return this.form.controls;
  }

  private buildForm(): void {
    this.form = this.formBuilder.group({
      password: ['', [Validators.required, Validators.pattern(new RegExp(RegexEnum.PASSWORD))]],
      confirmPassword: ['', Validators.required],
  }, {
      validator: MustMatch('password', 'confirmPassword')
  });
  }

  private getTokenStatus(): void {
    this.token = this.activatedRoute.snapshot.params.token;

    this.userService.getPasswordResetTokenStatus(this.token).subscribe(response => {
      this.tokenStatus = response.data;
      this.loader.disable();
    });
  }

  public navigateToPage(route: string) {
    this.router.navigateByUrl(route);
  }

  public onSubmit(): void {
    this.submitted = true;

    if (this.form.invalid) {
      return;
    }

    this.loader.enable();

    this.userService.resetPassword(this.token, this.f.password.value).subscribe(response => {
      if (response.success) {
        this.storageService.setSessionItem('lastScreen', 'passwordReset');
        this.storageService.setSessionItem('currentMessage', response.message);

        this.loader.disable();
        this.navigateToPage('/auth/login');

      } else {
        this.loader.disable();

        const message = {
          severity: 'error',
          summary: 'Erro',
          detail: response.message
        }

        this.messageService.clear();
        this.messageService.add(message);
      }
    })

  }

}
