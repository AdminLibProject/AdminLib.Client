'use strict';

AdminLib.Link                                     = (function() {

   /**
    * @name AdminLib.widget.Datatable.Link
    * @param {AdminLib.widget.Datatable.Link.Parameters.Like} parameters
    * @param {AdminLib.widget.Datatable.Field}               field
    * @constructor
    * @property {AdminLib.widget.Datatable.Field}                field
    * @property {AdminLib.widget.Datatable}                      datatable
    * @property {boolean|AdminLib.widget.Datatable.Link.Enabled} enabled
    * @property {string|AdminLib.widget.Datatable.Link.Handler}  handler
    * @property {AdminLib.Model}                                 model
    * @property {string}                                        url
    */
   function Link(parameters) {
      parameters = Link.coalesceParameters([parameters]);

      this.enabled  = parameters.enabled;
      this.handler  = parameters.handler;
      this.url      = parameters.url;

      // Property : model
      if (typeof(parameters.model) === 'string')
         this.model = AdminLib.model(parameters.model);
      else if (parameters.model)
         this.model = parameters.model;


      // Controls
      if (this.handler === undefined) {
         if (this.model === undefined)
            throw 'No handler provided nor model';
      }
      else if (typeof(this.handler) === 'string') {

         if (this.model === undefined)
            throw 'No model provided';

         this.model.checkHandler(this.handler);
      }
      else if (this.model && typeof(this.handler) === 'function' )
         throw 'You can\'t provide both a model and a handler function !';
   };

   /**
    * Follow the link
    * @param {...*}
    * @public
    */
   Link.prototype.follow                         = function follow() {

      var /** @type {Array} */ parameters;

      parameters = Array.prototype.slice.call(arguments, 0);

      if (this.handler === undefined || typeof(this.handler) === 'string') {
         this.model.displayHandler(this.handler, parameters);
      }
      else
         this.handler.apply(undefined, parameters);

   };

   /**
    * Return the URL of the given item
    * @param {Item} item
    * @returns {string}
    * @public
    */
   Link.prototype.getURL                         = function getURL(item) {
      if (this.url === undefined)
         return undefined;

      if (typeof(this.url) === 'string')
         return this.url;

      return this.url(item);
   };

   /**
    * @param {...*}
    * @returns {boolean}
    * @public
    */
   Link.prototype.isEnabled                      = function isEnabled() {

      var /** @type {Array} */ parameters;

      if (typeof(this.enabled) === 'boolean')
         return this.enabled;

      parameters = Array.prototype.slice.call(arguments, 0);

      return this.enabled.apply(undefined, parameters);
   };

   /**
    *
    * @param {AdminLib.widget.Datatable.Link.Parameter[]} parametersList
    */
   Link.coalesceParameters = function coalesceParameters(parametersList) {

      var /** @type {AdminLib.widget.Datatable.Link.CForm} */ coalescedParameters
        , /** @type {boolean}                             */ linkField;

      linkField = undefined;

      parametersList = AdminLib.list.filterUndefined(parametersList).map(function(parameters) {

         if (parameters === false && linkField === undefined) {
            linkField = false;
            return;
         }

         if (typeof(parameters) === 'string')
            return { url : parameters };
         else if (typeof(parameters) === 'function')
            return { handler : parameters};

         return parameters;
      });

      if (parametersList.length === 0)
         return false;

      if (linkField === false)
         return false;

      coalescedParameters = { enabled  : AdminLib.coalesceAttribute('enabled' , parametersList, true)
                            , handler  : AdminLib.coalesceAttribute('handler' , parametersList)
                            , model    : AdminLib.coalesceAttribute('model' , parametersList)
                            , url      : AdminLib.coalesceAttribute('url' , parametersList) };

      return coalescedParameters;
   };

   return Link;
})();