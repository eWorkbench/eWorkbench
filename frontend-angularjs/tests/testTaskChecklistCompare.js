'use strict';


describe("Testing Task Checklist Compare", function () {
    var $compile,
        $httpBackend,
        $rootScope,
        $templateCache;

    var compareFunctionFactory,
        taskChecklistCompare;

    // Load the angular application that holds the directive
    beforeEach(module('compareFunctions'));

    beforeEach(inject(function ($injector) {
        compareFunctionFactory = $injector.get("compareFunctionFactory");

        taskChecklistCompare = compareFunctionFactory('task_checklist', null, null).compare;
    }));


    it('checks that two task checklists are equal', function () {
        var checklist1 = [{"title": "test", "checked": true}, {"title": "test1", "checked": true},{"title": "test2", "checked": true}];
        var checklist2 = [{"title": "test", "checked": true}, {"title": "test1", "checked": true},{"title": "test2", "checked": true}];

        expect(
            taskChecklistCompare(checklist1, checklist2)
        ).toBe(0);
    });

    it('checks that two task checklists with different sorting are equal', function () {
        var checklist1 = [{"title": "test", "checked": true}, {"title": "test1", "checked": true},{"title": "test2", "checked": true}];
        var checklist2 = [{"title": "test", "checked": true},{"title": "test2", "checked": true}, {"title": "test1", "checked": true}];

        expect(
            taskChecklistCompare(checklist1, checklist2)
        ).toBe(0);
    });

    it('checks that two task checklists with different length are unequal', function () {
        var checklist1 = [{"title": "test", "checked": true}, {"title": "test1", "checked": true},{"title": "test2", "checked": true}];
        var checklist2 = [{"title": "test", "checked": true},{"title": "test1", "checked": true}];

        expect(
            taskChecklistCompare(checklist1, checklist2)
        ).toBe(-1);
    });

    it('checks that two task checklists with different values (title and checked) are unequal', function () {
        var checklist1 = [{"title": "test", "checked": true}, {"title": "test1", "checked": true}];
        var checklist2 = [{"title": "test", "checked": false},{"title": "test2", "checked": true}];

        expect(
            taskChecklistCompare(checklist1, checklist2)
        ).toBe(-1);
    });

    it('checks that two task checklists with different values (only title) are unequal', function () {
        var checklist1 = [{"title": "test", "checked": true}, {"title": "test1", "checked": true}];
        var checklist2 = [{"title": "test", "checked": true},{"title": "test2", "checked": true}];

        expect(
            taskChecklistCompare(checklist1, checklist2)
        ).toBe(-1);
    });

    it('checks that two task checklists with different values (only checked) are unequal', function () {
        var checklist1 = [{"title": "test", "checked": true}, {"title": "test1", "checked": true}];
        var checklist2 = [{"title": "test", "checked": true},{"title": "test1", "checked": false}];

        expect(
            taskChecklistCompare(checklist1, checklist2)
        ).toBe(-1);
    });

    it('checks that two task checklists with different values (only pk) are unequal', function () {
        var checklist1 = [{"pk": "123456789", "title": "test", "checked": true}, {"pk": "789", "title": "test1", "checked": true}];
        var checklist2 = [{"pk": "987654321", "title": "test", "checked": true},{"pk": "789", "title": "test1", "checked": false}];

        expect(
            taskChecklistCompare(checklist1, checklist2)
        ).toBe(-1);
    });

    /**
     * Test is correct when checklist2 has an subtask with correct pk and in checklist1 the same substask with pk = null
     * This happens when a new sub tasks was created and the response from the api was received.
     * The subtask in the api has now an pk but the reference list local has pk == null
     */
    it('checks that two task checklists with same values (but one correct pk and one pk which is null) are equal', function () {
        var checklist1 = [{"pk": "123", "title": "test", "checked": true}, {"pk": "456", "title": "test1", "checked": true},{"pk": null, "title": "test2", "checked": true}];
        var checklist2 = [{"pk": "123", "title": "test", "checked": true}, {"pk": "456", "title": "test1", "checked": true},{"pk": "789", "title": "test2", "checked": true}];

        expect(
            taskChecklistCompare(checklist1, checklist2)
        ).toBe(0);
    });

    it('checks that both checklists are completely the same (same reference)', function () {
        var checklist1 = [{"pk": "123", "title": "test", "checked": true}, {"pk": "456", "title": "test1", "checked": true},{"pk": null, "title": "test2", "checked": true}];
        var checklist2 = checklist1;

        expect(
            taskChecklistCompare(checklist1, checklist2)
        ).toBe(0);
    });

    it('checks that both checklists can be null', function () {
        var checklist1 = null;
        var checklist2 = null;

        expect(
            taskChecklistCompare(checklist1, checklist2)
        ).toBe(0);
    });

});
