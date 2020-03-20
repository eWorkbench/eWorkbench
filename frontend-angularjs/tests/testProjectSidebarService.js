'use strict';

describe("Testing Project Sidebar Service", function () {
    var $compile,
        $httpBackend,
        $rootScope,
        $templateCache,
        ProjectSidebarService;


    // Load the angular application that holds the directive
    beforeEach(module('app'));

    // Store references to injected elements
    // so they are available to all tests in this describe block
    beforeEach(inject(function ($injector) {
        $compile = $injector.get('$compile');
        $httpBackend = $injector.get('$httpBackend');
        $rootScope = $injector.get('$rootScope');
        $templateCache = $injector.get('$templateCache');
        ProjectSidebarService = $injector.get('ProjectSidebarService');

        // Always mock calls to the translations
        $httpBackend.when('GET', /locales\/.+\/translations\.json/).respond(200, {});
        // Always mock call to site preferences
        $httpBackend.when('GET', '/api/site_preferences/').respond(200, {});
    }));

    it('should trigger all subscribers when changeing the project', function () {
        // set an auth token
        var
            subscriberCalled = 0,
            projectSetBySubscriber = null,
            testProject = {pk:1};

        //project value should be null
        expect(ProjectSidebarService.project).toBe(null);

        //listen to project changes
        ProjectSidebarService.subscribe(function (project) {
            subscriberCalled++;
            projectSetBySubscriber = project;
        });

        // subscribing should already call it once
        expect(subscriberCalled).toBe(1);

        //setter should trigger all listeners
        ProjectSidebarService.project = testProject;
        //getter should return the testProject
        expect(ProjectSidebarService.project).toBe(testProject);
        //check project set by subsriber
        expect(projectSetBySubscriber).toBe(testProject);
        //listener should be called 2 times
        expect(subscriberCalled).toBe(2);
    });
});
