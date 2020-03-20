'use strict';


describe("Testing NumberFormatService", function () {
    var $compile,
        $httpBackend,
        $rootScope,
        $templateCache;

    /**
     * Methods:
     *
     * - parseNumber (numberStr, options)
     *   Options:
     *   -- maxDecimalPlaces (Integer)
     *   -- prefix (String)
     *   -- suffix (String)
     *
     * - formatNumber (number, options)
     *   Options:
     *   -- insertThouandsSeparator (Boolean)
     *   -- showDecimals (Boolean)
     *   -- prefix (String)
     *   -- suffix (String)
     *
     */
    var numberFormatService;

    // Load the angular application that holds the directive
    beforeEach(module('services'));

    beforeEach(inject(function ($injector) {
        numberFormatService = $injector.get("NumberFormatService");
    }));

    // .parseNumber tests ---

    it('Check parseNumber - simple decimal', function () {
        var result = numberFormatService.parseNumber('123.456', {});

        expect(result).toBe(123.456);
    });

    it('Check parseNumber - simple integer', function () {
        var result = numberFormatService.parseNumber('123', {});

        expect(result).toBe(123);
    });

    it('Check parseNumber - zero', function () {
        var result = numberFormatService.parseNumber('0', {});

        expect(result).toBe(0);
    });

    it('Check parseNumber - null', function () {
        var result = numberFormatService.parseNumber(null, {});

        expect(result).toBe(null);
    });

    it('Check parseNumber - undefined', function () {
        var result = numberFormatService.parseNumber(undefined, {});

        expect(result).toBe(null);
    });

    it('Check parseNumber - negative number', function () {
        var result = numberFormatService.parseNumber('-123.456', {});

        expect(result).toBe(-123.456);
    });

    it('Check parseNumber - maxDecimalPlaces', function () {
        var result = numberFormatService.parseNumber('-1234567.5678', {maxDecimalPlaces: 2});

        expect(result).toBe(-1234567.56);
    });

    it('Check parseNumber - prefix', function () {
        var result = numberFormatService.parseNumber('EUR -123.456', {prefix: 'EUR'});

        expect(result).toBe(-123.456);
    });

    it('Check parseNumber - suffix', function () {
        var result = numberFormatService.parseNumber('-123.456 EUR', {suffix: 'EUR'});

        expect(result).toBe(-123.456);
    });

    // .formatNumber tests ---

    it('Check formatNumber - integer', function () {
        var result = numberFormatService.formatNumber(123, {});

        expect(result).toBe('123');
    });

    it('Check formatNumber - decimal', function () {
        var result = numberFormatService.formatNumber(1.23, {showDecimals: true});

        expect(result).toBe('1.23');
    });

    it('Check formatNumber - negative number', function () {
        var result = numberFormatService.formatNumber(-1.23, {showDecimals: true});

        expect(result).toBe('-1.23');
    });

    it('Check formatNumber - zero', function () {
        var result = numberFormatService.formatNumber(0, {});

        expect(result).toBe('0');
    });

    it('Check formatNumber - null', function () {
        var result = numberFormatService.formatNumber(null, {});

        expect(result).toBe('');
    });

    it('Check formatNumber - undefined', function () {
        var result = numberFormatService.formatNumber(undefined, {});

        expect(result).toBe('');
    });

    it('Check formatNumber - insertThousandsSeparator=true', function () {
        var result = numberFormatService.formatNumber(-123456789.4321, {
            insertThousandsSeparator: true,
            showDecimals: true
        });

        expect(result).toBe('-123,456,789.4321');
    });

    it('Check formatNumber - insertThousandsSeparator=false', function () {
        var result = numberFormatService.formatNumber(-123456789.54321, {
            insertThousandsSeparator: false,
            showDecimals: true
        });

        expect(result).toBe('-123456789.54321');
    });

    it('Check formatNumber - showDecimals=true', function () {
        var result = numberFormatService.formatNumber(-1.321, {showDecimals: true});

        expect(result).toBe('-1.321');
    });

    it('Check formatNumber - showDecimals=false', function () {
        var result = numberFormatService.formatNumber(-1.321, {showDecimals: false});

        expect(result).toBe('-1');
    });

    it('Check formatNumber - prefix', function () {
        var result = numberFormatService.formatNumber(-1.321, {prefix: 'EUR', showDecimals: true});

        expect(result).toBe('EUR -1.321');
    });

    it('Check formatNumber - suffix', function () {
        var result = numberFormatService.formatNumber(-1.321, {suffix: '%', showDecimals: true});

        expect(result).toBe('-1.321 %');
    });
});
