'use strict';

AdminLib.widget.Datatable.TableAction = (function() {

   var /* AdminLib.widget.Datatable.CreationHandler */ CreationHandler
     , /* AdminLib.widget.Datatable.Datatable       */ Datatable
     , /* AdminLib.widget.Datatable.ExtraFieldsRow  */ ExtraFieldsRow
     , /* AdminLib.widget.Datatable.Field           */ Field
     , /* AdminLib.widget.Datatable.Row             */ Row
     , /* AdminLib.widget.Datatable.RowAction       */ RowAction
     , /* AdminLib.widget.Datatable.RowButton       */ RowButton;

   /**
    * @class TableAction
    *
    * @param {AdminLib.Datatable.TableAction.Parameter} parameters
    * @param {number}                                  index
    * @param {Datatable}                               parent
    * @constructor
    * @property {function(Datatable):pActionResult} actionFunction
    * @property {Datatable} parent
    * @property {number}    index
    *
    */
   function TableAction(parameters, index, parent, internal) {

      parameters = TableAction.coalesceParameters([parameters]);

      this.code           = parameters.code;
      this.index          = index;
      this.parent         = parent;
      this.actionButton   = {};
      this.internal       = AdminLib.coalesce(internal, false);

      if (this.parent.style.tableActions.top)
         this.actionButton.top    = new AdminLib.Action.Button(parameters);

      if (this.parent.style.tableActions.bottom)
         this.actionButton.bottom = new AdminLib.Action.Button(parameters);

      // controls
      if (this.code === undefined)
         throw 'No code provided';
   }

   TableAction.prototype.getCode                 = function getCode() {
      return this.code;
   };

   TableAction.prototype.getDOM                  = function getDOM(position) {
      return this.actionButton[position].getDOM();
   };

   TableAction.prototype.disable                 = function disable() {

      if (this.actionButton.top)
         this.actionButton.top.disable();

      if (this.actionButton.bottom)
         this.actionButton.bottom.disable();

   };

   TableAction.prototype.enable                  = function disable() {

      if (this.actionButton.top)
         this.actionButton.top.enable();

      if (this.actionButton.bottom)
         this.actionButton.bottom.enable();

   };

   /**
    * Remove the action button from the document.
    * If the prosition is provided, then only the given position is removed.
    * Otherwise, all buttons are removed.
    * @param {Position} [position]
    */
   TableAction.prototype.remove                  = function remove(position) {

      var /** @type {AdminLib.Action.Button[]} */ list;

      if (position)
         list = this.buttons[position];
      else {

         list = [];

         if (this.buttons.top)
            list.push(this.buttons.top)

         if (this.buttons.bottom)
            list.push(this.buttons.bottom);
      }


      list.forEach(function(actionButton) {
         var /** @type {HTMLElement} */ parent;

         parent = actionButton.getDOM().parentElement;

         if (parent === null || parent === undefined)
            return;

         parent.removeChild(actionButton);
      });
   };

   /**
    *
    * @param {AdminLib.Datatable.TableAction.Parameter[]} parameters
    * @returns {AdminLib.Datatable.TableAction.Parameter}
    */
   TableAction.coalesceParameters                = function coalesceParameters(parametersList) {

      var /** @type {AdminLib.Action.Button.Parameter} */ coalescedParameters;

      coalescedParameters = AdminLib.Action.Button.coalesceParameters(parametersList);
      coalescedParameters.code  = AdminLib.coalesceAttribute('code', parametersList);

      return coalescedParameters;
   }

   TableAction.mergeOnFirstLaunch   = function() {
      CreationHandler = AdminLib.widget.Datatable.CreationHandler;
      Datatable       = AdminLib.widget.Datatable;
      ExtraFieldsRow  = AdminLib.widget.Datatable.ExtraFieldsRow;
      Field           = AdminLib.widget.Datatable.Field;
      Row             = AdminLib.widget.Datatable.Row;
      RowAction       = AdminLib.widget.Datatable.RowAction;
      RowButton       = AdminLib.widget.Datatable.RowButton;
   };

   return TableAction;

})();