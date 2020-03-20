/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function() {
  var djangoJQuery;
  if (typeof jQuery == 'undefined' && typeof django == 'undefined') {
    console.error('ERROR django-ckeditor missing jQuery. Set CKEDITOR_JQUERY_URL or provide jQuery in the template.');
  } else if (typeof django != 'undefined') {
    djangoJQuery = django.jQuery;
  }

  var $ = jQuery || djangoJQuery;
  $(function() {
    initialiseCKEditor();
    initialiseCKEditorInInlinedForms();

    var mouse_is_down = false;

    function initialiseCKEditorInInlinedForms() {
      try {
        $(document).on("mousedown", ".drag", function(e) {
          var target = $(e.target);

          // find 'textarea[data-type=ckeditortype]' in e.target.parentNode
          target.parent().find('textarea[data-type=ckeditortype]').each(function(){
            $(this).data('processed', "0");
          });

          mouse_is_down = true;
          return true;
        });
        $(document).on("mouseup", "body", function() {
          if (mouse_is_down) {
            reinitialiseCKEditor();
            mouse_is_down = false;
          }
          return true;
        });
        $(document).on("click", ".add-row a, .grp-add-handler", function () {
          initialiseCKEditor();
          return true;
        });
      } catch (e) {
        $(document).delegate(".add-row a, .grp-add-handler", "click",  function () {
          initialiseCKEditor();
          return true;
        });
      }
    }

    function reinitialiseCKEditor() {
      console.log('destroying all');
      $('textarea[data-type=ckeditortype]').each(function(){
        if($(this).data('processed') == "0")
        {
          // check if instance xists
          if (CKEDITOR.instances[$(this).attr('id')]) {
            // es it does, destroy it
            CKEDITOR.instances[$(this).attr('id')].destroy();
            // set processed to 1
            $(this).data('processed', "1");
            // init again
            $($(this).data('external-plugin-resources')).each(function () {
              CKEDITOR.plugins.addExternal(this[0], this[1], this[2]);
            });
            CKEDITOR.replace($(this).attr('id'), $(this).data('config'));
          }
        }
      });
    }

    function initialiseCKEditor() {
      $('textarea[data-type=ckeditortype]').each(function(){
        if($(this).data('processed') == "0" && $(this).attr('id').indexOf('__prefix__') == -1){
          $(this).data('processed',"1");
          $($(this).data('external-plugin-resources')).each(function(){
            CKEDITOR.plugins.addExternal(this[0], this[1], this[2]);
          });
          CKEDITOR.replace($(this).attr('id'), $(this).data('config'));
        }
      });
    }
  });
}());
