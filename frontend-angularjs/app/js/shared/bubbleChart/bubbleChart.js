/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('shared');

    /**
     * Directive that draws a bubble chart
     *
     * sets the width to 100% of the parent node
     *
     * @example
     *  <svg bubble-chart data="vm.data" height="290" font-family="Open Sans" font-size="12" text-anchor="middle"></svg>
     ...
     vm.data = [
     {text: '50 valuekey1', value: 2, bgColor:'#ffaacc'},
     {text: '50 value2', value: 5},
     ...
     ];
     */
    module.directive('bubbleChart', function ($timeout, $window, d3) {
        "ngInject";

        return {
            restrict: 'A',
            scope: {
                data: '<'
            },
            link: function (scope, element, attr) {
                $timeout(function () {
                    var
                        $element = jQuery(element),
                        $parent = $element.parent(),
                        width = null,
                        data = null,
                        drawChart = function (data, width) {
                            if (data && width) {

                                //sort data depending data['value'] asc
                                data.sort(function (a, b) {
                                    if (a['value'] > b['value']) {
                                        return 1;
                                    } else if (a['value'] < b['value']) {
                                        return -1;
                                    }

                                    return 0;
                                });
                                //change size of circles (kepp equal values same size)
                                var
                                    thisValue = 0,
                                    lastValue = 0;

                                for (var i = 0; i < data.length; i++) {
                                    thisValue = data[i].value;
                                    data[i].value = i + 1;
                                    if (i > 0 && thisValue === lastValue) {
                                        data[i].value = data[i - 1].value;
                                    }
                                    lastValue = thisValue;
                                }
                                //set height to the svg height attribute
                                var svg = d3.select(element[0]),
                                    height = Number(svg.attr("height"));

                                var color = d3.scaleOrdinal(d3.schemeCategory20c);

                                var pack = d3.pack()
                                    .size([width, height])
                                    .padding(5);

                                var index = 0,
                                    root = d3.hierarchy({children: data})
                                        .sum(function (d) {
                                            return d.value;
                                        })
                                        .each(function (d) {
                                            d.id = index++;
                                        }),
                                    node = svg.selectAll(".node")
                                        .data(pack(root).leaves())
                                        .enter().append("g")
                                        .attr("class", "node");

                                //translate circles
                                svg.selectAll(".node")
                                    .attr("transform", function (d) {
                                        return "translate(" + ((d.x * 1.5) - (width / 4)) + "," + d.y + ")";
                                    });
                                node = node.append("a")
                                    .attr("role", "button")
                                    .attr("xlink:href", function (d) {
                                        return d.data.link;
                                    });
                                //add circle
                                node.append("circle")
                                    .attr("id", function (d) {
                                        return d.data.text;
                                    })
                                    .attr("r", function (d) {
                                        return d.r;
                                    })
                                    .style("fill", function (d) {
                                        if (d.data.bgColor) {
                                            return d.data.bgColor;
                                        }

                                        return color(d.data.text);
                                    });
                                //draw centered text
                                node.append("text")
                                    .style("fill", function (d) {
                                        if (d.data.textColor) {
                                            return d.data.textColor;
                                        }

                                        return "#000000";
                                    })
                                    .selectAll("tspan")
                                    .data(function (d) {
                                        return d.data.text.split(' ');
                                    })
                                    .enter().append("tspan")
                                    .attr("x", 0)
                                    .attr("y", function (d, i, nodes) {
                                        return 13 + ((i - (nodes.length / 2) - 0.5) * 10);
                                    })
                                    .text(function (d) {
                                        return d;
                                    });

                                //add label
                                node.append("title")
                                    .text(function (d) {
                                        return (d.data.text);
                                    });
                            }
                        };

                    scope.$watch(function () {
                        width = $parent[0].offsetWidth;

                        return width
                    },
                    function (width) {
                        data = scope.data;
                        drawChart(data, width);
                    }, true);

                    jQuery($window).resize(function () {
                        scope.$digest();
                    });
                });
            }
        }
    });
})();

