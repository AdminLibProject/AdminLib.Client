'use strict';

AdminLib.widget.Portlet.Editable                  = (function() {

   /**
    *
    * About extending :
    *    If you want to use this class to make your own editable portlet, you should consider override theses functions :
    *
    *    - buildDOM
    *    - createForm
    *    - getForm
    *    - saveForm
    *    - toggleFormEnable
    *
    *    You can also override the "saveFunction" property
    *
    * @param {AdminLib.widget.Portlet.Editable.Parameters} parameters
    * @extends AdminLib.widget.Portlet
    * @constructor
    * @class
    * @extends AdminLib.widget.Portlet
    * @property {AdminLib.widget.Form}                    form
    * @property {AdminLib.element.Button}                 cancelButton
    * @property {AdminLib.element.Button}                 editButton
    * @property {HTMLFormElement}                        formDOM
    * @property {AdminLib.Model}                          model
    * @property {AdminLib.element.Button}                 saveButton
    * @property {function(HTMLFormElement):ActionResult} saveFunction
    * @property {string}                                 template
    */
   function EditablePortlet(parameters) {

      var /** @type {AdminLib.element.Button.Parameter} */ cancelButton
        , /** @type {AdminLib.element.Button.Parameter} */ editButton
        , /** @type {AdminLib.element.Button.Parameter} */ saveButton;

      parameters = EditablePortlet.coalesceParameters([parameters]);

      AdminLib.widget.Portlet.call(this, parameters);

      // Property : cancelButton

      cancelButton            = parameters.cancelButton;

      if (cancelButton.action)
         throw 'An action has been provided for the edit button';

      cancelButton.action     = this.disableEditMode.bind(this);
      cancelButton.code       = '#AdminLib.widget.Portlet.Editable : cancelButton';
      cancelButton.id         = "cancel";
      cancelButton.type       = AdminLib.Action.Button.TYPE.RESET;

      this.cancelButton       = new AdminLib.element.Button(cancelButton);

      // Property : data
      this.data               = parameters.data;

      // Property : model
      if (parameters.model) {
         if (parameters.model instanceof AdminLib.Model)
            this.model = parameters.model;
         else
            this.model = AdminLib.model.get(parameters.model);
      }

      // Property : editButton
      editButton        = parameters.editButton

      if (editButton.action)
         throw 'An action has been provided for the edit button';

      editButton.action = this.enableEditMode.bind(this);
      editButton.code   = '#AdminLib.widget.Portlet.Editable : editButton';
      editButton.id     = "edit";
      editButton.type   = AdminLib.Action.Button.TYPE.LINK;

      this.editButton   = new AdminLib.element.Button(editButton);

      // Property : enabled
      this.enabled = AdminLib.coalesce(parameters.enabled, false);

      // Property : form
      this.createForm(parameters);

      // Property : saveButton
      saveButton        = parameters.saveButton;

      if (saveButton.action)
         throw 'An action has been provided for the edit button';

      saveButton.action = this.save.bind(this);
      saveButton.code   = '#AdminLib.widget.Portlet.Editable : saveButton';
      saveButton.id     = "save";
      saveButton.type   = AdminLib.Action.Button.TYPE.LINK;

      this.saveButton = new AdminLib.element.Button(saveButton);

      // Property : saveFunction
      this.saveFunction = parameters.save;

      // Property : template
      if (this.template)
         this.template = AdminLib.getTemplate(parameters.template);

      // Portlet buttons
      this.saveButton.hide();
      this.cancelButton.hide();

      this.addButton(this.saveButton);
      this.addButton(this.editButton);
      this.addButton(this.cancelButton);
   }

   EditablePortlet.prototype                     = Object.create(AdminLib.widget.Portlet.prototype);
   EditablePortlet.prototype.constructor         = EditablePortlet;

   /**
    * Add a button to the action bar.
    *
    * @param {AdminLib.Action.Button|AdminLib.Action.Button.Parameter} button
    * @param {boolean} [prepend=true]
    * @return {AdminLib.element.Button}
    *
    * @public
    */
   EditablePortlet.prototype.addButton           = function addButton(button, prepend) {

      return AdminLib.widget.Portlet.prototype.addButton.call(this, button, AdminLib.coalesce(prepend, true));

   };

   /**
    * Build the DOM of the portlet
    *
    * If the instance as a "form" attribute, then it will be used as the content of the portlet.
    * Overwise, the function will use the "template" attribute to build the DOM (data will be the "this" object).
    *
    * @protected
    */
   EditablePortlet.prototype.buildDOM            = function buildDOM() {

      var /** @type {HTMLElement} */ formActionDOM
        , /** @type {string}      */ template;

      AdminLib.widget.Portlet.prototype.buildDOM.call(this);

      if (this.form)
         this.setContent(this.form);
      else {
         template =    '<form class="form-horizontal" role="form">'
                     +     '<div class="form-body">'
                     +        '{{#data}}'
                     +           this.template
                     +        '{{/data}}'
                     +     '</div>'
                     +     '<div class="form-action">'
                     +        '<div class="row">'
                     +           '<div class="col-md-offset-3 col-md-9">'
                     +           '</div>'
                     +        '</div>'
                     +     '</div>'
                     +  '</form>';

         this.formDOM = AdminLib.dom.build(template, this);
         formActionDOM = this.formDOM.querySelector('form > div.form-action > .row > div');
         this.setContent(this.formDOM);
      }

      if (this.enabled)
         this.enableEditMode();
      else
         this.disableEditMode();

   };

   /**
    * This function is executing during the initialization of the instance.
    * It's used to create the form that will be displayed in the portlet.
    * The provided parameters are the exact parameters provided at creation (before coalesce).
    * Override this function if you use a custom form
    * @param {AdminLib.widget.Portlet.Editable.Parameters} parameters
    * @protected
    */
   EditablePortlet.prototype.createForm          = function createForm(parameters) {

      if (parameters.form instanceof AdminLib.widget.Form)
         this.form  = parameters.form;
      else if (this.form !== undefined)
         this.form = new AdminLib.widget.Form(parameters.form);

      this.form.setSizeClass('col-md-12');

   };

   /**
    * Disable the edit mode
    */
   EditablePortlet.prototype.disableEditMode     = function disableEditMode() {

      var /** @type {AdminLib.Event} */ event;

      // Event : disable
      event = new AdminLib.Event ( EditablePortlet.event.disable
                                , { cancelable : true
                                  , target     : this });

      this.dispatchEvent(event);

      if (event.defaultPrevented)
         return;
      // End event

      this.toggleEditMode(false);

      // Event : disabled
      event = new AdminLib.Event ( EditablePortlet.event.disabled
                                , { cancelable : false
                                  , target     : this });

      this.dispatchEvent(event);
      // End event

   };

   /**
    * Enable the Edit mode
    * @public
    */
   EditablePortlet.prototype.enableEditMode      = function enableEditMode() {
      var /** @type {AdminLib.Event} */ event;

      // Event : disable
      event = new AdminLib.Event ( EditablePortlet.event.enable
                                , { cancelable : true
                                  , target     : this });

      this.dispatchEvent(event);

      if (event.defaultPrevented)
         return;
      // End event

      this.toggleEditMode(true);

      // Event : disabled
      event = new AdminLib.Event ( EditablePortlet.event.enabled
                                , { cancelable : false
                                  , target     : this });

      this.dispatchEvent(event);
      // End event
   };

   /**
    *
    * @returns {AdminLib.element.Button}
    * @public
    */
   EditablePortlet.prototype.getCancelButton     = function getCancelButton() {
      return this.cancelButton;
   };

   /**
    *
    * @returns {AdminLib.element.Button}
    * @public
    */
   EditablePortlet.prototype.getEditButton       = function getEditButton() {
      return this.editButton;
   };

   /**
    *
    * @returns {AdminLib.widget.Form}
    * @public
    */
   EditablePortlet.prototype.getForm             = function getForm() {
      return this.form;
   };

   /**
    *
    * @returns {AdminLib.element.Button}
    * @public
    */
   EditablePortlet.prototype.getSaveButton       = function getSaveButton() {
      return this.saveButton;
   };

   /**
    *
    * @returns {boolean}
    * @public
    */
   EditablePortlet.prototype.isEditModeEnabled   = function isEditModeEnabled() {
      return this.enabled;
   };

   /**
    * Function triggered when the "save" button is clicked.
    * @param {string[]} [fields] List of fields to save
    * @returns {Promise.<SaveResult>}
    * @public
    */
   EditablePortlet.prototype.save                = function save() {

      var /** @type {AdminLib.Event} */ event
        , /** @type {Promise}  */ promise;

      // Event : disable
      event = new AdminLib.Event ( EditablePortlet.event.save
                                , { cancelable : true
                                  , target     : this });

      this.dispatchEvent(event);

      if (event.defaultPrevented)
         return;
      // End event

      promise = this.saveForm.apply(this, arguments);

      promise.then(
         /**
          *
          * @param {ActionResult} actionResult
          */
         function(actionResult) {

            if (actionResult.success) {
               this.disableEditMode();
               AdminLib.notify.success('Saving complete !');

               // Event : saved
               event = new AdminLib.Event ( EditablePortlet.event.saved
                                         , { cancelable : false
                                           , target     : this });

               this.dispatchEvent(event);
               // End event

            }

            return actionResult;
         }.bind(this));

   };

   /**
    *
    * @param {string[]} fields
    * @returns {Promise.<SaveResult>}
    * @protected
    */
   EditablePortlet.prototype.saveForm            = function saveForm(fields) {

      var /** @type {Item}     */ editedItem
        , /** @type {string[]} */ emptiedFields
        , /** @type {*}        */ id
        , /** @type {Promise}  */ promise;

      if (this.model) {

         if (fields instanceof Event)
            fields = undefined;

         if (fields === undefined)
            fields = this.form.getFields().forEach(function(field) { return field.getCode() });

         editedItem    = this.form.getValue();
         emptiedFields = this.form.getEmptiedFields().map ( function(field) {
                                                               return field.getCode();
                                                            });
         id            = this.model.getID(this.data);

         promise = this.model.edit ( /* id         */ id
                                   , /* editedItem */ editedItem
                                   , /* emptyField */ emptiedFields
                                   , /* fields     */ fields);

      }
      else if (this.saveFunction)
         promise = this.saveFunction(this.formDOM);
      else
         promise = Promise.resolve({success: true});

      return promise;
   };

   /**
    *
    * @param {boolean} [enabled]
    * @public
    */
   EditablePortlet.prototype.toggleEditMode      = function toggleEditMode(enabled) {
      enabled = !!AdminLib.coalesce(enabled, !this.enabled);

      this.enabled = enabled;

      this.classList.toggle('edit-mode', this.enabled);
      this.toggleFormEnable();

      this.editButton.toggleShow(!this.enabled);
      this.saveButton.toggleShow(this.enabled);
      this.cancelButton.toggleShow(this.enabled);
   };

   /**
    * This function will toggle the "enabibility" of the form.
    * Override this function if you extend the portlet with a particular form behavior.
    * @param {boolean} enable
    * @protected
    */
   EditablePortlet.prototype.toggleFormEnable    = function toggleFormEnable() {

      if (this.form) {

         this.form.toggleEnable ( /* enabled  */ this.isEditModeEnabled()
                                , /* asStatic */ true
                                , /* reset    */ true);

      }
      else {

        AdminLib.list.forEach(this.querySelectorAll('select,input,textarea'), function(element) {
            element.disabled = ! this.isEditModeEnabled();
         }.bind(this));

      }

   };

   /**
    * @param {AdminLib.widget.Portlet.Editable.Parameters[]} parametersList;
    */
   EditablePortlet.coalesceParameters            = function coalesceParameters(parametersList) {

      var /** @type {AdminLib.widget.Button.Parameters}           */ button
        , /** @type {AdminLib.widget.Portlet.Editable.Parameters} */ coalescedParameters
        , /** @type {AdminLib.widget.Button.Parameters}           */ defaultButtonParameters;

      coalescedParameters = AdminLib.widget.Portlet.coalesceParameters(parametersList);

      coalescedParameters.data     = AdminLib.coalesceAttribute('data'     , parametersList, true);
      coalescedParameters.form     = AdminLib.coalesceAttribute('form'     , parametersList);
      coalescedParameters.model    = AdminLib.coalesceAttribute('model'    , parametersList);
      coalescedParameters.save     = AdminLib.coalesceAttribute('save'     , parametersList);
      coalescedParameters.template = AdminLib.coalesceAttribute('template' , parametersList);

      // Button : cancel
      defaultButtonParameters = { class : 'btn btn-default'
                                , label : 'Cancel'};

      button = AdminLib.coalesceAttribute('button', parametersList, defaultButtonParameters);

      coalescedParameters.cancelButton = AdminLib.Action.Button.coalesceParameters([button, defaultButtonParameters]);

      // Button : edit
      defaultButtonParameters = { class : 'btn btn-warning'
                                , label : 'Edit'
                                , icon  : 'fa fa-pencil'};

      button = AdminLib.coalesceAttribute('button', parametersList, defaultButtonParameters);

      coalescedParameters.editButton = AdminLib.Action.Button.coalesceParameters([button, defaultButtonParameters]);

      // Button : save
      defaultButtonParameters = { class : 'btn btn-danger'
                                , label : 'Save'
                                , icon  : 'fa fa-check'};

      button = AdminLib.coalesceAttribute('button', parametersList, defaultButtonParameters);

      coalescedParameters.saveButton = AdminLib.Action.Button.coalesceParameters([button, defaultButtonParameters]);

      return coalescedParameters;
   };

   EditablePortlet.event = { disable     : 'disable'
                           , disabled    : 'disabled'
                           , enable      : 'enable'
                           , enabled     : 'enabled'
                           , save        : 'save'
                           , saved       : 'saved'}

   return EditablePortlet;

})();