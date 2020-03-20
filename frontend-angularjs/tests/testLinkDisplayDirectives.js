'use strict';

describe("Testing Link Display Directives", function () {
    var $compile,
        $httpBackend,
        $rootScope,
        $templateCache,
        AuthLocalStorageService;

    // Load the angular application that holds the directive
    beforeEach(module('app'));
    beforeEach(module('templates'));
    beforeEach(module('widgets'));


    // Store references to injected elements
    // so they are available to all tests in this describe block
    beforeEach(inject(function ($injector) {
        $compile = $injector.get('$compile');
        $httpBackend = $injector.get('$httpBackend');
        $rootScope = $injector.get('$rootScope');
        $templateCache = $injector.get('$templateCache');
        AuthLocalStorageService = $injector.get('AuthLocalStorageService');

        // Always mock calls to the translations
        $httpBackend.when('GET', /locales\/.+\/translations\.json/).respond(200, {});
        // Always mock call to site preferences
        $httpBackend.when('GET', '/api/site_preferences/').respond(200, {});

        $httpBackend.when('GET', '/api/projects/').respond(200, {});

        AuthLocalStorageService.setToken('abcd');

        $httpBackend.when('GET', '/api/me/').respond(200, {
            'username': "testuser",
            'userprofile': {}
        });
    }));

    afterEach(function() {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    });


    it('renders a task link', function() {
        // Compile a piece of HTML containing the directive
        var directiveElem = $compile("<div><task-link task='task'></task-link></div>")($rootScope);

        $rootScope.task = {
            'pk': '9b01b2a4-e772-4f01-8300-ccf1502a8b62',
            'task_id': 1234,
            'title': "Task Test Title"
        };

        // fire all the watches, so the directive will be evaluated
        $rootScope.$digest();
        $httpBackend.flush();

        // verify that an anchor was rendered
        var anchor = directiveElem.find('a');
        expect(anchor).toBeDefined();

        expect(directiveElem.html()).toContain("Task Test Title");
    });
});
