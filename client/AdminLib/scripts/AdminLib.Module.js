'use strict';

AdminLib.Module = (function() {

   /**
    *
    * @param {string} code
    * @param {Class}  displayHandler
    * @constructor
    * @property {string} code    - Code of the module
    * @property {boolean} loaded - Indicate if the module is loaded (true) or not (false)
    * @property {Promise} promise - Promise of the load of the module
    */
   function Module(code, displayHandler) {
      this.code           = code;
      this.loaded         = false;
      this.displayHandler = displayHandler;

      AdminLib.modules[this.code] = this;
   }

   Module.prototype.display                      = function display() {
      var /** @type {Object} */ displayHandler;

      displayHandler = new this.displayHandler();

      return displayHandler.display.apply(displayHandler, arguments);
   };

   Module.prototype.isLoaded                     = function() {
      return this.loaded;
   };

   Module.prototype.load                         = function() {
      if (this.isLoaded())
         return;

      this.loaded = true;
   };

   Module.prototype.getCode                      = function() {
      return this.code;
   };

   Module.prototype.getNewSource                 = function getNewSource() {
      return new this.displayHandler();
   };

   Module.prototype.menuHandler                  = function menuHandler(event) {
      this.display();
   };

   Module.prototype.urlHandler                   = function urlHandler(url) {
      this.display();
   };

   return Module;
})();