'use strict';

AdminLib.widget.Datatable.RowButton               = (function() {

   var /* AdminLib.widget.Datatable.CreationHandler */ CreationHandler
     , /* AdminLib.widget.Datatable.Datatable       */ Datatable
     , /* AdminLib.widget.Datatable.ExtraFieldsRow  */ ExtraFieldsRow
     , /* AdminLib.widget.Datatable.Field           */ Field
     , /* AdminLib.widget.Datatable.Row             */ Row
     , /* AdminLib.widget.Datatable.TableAction     */ TableAction;

   // ******************** RowButton ********************/

   /**
    * @name AdminLib.widget.Datatable.RowButton
    * @class
    * @extends AdminLib.widget.Datatable.RowAction
    *
    * @param {AdminLib.widget.Datatable.RowButton.Parameter} parameters
    * @param {number}                                       index
    * @param {Datatable}                                    parent
    * @constructor
    * @property {function(Object[])} action
    * @property {string}             class
    * @property {boolean}            enabled
    * @property {string}             icon
    * @property {number}             index   Index of the rowbutton inside the parent row buttons list
    * @property {string}             label
    * @property {string}             size
    */
   function RowButton(parameters, index, parent) {
      parameters = RowButton.coalesceParameters([parameters]);
      AdminLib.widget.Datatable.RowAction.call(this, parameters, index, parent);

      this.code = parameters.code;
   }

   RowButton.prototype             = Object.create(AdminLib.widget.Datatable.RowAction.prototype);
   RowButton.prototype.constructor = RowButton;

   /**
    *
    * @param {Item} item
    * @returns {HTMLButtonElement}
    */
   RowButton.prototype.getButton                 = function getButton(item) {

      var /** @type {HTMLTableRowElement} */ tableRow;

      if (item instanceof HTMLTableRowElement)
         tableRow = item;
      else
         tableRow = this.parent.getTableRow(item);

      //noinspection JSValidateTypes
      return tableRow.querySelector('button[data-adminlib-type="rowButton"][data-rowButtonIndex="' + this.index + '"]');
   };

   /**
    *
    * @returns {HTMLTableHeaderElement}
    * @private
    */
   RowButton.prototype.getDatatableColumn        = function getDatatableColumn() {

      var /** @type {string}          */ cssPath
        , /** @type {HTMLTableHeader} */ tableHeader;

      if (!this.datatableColumn) {
         cssPath = 'thead > tr > th[' + domAttributes.dataset.rowButton.index + '="' + this.index + '"]';

         tableHeader = this.parent.tableDOM.querySelector(cssPath);
         this.datatableColumn = this.parent.datatable.column(tableHeader);
      }

      return this.datatableColumn;
   };

   /**
    *
    * @returns {HTMLElement}
    * @public
    */
   RowButton.prototype.getDOM                    = function getDOM() {
      return AdminLib.Action.Button.prototype.getDOM.call(this, arguments);
   };

   RowButton.prototype.getTemplateData           = function getTemplateData(item) {
      var /** @type {string}  */ classes
        , /** @type {Object}  */ data
        , /** @type {boolean} */ enabled
        , /** @type {string}  */ icon
        , /** @type {string}  */ label
        , /** @type {string}  */ style;

      if (typeof(this.class) === 'function')
         classes = this.class(item);
      else
         classes = this.class;

      if (typeof(this.icon) === 'function')
         icon = this.icon(item);
      else
         icon = this.icon;

      if (typeof(this.label) === 'function')
         label = this.label(item);
      else
         label = this.label;

      if (typeof(this.style) === 'function')
         style = this.style(item);
      else
         style = this.style;

      if (typeof(this.enabled) === 'function')
         enabled = this.enabled(item);
      else
         enabled = this.enabled;

      data = { class     : classes
             , enabled   : enabled
             , icon      : icon
             , index     : this.getIndex()
             , label     : label
             , sizeClass : this.sizeClass
             , style     : style};

      return data;
   };

   /**
    * Hide the row button.
    * @param {boolean} [redraw=true]
    * @public
    */
   RowButton.prototype.hide                      = function hide(redraw) {
      redraw = AdminLib.coalesce(redraw, true);

      if (!this.parent.promise_fulfilled)
         return;

      this.getDatatableColumn().visible(false);

      if (redraw)
         this.parent.datatable.draw();
   };

   /**
    * Show the row button.
    * @param {boolean} [redraw=true]
    * @public
    */
   RowButton.prototype.show                      = function show(redraw) {
      redraw = AdminLib.coalesce(redraw, true);

      if (!this.parent.promise_fulfilled)
         return;

      this.getDatatableColumn().visible(true);

      if (redraw)
         this.parent.datatable.draw();
   };

   /**
    *
    * @param {AdminLib.widget.Datatable.RowButton.Parameter[]} parametersList
    * @returns {AdminLib.widget.Datatable.RowButton.Parameter}
    * @public
    */
   RowButton.coalesceParameters                  = function coalesceParameters(parametersList) {

      parametersList = AdminLib.coalesce(parametersList, []).slice(0);

      parametersList.push ( { class     : 'btn-primary'
                            , sizeClass : 'btn-xs'});

      return AdminLib.widget.Datatable.RowAction.coalesceParameters(parametersList);
   };

   RowButton.mergeOnFirstLaunch   = function() {
      CreationHandler = AdminLib.widget.Datatable.CreationHandler;
      Datatable       = AdminLib.widget.Datatable;
      ExtraFieldsRow  = AdminLib.widget.Datatable.ExtraFieldsRow;
      Field           = AdminLib.widget.Datatable.Field;
      Row             = AdminLib.widget.Datatable.Row;
      TableAction     = AdminLib.widget.Datatable.TableAction;
   };

   var domAttributes = AdminLib.widget.Datatable._domAttributes;

   return RowButton;

})();