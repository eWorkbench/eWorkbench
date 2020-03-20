'use strict';

describe("Testing Auth Storage Service", function () {
    var $compile,
        $rootScope,
        AuthLocalStorageService,
        StorageService;


    // Load the angular application that holds the directive
    beforeEach(module('app'));

    // Store references to injected elements
    // so they are available to all tests in this describe block
    beforeEach(inject(function ($injector) {
        $compile = $injector.get('$compile');
        $rootScope = $injector.get('$rootScope');
        AuthLocalStorageService = $injector.get('AuthLocalStorageService');
        StorageService = $injector.get('StorageService');

        AuthLocalStorageService.resetToken();
    }));

    it('should not have a token set by default', function () {
        expect(AuthLocalStorageService.hasToken()).toBe(false);
    });

    it('should set the token and provide it', function () {
        AuthLocalStorageService.setToken('test-ok');

        expect(AuthLocalStorageService.hasToken()).toBe(true);

        expect(AuthLocalStorageService.getToken()).toBe('test-ok');
    });

    it('should delete the token after resetting it', function () {
        AuthLocalStorageService.setToken('test-ok');

        AuthLocalStorageService.resetToken();

        expect(AuthLocalStorageService.hasToken()).toBe(false);

        expect(AuthLocalStorageService.getToken()).toBe(null);
    });
});
