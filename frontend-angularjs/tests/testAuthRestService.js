'use strict';

describe("Testing Auth Rest Services", function () {
    var $compile,
        $httpBackend,
        $rootScope,
        $templateCache,
        AuthRestService,
        AuthLocalStorageService,
        StorageService;


    // Load the angular application that holds the directive
    beforeEach(module('app'));

    // Store references to injected elements
    // so they are available to all tests in this describe block
    beforeEach(inject(function ($injector) {
        $compile = $injector.get('$compile');
        $httpBackend = $injector.get('$httpBackend');
        $rootScope = $injector.get('$rootScope');
        $templateCache = $injector.get('$templateCache');
        AuthRestService = $injector.get('AuthRestService');
        AuthLocalStorageService = $injector.get('AuthLocalStorageService');
        StorageService = $injector.get('StorageService');

        // Always mock calls to the translations
        $httpBackend.when('GET', /locales\/.+\/translations\.json/).respond(200, {});
        // Always mock call to site preferences
        $httpBackend.when('GET', '/api/site_preferences/').respond(200, {});

        $httpBackend.when('GET', '/api/me/').respond(200, {
            'username': "testuser",
            'userprofile': {}
        });

        AuthLocalStorageService.resetToken();
    }));

    it('should login and cache the current logged in user', function () {
        // set an auth token
        AuthLocalStorageService.setToken('abcd');

        // try to login
        var promise = AuthRestService.tryLoginWithAuthToken();
        expect(promise).toBeDefined();

        // Then provide a response for the http request that has been made when getAllUser was called
        $httpBackend.flush();

        // digest - this may take a while in auth rest service
        $rootScope.$digest();

        // try to fetch the current user (should work without api call)
        var currentUser = AuthRestService.getCurrentUser();
        expect(currentUser).toBeDefined();
        expect(currentUser.username).toBe("testuser");
    });
});
