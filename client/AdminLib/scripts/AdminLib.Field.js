'use strict';

AdminLib.Field                                    = (function() {

   /**
    * @name AdminLib.Field
    * @class
    * @extends AdminLib.EventTarget
    * @param parameters
    * @constructor
    */
   function Field(parameters) {

      var /** @type {boolean} */ inputTypeWasAUTO
        , /** @type {Promise} */ promise;

      AdminLib.EventTarget.call(this);

      parameters = Field.coalesceParameters([parameters]);

      this.code                = parameters.code;
      this.attribute           = AdminLib.coalesce(parameters.attribute, parameters.code);
      this.editable            = parameters.editable;
      this.equalFunction       = parameters.equal;
      this.label               = parameters.label;
      this.getValueFunction    = parameters.getValue;
      this.formatValueFunction = parameters.formatValue;
      this.optionFilter        = parameters.optionFilter;
      this.type                = parameters.type;
      this.dataType            = parameters.dataType;

      this.mapItems            = new Map();
      this.inputParameters     = parameters.inputParameters;
      this.inputType           = parameters.inputType;
      this.helpText            = parameters.helpText;
      this.nullable            = parameters.nullable;
      this.placeholder         = parameters.placeholder;
      this.setValueFunction    = parameters.setValue;
      this.model               = parameters.model;
      this.validationFunction  = parameters.validation;

      // Property : formatValueFunction
      if (parameters.formatValue) {
         if (typeof(parameters.formatValue) === 'function')
            this.formatValueFunction = parameters.formatValue;
         else
            // If the formatValue value is not a function, then we use it as an attribute
            this.formatValueFunction = function(value) {
                                          if (value === undefined)
                                             return undefined;

                                          return value[this.attribute];

                                       }.bind({attribute : parameters.formatValue});
      }
      else if (this.type)
         this.formatValueFunction = this.type.formatValue;

      // Property : options
      //    Building a promise that will resolved the list of options
      if (parameters.options instanceof Promise) {
         promise = parameters.options;
      }
      else if (parameters.options instanceof AdminLib.SelectOptionList) {

         // For SelectOptionList, the promise already exists
         // We wait it to finish before setting the options attribute.
         promise = parameters.options.then(function(parameters) {
                     this.options = parameters.options;
                   }.bind(this, parameters))
      }
      else {
         promise = Promise.resolve(parameters.options);
      }

      this.promise = promise.then(function(options) {

         if (options === undefined)
            return this;

         options = AdminLib.coalesceOptionParameters([options]);

         options = options.map(
                     function(option, index) {
                        var /** @type {string} */ label;

                        if (option === undefined)
                           return undefined;

                        if (option.label)
                           label = option.label;
                        else if (this.formatValueFunction)
                           label = this.formatValueFunction(option.value);
                        else
                           label = '';

                        option.label = label;

                        return option;

                     }.bind(this));

         this.options = new AdminLib.SelectOptionList(options, this.equalFunction);

         return this;
      }.bind(this));

      // Property : textClasses
      if (parameters.textClasses !== undefined)
         this.textClasses = new AdminLib.dom.ClassList(parameters.textClasses);

      // Property : inputType
      // If the inputType is "AUTO", we have to determine the real type of input
      if (this.inputType === AdminLib.FIELD_TYPES.AUTO) {

         inputTypeWasAUTO = true;

         switch (this.dataType) {

            case AdminLib.DATA_TYPE.DATE:
               this.inputType = AdminLib.FIELD_TYPES.DATE;
               break;

            case AdminLib.DATA_TYPE.DATE_TIME:
               this.inputType = AdminLib.FIELD_TYPES.DATE_TIME;
               break;

            case AdminLib.DATA_TYPE.DECIMAL:
               this.inputType = AdminLib.FIELD_TYPES.NUMBER;
               break;

            case AdminLib.DATA_TYPE.NUMBER:
               this.inputType = AdminLib.FIELD_TYPES.NUMBER;
               break;

            case AdminLib.DATA_TYPE.YEAR:
               this.inputType = AdminLib.FIELD_TYPES.NUMBER;
               break;

            default:

               if (parameters.options)
                  this.inputType = AdminLib.FIELD_TYPES.SELECT;
               else if (this.model)
                  this.inputType = AdminLib.FIELD_TYPES.SELECT_ITEM;
               else
                  this.inputType = AdminLib.FIELD_TYPES.TEXT;
               break;
         }

      }

      // Controls
      if (this.code === undefined)
         throw 'Field must have a code';

      if (this.optionFilter && parameters.options === undefined)
         throw 'You can\'t defined a option filter function without providing function';

   }

   Field.prototype                               = Object.create(AdminLib.EventTarget.prototype);
   Field.prototype.constructor                   = Field;

   /**
    * Create and return a new form corresponding to the field.
    * If no item is provided, then the form is for a creation. Otherwelse, is for a edition
    * @param {Item}                                                                        [item]
    * @param {AdminLib.widget.Form.Field.Parameters|AdminLib.widget.Form.Field.Parameters[]} [parameters]
    * @returns {AdminLib.widget.Form.Field}
    * @public
    */
   Field.prototype.buildEditField                = function buildEditField(item, parameters) {

      var /** @type {AdminLib.widget.Form.Field}            */ field
        , /** @type {AdminLib.widget.Form.Parameters.Field} */ fieldParameters
        , /** @type {SelectOptionList}                     */ options;

      fieldParameters = { attribute   : this.attribute
                        , code        : this.code
                        , dataset     : {type : 'fieldEdit'}
                        , enabled     : this.editable
                        , helpText    : this.helpText
                        , label       : this.label
                        , nullable    : this.nullable
                        , placeholder : this.placeholder
                        , type        : this.inputType };

      switch(this.inputType) {

         case AdminLib.FIELD_TYPES.SELECT:

            // Filtering options

            if (this.optionFilter)
               options = this.options.filter(
                  function(option) {
                     return this.optionFilter(option.option, item);
                  }.bind(this));
            else
               options = this.options.slice(0);

            fieldParameters.input = { equal    : this.equalFunction
                                    , multiple : false
                                    , options  : options };

            break;

         case AdminLib.FIELD_TYPES.SELECT_ITEM:

            fieldParameters.input = $.extend({}, {source: this.model}, this.inputParameters);

            break;

         case AdminLib.FIELD_TYPES.ORDERABLE_LIST:
            fieldParameters.input = { modal : true };
            break;

         case AdminLib.FIELD_TYPES.ORDERABLE_TABLE:
            fieldParameters.input = { modal : true };
            break;
      }

      fieldParameters.value = this.calcFormValue(item);

      parameters = AdminLib.list.convert(parameters);
      parameters.push(fieldParameters);

      fieldParameters = AdminLib.widget.Form.Field.coalesceParameters(parameters);

      field = new AdminLib.widget.Form.Field(fieldParameters);

      field.getDOM().dataset.type = 'fieldEditGroup';

      return field;
   };

   /**
    *
    * @param {Item} item
    * @returns {*}
    */
   Field.prototype.calcFormValue                 = function calcFormValue(item) {

      var /** @type {*} */ value;

      value = this.getValue(item);

      switch(this.inputType) {

         case AdminLib.FIELD_TYPES.DATE:
            return value;

         case AdminLib.FIELD_TYPES.DATE_TIME:
            return value;

         case AdminLib.FIELD_TYPES.SELECT:
            return AdminLib.coalesce(value, this.default);

         case AdminLib.FIELD_TYPES.SELECT_ITEM:
            return value;

         default:
            if (value !== undefined)
               return this.getTextValue(value);
            else if (this.default !== undefined)
               return this.getTextValue(this.default);
      }

   };

   /**
    * Clear all informations about the given item.
    * @param {Item} item
    * @internal
    */
   Field.prototype.clearItemInformations         = function clearItemInformations(item) {
      this.mapItems.delete(item);
   };

   /**
    * Indicate if, for the field, the two values are equals.
    * Note that if a "equal" function has been provided, then it will be used.
    * @param {*} value1
    * @param {*} value2
    * @param {boolean} [silent=false] If true, then the function will return "false" when an error is raised.
    * @returns {boolean}
    */
   Field.prototype.equal                         = function equal(value1, value2, silent) {

      if (this.equalFunction)
         return this.equalFunction(value1, value2);

      return value1 == value2
   };

   /**
    * Return the code of the field
    * @returns {string}
    * @public
    */
   Field.prototype.getCode                       = function getCode() {
      return this.code;
   };

   /**
    * Return the edit field.
    *
    * @param {Item}                                 item
    * @param {AdminLib.widget.Form.Field.Parameters} parameters
    * @return {AdminLib.widget.Form.Field}
    * @public
    */
   Field.prototype.getEditField                  = function getEditField(item) {

      var /** @type {AdminLib.widget.Form.Field} */ field;

      if (this.mapItem(item, AdminLib.widget.Form.Field))
         return this.mapItem(item, AdminLib.widget.Form.Field);

      field = this.buildEditField(item, { label : ''
                                        , style : {label : {displayed: false}}} );

      this.mapItem(item, AdminLib.widget.Form.Field, field);

      return field;
   };

   Field.prototype.getEditValue                  = function getEditValue(item) {

      var /** @type {AdminLib.widget.Form.Field} */ field;

      field = this.getEditField(item);

      if (field === undefined)
         return undefined;

      return field.getValue();
   };

   /**
    * Return the list of the options available for the given item
    * @param {Item} item
    * @public
    */
   Field.prototype.getOptionList                 = function getOptionList(item) {

      if (!this.optionFilter)
         return this.options.slice(0);

      return this.options.filter(function(option) {
         return this.optionFilter(option.option, item);
      }.bind(this));

   };

   /**
    *
    * @param {Item} item
    * @returns {string}
    */
   Field.prototype.getTextClassString            = function(item) {

      if (!this.textClasses)
         return '';

      return this.textClasses.toString(item);
   };

   /**
    *
    * Return the text representation of the item field value.
    * This function is relevent when options are defined.
    * If no options are defined, then return the value
    *
    * @param {*}    value
    * @param {Item} item
    * @returns {string|undefined}
    */
   Field.prototype.getTextValue                  = function (value, item) {

      var /** @type {number} */ o;

      if (this.options && item === undefined)
         return undefined;

      if (this.options !== undefined)
         return this.options.getLabel(value);

      if (this.formatValueFunction)
         return this.formatValueFunction(value, item);

      return value;

   };

   /**
    * Return the value of the field for the given item.
    *
    * @param {Item} item
    * @returns {string}
    */
   Field.prototype.getValue                      = function(item) {

      var /** @type {*} */ value;

      if (this.getValueFunction !== undefined)
         return this.getValueFunction(item);
      else if (item !== undefined)
         return item[this.attribute];

      return value;

   };

   /**
    * Indicate if the field has options (true) or not (false).
    * @returns {boolean}
    */
   Field.prototype.hasOptions                    = function hasOptions() {
      return !!this.options;
   };

   /**
    * Map a value to the item.
    * For example, for an item, we keep the "AdminLib.widget.Form.Field" object so we can retreive the value.
    * If the function receive three parameters, then the value will be set.
    * If the function receive two parameters, then we return the given key for the item.
    * If the item or the key are not found, then return undefined.
    *
    * Example :
    *
    *    this.mapItem(item, AdminLib.widget.Form.Field, field);
    *
    *    this.mapItem(item, AdminLib.widget.Form.Field); // Return the "field" object
    *
    *
    * @param {Item} item
    * @param {*}    informationType
    * @param {*}    [value]
    * @private
    */
   Field.prototype.mapItem                       = function(item, key, value) {
      var /** @type {Map} */ map;

      map = this.mapItems.get(item);

      if (arguments.length === 2) {

         if (map === undefined)
            return undefined;

         return map.get(key);
      }
      // If there is three parameters, then we set the key
      if (arguments.length === 3) {
         if (!map && value) {
            map = new Map();
            this.mapItems.set(item, map);
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
    * @param {Item} oldItem
    * @param {Item} newItem
    * @protected
    */
   Field.prototype.updateItem                    = function(oldItem, newItem) {

      var /** @type {Map} */ map;

      return;

      if (this.mapItems.get(oldItem) === undefined)
         throw 'The old item don\'t exists in the map';

      if (this.mapItems.get(newItem))
         throw 'The new item already exists in the map';

      // Retreiving the map of the old item
      map = this.mapItems.get(oldItem);

      // Creating the new item
      this.mapItems.set(newItem, map);

      // Deleting the old item
      this.mapItems.delete(oldItem);
   };

   /**
    *
    * @param {Item} item
    * @param {*}    value - Formated value to add
    * @public
    */
   Field.prototype.setValue                      = function setValue(item, value) {

      if (this.setValueFunction)
         this.setValueFunction(item, value);
      else
         item[this.attribute] = value;

   };

   /**
    * @param {AdminLib.Field[]} parameters
    * @returns {AdminLib.Field}
    */
   Field.coalesceParameters                      = function coalesceBaseParameters(parameters) {

      var /** @type {AdminLib.widget.Datatable.Parameters.BaseField} */ coalescedParameters;

      parameters = AdminLib.coalesce(parameters, []);

      coalescedParameters = { attribute       : AdminLib.coalesceAttribute('attribute'      , parameters)
                            , code            : AdminLib.coalesceAttribute('code'           , parameters)
                            , dataType        : AdminLib.coalesceAttribute('dataType'       , parameters, 'text')
                            , 'default'       : AdminLib.coalesceAttribute('default'        , parameters)
                            , editable        : AdminLib.coalesceAttribute('editable'       , parameters)
                            , equal           : AdminLib.coalesceAttribute('equal'          , parameters)
                            , formatValue     : AdminLib.coalesceAttribute('formatValue'    , parameters)
                            , getValue        : AdminLib.coalesceAttribute('getValue'       , parameters)
                            , helpText        : AdminLib.coalesceAttribute('helpText'       , parameters)
                            , inputParameters : AdminLib.coalesceAttribute('inputParameters', parameters)
                            , inputType       : AdminLib.coalesceAttribute('inputType'      , parameters, AdminLib.FIELD_TYPES.AUTO)
                            , model           : AdminLib.coalesceAttribute('model'          , parameters)
                            , nullable        : AdminLib.coalesceAttribute('nullable'       , parameters, true)
                            , optionFilter    : AdminLib.coalesceAttribute('optionFilter'   , parameters)
                            , options         : AdminLib.coalesceAttribute('options'        , parameters)};

      coalescedParameters.placeholder = AdminLib.coalesceAttribute('placeholder'  , parameters);
      coalescedParameters.setValue    = AdminLib.coalesceAttribute('setValue'     , parameters);
      coalescedParameters.validation  = AdminLib.coalesceAttribute('validation'   , parameters);

      coalescedParameters.label     = AdminLib.coalesceAttribute('label'      , parameters, coalescedParameters.code.capitalizeFirstLetter());

      coalescedParameters.options   = coalescedParameters.options instanceof Array ? coalescedParameters.options.slice(0) : coalescedParameters.options;

      return coalescedParameters;
   };

   return Field;

})();