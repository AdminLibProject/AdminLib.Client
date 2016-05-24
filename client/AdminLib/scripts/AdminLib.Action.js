'use strict';

// ******************** AdminLib.Action ********************/
AdminLib.Action                                   = (function() {

   /**
    *
    * Execute an action.
    * The action can have a confiramtion and/or a validation steps.
    *
    * Events :
    *    -  execute (AdminLib.Action.event.execute):
    *       The action will be executed.
    *       This event is cancellable.
    *       This event is fired one the action will be executed, before validation or confirmation.
    *
    * @name AdminLib.Action
    * @class
    * @param {AdminLib.Action.Parameter} parameters
    * @constructor
    * @property {AdminLib.Action.Handler}            actionFunction
    * @property {string}                            class
    * @property {string}                            code
    * @property {AdminLib.Action.Confirmation}       confirmation
    * @property {boolean}                           enabled
    * @property {string}                            icon
    * @property {number}                            index
    * @property {string}                            label
    * @property {AdminLib.Action.Validation}         validation
    * @property {boolean}                           validateBeforeConfirm
    * @public
    */
   function Action(parameters) {

      AdminLib.EventTarget.call(this);

      parameters = Action.coalesceParameters([parameters]);

      this.actionFunction        = parameters.action;
      this.enabled               = parameters.enabled;
      this.confirmation          = parameters.confirmation ? new AdminLib.Action.Confirmation(parameters.confirmation) : undefined;
      this.validateBeforeConfirm = parameters.validateBeforeConfirm;

      if (parameters.validation)
         this.validation         = new AdminLib.Action.Validation(parameters.validation);

      // Controls
      if (this.actionFunction === undefined)
         throw 'No actions defined';
   }

   Action.prototype                              = Object.create(AdminLib.EventTarget.prototype);
   Action.prototype.constructor                  = Action;

   /**
    * If no results is provided, then we consider that the action was successful.
    * @param {AdminLib.Action.Result} [actionResult]
    * @returns {boolean}
    * @protected
    */
   Action.prototype.actionResultHandler          = function actionResultHandler(actionResult) {

      var /** @type {AdminLib.widget.Modal} */ modal
        , /** @type {string}               */ message
        , /** @type {string}               */ title
        , /** @type {string}               */ type;

      if (actionResult === undefined)
         return true;

      if (actionResult.silent || actionResult.success === undefined)
         return AdminLib.coalesce(actionResult.success, true)  ;

      title = actionResult.title !== undefined ? actionResult.title : this.title;

      if (actionResult.success) {
         message = actionResult.message !== undefined ? actionResult.message : 'Successful action !';
         type    = AdminLib.notify.TYPE.SUCCESS;
      }
      else {
         message = actionResult.message !== undefined ? actionResult.message : 'Error during action';
         type    = AdminLib.notify.TYPE.ERROR;
      }

      // Displaying a modal or a toastr
      if (actionResult.modal) {
         modal = new AdminLib.widget.Modal({ buttons : [{ action : function() { modal.hide(); }
                                                       , code   : 'ok'
                                                       , class  : 'btn-primary'
                                                       , label  : 'OK'}]
                                          , message : message
                                          , title   : title});

         return modal.display().then(function() {
            return false;
         });
      }
      else {

         AdminLib.notify ( { message : message
                          , title   : title
                          , type    : type });

      }

      return actionResult.success;
   };

   /**
    *
    * @param {Array} parameters   Parameters to apply to the confirmation function
    * @returns {Promise.<boolean>}
    */
   Action.prototype.confirm                      = function confirm(parameters) {

      if (this.confirmation)
         return this.confirmation.display.apply(this.confirmation, parameters);

      return Promise.resolve(true);
   };

   /**
    * @public
    */
   Action.prototype.disable                      = function disable() {
      this.toggleEnable(false);
   };

   /**
    * @public
    */
   Action.prototype.enable                       = function enable() {
      this.toggleEnable(true);
   };

   /**
    *
    * Execute the action.
    * The action will be considered successful if it has been completed.
    * The action will be considered unsuccessful if :
    *    - The user cancel the action during the confirmation
    *    - An error during execution of the action function
    *    - The action function return with a unsuccessful status.
    *    - The action is disabled
    *
    * Note that if the function return nothing, then the action is considered successful.
    *
    * @returns {Promise.<boolean>} Indicate if the action was successful (true), or not (false).
    *
    */
   Action.prototype.execute                      = function execute() {
      var /** @type {AdminLib.Action.pResult} */ actionResult
        , /** @type {AdminLib.Event}          */ event
        , /** @type {Array}                  */ executeArguments
        , /** @type {Promise.<boolean>}      */ promise;

      if (!this.enabled)
         return Promise.resolve(false);

      // Firering event : execute
      event = new AdminLib.Event ( Action.event.execute
                                , { cancellable : true
                                  , target      : this });

      this.dispatchEvent(event);

      if (event.defaultPrevented)
         return;
      // end event

      executeArguments = Array.prototype.slice.call(arguments, 0);

      // Validating before confirmation
      if (this.validateBeforeConfirm) {

         // Validating
         promise = this.validate.call(this, executeArguments);

         // Confirming
         promise = promise.then(function(toContinue) {

            // If validation has failed, we stop the action
            if (!toContinue)
               return false;

            return this.confirm.call(this, executeArguments);

         }.bind(this));
      }
      else {
         // Confirming
         promise = this.confirm.call(this, executeArguments);

         promise = promise.then(function(toContinue) {

            // If confirmation has failed, we stop the action
            if (!toContinue)
               return false;

            return this.validate.call(this, executeArguments);

         }.bind(this));

      }

      // After validation and confirmation
      return promise.then(function(toContinue) {

         // If the action has been cancelled, then the action is unsuccessful.
         if (!toContinue)
            return false;

         // Executing the action
         actionResult = this.actionFunction.apply(this, executeArguments);

         if (!(actionResult instanceof Promise))
            actionResult = Promise.resolve(actionResult);

         // Checking the result
         return actionResult.then(this.actionResultHandler.bind(this));
      }.bind(this));
   };

   /**
    * Indicate if the action is enabled (true) or not (false).
    * @returns {boolean}
    * @public
    */
   Action.prototype.isEnabled                    = function isEnabled() {
      return this.enabled;
   };

   /**
    *
    * @param {boolean} [enable]
    * @public
    */
   Action.prototype.toggleEnable                 = function toggleEnable(enable) {

      enable = !!AdminLib.coalesce(enable, !this.enabled);

      if (this.enabled === enable)
         return;

      this.enabled = enable;
   };

   /**
    * @property {Array} parameters  Parameters to apply to the validation function
    * @returns {Promise.<boolean>}
    */
   Action.prototype.validate                     = function validate(parameters) {
      if (this.validation)
         return this.validation.execute.apply(this.validation, parameters);

      return Promise.resolve(true);
   };

   /**
    *
    * @param {AdminLib.Action.Parameter[]} parametersList
    * @returns {AdminLib.Action.Parameter}
    */
   Action.coalesceParameters                     = function coalesceParameters(parametersList) {

      var /** @type {AdminLib.Action.Parameter} */ coalescedParameters
        , validationParameters;

      coalescedParameters = { action                : AdminLib.coalesceAttribute('action'               , parametersList)
                            , enabled               : AdminLib.coalesceAttribute('enabled'              , parametersList, true)
                            , confirmation          : AdminLib.coalesceAttribute('confirmation'         , parametersList)
                            , validateBeforeConfirm : AdminLib.coalesceAttribute('validateBeforeConfirm', parametersList, true)};

      validationParameters = AdminLib.list.filterUndefined(AdminLib.list.mapAttribute('validation', parametersList));

      if (validationParameters.length)
         coalescedParameters.validation = AdminLib.Action.Validation.coalesceParameters(validationParameters);

      return coalescedParameters;
   };

   Action.event = { execute : 'Event: execute' };

   /**
    * @enum {string}
    */
   Action.RESPONSE_TYPE = { success : 'success'
                          , warning : 'warning'
                          , error   : 'error' };

   return Action;
})();

// ******************** Action.Button ********************/
AdminLib.Action.Button                            = (function() {

   /**
    * @name AdminLib.Action.Button
    * @class
    * @extends AdminLib.Action
    *
    * @param {AdminLib.Action.Button.Parameters} parameters
    * @constructor
    * @property {string}                     class       Class of the button.
    * @property {HTMLElement}                dom         DOM of the button.
    * @property {string|AdminLib.widget.Form} form        Form or DOM ID of the form associated to the button (for input elemnets)
    * @property {string}                     id          ID of the DOM
    * @property {string}                     label       Label of the button
    * @property {Object.<string>}            htmlDataset Data that will be used for th ebutton
    * @property {string}                     type        Type of button
    * @public
    */
   function Button(parameters) {

      parameters = Button.coalesceParameters([parameters]);

      if (!parameters.action && (parameters.type === 'submit' || parameters.type === 'reset'))
         parameters.action = function() {};

      AdminLib.Action.call(this, parameters);

      this.class       = parameters.class;
      this.form        = parameters.form;
      this.htmlDataset = parameters.htmlDataset;
      this.icon        = parameters.icon;
      this.id          = parameters.id;
      this.label       = parameters.label;
      this.type        = parameters.type;
      this.sizeClass   = parameters.sizeClass;
      this.style       = parameters.style;
      this.type        = parameters.type;
   }

   Button.prototype                              = Object.create(AdminLib.Action.prototype);
   Button.prototype.constructor                  = Button;

   /**
    * Build the DOM of the action button
    * @private
    */
   Button.prototype.buildDOM                     = function buildDOM() {

      var /** @type {number}   */ d
        , /** @type {Object[]} */ data
        , /** @type {string}   */ form
        , /** @type {string}   */ tag
        , /** @type {string}   */ template
        , /** @type {string}   */ type;

      data = [];

      if (this.htmlDataset) {
         for(d in this.htmlDataset) {
            data.push({name:d, value:this.htmlDataset[d]})
         }
      }

      if (this.form instanceof AdminLib.widget.Form)
         form = this.form.getDomId();
      else
         form = this.form;

      if (this.type === Button.TYPE.FILE) {

         template =     '<div class="FileButton btn {{class}} {{sizeClass}}" style="{{style}}">'
                     +     '{{#icon}}<i class="{{icon}}"></i>&nbsp;{{/icon}}'
                     +     '<span>{{label}}</span>'
                     +     '<input type="file" {{^enabled}}disabled{{/enabled}} {{#form}}form="{{form}}"{{/form}}/>'
                     +  '</div>';

      }
      else {
         switch(this.type) {

            case Button.TYPE.LINK:
               tag = 'a';
               break;

            case Button.TYPE.RESET:
               tag = 'button';
               type = 'reset';
               break;

            case Button.TYPE.SUBMIT:
               tag = 'button';
               type = 'submit';
               break;

            default:
               tag = 'button';
               type= 'button';
         }

         template =     '<{{tag}} class="btn {{class}} {{sizeClass}}"'
                     +         ' {{#type}}type="{{type}}"{{/type}}'
                     +         ' {{^enabled}}disabled{{/enabled}}'
                     +         ' id="{{id}}"'
                     +         ' style="{{style}}"'
                     +         ' {{#form}}form="{{form}}"{{/form}}'
                     +         ' {{#data}}data-{{name}}="{{value}}"{{/data}}'
                     +         '>'
                     +     '{{#icon}}<i class="{{icon}} xx"></i>&nbsp;{{/icon}}'
                     +     '{{#label}}{{label}}{{/label}}'
                     +  '</{{tag}}>';
      }

      this.dom = AdminLib.dom.build(template, { class     : this.class
                                  , enabled   : this.enabled
                                  , form      : form
                                  , id        : this.id
                                  , data      : data
                                  , icon      : this.icon
                                  , label     : this.label
                                  , sizeClass : this.sizeClass
                                  , style     : this.style
                                  , tag       : tag
                                  , type      : type});

      if (this.type === Button.TYPE.FILE) {

         this.dom.querySelector('input[type="file"]').addEventListener('change', function(event) {
            this.execute(event.target.files);
         }.bind(this));

      }
      else {

         this.dom.addEventListener('click', function(event) {
            this.execute(event);
         }.bind(this));

      }

   };

   /**
    * Disable the button
    * @public
    */
   Button.prototype.disable                      = function disable() {
      this.toggleEnable(false);
   };

   /**
    * Enable the button
    * @public
    */
   Button.prototype.enable                       = function enable() {
      this.toggleEnable(true);
   };

   /**
    * Return the DOM of the action button
    * @returns {HTMLElement}
    */
   Button.prototype.getDOM                       = function getDOM() {
      if (this.dom === undefined)
         this.buildDOM();

      return this.dom;
   };

   /**
    * Hide the button.
    * To unhide the button, use the "show" method
    * @public
    */
   Button.prototype.hide                         = function hide() {
      this.getDOM().classList.add('hide');
   };

   /**
    * Indicate if the button is hiden (false) or not (true).
    * @returns {boolean}
    * @public
    */
   Button.prototype.isVisible                    = function isVisible() {
      return !this.getDOM().classList.contains('hide');
   };

   /**
    * Show the button
    * To hide the button, use the "hide" method
    * @public
    */
   Button.prototype.show                         = function show() {
      this.getDOM().classList.remove('hide');
   };

   /**
    * Will enable or disable the button according to the toggle value.
    * @param {boolean} enable - If true, then the button is enabled. If false, the button will be disabled
    * @public
    */
   Button.prototype.toggleEnable                 = function toggleEnable(enable) {
      AdminLib.Action.prototype.toggleEnable.call(this, enable);

      this.getDOM().disabled = !this.isEnabled();
   };

   /**
    * Will show or hide the button according to the toggle value.
    * @param {boolean} toggle - If true, then the button is shown. If false, the button will be hidden
    * @public
    */
   Button.prototype.toggleShow                   = function toggleShow(toggle) {
      if (toggle)
         this.show();
      else
         this.hide();
   };

   /**
    *
    * @param {AdminLib.Action.Button.Parameter[]} parametersList
    * @returns {AdminLib.Action.Button.Parameter}
    *
    * @public
    */
   Button.coalesceParameters                     = function coalesceParameters(parametersList) {

      var /** @type {AdminLib.Action.Button.Parameter} */ coalescedParameters;

      coalescedParameters             = AdminLib.Action.coalesceParameters(parametersList);

      coalescedParameters.class       = AdminLib.coalesceAttribute('class'      , parametersList);
      coalescedParameters.form        = AdminLib.coalesceAttribute('form'       , parametersList);
      coalescedParameters.label       = AdminLib.coalesceAttribute('label'      , parametersList);
      coalescedParameters.icon        = AdminLib.coalesceAttribute('icon'       , parametersList);
      coalescedParameters.htmlDataset = AdminLib.coalesceAttribute('htmlDataset', parametersList);
      coalescedParameters.sizeClass   = AdminLib.coalesceAttribute('sizeClass'  , parametersList);
      coalescedParameters.style       = AdminLib.coalesceAttribute('style'      , parametersList);
      coalescedParameters.type        = AdminLib.coalesceAttribute('type'       , parametersList, Button.TYPE.BUTTON);

      if (coalescedParameters.htmlDataset)
         coalescedParameters.htmlDataset = AdminLib.clone(coalescedParameters.htmlDataset);

      return coalescedParameters;
   };

   /**
    * @name AdminLib.Action.Button.TYPE
    * @enum {string}
    */
   Button.TYPE = { BUTTON : 'button'
                 , FILE   : 'file'
                 , LINK   : 'link'
                 , RESET  : 'reset'
                 , SUBMIT : 'submit'};

   /**
    * @param {AdminLib.Action.Button.LikeParameter[]} parameters
    * @returns {AdminLib.Action.Button.BaseParameter}
    */
   Button.coalesceButtonParameters            = function coalesceButtonParameters(parameters) {

      var /** @type {AdminLib.Action.Button.BaseParameter} */ coalescedParameters;

      parameters = AdminLib.coalesce(parameters, []).map(function(parameters) {
         if (typeof(parameters) === 'string')
            return {label: parameters};

         return parameters;
      });

      coalescedParameters = { class : AdminLib.coalesceAttribute('class', parameters)
                            , icon  : AdminLib.coalesceAttribute('icon' , parameters)
                            , label : AdminLib.coalesceAttribute('label', parameters) };

      return coalescedParameters;
   };

   return Button;

})();

// ******************** AdminLib.Action.Confirmation ********************/
AdminLib.Action.Confirmation                      = (function() {

   /**
    * @name AdminLib.Action.Confirmation
    * @class
    *
    * Handle the confirmation that is displayed when the user make an action.
    *
    * @param {AdminLib.Action.Confirmation.Parameter} parameters
    * @constructor
    * @property {AdminLib.Parameters.Button}                    cancelButton
    * @property {DOMElement}                                   message
    * @property {string}                                       title
    * @property {AdminLib.Parameters.Button}                    validationButton
    * @property {function():AdminLib.Action.Validation.pResult} validationFunction
    * @public
    */
   function Confirmation(parameters) {

      parameters = Confirmation.coalesceParameters([parameters]);

      this.title              = AdminLib.coalesce(parameters.title, 'Validation');
      this.message            = parameters.message;
      this.validationFunction = parameters.validation;

      this.validationButton   = $.extend({label:'Continue', class:'btn-primary'}, parameters.validationButton);
      this.cancelButton       = $.extend({label:'Cancel'  , class:'btn-default'}, parameters.cancelButton);
   }

   /**
    * Execute the validation function. If the validation return an error or a warning, then a dialog box will be displayed to the user
    * with the
    * The function return a promise that will be resolved once the dialog box completely disapeared.
    * The value of the promise will indicate if the user have confirm the action (true) or not (false).
    * @returns {Promise.<boolean>}
    */
   Confirmation.prototype.display                = function() {

      var /** @type {boolean}           */ confirmResult
        , /** @type {function}          */ fulfillFunction
        , /** @type {HTMLElement}       */ messageDOM
        , /** @type {string}            */ messageString
        , /** @type {Promise.<boolean>} */ promise
        , /** @type {HTMLElement}       */ modal
        , /** @type {Object}            */ templateData;

      // Building promise
      promise = new Promise(function(fulfill) {
         fulfillFunction = fulfill;
      });

      // Getting message
      // If the message is a function that return a DOM, we keep the DOM aside and append it later
      if (typeof(this.message) === 'function') {
         messageString = this.message.apply(undefined, arguments);

         if (messageString instanceof HTMLElement) {
            messageDOM = messageString;
            messageString = undefined;
         }
      }

      templateData = { title      : this.title
                     , message    : messageString
                     , validation : this.validationButton
                     , cancel     : this.cancelButton};

      modal = AdminLib.dom.build(Confirmation.templateConfirmation, templateData);

      if (messageDOM !== undefined) {
         modal.querySelector('.modal-body').appendChild(messageDOM);
      }

      // Adding listeners to "confirm" button
      modal.querySelector('button#confirm').addEventListener('click', function() {
         confirmResult = true;
         $(modal).modal('hide');
      }.bind(this));

      // The promise is resolved once the modal has completely disappeared
      $(modal).on('hidden.bs.modal', function() {
         fulfillFunction(confirmResult);
      });

      $(modal).modal('show');

      return promise;
   };

   /**
    *
    * @param {AdminLib.Action.Confirmation.Parameter[]} parameters
    * @returns {AdminLib.Action.Confirmation.Parameter}
    */
   Confirmation.coalesceParameters               = function coalesceParameters(parameters) {

      var /** @type {AdminLib.Action.Button.LikeParameter[]} */ cancelButtonList
        , /** @type {AdminLib.Action.Confirmation.Parameter}    */ coalescedParameters
        , /** @type {AdminLib.Action.Button.LikeParameter[]} */ validationButtonList;

      // CancelButton
      cancelButtonList = AdminLib.list.attribute('cancelButton', parameters);
      cancelButtonList.push({label:'Cancel'  , class:'btn-default'});

      // Validation button
      validationButtonList = AdminLib.list.attribute('validationButton', parameters);

      validationButtonList.push({label:'Continue', class:'btn-primary'});

      // Coalesce parameters
      coalescedParameters = { cancelButton     : AdminLib.Action.Button.coalesceButtonParameters(cancelButtonList)
                            , message          : AdminLib.coalesceAttribute('message', parameters)
                            , title            : AdminLib.coalesceAttribute('title'  , parameters)
                            , validationButton : AdminLib.Action.Button.coalesceButtonParameters(validationButtonList) };

      return coalescedParameters;
   };

   Confirmation.templateConfirmation             =
         '<div class="modal fade modal-overflow" tabindex="-1" >'

      +     '<div class="modal-header">'
      +        '<button type="button" class="close" data-dismiss="modal" aria-hidden="true"></button>'
      +        '<h4 class="modal-title">{{title}}</h4>'
      +     '</div>'

      +     '<div class="modal-body">'
      +        '{{{message}}}'
      +     '</div>'

      +     '<div class="modal-footer">'

      +        '{{#validation}}'
      +           '<button type="button" class="btn {{class}}" id="confirm">'
      +              '{{#icon}}<i class="{{icon}}"></i> {{/icon}}'
      +              '{{label}}'
      +           '</button>'
      +        '{{/validation}}'

      +        '{{#cancel}}'
      +           '<button type="button" class="btn {{class}}" data-dismiss="modal" id="cancel">'
      +              '{{#icon}}<i class="{{icon}}"></i> {{/icon}}'
      +              '{{label}}'
      +           '</button>'
      +        '{{/cancel}}'

      +     '</div>'

      +  '</div>';

   return Confirmation;

})();

// ******************** AdminLib.Action.Validation  ********************/
AdminLib.Action.Validation                        = (function() {

   /**
    * @name AdminLib.Action.Validation
    * @class
    * @param {AdminLib.Action.Validation.LikeParameter} parameters
    * @constructor
    * @property {AdminLib.Parameters.Button} cancelButton   Informations about the "cancel action" button
    * @property {AdminLib.Parameters.Button} continueButton Informations about the "continue" button
    * @property {boolean}                   stopIfWarning  If false, then the user will be able to perform the action even if the validation return a warning.
    * @public
    */
   function Validation(parameters) {

      parameters = Validation.coalesceParameters([parameters]);

      this.cancelButton       = parameters.cancelButton;
      this.continueButton     = parameters.continueButton;
      this.stopIfWarning      = parameters.stopIfWarning;
      this.validationFunction = parameters.validation;

      // Controls
      if (this.validationFunction === undefined)
         throw 'No validation function provided';
   }

   /**
    * Display a new validation error/warning dialog box.
    * The function return a promise that will be resolved once the dialog box completely disapeared.
    * The value of the promise will indicate if the action should be performed (true) or not (false).
    * The action should be performed if :
    *    - The validation was successful (no error nor warning)
    *    - The validation returned a warning but the user choose to ignore it (wich is able to do only if "stopIfWarning" property is false)
    * @returns {Promise.<boolean>}
    */
   Validation.prototype.execute                  = function() {

      var /** @type {Array}                             */ executeArguments
        , /** @type {function}                          */ fulfillFunction
        , /** @type {Promise.<boolean>}                 */ promise
        , /** @type {AdminLib.Action.Validation.pResult} */ validationResult;

      // Building the promise
      promise = new Promise(function(fulfill) {
         fulfillFunction = fulfill;
      });

      executeArguments = Array.prototype.slice.call(arguments, 0);

      // Executing the validation
      validationResult = this.validationFunction.apply(undefined, executeArguments);

      if (!(validationResult instanceof Promise))
         validationResult = Promise.resolve(validationResult);

      validationResult.then(function(validationResult) {

         var /** @type {function}                 */ action
           , /** @type {Object}                   */ cancelButton
           , /** @type {string}                   */ cancelButtonClass
           , /** @type {Object}                   */ continueButton
           , /** @type {boolean}                  */ displayContinueButton
           , /** @type {string|HTMLElement}       */ message
           , /** @type {AdminLib.widget.Modal}     */ modal
           , /** @type {boolean}                  */ promiseFulfilled;

         if (validationResult === undefined)
            throw 'Invalid answer';
         else if (typeof(validationResult) === 'boolean')
            validationResult = {result : validationResult ? AdminLib.Action.RESPONSE_TYPE.success : AdminLib.Action.RESPONSE_TYPE.error };
         else if (typeof(validationResult) === 'string')
            validationResult = { message : validationResult
                               , result  : AdminLib.Action.RESPONSE_TYPE.error};

         // If the result is successful and no title nor message provided, we end here
         if (validationResult.result === AdminLib.Action.RESPONSE_TYPE.success && validationResult.title === undefined && validationResult.message === undefined) {
            fulfillFunction(true);
            return;
         }

         // If the property "silent" is defined at true, then we cancel the action and quit
         if (validationResult.silent) {
            fulfillFunction(false);
            return;
         }

         action = function(resolveValue) {
                     fulfillFunction(resolveValue);
                     promiseFulfilled = true;
                     modal.hide();
                  }

         // The class of the cancel button depends of the result (if no class already provided) :
         //    If "success" : btn-default : we discourage the user to cancel.
         //    If other     : btn-primary : we encourage the user to cancel
         cancelButtonClass = AdminLib.coalesce ( this.cancelButton.class
                                      , validationResult.result === AdminLib.Action.RESPONSE_TYPE.success ? 'btn-default' : 'btn-primary');

         cancelButton = { action : action.bind(undefined, false)
                        , class  : cancelButtonClass
                        , code   : 'cancel'
                        , icon   : this.cancelButton.icon
                        , label  : this.cancelButton.label};

         if (typeof(validationResult.message) === 'function') {
            executeArguments.push(validationResult);
            message = validationResult.message.call(undefined, executeArguments);
         }
         else {
            message = validationResult.message;
         }

         // Creating the modal
         modal = new AdminLib.widget.Modal({ buttons : [cancelButton]
                                          , message : message
                                          , title   : AdminLib.coalesce(validationResult.title, 'Validation') })


         // The "continue" button will be displayed if the validation was successful or return a warning with stopIfWarning is true.
         displayContinueButton =    validationResult.result === AdminLib.Action.RESPONSE_TYPE.success
                                 || validationResult.result === AdminLib.Action.RESPONSE_TYPE.warning && !this.stopIfWarning;

         if (displayContinueButton) {

            // The class of the continue button depends of the result (if no class already provided) :
            //    If "success" : btn-primary : We encourage the user to continue
            //    If "warning" : btn-warning : We discourage the user to continue
            continueButton = { action : action.bind(undefined, true)
                             , class  : AdminLib.coalesce(this.continueButton.class, validationResult === AdminLib.Action.RESPONSE_TYPE.success ? 'btn-primary' : 'btn-warning')
                             , code   : 'continue'
                             , icon   : this.continueButton.icon
                             , label  : this.continueButton.label};

            modal.addButton(continueButton);
         }

         // If the user close the modal, then we cancel the action
         modal.addEventListener ( AdminLib.widget.Modal.event.hidden
                                , function() {
                                    if (promiseFulfilled)
                                       return;

                                    fulfillFunction(false);
                                    promiseFulfilled = true;
                                  });

         modal.display();

         return promise;

      }.bind(this));

      return promise;
   };

   /**
    *
    * @param {AdminLib.Action.Validation.LikeParameter[]} parametersList
    * @returns {AdminLib.Action.Validation.Parameter}
    */
   Validation.coalesceParameters                 = function coalesceParameters(parametersList) {

      var /** @type {ButtonParameters[]}                   */ cancelButtonList
        , /** @type {AdminLib.Action.Validation.Parameter} */ coalescedParameters
        , /** @type {ButtonParameters[]}                   */ continueButtonList;

      cancelButtonList    = [];
      continueButtonList  = [];


      parametersList = AdminLib.list.map(parametersList, function(parameters) {

         var returnValue;

         if (parameters === undefined)
            return;

         if (typeof(parameters) === 'function')
            returnValue = { validation : parameters };
         else
            returnValue = parameters;

         cancelButtonList.push(returnValue.cancelButton);
         continueButtonList.push(returnValue.continueButton);

         return returnValue;
      });

      cancelButtonList.push({label:'Cancel'});
      continueButtonList.push({label:'Continue'});

      coalescedParameters = { cancelButton   : AdminLib.Action.Button.coalesceButtonParameters(cancelButtonList)
                            , continueButton : AdminLib.Action.Button.coalesceButtonParameters(continueButtonList)
                            , stopIfWarning  : AdminLib.coalesceAttribute('stopIfWarning', parametersList, false)
                            , validation     : AdminLib.coalesceAttribute('validation'   , parametersList)};

      return coalescedParameters;
   };

   return Validation;
})();