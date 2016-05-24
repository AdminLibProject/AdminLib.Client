'use strict';

AdminLib.widget.Datatable                         = (function() {

   var /* AdminLib.widget.Datatable.CreationHandler */ CreationHandler
     , /* AdminLib.widget.Datatable.ExtraFieldsRow  */ ExtraFieldsRow
     , /* AdminLib.widget.Datatable.Field           */ Field
     , /* AdminLib.widget.Datatable.RowAction       */ RowAction
     , /* AdminLib.widget.Datatable.RowAction       */ TableAction;

   // ******************** Datatable  ********************/

   /**
    * @name AdminLib.widget.Datatable.EditAction
    * @typedef {Object}
    * @property {AdminLib.Action.Button}                       editButton
    * @property {AdminLib.widget.Datatable.EditAction.Handler} handler
    *
    */

   var INTERNAL_CODES = { root : '#AdminLib.widget.Datatable' };

   INTERNAL_CODES.deleteAction  = INTERNAL_CODES.root +  ' : deleteAction';
   INTERNAL_CODES.fixedRowField = INTERNAL_CODES.root +  '.Field : fixedRowField';

   var domAttributes        = { dataset : { editMode  : { attribute : 'data-adminlib-widget-datatable-editMode'
                                                        , values    : { disabled : 'disabled'
                                                                      , enabled  : 'enabled'}}
                                          , field     : { index : 'data-adminlib-widget-datatable-field-index'     }
                                          , link      : { enabled : { attribute : 'data-adminlib-widget-datatable-link-enabled'
                                                                    , true      : 'true'
                                                                    , false     : 'false' }}
                                          , rowButton : { index : 'data-adminlib-widget-datatable-rowButton-index' }
                                          , true      : 'true'
                                          , false     : 'false'
                                          , type      : { attribute    : 'data-adminlib-type'
                                                        , values       : { clicableCell : 'clicableCell'
                                                                         , cell         : 'cell'
                                                                         , link         : 'link'}}}
                              , id      : { rowSelector : "rowSelector" }};

   /**
    * @name AdminLib.widget.Datatable
    * @class
    *
    * Notions
    *    Child Rows :
    *
    * A child row is attached to a regular row. The main row will have "expand" button to display all of his
    * child rows.
    * There are two types of child rows : field based and custom ones. There can be only one field based child row for each regular row.
    * Custom rows are rows that display any HTML that you want.
    *
    *    About creation
    * If the table is creatable, then a row is added in the header of the table. Each column of this row will contain a input field.
    * The "form" attribute of each fields will have the value of the "formID" property.
    * The FORM element referred by this property is hidden in a cell of the row
    *
    *
    * @param {AdminLib.widget.Datatable.Parameters} parameters
    * @constructor
    * @property {AdminLib.widget.Datatable.Parameters.Create}          createAction             Information about the creation of a new item
    * @property {AdminLib.widget.Datatable.ChildRow[]}                 childRows                List of child rows
    * @property {boolean}                                             creatable                Indicate if new fields are creatable or not
    * @property {string}                                              createFormID             ID of the form element
    * @property {Item[]}                                              data                     List of items displayed in the datatable
    * @property {AdminLib.widget.Datatable.DeleteAction}               deleteAction             Information about deleting items.
    * @property {AdminLib.widget.Datatable.DeleteAction.Handler}       deleteFunction           Function that will be used to delete items
    * @property {AdminLib.widget.Datatable.RowAction}                  deleteRowAction          Row action corresponding to the delete action
    * @property {HTMLElement}                                         dom
    * @property {AdminLib.widget.Datatable.EditAction}                 editAction               Information about the edit action
    * @property {AdminLib.Collection.<Field>}                          extraFields
    * @property {Collection.<AdminLib.widget.Datatable.Field>}         fields
    * @property {boolean}                                             fixOnSelect              If true, then items will be fixed when selected.
    * @property {AdminLib.widget.Datatable.Field}                      fixedRowField            Invisible field used to fix rows.
    * @property {Item[]}}                                             fixedRows                List of rows fixed to the top of the datatable
    * @property {number}                                              id
    * @property {Promise.<AdminLib.widget.Datatable>}                  fieldPromise             Promise resolved when all fields have retreived there options
    * @property {AdminLib.callback.getItemLabel}                       getItemLabelFunction     Return the label of an item.
    * @property {AdminLib.callback.getItemClasses}                     getRowClassFunction      Return the class of the row
    * @property {string|number}                                       initialOrder
    * @property {AdminLib.Model}                                       model
    * @property {Promise.<AdminLib.widget.Datatable>}                  promise                  Promise that resolved when the datatable is finished to be build
    * @property {function}                                            promise_fulfill_function Function that will resolved the "promise" promise.
    * @property {AdminLib.Collection}                                  rowActions
    * @property {Object.<HTMLElement>}                                rowActionBars
    * @property {AdminLib.widget.Datatable.RowButton[]}                rowButtons
    * @property {AdminLib.widget.Datatable.Row[]}                      rows                     List of all rows in the table
    * @property {Item[]}                                              selectedItems
    * @property {AdminLib.widget.Datatable.SelectableItemsType}        selectableItems          Initial list of selectable items or function
    * @property {boolean}                                             selectMode               Indicate if the select mode is enabled (true) or not (false)
    * @property {string|undefined}                                    storeName                If defined, then this will be the name to use for storing the data of the table (such as fields length) in the local storage
    * @property {AdminLib.widget.Datatable.Parameters.Style}           style
    * @property {AdminLib.Collection}                                  tableActions             List of all table actions. Each key is the code of the table action
    * @property {Object.<HTMLElement>}                                tableActionBars
    * @property {HTMLTableElement}                                    tableDOM
    * @property {AdminLib.Collection.<AdminLib.widget.Datatable.Field>} tableFields
    * @property {HTMLTableCellElement}                                tableHeaderButtonBar     Row in the header in wich are displayed buttons
    * @property {string}                                              title
    * @property {ValidationFunction}                                  validationFunction
    * @property {AdminLib.widget.Modal}                                widget
    * @public
    */
   function Datatable(parameters) {

      var /** @type {string}                                    */ code
        , /** @type {Field}                                     */ field
        , /** @type {AdminLib.widget.Datatable.Field.Parameters} */ fieldParameter
        , /** @type {AdminLib.widget.Datatable.Field.Parameters} */ fixedRowField
        , /** @type {number}                                    */ index
        , /** @type {Item}                                      */ item
        , /** @type {Promise[]}                                 */ promises
        , /** @type {AdminLib.widget.Datatable.Row}              */ row;

      AdminLib.EventTarget.call(this);

      parameters = Datatable.coalesceParameters([parameters]);

      this.childRows            = [];
      this.data                 = parameters.data;
      this.extraFields          = new AdminLib.Collection(Field);
      this.fields               = new AdminLib.Collection(Field);
      this.filter               = parameters.filter;
      this.fixOnSelect          = parameters.fixOnSelect;
      this.id                   = AdminLib.getNewId();
      this.getItemLabelFunction = parameters.getItemLabel;
      this.getRowClassFunction  = parameters.getRowClass;
      this.language             = parameters.language;
      this.lengthMenu           = parameters.lengthMenu;
      this.link                 = parameters.link ? new AdminLib.widget.Datatable.Link(parameters.link, this) : undefined;
      this.loading              = parameters.loading;
      this.pageLength           = parameters.pageLength;
      this.paging               = parameters.paging;
      this.mapItems             = new Map();
      this.manualOrder          = parameters.manualOrder;
      this.model                = parameters.model;
      this.rows                 = [];
      this.rowActions           = new AdminLib.Collection(AdminLib.widget.Datatable.RowAction);
      this.rowButtons           = new AdminLib.Collection(AdminLib.widget.Datatable.RowButton);
      this.rowValidation        = parameters.rowValidation;
      this.selectedItems        = parameters.selectedItems;
      this.keepSelectable       = parameters.selectable;
      this.selectedItems        = parameters.selectedItems;
      this.sizeClass            = parameters.sizeClass;
      this.storeName            = parameters.storeName !== undefined ? 'resizableColumnId-' + parameters.storeName : undefined;
      this.style                = parameters.style;
      this.tableActions         = new AdminLib.Collection(TableAction);
      this.tableClasses         = parameters.tableClasses;
      this.tableFields          = new AdminLib.Collection(Field);
      this.validationFunction   = parameters.validation;

      this.mapCell              = new Map();

      this.createFormID         = 'AdminLib_widget_Datatable_' + this.id;

      // Parameters : childRows
      this.childRows = parameters.childRows.slice(0);

      // Parameters : clicableRow
      if (parameters.link)
         this.clicableRow  = new AdminLib.widget.Datatable.Link(parameters.link, this);

      // Property : fields
      for(index in parameters.fields) {
         fieldParameter = parameters.fields[index];
         field = new Field ( /* parameters */ fieldParameter
                           , /* index      */ parseInt(index)
                           , /* parent     */ this);
         this.fields.push(field);
      }

      // Property : fixedRowField
      // This field is invisible.
      // It allow the row to be fixed on the top of the datatable
      fieldParameter = { code     : INTERNAL_CODES.fixedRowField
                       , getValue : function(item) {
                                       return this.fixedRows.indexOf(item) === -1 ? 0 : 1;
                                    }.bind(this)
                        , visible  : false };

      this.fixedRowField = new Field ( /* parameters */ fieldParameter
                                     , /* index      */ parseInt(this.fields.length)
                                     , /* parent     */ this);

      this.fields.push(this.fixedRowField);

      // Property : fixedRows
      this.fixedRows = [];

      // Property : rows
      for(item of this.data) {
         row = new AdminLib.widget.Datatable.Row(item, this, false);
         this.rows.push(row);
      }

      // Property : rowButtons
      for(var rowButtonParameters of parameters.rowButtons) {
         var rowButton;
         rowButton = new AdminLib.widget.Datatable.RowButton(rowButtonParameters, this.rowButtons.length, this);
         this.rowButtons.push(rowButton);
      }

      // Parameters : edit
      if (parameters.edit || (parameters.edit === undefined && this.model)) {
         parameters.edit.editButton.action = this.enableEditMode.bind(this);
         parameters.edit.editButton.size   = '4em';
         parameters.edit.editButton.code   = '#AdminLib.widget.Datatable.EditButton';

         this.editAction = { editButton : new AdminLib.widget.Datatable.RowButton ( parameters.edit.editButton
                                                                                 , this.rowButtons.length
                                                                                 , this)
                           , handler    : parameters.edit.handler };

         // Adding the edit button at the end
         this.rowButtons.push(this.editAction.editButton);
      }

      // Property : delete
      if (parameters.delete) {
         this.deleteFunction = parameters.delete.handler;
         this.deleteAction   = parameters.delete;

         this.deleteAction.action = this.deleteItems.bind(this);
         this.deleteAction.code   = INTERNAL_CODES.deleteAction;
         this.deleteAction.id     = 'Datatable.' + this.id + '.rowActions.' + this.rowActions.length;

         this.deleteRowAction     = this.addRowAction (this.deleteAction);
      }

      // Property : initialOrder
      if (parameters.initialOrder !== undefined)
         this.initialOrder =    parameters.initialOrder instanceof Array
                              ? parameters.initialOrder
                              : (typeof(parameters.initialOrder) !== 'boolean' ? [parameters.initialOrder] : parameters.initialOrder);

      // Adding row actions
      AdminLib.coalesce(parameters.rowActions, []).forEach(this.addRowAction.bind(this));

      // Property : selectable
      if (this.keepSelectable !== undefined)
         this.selectable = this.keepSelectable;
      else
         this.selectable = this.rowActions.length > 0 || !!this.deleteAction;

      // Property : tableActions
      if (parameters.tableActions)
          for(var actionParameters of parameters.tableActions) {
             this.addTableAction(actionParameters);
          }

      // Property : fieldPromise
      promises = [];
      for(field of this.fields) {
         promises.push(field.getPromise());
      }

      // When "value" of the field promise is the datatable.
      this.fieldPromise = Promise.all(promises).then(function () { return this}.bind(this));

      // Property : promise, promise_fulfill_function
      this.promise_fulfilled = false;
      this.promise = new Promise(function(fulfill) {
         this.promise_fulfill_function = fulfill;
      }.bind(this));

      // Property : tableFields
      if (parameters.tableFields === undefined) {
         this.tableFields = this.fields.clone();
      }
      else {
         for(code of parameters.tableFields) {

            if (this.tableFields.get(code))
               throw 'The field "' + code + '" already displayed in table fields';

            field = this.getField(code);

            if (!field)
               throw 'The field "' + code + '" don\'t exists';

            this.tableFields.push(field);
         }

         this.tableFields.push(this.fixedRowField);
      }

      // Property : extraFields
      if (parameters.extraFields !== undefined)
         for(code of parameters.extraFields) {

            if (this.extraFields.get(code))
               throw 'The field "' + code + '" already displayed in extra-fields';

            // Note : if no list of table fields was provided, then the table field must be composed of all
            // fields except extra fields.
            // If the list of table field was provided, the the field is in both the table field and in
            // extra field list : we raise an error.
            if (this.tableFields.get(code)) {

               // Removing the field of table field
               if (parameters.tableFields === undefined)
                  this.tableFields.remove(code);
               else
                  throw 'The field "' + code + '" already displayed in table-fields';
            }


            field = this.getField(code);

            if (!field)
               throw 'The field "' + code + '" don\'t exists';

            this.extraFields.push(field);
         }

      // Property : creationHandler
      if (parameters.create || (parameters.create === undefined && this.model))
         this.creationHandler = new CreationHandler(this, parameters.create);

      // Property : creatable
      this.creatable = !!this.creationHandler;

   }

   Datatable.prototype                           = Object.create(AdminLib.EventTarget.prototype);
   Datatable.prototype.constructor               = this;

   /**
    * Add a new item in the table.
    * @param {Item} item
    * @return {AdminLib.widget.Datatable.Row}
    * @public
    */
   Datatable.prototype.addItem                   = function addItem(item) {

      var /** @type {AdminLib.widget.Datatable.Row} */ row;

      this.data.push(item);

      row = new AdminLib.widget.Datatable.Row(item, this);

      this.rows.push(row);

      this.buildNewRow(row);

      this.redraw();

      return row;
   };

   /**
    * @method AdminLib.widget.Datatable#addRowAction
    * @param {AdminLib.widget.Datatable.Parameters.RowAction|undefined} parameters
    * @todo handle "selectable".
    * @returns {AdminLib.widget.Datatable.RowAction}
    * @public
    */
   Datatable.prototype.addRowAction              = function addRowAction(parameters) {

      var /** @type {RowAction} */ rowAction;

      if (parameters === undefined)
         return this.rowActions.add(undefined);

      rowAction = new RowAction ( /* parameters */ parameters
                                , /* index      */ this.tableActions.length
                                , /* parent     */ this);

      this.rowActions.push(rowAction);

      if (this.promise_fulfilled) {

         this.updateActionBar();

         if (this.style.tableActions.top)
            this.rowActionBars.top.querySelector('select').appendChild(rowAction.getDOM('top'));

         if (this.style.tableActions.bottom)
            this.rowActionBars.bottom.querySelector('select').appendChild(rowAction.getDOM('bottom'));

      }

      return rowAction;
   };

   /**
    * Add a table action to the data table
    * @method AdminLib.widget.Datatable#addTableAction
    * @param {AdminLib.widget.Datatable.TableAction.Parameter} parameters
    * @returns {AdminLib.widget.Datatable.TableAction}
    * @public
    */
   Datatable.prototype.addTableAction            = function addTableAction(parameters) {

      var /** @type {AdminLib.widget.Datatable.TableAction} */ tableActions;

      tableActions = new TableAction ( /* parameters */ parameters
                                     , /* index      */ this.tableActions.length
                                     , /* parent     */ this);

      this.tableActions.push(tableActions);

      if (this.promise_fulfilled) {

         this.updateActionBar();

         if (this.style.tableActions.top)
            this.tableActions.top.appendChild(tableActions.getDOM('top'));

         if (this.style.tableActions.bottom)
            this.tableActions.top.appendChild(tableActions.getDOM('bottom'));

      }

      return tableActions;
   };

   /**
    *
    * @param {AdminLib.widget.Datatable.Row} row
    * @private
    */
   Datatable.prototype.addToFixedRowList         = function addToFixedRowList(row) {

   };

   /**
    * Build the DOM of the Datatable.
    * @method AdminLib.widget.Datatable#buildDOM
    * @private
    */
   Datatable.prototype.buildDOM                  = function buildDOM() {

      this.dom = AdminLib.dom.build('<div class="' + this.sizeClass +'"></div>');

      if (this.loading) {
         this.loading = false;
         this.displayLoader();
      }

      this.fieldPromise.then(function() {

         var /** @type {Object}                          */ datatableParameters
           , /** @type {number}                          */ d
           , /** @type {string}                          */ editModeFieldQuery
           , /** @type {NodeList.<HTMLTableCellElement>} */ editModeFieldNodes
           , /** @type {AdminLib.widget.Datatable.Field}  */ field
           , /** @type {number}                          */ index
           , /** @type {string}                          */ label
           , /** @type {NodeList}                        */ listDOM
           , /** @type {AdminLib.widget.Datatable.Row}    */ row
           , /** @type {HTMLTableRowElement}             */ rowDOM
           , /** @type {Object}                          */ templateData;

         templateData  = this.getTemplateData();

         this.tableDOM = /** @type {HTMLTableElement} */ AdminLib.dom.build(datatableTemplate, templateData);

         //noinspection JSUnresolvedFunction
         $(this.tableDOM.querySelectorAll('input[type="checkbox"]')).uniform();

         // Adding fields creation in the header

         // Creating the DOM
         this.dom.appendChild(this.tableDOM);

         this.dom.classList.add('datatableWrapper');

         // Building datatable parameters
         datatableParameters = this.getDatatableParameters();

         // Initializing rows
         listDOM = this.dom.querySelectorAll('tbody > tr[data-index][data-row-type="row"]')

         for(d=0; d < listDOM.length; d++) {
            rowDOM = listDOM[d];
            index = parseInt(rowDOM.dataset.index);

            row = this.getRow(index);

            row.initializeDOM(rowDOM);
         }

         // Building datatable
         this.datatable = $(this.tableDOM).DataTable(datatableParameters);

         this.datatableRowSelector = this.datatable.column(this.tableDOM.querySelector('thead > tr > th#' + domAttributes.id.rowSelector));
         this.datatable.draw();

         // Adding the class "form-control" to the length menu
         listDOM = this.dom.querySelectorAll(':scope > .dataTables_wrapper > div > .length > .dataTables_length select');
         for(d=0; d < listDOM.length; d++) {
            listDOM[d].classList.add('form-control');
            listDOM[d].classList.remove('input-sm');
         }

         // Adding the class "form-control" to the filter
         listDOM = this.dom.querySelectorAll(':scope > .dataTables_wrapper > div > .filter > .dataTables_filter input');
         for(d=0; d < listDOM.length; d++) {
            listDOM[d].classList.add('form-control');
            listDOM[d].classList.remove('input-sm');
            listDOM[d].placeholder = 'Search...';
         }

         // Initializing fields
         for(field of this.fields) {
            field.initializeDOM();
         }
         
         for(row of this.rows) {
            row.initializeDatatableRow();
         }

         // Adding all fields in edit mode
         editModeFieldQuery = 'td[' + domAttributes.dataset.editMode.attribute + '="' + domAttributes.dataset.editMode.values.enabled + '"]';
         editModeFieldNodes = this.tableDOM.querySelectorAll(editModeFieldQuery);

         for(index=0; index < editModeFieldNodes.length; index++ ) {
            field = this.getField(editModeFieldNodes[index]);
            field.enableEditMode(index);
         }

         if (this.creationHandler)
            this.creationHandler.initializeDOM();

         // Resizable column
         $(this.tableDOM).resizableColumns(/*{ store : store }*/);

         // Adding "click" listener at table level.
         // This listener will dispatch the "click" event to corresponding handler.
         this.tableDOM.addEventListener('click', this.onclick.bind(this));

         // Retrieving action bars
         this.actionBars      = {};
         this.tableActionBars = {};
         this.rowActionBars   = {};
         this.lengthMenu      = {};

         if (this.style.rowActions.top) {
            this.actionBars.top      = this.dom.querySelector('#actions.top');
            this.tableActionBars.top = this.actionBars.top.querySelector('#tableActions');
            this.rowActionBars.top   = this.actionBars.top.querySelector('#rowActions');
         }

         if (this.style.rowActions.bottom) {
            this.actionBars.bottom      = this.dom.querySelector('#actions.bottom');
            this.tableActionBars.bottom = this.actionBars.bottom.querySelector('#tableActions');
            this.rowActionBars.bottom   = this.actionBars.bottom.querySelector('#rowActions');
         }

         // Adding row action listbox
         AdminLib.list.forEachKey(this.actionBars, function(actionBar, position) {

            var /** @type {HTMLSelectElement} */ selectBox
              , /** @type {string}            */ selectBoxTemplate
              , /** @type {HTMLButtonElement} */ submitButton;

            // If the row action bar is not displayed for the given position, we quit
            if (!this.style.rowActions[position])
               return;

            // Adding a select box
            selectBoxTemplate =  '<select id="rowActions" class="table-group-action-input form-control input-inline">'
                              +     '<option disabled selected>Action...</option>'
                              +     '{{#rowActions.list}}'
                              +        '<option>{{label}}</option>'
                              +     '{{/rowActions.list}}'
                              +  '</select>';

            selectBox    = AdminLib.dom.build(selectBoxTemplate, this);

            submitButton = AdminLib.dom.build('<button id="rowActionsSubmit" class="btn yellow table-group-action-submit form-control input-inline"><i class="fa fa-check"></i> Submit</button>');

            this.rowActionBars[position].querySelector('.form-group').appendChild(selectBox);
            this.rowActionBars[position].querySelector('.form-group').appendChild(submitButton);

            /***** Listeners *****/
            // Select box
            selectBox.addEventListener('change', function() {
               this.disabled = false;
            }.bind(submitButton));

            // Handing row actions
            submitButton.addEventListener('click', RowAction.onsubmit.bind(undefined, this, selectBox));

         }.bind(this));

         this.updateActionBar();
         this.updateRowActionSelect();
         this.updateRowSelector();

         // Handling table actions
         if (this.tableActions.length > 0) {

            AdminLib.list.forEachKey(this.actionBars, function(actionBar, position)
            {

               var /** @type {TableAction} */ tableAction;

               // If the table actions bar is not displayed for the given position, we quit
               if (!this.style.tableActions[position])
                  return;

               actionBar.classList.remove('hide');

               //noinspection BadExpressionStatementJS
               for(tableAction of this.tableActions) {
                  this.tableActionBars[position].appendChild(tableAction.getDOM(position));
               }

               /*this.tableActions.forEach(function(tableAction) {
                  this.tableActionBars[position].appendChild(tableAction.getDOM(position));
               }.bind(this));*/

            }.bind(this))
         }

         this.promise_fulfilled = true;
         this.promise_fulfill_function(this);

         this.removeLoader();

      }.bind(this));

   };

   /**
    * Initialize the row, specially by adding attributes to the HTMLTableRowElement
    * Note that the AdminLib.widget.Datatable.Row object MUST have been created
    * for this item
    * @param {AdminLib.widget.Datatable.Row} row
    * @private
    */
   Datatable.prototype.buildNewRow               = function buildNewRow(row) {

      var /** @type {HTMLTableRowElement}          */ rowDOM
         , t;

      // Building the row dom
      rowDOM       = AdminLib.dom.build(datatableRowTemplate, row.getTemplateData(), 'TBODY');

      // Adding the row to the datatable
      this.datatable.row.add(rowDOM);

      this.datatable.draw();

      // Applying uniform style (this stem is not done by the initializeDOM function).
      $(rowDOM).find('input[' + domAttributes.dataset.type.attribute + '="checkbox"]').uniform();

      row.initializeDOM(rowDOM);
      row.initializeDatatableRow();
   };

   /**
    * Clear all the selected items
    * @public
    */
   Datatable.prototype.clearSelectedItems        = function clearSelectedItems() {

      var /** @type {Item}                         */ selectedItem
        , /** @type {Item[]}                       */ selectedItems
        , /** @type {AdminLib.widget.Datatable.Row} */ row;

      selectedItems = this.selectedItems.slice(0);

      for(selectedItem of selectedItems) {
         row = this.getRow(selectedItem);
         row.unselect();
      }

   };

   /**
    * Clean all validation information from the given row
    *
    * @param {AdminLib.widget.Datatable.ItemLike} item
    * @param {AdminLib.EqualFunction}             [equal]
    * @public
    */
   Datatable.prototype.cleanValidation           = function cleanValidation(item, equal) {
      var /** @type {number}      */ f
        , /** @type {HTMLElement} */ metronicAlert
        , /** @type {Row}         */ row;

      metronicAlert = this.dom.querySelector('.Metronic-alerts');

      row = this.getRow(item, equal);

      row.cleanValidation();
   };

   /**
    *
    * @param {string} name
    * @param {*}     value
    */
   Datatable.prototype.defineProperty            = function defineProperty(name, value) {

   };

   /**
    * Delete the given items from the datatable.
    * The function will call the "deleteFunction".
    *
    * @method AdminLib.widget.Datatable#deleteItems
    * @param {Item[]} items
    * @returns {pDeleteResult}
    * @private
    */
   Datatable.prototype.deleteItems               = function deleteItems(items) {

      var /** @type {Item}      */ item
        , /** @type {Promise}   */ promise
        , /** @type {Promise[]} */ promises
        , /** @type {function}  */ onsuccess
        , /** @type {function}  */ onerror
        , /** @type {boolean[]} */ result;

      items = items.slice(0);

      if (this.deleteFunction)
         promise = this.deleteFunction(items);
      else if (this.model) {

         promises = [];

         onsuccess = function(result) { return {success: true };  };
         onerror   = function(result) { return {success: false}; };

         for(item of items) {
            promise = this.model.delete(item).then(onsuccess, onerror);
            promises.push(promise);
         }

         promise = Promise.all(promises).then(function(results) {

            return { result  : results
                   , success : results.filter(function(result) {return !result}).length === 0 };

         });

      }
      else {

         result = items.map(function() { return true });

         promise = Promise.resolve({ result  : result
                                   , success : true});

      }


      return promise.then(

         /**
          * Once the items deleted (or failed), we received the result of each deletion.
          * We then start building a table sumurizing the delete. The table will
          * be displayed if there is at least one fail.
          * @param {DeleteResult[]} deleteResult
          * @return {ActionResult}
          */
         function(deleteResults) {

            var /** @type {AdminLib.Event}       */ event
              , /** @type {Datatable}           */ errorTable
              , /** @type {DatatableParameters} */ errorTableParameters
              , /** @type {number}              */ nbFailures
              , /** @type {number}              */ nbItems
              , /** @type {Item}                */ item
              , /** @type {string}              */ message
              , /** @type {string}              */ title;

            errorTableParameters = { bordered : false
                                   , data     : []
                                   , editable : false
                                   , fields   : [
                                                  // Item
                                                  { code      : 'item'
                                                  , label     : 'Item'}

                                                  // Status
                                                , { attribute : 'success'
                                                  , code      : 'status'
                                                  , label     : 'Status'
                                                  , options   : { 'Success' : true
                                                                , 'Fail'    : false }}

                                                  // message
                                                , { code      : 'message'
                                                  , label     : 'Message'}]
                                   , getRowClass :
                                       function(item) {
                                          return item.success ? '' : 'danger';
                                       }
                                   , sizeClass : 'col-md-10 col-md-offset-1'
                                   , striped   : false};
            nbFailures = 0;

            // Checking if all items has been successfully deleted
            // If it's not the case, we will display a modal with a table
            // containing all items for wich delete has failed.
            deleteResults.result.forEach(
               /**
                *
                * @param {DeleteResult[]} deleteResult
                */
               function(deleteResult, index) {

                  var /** @type {Item}    */ item
                    , /** @type {boolean} */ success;
                  item = items[index];

                  // Note : we add the item to the error datatable, even if it has been successfully deleted
                  // The item will have an indicator in the datatable indicating that the delete was successful
                  // or not
                  errorTableParameters.data.push ( { item    : this.getItemLabel(item)
                                                   , success : deleteResult.success
                                                   , message : deleteResult.message });

                  success = typeof(deleteResult) === 'boolean' ? deleteResult : deleteResult.success

                  if (success)
                     this.removeItem(item, false);
                  else
                     nbFailures += 1;

               }.bind(this));

            // Updating the datatable so that delete items disappear
            this.redraw();

            // Creating the error table
            if (nbFailures === 0) {

               nbItems = deleteResults.result.length;

               // TODO : this should be the default message if there is message provided
               if (nbItems === 1)
                  message = 'Item successfully deleted';
               else
                  message = nbItems + ' items successfully deleted';

               // Firefing event : itemDeleted
               event = new AdminLib.Event ( Datatable.event.itemDeleted
                                         , { cancelable : false
                                           , target     : this
                                           , detail     : {item : item}});

               this.dispatchEvent(event);

               return { message : message
                      , success : true };

            }

            errorTable = new Datatable(errorTableParameters);

            title = (deleteResults.title ? deleteResults.title : 'Delete') + ' (' + nbFailures + ' error' + (nbFailures > 1 ? 's' : '') + ')';

            return { message : errorTable.getDOM()
                   , success : false
                   , title   : title};

         }.bind(this));

   };

   /**
    * Display the loader on top of the datatable
    * @public
    */
   Datatable.prototype.displayLoader             = function displayLoader(parameters) {
      this.toggleLoader(AdminLib.coalesce(parameters, true));
   };

   Datatable.prototype.dispose                   = function dispose() {

      if (this.datatable)
         this.datatable.destroy();

      this.data            = [];
      this.rows            = [];
      this.dom             = undefined;
      this.tableDOM        = undefined
      this.datatableRowSelector = undefined;

      this.actionBars      = undefined;
      this.tableActionBars = undefined;
      this.rowActionBars   = undefined;
      this.lengthMenu      = undefined;

      delete (this.datatable);
   };

   /**
    *
    * @param {Item|Row|number} item
    * @param {boolean}         [autoexpand=true]
    */
   Datatable.prototype.enableEditMode            = function enableEditMode(item, autoexpand) {
      var /** @type {AdminLib.widget.Datatable.Row} */ row;

      row = this.getRow(item);
      row.enableEditMode(autoexpand);
   };

   /**
    * Fix the row on top of the table
    *
    * If "equal" parameter is defined, then the item will be search by comparing the items with this function
    * The equal parameter will not be used if the item is :
    *    -  a HTMLTableRowElement instance
    *    -  a AdminLib.widget.Datatable.Row instance
    *    -  a number
    *
    * Param: redraw
    *
    * The redraw will be executed only if the row wasn't already fixed
    *
    * @param {AdminLib.widget.Datatable.ItemLike} row
    * @param {AdminLib.EqualFunction}             [equal]
    * @param {boolean}                           [redraw=true] If true, then the datatable will be redraw to apply change
    * @returns {AdminLib.widget.Datatable}
    * @public
    */
   Datatable.prototype.fixRow                    = function fixRow(row, equal, redraw) {

      var /** @type {Item} */ item;

      redraw = AdminLib.coalesce(redraw, true);

      item = this.getItem(row, equal);

      if (this.fixedRows.indexOf(item) !== -1)
         return;

      this.fixedRows.push(item);

      if (!redraw)
         return;

      if (redraw)
         this.redraw ( { draw     : true
                       , fixedRows: true });
   };

   Datatable.prototype.focusOnSearchInput        = function focusOnSearchInput() {

      var /** @type {HTMLInputElement} */ searchInput;

      if (this.dom === undefined)
         return;

      searchInput = this.dom.querySelector('.dataTables_filter > label > input[type="search"]');

      if (searchInput === null)
         return;

      searchInput.focus();
   };

   /**
    * Return the list of api fields
    * @public
    */
   Datatable.prototype.getApiFields              = function getApiFields() {

      var /** @type {string[]} */ fields;

      fields = [];

      this.fields.forEach(function(field) {

         field.getApiFields().forEach(function(apiField) {
            fields.push(apiField);
         });

      });

      return fields;
   };

   /**
    * Return a promise that will be fulfilled once the datatable
    * is fully build.
    *
    * @method AdminLib.widget.Datatable#getBuildPromise
    * @returns {Promise.<AdminLib.widget.Datatable>}
    * @public
    */
   Datatable.prototype.getBuildPromise           = function getBuildPromise() {
      return this.promise;
   };

   /**
    * @param {AdminLib.widget.Datatable.FiedLike} field
    * @param {AdminLib.widget.Datatable.ItemLike} row
    * @returns {AdminLib.widget.Datatable.Cell}
    * @public
    */
   Datatable.prototype.getCell                   = function getCell(field, row) {

      var /** @type {AdminLib.widget.Datatable.Cell} */ cell
        , /** @type {Map}                           */ mapRow;

      field = this.getField(field);
      row   = this.getRow(row);

      mapRow = this.mapCell.get(row);

      if (mapRow === undefined) {
         mapRow = new Map();
         this.mapCell.set(row, mapRow);
      }

      cell = mapRow.get(field);

      if (cell === undefined) {
         cell = new AdminLib.widget.Datatable.Cell(row, field);
         mapRow.set(field, cell);
      }

      return cell;
   };

   /**
    * Return the jquery datatable plugins cell.
    * See http://datatables.net/reference/api/cell()
    * @param {AdminLib.widget.Datatable.Field} field
    * @param {AdminLib.widget.Datatable.Row}   row
    * @param {Object}                         modifier  See "modifier" parameter on http://datatables.net/reference/api/cell()
    * @return {Object}
    * @internal
    */
   Datatable.prototype.getDatatableCell          = function getDatatableCell(field, row, modifier) {

      var /** @type {Object} */ cell;

      if (!this.datatable)
         return undefined;

      field = this.getField(field);
      row   = this.getRow(row);

      cell = this.datatable.cell ( /* rowSelector    */ row.getDatatableRow()
                                 , /* columnSelector */ field.getDatatableColumn()
                                 , /* modifier       */ modifier);

      return cell;

   };

   /**
    * Build the parameters that will be used for the Datatable.net pluggin.
    * @method AdminLib.widget.Datatable#getDatatableParameters
    * @returns {Object}
    * @private
    */
   Datatable.prototype.getDatatableParameters    = function getDatatableParameters() {

      var /** @type {string}                         */ bottomTemplate
        , /** @type {Object}                         */ datatableParameters
        , /** @type {string}                         */ datatableTemplate
        , /** @type {boolean}                        */ displayFilter
        , /** @type {AdminLib.widget.Datatable.Field} */ field
        , /** @type {number}                         */ firstOrderableColumn
        , /** @type {string}                         */ headerTemplate
        , /** @type {number}                         */ l
        , /** @type {string}                         */ lengthMenu
        , /** @type {string}                         */ lengthMenuLabels
        , /** @type {string}                         */ lengthMenuValues
        , /** @type {Array}                          */ order;

      displayFilter = this.filter !== undefined ? this.filter : this.data.length > 10;

      // If there is a row selector, then the first column is the row selector : it's not a orderable column.

      firstOrderableColumn = (this.hasExtraFields() ? 2 : 1);
      headerTemplate       = '<"#actions.top hide "<"#tableActions"><"#rowActions"<"form-inline"<"form-group">>>>';
      bottomTemplate       = '<"#actions.bottom hide "<"#tableActions"><"#rowActions"<"form-inline"<"form-group">>>>';

      if (displayFilter)
         datatableTemplate = '<"row"<"col-sm-6 length"l><"col-sm-6 filter"f>><"row"<"col-md-12"Rrtip>>';
      else
         datatableTemplate = '<"row"<"col-md-12"rti>>';

      if (this.initialOrder instanceof Array) {
         order = this.initialOrder.map(function(order) {

            var /** @type {AdminLib.widget.Datatable.Field|string} */ field;

            if (typeof(order) === 'string') {

               if (order[0] === '+' || order[0] === '-') {
                  field = order.substring(1);
                  order = order[0];
               }
               else {
                  field  = order;
                  order  = '+';
               }

            }
            else {
               field = Math.abs(order);

               if (field < 0)
                  order = '-';
               else if (field > 0)
                  order = '+';
               else { // field === 0

                  // The field equal to 0. Now, we must determine if it's +0 or -0
                  order = (1/order) === -Infinity ? '-' : '+';
               }
            }

            field = this.getField(field);

            if (field === undefined)
               throw 'Field don\'t exists !';

            if (!field.isOrderable())
               throw 'Field "' + field.getCode() + '" is not orderable';

            return [field.getDatatableColumnIndex(), order === '+' ? 'asc' : 'desc'];

         }.bind(this));
      }
      else if (this.initialOrder) {

         // Oui, je sais, c'est moche de faire �a pour une colonne
         // mais l�, tout de suite, j'ai la flemme
         // TODO : make that cleaner
         order = this.fields.filter(function(field) {
                                       return field.isOrderable();
                                    })
                              .map( function(field) {
                                       return [field.getDatatableColumnIndex(), 'asc'];
                                    })[0];

         if (order === undefined)
            order = [];

      }

      datatableParameters = { dom           : headerTemplate + datatableTemplate + bottomTemplate
                            , columnDefs    : []
                            , language      : this.language
                            , pageLength    : this.pageLength
                            , paging        : this.paging
                            , orderCellsTop : true
                            , ordering      : order.length > 0
                            , orderFixed    : {'pre' : [this.fixedRowField.getDatatableColumnIndex(), 'desc']}
                            , order         : order};

      // Adding the "edit" column
      if (this.isEditable()) {
         datatableParameters.columnDefs.push({ targets    : -1
                                             , searchable : false
                                             , orderable  : false });
      }

      // Making the row selector column un-searchable and un-orderable
      datatableParameters.columnDefs.push ( { targets    : 0
                                            , searchable : false
                                            , orderable  : false});

      // Making the row expander column unsearchable and unorderable
      if (this.isRowExpandable())
         datatableParameters.columnDefs.push ( { targets    : this.getExpandCellIndex()
                                               , searchable : false
                                               , orderable  : false});

      return datatableParameters;
   };

   /**
    * Return the row action that handle the delete
    * @returns {AdminLib.widget.Datatable.RowAction}
    * @public
    */
   Datatable.prototype.getDeleteRowAction        = function getDeleteRowAction() {
      return this.deleteRowAction;
   };

   /**
    * Return the DOM of the datatable widget.
    * Note that the function will return an empty "<div>" element. This is normal :
    * the datatable need first to retrieve data. The DIV will be populated later, automatically.
    * The "getBuildPromise" method will return a promise who is fulfilled once the datatable is
    * completely created.
    *
    * You can query this function as many time as you want : all calls will return the same DOM
    * object.
    *
    * @method AdminLib.widget.Datatable#getDOM
    * @returns {HTMLElement}
    * @public
    */
   Datatable.prototype.getDOM                    = function getDOM() {
      if (this.dom === undefined)
         this.buildDOM();

      return this.dom;
   };

   /**
    * Return the DOM ID of the widget
    * @returns {string}
    * @public
    */
   Datatable.prototype.getDomID                  = function getDomID() {
      return 'adminlib-widget-datatable-' + this.id;
   };

   /**
    * Return the edit row button
    * @returns {AdminLib.widget.Datatable.RowButton}
    * @public
    */
   Datatable.prototype.getEditRowButton          = function getEditRowButton() {
      if (!this.editAction)
         return undefined;

      return this.editAction.editButton;
   };

   /**
    * Return the index of the expand cell.
    * If rows are not selectable, then return undefined.
    * @returns {number|undefined}
    * @public
    */
   Datatable.prototype.getExpandCellIndex        = function getExpandCellIndex() {

      if (!this.isRowExpandable())
         return undefined;

      return this.isRowExpandable() ? 1 : 0;
   };

   /**
    *
    * @returns {AdminLib.widget.Datatable.Field[]}
    * @public
    */
   Datatable.prototype.getExtraFields            = function getExtraFields() {
      return this.extraFields.slice(0);
   };

   /**
    * Return the field corresponding to the given parameter.
    * If the parameter is a string, then the function search for a field with
    * a code corresponding to the string.
    * If the field is a number, the function return the field whose index correspond
    * to the number.
    * @param {AdminLib.widget.Datatable.FieldLike} field
    * @returns {AdminLib.widget.Datatable.Field}
    * @public
    */
   Datatable.prototype.getField                  = function getField(field) {

      if (field instanceof HTMLTableCellElement) {
         // TODO : check that the field belongs to the datatable
         field = parseInt(field.getAttribute(domAttributes.dataset.field.index));
      }
      else if (field instanceof AdminLib.widget.Datatable.Field) {
         return field.parent === this ? field : undefined;
      }

      return this.fields.get(field);
   };

   /**
    *
    * @returns {Array.<AdminLib.widget.Datatable.Field>}
    * @public
    */
   Datatable.prototype.getFields                 = function getFields() {
      return this.fields.slice(0);
   };

   /**
    *
    * @returns {AdminLib.widget.Datatable.Field}
    * @private
    */
   Datatable.prototype.getFixedRowField          = function getFixedRowField() {
      return this.fixedRowField;
   };

   /**
    * Return the list of fixed rows
    * @returns {AdminLib.widget.Datatable.Row[]}
    * @public
    */
   Datatable.prototype.getFixedRows              = function getFixedRows() {
      return this.fixedRows.map(function(item) {
         return this.getRow(item);
      }.bind(this));

   };

   /**
    * Return the index of the given item.
    * The index is the index in the "data" property;
    *
    * If "equal" parameter is defined, then the item will be search by comparing the items with this function
    *
    * The equal parameter will not be used if the item is :
    *    -  a HTMLTableRowElement instance
    *    -  a AdminLib.widget.Datatable.Row instance
    *    -  a number
    *
    * @param {AdminLib.widget.Datatable.ItemLike} item
    * @param {AdminLib.EqualFunction}             [equal]
    * @returns {number|undefined}
    * @public
    */
   Datatable.prototype.getIndex                  = function getIndex(item, equal) {
      var /** @type {Item}   */ dataItem
        , /** @type {number} */ index
        , /** @type {AdminLib.widget.Datatable.Row} */ row;

      if (typeof(item) === 'number')
         return item;
      else if (item instanceof HTMLTableRowElement) {
         index = parseInt(item.getAttribute('data-index'));
         row = this.getRow(index);

         if (row === undefined)
            return undefined;

         // If the DOM don't correspond to the row DOM
         // the it mean's that it don't belongs to the
         // datatable : we return undefined.
         return row.getDOM() === item ? index : undefined;
      }
      else if (item instanceof AdminLib.widget.Datatable.Row)
         return item.getIndex();
      else if (item instanceof Object) {

         if (equal === undefined)
            return index = this.data.indexOf(item);
         // If the equal is a string, then then we use it as an attribute name
         else if (typeof(equal) === 'string')

            for(index in this.data) {

               if (this.data[index][equal] === item[equal])
                  return index;

            }

         else
            for(index in this.data) {

               if (equal(item, this.data[index]))
                  return index;

            }

      }
   };

   /**
    * Return the item corresponding to the given index or row.
    *
    * If "equal" parameter is defined, then the item will be search by comparing the items with this function
    * The equal parameter will not be used if the item is :
    *    -  a HTMLTableRowElement instance
    *    -  a AdminLib.widget.Datatable.Row instance
    *    -  a number
    *
    * @param {AdminLib.widget.Datatable.ItemLike} index
    * @param {AdminLib.EqualFunction}             [equal]
    * @returns {Object}
    * @public
    *
    */
   Datatable.prototype.getItem                   = function getItem(item, equal) {

      var /** @type {number} */ index;

      if (item instanceof HTMLTableRowElement) {
         index = parseInt(item.getAttribute('data-index'));
         return this.getItem(index);
      }
      else if (item instanceof AdminLib.widget.Datatable.Row)
         return item.getItem();
      else if (typeof(item) === 'number') {
         return this.data[item];
      }
      else if (!(item instanceof Object))
         return undefined;

      // If there is no equal function,
      // then we check that the item belongs to the data
      //    If not, then we return undefined
      //    If yes, then we return the item
      if (!equal)
         return this.data.indexOf(item) !== -1 ? item : undefined;


      if (typeof(equal) === 'string') {

         // If the equal parameter is a string, then the equality
         // will be made by comparing attributes
         for(dataItem of this.data) {

            if (dataItem[equal] === item[equal])
               return dataItem;

         }

      }
      else if (typeof(equal) === 'function') {
         // If we have an equal function
         // then we search for the first equal item in the data list
         for(dataItem of this.data) {

            if (equal(dataItem, item))
               return dataItem;

         }
      }

      return undefined;
   };

   /**
    * Return the label of the given item.
    * If a "getItemLabel" has been provided during the creation of the datatable,
    * then it will be this function that will be used. If nothing was provided, then
    * the function will first search for theses attribute (in order) :
    *    -  "label"
    *    -  "name"
    *    -  "code"
    *    -  "id"
    * @method AdminLib.widget.Datatable#getItemLabel
    * @param {Item} item
    * @returns {string}
    * @public
    */
   Datatable.prototype.getItemLabel              = function getItemLabel(item) {

      if (this.getItemLabelFunction !== undefined) {
         return this.getItemLabelFunction(item);
      }

      return AdminLib.coalesce(item.label, item.name, item.code, item.id);
   };

   /**
    *
    * Return the row corresponding to the given item.
    * If item is undefined, then will return the creation row if creation is enabled (overwise, return undefined).
    *
    * About Equal :
    *    If provided, then items will be search using this function.
    *    If the item parameter is undefined, a Row or a number, then it will not be used.
    *
    * @param {AdminLib.widget.Datatable.ItemLike} [item]
    * @param {AdminLib.Equal}                     [equal]
    * @returns {AdminLib.widget.Datatable.Row}
    * @public
    */
   Datatable.prototype.getRow                    = function getRow(item, equal) {

      var /** @type {number} */ index;

      if (item instanceof AdminLib.widget.Datatable.Row) {

         // Checking that the row belongs to the datatable
         if (item.parent !== this)
            return undefined;

         return item;
      }

      else if (item === undefined) {
         if (!this.creationHandler)
            return undefined;

         return this.creationHandler.getRow();
      }
      
      if (typeof(item) === 'number')
         index = item;
      else
         index = this.getIndex(item, equal);

      if (index === undefined)
         return undefined;

      return this.rows[index];
   };

   /**
    * Return the row action corresponding to the parameter
    * Note : the "delete" row action is not queryable
    *
    * @method AdminLib.widget.Datatable#getRowAction
    * @param {number|string|RowAction} rowAction
    * @returns {RowAction}
    * @public
    */
   Datatable.prototype.getRowAction              = function getRowAction(rowAction) {

      rowAction = this.rowActions.get(rowAction);

      if (rowAction === INTERNAL_CODES.deleteAction)
         return undefined;

      return rowAction;
   };

   /**
    * Return all row actions.
    * Note : the "delete" row action will not be returned.
    * @method AdminLib.widget.Datatable#getRowActions
    * @returns {RowAction[]}
    */
   Datatable.prototype.getRowActions             = function getRowActions() {
      return this.rowActions.filter(function(rowAction) {
         return rowAction.code !== INTERNAL_CODES.deleteAction;
      }.bind(this));
   };

   /**
    *
    * @param {number|code} info
    * @returns {*}
    */
   Datatable.prototype.getRowButton              = function getRowButton(info) {
      return this.rowButtons.get(info);
   };

   /**
    * Return all row buttons.
    * Note : the "delete" row action will not be returned.
    * @method AdminLib.widget.Datatable#getRowActions
    * @returns {RowAction[]}
    */
   Datatable.prototype.getRowButtons             = function getRowButtons() {
      return this.rowButtons.slice(0);
   };

   /**
    * Return the list of all selected items. The order of the items is not guaranteed.
    *
    * @method AdminLib.widget.Datatable#getSelectedItems
    * @returns {Array.<Item>}
    * @public
    */
   Datatable.prototype.getSelectedItems          = function getSelectedItems() {
      return this.selectedItems.slice(0);
   };

   /**
    * Return the table action corresponding to the informations.
    * If the parameter is a string, then return the table action whose code match the parameters.
    * If the parameter is a number, then it will be used as index.
    *
    * @method AdminLib.widget.Datatable#getTableAction
    * @param {string|number} tableAction
    * @public
    */
   Datatable.prototype.getTableAction            = function getTableAction(tableAction) {
      tableAction = this.tableActions.get(tableAction);

      if (tableAction.internal)
         return undefined;

      return tableAction;
   };

   /**
    * Return the list of all table actions
    * @method AdminLib.widget.Datatable#getTableActions
    * @return {TableAction[]}
    * @public
    */
   Datatable.prototype.getTableActions           = function getTableAction() {
      return this.tableActions.filter(function(tableAction) {return tableAction.internal});
   };

   /**
    * Return the list of table fields
    * @returns {Field[]}
    * @public
    */
   Datatable.prototype.getTableFields            = function getTableFields() {
      return this.tableFields.slice(0);
   };

   /**
    * @method AdminLib.widget.Datatable#getTableDOM
    * @returns {HTMLElement}
    * @internal
    */
   Datatable.prototype.getTableDOM               = function getTableDOM() {
      return this.tableDOM;
   };

   /**
    * Proceed the data provided by the server so that the can be used in the listItem template
    *
    * @method AdminLib.widget.Datatable#getTemplateData
    * @param {Item[]} [items] Items to user to create the template data. Theses items should exists in this.data. If no items provided, then use this.data items.
    * @returns {Object}
    * @private
    */
   Datatable.prototype.getTemplateData           = function getTemplateData(items) {

      var /** @type {Object}                         */ item
        , /** @type {AdminLib.widget.Datatable.Row[]} */ rows
        , /** @type {Array[]}                        */ templateData;

      rows = AdminLib.coalesce(item, this.data)
               .map(
                  function(item) {
                     return this.getRow(item)
                  }.bind(this));

      templateData = { bordered     : this.style.bordered
                     , creatable    : this.creatable
                     , createFormID : this.createFormID
                     , domID        : this.getDomID()
                     , editable     : this.isEditable()
                     , expandable   : this.extraFields.length > 0 || this.childRows.length > 0
                     , tableFields  : this.tableFields.slice(0)
                     , id           : this.id
                     , index        : this.index
                     , items        : rows.map(function(row) {return row.getTemplateData()})
                     , manualOrder  : this.manualOrder
                     , rowActions   : this.rowActions.slice(0)
                     , rowButtons   : this.rowButtons.map(function() { return {} }) // this row buttons is here for building empty TH corresponding to row button column
                     , storeName    : this.storeName
                     , striped      : this.style.striped
                     , tableClasses : this.tableClasses};

      return templateData;
   };

   /**
    * Return the list of visible row actions
    * @returns {Array.<AdminLib.widget.Datatable.RowAction>}
    * @private
    */
   Datatable.prototype.getVisibleRowActions      = function getVisibleRowActions() {

      return this.rowActions.filter(function(rowAction) {
         return rowAction.isVisible();
      });

   };

   /**
    *
    * @method AdminLib.widget.Datatable#handleActionResult
    * @param {pActionResult} actionResult
    * @return {Promise.<boolean>} Indicate if the action result was successful (true) or not (false)
    * @private
    */
   Datatable.prototype.handleActionResult        = function handleActionResult(actionResult) {



   };

   /**
    * Indicate if the datatable has extrafields or not.
    * @returns {boolean} True : the datatable has extra fields. False otherwise.
    * @public
    */
   Datatable.prototype.hasExtraFields            = function hasExtraFields() {
      return this.extraFields.length > 0;
   };

   /**
    *
    * If "equal" parameter is defined, then the item will be search by comparing the items with this function
    *
    * The equal parameter will not be used if the item is :
    *    -  a HTMLTableRowElement instance
    *    -  a AdminLib.widget.Datatable.Row instance
    *    -  a number
    *
    * @param {AdminLib.widget.Datatable.Field|string|number|HTMLTableCellElement} field
    * @param {AdminLib.widget.Datatable.ItemLike} row
    * @param {AdminLib.EqualFunction}             [equal]
    * @returns {boolean}
    * @internal
    */
   Datatable.prototype.hasCell                   = function hasCell(field, row, equal) {

      var /** @type {Map} */ mapRow;

      if (!(field instanceof AdminLib.widget.Datatable.Field))
         field = this.getField(field);

      if (!(row instanceof AdminLib.widget.Datatable.Row))
         row = this.getRow(row, equal);

      mapRow = this.mapCell.get(row);

      if (mapRow === undefined)
         return false;

      return mapRow.has(field);
   };

   /**
    * Indicate if the items are editable or not.
    * Items are editable if edit informations has been provided
    *
    * @method AdminLib.widget.Datatable#isEditable
    * @returns {boolean}
    * @public
    */
   Datatable.prototype.isEditable                = function isEditable() {
      return this.editAction !== undefined;
   };

   /**
    * Indicate if a row is expandable.
    * @returns {boolean}
    */
   Datatable.prototype.isRowExpandable           = function isRowExpandable() {
      return this.extraFields.length > 0 || this.childRows.length > 0;
   };

   /**
    *
    * @returns {boolean}
    * @public
    */
   Datatable.prototype.isRowSelectorVisible      = function isRowSelectorVisible() {
      if (this.keepSelectable !== undefined)
         return this.keepSelectable;
      else
         return this.getVisibleRowActions().length > 0;
   };

   /**
    *
    * @returns {boolean}
    * @public
    */
   Datatable.prototype.isTableBuilt              = function isTableBuild() {
      return this.tableDOM !== undefined;
   };

   /**
    *
    * @param {Item} item
    * @param {*}    key
    * @param {*}    value
    * @returns {*}
    * @private
    */
   Datatable.prototype.mapItem                   = function mapItem(item, key, value) {
      var /** @type {Map} */ map;

      row = this.getRow(item);
      map = this.mapItems.get(row);

      if (arguments.length === 2) {

         if (map === undefined)
            return undefined;

         return map.get(key);
      }

      // If there is three parameters, then we set the key
      if (arguments.length === 3) {

         if (!map && value !== undefined) {
            map = new Map();
            this.mapItems.set(row, map);
         }

         // If the value is undefined, then the key is removed from the map
         if (value === undefined) {
            map.delete(key);

            // If the map is empty, then we remove the item from mapItems.
            if (map.size === 0)
               this.mapItems.delete(item);
         }
         else
            map.set(key, value);
      }
   };

   /**
    * Function fired when a click is perform on the table.
    * The idea it's to have only one listener that will fire other listeners depending on the target of the event
    *
    * @method AdminLib.widget.Datatable#onclick
    * @param {Event} event
    * @private
    */
   Datatable.prototype.onclick                   = function onclick(event) {

      var /** @type {string}                       */ dataType
        , /** @type {string}                       */ handler
        , /** @type {boolean}                      */ preventDefault
        , /** @type {AdminLib.widget.Datatable.Row} */ row;

      handler = $(event.target).closest('[data-adminlib-handler]').attr('data-adminlib-handler');

      // Dispatching events to there handlers
      switch(handler) {
         case 'field':
            return AdminLib.widget.Datatable.Field.onclick(event, this);

         case 'row':
            return AdminLib.widget.Datatable.Row.onclick(event, this);
      }

      // From now, we handle only datatable level events

      dataType = $(event.target).closest('[data-adminlib-type]').attr('data-adminlib-type');

      // Handling : Checkboxes at row level

      preventDefault = true;

      switch(dataType) {

         case 'checkbox':
            this.onCheckboxClick(event);
            preventDefault = false;
            break;

      }

      event.stopImmediatePropagation();

      if (preventDefault)
        event.preventDefault();

      return false;
   };

   /**
    * Function fired when a click is performed on the checkbox used to select the checkbox at table level
    * @param event
    */
   Datatable.prototype.onCheckboxClick           = function onCheckboxClick(event) {

      var /** @type {AdminLib.Event}            */ event
        , /** @type {AdminLib.Event.Parameters} */ eventParameters
        , /** @type {string}                   */ eventType;

      eventParameters = { cancelable : false
                        , target     : this};

      // Checkbox at table level

      if (event.target.checked) {
         eventType = Datatable.event.selectAllItems;
         this.selectAllItems();
      }
      else {
         eventType = Datatable.event.unselectAllItems;
         this.unselectAllItems();
      }

      $('input[type="checkbox"]').prop('checked', event.target.checked);

      event = new AdminLib.Event(eventType, eventParameters);
      this.dispatchEvent(event);

      this.updateRowActionSelect();
   };

   /**
    *
    * @param {Event} event
    * @private
    */
   Datatable.prototype.onKeyPress_createRow      = function onKeypress_createRow(event) {

      if (event.keyCode !== 13)
         return;

      this.createAction.saveButton.execute();
   };

   /**
    * Display an error notification
    * @param {string}   title
    * @param {string}   message
    * @param {function} onclick
    * @public
    */
   Datatable.prototype.notifyError               = function notifyError(title, message, onclick) {
      return AdminLib.notify.error ( { title   : title
                                    , message : message
                                    , onclick : onclick});
   };

   /**
    * Display an informative notification
    * @param {string}   title
    * @param {string}   message
    * @param {function} onclick
    * @public
    */
   Datatable.prototype.notifyInfo             = function notifyInfo(title, message, onclick) {
      return AdminLib.notify.info ( { title   : title
                                   , message : message
                                   , onclick : onclick});
   };

   /**
    * Display a success notification
    * @param {string}   title
    * @param {string}   message
    * @param {function} onclick
    * @public
    */
   Datatable.prototype.notifySuccess             = function notifySuccess(title, message, onclick) {
      return AdminLib.notify.success ( { title   : title
                                      , message : message
                                      , onclick : onclick});
   };

   /**
    * Display a warning notification
    * @param {string}   title
    * @param {string}   message
    * @param {function} onclick
    * @public
    */
   Datatable.prototype.notifyWarning             = function notifyWarning(title, message, onclick) {
      return AdminLib.notify.warning ( { title   : title
                                      , message : message
                                      , onclick : onclick});
   };

   /**
    * Redraw the datatable.
    *
    * If no "parameters" object is provided, then the default values will be :
    *    - fixedRows: true
    *    - redraw   : true
    *
    * @param {AdminLib.widget.Datatable.redrawParameters} [parameters]
    * @public
    */
   Datatable.prototype.redraw                    = function redraw(parameters) {

      var /** @type {Object}                       */ cell
        , /** @type {number}                       */ i
        , /** @type {Item}                         */ item
        , /** @type {AdminLib.widget.Datatable.Row} */ row;

      if (parameters === undefined)
         parameters = { draw      : true
                      , fixedRows : true };

      // Draw : fixedRows
      if (parameters.fixedRows) {
         for(i in this.fixedRows) {

            item = this.fixedRows[i];
            row  = this.getRow(item);

            cell = row.getDatatableCell ( /* row */ this.fixedRowField);

            cell.node().dataset.order = 1;
            cell.invalidate();
         }
      }

      if (parameters.draw)
         this.datatable.draw();
   };

   /**
    * Realease the fixed row
    *
    * Param: equal
    * If "equal" parameter is defined, then the item will be search by comparing the items with this function
    * The equal parameter will not be used if the item is :
    *    -  a HTMLTableRowElement instance
    *    -  a AdminLib.widget.Datatable.Row instance
    *    -  a number
    *
    * Param: redraw
    *
    * The redraw will be executed only if the row wasn't already released.
    * To redraw manually the fixed rows, use the redrawFixedRows method
    *
    * @param {AdminLib.widget.Datatable.ItemLike} row
    * @param {AdminLib.EqualFunction}             [equal]
    * @param {boolean}                           [redraw=true] If true, then the datatable will be redraw to apply change
    * @returns {AdminLib.widget.Datatable}
    * @public
    */
   Datatable.prototype.releaseRow                = function releaseRow(row, equal, redraw) {

      var /** @type {Object} */ cell
        , /** @type {number} */ index
        , /** @type {Item}   */ item;

      redraw = AdminLib.coalesce(redraw, true);

      item = this.getItem(row);

      if (item === undefined)
         return;

      index = this.fixedRows.indexOf(item);

      if (index === -1)
         return;

      // Removing the row from the fixed row
      this.fixedRows.splice(index, 1);

      // Updating the DOM of the fixed ROW.
      row = this.getRow(row);

      cell = row.getDatatableCell ( /* row */ this.getFixedRowField());

      cell.node().dataset.order = 0;

      cell.invalidate();

      if (redraw)
         this.redraw ( { draw     : true
                       , fixedRows: true });

   };

   /**
    * Remove the given item from the table.
    * Note that this function DOESN'T CALL the "deleteFunction"
    *
    * If "equal" parameter is defined, then the item will be search by comparing the items with this function
    *
    * The equal parameter will not be used if the item is :
    *    -  a HTMLTableRowElement instance
    *    -  a AdminLib.widget.Datatable.Row instance
    *    -  a number
    *
    * @param {Item|HTMLTableRowElement|number} item
    * @param {boolean}                         [redraw=true] If true, then the table will be redraw after removing the item
    * @param {AdminLib.EqualFunction}           [equal]
    * @public
    */
   Datatable.prototype.removeItem                = function removeItem(item, redraw, equal) {

      var /** @type {Field}                        */ field
        , /** @type {number}                       */ indexOf
        , /** @type {AdminLib.widget.Datatable.Row} */ row;

      redraw = AdminLib.coalesce(redraw, true);

      row = this.getRow(item, equal);

      if (row === undefined)
         throw "Item not found in the list of existing items. You have to return the same object that have been deleted";

      row.remove();

      // removing from this.data
      indexOf = this.data.indexOf(item);
      this.data[indexOf] = undefined;
      this.rows[indexOf] = undefined;
         // Note : we don't delete the data because this would change every index

      // removing from this.selectedItems
      indexOf = this.selectedItems.indexOf(item);
      this.selectedItems.splice(indexOf, 1);

      // Notifying each fields
      for(field of this.fields) {
         field.clearItemInformations(item);
      }

      if (redraw)
         this.datatable.draw();
   };

   /**
    * Remove the loader of the datatable
    * @public
    */
   Datatable.prototype.removeLoader              = function removeLoader() {
      this.toggleLoader(false);
   };

   /**
    * Remove the given row action;
    * @todo Handle "selectable" property
    * @param {number|string|RowAction} rowAction
    * @returns {RowAction}
    * @public
    */
   Datatable.prototype.removeRowAction           = function removeRowAcation(rowAction) {

      rowAction = this.getRowAction(rowAction);

      if (rowAction.code === INTERNAL_CODES.deleteAction)
         throw 'You can\'t remove the "delete" row action';

      rowAction = this.rowActions.remove(rowAction);
      rowAction.remove();

      this.updateActionBar();

      return rowAction;
   };

   /**
    * Remove the given table action
    * @param {string|number|TableAction} tableAction
    * @returns {TableAction}
    * @public
    */
   Datatable.prototype.removeTableAction         = function removeTableAction(tableAction) {

      tableAction = this.tableActions.get(tableAction);

      if (tableAction === this.createAction.createButton)
         throw 'You can\'t remove the "create" table button';

      tableAction = this.tableActions.remove(tableAction);
      tableAction.remove();

      this.updateActionBar();

      return tableAction;
   };

   /**
    *
    * Return the row corresponding to the given item.
    * If item is undefined, then will return the creation row if creation is enabled (overwise, return undefined).
    *
    * About Equal :
    *    If provided, then items will be search using this function.
    *    If the item parameter is undefined, a Row or a number, then it will not be used.
    *
    * @param {AdminLib.widget.Datatable.ItemLike} item
    * @param {AdminLib.Equal}                     [equal]
    * @public
    */
   Datatable.prototype.scrollTo                  = function scrollTo(item, equal) {
      var /** @type {AdminLib.widget.Datatable.Row} */ row;

      row = this.getRow(item, equal);

      if (row === undefined)
         throw 'Item not found !';

      row.scrollTo();
   };

   /**
    * Select all rows
    * This function WILL NOT trigger the "selectAllItems" event
    * @param {boolean} [force=false] If true, then event non-selectable rows will be selected
    * @public
    */
   Datatable.prototype.selectAllItems            = function selectAllItems(force) {

      var /** @type {AdminLib.widget.Datatable.Row} */ row;

      force = AdminLib.coalesce(force, false);

      for(row of this.rows) {

         if (!row.isSelectable() && !force)
            continue;

         row.select(force);
      }

   };

   /**
    * Select the given item.
    * Note : if the table has no row actions, then nothing is done (because there is no checkboxes).
    * @param {Item}          item
    * @param {AdminLib.Equal} [equal] Function to use to find the item to select
    * @public
    */
   Datatable.prototype.selectItem                = function selectItem(item, equal) {
      var /** @type {AdminLib.widget.Datatable.Row} */ row;

      row = this.getRow(item, equal);

      if (row === undefined)
         throw 'Item dont exists in the table';

      row.select();
   };

   /**
    *
    * This function is executed by the selected/unselected row.
    * Two ways are possible to select an item/row using the API (the same is for the unselection) :
    *
    *   1. Datatable.prototype.selectItem
    *   2. Row.prototype.select
    *
    * The 1. will call the second function. This means that a third function, at datatable level, must handle
    *
    *   - the Row.prototype.selectItem function is called. This function can also be called by the Datatable.prototype.selectItem function.
    *   - the row object will handle the selection
    *   - the datatable will add the item to the list of selected item.
    *
    *
    * This function handle the last step : it will add the
    *
    * @param {AdminLib.widget.Datatable.Row} row
    * @param {boolean} selected
    * @internal
    */
   Datatable.prototype.setSelectedItem           = function selectRow(row, selected) {

      var /** @type {number} */ indexOf;

      if (selected)
         this.selectedItems.push(row.getItem());

      else {

         indexOf = this.selectedItems.indexOf(row.getItem());
         this.selectedItems.splice(indexOf, 1);

      }

   };

   /**
    * @param {string} sizeClass
    * @public
    */
   Datatable.prototype.setSizeClass              = function setSizeClass(sizeClass) {
      var /** @type {string} */ oldSizeClass;

      oldSizeClass = this.sizeClass;
      this.sizeClass = sizeClass;

      if (!this.dom)
         return;

      this.dom.classList.remove(oldSizeClass);
      this.dom.classList.add(this.sizeClass);
   };

   /**
    *
    * @param {string}  style
    * @param {boolean} value
    * @public
    */
   Datatable.prototype.setStyle                  = function setStyle(style, value) {

      if (style === 'striped') {
         this.style.striped = AdminLib.coalesce(value, true);

         if (this.tableDOM)
            this.tableDOM.classList.toggle('table-striped', value);
         
      }


   };

   /**
    *
    * @param {boolean} [loading]
    * @public
    */
   Datatable.prototype.toggleLoader              = function toggleLoading(loading) {

      loading = !!AdminLib.coalesce(loading, !this.loading);

      if (this.loading === loading)
         return;

      this.loading = loading;

      if (!this.dom)
         return;

      AdminLib.Loader.toggle(this.dom, this.loading);
   };

   /**
    * Unselect all rows
    * This function WILL NOT trigger the "selectAllItems" event
    * @public
    */
   Datatable.prototype.unselectAllItems          = function unselectAll() {

      for(var row of this.rows) {
         row.unselect();
      }

   };

   /**
    *
    * @param {Item}          item
    * @param {AdminLib.Equal} equal Function to use to find the item to search
    * @public
    */
   Datatable.prototype.unselectItem              = function unselectItem(item, equal) {
      var /** @type {AdminLib.widget.Datatable.Row} */ row;

      row = this.getRow(item, equal);

      if (row === undefined)
         throw 'Item dont exists in the table';

      row.unselect();
   };

   /**
    * Update the value of the given item by the new one.
    * The public version of this function is on Row class.
    * @param {AdminLib.widget.Datatable.Row} row
    * @param {Item}                         newItem
    * @param {Item}                         oldItem
    * @param {boolean}                      redraw
    * @internal
    */
   Datatable.prototype.updateItem                = function updateItem(row, newItem, oldItem, redraw) {

      var /** @type {number} */ index;

      this.data[row.getIndex()] = newItem;

      // Updating the item in the fixedRows list
      index = this.fixedRows.indexOf(oldItem);

      if (index !== -1) {
         this.fixedRows[index] = newItem;
      }

      this.datatable.draw();
   };

   /**
    *
    * @returns {boolean}
    */
   Datatable.prototype.updateActionBar           = function updateActionBar() {

      var /** @type {boolean} */ hideActionBar
        , /** @type {boolean} */ hideRowActions;  // Indicate if the row action select box should be hidden or not

      if (!this.tableDOM)
         return;

      // Row action listbox will be hidden if there is no row actions.
      hideRowActions = this.getVisibleRowActions().length === 0;

      // Action bar will be hidden if there is no row actions nor table actions
      hideActionBar  = hideRowActions && !this.tableActions.length;

      if (this.actionBars.top)
         this.actionBars.top.classList.toggle('hide', hideActionBar || (!this.style.tableActions.top && !this.style.rowActions.top));

      if(this.actionBars.bottom)
         this.actionBars.bottom.classList.toggle('hide', hideActionBar || (!this.style.tableActions.bottom || !this.style.rowActions.bottom));

      if (this.rowActionBars.top)
         this.rowActionBars.top.classList.toggle('hide', hideRowActions || !this.style.rowActions.top);

      if (this.rowActionBars.bottom)
         this.rowActionBars.bottom.classList.toggle('hide', hideRowActions || !this.style.rowActions.bottom);

      return !hideActionBar;
   };

   /**
    *
    * Update the row selector.
    * The function will hide or show the row selector checkboxes.
    *
    * @internal
    */
   Datatable.prototype.updateRowSelector         = function updateRowSelector() {

      if (!this.tableDOM)
         return;

      this.datatableRowSelector.visible(this.isRowSelectorVisible());
   };

   /**
    *
    * @returns {boolean}
    * @private
    */
   Datatable.prototype.updateTableActionBar      = function tableActionBar() {

      if (!this.updateActionBar())
         return false;

      if (!this.tableActions.length)
         return false;
   };

   /**
    * Update the row level actions selectbox.
    * This function is triggered when an item is selected/unselected.
    * It will handle the "disable" state of the listbox.
    * @internal
    */
   Datatable.prototype.updateRowActionSelect     = function updateRowActionSelect() {
      var /** @type {boolean} */ disabled;

      if (!this.tableDOM)
         return;

      disabled = this.selectedItems.length === 0;

      // Disabling submit button
      AdminLib.list.forEachKey(this.rowActionBars,
         function(rowActionBar) {

            var /** @type {HTMLSelectElement} */ listBox;

            listBox = rowActionBar.querySelector('select#rowActions');

            if (disabled) {
               // Submit button
               rowActionBar.querySelector('button#rowActionsSubmit').disabled = true;

               // listbox
               listBox.disabled = true;
               listBox.querySelector('option:first-child').selected = true;
            }
            else
               listBox.disabled = false;

         });

   };

   /**
    *
    * @param {Item}                item                   Item BEFORE edition
    * @param {boolean}             [fieldValidation=true] Indicate if the field should also validate the item or not
    * @param {function}            [validationFunction]   Function to use to validate the values
    * @return {Promise.<ActionValidationResult>}  The promise return the result of the validation. true : all validations was successful. False otherwise.
    * @public
    */
   Datatable.prototype.isItemValide              = function isItemValide(item, fieldValidation, validationFunction) {

      var /** @type {Promise.<boolean[]>} */ fieldValidationPromise
        , /** @type {Promise}             */ promise
        , /** @type {Promise.<boolean[]>} */ promises
        , /** @type {pValidationResult}   */ validationResult;

      fieldValidation = AdminLib.coalesce(fieldValidation, true);

      // Validating each fields
      if (fieldValidation) {

         promises = [];

         for(var field of this.fields) {
            promise = field.validate(item);
            promises.push(promise);
         }

      }
      else {
         promises = [Promise.resolve(true)];
      }

      fieldValidationPromise = Promise.all(promises).then(function(results) {

         for(var result of results) {
            if (!result)
               return { result  : Action.RESPONSE_TYPE.error
                      , silent  : true };
         }

         return {result  : AdminLib.Action.RESPONSE_TYPE.success};
      });

      // Validating at item level
      if (validationFunction === undefined)
         return fieldValidationPromise;

      validationResult = validationFunction(item);

      if (validationResult === undefined)
         throw 'Invalid validation result';

      validationResult = validationResult instanceof Promise ? validationResult : Promise.resolve(validationResult);

      return promise;
   };

   /**
    *
    * @param {AdminLib.widget.Datatable.Parameters.Delete[]} parametersList
    * @returns {AdminLib.widget.Datatable.Parameters.Delete}
    */
   Datatable.coalesceDeleteParameters            = function coalesceDeleteParameters(parametersList) {

      var /** @type {AdminLib.widget.Datatable.Parameters.Delete} */ coalescedParameters
        , /** @type {AdminLib.widget.Datatable.Parameters.Delete} */ defaultParameters
        , /** @type {boolean}                                    */ deleteEnabled;

      deleteEnabled = undefined;

      parametersList = AdminLib.list.filterUndefined(parametersList).map(function(parameters) {

         if (deleteEnabled === undefined)
            deleteEnabled = parameters !== false;

         if (typeof(parameters) === 'function')
            parameters = {handler : parameters}

         return parameters;
      });

      if (parametersList.length === 0 || !deleteEnabled)
         return false;

      defaultParameters = { label : 'Delete' };

      parametersList.push(defaultParameters);

      coalescedParameters = AdminLib.Action.Button.coalesceParameters(parametersList);

      coalescedParameters.handler = AdminLib.coalesceAttribute('handler', parametersList);

      return coalescedParameters;
   };

   /**
    *
    * @param {AdminLib.widget.Datatable.EditLike[]} parametersList
    * @returns {AdminLib.widget.Datatable.Edit|boolean}
    */
   Datatable.coalesceEditParameters              = function coalesceEditParameters(parametersList) {

      var /** @type {AdminLib.widget.Datatable.Edit}     */ coalescedParameters
        , /** @type {AdminLib.Parameters.Button[]}       */ editButtonList
        , /** @type {AdminLib.widget.Datatable.EditLike} */ parameters;

      parametersList = parametersList
         .filter(function(parameters) {
            return parameters !== undefined && parameters !== false;
         })
         .map(function(parameters) {

            switch(typeof(parameters)) {

               case 'function':
                  return {handler : parameters};

               case 'boolean':
                  return {};

               case 'string':
                  return {editButton: {label: parameters}};

            }

            return parameters;
         });

      if (parametersList.length === 0)
         return false;

      editButtonList = AdminLib.list.attribute('editButton', parametersList, undefined, false);

      editButtonList.push({ class   : 'default btn-xs purple'
                          , icon    : 'fa fa-edit'
                          , label   : 'Edit'});

      coalescedParameters = { editButton : AdminLib.Action.Button.coalesceButtonParameters(editButtonList)
                            , enabled    : AdminLib.coalesceAttribute('enabled', parametersList, true)
                            , handler    : AdminLib.coalesceAttribute('handler', parametersList) };

      return coalescedParameters;
   };

   /**
    *
    * @param {AdminLib.widget.Datatable.Parameters[]} parametersList
    * @returns {AdminLib.widget.Datatable.Parameters}
    */
   Datatable.coalesceParameters                  = function coalesceParameters(parametersList) {

      var /** @type {AdminLib.widget.Datatable.Parameters}    */ coalescedParameters;

      parametersList = AdminLib.coalesce(parametersList, []);

      coalescedParameters = { childRows           : AdminLib.coalesceAttribute('childRows'          , parametersList, [])
                            , create              : Datatable.CreationHandler.coalesceParameters(AdminLib.list.attribute('create', parametersList, undefined, false))
                            , data                : AdminLib.coalesceAttribute('data'               , parametersList, []).slice(0)
                            , 'delete'            : Datatable.coalesceDeleteParameters(AdminLib.list.attribute('delete', parametersList, undefined, false))
                            , edit                : Datatable.coalesceEditParameters(AdminLib.list.attribute('edit', parametersList, undefined, false))
                            , extraFields         : AdminLib.coalesceAttribute('extraFields'        , parametersList)
                            , fields              : AdminLib.coalesceAttribute('fields'             , parametersList, [])
                                                      .map( function(parametersList) {
                                                               return Field.coalesceParameters([parametersList]);
                                                            })
                            , filter              : AdminLib.coalesceAttribute('filter'             , parametersList)
                            , fixOnSelect         : AdminLib.coalesceAttribute('fixOnSelect'        , parametersList, false)
                            , getItemLabel        : AdminLib.coalesceAttribute('getItemLabel'       , parametersList)
                            , getRowClassFunction : AdminLib.coalesceAttribute('getRowClassFunction', parametersList)
                            , initialOrder        : AdminLib.coalesceAttribute('initialOrder'       , parametersList, true)
                            , language            : AdminLib.coalesceAttribute('language'           , parametersList, {})
                            , lengthMenu          : AdminLib.coalesceAttribute('lengthMenu'         , parametersList, [10, 25, 50, 100]).slice(0)
                            , link                : AdminLib.coalesceAttribute('link'               , parametersList)
                            , loading             : AdminLib.coalesceAttribute('loading'            , parametersList, true)
                            , manualOrder         : AdminLib.coalesceAttribute('manualOrder'        , parametersList, false)
                            , model               : AdminLib.coalesceAttribute('model'              , parametersList)
                            , pageLength          : AdminLib.coalesceAttribute('pageLength'         , parametersList, 10)
                            , paging              : AdminLib.coalesceAttribute('paging'             , parametersList, true)
                            , rowActions          : AdminLib.coalesceAttribute('rowActions'         , parametersList, [])
                                                      .map( function(parametersList) {
                                                               return RowAction.coalesceParameters([parametersList]);
                                                            })
                            , rowButtons          : AdminLib.coalesceAttribute('rowButtons'         , parametersList, [])
                                                      .map( function(parametersList) {
                                                               return RowAction.coalesceParameters([parametersList]);
                                                            })
                            , rowValidation       : AdminLib.coalesceAttribute('rowValidation'      , parametersList)
                            , searchFields        : AdminLib.coalesceAttribute('searchFields'       , parametersList)
                            , selectable          : AdminLib.coalesceAttribute('selectable'         , parametersList)
                            , selectedItems       : AdminLib.coalesceAttribute('selectedItems'      , parametersList, []).slice(0)
                            , sizeClass           : AdminLib.coalesceAttribute('sizeClass'          , parametersList, 'col-md-12')
                            , style               : Datatable.coalesceStyleParameters(AdminLib.list.attribute('style', parametersList, undefined, false))
                            , tableActions        : AdminLib.coalesceAttribute('tableActions'       , parametersList, [])
                                                      .map( function(parametersList) {
                                                               return TableAction.coalesceParameters([parametersList]);
                                                            })
                            , tableClasses        : AdminLib.coalesceAttribute('tableClasses'       , parametersList, [])
                            , tableFields         : AdminLib.coalesceAttribute('tableFields'        , parametersList)
                            , validation          : AdminLib.coalesceAttribute('validation'         , parametersList) };

      if (coalescedParameters.link)
         coalescedParameters.link = AdminLib.widget.Datatable.Link.coalesceParameters([coalescedParameters.link]);

      if (coalescedParameters.model) {
         if (!(coalescedParameters.model instanceof AdminLib.Model))
            coalescedParameters.model = AdminLib.model(coalescedParameters.model);
      }

      if (typeof(coalescedParameters.tableClasses) === 'string')
         coalescedParameters.tableClasses = coalescedParameters.tableClasses.split(' ');
      else
         coalescedParameters.tableClasses = coalescedParameters.tableClasses.slice(0);

      if (coalescedParameters.language.lengthMenu === undefined)
         coalescedParameters.language.lengthMenu = '_MENU_';

      return coalescedParameters;
   };

   /**
    *
    * @param {AdminLib.widget.Datatable.Parameters.Style[]} parameters
    * @returns {AdminLib.widget.Datatable.Parameters.Style}
    */
   Datatable.coalesceStyleParameters             = function coalesceStyle(parameters) {

      var /** {AdminLib.widget.Datatable.style.Parameters} */ coalescedParameters
        , rowActionList
        , tableActionList;

      parameters = AdminLib.coalesce(parameters, []);

      rowActionList   = AdminLib.list.attribute('tableActions', parameters, {});
      tableActionList = AdminLib.list.attribute('tableActions', parameters, {});

      coalescedParameters = { bordered        : AdminLib.coalesceAttribute('bordered', parameters, true)
                            , condensed       : AdminLib.coalesceAttribute('condensed', parameters, true)

                            , rowActions      : { top    : AdminLib.coalesceAttribute('top'   , rowActionList, true)
                                                , bottom : AdminLib.coalesceAttribute('bottom', rowActionList, false) }

                            , striped         : AdminLib.coalesceAttribute('striped', parameters, true)

                            , tableActions    : { top    : AdminLib.coalesceAttribute('top'   , tableActionList, true)
                                                , bottom : AdminLib.coalesceAttribute('bottom', tableActionList, false) } };

      return coalescedParameters;
   };

   /**
    * @param {HTMLElement} dom
    * @returns {string}
    * @internal
    */
   Datatable.getDomType                          = function getDomType(dom) {
      return $(dom).closest('[' + domAttributes.dataset.type.attribute + ']').attr(domAttributes.dataset.type.attribute);
   };

   Datatable._domAttributes = domAttributes;

   Datatable.rowSelectionTemplate =
         '<td id="' + domAttributes.id.rowSelector + '">'
      +     '<input data-adminlib-handler="row" ' + domAttributes.dataset.type.attribute + '="checkbox" data-index="{{index}}" type="checkbox" name="id[]">'
      +  '</td>';

   Datatable.POSITION                            = { TOP_LEFT      : {top    : true, left   : true}
                                                   , TOP_RIGHT     : {top    : true, right  : true}
                                                   , BOTTOM_LEFT   : {bottom : true, left   : true}
                                                   , BOTTOM_RIGHT  : {bottom : true, right  : true} };

   Datatable.event = { itemCreated      : 'AdminLib.widget.Datatable.event.itemCreated'
                     , itemDeleted      : 'AdminLib.widget.Datatable.event.itemDeleted'
                     , itemEdited       : 'AdminLib.widget.Datatable.event.itemEdited'
                     , orderChanged     : 'AdminLib.widget.Datatable.event.orderChanged'
                     , selectAllItems   : 'selectAllItems'
                     , selectItem       : 'selectItem'
                     , unselectAllItems : 'unselectAllItems'
                     , unselectItem     : 'unselectItem'};

   // ******************** TableAction ********************/

   var DATA_TYPE = {};

   DATA_TYPE[AdminLib.DATA_TYPE.DATE] = { formatValue  : function(value) { return moment(value).format('LL') }
                                       , getOrderValue : function(value) { return value.getTime() }};

   DATA_TYPE[AdminLib.DATA_TYPE.DATE] = { formatValue  :  function(value) { return moment(value).format('LLL') }
                                       , getOrderValue : function(value) { return value.getTime() }};

   /*

   Structure expected for datatableTemplate :

      [Root] :
         - {boolean}                         bordered    : Indicate if the table will have border (true) or not (false)
         - {boolean}                         condensed   : Indicate if the table should be condensed (true) or not (false).
         - {boolean}                         creatable   : Indicate whether (true) or not (false) new items can be created
         - {boolean}                         editable    : Indicate whether (true) or not (false) the rows are editable
         - {TableField[]}                    tableFields : List of fields to display
         - {string}                          formID      : ID of the create item forme
         - {number}                          id          : ID of the widget
         - {Item[]}                          items       : List of items to display. Each row will correspond to one item
         - {Array<RowLevelAction|undefined>} rowActions  : List of row level actions. An "undefined" value will be used as a separator
         - {Array<RowLevelButton>}           rowButtons  : List of buttons to add on each row
         - {boolean}                         striped     : Indicate if the rows should be striped (true) or not (false)

      Item :
         - {ItemField[]} fields     List of fields of the item. Fields should be in the same order than at table level
         - {number}      index      Index of the item. Should be unique
         - {string}      rowClasses List of classes to add at row level

      ItemField :
         - {boolean}     clicableCell  If true, then all the cell (not only the value) is clicable.
         - {string}      code          Code of the field. Will be used to create the "data-field" on the TD tag
         - {number}      fieldIndex    Index of the field. Will be used to create the "data-fieldID" attribute on the TD tag
         - {boolean}     nullable      If true, then the field allow empty value on edition mode
         - {boolean}     inputMode     If true, then the field will display an input box on edition mode
         - {string}      label         Label to display for the given field for the data
         - {string}      link          If defined : the field is a link. The "link" value will be used for href.
         - {boolean}     selectode     If true, then the field will display an select box on edition mode
         - {SelectItem}  selection     List of options to display in the select box on edition mode
         - {string}      textClasses   Classes to apply to the text (on the <span> or <a> tag).
         - {string}      type          Type of field.
         - {string}      value         Value to display.

      RowLevelAction :
         - {string} label  Label of the action
         - {string} id     ID of the action

      RowLevelButton :
         - {number} id    : ID of the button
         - {string} label : Label of the button
         - {string} class : Class of the button
         - {string} icon  : Class corresponding to the icon
         - {string} size  : Size of the column (should be a CSS value, such as "1px" or "10rem").

      SelectItem :
         - {string} value
         - {string} label

      TableField :
         - {string} class
         - {string} label
         - {string} code
   */

   /**
    * @namespace AdminLib.widget.Datatable~Template
    */
   var datatableCheckboxTemplate =
         '<input data-adminlib-handler="row"'
      +        ' ' + domAttributes.dataset.type.attribute + '="checkbox"'
      +        ' type="checkbox"'
      +        ' name="id[]'
      +        ' {{#selected}}checked{{/selected}}'
      +        ' {{^selectable}}disabled{{/selectable}}">';

   /**
    * @name AdminLib.widget.Datatable~Template.Cell
    * @typedef {Object}
    * @property {string} textClasses
    * @property {string} label
    */
   var datatableCellTemplate =
      '<span class="{{textClasses}}" id="value">{{label}}</span>';

   /**
    * @name AdminLib.widget.Datatable~Template.LinkableCell
    * @typedef {Object}
    * @mixes {AdminLib.widget.Datatable~Template.Cell}
    * @property {string} link
    */
   var datatableLinkableCellTemplate =
         '<a class="{{textClasses}}"'
      +    ' data-adminlib-handler="field"'
      +    ' ' + domAttributes.dataset.type.attribute + '="' + domAttributes.dataset.type.values.link + '"'
      +    ' id="value"'
      +    ' {{^linkEnabled}}disabled{{/linkEnabled}}'
      +    ' href="{{link}}">'
      +     '{{label}}'
      +  '</a>';

   /**
    * @name AdminLib.widget.Datatable~Template.Row
    * @typedef {Object}
    *
    * @property {boolean}                                        expandable
    * @property {number}                                         index
    * @property {AdminLib.widget.Datatable~Template.RowButton[]}  rowButtons
    * @property {string}                                         rowClasses List of classes to apply to the row
    * @property {boolean}                                        selectable
    * @property {AdminLib.widget.Datatable~Template.TableField[]} tableFields
    */

   /**
    * @name AdminLib.widget.Datatable~Template.TableField
    * @namespace
    * @typedef {Object}
    *
    * @mixes {AdminLib.widget.Datatable~Template.Cell}
    * @mixes {AdminLib.widget.Datatable~Template.LinkableCell}
    *
    * @property {boolean} clicableCell If true, then the cell will be clicable
    * @property {string}  code         Code of the field
    * @property {boolean} editable     If true, then the field will be styled as editable.
    * @property {number}  index        Index of the field into the table.fields list
    * @property {boolean} linkable     If true, then the content of the cell will be displayed as a link
    * @property {string}  orderValue   Order value of the field
    * @property {string}  searchValue  Search value to use for the field
    * @property {string}  type         Type of field (number, string). TODO : define this correctly
    *
    */

   var datatableRowTemplate =
      '<tr data-index="{{index}}"'
   +     ' class="{{rowClasses}} {{#selected}} active {{/selected}}"'

         // link enabled attribute
   +     ' {{#link}}' + domAttributes.dataset.link.enabled.attribute + '="{{#enabled}}' + domAttributes.dataset.true  + '{{/enabled}}'
                                                                     +  '"{{^enabled}}' + domAttributes.dataset.false + '{{/enabled}}"'
   +     '{{/link}}'

   +     ' data-row-type="row">'

         // Adding row selector
   +     '<td id="' + domAttributes.id.rowSelector + '">'
   +        datatableCheckboxTemplate
   +     '</td>'

         // Expand cell
   +     '{{#expandable}}'
   +        '<td id="expandCell">'
   +           '<span class="row-details row-details-close" data-adminlib-handler="row" data-adminlib-type="expand"></span>'
   +        '</td>'
   +     '{{/expandable}}'

         // Adding one cell by fields
   +     '{{#tableFields}}'
   +        '<td data-field="{{code}}"'
   +           'data-search="{{searchValue}}"'
   +           'data-order="{{orderValue}}"'
   +           ' ' + domAttributes.dataset.field.index        + '="{{index}}"'
   +           ' ' + domAttributes.dataset.editMode.attribute +  '="{{#editMode}}' + domAttributes.dataset.editMode.values.enabled  + '{{/editMode}}'
   +                                                               '{{^editMode}}' + domAttributes.dataset.editMode.values.disabled + '{{/editMode}}"'
   +           ' data-adminlib-handler="field"'

   +           ' ' + domAttributes.dataset.type.attribute + '="{{#clicableCell}}' + domAttributes.dataset.type.values.clicableCell + '{{/clicableCell}}'
   +                                                          '{{^clicableCell}}' + domAttributes.dataset.type.values.cell         + '{{/clicableCell}}"'

   +           ' {{#linkable}}'
   +           ' ' + domAttributes.dataset.link.enabled.attribute + '="{{#linkEnabled}}' + domAttributes.dataset.true  + '{{/linkEnabled}}"'
   +                                                                 '"{{^linkEnabled}}' + domAttributes.dataset.false + '{{/linkEnabled}}"'
   +           ' {{/linkable}}'

   +           'class="{{type}}'
   +                 '{{#editable}} editable {{/editable}}'
   +                 '{{#linkable}}{{^linkEnabled}} linkDisabled {{/linkEnabled}}{{/linkable}}'
   +                 '{{#clicableCell}} clicableCell {{/clicableCell}}">'

               // We display the values only if edit mode is disabled
               // If the edit mode is enabled, then we will have to add the edit DOM manually
//   +           '{{^editMode}}'
                  // If the cell is clicable, we just display the value
   +              '{{#clicableCell}}'
   +                 datatableCellTemplate
   +              '{{/clicableCell}}'

   +              '{{^clicableCell}}'
   +                 '{{#linkable}}'
   +                    datatableLinkableCellTemplate
   +                 '{{/linkable}}'

   +                 '{{^linkable}}'
   +                    datatableCellTemplate
   +                 '{{/linkable}}'
   +              '{{/clicableCell}}'
//   +           '{{/editMode}}'

   +        '</td>'
   +     '{{/tableFields}}'

         // Adding one cell by row buttons
   +     '{{#rowButtons}}'

   +        '<td>'
   +           '<button data-adminlib-handler="row"'
   +                  ' data-adminlib-type="rowButton"'
   +                  ' data-rowButtonIndex="{{index}}"'
   +                  ' style="{{style}}"'
   +                  ' {{^enabled}}disabled{{/enabled}}'
   +                  ' class="btn {{class}} {{sizeClass}}">'
   +              '<i class="{{icon}}"></i>'
   +              '{{label}}'
   +           '</button>'
   +        '</td>'

   +     '{{/rowButtons}}'

   +  '</tr>';

   var datatableTemplate =
      '<table class="table'
   +                 ' datatable'
   +                 ' table-hover'
   +                 ' flip-content'
   +                 ' no-footer'
   +                 '{{#tableClasses}} {{.}} {{/tableClasses}}'
   +                 '{{#condensed}} table-condensed{{/condensed}}'
   +                 '{{#bordered}} table-bordered{{/bordered}}'
   +                 '{{#striped}} table-striped{{/striped}}'
   +                 '{{#editable}} editable{{/editable}}'
   +                 '{{#creatable}} creatable{{/creatable}}" '
   +     'data-id="{{id}}"'
   +     'id="{{domID}}"'
   +     'style="width: 100%"'
   +     '{{#storeName}}data-resizable-columns-id ="{{storeName}}" {{/storeName}}'
   +     'data-adminlib-handler="datatable"'
   +     'data-adminlib-manualOrder="{{manualOrder}}"'
   +     'data-adminlib-type="datatable">'

   +     '<thead class="flip-content">'

            // Header line : column headers
   +        '<tr id="headerColumns">'

              // Row selector
   +          '<th id="' + domAttributes.id.rowSelector + '"'
   +              ' {{#storeName}}data-resizable-columns-id ="#" {{/storeName}}'
   +              ' aria-label="select all rows">'
   +             '<input ' + domAttributes.dataset.type.attribute + '="checkbox" type="checkbox" class="group-checkable">'
   +          '</th>'

              // Expand cell
   +          '{{#expandable}}'
   +             '<th id="rowExpander"></th>'
   +          '{{/expandable}}'

              // Table fields
   +          '{{#tableFields}}'
   +             '<th class="{{class}}'
   +                        ' {{#sizeClasses}} {{.}} {{/sizeClasses}}'
   +                        ' firstLetterUppercase"'
   +                 ' ' + domAttributes.dataset.field.index + '="{{index}}"'
   +                 ' {{#storeName}}data-resizable-columns-id ="{{storeName}}"{{/storeName}}'
   +                 ' aria-label="{{label}}">{{label}}</th>'
   +          '{{/tableFields}}'

   +          '{{#rowButtons}}'
   +             '<th style="width: {{size}}"'
   +                ' ' + domAttributes.dataset.rowButton.index + '="{{index}}"></th>'
   +          '{{/rowButtons}}'

   +       '</tr>'

         // Header line : creation
   +       '{{#creatable}}'
   +          '<tr class="hide" data-adminlib-type="createRow" id="createRow">'

                 //Checkbox cell
   +             '<th data-adminlib-type="rowActionCheckBox"'
   +                ' {{#storeName}}data-resizable-columns-id ="#" {{/storeName}}>'
   +             '</th>'

                  // Expand cell
   +              '{{#expandable}}'
   +                 '<th class="expand cell">'
   +                    '<span class="row-details row-details-close"></span>'
   +                 '</th>'
   +              '{{/expandable}}'

   +             '{{#tableFields}}'
   +                '<th data-field="{{code}}"'
   +                    domAttributes.dataset.field.index + '="{{index}}"'
   +                    ' {{#storeName}}data-resizable-columns-id ="{{storeName}}.create" {{/storeName}}'
   +                    ' {{#orderable}}data-order="{{orderValue}}"{{/orderable}}'
   +                    ' class="{{type}}">'

   +                   '<div class="" data-adminlib-type="fieldEditGroup">'

   +                      '{{#inputMode}}'
   +                         '<input data-adminlib-type="fieldEdit" class="form-control input-sm" type="{{type}}" placeholder="{{label}}" value="{{value}}" {{^creatable}}disabled{{/creatable}} {{#formID}}form="{{formID}}"{{/formID}}>'
   +                      '{{/inputMode}}'

   +                      '{{#selectMode}}'
   +                         '<select class="form-control input-sm" data-adminlib-type="fieldEdit" {{#formID}}form="{{formID}}"{{/formID}}>'

   +                            '{{#nullable}}'
   +                               '<option value="">empty</option>'
   +                            '{{/nullable}}'

   +                            '{{#selection}}'
   +                               '<option value="{{value}}">{{label}}</option>'
   +                            '{{/selection}}'

   +                         '</select>'
   +                      '{{/selectMode}}'

   +                      '<span class="help-block">{{helpText}}</span>'
   +                      '<span class="help-block help-block-error"></span>'

   +                   '</div>'
   +                '</th>'
   +             '{{/tableFields}}'

   +          '{{#rowButtons}}'
   +             '<th style="width: {{size}}"></th>'
   +          '{{/rowButtons}}'

   +          '</tr>'

   +       '{{/creatable}}'

         // Header line : creation buttons
   +       '<tr class="hide" data-adminlib-type="buttonRow">'

   +          '<th {{#storeName}}data-resizable-columns-id ="{{storeName}}.buttonRowFirstColumn" {{/storeName}}'
   +              'data-adminlib-type="rowActionCheckBox">'

   +          '</th>'

               // Expand cell
   +           '{{#expandable}}'
   +              '<th></th>'
   +           '{{/expandable}}'

   +           '<th colspan="100"'
   +              ' {{#storeName}}data-resizable-columns-id ="{{storeName}}.buttonRow" {{/storeName}}'
   +              ' id="buttonRowBar">'
   +           '</th>'
   +        '</tr>'

   +     '</thead>'

   +     '<tbody>'

   +        '{{#items}}'
   +           datatableRowTemplate
   +        '{{/items}}'

   +     '</tbody>'

   +  '</table>';

   Datatable.Field = Field;

   /**
    * This function will be executed once ALL the scripts of the AdminLib.widget.Datatable package will be loaded.
    */
   Datatable.mergeOnFirstLaunch = function() {

      CreationHandler = AdminLib.widget.Datatable.CreationHandler;
      ExtraFieldsRow  = AdminLib.widget.Datatable.ExtraFieldsRow;
      Field           = AdminLib.widget.Datatable.Field;
      RowAction       = AdminLib.widget.Datatable.RowAction;
      TableAction     = AdminLib.widget.Datatable.TableAction;

      Datatable.coalesceFieldParameters     = Field.coalesceParameters;
      Datatable.coalesceBaseFieldParameters = Field.coalesceBaseParameters;

   };

   return Datatable;

   /**
    * @name FieldOptions
    * @typedef {Object}
    * @property {number}       index
    * @property {SelectOption} option
    * @property {string}       value
    */

})();
