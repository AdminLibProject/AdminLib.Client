'use strict';

AdminLib.widget.Form                              = (function() {

   var fieldTypes                                = (function() {

      var BaseType       = (function() {

         var internalToken = {};

         /**
          * @name AdminLib.widget.Form.Field.FieldType.BaseType
          * @extends {AdminLib.EventTarget}
          * @param {Object}              parameters
          * @param {string}              template
          * @param {AdminLib.widget.Form} parent
          * @constructor
          * @property {*}                         cachedValue
          * @property {string}                    code  Code of the field
          * @property {HTMLElement}               dom
          * @property {number}                    id
          * @property {AdminLib.widget.Form.Field} parent
          * @property {*}                         value
          *
          */
         function BaseType(parameters, parent, template) {

            AdminLib.EventTarget.call(this);

            this.parent      = parent;

            this.enabled     = this.parent.enabled;
            this['default']  = this.parent.default;
            this.helpText    = this.parent.helpText;
            this.id          = lastID++;
            this.label       = this.parent.label;
            this.required    = this.parent.required;
            this.placeholder = this.parent.placeholder;
            this.template    = template;
            this.builded     = false;
            this.style       = { widthClass  : this.parent.inputStyle.sizeClass
                               , heightClass : this.parent.inputStyle.heightClass };

            this.cacheValue = this.parent.getInitialValue();
            this.update();
         }

         BaseType.prototype                      = Object.create(AdminLib.EventTarget.prototype);
         BaseType.prototype.constructor          = BaseType;

         /**
          * Build the Input element dom.
          * @private
          */
         BaseType.prototype.buildDOM             = function buildDOM() {
            this.inputDOM = AdminLib.dom.build(this.template, this);
            this.builded = true;

            this.update();
         };


         /**
          * @param {boolean} [asStatic=false] If true, then the field will appear as static (as a
          * @public
          */
         BaseType.prototype.disable              = function disable(asStatic) {
            this.enabled  = false;
            this.update();
         };

         /**
          * @abstract
          * @internal
          */
         BaseType.prototype.dispose              = function() {
            throw 'Abstract method';
         };

         /**
          * Empty the input field
          * @public
          */
         BaseType.prototype.empty                = function empty() {
            this.setValue(undefined);
         };

         /**
          * @public
          */
         BaseType.prototype.enable               = function enable() {
            this.enabled = true;
            this.update();
         };

         /**
          * Return the value of the widget
          * @public
          */
         BaseType.prototype.getCachedValue       = function getCachedValue() {
            return this.cachedValue;
         };

         /**
          *
          * @returns {string}
          * @public
          */
         BaseType.prototype.getCode              = function getCode() {
            return this.parent.code;
         };

         /**
          * Return the Widget element (without the label);
          * @returns {HTMLElement}
          * @internal
          */
         BaseType.prototype.getDOM               = function getDOM() {

            if (this.inputDOM === undefined)
               this.buildDOM();

            return this.inputDOM;
         };

         /**
          * Return the value entered in the widget
          * @returns {*}
          * @abstract
          * @public
          */
         BaseType.prototype.getValue             = function getValue() {
            throw 'Not implemented !';
         };

         /**
          *
          * @returns {boolean}
          * @public
          */
         BaseType.prototype.isEnabled            = function isEnabled() {
            return this.enabled;
         };

         /**
          * Function executed when the value of the item changed.
          */
         BaseType.prototype.onchange             = function onchange(event) {
            return this.dispatchEvent(event);
         };

         /**
          * Reset the value of the field to it's original one
          * @public
          */
         BaseType.prototype.reset                = function reset() {
            this.setCacheValue(this.parent.getInitialValue());
            this.update();
         };

         BaseType.prototype.removeEventListener  = function removeEventListener() {
            throw 'Not implemented !'
         };

         /**
          * This function will NOT trigger Field.event.change and Field.event.changed
          * events.
          * @protected
          */
         BaseType.prototype.setCacheValue        = function setCacheValue(value) {
            this.cachedValue = value;
         };

         /**
          * Define the value taken by the widget.
          * Note that some widget expect a list of values.
          * This function will fire the events :
          *
          *    - AdminLib.widget.Form.Field.event.change  (cancellable)
          *    - AdminLib.widget.Form.Field.event.changed (not cancellable)
          *
          * @param {*} value
          * @public
          */
         BaseType.prototype.setValue             = function setValue(value) {

            var /** @type {AdminLib.Event} */ event;

           // Event : change
            event = new AdminLib.Event( Field.event.change
                                     , { cancelable : true
                                       , target     : this.parent });

            this.dispatchEvent(event);

            if (event.defaultPrevented)
               return;
            // End event

            this.setCacheValue(value);
            this.update();

            // Event : changed
            event = new AdminLib.Event( Field.event.changed
                                     , { cancelable : false
                                       , target     : this.parent });

            this.dispatchEvent(event);
            // End event
         };

         /**
          * @param {boolean} [enabled]
          * @public
          */
         BaseType.prototype.toggleEnable         = function toggleEnable(enabled) {
            enabled = !!AdminLib.coalesce(enabled, !this.enabled);

            if (enabled)
               this.enable();
            else
               this.disable();
         };

         /**
          * Update the value inside the widget from the cache.
          * This function will be used when emptying the widget, reseting or each time the "setValue"
          * method is called. It MUST be overriden.
          * @abstract
          * @internal
          */
         BaseType.prototype.update               = function update() {
            throw 'Not implemented !';
         };

         /**
          *
          * @param {Object} parametersList
          * @returns {Object}
          */
         BaseType.coalesceParameters             = function coalesceParameters(parametersList) {

            var /** @type {AdminLib.widget.Form.Parameters.Field} */ coalescedParameters;

            coalescedParameters = { };

            return coalescedParameters;
         };

         var lastID = 0;

         return BaseType;
      })();

      var Input          = (function() {

         /**
          *
          * @param {Object}              parameters
          * @param {string}              type
          * @param {AdminLib.widget.Form} parent
          *
          * @constructor
          * @extends {BaseType}
          * @property {HTMLInputElement} inputElement
          */
         function Input(parameters, parent, type) {
            BaseType.call(this, parameters, parent, template);
            this.inputType = type;
         }

         Input.prototype                         = Object.create(BaseType.prototype);
         Input.prototype.constructor             = Input;

         /**
          * Build the DOM of the widget
          * @internal
          */
         Input.prototype.buildDOM                = function buildDOM() {
            BaseType.prototype.buildDOM.call(this);
            //noinspection JSValidateTypes
            this.inputElement = this.getDOM().querySelector('input');

            this.inputElement.addEventListener('keyup', this.onchange.bind(this));

            this.update();
         };

         /**
          * @internal
          */
         Input.prototype.dispose                 = function dispose() {
         };

         /**
          * Return the value of the widget
          * @returns {*}
          * @public
          */
         Input.prototype.getValue                = function getValue() {

            var /** @type {*} */ value;

            value = this.inputElement.value;

            return value !== '' ? value : undefined;
         };

         /**
          * Update the value of the widget with the cached value.
          * @public
          */
         Input.prototype.update                  = function() {

            var cachedValue;

            if (!this.inputElement)
               return true;

            cachedValue = this.getCachedValue();

            if (cachedValue === undefined)
               cachedValue = '';

            this.inputElement.value = cachedValue;
            this.inputElement.disabled = !this.isEnabled();
         };

         /**
          *
          * @param {AdminLib.widget.Form.Parameters.FieldType.Input[]} parametersList
          * @returns {AdminLib.widget.Form.Parameters.FieldType.Input}
          */
         Input.coalesceParameters                = function coalesceParameters(parametersList) {

            var /** @type {AdminLib.widget.Form.Parameters.FieldType.Input} */ coalescedParameters;

            coalescedParameters = BaseType.coalesceParameters(parametersList);

            coalescedParameters.min = AdminLib.coalesceAttribute('min', parametersList);
            coalescedParameters.max = AdminLib.coalesceAttribute('max', parametersList);

            return coalescedParameters;
         };

         var template =    '<div>'
                        +     '<input type="{{inputType}}"'
                        +           ' class="form-control{{#style}}{{#heightClass}} {{.}}{{/heightClass}}{{/style}}"'
                        +           ' id="input{{code}}"'
                        +           ' value="{{value}}"'
                        +           ' {{^isEnabled}}disabled{{/isEnabled}}>'
                        +  '</div>';

         return Input;

      })();

      var ListBased      = (function() {

         /**
          *
          * This class is the base class of list input : the user is expected to select one or several options in a list.
          *
          * @class
          * @abstract
          * @param {AdminLib.widget.Form.Parameters.FieldType.ListBased} parameters
          * @param {string}                                             template
          * @param {boolean}                                            uniqueSelection
          * @param {AdminLib.widget.Form}                                parent
          * @constructor
          * @property {SelectOptionList} option
          */
         function ListBased(parameters, parent, template) {

            parameters = ListBased.coalesceParameters([parameters]);

            this.equalFunction = parameters.equal;

            BaseType.call(this, parameters, parent, template);

            this.multiple = parameters.multiple;

            this.options = new AdminLib.SelectOptionList(parameters.options, this.equalFunction);

            this.setCacheValue([]);
         }

         ListBased.prototype                     = Object.create(BaseType.prototype);
         ListBased.prototype.constructor         = ListBased;

         /**
          * Build the input dom
          * @abstract
          * @internal
          */
         ListBased.prototype.buildDOM            = function buildDOM() {
            throw 'Abstract method';
         };

         /**
          * Disable the input
          * @protected
          * @abstract
          */
         ListBased.prototype.disableInput        = function disableInput() {
            throw 'Abstract method';
         };

         /**
          * Enable the input
          * @protected
          * @abstract
          */
         ListBased.prototype.enableInput         = function disableInput() {
            throw 'Abstract method';
         };

         /**
          *
          * @param {*} value
          * @returns {Option}
          * @protected
          */
         ListBased.prototype.getOption           = function getOption(value) {
            return this.options.getOptionFromValue(value);
         };

         /**
          *
          * @abstract
          * @return {HTMLElement}
          * @protected
          */
         ListBased.prototype.getEmptyOption      = function getEmptyOption() {
            throw 'Abstract method;'
         };

         /**
          * Return the list of HTML option elements
          * @abstract
          * @return {HTMLElement[]}
          */
         ListBased.prototype.getOptionDOMList    = function getOptionDOMList() {
            throw 'Abstract method';
         };

         /**
          *
          * @param {number} index
          * @returns {HTMLOptionElement}
          * @protected
          */
         ListBased.prototype.getOptionElement    = function getOptionElement(index) {

            var optionDOMList;

            if (index === -1 && !this.multiple)
               return this.getEmptyOption();

            optionDOMList = this.getOptionDOMList();

            if (!optionDOMList)
               return undefined;

            return this.getOptionDOMList()[index];
         };

         /**
          * Return the index number of ALL selected options
          * @abstract
          * @return {number[]}
          */
         ListBased.prototype.getIndexes          = function getIndexesSelected() {
            throw 'Abstract method';
         };

         /**
          * Return the selected value
          * @returns {Array}
          */
         ListBased.prototype.getValue            = function getValue() {

            return this.getIndexes().map(function(index) {

               if (index === -1)
                  return undefined;

               return this.options.getValue(index);
            }.bind(this));

         };

         /**
          * This function should select the given option
          * @param {Option} option
          * @protected
          */
         ListBased.prototype.selectOption        = function selectOption(option) {
            this.toggleSelectOption(option, true);
         };

         /**
          * Define the value of the element.
          * If the value is undefined, then the "empty" element will be selected
          * @param {*} value
          * @public
          */
         ListBased.prototype.select              = function select(value) {
            var /** @type {AdminLib.Event} */ event
              , /** @type {Option}        */ option
              , /** @type {Array}         */ values;

            values = this.getCachedValue();

            if (values.indexOf(value) !== -1)
               return;

           // Event : change
            event = new AdminLib.Event( Field.event.change
                                     , { cancelable : true
                                       , target     : this.parent });

            this.dispatchEvent(event);

            if (event.defaultPrevented)
               return;
            // End event

            if (this.isMultiple()) {
               values.push(value);
               this.setCacheValue(values);
            }
            else
               this.setCacheValue([value]);

            option = this.getOption(value);

            if (option === undefined)
               return;

            this.selectOption(option);

            // Event : changed
            event = new AdminLib.Event( Field.event.changed
                                     , { cancelable : false
                                       , target     : this.parent });

            this.dispatchEvent(event);
            // End event

         };

         /**
          *
          * @param {Option}  option
          * @param {boolean} selected
          * @abstract
          * @protected
          */
         ListBased.prototype.toggleSelectOption  = function toggleSelectOption(option, selected) {
            throw 'Abstract method';
         };

         /**
          *
          * @param {*} value
          * @public
          */
         ListBased.prototype.unselect            = function unselect(value) {

            var /** @type {number} */ index
              , /** @type {Option} */ option
              , /** @type {Array}  */ values;

            values = this.getCachedValue();

            index = values.indexOf(value);

            if (index === -1)
               return;

            values.splice(index, 1);
            this.setCacheValue(values);

            option = this.getOption(value);
            this.unselectOption(option);
         };

         /**
          * Unselect all options
          * @param {boolean} [update=true]
          * @public
          */
         ListBased.prototype.unselectAll         = function unselectAll(update) {

            update = AdminLib.coalesce(update, true);

            this.setCacheValue([]);

            if (update)
               this.update();
         };

         /**
          *
          * @param {Option} option
          * @protected
          */
         ListBased.prototype.unselectOption      = function unselectOption(option) {
            this.toggleSelectOption(option, false);
         };

         /**
          * Update the list
          * @internal
          */
         ListBased.prototype.update              = function update() {

            var /** @type {Option} */ option
              , /** @type {*}      */ value
              , /** @type {Array}  */ values;

            if (!this.options)
               return;

            if (!this.options.isLoaded())
               return;

            // Retreiving the cached values
            values = AdminLib.coalesce(this.getCachedValue(), []).slice(0);

            // unselecting all options
            for(option of this.options) {
               this.unselectOption(option);
            }

            // Selecting each options
            for(value of AdminLib.coalesce(values, [])) {

               option = this.getOption(value);

               if (option === undefined)
                  throw 'Option not found';

               this.selectOption(option);
            }

            if (this.isEnabled())
               this.enableInput();
            else
               this.disableInput();

         };

         /**
          *
          * @param {AdminLib.widget.Form.Parameters.FieldType.ListBased[]} parametersList
          * @returns {AdminLib.widget.Form.Parameters.FieldType.ListBased}
          * @public
          */
         ListBased.coalesceParameters            = function coalesceParameters(parametersList) {

            var /** @type {AdminLib.widget.Form.Parameters.FieldType.ListBased} */ coalescedParameters;

            coalescedParameters = BaseType.coalesceParameters(parametersList);

            if (coalescedParameters.default) {
               if (!(coalescedParameters.default instanceof Array))
                  coalescedParameters.default = [coalescedParameters.default];
            }
            else {
               coalescedParameters.default = [];
            }
                   

            coalescedParameters.equal    = AdminLib.coalesceAttribute('equal'   , parametersList);
            coalescedParameters.multiple = AdminLib.coalesceAttribute('multiple', parametersList, false);
            coalescedParameters.options  = AdminLib.coalesceAttribute('options' , parametersList, []);

            return coalescedParameters;
         };

         return ListBased;

      })();

      var CodeEditor     = (function() {

         /**
          * @extends AdminLib.widget.Form.Field.FieldType.BaseType
          * @param {AdminLib.widget.Form.FieldType.CodeEditor.Parameters} parameters
          * @param parent
          * @constructor
          */
         function CodeEditor(parameters, parent) {
            var /** @type {AdminLib.widget.Button|AdminLib.widget.Button.Parameters} */ button;

            parameters = CodeEditor.coalesceParameters([parameters]);

            BaseType.call(this, parameters, parent);

            this.mode        = parameters.language;
            this.modePromise = AdminLib.Package.load('codeMirror' + (this.mode  ? '.' + this.mode : ''));
            this.modal       = parameters.modal;
            this.buttons     = [];

            for(button of parameters.buttons) {

               if (button instanceof AdminLib.Action.Button) {
                  this.buttons.push(button);
                  continue;
               }

               button.action = function() {
                  this.action(this.parent);
               }.bind({action: button.action});

               button = new AdminLib.Action.Button(parameters);
               this.buttons.push(button);
            }

         }

         CodeEditor.prototype                    = Object.create(BaseType.prototype);
         CodeEditor.prototype.constructor        = CodeEditor;

         CodeEditor.prototype.buildDOM           = function buildDOM() {

            var /** @type {HTMLElement} */ dom
              , /** @type {Object}      */ parameters
              , /** @type {string}      */ template;

            if (this.modal) {

               parameters = { inputSizeClass : this.inputSizeClass
                            , label          : this.label
                            , style          : this.style};

               this.inputDOM = AdminLib.dom.build(templateLabel, parameters);

               this.inputDOM.querySelector('input').addEventListener('click', function() {
                  this.modePromise.then(function() {
                     this.displayModal();
                  }.bind(this));
               }.bind(this));

            }
            else {

               parameters = { inputSizeClass : this.inputSizeClass };
               this.inputDOM = AdminLib.dom.build(templateInlineEditor, parameters);
               this.modePromise.then(this.displayInline.bind(this));
            }

         };

         CodeEditor.prototype.displayInline      = function displayInline() {

            this.widget = new AdminLib.widget.Portlet({title : this.title});

            this.editor = CodeMirror ( this.widget.getDOM()
                                     , { mode  : this.mode
                                       , value : AdminLib.coalesce(this.getCachedValue(), '') });

            for(var button of this.buttons) {
               this.widget.addButton(button);
            }

            this.widget.setContent(this.editor);
         };

         /**
          * @internal
          */
         CodeEditor.prototype.dispose            = function dispose() {
         };

         /**
          *
          */
         CodeEditor.prototype.displayModal       = function displayModal() {

            var /** @type {HTMLElement}          */ dom
              , /** @type {CodeMirror}           */ editor
              , /** @type {AdminLib.widget.Modal} */ modal;

            dom = AdminLib.dom.div();

            this.widget = new AdminLib.widget.Modal ( { buttons : this.buttons
                                                     , message : dom
                                                     , title   : this.title });

            this.editor = CodeMirror ( dom
                                     , { mode  : this.mode
                                       , value : this.getCachedValue() });
         };

         /**
          *
          * @returns {string}
          * @public
          */
         CodeEditor.prototype.getValue           = function getValue() {
            return this.editor.getDoc().getValue();
         };

         CodeEditor.prototype.update             = function update() {

         };

         CodeEditor.coalesceParameters           = function coalesceParameters(parametersList) {

            var /** @type {AdminLib.widget.Form.FieldType.CodeEditor.Parameters}*/ coalescedParameters;

            coalescedParameters = BaseType.coalesceParameters(parametersList);

            coalescedParameters.buttons  = AdminLib.coalesceAttribute('buttons' , parametersList, []);
            coalescedParameters.label    = AdminLib.coalesceAttribute('label'   , parametersList, 'Editor');
            coalescedParameters.language = AdminLib.coalesceAttribute('language', parametersList);
            coalescedParameters.modal    = AdminLib.coalesceAttribute('modal'   , parametersList, true);

            for(var b in coalescedParameters.buttons) {
               coalescedParameters.buttons[b] = AdminLib.element.Button(coalescedParameters.buttons[b]);
            }

            return coalescedParameters;
         };

         var templateLabel =    '<div class="{{inputSizeClass}}">'
                             +     '<div class="input-group">'
                             +        '<input type="text"'
                             +              ' class="form-control {{#style}}{{#heightClass}} {{.}}{{/heightClass}}{{/style}}"'
                             +              ' value="{{label}}">'
                             +     '</div>'
                             +  '</div>';

         var templateInlineEditor =    '<div class="{{inputSizeClass}} loading">'
                                    +     '<div class="input-group">Loading editor...</div>'
                                    +  '</div>';

         var templateModalEditor =  '<div></div>';

         return CodeEditor;

      })();

      var Checkbox       = (function() {

         /**
          * @name Static
          * @extends ListBased
          * @param {AdminLib.widget.Form.Parameters.FieldType.ListBased} parameters
          * @param {AdminLib.widget.Form}                                parent
          * @constructor
          * @property {HTMLInputElement[]} inputElementList
          */
         function Checkbox(parameters, parent) {
            ListBased.call(this, parameters, parent, template);
         }

         Checkbox.prototype                      = Object.create(ListBased.prototype);
         Checkbox.prototype.constructor          = Checkbox;

         /**
          *  Build the SELECT dom.
          *  Note that since options are queried asynchronously, they will
          *  be added once the promise is resolved.
          *  @internal
          */
         Checkbox.prototype.buildDOM             = function buildDOM() {

            BaseType.prototype.buildInputDOM.apply(this);
            this.listOptionDOM = this.dom;

            // The options will be added once the options are retreived
            this.options.then(function() {

               this.inputElementList = [];

               // Adding each options
               this.options.forEach(function(option) {

                  var /** @type {HTMLInputElement} */ inputElement;

                  inputElement          = document.createElement('input');
                  inputElement.disabled = option.disabled;
                  inputElement.value    = option.index;
                  inputElement.label    = option.label;
                  inputElement.type     = 'checkbox';
                  inputElement.class    = 'form-control';
                  inputElement.name     = 'checkbox_' + this.id;

                  this.inputElementList.push(inputElement);

                  this.listOptionDOM.appendChild(optionElement);
               }.bind(this));

               this.update();

            }.bind(this));
         };

         /**
          * Disable the input
          * @protected
          */
         Checkbox.prototype.disableInput         = function disableInput() {
            if (this.listOptionDOM)
               this.listOptionDOM.disabled = true;
         };

         /**
          * Enable the input
          * @protected
          * @abstract
          */
         Checkbox.prototype.enableInput          = function disableInput() {
            if (this.listOptionDOM)
               this.listOptionDOM.disabled = false;
         };

         /**
          *
          * @returns {undefined}
          * @public
          */
         Checkbox.prototype.getEmptyOption       = function getEmptyOption() {
            return undefined;
         };

         /**
          * Return the list of HTML option elements
          * @returns {HTMLOptionElement[]}
          * @private
          */
         Checkbox.prototype.getOptionDOMList     = function getOptionDOMList() {
            return this.inputElementList;
         };

         /**
          *
          * @param {Option|number} option
          * @returns {HTMLOptionElement}
          * @private
          */
         Checkbox.prototype.getOptionElement     = function getOptionElement(option) {

            if (!this.inputElementList)
               return undefined;

            if (option instanceof AdminLib.SelectOptionList.Option)
               option = option.getIndex();

            return this.inputElementList[option];
         };

         /**
          * Return the indexes of all selected options
          * @returns {number[]}
          * @public
          */
         Checkbox.prototype.getIndexes           = function getIndexSelected() {

            return this.inputElementList
               .filter(
                  function(inputElement) {
                     return inputElement.checked;
                  })
               .map(
                  function(inputElement) {
                     inputElement.value;
                  });

         };

         /**
          *
          * @param {Option}  option
          * @param {boolean} selected
          * @protected
          */
         Checkbox.prototype.toggleSelectOption   = function toggleSelectOption(option, selected) {
            var /** @type {HTMLOptionElement} */ optionElement;

            optionElement = this.getOptionElement(option);

            if (!optionElement)
               return;

            optionElement.checked = selected;
         };

         var template =    '<div>'
                        +     '{{#options}}'
                        +        '<input'
                        +              ' {{#disabled}} disabled {{/disabled}}'
                        +              ' type="checkbox"'
                        +              ' class="form-control {{#style}}{{#heightClass}} {{.}}{{/heightClass}}{{/style}}"'
                        +              ' id="input{{code}}"'
                        +              ' name="{{id}}"'
                        +              ' value="{{.}}">'
                        +     '{{/options}}'
                        +  '</div>';

         return Checkbox;
      })();

      var Date           = (function() {

         /**
          *
          * @param {AdminLib.widget.Form.Parameters.FieldType.Input} parameters
          * @param {AdminLib.widget.Form}                            parent
          * @constructor
          * @extends {Input}
          */
         function Date(parameters, parent) {
            Input.call(this, parameters, parent, 'date');
         }

         Date.prototype                          = Object.create(Input.prototype);
         Date.prototype.constructor              = Date;

         return Date;

      })();

      var DateTime       = (function() {

         /**
          *
          * @param {AdminLib.widget.Form.Parameters.FieldType.Input} parameters
          * @param {AdminLib.widget.Form}                            parent
          * @constructor
          * @extends {Input}
          */
         function DateTime(parameters, parent) {
            Input.call(this, parameters, parent, 'datetime-local');
         }

         DateTime.prototype                      = Object.create(Input.prototype);
         DateTime.prototype.constructor          = DateTime;

         return DateTime;

      })();

      var File           = (function() {

         /**
          * @extends Input
          * @param {AdminLib.widget.Form.Parameters.FieldType.Input} parameters
          * @param {AdminLib.widget.Form}                            parent
          * @constructor
          * @extends {Input}
          */
         function File(parameters, parent) {
            Input.call(this, parameters, parent, 'file');
         }

         File.prototype                          = Object.create(Input.prototype);
         File.prototype.constructor              = File;

         File.prototype.buildDOM                 = function buildDOM() {
            Input.prototype.buildDOM.call(this);
         };

         File.prototype.getValue                 = function getValue() {

            return this.inputElement.files[0];

         };

         return File;
      })();

      var Number         = (function() {

         /**
          *
          * @param {AdminLib.widget.Form.Parameters.FieldType.Input} parameters
          * @param {AdminLib.widget.Form}                            parent
          * @constructor
          * @extends {Input}
          */
         function Number(parameters, parent) {
            Input.call(this, parameters, parent, 'number');

            this.min = parameters.min;
            this.max = parameters.max;
         }

         Number.prototype                        = Object.create(Input.prototype);
         Number.prototype.constructor            = Number;

         Number.prototype.buildDOM               = function buildDOM() {

            Input.prototype.buildDOM.call(this);

            this.dom.inputElement.min = this.min;
            this.dom.inputElement.max = this.max;
         };

         Number.prototype.getValue               = function getValue() {
            var /** @type {string} */ value;

            value = Input.prototype.getValue.apply(this, arguments);

            return value !== undefined ? parseFloat(value) : undefined;
         };

         return Number;

      })();

      var OrderableList  = (function() {

         function OrderableList(parameters, parent, template) {

            BaseType.call(this, parameters, parent, AdminLib.coalesce(template, orderableListTemplate));

            this.modal            = parameters.modal;
            this.getLabelFunction = parameters.getLabel;
            this.cachedList       = this.getCachedValue();
            this.id               = id++;
            this.lineNumber       = !!parameters.lineNumber;

            if (this.modal) {
               this.modal.save.action    = this.saveModal.bind(this);
               this.modal.cancel.action  = this.cancelModal.bind(this);
               this.modal.display.action = this.display.bind(this);
               this.modal.cancel.code    = 'cancel';
               this.modal.save.code      = 'save';
            }

         }

         OrderableList.prototype                 = Object.create(BaseType.prototype);
         OrderableList.prototype.constructor     = Array;

         /**
          * Build the DOM of the array
          * @protected
          */
         OrderableList.prototype.buildDOM        = function() {

            var /** @type {HTMLElement} */ dom;

            BaseType.prototype.buildDOM.call(this);

            if (this.modal) {
               this.modal.displayButton = new AdminLib.Action.Modal(this.modal.display);
               dom = this.modal.displayButton.getDOM();
            }
            else {
               dom = this.buildList();
               this.listDOM = dom;
            }

            this.getDOM().appendChild(dom);
         };

         /**
          * @private
          */
         OrderableList.prototype.buildList       = function() {

            var /** @type {number}      */ i
              , /** @type {HTMLElement} */ listDOM
              , /** @type {Object}      */ templateParameter;

            this.cachedList = this.getCachedValue();

            if (this.cachedList === undefined)
               this.cachedList = [];

            templateParameter = {items : []};

            for(i=0; i < this.cachedList.length; i++) {

               templateParameters.items.push({ index : i
                                             , label : this.getLabel(this.cachedList[i], i) });

            }

            listDOM = AdminLib.dom.build(templateList, templateParameters);

            $(listDOM).sortable({ drag  : true
                                , drop  : true
                                , group : getGroupID(this.id)
                                , handle: 'i.icon-move'});

            return listDOM;
         };

         /**
          * @private
          */
         OrderableList.prototype.cancelModal     = function() {
            this.modal.widget.hide();
         };

         /**
          * @private
          */
         OrderableList.prototype.displayModal    = function() {

            var /** @type {AdminLib.widget.Modal.Parameters} */ parameters;

            parameters = { buttons : [ this.modal.cancel
                                     , this.modal.save]
                         , title   : this.modal.title };

            this.modal.widget = new AdminLib.widget.Modal(parameters);

            this.listDOM = this.buildList();

            this.modal.setContent(this.listDOM());

            this.modal.addEventListener(AdminLib.widget.Modal.event.hidden
                                       ,  function() {
                                             this.listDOM = undefined
                                          }.bind(this));

            this.modal.display();
         };

         OrderableList.prototype.dispose         = function() {
         };

         /**
          *
          * @returns {Array}
          * @protected
          */
         OrderableList.prototype.getCachedList   = function() {
            return this.cachedList;
         };

         /**
          *
          * @param {Item}   item
          * @param {number} index
          * @returns {string}
          */
         OrderableList.prototype.getLabel        = function(item, index) {
            if (this.getLabelFunction)
               return this.getLabelFunction(item, index);

            return '' + item;
         };

         /**
          * @returns {jQuery|HTMLElement}
          * @protected
          */
         OrderableList.prototype.getSortableDOM  = function() {
            return $(this.listDOM);
         };

         /**
          * Return the list of items in the new order
          * In order for this function to work, the "data-index" attribute should have an unique integer
          * value on each items of the listDOM sortable list.
          * @returns {Array}
          * @public
          */
         OrderableList.prototype.getValue        = function() {

            var /** @type {Array}  */ data
              , /** @type {Array}  */ value;

            if (this.listDOM === undefined)
               return this.cachedList.slice(0);

            data = this.getSortableDOM().sortable('serialize').get()[0];

            value = data.map(function(data, index) {
               return this.cachedList[data.index];
            }.bind(this));

            return value;
         };

         /**
          * @private
          */
         OrderableList.prototype.saveModal       = function() {
            var /** @type {Array} */ value;

            value = this.getValue();
            this.setValue(value);
            this.cachedList = value.slice(0);

            this.modal.widget.hide();
         };

         /**
          * @internal
          */
         OrderableList.prototype.update          = function() {

            if (!this.listDOM)
               return;

            AdminLib.dom.empty(this.getDOM());

            // If the list has changed, we rebuild the list
            if (this.getCachedValue() !== this.cachedList) {
               this.listDOM = this.buildList();
               this.getDOM().appendChild(this.buildList());
            }

            if (this.isEnabled())
               $(this.listDOM).sortable('enable');
            else
               $(this.listDOM).sortable('disable');

         };

         /**
          *
          * @param {AdminLib.widget.Form.FieldType.Array} parametersList
          * @returns {AdminLib.widget.Form.FieldType.Array}
          */
         OrderableList.coalesceParameters        = function(parametersList) {
            var /** @type {AdminLib.widget.Form.FieldType.Array} */ coalescedParameters
              , /** @type {AdminLib.Button.Parameters}             */ modalButtonDefault;

            coalescedParameters = BaseType.coalesceParameters(parametersList);

            coalescedParameters.getLabel   = AdminLib.coalesceAttribute('getLabel', parametersList);
            coalescedParameters.lineNumber = AdminLib.coalesceAttribute('lineNumber', parametersList, true);
            coalescedParameters.modal      = OrderableList.coalesceModalParameters(AdminLib.list.attribute('modal', parametersList));

            return coalescedParameters;
         };

         OrderableList.coalesceModalParameters   = function(parametersList) {

            var /** @type {Object}  */ coalescedParameters
              , /** @type {Object}  */ defaultButton
              , /** @type {boolean} */ displayModal
              , /** @type {Array}   */ listParameters;

            displayModal = undefined;

            parametersList = parametersList.map(function(parameters) {

               if (parameters === undefined)
                  return {};

               if (parameters === false && displayModal === undefined) {
                  displayModal = false;
                  return;
               }

               if (displayModal === undefined)
                  displayModal = true;

               if (typeof(parameters) === 'boolean')
                  return {};

               return parameters;
            });

            if (!displayModal)
               return false;

            coalescedParameters = {title : AdminLib.coalesceAttribute('title', parametersList, 'Items')};

            // Property : displayButton
            defaultButton = { label : 'display'
                            , class : 'btn btn-default'};

            listParameters = AdminLib.list.attribute('display', parametersList);
            listParameters.push(defaultButton);

            coalescedParameters.displayButton = AdminLib.Action.Button.coalesceButtonParameters(listParameters);

            // Property : saveButton
            defaultButton = { label : 'save'
                            , class : 'btn btn-danger'};

            listParameters = AdminLib.list.attribute('save', parametersList);
            listParameters.push(defaultButton);

            coalescedParameters.save = AdminLib.Action.Button.coalesceButtonParameters(listParameters);

            // Property : cancelButton
            defaultButton = { label : 'cancel'
                            , class : 'btn btn-primary'};

            listParameters = AdminLib.list.attribute('cancel', parametersList);
            listParameters.push(defaultButton);

            coalescedParameters.save = AdminLib.Action.Button.coalesceButtonParameters(listParameters);

            return coalescedParameters;
         };

         function getGroupID(id) {
            return 'adminLib-widget-form-fieldtype-nestedlist-' + id;
         }

         var id=0;

         var templateList =
               '<ol>'
            +     '{{#items}}'
            +        '<li data-index="{{index}}" >'
            +           '{{label}}'
            +        '</li>'
            +     '{{/items}}'
            +  '</ol>';

         var orderableListTemplate =
               '<div class="{{">'
            +     templateList
            +  '</div>';

         return OrderableList;

      })();

      var OrderableTable = (function() {

         /**
          * @name AdminLib.widget.Form.Field.Type.OrderableTable
          * @class
          * @extends AdminLib.widget.Form.Field.Type.OrderableList
          *
          * @param {AdminLib.widget.Form.FieldType.OrderableTable.Parameters} parameters
          * @param {AdminLib.widget.Form.Field} parent
          * @constructor
          * @extends AdminLib.widget.Form.FieldType.OrderableList
          */
         function OrderableTable(parameters, parent) {

            var field;

            parameters = OrderableTable.coalesceParameters([parameters]);

            OrderableList.call(this, parameters, parent, template);

            this.datatableParameters = parameters.table;

            // Tweaking the datatable parameters
            this.datatableParameters.data = this.getCachedList();

            // Initial page length should be infinite
            this.datatableParameters.paging = false;

            // There should be no page length menu
            this.datatableParameters.lengthMenu = [];

            // Filter is disable. Overwise, the serialize function cant work properly : the function
            // fields in the DOM and filtered rows are no longer in the DOM
            this.datatableParameters.filter = false;

            // Fields should not be orderable
            for(field of this.datatableParameters.fields) {
               field.orderable = false;
            }

            this.currentList = this.getCachedList();

            this.datatableParameters.tableClasses = 'sortable';

            if (this.lineNumber) {

               this.datatableParameters.fields.unshift({ code        : indexFieldCode
                                                       , creatable   : false
                                                       , getValue    : function(item) {
                                                                          return this.currentList.indexOf(item) + 1;
                                                                       }.bind(this)
                                                       , label       : '#'
                                                       , orderable   : false
                                                       , sizeClasses : ['OrderableTableIndex']});

            }
         }

         OrderableTable.prototype                = Object.create(OrderableList.prototype);
         OrderableTable.prototype.constructor    = OrderableTable;

         /**
          * Building the DOM of the orderable table form
          * @private
          */
         OrderableTable.prototype.buildList      = function buildList() {

            var /** @type {AdminLib.widget.Datatable} */ datatable
              , /** @type {function(Event)}          */ oncreate
              , /** @type {function(Event)}          */ ondelete
              , /** @type {function(Event)}          */ ondrop
              , /** @type {function(Event)}          */ onedit
              , /** @type {boolean}                  */ sortableApplied;

            datatable = new AdminLib.widget.Datatable(this.datatableParameters);
            this.datatable = datatable;

            sortableApplied = false;

            ondrop = function ($item, container, _super, event) {

                 $item.removeClass(container.group.options.draggedClass).removeAttr("style")
                 $("body").removeClass(container.group.options.bodyClass)

                  // We save the current list so that the function "getValue" of the index field
                  // will not have to recalculate it each time.
                  this.currentList = this.getValue();
                  datatable.getField(indexFieldCode).refresh();

            }.bind(this);

            datatable.getBuildPromise().then(function() {

               // Code from https://johnny.github.io/jquery-sortable/

               $(datatable.tableDOM).sortable({ containerSelector: 'table'
                                              , itemPath         : '> tbody'
                                              , itemSelector     : 'tr'
                                              , onDrop           : ondrop
                                              , placeholder      : '<tr class="placeholder"/>' });

               sortableApplied = true;

            }.bind(this));

            oncreate = function(event) {
               this.cachedList.push(event.detail.item);

               if (sortableApplied)
                  $(this.datatable.tableDOM).sortable('refresh');
            };

            ondelete = function(event) {
               var /** @type {number} */ indexOf;

               indexOf = this.cachedList.indexOf(event.detail.item);
               this.cachedList.splice(indexOf, 1);

               if (sortableApplied)
                  $(this.datatable.tableDOM).sortable('refresh');
            };

            onedit   = function(event) {
               var /** @type {number} */ indexOf;

               indexOf = this.cachedList.indexOf(event.detail.oldItem);
               this.cachedList[indexOf] = event.detail.newItem;

               if (sortableApplied)
                  $(this.datatable.tableDOM).sortable('refresh');
            };

            datatable.addEventListener ( AdminLib.widget.Datatable.event.itemCreated
                                       , oncreate);

            datatable.addEventListener ( AdminLib.widget.Datatable.event.itemDeleted
                                       , ondelete);

            datatable.addEventListener ( AdminLib.widget.Datatable.event.itemEdited
                                       , onedit);

            return datatable.getDOM();
         };

         OrderableTable.prototype.dispose        = function() {
            if (this.datatable)
               this.datatable.destroy();
         };

         /**
          * @returns {jQuery|HTMLElement}
          * @protected
          */
         OrderableTable.prototype.getSortableDOM = function getSortableDOM() {
            return $(this.listDOM.querySelector('table'));
         };

         /**
          *
          * @param {AdminLib.widget.Form.FieldType.OrderableTable.Parameters[]} parametersList
          * @returns {AdminLib.widget.Form.FieldType.OrderableTable.Parameters}
          */
         OrderableTable.coalesceParameters       = function(parametersList) {

            var /** @type {AdminLib.widget.Form.FieldType.OrderableTable.Parameters} */ coalescedParameters;

            coalescedParameters = OrderableList.coalesceParameters(parametersList);

            coalescedParameters.table = AdminLib.coalesceAttribute('table', parametersList);

            coalescedParameters.table = AdminLib.widget.Datatable.coalesceParameters(AdminLib.list.attribute('table', parametersList));

            return coalescedParameters;
         };

         var indexFieldCode = '#AdminLib.widget.Form.Field.fieldType.OrderableTable.lineNumber';

         var template =
               '<div></div>';

         return OrderableTable;

      })();

      var Paragraph      = (function() {

         /**
          * @name Paragraph
          * @extends BaseType
          * @param {AdminLib.widget.Form.Parameters.FieldType.Paragraph} parameters
          * @param {AdminLib.widget.Form}                                parent
          * @constructor
          */
         function Paragraph(parameters, parent) {

            parameters = Paragraph.coalesceParameters(parameters);

            BaseType.call(this, parameters, parent, template);

            this.nbRows = parameters.nbRows;
         }

         Paragraph.prototype                     = Object.create(BaseType.prototype);
         Paragraph.prototype.constructor         = Paragraph;

         /**
          * @returns {string}
          */
         Paragraph.prototype.getValue            = function getValue() {
            return this.inputElement.value;
         };

         /**
          * @param {string} value
          */
         Paragraph.prototype.update              = function update(value) {

            if (!this.inputDOM)
               return;

            if (!this.inputElement)
               this.inputElement = this.inputDOM.querySelector('textarea');

            value = AdminLib.coalesce(this.getCachedValue(), '');

            this.inputElement.value    = value;
            this.inputElement.disabled = !this.isEnabled()
         };

         /**
          *
          * @param {AdminLib.widget.Form.Parameters.FieldType.Paragraph[]} parametersList
          * @returns {AdminLib.widget.Form.Parameters.FieldType.Paragraph}
          */
         Paragraph.coalesceParameters            = function coalesceParameters(parametersList) {
            var /** @type {AdminLib.widget.Form.Parameters.FieldType.Paragraph} */ coalescedParameters;

            coalescedParameters = BaseType.coalesceParameters(parametersList);
            coalescedParameters.nbRows = AdminLib.coalesceAttribute('nbRows', parametersList, 3);

            return coalescedParameters;
         };

         var template =    '<div>'
                        +     '<textarea rows="{{nbRows}}"'
                        +              ' class="form-control {{#style}}{{#heightClass}} {{.}}{{/heightClass}}{{/style}}"'
                        +              ' id="input{{code}}">{{value}}</textarea>'
                        +  '</div>';

         return Paragraph;
      })();

      var Radio          = (function() {

         /**
          * @class
          * @extend {CheckBox}
          * @param {AdminLib.widget.Form.Parameters.FieldType.ListBased} parameters
          * @param {AdminLib.widget.Form}                                parent
          * @constructor
          */
         function Radio(parameters, parent) {
            Checkbox.call(this, parameters, parent);
         }

         Radio.prototype = Object.create(Checkbox.prototype);
         Radio.prototype.constructor = Radio;

         Radio.prototype.buildDOM                = function buildDOM() {
            Checkbox.prototype.buildDOM.call(this);

           AdminLib.list.forEach(this.dom.querySelectorAll('input[type="checkbox"]'),
               /**
                * @param {HTMLInputElement} checkbox
                */
               function(checkbox) {
                  checkbox.type = 'radio';
               });
         };

         return Radio;

      })();

      var SelectMultiple = (function() {

         /**
          * @name SelectMultiple
          * @extends AdminLib.widget.Form.FieldType.ListBased
          * @param {AdminLib.widget.Form.Parameters.FieldType.ListBased} parameters
          * @param {AdminLib.widget.Form}                                parent
          * @constructor
          * @property {HTMLOptionElement[]} optionElementList
          */
         function SelectMultiple(parameters, parent) {
            ListBased.call(this, parameters, parent, template);
         }

         SelectMultiple.prototype                = Object.create(ListBased.prototype);
         SelectMultiple.prototype.constructor    = SelectMultiple;

         /**
          *  Build the SELECT dom.
          *  Note that since options are queried asynchronously, they will
          *  be added once the promise is resolved.
          */
         SelectMultiple.prototype.buildDOM       = function buildDOM() {
            BaseType.prototype.buildDOM.apply(this);

            this.selectDOM = this.getDOM().querySelector('select');

            // The options will be added once the options are retreived
            this.options.then(function() {
               this.setOptionList(this.options);
               this.update();
            }.bind(this));

         };

         /**
          * Disable the input
          * @protected
          */
         SelectMultiple.prototype.disableInput   = function disableInput() {
            if (this.selectDOM)
               this.selectDOM.disabled = true;
         };

         SelectMultiple.prototype.dispose        = function() {
         };

         /**
          * Enable the input
          * @protected
          * @abstract
          */
         SelectMultiple.prototype.enableInput    = function disableInput() {
            if (this.selectDOM)
               this.selectDOM.disabled = false;
         };

         /**
          *
          * @param {Option|number} option
          * @private
          */
         SelectMultiple.prototype.getOptionElement = function getOptionElement(option) {

            if (option instanceof AdminLib.SelectOptionList.Option)
               option = option.getIndex();

            if (!this.optionElementList)
               return undefined;

            return this.optionElementList[option];
         };

         SelectMultiple.prototype.getEmptyOption = function getEmptyOption() {

            if (this.multiple)
               return undefined;

            return this.selectDOM.firstElementChild;
         };

         /**
          * Return the list of HTML option elements
          * @returns {HTMLOptionElement[]}
          */
         SelectMultiple.prototype.getOptionDOMList = function getOptionDOMList() {
            return this.optionElementList;
         };

         /**
          * Return the indexes of the (first) selected option
          * @returns {number}
          */
         SelectMultiple.prototype.getIndex       = function getIndex() {

            // For multiple fields, we will return only the index of the first selected option
            if (this.multiple)
               return this.selectDOM.selectedIndex;

            // There is an "empty" option in the list : This means that the real index of
            // the option is the index of the selected item minus 1
            return this.selectDOM.selectedIndex - 1;
         };

         /**
          * Return the indexes of all selected options
          * @returns {number[]}
          * @public
          */
         SelectMultiple.prototype.getIndexes     = function getIndexSelected() {

            if (!this.multiple) {
               return [this.getIndex()];
            }

            return this.optionElementList
               .filter(
                  function(optionElement) {
                     return optionElement.selected;
                  })
               .map(
                  function(optionElement) {
                     // There is an "empty" option in the list : This means that the real index of
                     // the option is the index of the selected item minus 1
                     return optionElement.index - 1;
                  });
         };

         /**
          *
          * @param {Option}  option
          * @param {boolean} selected
          * @protected
          */
         SelectMultiple.prototype.toggleSelectOption = function toggleSelect(option, selected) {
            var /** @type {HTMLOptionElement} */ optionElement;

            optionElement = this.getOptionElement(option);

            if (!optionElement)
               return;

            optionElement.selected = selected;
         };

         /**
          * Define the list of options to display
          * @param {SelectOptionsLike|SelectOptionsList} options
          * @param {boolean}                             reset
          * @public
          */
         SelectMultiple.prototype.setOptionList  = function setOptionList(options, reset) {
            var /** @type {HTMLOptionElement} */ optionElement;

            if (!(options instanceof AdminLib.SelectOptionList))
               this.options = new AdminLib.SelectOptionList(options);
            else
               this.options = options;

            if (this.options.isPromise()) {
               this.options.then(function(options) {
                  this.setOptionList(options, reset);
               }.bind(this));

               return;
            }

            // Removing the previous options
            AdminLib.dom.empty(this.selectDOM);

            // Adding the "null" option for
            optionElement          = document.createElement('option');
            optionElement.disabled = this.required;
            optionElement.value    = -1;
            this.selectDOM.appendChild(optionElement);

            this.optionElementList = [];

            // Adding each options
            this.options.forEach(function(option) {
               var /** @type {HTMLOptionElement} */ optionElement;

               // If the option is undefined, then it's a separator
               if (option === undefined)
                  option = { classes  : ['separator']
                           , disabled : true
                           , label    : ''
                           , text     : ''};

               optionElement          = document.createElement('option');
               optionElement.disabled = option.disabled;
               optionElement.value    = option.index;
               optionElement.label    = option.label;
               optionElement.text     = option.label;

               option.classes.forEach(function(className) {
                  optionElement.classList.add(className);
               });

               this.optionElementList.push(optionElement);

               this.selectDOM.appendChild(optionElement);
            }.bind(this));

            this.reset();
         };

         var template =    '<div>'
                        +     '<select id="input{{code}}"'
                        +            ' class="form-control {{#style}}{{#heightClass}} {{.}}{{/heightClass}}{{/style}}"'
                        +            ' {{^isEnabled}}disabled{{/isEnabled}}>'
                        +        '<option {{#disabled}}disabled{{/disabled}} selected>Loadxing...</option>'
                        +     '</select>'
                        +  '</div>';

         return SelectMultiple;
      })();

      var Select         = (function() {

         /**
          *
          * @extends SelectMultiple
          * @param {AdminLib.widget.Form.Parameters.FieldType.ListBased} parameters
          * @param {AdminLib.widget.Form}                                parent
          * @constructor
          * @extend {CheckBox}
          */
         function Select(parameters, parent) {
            SelectMultiple.call(this, parameters, parent);
         }

         Select.prototype                        = Object.create(SelectMultiple.prototype);
         Select.prototype.constructor            = Select;

         Select.prototype.buildDOM               = function buildDOM() {
            SelectMultiple.prototype.buildDOM.call(this);
            this.selectDOM.multiple = false;
         };

         Select.prototype.getValue               = function getValue() {

            var /** @type {Array} */ value;

            value = SelectMultiple.prototype.getValue.apply(this, arguments);

            return value !== undefined ? value[0] : undefined;
         };

         /**
          *
          * @param value
          * @public
          */
         Select.prototype.setCacheValue          = function setValue(value) {
            if (!(value instanceof Array) && value !== undefined)
               value = [value];

            BaseType.prototype.setCacheValue.call(this, value);
         };

         /**
          *
          * @param parametersList
          */
         Select.coalesceParameters               = function coalesceParameters(parametersList) {
            var coalescedParameters;

            coalescedParameters = ListBased.coalesceParameters(parametersList);
         };

         return Select;

      })();

      var SelectItem     = (function() {

         /**
          *
          * Note : the select item will automatically add the primary keys
          * @name AdminLib.widget.Form.Field.TypeField.SelectItem
          * @class
          * @extends AdminLib.widget.Form.Field.TypeField.BaseType
          * @constructor
          *
          * @param {AdminLib.widget.Form.Parameters.FieldType.SelectItem} parameters
          * @param {AdminLib.widget.Form}                                 parent
          *
          * @property {string}                                      apiFields            List of fields to retreive
          * @property {Item[]}                                      data                 Selectable data
          * @property {HTMLInputElement}                            dom
          * @property {AdminLib.Action.Button}                       emptyButton          Button that will empty the widget
          * @property {AdminLib.EqualFunction}                       equalFunction
          * @property {AdminLib.widget.Datatable.Parameters.Field[]} fields
          * @property {string[]}                                    fieldsCodes          List of fields to display
          * @property {AdminLib.Action.Button}                       searchButton         Button used to show the select modal
          * @property {AdminLib.widget.Datatable.Link.Enabled}       selectableItems
          * @property {AdminLib.Model.Handler}                       source
          */
         function SelectItem(parameters, parent) {

            BaseType.call(this, parameters, parent);

            parameters = SelectItem.coalesceParameters([parameters]);

            if (!(parameters.source instanceof Promise)) {

               if (typeof(parameters.source) === 'string')
                  parameters.source = AdminLib.model(parameters.source).loadHandler();

               else if (parameters.source instanceof AdminLib.Model)
                  parameters.source = parameters.source.loadHandler();
               else
                  parameters.source = Promise.resolve(parameters.source);
            }

            this.eventTarget     = new AdminLib.EventTarget();

            this.apiFilters      = parameters.apiFilters;
            this.equalFunction   = parameters.equal;
            this.fieldsCodes     = parameters.fields;
            this.searchFirst     = parameters.searchFirst;
            this.selectableItems = parameters.selectableItems;
            this.selectedItem    = parameters.selectedItem;
            this.title           = parameters.title;

            switch(this.style.heightClass[0]) {

               case 'input-sm':
                  this.buttonClass = 'btn-sm';
                  break;

               case 'input-lg':
                  this.buttonClass = 'btn-lg';
                  break;

               case 'input-xs':
                  this.buttonClass = 'btn-xs';
                  break;

               default:
                  this.buttonClass = '';
            }

            // Loading the source
            this.promise = parameters.source
               .then(function(source) {

                  this.source = source;
                  this.fields = new AdminLib.Collection();

                  if (this.fieldsCodes === undefined) {

                     this.fieldsCodes = this.source.getFields().map(function(field) {
                        return field.getCode();
                     });

                     this.apiFields   = this.fieldsCodes.slice(0);
                  }
                  else {

                     this.apiFields   = this.fieldsCodes.slice(0);

                  }

                  // Retreiving the fields from the source
                  this.fieldsCodes.forEach(function(code) {

                     var /** @type {AdminLib.Model.Handler.Field} */ field;

                     field = source.getField(code);

                     if (field === undefined)
                        throw 'The field "' + code + '" don\'t exists in the source';

                     this.fields.push(field);

                  }.bind(this));

               }.bind(this));

            this.update();
         }

         SelectItem.prototype                    = Object.create(BaseType.prototype);
         SelectItem.prototype.constructor        = SelectItem;

         /**
          * Build the element that will be display as input.
          * @internal
          */
         SelectItem.prototype.buildDOM           = function buildDOM() {

            this.searchButton = new AdminLib.Action.Button({ action  : this.displayModal.bind(this)
                                                          , icon    : 'glyphicon glyphicon-search'
                                                          , 'class' : 'btn btn-primary ' + this.buttonClass});

            this.emptyButton  = new AdminLib.Action.Button({ action  : this.empty.bind(this)
                                                          , icon    : 'glyphicon glyphicon-remove'
                                                          , 'class' : 'btn btn-link ' + this.buttonClass});

            this.dom = AdminLib.dom.build(template, this);

            this.inputElement            = this.dom.querySelector('input');
            this.inputElement.type       = 'text';
            this.inputElement.classList.add('form-control');

            if (this.placeholder)
               this.inputElement.placeholder = this.placeholder;

            this.inputElement.disabled    = true;

            this.dom.querySelector('#searchButton').appendChild(this.searchButton.getDOM());
            this.dom.querySelector('#emptyButton').appendChild(this.emptyButton.getDOM());

            this.inputElement.addEventListener('change', this.onchange.bind(this));

            this.dom.querySelector('a#link').addEventListener('click', this.follow.bind(this));

            this.builded = true;
            this.update();
         };

         /**
          * Will display the select modal.
          * If the "searchFirst" is true, then the modals will first display the search form
          * @private
          */
         SelectItem.prototype.displayModal       = function displayModal() {

            var /** @type {Promise}                                  */ loadDataPromise
              , /** @type {AdminLib.widget.Modal.Datatable.Parameters} */ modalDatatableParameters
              , /** @type {Promise.<Item>}                           */ promise;

            if (this.searchFirst)
               return this.displaySearchModal();

            promise = new Promise(function(fulfill) {
               this.fulfillFunction = fulfill;
            }.bind(this));

            this.promise
               .then(
                  function() {
                     return this.getDatatablePromise(this.apiFilters)
                  }.bind(this))
               .then(
                  function(datatable) {

                     this.modal = new AdminLib.widget.Modal({title : this.title});
                     this.modal.setContent(datatable);
                     this.modal.display();

                     this.modal.addEventListener (   AdminLib.widget.Modal.event.displayed
                                                  ,   function() {
                                                         datatable.focusOnSearchInput();
                                                      });

                  }.bind(this));

         };

         SelectItem.prototype.dispose            = function dispose() {
         };

         /**
          * Display the search modal
          * @private
          */
         SelectItem.prototype.displaySearchModal = function displaySearchModal() {

            var /** @type {Promise}                                  */ loadDataPromise
              , /** @type {AdminLib.widget.Modal.Datatable.Parameters} */ modalDatatableParameters
              , /** @type {Promise.<Item>}                           */ promise;

            promise = new Promise(function(fulfill) {
               this.fulfillFunction = fulfill;
            }.bind(this));

            this.promise
               .then(
                  function() {
                     var /** @type {AdminLib.Action.Button}              */ searchButton
                       , /** @type {AdminLib.Model.Handler.SearchScreen} */ searchScreen;

                     searchScreen = this.source.getSearchScreen({ cancel   : true
                                                                , modal    : true
                                                                , autoHide : false});

                     searchScreen.addEventListener ( AdminLib.Model.Handler.SearchScreen.event.search
                                                   ,  this.onsearch.bind(this, searchScreen));


                     // Moving the search button from the search form to the modal footer
                     this.searchModal = searchScreen.getWidget();
                     searchButton = searchScreen.getSearchButton();
                     this.searchModal.addButton(searchButton);

                     searchScreen.addEventListener('closed', function() {
                        searchScreen.dispose();
                     });

                     // Displaying the search screen
                     return searchScreen.display();
                  }.bind(this))

         };

         /**
          * Display the detail of the item
          * @private
          */
         SelectItem.prototype.follow             = function follow(event) {
            var /** @type {Item} */ value;

            value = this.getValue();

            event.preventDefault();
            event.stopImmediatePropagation();

            this.source.display(value);

            return false;
         };

         /**
          * Search for the item corresponding to the search parameters and
          * return a promise that resolve a datatable displaying theses data.
          * @param {Object|function(Object)} searchParameters
          * @returns {Promise<AdminLib.widget.Datatable>}
          * @private
          */
         SelectItem.prototype.getDatatablePromise = function getDatatablePromise(searchParameters) {

            var /** @type {*} */ cachedValue;

            if (typeof(searchParameters) === 'function')
               searchParameters = searchParameters(this.parent);

            return this.source.loadData(this.apiFields, searchParameters)
                     .then(
                        function(data) {

                           var /** @type {AdminLib.widget.Datatable}           */ datatable
                             , /** @type {AdminLib.widget.Datatable.Parameter} */ datatableParameters
                             , /** @type {string}                             */ fieldCode
                             , /** @type {AdminLib.widget.Datatable.Row}       */ selectedRow;

                           datatableParameters = { create          : false
                                                 , data            : data
                                                 , editable        : false
                                                 , fields          : this.fields.map(
                                                                      function(field) {
                                                                         return this.getFieldParameters(field);
                                                                      }.bind(this))}

                           datatable =  new AdminLib.widget.Datatable(datatableParameters);

                           cachedValue = this.getCachedValue();

                           // Activating the selected item row
                           if (cachedValue) {

                              // Seeking the row of the cached value
                              selectedRow = datatable.getRow(cachedValue, this.equalFunction);

                              // If the row has been found in the datatable, then we select it
                              if (selectedRow) {
                                 selectedRow.select();

                                 // Making the cell of the link selected row enabled
                                 for(fieldCode of this.fieldsCodes) {
                                    datatable.getField(fieldCode).getLink().toggleEnabled(true, selectedRow);
                                 }
                              }
                           }

                           return datatable;

                        }.bind(this))

         };

         /**
          * Return the DOM of the select item.
          * Note : the dom returned is the dom of the "input" element, not the modal.
          * @returns {HTMLInputElement}
          * @public
          */
         SelectItem.prototype.getDOM             = function getDOM() {
            if (this.dom === undefined)
               this.buildDOM();

            return this.dom;
         };

         /**
          *
          * @param field
          * @returns {AdminLib.widget.Datatable.Parameters.BaseField}
          * @private
          */
         SelectItem.prototype.getFieldParameters = function getFieldParameters(field) {

            var /** @type {AdminLib.widget.Datatable.Parameters.BaseField} */ fieldParameters;

            fieldParameters = field.getDatatableBaseFieldParameters();

            fieldParameters.clicableCell = true;
            fieldParameters.link         = { enabled : this.selectableItems
                                           , equal   : this.equalFunction
                                           , handler : this.onitemselect.bind(this)};

            return fieldParameters;
         };

         /**
          *
          * @param {Item} item
          * @returns {string}
          * @public
          */
         SelectItem.prototype.getItemLabel       = function getItemLabel(item) {
            return this.source.getItemLabel(item);
         };

         /**
          * @param {Item} item
          * @returns {string}
          * @public
          */
         SelectItem.prototype.getItemURL         = function getItemURL(item) {
            return this.source.getURL(item);
         };

         /**
          * Return the selected item
          * @returns {Item}
          */
         SelectItem.prototype.getValue           = function getValue() {
            return this.getCachedValue();
         };

         /**
          *
          * @param {Item} item
          */
         SelectItem.prototype.isSelectable       = function isSelectable(item) {



         };

         /**
          * Check if the given object correspond to a defined item.
          * A defined item is either :
          *    - undefined
          *    - {}
          *
          * This function exists because DjangoSharp can send an empty object
          * when the database value is NULL.
          * @param {Item} item
          * @returns {boolean}
          * @public
          */
         SelectItem.prototype.isDefined          = function isDefined(item) {
            if (item === undefined)
               return false;

            if (Object.keys(item).length === 0)
               return false;

            return true;
         };

         /**
          * Function executed once the user have selected an item
          * @private
          */
         SelectItem.prototype.onitemselect       = function onitemselect(item) {

            var /** @type {AdminLib.Event} */ event;

            this.setValue(item);
            this.modal.hide();

            if (this.searchModal)
               this.searchModal.hide();

            event = new AdminLib.Event('change', { cancelable : false
                                                , target     : this.parent});

            this.onchange(event);
         };

         /**
          * Function executed when the search is submited
          * @param {AdminLib.Model.Handler.SearchScreen} searchScreen
          * @param {AdminLib.Event}                      event
          * @private
          */
         SelectItem.prototype.onsearch           = function onsearch(searchScreen, event) {

            var /** @tyoe {Promise.<AdminLib.widget.Datatable>} */ datatablePromise
              , /** @type {Object}                             */ searchParameters;

            searchParameters = event.detail.searchParameters;
            datatablePromise = this.getDatatablePromise(searchParameters);

            datatablePromise.then(function(datatable) {

               this.modal = new AdminLib.widget.Modal({title : this.title});
               this.modal.setContent(datatable.getDOM());

               this.modal.getReturnLink().classList.remove('hide');

               this.modal.getReturnLink().addEventListener('click', function(event) {

                  this.modal.hide();
                  event.preventDefault();

                  return false;

               }.bind(this));

               this.modal.display();

            }.bind(this));

         };

         /**
          * Update the value of the input element according to the selected item.
          * @private
          */
         SelectItem.prototype.update             = function update() {

            var /** @type {*} */ value;

            // Note : The "update" function is call by BaseType on initialization.
            //        At that time, the "promise" property don't exists already : we quit now
            //        but we will execute the "update" function at the end of
            //        initialization.
            if (!this.promise)
               return;

            value = this.getCachedValue();

            this.promise.then(function() {

               // If the dom is not already created, we have nothing to do
               if (!this.inputElement)
                  return;

               if (this.isDefined(value))
                  this.inputElement.value = this.getItemLabel(value);
               else
                  this.inputElement.value = '';

            }.bind(this));

            if (this.dom) {
               if (this.isEnabled()) {
                  this.searchButton.enable();
                  this.emptyButton.enable();
               }
               else {
                  this.searchButton.disable();
                  this.emptyButton.disable();
               }

               this.promise.then(function() {
                  this.updateLink();
               }.bind(this));

            }
         };

         /**
          * Update the value (label and href) of the link
          * @private
          */
         SelectItem.prototype.updateLink         = function updateLink() {

            var /** @type {Item}        */ item
              , /** @type {HTMLElement} */ linkDOM
              , /** @type {string}      */ linkLabel
              , /** @type {string}      */ linkURL;

            item = this.getValue();

            linkDOM = this.dom.querySelector('a#link');

            AdminLib.dom.empty(linkDOM);

            if (this.isDefined(item)) {
               linkLabel = this.getItemLabel(item);
               linkURL   = this.getItemURL(item);

               linkLabel = linkLabel === undefined || linkLabel === null || linkLabel === '' ? '<item>' : linkLabel;

               linkDOM.appendChild(document.createTextNode(linkLabel));
               linkDOM.href = linkURL;
            }

         };

         /**
          *
          * @param {AdminLib.widget.Form.Field.TypeField.SelectItem.Parameters[]} parametersList
          * @param {boolean}                                     [coalesceSubElements=true]
          * @returns {AdminLib.widget.Form.Field.TypeField.SelectItem.Parameters}
          */
         SelectItem.coalesceParameters           = function coalesceParameters(parametersList, coalesceSubElements) {
            var /** @type {AdminLib.widget.Form.SelectItem.Parameters} */ coalescedParameters;

            coalesceSubElements = AdminLib.coalesce(coalesceSubElements, true);

            coalescedParameters                 = BaseType.coalesceParameters(parametersList);
            coalescedParameters.apiFilters      = AdminLib.coalesceAttribute('apiFilters'     , parametersList);
            coalescedParameters.equal           = AdminLib.coalesceAttribute('equal'          , parametersList);
            coalescedParameters.fields          = AdminLib.coalesceAttribute('fields'         , parametersList);
            coalescedParameters.searchFirst     = AdminLib.coalesceAttribute('searchFirst'    , parametersList, false);
            coalescedParameters.selectedItem    = AdminLib.coalesceAttribute('selectedItem'   , parametersList);
            coalescedParameters.selectableItems = AdminLib.coalesceAttribute('selectableItems', parametersList);
            coalescedParameters.source          = AdminLib.coalesceAttribute('source'         , parametersList);
            coalescedParameters.title           = AdminLib.coalesceAttribute('title'          , parametersList, 'Select an element');

            if (coalescedParameters.fields)
               coalescedParameters.fields = coalescedParameters.fields.slice(0);

            if (coalescedParameters.selectableItems instanceof Array)
               coalescedParameters.selectableItems.include = coalescedParameters.selectableItems.include;

            return coalescedParameters;
         };

         var template =    '<div class="{{inputSizeClass}}">'
                        +     '<div class="input-group">'
                        +        '<input type="text" class="form-control {{#style}}{{#heightClass}} {{.}}{{/heightClass}}{{/style}}">'
                        +        '<span class="input-group-btn" id="searchButton"></span>'
                        +        '<span class="input-group-btn" id="emptyButton"></span>'
                        +        '<a id="link" class="form-control-static"></a>'
                        +     '</div>'
                        +  '</div>';

         return SelectItem;

      })();

      var Static         = (function() {

         /**
          * @name Static
          * @extends BaseType
          * @param {Object}              parameters
          * @param {AdminLib.widget.Form} parent
          * @extends BaseType
          * @param parameters
          * @constructor
          */
         function Static(parameters, parent) {
            BaseType.call(this, parameters, parent, template);
         }

         Static.prototype                        = Object.create(BaseType.prototype);
         Static.prototype.constructor            = Static;

         /**
          * @internal
          */
         Static.prototype.dispose                = function() {
         };

         Static.prototype.getValue               = function() {
            return this.getCachedValue();
         };

         Static.prototype.update                 = function() {

            var /** @type {*} */ value;

            value = this.getCachedValue();

            if (value === undefined)
               value = '';

            this.getDOM().querySelector('p').innerText = value;
         };

         var template =    '<div>'
                        +     '<p class="form-control-static">{{getCachedValue}}</p>'
                        +  '</div>';

         return Static;
      })();

      var Text           = (function() {

         /**
          * @extends Input
          * @param {AdminLib.widget.Form.Parameters.FieldType.Input} parameters
          * @param {AdminLib.widget.Form}                            parent
          * @constructor
          * @extends {Input}
          */
         function Text(parameters, parent) {
            Input.call(this, parameters, parent, 'text');
         }

         Text.prototype                          = Object.create(Input.prototype);
         Text.prototype.constructor              = Text;

         /**
          * @private
          */
         Text.prototype.onchange                 = function onchange(event) {

            var /** @type {*} */ cacheValue
              , /** @type {*} */ value;

            value      = this.getValue();
            cacheValue = this.getCachedValue();

            if (cacheValue === value)
               return;

           // Event : change
            event = new AdminLib.Event( Field.event.change
                                     , { cancelable : true
                                       , target     : this.parent });

            this.dispatchEvent(event);

            // If the change is prevented, then we restore the cache value
            if (event.defaultPrevented) {
               this.inputElement.value = cacheValue;
               return;
            }
            // End event

            this.setCacheValue(value);

            // Event : changed
            event = new AdminLib.Event( Field.event.changed
                                     , { cancelable : false
                                       , target     : this.parent });

            this.dispatchEvent(event);
            // End event
         };

         return Text;

      })();

      var fieldTypes     = {};

      fieldTypes[AdminLib.FIELD_TYPES.CHECKBOX]        = Checkbox;
      fieldTypes[AdminLib.FIELD_TYPES.CODE_EDITOR]     = CodeEditor;
      fieldTypes[AdminLib.FIELD_TYPES.DATE]            = Date;
      fieldTypes[AdminLib.FIELD_TYPES.DATE_TIME]       = DateTime;
      fieldTypes[AdminLib.FIELD_TYPES.FILE]            = File;
      fieldTypes[AdminLib.FIELD_TYPES.NUMBER]          = Number;
      fieldTypes[AdminLib.FIELD_TYPES.ORDERABLE_LIST]  = OrderableList;
      fieldTypes[AdminLib.FIELD_TYPES.ORDERABLE_TABLE] = OrderableTable;
      fieldTypes[AdminLib.FIELD_TYPES.PARAGRAPH]       = Paragraph;
      fieldTypes[AdminLib.FIELD_TYPES.RADIO]           = Radio;
      fieldTypes[AdminLib.FIELD_TYPES.SELECT]          = Select;
      fieldTypes[AdminLib.FIELD_TYPES.SELECT_ITEM]     = SelectItem;
      fieldTypes[AdminLib.FIELD_TYPES.SELECT_MULTIPLE] = SelectMultiple;
      fieldTypes[AdminLib.FIELD_TYPES.STATIC]          = Static;
      fieldTypes[AdminLib.FIELD_TYPES.TEXT]            = Text;

      return fieldTypes;
   })();

   // ******************** Action ********************
   /**
    * @name AdminLib.widget.Form.Action
    * @param {AdminLib.Action.Button.Parameter} parameters
    * @param {AdminLib.widget.Form}            parent
    * @constructor
    */
   function Action(parameters, parent) {

      parameters = AdminLib.element.Button.coalesceParameters([parameters]);

      if (parameters.action)
         parameters.action = parameters.action.bind(undefined, parent, this);

      AdminLib.element.Button.call(this, parameters);
   }

   Action.prototype                              = Object.create(AdminLib.element.Button.prototype);
   Action.prototype.constructor                  = Action;

   // ******************** Field ********************
   /**
    * @name AdminLib.widget.Form.Field
    * @param {AdminLib.widget.Form.Field.Parameters} parameters
    * @constructor
    * @property {string}                                code
    * @property {*}                                     default
    * @property {boolean}                               enabled
    * @property {string}                                errorMessage
    * @property {string}                                helpText
    * @property {AdminLib.widget.Form.Field.Style.Input} inputStyle
    * @property {string}                                label
    * @property {AdminLib.widget.Form.Field.Style.Input} labelStyle
    * @property {string}                                placeholder
    * @property {boolean}                               required
    */
   function Field(parameters) {

      AdminLib.EventTarget.call(this);

      parameters       = Field.coalesceParameters([parameters]);

      this.code                    = parameters.code;
      this.default                 = parameters.default;
      this.enabled                 = parameters.enabled;
      this.helpText                = parameters.helpText;
      this.toFormDataValueFunction = parameters.toFormDataValue;
      this.label                   = parameters.label;
      this.required                = !parameters.nullable;
      this.initialValue            = parameters.value;
      this.placeholder             = parameters.placeholder;
      this.inputStyle              = parameters.style.input;
      this.labelStyle              = parameters.style.label;
      this.setValueFunction        = parameters.setValue;
      this.validation              = parameters.validation;
      this.visible                 = parameters.visible;

      // Property : attribute
      this.attribute = AdminLib.coalesce(parameters.attribute, this.code);

      if (parameters.type === AdminLib.FIELD_TYPES.AUTO) {

         if (!parameters.input)
            parameters.type = AdminLib.FIELD_TYPES.TEXT;

         else if (parameters.input.options)
            parameters.type = AdminLib.FIELD_TYPES.SELECT;

         else if (parameters.input.source)
            parameters.type = AdminLib.FIELD_TYPES.SELECT_ITEM;

         else
            parameters.type = AdminLib.FIELD_TYPES.TEXT;

      }

      // TODO : use this.input instead of this.type

      this.typeCode = parameters.type;
      this.input    = new fieldTypes[parameters.type](parameters.input, this);

      if (parameters.value !== undefined)
         this.input.setValue(parameters.value);

      // Controls
      if (this.input === undefined)
         throw new AdminLib.Error('Invalid type for the field "' + this.code + '"');

   }

   Field.prototype                               = Object.create(AdminLib.EventTarget.prototype);
   Field.prototype.constructor                   = Field;

   Field.prototype.addEventListener              = function(eventType, listener) {
      return this.input.addEventListener(eventType, listener);
   };

   /**
    * Build the DOM of the field
    * @private
    */
   Field.prototype.buildDOM                      = function() {

      var /** @type {string} */ template
        , /** @type {HTMLElement} */ typeDOM;

      template =     '<div class="form-group"'
                  +     ' data-adminlib-widget-form-field-type="'    + this.typeCode    + '"'
                  +     ' data-adminlib-widget-form-field-enabled="' + this.isEnabled() + '"'
                  +     '>'
                  +     '{{#labelStyle}}<label for="input_{{code}}" class="control-label {{sizeClass}} {{^displayed}}hide{{/displayed}}">{{label}}</label>{{/labelStyle}}'
                  +     '</div>'
                  +     '<div class="help-block"></div>'
                  +     '<div class="help-block-error">{{errorMessage}}</div>'
                  +  '</div>';

      this.dom            = AdminLib.dom.build(template, this);
      this.helpBlockError = this.dom.querySelector('help-block-error');

      typeDOM = this.input.getDOM();

      for(var sizeClass of this.inputStyle.sizeClass) {
         typeDOM.classList.add(sizeClass);
      }

      this.dom.insertBefore(typeDOM, this.dom.querySelector('.help-block'));

      if (!this.visible) {
         this.visible = undefined;
         this.hide();
      }


   };

   /**
    * Remove all validation classes.
    * @public
    */
   Field.prototype.cleanValidation               = function() {
      var /** @type {HTMLElement} */ dom;

      dom = this.getDOM();

      dom.classList.remove('has-error');
      dom.classList.remove('has-success');
      dom.classList.remove('has-warning');

      this.setErrorMessage();
   };

   /**
    * Enable the field.
    * @public
    */
   Field.prototype.enable                        = function() {
      this.input.enable();

      this.getDOM().classList.remove('asStatic');

      this.getDOM().setAttribute('data-adminlib-widget-form-field-enabled', '' + true);

      this.input.enable();
   };

   /**
    * Disable the field
    * @param {boolean} [asStatic=false] If true, then the field will appear as static (as a
    * @param {boolean} [reset]          If true, then the field will reset its value
    * @public
    */
   Field.prototype.disable                       = function(asStatic, reset) {
      this.input.disable(asStatic);

      this.getDOM().classList.toggle('asStatic', asStatic);
      this.getDOM().setAttribute('data-adminlib-widget-form-field-enabled', '' + false);
      this.input.disable();

      if (reset)
         this.reset();
   };

   Field.prototype.dispose                       = function() {

      var /** @type {AdminLib.Event} */ event;

      // Event : dispose
      event = new AdminLib.Event ( Field.event.dispose
                                , { cancelable : false
                                  , target     : this});

      this.dispatchEvent(event);
      // Event : dispose

      this.input.dispose();

      // Event : disposed
      event = new AdminLib.Event ( Field.event.disposed
                                , { cancelable : false
                                  , target     : this});

      this.dispatchEvent(event);
      // Event : disposed

   };

   /**
    * Empty the fields
    * @public
    */
   Field.prototype.empty                         = function() {
      this.input.empty();
   };

   /**
    * @public
    */
   Field.prototype.getAttribute                  = function() {
      return this.attribute;
   };

   /**
    * Return the code of the field
    * @returns {string}
    * @public
    */
   Field.prototype.getCode                       = function() {
      return this.code;
   };

   /**
    * Return the DOM of the field
    * @returns {HTMLElement}
    */
   Field.prototype.getDOM                        = function() {
      if (this.dom === undefined)
         this.buildDOM();

      return this.dom;
   };

   /**
    *
    * @returns {*}
    * @public
    */
   Field.prototype.getInput                      = function() {
      return this.input;
   };

   Field.prototype.getFormDataValue              = function() {

      var /** @type {*} */ value;

      value = this.getValue();

      if (this.toFormDataValueFunction)
         return this.toFormDataValueFunction(value);

      return value;
   };

   /**
    * Return the value defined at initialization of the field
    * @returns {*}
    * @public
    */
   Field.prototype.getInitialValue               = function() {
      return this.initialValue;
   };

   /**
    * Return the value of the field.
    * @returns {*}
    * @public
    */
   Field.prototype.getValue                      = function() {
      return this.input.getValue();
   };

   /**
    * Indicate if the field has been emptied since the last save
    * @returns {boolean}
    * @public
    */
   Field.prototype.hasBeenEmptied                = function() {

      var /** @type {*} */ value;

      if (this.initialValue === undefined || this.initialValue === '' || this.initialValue === null)
         return false;

      value = this.getValue();

      return value === undefined || value === '' || value === null;
   };

   /**
    * Hide the field from the form.
    * Note that the value is still updatable and will still be "exported" when calling the "getValue" function
    * from the form
    * @public
    */
   Field.prototype.hide                          = function() {
      this.toggleVisible(false);
   };

   /**
    *
    * @returns {boolean}
    * @public
    */
   Field.prototype.isEnabled                     = function() {
      return this.input.isEnabled();
   };

   /**
    *
    * @returns {boolean}
    * @public
    */
   Field.prototype.isMultiple                    = function() {
      return this.multiple;
   };

   /**
    *
    * @param {string}          eventType
    * @param {function(Event)} listener
    * @public
    */
   Field.prototype.removeEventListener           = function(eventType, listener) {
      this.input.removeEventListener(eventType, listener);
   };

   /**
    * Reset the value of the field to the value of the initial value
    * @public
    */
   Field.prototype.reset                         = function() {
      this.input.reset();
   };

   Field.prototype.setErrorMessage               = function(message) {

      this.errorMessage = message;

      if (this.helpBlockError) {
         if (message)
            this.helpBlockError.appendChild(document.createTextNode(message));
         else
            AdminLib.dom.empty(this.helpBlockError);
      }

   };

   /**
    *
    * @param {Object} formValue
    * @internal
    */
   Field.prototype.setFormValue                  = function(formValue) {

      var /** @type {*} */ value;

      value = this.getValue();

      if (this.setValueFunction)
         this.setValueFunction(formValue, value, this);
      else
         formValue[this.attribute] = value;

   };

   /**
    * Define the label of the field
    * @param {string} label
    */
   Field.prototype.setLabel                      = function(label) {

      var /** @type {HTMLElement} */ domLabel;

      this.label = label;

      if (this.dom === undefined)
         return;

      label = AdminLib.coalesce(this.label, '');

      domLabel = this.dom.querySelector('label');

      AdminLib.dom.empty(domLabel);

      domLabel.appendChild(document.createTextNode(this.label));
   };

   /**
    * Add a validation class.
    * @param {AdminLib.widget.Form.Field.VALDIATION} validation
    * @public
    */
   Field.prototype.setValidation                 = function(validation) {

      var /** @type {HTMLElement} */ dom;

      dom = this.getDOM();

      switch(validation) {

         case Field.VALIDATION.ERROR:
            this.cleanValidation();
            dom.classList.add('has-error');
            break;

         case Field.VALIDATION.SUCCESS:
            this.cleanValidation();
            dom.classList.add('has-success');
            break;

         case Field.VALIDATION.WARNING:
            this.cleanValidation();
            dom.classList.add('has-warning');
            break;
      }
   };

   /**
    * Set the field value.
    * @param {*} value
    * @public
    */
   Field.prototype.setValue                      = function(value) {

      var /** @type {AdminLib.Event} */ event;

      // Event : change
      event = new AdminLib.Event( Field.event.change
                               , { cancelable : true
                                 , target     : this });

      this.dispatchEvent(event);

      if (event.defaultPrevented)
         return;
      // End event

      this.input.setValue(value);
   };

   /**
    * @public
    */
   Field.prototype.show                          = function() {
      this.toggleVisible(true);
   };

   /**
    *
    * @param {boolean} [enabled]
    * @public
    */
   Field.prototype.toggleEnable                  = function(enabled) {
      enabled = AdminLib.coalesce(enabled, !this.isEnabled());

      if (enabled)
         this.enable();
      else
         this.disable();
   };

   /**
    *
    * @param {boolean} [visible]
    * @public
    */
   Field.prototype.toggleVisible                 = function(visible) {

      visible = !!AdminLib.coalesce(visible, !this.visible);

      if (visible === this.visible)
         return;

      this.visible = visible;

      if (!this.dom)
         return;

      this.dom.classList.toggle('hide', !visible);
   };

   /**
    *
    * @param {AdminLib.widget.Form.Field.Parameters[]} parametersList
    * @returns {AdminLib.widget.Form.Field.Parameters}
    * @public
    */
   Field.coalesceParameters                      = function(parametersList) {

      var /** @type {AdminLib.widget.Form.Field.Parameters} */ coalescedParameters
        , style
        , inputStyleParameters
        , labelStyleParameters;

      parametersList = AdminLib.coalesce(parametersList, []);

      coalescedParameters = { attribute       : AdminLib.coalesceAttribute('attribute'      , parametersList)
                            , code            : AdminLib.coalesceAttribute('code'           , parametersList)
                            , 'default'       : AdminLib.coalesceAttribute('default'        , parametersList)
                            , enabled         : AdminLib.coalesceAttribute('enabled'        , parametersList, true)
                            , toFormDataValue : AdminLib.coalesceAttribute('toFormDataValue', parametersList)
                            , helpText        : AdminLib.coalesceAttribute('helpText'       , parametersList)
                            , input           : AdminLib.coalesceAttribute('input'          , parametersList, {})
                            , label           : AdminLib.coalesceAttribute('label'          , parametersList)
                            , nullable        : AdminLib.coalesceAttribute('nullable'       , parametersList, true)
                            , placeholder     : AdminLib.coalesceAttribute('placeholder'    , parametersList)
                            , setValue        : AdminLib.coalesceAttribute('setValue'       , parametersList)
                            , type            : AdminLib.coalesceAttribute('type'           , parametersList, AdminLib.FIELD_TYPES.AUTO)
                            , validation      : AdminLib.coalesceAttribute('validation'     , parametersList)
                            , value           : AdminLib.coalesceAttribute('value'          , parametersList)
                            , visible         : AdminLib.coalesceAttribute('visible'        , parametersList, true)};

      style = AdminLib.list.attribute('style', parametersList);
      inputStyleParameters = AdminLib.list.attribute('input', style);
      labelStyleParameters = AdminLib.list.attribute('label', style);

      coalescedParameters.style = { input : { sizeClass   : AdminLib.coalesceAttribute('sizeClass'  , inputStyleParameters)
                                            , heightClass : AdminLib.coalesceAttribute('heightClass', inputStyleParameters)}

                                  , label : { displayed : AdminLib.coalesceAttribute('displayed', labelStyleParameters, true)
                                            , sizeClass : AdminLib.coalesceAttribute('sizeClass', labelStyleParameters) } };

      if (coalescedParameters.label === undefined && coalescedParameters.code)
         coalescedParameters.label = coalescedParameters.code.capitalizeFirstLetter();

      coalescedParameters.style.input.sizeClass   = AdminLib.list.convert(coalescedParameters.style.input.sizeClass  );
      coalescedParameters.style.input.heightClass = AdminLib.list.convert(coalescedParameters.style.input.heightClass);

      return coalescedParameters;
   };

   Field.event                                   = { change   : 'change'
                                                   , changed  : 'changed'
                                                   , dispose  : 'dispose'
                                                   , disposed : 'disposed'};

   /**
    * @enum AdminLib.widget.Form.Field.VALDIATION
    */
   Field.VALIDATION = { SUCCESS : 1
                      , WARNING : 2
                      , DANGER  : 3 };


   // ******************** FormField ********************
   /**
    * @name AdminLib.widget.Form.FormField
    * @extends AdminLib.widget.Form.Field
    *
    * @param {AdminLib.widget.Form.Field.Parameters} parameters
    * @param {AdminLib.widget.Form}                  parent
    * @constructor
    * @property {AdminLib.widget.Form} parent
    */
   function FormField(parameters, parent) {

      var /** @type {AdminLib.widget.Form.Field.Style}        */ formFieldParameters
        , /** @type {AdminLib.widget.Form.Field.Parameters[]} */ listParameters;

      this.parent = parent;

      formFieldParameters = {style : { input : { sizeClass   : this.parent.inputSizeClass }
                                     , label : { sizeClass   : this.parent.labelSizeClass }}};

      listParameters = [parameters, formFieldParameters];

      parameters = Field.coalesceParameters(listParameters);

      Field.call(this, parameters);

      // Controls
         // Property : code
         // Checking that the code don't exists in the parent
      if (parent.getField(this.code))
         throw 'Code "' + this.code + '" already exists';

   }

   FormField.prototype                           = Object.create(Field.prototype);
   FormField.prototype.constructor               = FormField;

   /**
    * Enable the field.
    * The field can't be enabled if the parent is disabled.
    * @public
    */
   FormField.prototype.enable                    = function() {
      if (!this.parent.isEnabled())
         throw 'The form is not enabled';

      Field.prototype.enable.apply(this, arguments);
   };

   FormField.coalesceParameters                  = function(parametersList) {

      var /** @type {AdminLib.widget.Form.FormField.Parameters} */ coalescedParameters;

      coalescedParameters = Field.coalesceParameters(parametersList);

      return coalescedParameters;

   };

   // ******************** Form ********************

   /**
    *
    * Events :
    *
    *    - AdminLib.widget.Form.event.change
    *
    *       Event fired when the user change the value of a field.
    *       The event is fired BEFORE the change of value is saved
    *
    *       Cancellable : true
    *       Target      : <AdminLib.widget.Form.Field> : The changed field
    *
    *
    *
    *    - AdminLib.widget.Form.event.changed :
    *
    *       Event fired when the user change the value of a field.
    *       The event is fired AFTER the change of value is saved.
    *
    *       Cancellable : false
    *       Target      : <AdminLib.widget.Form.Field> : The changed field
    *
    *
    *
    *    - AdminLib.widget.Form.event.submit
    *
    *       Event fired when the user submit the form.
    *       The event is fired BEFORE the submit of the form.
    *
    *       Cancellable : true
    *       Target      : <AdminLib.widget.Form> : The submitted form
    *
    *
    *
    *    - AdminLib.widget.Form.event.submited :
    *
    *       Event fired when the user submit the form.
    *       The event is fired AFTER the submission of the form
    *
    *       Cancellable : false
    *       Target      : <AdminLib.widget.Form> : The submitted form
    *
    *
    * @name AdminLib.widget.Form
    * @class
    * @extend AdminLib.EventTarget
    * @param {AdminLib.widget.Form.Parameters} parameters
    * @constructor
    * @property {string}        domID         - ID of the FORM element
    * @property {Field[]}       enabledFields - List of all enabled fields. This list is used when the form is disabled/enable to restore only the previously enabled fields
    * @property {AdminLib.Model} model
    * @property {boolean}       modal
    */
   function Form(parameters) {

      AdminLib.EventTarget.call(this);

      parameters = Form.coalesceParameters([parameters]);

      this.id             = FormID++;
      this.domID          = 'AdminLib_widget_Form_' + this.id;
      this.fields         = new AdminLib.Collection([Field, Section]);
      this.actions        = new AdminLib.Collection(Action);
      this.labelSizeClass = parameters.labelSizeClass;
      this.inputSizeClass = parameters.inputSizeClass;
      this.horizontal     = parameters.horizontal;
      this.actionSizeClass= parameters.actionSizeClass;
      this.enabledFields   = [];
      this.enabled         = true;

      // Property : sizeClass

      if (parameters.sizeClass instanceof AdminLib.dom.ClassList)
         this.sizeClass       = parameters.sizeClass;
      else
         this.sizeClass       = new AdminLib.dom.ClassList(parameters.sizeClass);

      // Adding actions
      parameters.actions.forEach(this.addAction.bind(this));

      // Adding fields
      parameters.fields.forEach(this.addField.bind(this));
   }

   Form.prototype                                = Object.create(AdminLib.EventTarget.prototype);
   Form.prototype.constructor                    = Form;

   /**
    * Add a action to the form
    * @param {Action|AdminLib.Action.Button.Parameter} action
    * @return {Action} Created action
    * @public
    */
   Form.prototype.addAction                      = function(action) {

      if (!(action instanceof Action))
         action = new Action(action, this);

      this.actions.push(action);

      if (this.formActions)
         this.formActions.push(action.getDOM());

      return action;
   };

   /**
    * Add a field to the form
    * @param {AdminLib.widget.Form.Section|AdminLib.widget.Form.Parameters.FormField} field
    * @public
    */
   Form.prototype.addField                       = function(field) {

      var /** @type {AdminLib.widget.Form.Field|AdminLib.widget.Form.Section} */ formElement;

      if (typeof(field) === 'string')
         formElement = new Section(field, this);
      else if (!(field instanceof Field))
         formElement = new FormField(field, this);

      this.fields.push(formElement);

      formElement.addEventListener(Field.event.change , this.listener_onchange.bind(this) );
      formElement.addEventListener(Field.event.changed, this.listener_onchanged.bind(this));

      if (this.formBody)
         this.formBody.appendChild(formElement.getDOM());

      return formElement;
   };

   /**
    * Build the DOM of the form
    * @private
    */
   Form.prototype.buildDOM                       = function() {

      var /** @type {string} */ template;

      template =     '<form class="{{#horizontal}}form-horizontal{{/horizontal}}" role="form" id="{{domID}}">'
                  +     '<div class="form-body"></div>'
                  +     '<div class="form-actions">'
                  +        '<div class="row">'
                  +           '<div class="{{actionSizeClass}}">'
                  +           '</div>'
                  +        '</div>'
                  +     '</div>'
                  +  '</form>';

      this.dom = AdminLib.dom.build(template, this);

      this.sizeClass.applyTo(this.dom);

      this.formBody   = this.dom.querySelector('.form-body');
      this.formAction = this.dom.querySelector('.form-actions > div > div');

      this.dom.addEventListener('submit', this.listener_onsubmit.bind(this));

      this.fields.forEach(function(field) {
         this.formBody.appendChild(field.getDOM());
      }.bind(this));

      this.actions.forEach(function(action) {
         this.formAction.appendChild(action.getDOM());
      }.bind(this))

   };

   Form.prototype.createSection                  = function(label) {

   };

   /**
    * @public
    */
   Form.prototype.dispose                        = function() {

      var /** @type {AdminLib.widget.Form.Field} */ field;

      for(field of this.fields) {
         field.dispose();
      }

   };

   /**
    * Empty each fields
    * @public
    */
   Form.prototype.empty                          = function() {

      this.fields.forEach(function(field) {
         field.empty();
      });

   };

   /**
    * Enable all fields.
    * @public
    */
   Form.prototype.enable                         = function() {

      if (this.enabled)
         return;

      this.enabled = true;

      // Only fields previously enabled will be re-enabled
      this.enabledFields.forEach(function(field) {
         field.enable();
      });

      if (this.dom)
         this.dom.classList.remove('disabled');

   };

   /**
    * Disable the form. All fields will be disabled in the process
    * The fields will not be able to be re-enabled again until the
    * form is re-enabled.
    * @param {boolean} [asStatic=false] If true, then the fields will appear as they where static (not as forms).
    * @param {boolean} [reset=true]     If true, then all fields will reset there values.
    * @public
    */
   Form.prototype.disable                        = function(asStatic, reset) {

      if (!this.enabled)
         return;

      this.enabled = false;

      reset = AdminLib.coalesce(reset, true);

      // Saving the list of fields previously disabled
      this.enabledFields = this.fields.filter(function(field) {
         return field.isEnabled();
      });

      // Disabling all fields
      this.fields.forEach(function(field) {
         field.disable(asStatic, reset);
      });

      if (this.dom)
         this.dom.classList.add('disabled');

   };

   /**
    * Return the action corresponding to the parameter
    * @param {number|string|Action} info
    * @return {Action}
    * @public
    */
   Form.prototype.getAction                      = function(info) {
      return this.actions.get(info);
   };

   /**
    * Return the list of all actions
    * @returns {Array<Action>}
    * @public
    */
   Form.prototype.getActions                     = function() {
      return this.fields.getAll();
   };

   /**
    * Return the DOM of the form
    * @returns {HTMLElement}
    * @public
    */
   Form.prototype.getDOM                         = function() {
      if (!this.dom)
         this.buildDOM();

      return this.dom;
   };

   /**
    *
    * @returns {string}
    * @public
    */
   Form.prototype.getDomId                       = function() {
      return this.domID;
   };

   /**
    * Return the list of each fields that has been emptied
    * @returns {AdminLib.widget.Form.Field[]}
    * @public
    */
   Form.prototype.getEmptiedFields               = function() {
      var /** @type {AdminLib.widget.Form.Field[]} */ emptiedFields;

      emptiedFields = [];

      this.fields.forEach(function(field) {

         if (field instanceof Section)
            return;

         if (!field.hasBeenEmptied())
            return;

         emptiedFields.push(field);
      });

      return emptiedFields;
   };

   /**
    * Return the field corresponding to the parameter
    * @param {number|string|Field} info
    * @return {Field}
    * @public
    */
   Form.prototype.getField                       = function(info) {
      return this.fields.get(info);
   };

   /**
    * Return the list of all fields
    * @returns {Array<Field>}
    * @public
    */
   Form.prototype.getFields                      = function() {
      return this.fields.getAll();
   };

   /**
    *
    * @returns {FormData}
    */
   Form.prototype.getFormData                    = function() {

      var /** @type {AdminLib.widget.Form.Field} */ field
        , /** @type {FormData}                  */ formData;

      formData = new FormData();

      //noinspection BadExpressionStatementJS,UnreachableCodeJS
      for(field of this.fields) {
         if (field instanceof Section)
            continue;

         formData.append(field.getCode(), field.getFormDataValue());
      }

      return formData;
   };

   /**
    * Return an object :
    *    - each properties of the object correspond to a field
    *    - each values correspond to the value of the given field
    * @return {Object}
    * @public
    */
   Form.prototype.getValue                       = function() {
      var /** @type {Object} */ value;

      value = {};

      this.fields.forEach(function(field) {

         if (field instanceof Section)
            return;

         field.setFormValue(value);

      });

      return value;
   };

   /**
    * Indicate if the form is enabled (true) or not (false).
    * Disabled form have all their fields disabled. Fields will
    * not be allowed to be enabled until the form is re-enable.
    * @returns {boolean}
    * @public
    */
   Form.prototype.isEnabled                      = function() {
      return this.enabled;
   };

   /**
    * Listener "submit" added to the <FORM> element
    * @param {Event} domEvent
    * @private
    */
   Form.prototype.listener_onsubmit              = function(domEvent) {

      var /** @type {AdminLib.Event} */ event;

      domEvent.preventDefault();

      event = new AdminLib.Event ( Form.event.submit
                                , { cancellable : false
                                  , target      : this});

      this.dispatchEvent(event);
   };

   /**
    * @param {AdminLib.Event} event
    * @private
    */
   Form.prototype.listener_onchange              = function(event) {
      this.dispatchEvent(event);
   };

   /**
    * @param {AdminLib.Event} event
    * @private
    */
   Form.prototype.listener_onchanged             = function(event) {
      this.dispatchEvent(event);
   };

   /**
    * Remove the given action from the form
    * @param {number|string|Action} info
    * @public
    */
   Form.prototype.removeAction                   = function(info) {
      var /** @type {Action} */ action;

      action = this.getAction(info);

      if (action === undefined)
         throw 'Action doesnt exists';

      if (this.formAction)
         this.formAction.removeChild(action.getDOM());

      this.actions.remove(action);
   };

   /**
    * Remove the given field from the form
    * @param {number|string|Field} info
    * @public
    */
   Form.prototype.removeField                    = function(info) {
      var /** @type {Field} */ field;

      field = this.getField(info);

      if (field === undefined)
         throw 'Field doesnt exists';

      if (this.formBody)
         this.formBody.removeChild(field.getDOM());

      this.fields.remove(field);
   };

   /**
    * Reset each fields of the form to their initial values
    * @public
    */
   Form.prototype.reset                          = function() {
      this.fields.forEach(function(field) {
         field.reset();
      });
   };

   /**
    *
    * @param {string|ClassList} sizeClass
    * @public
    */
   Form.prototype.setSizeClass                   = function(sizeClass) {

      // Removing the actual size class from the dom
      if (this.dom && this.sizeClass)
         this.sizeClass.removeFrom(this.dom);

      if (sizeClass instanceof AdminLib.dom.ClassList)
         this.sizeClass = sizeClass;
      else
         this.sizeClass = new AdminLib.dom.ClassList(sizeClass);

      if (this.dom)
         this.sizeClass.applyTo(this.dom);

   };

   /**
    *
    * Param asStatic:
    *    Relevent only when enabled = false
    *
    * Param reset :
    *    Relevent only when enabled = false
    *
    * @param {boolean} [enabled]
    * @param {boolean} [asStatic=false]
    * @param {boolean} [reset=true]
    * @public
    */
   Form.prototype.toggleEnable                   = function(enabled, asStatic, reset) {

      enabled = !!AdminLib.coalesce(enabled, !this.isEnabled());

      if (enabled)
         this.enable();
      else
         this.disable(asStatic, reset);
   };

   /**
    *
    * @param {AdminLib.widget.Form.Parameters[]} parametersList
    * @returns {AdminLib.widget.Form.Parameters}
    * @public
    */
   Form.coalesceParameters                       = function(parametersList) {

      var /** @type {AdminLib.widget.Form.Parameters} */ coalescedParameters;

      parametersList = AdminLib.coalesce(parametersList, []);

      coalescedParameters = { actions          : AdminLib.coalesceAttribute('actions'        , parametersList, [])
                            , actionSizeClass  : AdminLib.coalesceAttribute('actionSizeClass', parametersList, 'col-md-offset-3 col-md-9')
                            , fields           : AdminLib.coalesceAttribute('fields'         , parametersList, [])
                            , horizontal       : AdminLib.coalesceAttribute('horizontal'     , parametersList, true)
                            , inputSizeClass   : AdminLib.coalesceAttribute('inputSizeClass' , parametersList, 'col-md-4')
                            , labelSizeClass   : AdminLib.coalesceAttribute('labelSizeClass' , parametersList, 'col-md-3')
                            , sizeClass        : AdminLib.coalesceAttribute('sizeClass'      , parametersList)
                            , title            : AdminLib.coalesceAttribute('title'          , parametersList) };

      return coalescedParameters;
   };

   Form.event = { change    : Field.event.change
                , changed   : Field.event.changed
                , submit    : 'submit'
                , submitted : 'submitted'};

   // ******************** Section ********************
   /**
    *
    * @param {string} label
    * @param {Form}   parent
    * @constructor
    * @property {string} label
    * @property {Form}   parent
    */
   function Section(label, parent) {

      AdminLib.EventTarget.call(this);

      this.label  = label;
      this.parent = parent;
      this.code   = '#AdminLib.widget.Form.Section.' + SectionID++;
   }

   Section.prototype                             = Object.create(AdminLib.EventTarget.prototype);
   Section.prototype.constructor                 = Section;

   Section.prototype.getDOM                      = function() {
      var /** @type {HTMLElement} */ dom;

      dom = AdminLib.dom.build('<h3 class="form-section">{{label}}</h3>', this);

      return dom;
   };

   var SectionID = 0;
   var FormID    = 0;

   Form.Field = Field;

   return Form;

})();