'use strict';

describe("Testing Basics", function () {
    var $compile,
        $httpBackend,
        $rootScope,
        $templateCache;

    // Load the angular application that holds the directive
    beforeEach(module('app'));

    // Store references to injected elements
    // so they are available to all tests in this describe block
    beforeEach(inject(function ($injector) {
        $compile = $injector.get('$compile');
        $httpBackend = $injector.get('$httpBackend');
        $rootScope = $injector.get('$rootScope');
        $templateCache = $injector.get('$templateCache');

        // Always mock calls to the translations (ToDo)
        // $httpBackend.when('GET', /locales\/.+\/translations\.json/).respond(200, {});
    }));

    it("True equals true", function () {
        var
            a = true;

        expect(a).toBe(true);
    });

    it("False equals false", function () {
        var
            a = false;

        expect(a).toBe(false);
    });

    it("Injector is working", function () {
        inject(function ($compile, $rootScope, $controller) {
            expect($compile).not.toBe(null);
            expect($rootScope).not.toBe(null);
            expect($controller).not.toBe(null);
            expect($templateCache).not.toBe(null);
        });
    });

    it("$templateCache is filled", function () {
        var templateCacheInfo = $templateCache.info();

        expect(templateCacheInfo).not.toBe(null);
        expect(templateCacheInfo.size).toBeGreaterThan(0);

        var loginTemplate = $templateCache.get('js/screens/login/loginForm.html');
        expect(loginTemplate).not.toBe(null);
    });


});
