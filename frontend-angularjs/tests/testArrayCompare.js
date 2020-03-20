'use strict';


describe("Testing Array Compare", function () {
    var $compile,
        $httpBackend,
        $rootScope,
        $templateCache;

    var compareFunctionFactory,
        arrayCompare;

    // Load the angular application that holds the directive
    beforeEach(module('compareFunctions'));

    beforeEach(inject(function ($injector) {
        compareFunctionFactory = $injector.get("compareFunctionFactory");

        arrayCompare = compareFunctionFactory('array', null, null).compare;
    }));


    it('checks that two arrays (integer) with numbers are equal', function () {
        var checklist1 = [11, 22, 33];
        var checklist2 = [11, 22, 33];

        expect(
            arrayCompare(checklist1, checklist2)
        ).toBe(0);
    });

    it('checks that two arrays (strings) are equal', function () {
        var checklist1 = ["123", "234", "345"];
        var checklist2 = ["123", "234", "345"];

        expect(
            arrayCompare(checklist1, checklist2)
        ).toBe(0);
    });

    it('checks that two arrays (integer) with different sorting are equal', function () {
        var checklist1 = [11, 22, 33];
        var checklist2 = [11, 33, 22];

        expect(
            arrayCompare(checklist1, checklist2)
        ).toBe(0);
    });

    it('checks that two arrays (strings) with different sorting are equal', function () {
        var checklist1 = ["123", "234", "345"];
        var checklist2 = ["123", "345", "234"];

        expect(
            arrayCompare(checklist1, checklist2)
        ).toBe(0);
    });

    it('checks that two arrays (integer) with different length are unequal', function () {
        var checklist1 = [11, 22, 33];
        var checklist2 = [11, 33];

        expect(
            arrayCompare(checklist1, checklist2)
        ).toBe(-1);
    });

    it('checks that two arrays (strings) with different length are unequal', function () {
        var checklist1 = ["123", "234", "345"];
        var checklist2 = ["123", "345"];

        expect(
            arrayCompare(checklist1, checklist2)
        ).toBe(-1);
    });

    it('checks that two arrays (integer) with different values are unequal', function () {
        var checklist1 = [11, 22, 33];
        var checklist2 = [11, 55, 33];

        expect(
            arrayCompare(checklist1, checklist2)
        ).toBe(-1);
    });

    it('checks that two arrays (strings) with different values are unequal', function () {
        var checklist1 = ["123", "234", "345"];
        var checklist2 = ["123", "789", "345"];

        expect(
            arrayCompare(checklist1, checklist2)
        ).toBe(-1);
    });

    it('checks that both arrays (integer) are completely the same (same reference)', function () {
        var checklist1 = [11, 22, 33];
        var checklist2 = checklist1;

        expect(
            arrayCompare(checklist1, checklist2)
        ).toBe(0);
    });

    it('checks that both arrays (strings) are completely the same (same reference)', function () {
        var checklist1 = ["123", "234", "345"];
        var checklist2 = checklist1;

        expect(
            arrayCompare(checklist1, checklist2)
        ).toBe(0);
    });

    it('checks that both arrays can be null', function () {
        var checklist1 = null;
        var checklist2 = null;

        expect(
            arrayCompare(checklist1, checklist2)
        ).toBe(0);
    });

});
