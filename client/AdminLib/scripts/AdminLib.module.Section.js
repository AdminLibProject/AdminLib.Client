'use strict';

AdminLib.Section = (function() {

   /**
    *
    * @param {string} code
    * @constructor
    * @property {string} code
    */
   var Section                                   = function Section(code) {

      AdminLib.Module.call(this, code, this);

      this.code     = code;
      this.title    = undefined;
      this.subtitle = undefined;
   };

   Section.prototype                             = Object.create(AdminLib.Module.prototype);
   Section.prototype.constructor                 = Section;

   Section.prototype.getSubtitle                 = function() {
      return this.subtitle === undefined ? '' : this.subtitle;
   };

   Section.prototype.getTitle                    = function() {
      return this.title === undefined ? '' : this.title;
   };

   /**
    *
    * @returns {string}
    */
   Section.prototype.getCode                     = function() {
      return this.code;
   };

   /**
    *
    * @param {string} subtitle
    */
   Section.prototype.setSubtitle                 = function(subtitle) {
      this.subtitle = subtitle;
   };

   /**
    *
    * @param {string} title
    */
   Section.prototype.setTitle                    = function(title) {
      this.title = title;
   };

   /**
    *
    * @param {string} code
    * @returns {Promise}
    */
   Section.load                                  = function(code) {
      return AdminLib.loadScripts('AdminLib.sections.' + code + '.js').then(function() {
         AdminLib.sections[code].display();
      });
   };

   return Section;
})();

/**
 * @typedef {Object} SectionInformation
 * @property {string} type - Type of section
 *
 */
