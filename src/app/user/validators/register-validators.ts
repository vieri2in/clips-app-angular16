import { AbstractControl, ValidationErrors, ValidatorFn } from "@angular/forms";

export class RegisterValidators {
  static match(controlName: string, matchingControlName: string): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
      const control = group.get(controlName);
      const matchingControl = group.get(matchingControlName);
      if (!control || !matchingControl) {
        console.error("Form control cannot be found in this form group");
        return {
          controlNotFound: true,
        };
      }
      const error =
        control.value === matchingControl.value ? null : { notMatch: true };
      matchingControl.setErrors(error);
      return error;
    };
  }
}
