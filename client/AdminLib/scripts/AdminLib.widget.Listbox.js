'use strict';

AdminLib.widget.ListBox = (function() {

   /**
    *
    * @param {Parameters} parameters
    * @namespace AdminLib.widget.Listbox
    * @constructor
    * @property {Action}                               action
    * @property {AdminLib.Action.Button.Parameter}      confirmButtonParameters
    * @property {HTMLElement}                          dom
    * @property {ListBoxOptions}                       options
    * @property {Promise}                              promise                  Promise resolved when the user selected an option. The promise will return the value of the option
    * @property {function}                             promiseFulfillFunction   Function to execute to resolve the listbox promise.
    * @property {boolean}                              loaded
    * @property {Promise}                              loadPromise              Promise resolved when the options are loaded
    */
   function ListBox(parameters) {

      var /** @type {ButtonParameters} */ defaultConfirmButtonParameters
        , /** @type {Promise}          */ loadPromise;

      // Property : confirmButton
      if (parameters.confirmButton) {
         this.confirmButtonParameters = {};

         defaultConfirmButtonParameters = { class : 'btn-default'
                                          , label : 'Submit'
                                          , icon  : 'fa fa-check'};

         if (parameters.confirmButton && typeof(parameters.confirmButton) === 'boolean')
            this.confirmButtonParameters = defaultConfirmButtonParameters;
         else if (parameters.confirmButton)
            $.extend(this.confirmButtonParameters, defaultConfirmButtonParameters, parameters.confirmButton);

         this.confirmButtonParameters.action                = this.execute.bind(this);
         this.confirmButtonParameters.confirmation          = parameters.confirmation;
         this.confirmButtonParameters.validateBeforeConfirm = parameters.validateBeforeConfirm;
         this.confirmButtonParameters.validation            = parameters.validation;

         this.action = this.confirmButtonParameters;
      }
      else {

         this.action = new Action({ action                : this.execute.bind(this)
                                  , confirmation          : parameters.confirmation
                                  , validateBeforeConfirm : parameters.validateBeforeConfirm
                                  , validation            : parameters.validation });

      }

      // Property : options
      if (options instanceof Promise)
         loadPromise = options;
      else
         loadPromise = Promise.resolve(options);

      this.loadPromise = loadPromise.then(function(options) {

         this.loaded = true;

         if (options instanceof Array)
            this.options = /** @type {FieldOptions} */
                           options.map(function(option, index) {

                              var /** @type {string} */ label;

                              if (option.label)
                                 label = option.label;
                              else if (this.formatValueFunction)
                                 label = this.formatValueFunction(option.value);
                              else
                                 label = '';

                              return { option : option
                                     , label  : label };

                           }.bind(this));
         else if (options != undefined)
            this.options = /** @type {FieldOptions} */
                           Object.keys(options).map(function(option, index) {

                              var /** @type {string} */ label;

                              if (options[option] !== undefined)
                                 label = option;
                              else if (this.formatValueFunction)
                                 label = this.formatValueFunction(options);
                              else
                                 label = '';

                              return { option : {label: option, value: options[option]}
                                     , label  : label}
                           });

         return this;
      }.bind(this));

      // Property : loaded
      this.loaded = false;

      // Property : placeholder
      this.placeholder   = !parameters.placeholder ? false : (parameters.placeholder === true ? 'Submit...' : parameters.placeholder);

      // Property : promise
      this.promise       = new Promise(function(fulfill) {
         this.promiseFulfillFunction = fulfill;
      });

   }

   ListBox.prototype                             = Object.create(AdminLib.Widget.prototype);
   ListBox.prototype.constructor                 = ListBox;

   /**
    * Build the DOM of the listbox
    * @private
    */
   ListBox.prototype.buildDOM                    = function buildDOM() {

      var /** @type {string}        */ listBoxTemplate
        , /** @type {HTMLElement[]} */ listDOM
        , /** @type {string}        */ placeholderTemplate;

      if (this.placeholder)
         placeholderTemplate = '<option disabled selected>{{placeholder}}</option>'
      else
         placeholderTemplate = '';

      // Adding a select box
      listBoxTemplate =    '<select class="form-control input-inline input-small">'
                        +     placeholderTemplate
                        +     '{{#options}}'
                        +        '<option>{{label}}</option>'
                        +     '{{/options}}'
                        +  '</select>';

      this.selectDOM = AdminLib.dom.build(listBoxTemplate, this);

      this.selectDOM.addEventListener('change', this.onchange.bind(this));

      listDOM = [this.selectDOM];

      if (this.confirmButton) {
         this.confirmButton = new AdminLib.Action.Button(this.confirmButtonParameters);
         this.confirmButton.disable();
         listDOM.push(this.confirmButton.getDOM());
      }

      this.dom = AdminLib.dom.div('form-inline', AdminLib.dom.div('form-group', listDOM));

   };

   /**
    * Disable the listbox
    */
   ListBox.prototype.disable                     = function enable() {

      this.selectDOM.disabled      = true;

      if (this.placeholder)
         this.selectDOM.selectedIndex = 0;

      if (this.confirmButton)
         this.confirmButton.disabled();

   };

   /**
    * Enable the listbox
    */
   ListBox.prototype.enable                      = function enable() {

      this.selectDOM.disabled = false;

      if (this.confirmButton)
         this.confirmButton.enable();

   };

   /**
    * Function executed when the user click on the confirm button
    * or select an option (if no confirm button).
    * The function will resolve the listbox promise.
    *
    * @private
    */
   ListBox.prototype.execute                   = function execute() {

      var /** @type {*} */ value;

      value = this.getSelectedValue();

      this.promiseFulfillFunction(value);
   };

   /**
    *
    * @returns {HTMLElement}
    */
   ListBox.prototype.getDOM                      = function getDOM() {
      if (this.dom === undefined)
         this.buildDOM();

      return this.dom;
   };

   /**
    * Return the promise of the listbox.
    * @returns {Promise}
    */
   ListBox.prototype.getPromise                  = function getPromise() {
      return this.promise;
   };

   /**
    * Return the value of the selected option
    * @returns {*}
    */
   ListBox.prototype.getSelectedValue            = function getSelectedValue() {

      var /** @type {number} */ index;

      if (!this.loaded)
         return undefined;

      index = this.selectDOM.selectedIndex - (this.placeholder ? 1 : 0);

      if (index === -1)
         return undefined;

      return this.options[index].value;
   };

   /**
    * Listener executed when the list box value change.
    *
    * @param {Event} event
    * @private
    */
   ListBox.prototype.onchange                    = function onchange(event) {

      // If there is a confirm button, we just
      if (this.confirmButton) {
         this.confirmButton.enable();
         return;
      }

      this.action.execute();
   };

   /**
    *
    * @param {number}  index          Index of the option to select
    * @param {boolean} [execute=true] If true, then the "execute" function will be triggered (if the placeholder is not the item selected and there is not confirm button)
    */
   ListBox.prototype.select                      = function select(index, execute) {

      execute = AdminLib.coalesce(execute, true);

      this.selectDOM.selectedIndex = index;

      // Enabling the confirm button
      if (this.confirmButton) {

         if ((this.placeholder && index > 0) || !this.placeholder)
            this.confirmButton.enable();

      }
      else if (execute)
         this.execute();


   };

   /**
    * Simple shortcut for getPromise().then
    *
    * @param {function} onsuccess
    * @param {function} onerror
    * @returns {*}
    */
   ListBox.prototype.then                        = function then(onsuccess, onerror) {
      return this.promise.then(onsuccess, onerror);
   };

   /**
    * @name ListBoxOption
    * @typedef {Object}
    * @property {SelectOption} option
    * @property {string}       value
    */

})();