import { Component, OnDestroy, OnInit } from '@angular/core';
import { EventsService, EventTypes, OidcClientNotification, OidcSecurityService } from 'angular-auth-oidc-client';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
    selector: 'app-root',
    templateUrl: 'app.component.html',
})
export class AppComponent implements OnInit, OnDestroy {
    isConfigurationLoaded$: Observable<OidcClientNotification>;
    isModuleSetUp$: Observable<OidcClientNotification>;
    userDataChanged$: Observable<OidcClientNotification>;
    isAuthenticated: boolean;

    constructor(public oidcSecurityService: OidcSecurityService, private readonly eventsService: EventsService) {
        this.oidcSecurityService.setupModule();
        if (this.oidcSecurityService.moduleSetup) {
            this.doCallbackLogicIfRequired();
        } else {
            this.oidcSecurityService.onModuleSetup.subscribe(() => {
                this.doCallbackLogicIfRequired();
            });
        }
    }

    ngOnInit() {
        this.isModuleSetUp$ = this.eventsService
            .registerForEvents()
            .pipe(filter((notification: OidcClientNotification) => notification.type === EventTypes.ModuleSetup));

        this.isConfigurationLoaded$ = this.eventsService
            .registerForEvents()
            .pipe(filter((notification: OidcClientNotification) => notification.type === EventTypes.ConfigLoaded));

        this.userDataChanged$ = this.eventsService
            .registerForEvents()
            .pipe(filter((notification: OidcClientNotification) => notification.type === EventTypes.UserDataChanged));

        this.oidcSecurityService.getIsAuthorized().subscribe((auth) => {
            this.isAuthenticated = auth;
        });
    }

    ngOnDestroy(): void {}

    login() {
        this.oidcSecurityService.authorize();
    }

    logout() {
        this.oidcSecurityService.logoff();
    }

    private doCallbackLogicIfRequired() {
        // Will do a callback, if the url has a code and state parameter.
        this.oidcSecurityService.authorizedCallbackWithCode(window.location.toString());
    }
}
