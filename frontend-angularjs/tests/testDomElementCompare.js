'use strict';

describe("Testing DOM Element Compare", function () {

    it('checks that two dom elements are equal', function () {
        // try comparing two bold elements
        var el1 = jQuery("<b>test</b>")[0];
        var el2 = jQuery("<b>test</b>")[0];

        expect(
            window.domElementEquals(el1, el2)
        ).toBe(true);

        // try comparing two span elements
        el1 = jQuery("<span>test</span>")[0];
        el2 = jQuery("<span>test</span>")[0];

        expect(
            window.domElementEquals(el1, el2)
        ).toBe(true);

        // try comparing two div elements
        el1 = jQuery("<div>test</div>")[0];
        el2 = jQuery("<div>test</div>")[0];

        expect(
            window.domElementEquals(el1, el2)
        ).toBe(true);
    });

    it('checks that two dom elements are not equal', function () {
        var el1 = jQuery("<b>test</b>")[0];
        var el2 = jQuery("<i>test</i>")[0];

        expect(
            window.domElementEquals(el1, el2)
        ).toBe(false);

        el1 = jQuery("<span>test</span>")[0];
        el2 = jQuery("<p>test</p>")[0];

        expect(
            window.domElementEquals(el1, el2)
        ).toBe(false);

        el1 = jQuery("<div>test</div>")[0];
        el2 = jQuery("<p>test</p>")[0];

        expect(
            window.domElementEquals(el1, el2)
        ).toBe(false);
    });

    it('checks that two dom elements with sub elements equal', function () {
        // try comparing two bold elements
        var el1 = jQuery("<div><b>test</b></div>")[0];
        var el2 = jQuery("<div><b>test</b></div>")[0];

        expect(
            window.domElementEquals(el1, el2)
        ).toBe(true);

        // try comparing two span elements
        el1 = jQuery("<div><span>test</span></div>")[0];
        el2 = jQuery("<div><span>test</span></div>")[0];

        expect(
            window.domElementEquals(el1, el2)
        ).toBe(true);

        // try comparing two div elements
        el1 = jQuery("<div><div>test</div></div>")[0];
        el2 = jQuery("<div><div>test</div></div>")[0];

        expect(
            window.domElementEquals(el1, el2)
        ).toBe(true);
    });


    it('checks that two dom elements with different dom elements are not equal', function () {
        var el1 = jQuery("<div><b>test</b></div>")[0];
        var el2 = jQuery("<div><i>test</i></div>")[0];

        expect(
            window.domElementEquals(el1, el2)
        ).toBe(false);

        el1 = jQuery("<div><span>test</span></div>")[0];
        el2 = jQuery("<div><p>test</p></div>")[0];

        expect(
            window.domElementEquals(el1, el2)
        ).toBe(false);

        el1 = jQuery("<div><div>test</div></div>")[0];
        el2 = jQuery("<div><p>test</p></div>")[0];

        expect(
            window.domElementEquals(el1, el2)
        ).toBe(false);
    });

    it('checks that two dom elements with different style attributes are not equal', function () {
        // try comparing two bold elements
        var el1 = jQuery("<b style=\"color: red\">test</b>")[0];
        var el2 = jQuery("<b style=\"color: blue\">test</b>")[0];

        expect(
            window.domElementEquals(el1, el2)
        ).toBe(false);
    });

    it('checks that two dom elements with similar (basically only "spaces" are different) style attributes are equal', function () {
        // try comparing two bold elements
        var el1 = jQuery("<b style=\"color:blue \">test</b>")[0];
        var el2 = jQuery("<b style=\" color: blue\">test</b>")[0];

        expect(
            window.domElementEquals(el1, el2)
        ).toBe(true);
    });

    it('checks that two dom elements with the same attribute are equal', function () {
        // try comparing two bold elements
        var el1 = jQuery("<b class=\"one two three\">test</b>")[0];
        var el2 = jQuery("<b class=\"one two three\">test</b>")[0];

        expect(
            window.domElementEquals(el1, el2)
        ).toBe(true);

        // try comparing two span elements
        el1 = jQuery("<span class=\"one two three\">test</span>")[0];
        el2 = jQuery("<span class=\"one two three\">test</span>")[0];

        expect(
            window.domElementEquals(el1, el2)
        ).toBe(true);

        // try comparing two div elements
        el1 = jQuery("<div class=\"one two three\">test</div>")[0];
        el2 = jQuery("<div class=\"one two three\">test</div>")[0];

        expect(
            window.domElementEquals(el1, el2)
        ).toBe(true);
    });

    it('checks that two dom elements with multiple attributes are equal', function () {
        // try comparing two bold elements
        var el1 = jQuery("<b class=\"one two three\" title=\"foooour\">test</b>")[0];
        var el2 = jQuery("<b class=\"one two three\" title=\"foooour\">test</b>")[0];

        expect(
            window.domElementEquals(el1, el2)
        ).toBe(true);

        // try comparing two span elements
        el1 = jQuery("<span class=\"one two three\" title=\"foooour\">test</span>")[0];
        el2 = jQuery("<span class=\"one two three\" title=\"foooour\">test</span>")[0];

        expect(
            window.domElementEquals(el1, el2)
        ).toBe(true);

        // try comparing two div elements
        el1 = jQuery("<div class=\"one two three\" title=\"foooour\">test</div>")[0];
        el2 = jQuery("<div class=\"one two three\" title=\"foooour\">test</div>")[0];

        expect(
            window.domElementEquals(el1, el2)
        ).toBe(true);
    });

    it('checks that two dom elements with multiple attributes are equal', function () {
        // try comparing two bold elements
        var el1 = jQuery("<b title=\"foooour\" class=\"one two three\">test</b>")[0];
        var el2 = jQuery("<b class=\"one two three\" title=\"foooour\">test</b>")[0];

        expect(
            window.domElementEquals(el1, el2)
        ).toBe(true);

        // try comparing two span elements
        el1 = jQuery("<span title=\"foooour\" class=\"one two three\">test</span>")[0];
        el2 = jQuery("<span class=\"one two three\" title=\"foooour\">test</span>")[0];

        expect(
            window.domElementEquals(el1, el2)
        ).toBe(true);

        // try comparing two div elements
        el1 = jQuery("<div title=\"foooour\" class=\"one two three\">test</div>")[0];
        el2 = jQuery("<div class=\"one two three\" title=\"foooour\">test</div>")[0];

        expect(
            window.domElementEquals(el1, el2)
        ).toBe(true);
    });

    it('checks that two dom elements with different amount of attributes are not equal', function () {
        // try comparing two bold elements
        var el1 = jQuery("<b lang=\"en\" class=\"one two three\" title=\"foooour\">test</b>")[0];
        var el2 = jQuery("<b class=\"one two three\" title=\"foooour\">test</b>")[0];

        expect(
            window.domElementEquals(el1, el2)
        ).toBe(false);

        // try comparing two span elements
        el1 = jQuery("<span lang=\"en\" class=\"one two three\" title=\"foooour\">test</span>")[0];
        el2 = jQuery("<span class=\"one two three\" title=\"foooour\">test</span>")[0];

        expect(
            window.domElementEquals(el1, el2)
        ).toBe(false);

        // try comparing two div elements
        el1 = jQuery("<div lang=\"en\" class=\"one two three\" title=\"foooour\">test</div>")[0];
        el2 = jQuery("<div class=\"one two three\" title=\"foooour\">test</div>")[0];

        expect(
            window.domElementEquals(el1, el2)
        ).toBe(false);
    });

    it('checks that two dom elements with multiple attributes in lower/upper case are equal', function () {
        // try comparing two bold elements
        var el1 = jQuery("<b title=\"foooour\" class=\"one two three\">test</b>")[0];
        var el2 = jQuery("<b cLaSs=\"one two three\" tItLe=\"foooour\">test</b>")[0];

        expect(
            window.domElementEquals(el1, el2)
        ).toBe(true);

        // try comparing two span elements
        el1 = jQuery("<span title=\"foooour\" class=\"one two three\">test</span>")[0];
        el2 = jQuery("<span cLaSs=\"one two three\" tItLe=\"foooour\">test</span>")[0];

        expect(
            window.domElementEquals(el1, el2)
        ).toBe(true);

        // try comparing two div elements
        el1 = jQuery("<div title=\"foooour\" class=\"one two three\">test</div>")[0];
        el2 = jQuery("<div cLaSs=\"one two three\" tItLe=\"foooour\">test</div>")[0];

        expect(
            window.domElementEquals(el1, el2)
        ).toBe(true);
    });

    it('checks that two dom elements with a sub element with multiple attributes in lower/upper case are equal', function () {
        // try comparing two bold elements
        var el1 = jQuery("<div><b title=\"foooour\" class=\"one two three\">test</b></div>")[0];
        var el2 = jQuery("<div><b cLaSs=\"one two three\" tItLe=\"foooour\">test</b></div>")[0];

        expect(
            window.domElementEquals(el1, el2)
        ).toBe(true);

        // try comparing two span elements
        el1 = jQuery("<div><span title=\"foooour\" class=\"one two three\">test</span></div>")[0];
        el2 = jQuery("<div><span cLaSs=\"one two three\" tItLe=\"foooour\">test</span></div>")[0];

        expect(
            window.domElementEquals(el1, el2)
        ).toBe(true);

        // try comparing two div elements
        el1 = jQuery("<div><div title=\"foooour\" class=\"one two three\">test</div></div>")[0];
        el2 = jQuery("<div><div cLaSs=\"one two three\" tItLe=\"foooour\">test</div></div>")[0];

        expect(
            window.domElementEquals(el1, el2)
        ).toBe(true);
    });

    it('checks that two dom elements with multiple sub elements are equal', function () {
        // try comparing two elements with multiple elements of the previous test cases
        var el1 = jQuery("<div><div title=\"foooour\" class=\"one two three\">test</div><b title=\"foooour\" class=\"one two three\">test</b><span title=\"foooour\" class=\"one two three\">test</span></div>")[0];
        var el2 = jQuery("<div><div cLaSs=\"one two three\" tItLe=\"foooour\">test</div><b cLaSs=\"one two three\" tItLe=\"foooour\">test</b><span cLaSs=\"one two three\" tItLe=\"foooour\">test</span></div>")[0];

        expect(
            window.domElementEquals(el1, el2)
        ).toBe(true);
    });

    it('checks that two dom elements with multiple sub elements but different order are not equal', function () {
        // try comparing two elements with multiple elements of the previous test cases
        var el1 = jQuery("<div><div title=\"foooour\" class=\"one two three\">test</div><span title=\"foooour\" class=\"one two three\">test</span><b title=\"foooour\" class=\"one two three\">test</b></div>")[0];
        var el2 = jQuery("<div><div cLaSs=\"one two three\" tItLe=\"foooour\">test</div><b cLaSs=\"one two three\" tItLe=\"foooour\">test</b><span cLaSs=\"one two three\" tItLe=\"foooour\">test</span></div>")[0];

        expect(
            window.domElementEquals(el1, el2)
        ).toBe(false);
    });
});
