'use strict';

AdminLib.element.Button = (function() {

   /**
    *
    * @name AdminLib.element.Button
    * @extends AdminLib.Action.Button
    * @class
    * @constructor
    *
    * @param {AdminLib.element.Button.Parameters} parameters
    * @param {*}                                parent
    *
    * @property {string}             code
    * @property {AdminLib.Collection} parent
    */
   function Button(parameters, parent) {

      AdminLib.Action.Button.call(this, parameters);

      this.code   = parameters.code;
      this.parent = parent;

      if (this.label === undefined)
         this.label = this.code.capitalizeFirstLetter();

      // controls
      if (this.parent !== undefined) {

         if (!(this.parent instanceof AdminLib.Collection))
            throw "Parent must be a valid collection";
      }

      if (this.code === undefined)
         throw 'No code provided';
   }

   Button.prototype                              = Object.create(AdminLib.Action.Button.prototype);
   Button.prototype.constructor                  = Button;

   /**
    *
    * @returns {string}
    * @public
    */
   Button.prototype.getCode                      = function getCode() {
      return this.code;
   };

   /**
    *
    * @returns {number}
    * @public
    */
   Button.prototype.getIndex                     = function getIndex() {
      return this.parent.indexOf(this);
   };

   /**
    *
    * @returns {*}
    */
   Button.prototype.getParent                    = function getParent() {
      return this.parent;
   };

   /**
    *
    * @param {AdminLib.element.Button.Parameter[]} parametersList
    * @returns AdminLib.element.Button.Parameter
    */
   Button.coalesceParameters                     = function coalesceParameters(parametersList) {
      var /** @type {AdminLib.element.Button.Parameter} */ coalescedParameters;

      coalescedParameters      = AdminLib.Action.Button.coalesceParameters(parametersList);
      coalescedParameters.code = AdminLib.coalesceAttribute('code', parametersList);

      return coalescedParameters;
   };

   return Button;
})();