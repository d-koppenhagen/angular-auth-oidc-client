import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthStateService } from '../../auth-state/auth-state.service';
import { OpenIdConfiguration } from '../../config/openid-configuration';
import { AbstractLoggerService } from '../../logging/abstract-logger.service';
import { StateValidationResult } from '../../validation/state-validation-result';
import { StateValidationService } from '../../validation/state-validation.service';
import { CallbackContext } from '../callback-context';
import { ResetAuthDataService } from '../reset-auth-data.service';

@Injectable()
export class StateValidationCallbackHandlerService {
  constructor(
    private readonly loggerService: AbstractLoggerService,
    private readonly stateValidationService: StateValidationService,
    private readonly authStateService: AuthStateService,
    private readonly resetAuthDataService: ResetAuthDataService,
    @Inject(DOCUMENT) private readonly doc: any
  ) {}

  // STEP 4 All flows

  callbackStateValidation(
    callbackContext: CallbackContext,
    configuration: OpenIdConfiguration,
    allConfigs: OpenIdConfiguration[]
  ): Observable<CallbackContext> {
    return this.stateValidationService.getValidatedStateResult(callbackContext, configuration).pipe(
      map((validationResult: StateValidationResult) => {
        callbackContext.validationResult = validationResult;

        if (validationResult.authResponseIsValid) {
          this.authStateService.setAuthorizationData(validationResult.accessToken, callbackContext.authResult, configuration, allConfigs);

          return callbackContext;
        } else {
          const errorMessage = `authorizedCallback, token(s) validation failed, resetting. Hash: ${this.doc.location.hash}`;
          this.loggerService.logWarning(configuration, errorMessage);
          this.resetAuthDataService.resetAuthorizationData(configuration, allConfigs);
          this.publishUnauthorizedState(callbackContext.validationResult, callbackContext.isRenewProcess);

          throw new Error(errorMessage);
        }
      })
    );
  }

  private publishUnauthorizedState(stateValidationResult: StateValidationResult, isRenewProcess: boolean): void {
    this.authStateService.updateAndPublishAuthState({
      isAuthenticated: false,
      validationResult: stateValidationResult.state,
      isRenewProcess,
    });
  }
}
