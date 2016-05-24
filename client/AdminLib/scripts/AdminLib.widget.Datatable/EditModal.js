'use strict';

AdminLib.widget.Datatable.EditModal               = (function() {


   /**
    *
    * An EditModal is linked to a datatbale.
    * It can display a modal that will allow the user to create a new item (if no row provided)
    * or edit a existing one.
    *
    * The edit modal handle three events :
    *    - a cancel event (AdminLib.widget.Datatale.EditModal.event.cancel) :
    *       The modal will be cancelled
    *       This event is cancellable
    *
    *    - a cancelled event (AdminLib.widget.Datatale.EditModal.event.cancelled) :
    *       The modal have been cancelled
    *       This event is not cancellable
    *
    *    - a submit event (AdminLib.widget.datatable.EditModal.event.submit) :
    *       The values will be submited
    *       This event is cancellable.
    *
    *    - a submit event (AdminLib.widget.datatable.EditModal.event.submitted) :
    *       The values has been submited
    *       This event is not cancellable.
    *
    *
    * @name AdminLib.widget.Datatable.EditModal
    * @class
    * @extends AdminLib.EventTarget
    * @param {AdminLib.widget.Datatable}                      parent
    * @param {AdminLib.widget.Datatable.EditModal.Parameters} parameters
    * @constructor
    * @property {AdminLib.widget.Datatable.Field} fields
    * @property {boolean}                        fieldValidation     Indicate if the field must be validated on saving. Depends on the mode
    * @property {AdminLib.widget.Modal}           modal
    * @property {string}                         status
    * @property {function}                       validationFunction  Function to use to validate the item
    */
   function EditModal(parent, parameters) {

      AdminLib.EventTarget.call(this);

      parameters              = EditModal.coalesceParameters([parameters]);

      this.cancelFunction     = parameters.cancel;
      this.fieldValidation    = parameters.fieldValidation;
      this.finalizeFunction   = parameters.finalizeItem;
      this.item               = parameters.item;
      this.parent             = parent;
      this.submitFunction     = parameters.submit;
      this.status             = EditModal.STATUS.CREATED;
      this.title              = parameters.title;
      this.validationFunction = parameters.validationFunction;

      // Property : fields
      this.fields = new AdminLib.Collection(AdminLib.widget.Datatable.Field, false);
      parameters.fields.forEach(function(field) {
         this.fields.add(this.parent.getField(field));
      }.bind(this));

      // Property: cancelButtonParameters
      this.cancelButtonParameters        = parameters.cancelButton;
      this.cancelButtonParameters.action = this.cancel.bind(this);
      this.cancelButtonParameters.code   = 'cancel';

      // Property: submitButtonParameters
      this.submitButtonParameters        = parameters.submitButton;
      this.submitButtonParameters.action = this.onsubmit.bind(this);
      this.submitButtonParameters.code   = 'submit';

      // controls
      if (this.fields.length === 0)
         throw 'No fields provided';

   };

   EditModal.prototype                           = Object.create(AdminLib.EventTarget.prototype);
   EditModal.prototype.constructor               = this;

   /**
    * Build the modal
    * @private
    */
   EditModal.prototype.buildModal                = function() {

      var /** @type {AdminLib.widget.Form.Field.Parameters} */ fieldParameter;

      this.modal = new AdminLib.widget.Modal({ title   : this.title
                                            , buttons : [ this.submitButtonParameters
                                                        , this.cancelButtonParameters ]});

      this.form = new AdminLib.widget.Form({});

      fieldParameter = { enabled : true
                       , style   : { input : { sizeClass : 'col-md-9' }
                                   , label : { sizeClass : 'col-md-3' }}};

      this.fields.forEach(function(field) {

         var /** @type {AdminLib.widget.Form.Field} */ editField
           , /** @type {Item}                      */ item;

         item = this.getItem();
         editField = field.buildEditField(item, fieldParameter);
         this.form.addField(editField);

      }.bind(this));

      this.modal.setContent(AdminLib.dom.div('col-md-12', this.form.getDOM()));

      this.submitButton = this.modal.getButton(this.submitButtonParameters.code);

      // Listening event : hide (on modal)
      this.modal.addEventListener ( AdminLib.widget.Modal.event.hide
                                  , this.oncancel.bind(this));

      // Listening event : hidden (on modal)
      this.modal.addEventListener ( AdminLib.widget.Modal.event.hidden
                                  , this.oncancelled.bind(this));

      // Listening event : submit (on form);
      this.form.addEventListener('submit', this.onsubmit.bind(this));
   };

   /**
    * Cancel the modal.
    * @return {boolean} Indicate if the cancel was successful (true) or not (false). The cancel is unsuccessfull if the event has been cancelled.
    * @public
    */
   EditModal.prototype.cancel                    = function() {

      if (this.status === EditModal.STATUS.SUBMIT)
         throw 'You can\'t cancel the edition during submit';

      return this.modal.hide()
   };

   /**
    * Display the modal.
    * This function should not be re-executed if the edit modal has already been cancelled or submitted.
    * @public
    */
   EditModal.prototype.display                   = function display() {

      var /** @type {AdminLib.Event} */ event;

      if (this.status !== EditModal.STATUS.CREATED)
         return;

      // Firering event : display
      event = new AdminLib.Event ( EditModal.event.display
                                , { cancellable : true
                                  , target      : this });

      this.dispatchEvent(event);

      if (event.defaultPrevented)
         return false;

      // end event

      this.buildModal();
      this.modal.display();
      this.status = EditModal.STATUS.DISPLAYED;
   };

   /**
    * Empty the fields of the form
    * @public
    */
   EditModal.prototype.empty                     = function empty() {

      if (!this.form)
         this.buildModal();

      this.form.empty();
   };

   /**
    *
    * @returns {*}
    * @public
    */
   EditModal.prototype.getEditedItem             = function() {

      var /** @type {Item} */ editedItem;

      if (!this.form)
         return undefined;

      editedItem = $.extend({}, this.item, this.form.getValue());

      if (this.finalizeFunction)
         this.finalizeFunction(editedItem);

      return editedItem;
   };

   /**
    * Return the original item (before edition);
    * @returns {Item}
    * @public
    */
   EditModal.prototype.getItem                   = function() {
      return this.item;
   };

   /**
    * Return the field corresponding to the parameter
    * @param {string} field
    * @returns {AdminLib.widget.Datatable.Field}
    * @public
    */
   EditModal.prototype.getField                  = function getField(field) {
      return this.fields.getField(field);
   };

   /**
    * Return the submit button
    * @returns {AdminLib.element.Button}
    * @public
    */
   EditModal.prototype.getSubmitButton           = function getSubmitButton() {
      if (this.modal)
         this.buildModal();

      return this.submitButton;
   };

   /**
    * Function executed when the edit modal is cancelled : either by hidding the modal or by calling the "cancel" function
    * @param event
    * @private
    */
   EditModal.prototype.oncancel                  = function oncancel(event) {

      var /** @type {AdminLib.Event} */ event;

      if (this.status !== EditModal.STATUS.CREATED && this.status !== EditModal.STATUS.DISPLAYED)
         return;

      // Firering event : cancel
      event = new AdminLib.Event ( EditModal.event.cancel
                                , { cancellable : true
                                  , target      : this });

      this.dispatchEvent(event);

      if (event.defaultPrevented) {
         event.preventDefault();
         return;
      }
      // end event

      this.status = EditModal.STATUS.CANCELLED;
   };

   /**
    *
    * @param {AdminLib.Event} event
    * @private
    */
   EditModal.prototype.oncancelled               = function oncancelled(event) {

      var /** @type {AdminLib.Event} */ event;

      if (this.status !== EditModal.STATUS.CREATED && this.status !== EditModal.STATUS.DISPLAYED)
         return;

      // Firering event : cancelled
      event = new AdminLib.Event ( EditModal.event.cancelled
                                , { cancellable : false
                                  , target      : this });

      this.dispatchEvent(event);
      // end event

      this.cancelFunction();
   };

   /**
    * Function triggered once the modal is displayed
    * @param event
    * @private
    */
   EditModal.prototype.ondisplayed               = function ondisplayed(event) {

      var /** @type {AdminLib.Event} */ event;

      // Firering event : cancelled
      event = new AdminLib.Event ( EditModal.event.displayed
                                , { cancellable : false
                                  , target      : this });

      this.dispatchEvent(event);
      // end event

   };

   /**
    *
    * @param {AdminLib.Event} actionEvent
    * @private
    */
   EditModal.prototype.onsubmit                  = function onsubmit(actionEvent) {

      var /** @type {AdminLib.Event}             */ event
        , /** @type {boolean|Promise.<boolean>} */ close;

      // Firering event : execute
      event = new AdminLib.Event ( EditModal.event.submit
                                , { cancellable : true
                                  , target      : this });

      this.dispatchEvent(event);

      if (event.defaultPrevented)
         actionEvent.preventDefault();
      // end event

      this.status = EditModal.STATUS.SUBMIT;

      close = this.submitFunction(this.getEditedItem());

      if (!(close instanceof Promise))
         close = Promise.resolve(close);

      close.then(function(close) {

         close = AdminLib.coalesce(close, true);

         if (!close) {
            this.status = EditModal.STATUS.DISPLAYED;
            return;
         }

         this.status = EditModal.STATUS.SUBMITTED;

         this.modal.addEventListener ( AdminLib.widget.Modal.event.hidden
                                     , this.onsubmitted.bind(this));

         this.modal.hide(); // Note : the "oncancel" and "oncancelled" event will be triggered but will do nothing because of the status

      }.bind(this));

   };

   /**
    *
    * @param {AdminLib.Event} event
    * @private
    */
   EditModal.prototype.onsubmitted               = function onsubmitted(event) {

      var /** @type {AdminLib.Event} */ event;

      // Firering event : execute
      event = new AdminLib.Event ( EditModal.event.submitted
                                , { cancellable : false
                                  , target      : this });

      this.dispatchEvent(event);
      // end event
   };

   /**
    * Reset the form
    * @public
    */
   EditModal.prototype.reset                     = function reset() {

      if (!this.form)
         this.buildModal();

      this.form.reset();
   };

   /**
    * Submit the values.
    * This function will trigger the cancellable "submit" event.
    * If the defualt is prevented, then the values will not be submited.
    * @public
    */
   EditModal.prototype.submit                    = function () {
      this.getSubmitButton().execute();
   };

   /**
    * Validate the entered data
    * @returns {*}
    * @private
    */
   EditModal.prototype.validate                  = function() {

      var /** @type {Item}    */ editedItem
        , /** @type {Promise} */ promise;

      promise = this.parent.isItemValide ( /* item               */ this.getEditedItem()
                                         , /* fieldValidation    */ this.fieldValidation
                                         , /* validationFunction */ this.validationFunction);

      promise = promise.then(function(validationResult) {

         var /** @type {number}                    */ f
           , /** @type {AdminLib.widget.Form.Field} */ field
           , /** @type {string}                    */ message
           , /** @type {string}                    */ title;

         if (validationResult.result === AdminLib.Action.RESPONSE_TYPE.success)
            return {result : AdminLib.Action.RESPONSE_TYPE.success};

         // Adding the "danger" class to all cell that are concerned by the error
         for(var code of validationResult.fields) {

            field = this.form.getField(code);

            if (field === undefined)
               throw 'No field corresponding to the given code. Code provided : "' + code + '"';

            editField.setValidation(AdminLib.widget.Form.Field.VALIDATION.DANGER);
         }

         title = validationResult.title !== undefined ? validationResult.title : this.title;
         message = validationResult.message !== undefined ? validationResult.message : 'The value provided are not valid';

         return { result  : AdminLib.Action.RESPONSE_TYPE.error
                , title   : title
                , message : message };

      }.bind(this));

      return promise;
   };

   /**
    *
    * @param {AdminLib.widget.Datatable.EditModal.Parameter[]} parametersList
    */
   EditModal.coalesceParameters                  = function coalesceParameters(parametersList) {

      var /** @type {Array}                                        */ cancelButton
        , /** @type {AdminLib.widget.Datatable.EditModal.Parameter} */ coalescedParameters
        , /** @type {Array}                                        */ submitButton;

      coalescedParameters = { cancel          : AdminLib.coalesceAttribute('cancel'         , parametersList)
                            , fieldValidation : AdminLib.coalesceAttribute('fieldValidation', parametersList, true)
                            , fields          : AdminLib.coalesceAttribute('fields'         , parametersList)
                            , finalizeItem    : AdminLib.coalesceAttribute('finalizeItem'   , parametersList)
                            , item            : AdminLib.coalesceAttribute('item'           , parametersList)
                            , submit          : AdminLib.coalesceAttribute('submit'         , parametersList)
                            , title           : AdminLib.coalesceAttribute('title'          , parametersList)
                            , validation      : AdminLib.coalesceAttribute('validation'     , parametersList) }

      // cancelButton
      cancelButton = AdminLib.list.attribute('cancelButton', parametersList, undefined, undefined);;
      cancelButton.push({ label : 'Cancel'
                        , class : 'btn btn-default'});

      coalescedParameters.cancelButton = AdminLib.Action.Button.coalesceParameters(cancelButton);

      // submitButton
      submitButton = AdminLib.list.attribute('submitButton', parametersList, undefined, undefined);;
      submitButton.push({ label : 'Submit'
                        , class : 'btn btn-primary'});

      coalescedParameters.submitButton = AdminLib.Action.Button.coalesceParameters(submitButton);

      return coalescedParameters;
   };

   EditModal.event     = { cancel    : 'AdminLib.widget.Datatable.EditModal.event.cancel'
                         , cancelled : 'AdminLib.widget.Datatable.EditModal.event.cancelled'
                         , display   : 'AdminLib.widget.Datatable.EditModal.event.display'
                         , displayed : 'AdminLib.widget.Datatable.EditModal.event.displayed'
                         , submit    : 'AdminLib.widget.Datatable.EditModal.event.submit'
                         , submitted : 'AdminLib.widget.Datatable.EditModal.event.submit'};

   EditModal.STATUS    = { CANCELLED : 'cancelled'
                         , CLOSED    : 'closed'
                         , CREATED   : 'created'
                         , DISPLAYED : 'displayed'
                         , SUBMITED  : 'submited'};

   return EditModal;

})();