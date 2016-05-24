'use strict';

AdminLib.widget.SelectDatatable = (function() {

   /**
    *
    * @param {AdminLib.widget.Modal.Parameters} modalDatatableParameters
    * @param {Parameters}                               selectParameters
    * @namespace AdminLib.widget.SelectDatatable
    * @extends {AdminLib.widget.Modal}
    *
    * @constructor
    *
    * @property {Action}           selectDatatable_Action
    * @property {Promise.<Item[]>} selectDatatable_selectPromise                Promise resolved once the user finish it's selection
    * @property {function(Item[])} selectDatatable_selectPromiseFulfillFunction
    */
   function SelectDatatable(modalDatatableParameters, selectParameters) {

      var defaultButton;

      AdminLib.widget.Modal.Datatable.call(this, modalDatatableParameters);

      selectParameters = AdminLib.clone(AdminLib.coalesce(selectParameters, {}));

      // Property : multiple
      this.selectDatatable_multiple = AdminLib.coalesce(selectParameters.multiple, false);

      // Property : promise
      this.selectDatatable_selectPromise = new Promise(function(fulfill) {
         this.selectDatatable_selectPromiseFulfillFunction = fulfill;
      }.bind(this));

      // ** buttons **
      selectParameters.confirmButton = AdminLib.coalesce(selectParameters.confirmButton, {});
      selectParameters.cancelButton  = AdminLib.coalesce(selectParameters.cancelButton, false);
      selectParameters.resetButton   = AdminLib.coalesce(selectParameters.resetButton, false);

      // ConfirmButton

      if (selectParameters.confirmButton) {

         defaultButton = { label : 'Select'
                         , class : 'btn btn-primary' };

         if (typeof(selectParameters.confirmButton) === 'string') {
            selectParameters.confirmButton       = defaultButton;
            selectParameters.confirmButton.label = selectParameters.confirmButton;
         }
         else if (selectParameters.confirmButton) {
            $.extend(defaultButton, selectParameters.confirmButton);
            selectParameters.confirmButton = defaultButton;
         }
         else
            selectParameters.confirmButton = defaultButton

         selectParameters.confirmButton.action = this.sd_select.bind(this);
      }

      // Cancelbutton
      if (selectParameters.cancelButton) {

         defaultButton = { label : 'Cancel'
                         , class : 'btn btn-default' };

         if (typeof(selectParameters.cancelButton) === 'string') {
            selectParameters.cancelButton       = defaultButton
            selectParameters.cancelButton.label = selectParameters.cancelButton;
         }
         else if (typeof(selectParameters.cancelButton) === 'object') {
            $.extend(defaultButton, selectParameters.cancelButton);
            selectParameters.cancelButton = defaultButton;
         }
         else
            selectParameters.cancelButton = defaultButton

         selectParameters.cancelButton.action = this.cancel.bind(this);
      }

      // Reset button
      if (selectParameters.resetButton) {

         defaultButton = { label : 'Reset'
                         , class : 'btn btn-default' };

         if (typeof(selectParameters.resetButton) === 'string') {
            selectParameters.resetButton       = defaultButton
            selectParameters.resetButton.label = selectParameters.resetButton;
         }
         else if (typeof(selectParameters.resetButton) === 'object') {
            $.extend(defaultButton, selectParameters.resetButton);
            selectParameters.resetButton = defaultButton;
         }
         else
            selectParameters.resetButton = defaultButton

         selectParameters.resetButton.action = this.reset.bind(this);
      }

      // Adding buttons
      this.selectDatatable_confirmButton = this.addButton( this.confirmButton );

      if (selectParameters.cancelButton)
         this.selectDatatable_cancelButton = this.addButton(this.cancelButton);

      if (selectParameters.resetButton)
         this.selectDatatable_resetButton = this.addButton(this.resetButton);

      // Adding listeners that will be trigger when the user select/unselect items
      this.addEventListener(AdminLib.widget.Datatable.event.selectItem     , this.sd_onselect.bind(this));
      this.addEventListener(AdminLib.widget.Datatable.event.selectAllItem  , this.sd_onselect.bind(this));

      this.addEventListener(AdminLib.widget.Datatable.event.unselectAllItem, this.sd_onunselect.bind(this));
      this.addEventListener(AdminLib.widget.Datatable.event.unselectItem   , this.sd_onunselect.bind(this));

   };

   SelectDatatable.prototype                     = Object.create(AdminLib.widget.Modal.Datatable);
   SelectDatatable.prototype.constructor         = SelectDatatable;

   /**
    * Listener on the datatable, fired each time the user select an item
    *
    * @private
    */
   SelectDatatable.prototype.sd_onselect         = function onselect() {

      var /** @type {Item[]} */ items;

      if (this.confirmButton) {
         this.confirmButton.enable();
         return;
      }

      items = this.getSelectedItems();

      this.selectDatatable_selectPromise(items);
   };

   /**
    * Listener on the datatable, fired each time the user select an item
    *
    * @private
    */
   SelectDatatable.prototype.sd_onunselect       = function sd_onunselect() {

      var /** @type {Item[]} */ items;

      items = this.getSelectedItems();

      if (items.length === 0) {
         this.confirmButton.disable();
         return;
      }

   };

   SelectDatatable.prototype.sd_select           = function sd_select() {
      items = this.getSelectedItems();

      this.selectDatatable_selectPromise(items);
   };

})();