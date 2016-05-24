'use strict';

AdminLib.widget.Datatable.CreationHandler         = (function() {

   var /* AdminLib.widget.Datatable.Datatable       */ Datatable
     , /* AdminLib.widget.Datatable.ExtraFieldsRow  */ ExtraFieldsRow
     , /* AdminLib.widget.Datatable.Field           */ Field
     , /* AdminLib.widget.Datatable.Row             */ Row
     , /* AdminLib.widget.Datatable.RowAction       */ RowAction
     , /* AdminLib.widget.Datatable.RowButton       */ RowButton
     , /* AdminLib.widget.Datatable.TableAction     */ TableAction;

   Row = AdminLib.widget.Datatable.Row;

   /**
    * @name AdminLib.widget.datatable.CreationHandler
    * @class
    * @param parent
    * @param {AdminLib.widget.Datatable.CreationParameter} parameters
    * @constructor
    * @property {AdminLib.Action.Button}                cancelButton
    * @property {AdminLib.widget.Datatable.TableAction} createButton
    * @property {HTMLTableRowElement}                  dom
    * @property {boolean}                              enabled
    * @property fieldValidation
    * @property {function(Item)}                       finalizeFunction
    * @property {function}                             handler
    * @property {AdminLib.Model}                        model
    * @property {AdminLib.widget.Datatable.CreationRow} row
    * @property {AdminLib.Action.Button}                saveButton
    * @property validation
    */
   function CreationHandler(parent, parameters) {

      AdminLib.EventTarget.call(this);

      this.parent = parent;

      // Property : cancelButtonParameters
      this.cancelButtonParameters = parameters.cancelButton;
      this.cancelButtonParameters.action = this.disable.bind(this);

      // Create button
      this.createButtonParameters        = parameters.createButton;
      this.createButtonParameters.action = this.enable.bind(this);
      this.createButtonParameters.code   = 'AdminLib.widget.Datatable.Creation#createButton';
      this.createButtonParameters.form   = this.parent.createFormID;
      this.createButtonParameters.type   = 'submit';

      // Save button
      this.saveButtonParameters            = parameters.saveButton;
      this.saveButtonParameters.action     = this.save.bind(this);
      this.saveButtonParameters.validation = this.validate.bind(this);

      // Initializing
      this.cancelButton       = new AdminLib.Action.Button(this.cancelButtonParameters);
      this.createButton       = this.parent.addTableAction(this.createButtonParameters, undefined, this.parent, true);
      this.displayed          = false;
      this.enabled            = parameters.enabled;
      this.fieldValidation    = parameters.fieldValidation;
      this.finalizeFunction   = parameters.finalizeItem;
      this.handler            = parameters.handler;
      this.editModal          = parameters.modal;
      this.model              = this.parent.model;
      this.saveButton         = new AdminLib.Action.Button(this.saveButtonParameters);
      this.validationFunction = parameters.validation;

      // Property : editModal.fields
      if (this.editModal.enabled) {

         // if no fields list provided, then we use creatable fields
         if (!this.editModal.fields) {

            this.editModal.fields = this.parent.getFields().filter(function(field) {
               return field.isCreatable();
            }).map(function(field) {
               return field.getCode();
            });

         }
      }

      // Hidding "Cancel" and "Save" button
      this.cancelButton.hide();
      this.saveButton.hide();

      this.row             = new CreationRow(this);
   }

   CreationHandler.prototype                     = Object.create(AdminLib.EventTarget.prototype);
   CreationHandler.prototype.constructor         = CreationHandler;

   /**
    * Build a new edit modal
    * @returns {AdminLib.widget.Datatable.EditModal}
    * @private
    */
   CreationHandler.prototype.buildEditModal      = function buildEditModal() {

      var /** @type {AdminLib.widget.Datatable.EditModal} */ editModal;

      editModal = new AdminLib.widget.Datatable.EditModal ( this.parent
                                                         , { cancelButton    : AdminLib.Action.Button.coalesceParameters(this.cancelButtonParameters)
                                                           , fields          : this.editModal.fields
                                                           , fieldValidation : this.fieldValidation
                                                           , finalizeItem    : this.finalizeFunction
                                                           , item            : undefined
                                                           , parent          : this.parent
                                                           , submit          : this.onsubmit.bind(this)
                                                           , saveButton      : AdminLib.Action.Button.coalesceParameters(this.saveButtonParameters)
                                                           , title           : this.editModal.title
                                                           , validation      : this.validationFunction });

      // Listening event : display (on modal)
      editModal.addEventListener ( AdminLib.widget.Datatable.EditModal.event.display
                                 , this.onenable.bind(this));

      // Listening event : displayed (on modal)
      editModal.addEventListener ( AdminLib.widget.Datatable.EditModal.event.displayed
                                 , this.onenabled.bind(this));

      // Listening event : cancel (on modal)
      editModal.addEventListener ( AdminLib.widget.Datatable.EditModal.event.cancel
                                 , this.ondisable.bind(this));

      // Listening event : cancelled (on modal)
      editModal.addEventListener ( AdminLib.widget.Datatable.EditModal.event.cancelled
                                 , this.ondisabled.bind(this));

      return editModal;

   };

   /**
    * This function will hide the forms used to create a new item.
    * @method AdminLib.widget.Datatable~CreationHandler#disableCreateMode
    * @returns {boolean} Indicate if the disable was successfull (true) or not (false). The function will not be successfull if the event has been cancelled
    * @public
    */
   CreationHandler.prototype.disable             = function disable() {

      if (!this.displayed)
         return true;

      // Note : if edit modal is used, then it's the edit modal that will execute the "ondisable" function
      if (this.editModal.enabled) {
         return this.editModal.current.cancel();
      }

      return this.ondisable();
   };

   /**
    *
    * Enable the create mode of the datatable : the user will be able to add a new item
    * @method AdminLib.widget.Datatable~CreationHandler#enableCreateMode
    * @return {boolean} Indicate if the action was successfull (true) or not (false). The action will fail if the event has been prevented.
    * @public
    */
   CreationHandler.prototype.enable              = function enable() {

      var /** @type {AdminLib.widget.Datatable.EditModal} */ editModal
        , /** @type {AdminLib.Event}                      */ event;

      if (this.displayed)
         return true;

      // Note : if edit modal is used, then it's the edit modal that will execute the "ondisable" function
      if (this.editModal.enabled) {
         this.editModal.current = this.buildEditModal();
         return this.editModal.current.display();
      }

      return this.onenable();
   };

   /**
    * Execute the finalize function (if exist) on the item
    * @param {Item} item
    * @internal
    */
   CreationHandler.prototype.finalizeItem        = function finalizeItem(item) {
      if (this.finalizeFunction)
         this.finalizeFunction(item);

   };

   /**
    *
    * @returns {AdminLib.widget.Datatable.CreationRow}
    * @public
    */
   CreationHandler.prototype.getRow              = function getRow() {
      return this.row;
   };

   /**
    *
    * @internal
    */
   CreationHandler.prototype.initializeDOM       = function initializeDOM() {
      this.row.initializeDOM();
      this.buttonBar = this.parent.tableDOM.querySelector('thead > tr > #buttonRowBar');

      // Adding the "Save" and "Cancel" button to the button bar
      this.buttonBar.appendChild(this.saveButton.getDOM());
      this.buttonBar.appendChild(this.cancelButton.getDOM());

   };

   /**
    * Function executed when the handler is being disabled
    * @param {AdminLib.Event} sourceEvent
    */
   CreationHandler.prototype.ondisable           = function ondisable(sourceEvent) {

      var /** @type {AdminLib.Event} */ event;

      // Firering event : disable
      event = new AdminLib.Event ( CreationHandler.event.disable
                                , { cancellable : true
                                  , target      : this });

      this.dispatchEvent(event);

      if (event.defaultPrevented) {
         if (sourceEvent)
            sourceEvent.preventDefault();

         return false;
      }

      // Note : if modal is used, then it's the modal that will fire ondisabled
      if (!this.editModal.enabled)
         this.ondisabled();

      return true;
   };

   /**
    * Function called when the handler has been disable
    * @param {AdminLib.Event} event
    * @private
    */
   CreationHandler.prototype.ondisabled          = function ondisabled(event) {

      var /** @type {AdminLib.Event} */ event;

      this.displayed = false;

      this.editModal.current = undefined;
      this.createButton.enable();
      this.saveButton.hide();
      this.cancelButton.hide();
      this.row.hide();
      this.buttonBar.parentElement.classList.add('hide');

      // Firering event : disable
      event = new AdminLib.Event ( CreationHandler.event.disabled
                                , { cancellable : false
                                  , target      : this });

      this.dispatchEvent(event);
   };

   /**
    *
    * @param sourceEvent
    * @returns {boolean}
    * @private
    */
   CreationHandler.prototype.onenable            = function onenable(sourceEvent) {

      var /** @type {AdminLib.Event} */ event;

      // Firering event : enable
      event = new AdminLib.Event ( CreationHandler.event.enable
                                , { cancellable : true
                                  , target      : this });

      this.dispatchEvent(event);

      if (event.defaultPrevented) {
         if (sourceEvent)
            sourceEvent.preventDefault();

         return false;
      }

      if (!this.editModal.enabled)
         this.onenabled();
   };

   /**
    *
    * @returns {boolean}
    * @private
    */
   CreationHandler.prototype.onenabled           = function onenabled() {

      var /** @type {AdminLib.Event} */ event;

      this.displayed = true;

      if (this.editModal.enabled) {
         this.editModal.current = this.buildEditModal();
         this.editModal.current.display();
      }
      else {
         this.saveButton.show();
         this.cancelButton.show();

         this.row.show();
         this.buttonBar.parentElement.classList.remove('hide');
      }

      // Firering event : enable
      event = new AdminLib.Event ( CreationHandler.event.enable
                                , { cancellable : true
                                  , target      : this });

      this.dispatchEvent(event);

      return true;
   };

   /**
    *
    * @param {Item} editedItem
    * @private
    */
   CreationHandler.prototype.onsubmit            = function onsubmit(editedItem) {

      return this.saveItem(editedItem)
               .then(
                  function(creationResult) {

                     if (creationResult.success) {
                        this.parent.notifySuccess(creationResult.title, creationResult.message);
                        return true;
                     }

                     this.parent.notifyError(creationResult.title, creationResult.message);
                     return false;
                  }.bind(this))

   };

   /**
    * Save the created item
    * @returns {pSaveResult}
    * @public
    */
   CreationHandler.prototype.save                = function save() {
      var /** @type {Item}          */ createdItem;

      if (this.editModal.enabled)
         return this.editModal.current.submit();

      createdItem    = this.row.getEditedItem();

      this.saveItem(createdItem).then(function(creationResult) {

         if (creationResult.success) {
            this.parent.notifySuccess(creationResult.title, creationResult.message);
            this.disable();
         }
         else
            this.parent.notifyError(creationResult.title, creationResult.message);

      }.bind(this));

   };

   /**
    *
    * @param {Item} createdItem
    * @returns {pSaveResult}
    * @private
    */
   CreationHandler.prototype.saveItem            = function saveItem(createdItem) {

      var /** @type {pActionResult} */ creationResult
        , /** @type {function}      */ onerror
        , /** @type {function}      */ onsuccess;

      if (this.handler)
         creationResult = this.handler(createdItem);
      else if (this.model)
         creationResult = this.model.create(createdItem, undefined, this.parent.getApiFields())
            .then(function(createdItem) {
               return { item    : createdItem
                      , success : true
                      , title   : 'Item creation' };
            });
      else
         creationResult = { item    : createdItem
                          , success : true
                          , title   : 'Item creation' };

      if (!(creationResult instanceof Promise))
         creationResult = Promise.resolve(creationResult);

      onsuccess = function(creationResult) {

         var /** @type {AdminLib.Event}                */ event
           , /** @type {AdminLib.widget.Datatable.Row} */ row;

         creationResult = AdminLib.coalesce(creationResult, {});

         if (creationResult.success) {
            createdItem = AdminLib.coalesce(creationResult.item, createdItem);
            row = this.parent.addItem(createdItem);
            this.disable();

            // Firefing event : itemCreated
            event = new AdminLib.Event ( AdminLib.widget.Datatable.event.itemCreated
                                      , { cancelable : false
                                        , target     : this.parent
                                        , detail     : { item : createdItem
                                                       , row  : row }});

            this.parent.dispatchEvent(event);
         }

         return { message : creationResult.message
                , silent  : true
                , success : creationResult.success
                , title   : creationResult.title};

      }.bind(this);

      onerror = function(error) {

         var /** @type {string} */ message;

         if (typeof(error) === 'string')
            message = error;
         else if (error instanceof Response)
            message = 'HTTP Error ' + error.status + ' : ' + error.statusText;
         else
            message = error.message;

         return { success : false
                , title   : 'Internal error'
                , message : message };
      };

      return creationResult.then(onsuccess.bind(this), onerror.bind(this));
   };

   /**
    * Validate the created item
    * @public
    */
   CreationHandler.prototype.validate            = function validate() {
      return this.row.validate();
   };

   CreationHandler.event = { disable : 'AdminLib.widget.Datatable.CreationHandler.event.disable'
                           , enable  : 'AdminLib.widget.Datatable.CreationHandler.event.enable' };

   /**
    *
    * @param {AdminLib.widget.Datatable.Parameters.CreationParameters[]} parametersList
    * @returns {AdminLib.widget.Datatable.Parameters.CreationParameters}
    *
    * @public
    */
   CreationHandler.coalesceParameters            = function coalesceParameters(parametersList) {

      var /** @type {AdminLib.Parameter.Button[]}                */ cancelButtonList
        , /** @type {AdminLib.Parameter.Button[]}                */ createButtonList
        , /** @type {AdminLib.widget.Datatable.Parameters.Create}*/ coalescedParameters
        , /** @type {AdminLib.Parameter.Button[]}                */ saveButtonList
        , /** @type {AdminLib.Parameters.widget.Datatable.Create.ValidationLike} */ validationParameters;

      // Keeping only defined parameters
      parametersList = AdminLib.coalesce(parametersList, []).filter(function(parameters) {
         return parameters !== undefined;
      }).map(function(parameters) {

         if (typeof(parameters) === 'function')
            return { handler : parameters };
         else if (typeof(parameters) === 'string')
            return { createButton : {label : parameters} }

         return parameters;

      });

      // If the first parameter forbid creation or if no parameters, then forbidding parameters
      if (parametersList[0] === false || parametersList.length === 0)
         return false;

      cancelButtonList = AdminLib.list.attribute('cancelButton', parametersList);
      createButtonList = AdminLib.list.attribute('createButton', parametersList);
      saveButtonList   = AdminLib.list.attribute('saveButton'  , parametersList);

      cancelButtonList.push({ class : 'btn-default'
                            , label : 'Cancel'});

      createButtonList.push({ class : 'btn-primary'
                            , icon  : 'glyphicon glyphicon-plus'
                            , label : 'New'});

      saveButtonList.push({ class : 'btn-primary'
                          , label : 'Save'});

      coalescedParameters = { cancelButton    : AdminLib.Action.Button.coalesceButtonParameters(cancelButtonList)
                            , confirmation    : AdminLib.Action.Confirmation.coalesceParameters(AdminLib.list.attribute('confirmation', parametersList))
                            , createButton    : AdminLib.Action.Button.coalesceButtonParameters(createButtonList)
                            , fieldValidation : AdminLib.coalesceAttribute('fieldValidation', parametersList, true)
                            , finalizeItem    : AdminLib.coalesceAttribute('finalizeItem'   , parametersList)
                            , handler         : AdminLib.coalesceAttribute('handler'        , parametersList)
                            , saveButton      : AdminLib.Action.Button.coalesceButtonParameters(saveButtonList)
                            , validation      : AdminLib.coalesceAttribute('validation'     , parametersList) };

      // modal

      coalescedParameters.modal = CreationHandler.coalesceModalParameters(AdminLib.list.attribute('modal', parametersList, undefined, false));

      return coalescedParameters;
   };

   CreationHandler.coalesceModalParameters       = function(parametersList) {

      var /** @type {AdminLib.widget.Datatable.CreationParameter.Modal} */ coalescedParameters;

      parametersList = parametersList.map(function(parameters) {
         if (typeof(parameters) === 'boolean')
            return {enabled : parameters};

         return parameters;
      });

      coalescedParameters = { enabled : AdminLib.coalesceAttribute('enabled', parametersList, false)
                            , fields  : AdminLib.coalesceAttribute('fields' , parametersList)
                            , title   : AdminLib.coalesceAttribute('title'  , parametersList, false) };

      if (coalescedParameters.fields)
         coalescedParameters.fields = coalescedParameters.fields.slice(0);

      return coalescedParameters;
   };

   CreationHandler.mergeOnFirstLaunch            = function() {
      Datatable       = AdminLib.widget.Datatable;
      Field           = AdminLib.widget.Datatable.Field;
      ExtraFieldsRow  = AdminLib.widget.Datatable.ExtraFieldsRow;
      Row             = AdminLib.widget.Datatable.Row;
      RowAction       = AdminLib.widget.Datatable.RowAction;
      RowButton       = AdminLib.widget.Datatable.RowButton;
      TableAction     = AdminLib.widget.Datatable.TableAction;
   };



   // ******************* CreationRow ********************

   /**
    *
    * @param {AdminLib.widget.Datatable~CreationHandler} creationHandler
    * @constructor
    */
   function CreationRow(creationHandler) {
      Row.call(this, undefined, creationHandler.parent);

      this.creationHandler = creationHandler;
   }

   CreationRow.prototype = Object.create(Row.prototype);
   CreationRow.prototype.constructor = CreationRow;


   /**
    * Return the created item : the function will read all the fields and build a new item
    *
    * @method AdminLib.widget.Datatable#getCreatedItem
    * @returns {Item}
    * @private
    */
   CreationRow.prototype.getEditedItem           = function getCreatedItem() {

      var /** @type {Item}                           */ editedItem
        , /** @type {AdminLib.widget.Datatable.Field} */ field
        , /** @type {*}                              */ value;

      editedItem = {};

      for(field of this.parent.getFields()) {

         if (!field.creatable)
            continue;

         value = field.getValue(undefined, true);

         field.setValue(editedItem, value);
      }

      this.creationHandler.finalizeItem(editedItem);

      return editedItem;
   };

   CreationRow.prototype.initializeDOM           = function initializeDOM() {

      var /** @type {HTMLTableCellElement}           */ cell
        , /** @type {HTMLElement}                    */ creationRow
        , /** @type {AdminLib.widget.Datatable.Field} */ field
        , /** @type {number}                         */ nbRowButtons;

      this.dom = this.parent.tableDOM.querySelector('thead > tr[data-adminlib-type="createRow"]');
      this.dom.addEventListener('keypress', this.onkeypress.bind(this));

      // Adding fields
      for(field of this.parent.tableFields) {
         field.buildCreateField(this);
      }

   };

   /**
    *
    * @param {Event} event
    * @private
    */
   CreationRow.prototype.onkeypress              = function onkeypress(event) {

      if (event.keyCode !== 13)
         return;

      this.creationHandler.save();
   };

   /**
    * For CreationRow, disabling the editmode should not work.
    */
   CreationRow.prototype.disableEditMode         = function disableEditMode() {
   };

   CreationRow.prototype.enableEditMode          = function enableEditMode() {

   };

   /**
    *
    */
   CreationRow.prototype.hide                    = function hide() {
      this.dom.classList.add('hide');
   };

   CreationRow.prototype.show                    = function show() {
      this.dom.classList.remove('hide');
   };

   /**
    *
    * @returns {Promise.<Action.RESPONSE_TYPE>}
    * @public
    */
   CreationRow.prototype.validate                = function validate() {

      return Row.prototype.validate.call ( this
                                         , /* fieldValidation */ this.creationHandler.fieldValidation
                                         , /* validation      */ this.creationHandler.validationFunction);

   };

   return CreationHandler;

})();