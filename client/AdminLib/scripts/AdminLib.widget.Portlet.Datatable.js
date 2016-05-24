'use strict';

AdminLib.widget.Portlet.Datatable                 = (function() {

   /**
    *
    * @param {AdminLib.widget.Portlet.Datatable.Parameters} parameters
    * @constructor
    * @property {AdminLib.widget.Datatable.Parameters} datatableParameters Parameters that will be used to create the datatable
    */
   function Portlet(parameters) {

      var /** @type {Array|Promise.<Array>} */ data;

      AdminLib.widget.Portlet.call(this, parameters);

      // Creating parameters for the datatable
      data = parameters.data;

      parameters           = AdminLib.clone(parameters);
      parameters.data      = undefined;
      parameters.sizeClass = undefined;

      this.datatableParameters = AdminLib.widget.Datatable.coalesceParameters([parameters]);

      this.setData(data);
   };

   Portlet.prototype                             = Object.create(AdminLib.widget.Portlet.prototype);
   Portlet.prototype.constructor                 = Portlet;

   /**
    * Return the current datatable of the portlet
    * @returns {AdminLib.widget.Datatable}
    * @public
    */
   Portlet.prototype.getCurrentDatatable         = function() {
      return this.datatable;
   };

   /**
    * @param {Item[]|Promise.<Item[]>} data
    * @public
    */
   Portlet.prototype.setData                     = function(data) {

      this.empty();

      this.datatableParameters.data = data instanceof Promise ? data : Promise.resolve(data);

      this.displayLoader();
      this.datatable = undefined;

      this.datatableParameters.data.then(function(data) {

         var /** @type {AdminLib.Event} */ event;

         this.datatableParameters.data = data;

         this.datatable = new AdminLib.widget.Datatable(this.datatableParameters);

         this.setContent(this.datatable);

         this.removeLoader();

         // Firering event : datatableLoaded
         event = new AdminLib.Event ( Portlet.event.datatableLoaded
                                   , { cancelable : false
                                     , target     : this});

         this.dispatchEvent(event);
         // End event : datatableLoaded

      }.bind(this));



   };

   Portlet.event = { datatableLoaded : 'datatableLoaded' }

   return Portlet;

})();