'use strict';

describe("Testing Card View Directives", function () {
    var $compile,
        $httpBackend,
        $rootScope,
        $templateCache;

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

        // Always mock calls to the translations
        $httpBackend.when('GET', /locales\/.+\/translations\.json/).respond(200, {});
        // Always mock call to site preferences
        $httpBackend.when('GET', '/api/site_preferences/').respond(200, {});

        $httpBackend.when('GET', '/api/projects/').respond(200, {});
    }));

    afterEach(function() {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    });


    it('renders a task as a card', function() {
        // Compile a piece of HTML containing the directive
        var directiveElem = $compile("<task-card-display task='task'></task-card-display>")($rootScope);

        $rootScope.task = {
            'pk': '9b01b2a4-e772-4f01-8300-ccf1502a8b62',
            'task_id': 1234,
            'title': "Task Test Title",
            'description': "Description",
            'created_at': '2017-01-01',
            'assigned_user': {
                'pk': '9876-xyz',
                'username': "testuser",
                'userprofile': {
                    'avatar': "test.png"
                }
            },
            'assigned_user_pk': '9876-xyz'
        };

        // fire all the watches, so the directive will be evaluated
        $rootScope.$digest();
        $httpBackend.flush();

        // verify that a div was rendered
        var div = directiveElem.find('div');
        expect(div).toBeDefined();

        // verify that this directive has a header
        var header = directiveElem.find(".header");
        expect(header).toBeDefined();
        expect(header.text()).toContain("Task Test Title");
        expect(header.text()).toContain("#1234");


        // verify that this directive has content
        var content = directiveElem.find(".content");
        expect(content).toBeDefined();

        var footer = directiveElem.find(".card-footer");
        expect(footer).toBeDefined();
    });

    it('renders a note as a card', function() {
        // Compile a piece of HTML containing the directive

        $rootScope.note = {
            'pk': '9b01b2a4-e772-4f01-8300-ccf1502a8b62',
            'subject': "Test Subject",
            'content': "Test Content"
        };

        var element = angular.element("<note-card-display note='note'></note-card-display>");


        var directiveElem = $compile(element)($rootScope);


        // fire all the watches, so the directive will be evaluated
        $rootScope.$digest();
        $httpBackend.flush();

        // verify that a div was rendered
        var div = directiveElem.find('div');
        expect(div).toBeDefined();

        // verify that this directive has a header
        var header = directiveElem.find(".header");
        expect(header).toBeDefined();
        expect(header.length).toBe(1);
        expect(header.text()).toContain("Test Subject");


        // verify that this directive has content
        var content = directiveElem.find(".content");
        expect(content).toBeDefined();
        expect(content.length).toBe(1);


        var footer = directiveElem.find(".card-footer");
        expect(footer).toBeDefined();
        expect(footer.length).toBe(1);
    });
});
