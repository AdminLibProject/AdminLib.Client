'use strict';

AdminLib.widget.Datatable.RowAction               = (function() {

   var /* AdminLib.widget.Datatable.CreationHandler */ CreationHandler
     , /* AdminLib.widget.Datatable.Datatable       */ Datatable
     , /* AdminLib.widget.Datatable.ExtraFieldsRow  */ ExtraFieldsRow
     , /* AdminLib.widget.Datatable.Field           */ Field
     , /* AdminLib.widget.Datatable.Row             */ Row
     , /* AdminLib.widget.Datatable.RowButton       */ RowButton
     , /* AdminLib.widget.Datatable.TableAction     */ TableAction;

   // ******************** RowAction ********************/

   /**
    *
    * Define actions that can be executed on one or several rows.
    *
    * @name AdminLib.widget.Datatable.RowAction
    * @extends AdminLib.element.Button
    * @class
    * @constructor
    *
    * @param {AdminLib.widget.Datatable.RowAction.Parameters} parameters
    * @param {number}                          index
    * @param {AdminLib.widget.Datatable}        parent
    *
    * @property {function(Object[])} action
    * @property {string}             class
    * @property {boolean}            enabled
    * @property {string}             icon
    * @property {string}             label
    *
    */
   function RowAction(parameters, index, parent) {

      parameters = AdminLib.element.Button.coalesceParameters([parameters]);

      if (parameters.confirmation !== undefined) {
         this.originalConfirmationMessage = parameters.confirmation.message;

         parameters = $.extend(true, {}, parameters, {confirmation : { message : this.buildConfirmationMessage.bind(this) }});
      }

      if (parameters.validation) {

         this.originalValidation          = parameters.validation.validation;

         parameters.validation.validation = this.rowActionValidation.bind(this);
      }

      AdminLib.element.Button.call(this, parameters);
      this.parent  = parent;
      this.index   = index;
      this.options = [];
   }

   RowAction.prototype                           = Object.create(AdminLib.element.Button.prototype);
   RowAction.prototype.constructor               = RowAction;

   RowAction.prototype.buildConfirmationMessage  = function buildConfirmationMessage(items) {

      var /** @type {HTMLElement} */ dom
        , /** @type {number}      */ i
        , /** @type {string[]}    */ itemsLabels
        , /** @type {string}      */ templateData;

      itemsLabels = [];

      for(i in items) {
         itemsLabels.push(this.parent.getItemLabel(items[i]));
      }

      templateData = { message : this.originalConfirmationMessage
                     , items   : itemsLabels };

      dom = AdminLib.dom.build(RowAction.templateConfirmationMessage, templateData);

      return dom;
   };

   /**
    *
    * @returns {Promise.<boolean>}
    * @internal
    */
   RowAction.prototype.execute                   = function execute(selectedItems) {
      return AdminLib.Action.Button.prototype.execute.call(this, selectedItems, this, this.parent);
   };

   /**
    * Return the code of the button
    * @returns {string}
    * @public
    */
   RowAction.prototype.getCode                   = function getCode() {
      return this.code;
   };

   /**
    * Return the DOM of the button
    * @param {string} position
    * @returns {HTMLElement}
    * @public
    */
   RowAction.prototype.getDOM                    = function getDOM(position) {
      if (!this.options[position])
         this.options[position] = AdminLib.dom.build('<option value="{{index}}">{{label}}</option>', this);

      return this.options[position];
   };

   RowAction.prototype.getIndex                  = function getIndex() {
      return this.index;
   };

   /**
    * @public
    */
   RowAction.prototype.hide                      = function hide() {
      AdminLib.element.Button.prototype.hide.call(this);
      this.parent.updateActionBar();
      this.parent.updateRowSelector();
   };

   /**
    *
    * @param {string} position
    * @private
    */
   RowAction.prototype.remove                    = function remove(position) {

      if (position === 'top' || (!position && this.options.top))
         this.options.top.parentElement.removeChild(this.options.top);

      if (position === 'bottom' || (!position && this.options.bottom))
         this.options.bottom.parentElement.removeChild(this.options.bottom);

      this.parent.updateActionBar();
      this.parent.updateRowSelector();
   };

   /**
    * @public
    */
   RowAction.prototype.show                      = function show() {
      AdminLib.element.Button.prototype.show.call(this);
      this.parent.updateActionBar();
      this.parent.updateRowSelector();
      this.parent.updateRowActionSelect();
   };

   /**
    * Execute the validation on the selected items.
    * Return a promise that will be resolve when the validation process is completed.
    * If the promise return true, then the action can continue.
    * If the promise return false, then the validation has failed and the action should stop.
    *
    * @param {Item} selectedItems
    * @return {Promise<boolean>}
    * @internal
    */
   RowAction.prototype.rowActionValidation       = function rowActionValidation(selectedItems) {

      var validationResult;

      if (!this.originalValidation)
         return Promise.resolve(true);

      validationResult = this.originalValidation(selectedItems, this, this.parent);

      if (!(validationResult instanceof Promise))
         validationResult = Promise.resolve(validationResult);

      return validationResult.then(function(validationResult) {

         var /** @type {AdminLib.Action.RESPONSE_TYPE} */ actionResult
           , /** @type {number}                       */ errors
           , /** @type {function}                     */ fullfilPromise
           , /** @type {number}                       */ i
           , /** @type {function}                     */ onclose
           , /** @type {string}                       */ message
           , /** @type {Promise.<boolean>}            */ promise
           , /** @type {AdminLib.widget.Datatable.Row} */ row
           , /** @type {boolean}                      */ warningModal;

         if (validationResult === undefined) // TODO : notify AdminLib of an error : the validationResult should be defined
            return false;

         if (typeof(validationResult) === 'boolean')
            return validationResult;

         if (typeof(validationResult) === 'string') {
            this.parent.notifyError(validationResult);
            return false;
         }

         // At this point, validationResult is a AdminLib.widget.Datatable.RowAction.ValidationResult object
         errors = 0;

         if (validationResult.results !== undefined) {

            for(i=0; i < validationResult.results.length; i++) {
               if (AdminLib.coalesce(validationResult.results[i], false))
                  continue;

               row = this.parent.getRow(i);

               row.notifyError();
               errors += 1;
            }

         }

         if (errors > 0 && validationResult.message === undefined)
            message = 'Validation has failed for ' +  errors + ' item' + (errors > 1 ? 's' : '');
         else
            message = validationResult.message;

         /* Result of the validation :

            success if :
               - continue === true or undefined
               - and nbErrors === 0

            warning if :
               -  continue === true
               -  and nbErrors > 0

            error if :
               -  continue === false
               -  or if continue === undefined and nbErrors > 0

          */
         if (validationResult.continue === true)
            actionResult = errors === 0 ? AdminLib.Action.RESPONSE_TYPE.success : AdminLib.Action.RESPONSE_TYPE.warning;
         else if (validationResult.continue === false)
            actionResult = AdminLib.Action.RESPONSE_TYPE.error;
         else
            actionResult = errors === 0 ? AdminLib.Action.RESPONSE_TYPE.success : AdminLib.Action.RESPONSE_TYPE.warning;

         return { message : message
                , result  : actionResult
                , title   : validationResult.title};

      }.bind(this));
   };

   /**
    *
    * @param {boolean} [show]
    * @public
    */
   RowAction.prototype.toggleVisibility          = function toggleVisibility(show) {

      show = !!AdminLib.coalesce(show, !this.isVisible())

      if (show)
         this.show();
      else
         this.hide();

   };

   /**
    * Listener added to the
    * @param {AdminLib.widget.Datatable} datatable
    * @param {HTMLSelectElement}        select
    * @param {Event}                    event
    */
   RowAction.onsubmit                            = function execute(datatable, select, event) {
      var /** @type {number}    */ index
        , /** @type {RowAction} */ rowAction ;

      index     = select.selectedIndex - 1;
      rowAction = datatable.getRowAction(index);
      rowAction.execute(datatable.selectedItems);
   };

   /**
    *
    * @param {AdminLib.Datatable.RowAction.Parameter[]} parameters
    * @returns {AdminLib.Datatable.RowAction.Parameter}
    * @public
    */
   RowAction.coalesceParameters                  = function coalesceParameters(parameters) {
      return AdminLib.element.Button.coalesceParameters(parameters);
   };

   RowAction.templateConfirmationMessage =
         '<div>'
      +     '<p>'
      +        '<span>{{message}}</span>'
      +        '<ul>'
      +           '{{#items}}'
      +              '<li>{{.}}</li>'
      +           '{{/items}}'
      +        '</ul>'
      +     '</p>'
      +  '</div>';

   RowAction.mergeOnFirstLaunch   = function() {
      CreationHandler = AdminLib.widget.Datatable.CreationHandler;
      Datatable       = AdminLib.widget.Datatable;
      ExtraFieldsRow  = AdminLib.widget.Datatable.ExtraFieldsRow;
      Field           = AdminLib.widget.Datatable.Field;
      Row             = AdminLib.widget.Datatable.Row;
      RowButton       = AdminLib.widget.Datatable.RowButton;
      TableAction     = AdminLib.widget.Datatable.TableAction;
   };

   return RowAction;

})();