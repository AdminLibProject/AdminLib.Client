'use strict';

AdminLib.Model.Handler                            = (function() {


   var MODES = { list    : 1
               , element : 2
               , search  : 3};


   var reservedPrefix = '#AdminLib.Model.Handler.';

   /**
    *
    * About fieldPromise : the field promise exist because the "option" attribute of fields can be a promise.
    *
    * @name AdminLib.Model.Handler
    * @class
    * @extends AdminLib.Section
    * @constructor
    *
    * @param {AdminLib.Model.Handler.Parameters} parameters
    * @param {string}                           handlerCode
    * @param {string}                           model
    *
    * @property {AdminLib.Collection<AdminLib.Parameter.WidgetActionButton>} actions              List of actions available
    * @property {string}                                                   code
    * @property {AdminLib.widget.Datatable.CreationParameters}              create
    * @property {Object}                                                   currentItem
    * @property {DeleteParameters|DeleteFunction}                          deleteAction
    * @property {DetailScreen}                                             detailScreen
    * @property {ModelField[]}                                             fields               List of all fields
    * @property {Promise}                                                  fieldPromise         Promise that will resolved when all fields fields have loaded there options.
    * @property {Object}                                                   filters
    * @property {function(Item):string|string}                             getItemLabelFunction
    * @property {function(Item):string}                                    getItemUrlFunction   Function that will return the URL of an item
    * @property {string}                                                   page
    * @property {AdminLib.Field[]}                                          includeApiFields
    * @property {string}                                                   itemType             Label of the type of item (ex: "country")
    * @property {string}                                                   itemType_plural      Plural label of the type of item (ex: "countries")
    * @property {AdminLib.Collection<AdminLib.element.Button>}               listActions          List of actions to display on list screen
    * @property {ListSummary}                                              listSummary          Represent the list of items, in summary form, in the detail screen
    * @property {*}                                                        initialOrder         See AdminLib.widget.Datatable.initialOrder
    * @property {AdminLib.Model.Handler}                                    model
    * @property {number}                                                   pageLength
    * @property {boolean}                                                  searchFirst
    * @property {SearchScreen}                                             seachScreen
    * @property {ModelField[]}                                             searchFields
    * @property {boolean}                                                  searchScreenEnabled
    * @property {HistoryStateProvider}                                     stateProvider
    * @property {string}                                                   storeName            Store name that will be use for datatables
    * @property {AdminLib.Collection<AdminLib.element.Button>}               summaryActions       List of actions to display on summary screen
    * @property {ModelField[]}                                             summaryFields        List of fields to display in the summary list
    * @property {DetailView[]}                                             views
    */
   function Handler(parameters, handlerCode, model) {

      var actionParameters
        , /** @type {string}     */ code
        , /** @type {number}     */ f
        , /** @type {ModelField} */ field
        , fieldParameters;


      AdminLib.Section.call(this);
      this.currentItem   = undefined;
      this.itemActions   = [];

      this.actions             = new AdminLib.Collection();
      this.code                = handlerCode;
      this.create              = parameters.create;
      this.deleteAction        = parameters.delete;
      this.editParameters      = parameters.edit;
      this.extraFields         = [];
      this.fields              = new AdminLib.Collection(ModelField);
      this.filters             = AdminLib.coalesce(parameters.filters, {});
      this.initialOrder        = parameters.initialOrder;
      this.includeApiFields    = AdminLib.coalesce(parameters.includeApiFields, []).slice(0);
      this.itemType            = AdminLib.coalesce(parameters.itemType, 'element');
      this.itemType_plural     = AdminLib.coalesce(parameters.itemType_plural, this.itemType + 's');
      this.getItemUrlFunction  = parameters.getItemURL;
      this.listActions         = new AdminLib.Collection();
      this.listFields          = new AdminLib.Collection(ModelField);
      this.listScreenStyle     = parameters.listStyle;
      this.model               = model;
      this.pageLength          = parameters.pageLength;
      this.page                = AdminLib.coalesce(parameters.page, this.code);

      this.views               = [];
      this.searchScreenEnabled = AdminLib.coalesce(parameters.searchScreen, false);
      this.searchFields        = [];
      this.searchFirst         = AdminLib.coalesce(parameters.searchFirst, true);
      this.stateProvider       = parameters.state;
      this.storeName           = parameters.storeName;
      this.summaryActions      = new AdminLib.Collection();
      this.summaryFields       = new AdminLib.Collection(ModelField);

      if (this.searchScreenEnabled)
         this.searchScreen = new SearchScreen({}, this);

      // Property : api
      if (parameters.api)
         this.api = parameters.api;
      else if (this.model)
         this.api = this.model.getApiPath();
      else
         throw 'No API nor model define';

      // Property : actions
      if (parameters.actions) {
         for(actionParameters of parameters.actions) {

            // Checking that the code is valid
            if (!checkCode(actionParameters.code))
               throw 'Invalid code';

            this.actions.push(actionParameters);
         }
      }

      // Property : fields
      for(fieldParameters of parameters.fields) {

         field = new ModelField(fieldParameters);

         if (!checkCode(field.getCode()))
            throw 'The code "' + field.getCode() + '" is invalid';

         this.fields.push(field);
      }

      // Property : extraFields
      if (parameters.extraFields)
         for(code of parameters.extraFields) {

            if (!this.getField(code))
               throw 'Field "' + code + '" don\'t exists';

            this.extraFields.push(code);
         }

      // Property : includeApiFields
      this.includeApiFields = AdminLib.coalesce(parameters.includeApiFields, []).map(function(code) {
         return new AdminLib.Field({code: code});
      });

      // Property : listActions
      if (parameters.listActions) {

         for(code of parameters.listActions) {

            var /** @type {AdminLib.element.Button} */ action;

            action = this.actions.get(code);

            if (action === undefined)
               throw 'The action "' + code + '" don\'t exists';

            this.listActions.push(action);
         }
      }
      else {
         this.listActions = this.actions.clone();
      }

      // Parameter : listFields
      if (parameters.listFields) {

         for(code of parameters.listFields) {

            field = this.fields.get(code);

            if (field === undefined)
                throw 'The field "' + code + '" don\'t exists';

            this.listFields.push(field);
         }

      }
      else {
         this.listFields = this.fields.clone();
      }

      // Property : summaryActions
      if (parameters.summaryActions) {
         for(code of parameters.summaryActions) {

            action = this.actions.get(code);

            if (action === undefined)
               throw 'The action "' + code + '" don\'t exists';

            this.summaryActions.push(action);
         }
      }
      else
         this.summaryActions = this.actions.clone();

      // Parameter : summaryFields
      if (parameters.summaryFields) {

         for(code of parameters.summaryFields) {

            field = this.fields.get(code);

            if (field === undefined)
                throw 'The field "' + code + '" don\'t exists';

            this.summaryFields.push(field);
         }

      }
      else {
         this.summaryFields = this.fields.clone();
      }

      for(f in parameters.itemActions) {
         this.itemActions.push(parameters.itemActions[f]);
      }

      // Property : getItemLabel
      if (parameters.getItemLabel !== undefined)
         this.getItemLabelFunction = parameters.getItemLabel;

      // Property : searchFields
      if (parameters.searchFields === undefined) {

         this.searchFields = this.fields.filter(function(field) {
            return field.searchable;
         });

      }
      else {

         for(f in parameters.searchFields) {
            field = this.getField(parameters.searchFields[f]);

            if (!field.searchable)
               throw 'Field "' + field.code + '" can\'t be used as a search field';

            this.searchFields.push(field);
         }
      }

      // Property : views
      this.views = AdminLib.list.map(AdminLib.coalesce(parameters.views, []),
         function(view) {
            return new DetailView(view, this);
         }.bind(this));

      // Property : primaryKeys
      this.primaryKeys = this.fields.filter(function(field) {
         return field.isPrimaryKey();
      });

      // If no primary keys defined, then we look for an "id" field
      if (this.primaryKeys.length === 0) {
         field = this.getField('id');

         if (field)
            this.primaryKeys = [field];
         else {
            // Looking into the api fields
            for(field of this.includeApiFields) {
               if (field.getCode() !== 'id')
                  continue;

               this.primaryKeys = [field];
               break;
            }

            if (this.primaryKeys.length === 0)
               throw 'No primary keys found !';

         }


      }

      this.listScreen          = new ListScreen(undefined, this);
      this.detailScreen        = new DetailScreen(this);
      this.listSummary         = new ListSummary(this);
   }

   Handler.prototype                             = Object.create(AdminLib.Section.prototype);
   Handler.prototype.constructor                 = Handler;

   /**
    *
    * @param {Item}   item
    * @param {Item[]} listItems
    * @param {object} token     Private parameter.
    * @public
    */
   Handler.prototype.display                     = function display(item, listItems, token) {

      var /** @type {AdminLib.Page} */ page;

      if (listItems) {

         if (listItems.indexOf(item) === -1)
            throw 'The item don\'t belongs to the list';

      }

      page = this.getPage();

      if (page)
         page.display(false);

      this.currentMode = item !== undefined ? MODES.element : (this.searchScreenEnabled && this.searchFirst ? MODES.search : MODES.list);

      AdminLib.StandardPage.removeAllTabs();

      switch(this.currentMode) {
         case MODES.list :
            this.reset();
            this.listScreen.display();
            break;

         case MODES.element:
            this.displayItem(item, listItems, token);
            break;

         case MODES.search:
            this.reset();
            this.searchScreen.display()
               .then(
                  function(searchParameters) {
                     this.listScreen.display(searchParameters);
                  }.bind(this));

            break;
      }
   };

   /**
    * @param {Item}   item
    * @param {Item[]} listItems
    * @param {object} token      - Private parameter
    * @public
    */
   Handler.prototype.displayItem                 = function displayItem(item, listItems, token) {

      var /** @type {number}           */ indexOf
        , /** @type {Promise.<Item[]>} */ loadItem
        , /** @type {Promise.<Item[]>} */ loadListItems;

      if (token !== internalToken) {

         indexOf = listItems.indexOf(item);

         if (indexOf === -1)
            throw 'The item don\'t belongs to the list';

         listItems     = listItems.slice(0);
         listItems.splice(indexOf, 1);

         loadItem      = this.loadItems([item]);
         loadListItems = this.loadItems(listItems);

         Promise.all([loadItem, loadListItems])
            .then(function(result) {
               var /** @type {Item}   */ item
                 , /** @type {Item[]} */ listItems;

               item      = result[0][0];
               listItems = result[1];

               // Adding the item to the list
               listItems.splice(indexOf, 0, item);

               this.displayItem(item, listItems, internalToken);
            }.bind(this));

         return;
      }

      if (listItems !== undefined)
         this.setListItems(listItems);
      else
         this.setListItems([]);

      this.setCurrentView(AdminLib.coalesce(this.currentView, this.views[0]));
      this.setCurrentItem(item);
      this.detailScreen.display();
   };

   /**
    * Dispose
    *
    * @public
    */
   Handler.prototype.dispose                     = function dispose() {

      var /** @type {DetailView} */ view;

      this.listScreen.dispose();
      this.listSummary.dispose();

      if (this.searchScreen)
         this.searchScreen.dispose();

      for(view of this.views) {
         view.dispose();
      }

   };

   Handler.prototype.getAPI                      = function getAPI() {
      return this.api;
   };

   /**
    * @returns {string}
    * @public
    */
   Handler.prototype.getCode                     = function getCode() {
      return this.code;
   };

   /**
    *
    * @returns {Item[]}
    * @public
    */
   Handler.prototype.getData                     = function getData() {
      return this.listItems || [];
   };

   /**
    * Return the field corresponding to the given code
    * @param {string|number|ModelField} info
    * @returns {ModelField}
    */
   Handler.prototype.getField                    = function getField(info) {
      return this.fields.get(info);
   };

   Handler.prototype.getFields                   = function getFields() {
      return this.fields.getAll();
   };

   /**
    * Return a promise that will resolved when all fields fields have loaded there options.
    * @returns {Promise<R[]>}
    */
   Handler.prototype.getFieldPromise             = function getFieldPromise() {

      var /** @type {number}    */ f
        , /** @type {Promise[]} */ promises;

      if (this.fieldPromise !== undefined)
         return this.fieldPromise;

      promises = [];

      for(f in this.fields) {
         promises.push(this.fields[f].getPromise());
      }

      this.fieldPromise = Promise.all(promises);

      return this.fieldPromise;
   };

   /**
    *
    * @param {AdminLib.module.MasterDetailSection.Parameters.getForm} parameters
    * @returns {AdminLib.widget.Form}
    */
   Handler.prototype.getForm                     = function getForm(parameters) {
      var /** @type {AdminLib.widget.Form.Parameters} */ formParameters;

      formParameters = this.getFormParameters(parameters);

      return new AdminLib.widget.Form(formParameters);
   };

   /**
    *
    * @param {AdminLib.module.MasterDetailSection.Parameters.getForm} parameters
    * @returns {AdminLib.widget.Form.Parameters}
    */
   Handler.prototype.getFormParameters           = function getFormParameters(parameters) {

      var /** @type {AdminLib.widget.Form.Parameters} */ formParameters
        , /** @type {Item}                           */ item;

      parameters = AdminLib.coalesce(parameters, {});

      item = parameters.item;

      parameters = { fields         : AdminLib.coalesce(parameters.fields        , this.getSearchFieldsCode())
                   , inputSizeClass : AdminLib.coalesce(parameters.inputSizeClass, 'col-md-4')
                   , labelSizeClass : AdminLib.coalesce(parameters.labelSizeClass, 'col-md-3')}

      formParameters = { fields         : parameters.fields.map(
                                              function(field) {
                                                 return this.getField(field).getFormParameters(item);
                                              }.bind(this))
                       , inputSizeClass : parameters.inputSizeClass
                       , labelSizeClass : parameters.labelSizeClass
                       , title          : parameters.title};

      return formParameters;
   };

   /**
    *
    * @param {Object} item
    * @returns {string}
    */
   Handler.prototype.getItemLabel                = function getItemLabel(item) {
      var /** @type {string} */ label;

      if (item === undefined)
         return 'undefined';

      if (typeof(this.getItemLabelFunction ) === 'function')
         return this.getItemLabelFunction(item);
      else if (typeof(this.getItemLabelFunction) === 'string')
         return item[this.getItemLabelFunction];

      if (Object.prototype.hasOwnProperty.call(item, 'label'))
         return item.label;

      if (Object.prototype.hasOwnProperty.call(item, 'name') in item)
         return item.name;

      if (Object.prototype.hasOwnProperty.call(item, 'label'))
         return item.id;
   };

   /**
    * Return the list of primary kes of the model
    * @returns {Array.<AdminLib.Model.Handler.Field>}
    * @public
    */
   Handler.prototype.getPrimaryKeys              = function getPrimaryKes() {
      return this.primaryKeys.slice(0);
   };

   /**
    *
    * @param {Item} item
    * @returns {Item}
    * @public
    */
   Handler.prototype.getPrimaryKeysValues        = function getPrimaryKeysValues(item) {

      var /** @type {Object} */ primaryKeysValues;

      primaryKeysValues = {};

      this.primaryKeys.forEach(function(field) {
         var /** @type {*} */ value;

         value = field.getValue(item);
         field.setValue(primaryKeysValues, value);

      }.bind(this));

      return primaryKeysValues;
   };

   /**
    *
    * @returns {AdminLib.Model}
    * @public
    */
   Handler.prototype.getModel                    = function getModel() {
      return this.model
   };

   /**
    * Return the page associated to the model
    * @returns {AdminLib.Page}
    * @public
    */
   Handler.prototype.getPage                     = function getPage() {
      return AdminLib.page.get(this);
   };

   /**
    *
    * @param {SearchScreenParameters} parameters
    * @returns {SearchScreen}
    * @public
    */
   Handler.prototype.getSearchScreen             = function getSearchScreen(parameters) {
      return new SearchScreen(parameters, this);
   };

   Handler.prototype.getSource                   = function getSource() {



   };

   /**
    * Return the subtitle of the section.
    * @returns {string}
    */
   Handler.prototype.getSubtitle                 = function() {

      if (this.currentItem === undefined)
         return '';

      return this.getItemLabel(this.currentItem);
   };

   /**
    *
    * @returns {ModelField[]}
    */
   Handler.prototype.getSearchFields             = function getSearchFields() {
      return this.searchFields.slice(0);
   };

   Handler.prototype.getSearchFieldsCode         = function getSearchFieldsCode() {
      return this.getSearchFields().map(function(field) {
         return field.code;
      });
   };

   Handler.prototype.getTitle                    = function() {
      if (this.currentMode === MODES.list) {

      }
   };

   /**
    *
    * @param {Item} item
    * @returns {string}
    * @public
    */
   Handler.prototype.getURL                      = function getItemURL(item) {

      if (item === undefined)
         return this.url;

      if (!this.getItemUrlFunction)
         return undefined;

      return this.getItemUrlFunction(item);
   };

   /**
    *
    * @param {string|number} view
    * @returns {DetailView}
    */
   Handler.prototype.getView                     = function(view) {

      var /** @type {number} */ v;

      if (typeof(view) === 'number')
         return this.views[view];

      // If the view is a string, then we search a view with the corresponding code
      for(v in this.views) {
         if (this.views[v].code === view)
            return this.views[v];
      }
   };

   /**
    *
    * @param {string[]} fields  List of fields to retreive
    * @param {Object}   filters filter to apply
    * @returns {Promise.<Item[]>}
    * @public
    */
   Handler.prototype.loadData                    = function loadData(fields, filters) {

      var /** @type {string[]} */ codeList;

      fields = fields.slice(0);
      filters = AdminLib.clone(filters, true);

      // List of fields to retreive

      codeList = fields.map(function(field) {

         if (!(field instanceof ModelField))
            field = this.getField(field);

        return field.apiField;

      }.bind(this));

      // Adding apiFields
      this.includeApiFields.forEach(function(field) {
         codeList.push(field.getCode());
      });

      filters = $.extend({fields : codeList}, filters, this.filters);

      return AdminLib.loadAjax(this.getAPI(), filters).then(function(data) {
         this.setData(data);
         return this.getData();
      }.bind(this));

   };

   /**
    * This function will load all informations expected by the handlers view for an item
    * @param {Item[]} items
    * @private
    */
   Handler.prototype.loadItems                   = function loadItems(items) {

      var /** @type {Item[]}    */ primaryKeysValues
        , /** @type {Promise}   */ promise
        , /** @type {Promise[]} */ promises;

      primaryKeysValues = items.map(this.getPrimaryKeysValues.bind(this));

      promises = primaryKeysValues.map(function(values) {
         return this.loadData(this.fields, values)
      }.bind(this));

      promise = Promise.all(promises);

      promise =   promise.then(function(itemsArrays) {
                     var /** @type {Item[]} */ items;

                     items = [];

                     for(var item of itemsArrays) {
                        items.push(item[0]);
                     }

                     return items;
                  });

      return promise;
   };

   /**
    * @public
    */
   Handler.prototype.reset                       = function reset() {

      this.dispose();

      this.data      = undefined;
      this.listItems = undefined;
      this.setCurrentItem(undefined);

      this.listScreen          = new ListScreen(undefined, this);
      this.detailScreen        = new DetailScreen(this);
      this.listSummary         = new ListSummary(this);

      this.setCurrentView(this.views[0]);

      if (this.searchScreenEnabled)
         this.searchScreen = new SearchScreen({}, this);
   };

   Handler.prototype.setListItems                = function setListItems(listItems) {
      if (this.listItems !== listItems)
         this.reset();

      this.listItems = listItems;
   };

   /**
    *
    * @param {Item} item
    */
   Handler.prototype.setCurrentItem              = function setCurrentItem(item) {
      this.currentItem = item;
   };

   /**
    *
    * @param {DetailView} view
    * @internal
    */
   Handler.prototype.setCurrentView              = function setCurrentView(view) {

      if (this.currentView)
         this.currentView.dispose();

      this.currentView = view;
   };

   /**
    * Set the data of the source.
    * The data is comming directly from the server.
    * @private
    */
   Handler.prototype.setData                     = function setData(data) {
      this.data      = data;
      this.listItems = data.list.slice(0);
      this.setCurrentItem(undefined);
      this.listSummary.resetDOM();

      this.fields.forEach(function(field) {
         field.proceedData(this.listItems);
      }.bind(this));

   };



   // ******************** ListDetailSectionField ********************/

   /**
    *
    * Note : no check is done on the code.
    *
    * @param {ListDetailFieldParameter} parameters
    * @constructor
    * @class ModelField
    * @extends AdminLib.Field
    * @property {string|undefined}             apiField
    * @property {string}                       code
    * @property {DataTableFieldParameters}     datatableFieldParameters
    * @property {function(Item, Item):boolean} equalFunction            See AdminLib.widget.Datatable.Parameters.Field.equal
    * @property {function(value):*}            fromJSONFunction
    * @property {boolean}                      hasOptions               Indicate if the fields has options (true) or not (false).
    * @property {pSelectOptions}               options
    * @property {boolean}                      primaryKey
    * @property {Promise.<ModelField>          promise
    * @property {function(Item):string}        toApiValueFunction
    */
   function ModelField(parameters) {

      parameters = ModelField.coalesceParameters([parameters]);

      AdminLib.Field.call(this, parameters);

      this.fromJSONFunction        = parameters.fromJSON;
      this.getSearchStringFunction = parameters.getSearchString;
      this.searchable              = AdminLib.coalesce(parameters.searchable, true);
      this.model                   = parameters.model ? AdminLib.model(parameters.model) : undefined;
      this.toApiValueFunction      = parameters.toApiValue;

      this.datatableFieldParameters = { label       : this.code.capitalizeFirstLetter()
                                      , placeholder : this.code.capitalizeFirstLetter()};

      $.extend(this.datatableFieldParameters, parameters);

      this.linkToItem  = AdminLib.coalesce(parameters.linkToItem , false);
      this.primaryKey  = parameters.primaryKey;

      // Property : apiField
      if (typeof(parameters.api) === 'string')
         this.apiField = /** @type {string|undefined} */ parameters.api;
      else if (typeof(parameters.api) === 'boolean')
         this.apiField = parameters.api ? this.code : undefined;
      else
         this.apiField = this.code;

      // Controls
      if (!this.code)
         throw 'No code defined for the field';

      if (!this.apiField && this.fromJSONFunction)
         throw this + ': You can\'t defind a "fromJSON" function for a non-API field';

      if (this.linkToItem && this.datatableFieldParameters.linkHandler !== undefined)
         throw this + ': Fields marked has "linked to item" can\'t have a "linkHandler" value';

   }

   ModelField.prototype                          = Object.create(AdminLib.Field.prototype);
   ModelField.prototype.constructor              = ModelField;

   /**
    * Return the API code of the field
    * @returns {string}
    * @public
    */
   ModelField.prototype.getApiCode               = function getApiCode() {
      return this.apiField;
   };

   ModelField.prototype.getCode                  = function getCode() {
      return this.code;
   };

   ModelField.prototype.getDatatableFieldParameters = function() {

      var /** @type {DataTableFieldParameters} */ param;

      param = {};

      $.extend(param, this.datatableFieldParameters);

      return param;
   };

   /**
    *
    * @returns {AdminLib.widget.Datatable.Parameters.Field}
    * @public
    */
   ModelField.prototype.getDatatableBaseFieldParameters = function getDatatableBaseFieldParameters() {

      return { attribute     : this.attribute
             , code          : this.code
             , equal         : this.equalFunction
             , formatValue   : this.formatValueFunction
             , getValue      : this.getValueFunction
             , getOrderValue : this.getOrderValue
             , label         : this.label
             , options       : this.options
             , orderable     : this.orderable
             , textClass     : this.textClass }

   };

   /**
    * @param {Item} [item]
    * @returns {AdminLib.widget.Form.Parameters.Field}
    */
   ModelField.prototype.getFormParameters        = function getFormParameters(item) {

      var /** @type {boolean}                              */ enabled
        , /** @type {AdminLib.widget.Form.Parameters.Field} */ parameters;

      if (item)
         enabled = this.datatableFieldParameters.editable;
      else
         enabled = this.datatableFieldParameters.creatable;

      parameters = { code        : this.code
                   , enabled     : AdminLib.coalesce(enabled, true)
                   , input       : {}
                   , helpText    : this.helpText
                   , label       : this.label
                   , nullable    : this.nullable
                   , placeholder : this.placeholder
                   , style       : { input : {} }
                   , type        : this.inputType
                   , validation  : this.validation
                   , value       : this.calcFormValue(item)}

      if (this.hasOptions())
         parameters.input.options = this.options;

      if (this.model)
         parameters.input.source = this.model;

      return parameters;
   };

   /**
    *
    * @param {Item} item
    */
   ModelField.prototype.getFormValue             = function getFormValue(item) {
      return AdminLib.widget.Datatable.Field.getValueForForm(this.datatableFieldParameters, item);
   };

   /**
    * Return the promise of the field.
    * The promise is resolved when all the options of the field are retreived.
    * @returns {Promise.<ModelField>}
    *
    */
   ModelField.prototype.getPromise               = function getPromise() {
      return this.promise;
   };

   /**
    * Convert the value to a string that is usable for URL search
    * @param {*} value
    * @returns {string}
    * @public
    */
   ModelField.prototype.getSearchString          = function getSearchString(value) {

      if (value === undefined)
         return '';

      if (this.getSearchStringFunction) {
         if (typeof(this.getSearchStringFunction) === 'string')
            return '' + value[this.getSearchStringFunction];
         else
            return '' + this.getSearchStringFunction(value);
      }

      if (this.model)
         return '' + this.model.getID(value)[0];

      return '' + value;

   };

   /**
    * Indicate if the field is a primary key or not
    * @returns {boolean} True : the field is a primary key. False otherwise
    * @public
    */
   ModelField.prototype.isPrimaryKey             = function isPrimaryKey() {
      return this.primaryKey;
   };

   /**
    * @param {Item[]} items
    */
   ModelField.prototype.proceedData              = function convertFields(items) {

      if (!this.fromJSONFunction)
         return;

      items.forEach(function(item, index) {
         item[this.apiField] = this.fromJSONFunction(item[this.apiField]);
      }.bind(this));

   };

   ModelField.prototype.toString                 = function toString() {
      return '<Field : ' + this.code + '>';
   };

   /**
    *
    * @param {ListDetailFieldParameter[]} parametersList
    * @returns ListDetailFieldParameter
    * @public
    */
   ModelField.coalesceParameters                 = function coalesceParameters(parametersList) {

      var /** @type {ListDetailFieldParameter} */ coalescedParameters;

      coalescedParameters = AdminLib.Field.coalesceParameters(parametersList);

      coalescedParameters.api             = AdminLib.coalesceAttribute('api'            , parametersList);
      coalescedParameters.creatable       = AdminLib.coalesceAttribute('creatable'      , parametersList);
      coalescedParameters.inputType       = AdminLib.coalesceAttribute('inputType'      , parametersList);
      coalescedParameters.fromJSON        = AdminLib.coalesceAttribute('fromJSON'       , parametersList);
      coalescedParameters.getSearchString = AdminLib.coalesceAttribute('getSearchString', parametersList);
      coalescedParameters.linkToItem      = AdminLib.coalesceAttribute('linkToItem'     , parametersList, false);
      coalescedParameters.primaryKey      = AdminLib.coalesceAttribute('primaryKey'     , parametersList, false);
      coalescedParameters.model           = AdminLib.coalesceAttribute('model'          , parametersList);

      return coalescedParameters;
   };

   // ******************** ListSummary ********************/

   /**
    *
    * @param {AdminLib.Model.Handler} parent
    * @constructor
    * @class ListSummary
    * @property {AdminLib.Model.Handler} parent
    */
   function ListSummary(parent) {
      this.parent    = parent;

      this.actions   = this.parent.summaryActions.clone();
      this.displayed = false;
      this.fields    = this.parent.summaryFields;
      this.storeName = this.parent.storeName !== undefined ? this.parent.storeName + '.summary' : undefined;
   }

   /**
    *
    * @returns {HTMLElement}
    */
   ListSummary.prototype.buildDOM                = function() {

      this.datatable = new AdminLib.widget.Datatable(this.getDatatableParameters());

      this.dom = this.datatable.getDOM();
      this.dom.setAttribute('id', 'listSummary');
      this.dom.classList.add('hide');

      this.datatable.getBuildPromise()
         .then(function() {

            var /** @type {HTMLElement} */ actionDOM
              , /** @type {Item}        */ item
              , /** @type {HTMLElement} */ filterDOM
              , /** @type {HTMLElement} */ lengthDOM;

            actionDOM = this.dom.querySelector('#actions');
            lengthDOM = this.dom.querySelector('.row > .length');

            if (lengthDOM) {
               lengthDOM.classList.remove('col-sm-6');
               actionDOM.appendChild(lengthDOM);
            }

            filterDOM = this.dom.querySelector('.row > .filter');
            if (filterDOM)
               filterDOM.classList.add('col-md-12');

            item = this.getCurrentItem();

            if (item === undefined)
               return;

            this.datatable.scrollTo(item);

         }.bind(this));
   };

   /**
    *
    * @returns {AdminLib.Model.Handler}
    * @internal
    */
   ListSummary.prototype.dispose                 = function() {

      if (this.datatable) {
         this.datatable.destroy();
         delete(this.datatable);
         delete(this.dom);
      }

   };

   /**
    *
    * @returns {Item}
    */
   ListSummary.prototype.getCurrentItem          = function getCurrentItem() {
      return this.parent.currentItem;
   };

   /**
    *
    * @returns {DetailView}
    */
   ListSummary.prototype.getCurrentView          = function getCurrentView() {
      return this.parent.currentView;
   };

   /**
    * @returns {AdminLib.widget.Datatable.Parameters}
    */
   ListSummary.prototype.getDatatableParameters  = function getDatatableParameters() {

      var /** @type {function}                            */ linkHandler
        , /** @type {AdminLib.widget.Datatable.Parameters} */ parameters;

      parameters = { create        : this.parent.create
                   , data          : this.parent.getData()
                   , language      : { reccord           : ''
                                     , search            : ''
                                     , searchPlaceholder : 'Search'}
                   , model         : this.getModel()
                   , pageLength    : 10
                   , selectedItems : [this.getCurrentItem()]
                   , sizeClass     : 'col-md-2'
                   , storeName     : this.storeName
                   , stripped      : false
                   , style         : {striped : false}
                   , tableActions  : this.actions.slice(0)
                   , title         : this.parent.itemType_plural};

      linkHandler = this.linkHandler.bind(this);

      parameters.fields = this.fields.map(
         function(field) {
            var param;

            param              = field.getDatatableFieldParameters();
            param.clicableCell = true;
            param.link         = { handler : linkHandler
                                 , url     : param.linkURL || this.parent.getItemUrlFunction };

            return param;
         }.bind(this));

      return parameters;
   };

   ListSummary.prototype.getDOM                  = function() {

      if (this.dom === undefined)
         this.buildDOM();


      return this.dom;
   };

   /**
    *
    * @returns {*}
    */
   ListSummary.prototype.getData                 = function getData() {
      return this.parent.listItems;
   };

   /**
    *
    * @returns {AdminLib.Model.Handler}
    * @public
    */
   ListSummary.prototype.getModel                = function getModel() {
      return this.parent.model;
   };

   /**
    * Return the tab associated to the summary list.
    * @returns {Tab}
    */
   ListSummary.prototype.getTab                  = function getTab() {

      if (this.tab === undefined) {
         this.tab = AdminLib.StandardPage.getTab('listSummary');

         this.tab.getDOM().classList.add('listSummary');
      }

      return this.tab;
   };

   /**
    * Indicate if the summary list is currently displayed or not.
    * @returns {boolean}
    */
   ListSummary.prototype.isDisplayed             = function isDisplayed() {
      return this.displayed;
   };

   /**
    * Indicate if the summary list is enabled or not.
    * The summary list is disabled if the parent has no data
    * @returns {boolean}
    */
   ListSummary.prototype.isEnabled               = function isEnabled() {
      return this.parent.getData().length > 0;
   };

   /**
    *
    * @internal
    */
   ListSummary.prototype.resetDOM                = function reset() {
      this.dom = undefined;
   };

   /**
    * @internal
    */
   ListSummary.prototype.reset                   = function reset() {
      this.resetDOM();
   };

   /**
    * @param {Item} item
    * @private
    */
   ListSummary.prototype.linkHandler             = function linkHandler(item) {
      this.parent.setCurrentItem(item);

      this.getCurrentView().display();

      this.parent.detailScreen.refreshTabs();
   };

   /**
    * Toggle the display of the summary list.
    * @param {Event} event Event that triggered the toggle.
    */
   ListSummary.prototype.toggleDisplay           = function toggleDisplay(event) {

      var /** @type {ClassList} */ classList;

      event.preventDefault();

      this.displayed = !this.displayed;

      classList = this.getTab().getDOM().classList;

      if (this.displayed) {

         this.dom.classList.remove('hide');

         // Updating the style of the tab
         classList.add('displayed');
         classList.add('col-md-2');

      }
      else {

         this.dom.classList.add('hide');

         // Updating the style of the tab
         classList.remove('displayed');
         classList.remove('col-md-2');
      }

      this.parent.detailScreen.updateSizes();
   };

   /**
    * Activate the row corresponding to the given item.
    */
   ListSummary.prototype.updateRows              = function updateRows() {

      this.datatable.getBuildPromise().then(function() {
         // Deactivation of the previous activated row
         this.datatable.unselectAllItems();

         // Activating row
         this.datatable.getRow(this.getCurrentItem()).select();
      }.bind(this));
   };



   // ******************** ListScreen ********************/

   /**
    * About : Mode
    *    SELECT :
    *       This mode is used when the point is to select one item.
    *       In this case, the list screen will return a promise when calling the
    *       display function. This promise will be fulfilled once an item has been
    *       selected. The promise will return an array with the selected item as the
    *       only element.
    *
    *    SELECT_MULTIPLE :
    *       Same as "SELECT", but here, several items can be selected. The promise will
    *       return an array will all selected items.
    *
    *    LIST :
    *       Default.
    *       The list screen is used to link to a item detail screen.
    *       The display function will return a promise resolved once the item is selected.
    *       The promise will return an array with the selected item as the only element.
    *
    * @param {AdminLib.module.MasterDetailSection.ListScreen.parameters} parameters
    * @param {AdminLib.Model.Handler}                         parent
    * @constructor
    * @property {AdminLib.Collection<AdminLib.element.Button>} actions         List of actions
    * @property {AdminLib.widget.Datatable}                   datatable
    * @property {ModelField[]}                               fields
    * @property {function(Item[])}                           fulfillFunction "promise" fullfill function.
    * @property {boolean}                                    modal           If true, then the list screen will be displayed in a modal
    * @property {ListScreenModel}                            mode            Mode of display
    * @property {AdminLib.Model.Handler}                      parent
    * @property {Promise.<Item[]>}                           promise         Promise that will be resolved once an item has been selected.
    * @property {string}                                     storeName       Use for the "storeName" property of datatable.
    * @property {AdminLib.Widget}                             widget          Widget in wich the list screen is displayed
    */
   function ListScreen(parameters, parent) {

      var /** @type {string} */ code
        , field;

      parameters = AdminLib.coalesce(parameters, {});

      this.modal = AdminLib.coalesce(parameters.modal, false);
      this.mode  = AdminLib.coalesce(parameters.mode, ListScreen.MODE.LIST);

      if (AdminLib.coalesce(parameters.cancelButton, false))
         this.cancelButton = { label   : typeof(parameters.cancelButton) === 'string' ? parameters.cancelButton : 'Cancel'
                             , 'class' : AdminLib.coalesce(parameters.cancelButton.class, 'btn btn-primary')
                             , icon    : AdminLib.coalesce(parameters.cancelButton.icon, false)
                             , handler : this.cancelSearch.bind(this)};

      this.parent         = parent;

      this.actions        = this.parent.listActions.clone();
      this.editParameters = this.parent.editParameters;
      this.extraFields    = this.parent.extraFields.slice(0);
      this.style          = this.parent.listScreenStyle;
      this.currentList    = undefined;
      this.fields         = this.parent.listFields.clone();
      this.storeName      = this.parent.storeName !== undefined ? this.parent.storeName + '-list' : undefined;
      this.promise        = new Promise(function(fulfill) {
         this.fulfillFunction = fulfill;
      }.bind(this));
      this.tableFields = [];

      // Attribute : tableFields
      for(field of this.fields) {
         this.tableFields.push(field.getCode());
      }

      // Adding the extra-fields to the list of list fields
      for(code of this.extraFields) {
         this.fields.push(this.parent.getField(code));
      }

   }

   ListScreen.prototype.buildDOM                 = function buildDOM() {

      var /** @type {HTMLElement}    */ dom
        , /** @type {string}         */ title
        , /** @type {AdminLib.Widget} */ widget;

      this.datatable = new AdminLib.widget.Datatable ( this.getDatatableParameters() );

      title = 'List of ' + this.parent.itemType_plural;

      dom = this.datatable.getDOM();

      if (this.modal) {
         this.widget = this.datatable;
      }
      else {
         // Creating the portlet
         widget = new AdminLib.widget.Portlet({title : title});
         widget.setContent(dom);

         widget = AdminLib.dom.wrap(widget.getDOM(), 'col-md-12');
      }

      this.widget = widget;

   };

   /**
    * @param {Object} [filters]
    * @returns {Promise<U>}
    * @internal
    */
   ListScreen.prototype.display                  = function display(filters) {

      var /** @type {string[]}     */ codeList
        , /** @type {number}       */ f
        , /** @type {HistoryState} */ state;

      if (this.parent.stateProvider !== undefined) {
         state = typeof(this.parent.stateProvider) === 'function' ? this.parent.stateProvider() : this.parent.stateProvider;
         AdminLib.pushState(state);
      }

      return this.parent.loadData(this.fields, filters)
               .then(
                  function(data) {
                     this.buildDOM();

                     if (this.modal) {
                        this.widget.display();
                     }
                     else {
                        // Displaying the screen
                        AdminLib.StandardPage.emptyMain();
                        AdminLib.StandardPage.setTitle(this.parent.itemType_plural, '');
                        AdminLib.StandardPage.addToMain(this.widget);

                        return this.datatable.getBuildPromise();
                     }

                  }.bind(this))
               .then(
                  function(datatable) {
                     datatable.focusOnSearchInput();
                  });
   };

   /**
    *
    * @returns {AdminLib.Model.Handler}
    * @internal
    */
   ListScreen.prototype.dispose                  = function() {

      if (this.datatable)
         this.datatable.destroy();

   };

   /**
    * Proceed the data provided by the server so that the can be used in the listItem template
    *
    * @returns {DatatableParameters}
    */
   ListScreen.prototype.getDatatableParameters   = function getDatatableParameters() {

      var /** @type {CreationParameters}  */ creationParameters
        , /** @type {string}              */ defaultLabel
        , /** @type {number}              */ f
        , /** @type {function}            */ linkHandler
        , /** @type {DatatableParameters} */ parameters
        , rowButtons;
      if (this.parent.create) {

         defaultLabel = this.parent.itemType.capitalizeFirstLetter();

         if (typeof(this.parent.create) === 'function')
            creationParameters = { createButton : defaultLabel
                                 , handler      : this.parent.create};
         else {
            creationParameters = $.extend(true, {createButton : defaultLabel}, this.parent.create);
         }
      }

      switch(this.mode) {
      
         case ListScreen.MODE.LIST:
            parameters = { create       : creationParameters
                         , data         : this.parent.getData()
                         , delete       : this.parent.deleteAction
                         , fixOnSelect  : false
                         , model        : this.parent.model
                         , pageLength   : this.parent.pageLength
                         , rowActions   : this.parent.itemActions.filter(function(itemAction) { return !AdminLib.coalesce(itemAction.individual, false) })
                         , rowButtons   : this.parent.itemActions.filter(function(itemAction) { return  AdminLib.coalesce(itemAction.individual, false) })
                         , storeName    : this.storeName
                         , style        : this.style
                         , title        : this.parent.itemType_plural
                         , tableActions : this.actions.slice(0)};
            break;

         case ListScreen.MODE.SELECT:
            parameters = { cancelButton : this.cancelButton
                         , data         : this.parent.getData()
                         , fixOnSelect  : false
                         , select       : { handler  : this.onSelectItem.bind(this)
                                          , multiple : false}
                         , model        : this.parent.model
                         , title        : this.parent.itemType_plural };
            break;

         case ListScreen.MODE.SELECT_MULTIPLE:
            parameters = { cancelButton   : this.cancelButton
                         , data           : this.parent.getData()
                         , fixOnSelect    : true
                         , select         : { handler  : this.onSelectItem.bind(this)
                                            , multiple : true }
                         , model        : this.parent.model
                         , title          : this.parent.itemType_plural };

            break;      
      }


      linkHandler = this.linkHandler.bind(this);

      parameters.fields = this.fields.map(
         function(field) {
            var /** @type {AdminLib.widget.Datatable.Field.Parameters} */ param;

            param = field.getDatatableFieldParameters(this.mode);

            if (param.linkToItem) {

               param.link = { handler : linkHandler
                            , url     : param.linkURL || this.parent.getItemUrlFunction }

            }

            return param;
         }.bind(this));

      parameters.edit        = this.editParameters;
      parameters.model       = this.parent.getModel();
      parameters.tableFields = this.tableFields.slice(0);
      parameters.extraFields = this.extraFields.slice(0);

      parameters.initialOrder = this.parent.initialOrder;

      return parameters;
   };

   /**
    * Handler of the clicable item. When item is clicked, we display it
    * @param {Item} item
    * @param {Event} event
    * @returns {boolean}
    * @private
    */
   ListScreen.prototype.linkHandler              = function linkHandler(item, event) {
      this.parent.display(item, this.parent.listItems, internalToken);
      return false;
   };

   /**
    * Function executed by the datatable (on SELECT and SELECT_MULTIPLE
    * mode), when items are selected.
    *
    */
   ListScreen.prototype.onSelectItem             = function onSelectItem(items) {
      this.fulfillFunction(items);
   };

   ListScreen.MODE = { LIST            : 'list'
                     , SELECT          : 'select'
                     , SELECT_MULTIPLE : 'select multiple'};

   // ******************** DetailScreen ********************/

   /******************** DetailScreen ********************/

   /**
    *
    * @param {AdminLib.Model.Handler} parent
    * @constructor
    * @class DetailScreen
    * @property {AdminLib.Model.Handler} parent
    */
   function DetailScreen(parent) {
      this.parent      = parent;
   }

   /**
    * Display the detail screen.
    * This function is supposed to be executed once the DOM is empty. It will create all tabs (corresponding to views),
    * including summary list tab.
    * @returns {*}
    */
   DetailScreen.prototype.display                = function() {

      var /** @type {ListSummary}           */ listSummary
        , /** @type {Promise}               */ promise
        , /** @type {string}                */ subtitle
        , /** @type {string}                */ title
        , /** @type {number}                */ v
        , /** @type {DetailView}            */ view;

      title    = this.parent.itemType;
      subtitle = this.parent.getItemLabel(this.getCurrentItem());

      if (subtitle instanceof Promise) {
         title.then(function(subtitle) {
            AdminLib.StandardPage.setSubtitle(subtitle);
            AdminLib.StandardPage.setTitle(title);
         });
      }

      AdminLib.StandardPage.emptyMain();
      AdminLib.StandardPage.setTitle(title, subtitle);

      listSummary = this.parent.listSummary;

      if (listSummary.isEnabled()) {

         listSummary = this.parent.listSummary;

         AdminLib.StandardPage.addTab({ code    : 'listSummary'
                                     , icon    : 'icon-list'
                                     , handler : listSummary.toggleDisplay.bind(listSummary)});
      }

      // Creating tabs
      for (view of this.parent.views) {
         AdminLib.StandardPage.addTab({ code    : view.code
                                     , enabled : view.isEnabled(this.getCurrentItem())
                                     , handler : view.display.bind(view)
                                     , label   : view.label});
      }

      promise = AdminLib.StandardPage.activateTab(this.getCurrentView().code);

      return promise
   };

   /**
    * Return the item currently displayed
    * @returns {Item}
    */
   DetailScreen.prototype.getCurrentItem         = function() {
      return this.parent.currentItem;
   };

   /**
    * Return the view currently displayed
    * @returns {DetailView}
    */
   DetailScreen.prototype.getCurrentView         = function getCurrentView() {
      return this.parent.currentView;
   };

   /**
    *
    * @returns {ListSummary}
    */
   DetailScreen.prototype.getListSummary         = function getListSummary() {
      return this.parent.listSummary;
   };

   /**
    * Load the data use for the template of the current view.
    *
    * First the function will look for the source of the data : if a parameter is provided, it will be used as the source,
    * otherwise, the function will look for the source of the current view.
    *
    * It will look for the source of the data inside the view.
    *    - If the source is a function : the data will execute the function with the current item as parameter.
    *      If the result is an object (but not a Promise) or an array, it will be display.
    *      Otherwise, the result will be provided to the same "loadSource" function as first parameter.
    *
    *    - If the source is a string, it will be considered as a URL and the function will fetch data from this URL using AdminLib.loadAjax function
    *    - If the source is a Promise : the result will be used for the template
    *
    * @param {string|function|Promise|Object} [source]
    * @returns {Promise}
    */
   DetailScreen.prototype.loadSource             = function(source) {

      source = source === undefined ? this.parent.currentView.source : source;

      if (typeof(source) === 'string')  {
         //noinspection JSCheckFunctionSignatures
         return AdminLib.loadAjax(source);
      }

      else if (typeof(source) === 'function') {
         return this.loadSource(source(this.currentItem))
      }

      else if (source instanceof Promise)
         return source;

      else
         return Promise.resolve(source);
   };

   /**
    * Update the size of the different elements of the MAIN dom.
    * The main useful when the list summary is enabled : in this case,
    * the elements don't have always the same size, depending if the
    * summary list is displayed or not.
    * @internal
    */
   DetailScreen.prototype.updateSizes            = function updateSizes() {

      var /** @type {ListSummary}    */ listSummary
        , /** @type {HTMLElement}    */ detailDOM;

      listSummary = this.getListSummary();

      if (!listSummary.isEnabled())
         return;

      detailDOM = AdminLib.StandardPage.getMainDOM().children[1];

      if (listSummary.isDisplayed()) {
         detailDOM.classList.remove('col-md-12');
         detailDOM.classList.add('col-md-10');
      }
      else {
         detailDOM.classList.add('col-md-12');
         detailDOM.classList.remove('col-md-10');
      }
   };


   DetailScreen.prototype.refreshTabs            = function refreshTabs() {
      var /** @type {boolean}                  */ enabled
        , /** @type {AdminLib.StandardPage.Tab} */ tab
        , /** @type {DetailView}               */ view;

      // Creating tabs
      for (view of this.parent.views) {
         tab     = AdminLib.StandardPage.getTab(view.code);
         enabled = view.isEnabled(this.getCurrentItem());
         tab.toggleEnable(enabled);
      }
   };

   // ******************** DetailView ********************/

   /**
    *
    * @param {ViewParameters}    parameters
    * @param {AdminLib.Model.Handler} parent
    * @constructor
    * @class DetailView
    * @extend AdminLib.Module
    * @property {Promise.<HTMLElement>}   dom
    * @property {string}                  code
    * @property {string}                  label
    * @property {DataSource}              dataSource
    * @property {string[]}                modules
    * @property {AdminLib.Model.Handler}   parent
    * @property {function(Object):Object} proceedData
    * @property {string}                  scripts
    * @property {string}                  stylesheets
    * @property {HistoryStateProvider}    stateProvider
    * @property {string|undefined}        template
    */
   function DetailView(parameters, parent) {
      this.code          = parameters.code;
      this.label         = parameters.label;
      this.template      = parameters.template;
      this.dataSource    = parameters.data;
      this.handler       = parameters.handler;
      this.disposeFunction = parameters.dispose;
      this.modules       = parameters.modules;
      this.scripts       = parameters.scripts;
      this.stylesheets   = parameters.stylesheets;
      this.proceedData   = parameters.proceedData;
      this.enabled       = AdminLib.coalesce(parameters.enabled, true);
      this.parent        = parent;
      this.stateProvider = parameters.state;
      this.builded       = false;
   }

   /**
    *
    * return {Promise.<HTMLElement>}
    */
   DetailView.prototype.buildDOM                 = function buildDOM() {
      return this.load().then(function(template, data) {

         this.builded = true;

         if (this.template !== undefined)
            return AdminLib.dom.build(template, data);
         else
            return AdminLib.dom.build('<div class="col-md-12" id="xxx"></div>');

      }.bind(this));
   };

   DetailView.prototype.display                  = function() {

      var /** @type {HTMLElement}  */ dom
        , /** @type {boolean}      */ isEnabled
        , /** @type {ListSummary}  */ listSummary
        , /** @type {HTMLElement}  */ listSummaryDOM
        , /** @type {Promise}      */ promise
        , /** @type {HistoryState} */ state
        , /** @type {Array}        */ widgets;

      this.parent.setCurrentView(this);

      listSummary    = this.getListSummary();

      AdminLib.StandardPage.emptyMain();

      if (this.stateProvider !== undefined) {
         state = typeof(this.stateProvider) === 'function' ? this.stateProvider(this.getCurrentItem(), this) : this.stateProvider;
         AdminLib.pushState(state);
      }

      if (listSummary.isEnabled()) {
         listSummaryDOM = listSummary.getDOM();
         listSummary.updateRows();
         AdminLib.StandardPage.addToMain(listSummaryDOM, true);
      }

      isEnabled = this.isEnabled(this.getCurrentItem());

      if (isEnabled)
         promise = this.getDOM(this.getCurrentItem()).then(function(dom) {
            AdminLib.StandardPage.addToMain(dom);
            this.parent.detailScreen.updateSizes();

            if (this.handler !== undefined) {

               widgets = this.handler( /* dom  */ dom
                                     , /* data */ this.data
                                     , /* item */ this.getCurrentItem());

               if (widgets instanceof Array)
                  this.widgets = widgets.slice(0);
               else if (widgets)
                  this.widgets = [widgets];

            }

         }.bind(this));
      else {
         dom = AdminLib.dom.div('disabledView');
         AdminLib.StandardPage.addToMain(dom);
         this.parent.detailScreen.updateSizes();
         promise = Promise.resolve();
      }

      return promise;
   };

   /**
    * @public
    */
   DetailView.prototype.dispose                  = function() {

      var /** @type {Object} */ widget;

      if (!this.widgets)
         return;

      for(widget of this.widgets) {

         if (typeof(widget.dispose) !== 'function')
            continue;

         widget.dispose();

      }

   };

   /**
    *
    * @param {Object} item
    * @returns {Promise.<HTMLElement>}
    */
   DetailView.prototype.getDOM                   = function(item) {
      return this.buildDOM(item);
   };

   /**
    *
    * @returns {Item}
    */
   DetailView.prototype.getCurrentItem           = function() {
      return this.parent.currentItem;
   };

   /**
    * Return the list summary of the section
    * @returns {ListSummary}
    */
   DetailView.prototype.getListSummary           = function() {
      return this.parent.listSummary;
   };

   /**
    *
    * @param {Item} [item]
    * @returns {boolean}
    * @public
    */
   DetailView.prototype.isEnabled                = function(item) {

      if (typeof(this.enabled) === 'boolean')
         return this.enabled;

      return this.enabled(item);
   };

   /**
    *
    * @returns {Promise<Array<string|Object>>}
    */
   DetailView.prototype.load                     = function() {
      var /** @type {Promise}   */ loadDataPromise
        , /** @type {Promise}   */ promise
        , /** @type {Promise[]} */ promises;

      loadDataPromise = this.loadData().then(function(data) {
         if (this.proceedData)
            this.data = this.proceedData(data);
         else
            this.data = data;

         return this.data;
      }.bind(this));

      //noinspection JSCheckFunctionSignatures
      promises = [ this.template !== undefined ? AdminLib.getTemplate(this.template) : undefined
                 , loadDataPromise];

      promise = Promise.all(promises);

      return promise;
   };

   /**
    * This function will retreive the data for the given item
    * @return {Promise.<Object>}
    */
   DetailView.prototype.loadData                 = function() {

      var data
        , /** @type {Promise} */ promise ;

      if (typeof(this.dataSource) === 'function')
         data = this.dataSource.bind(undefined, this.getCurrentItem());
      else
         data = this.dataSource;

      promise = AdminLib.loadData(data);

      return promise;
   };


   // ******************** SearchScreen ********************/
   /**
    *
    * About "promise":
    *    The promise will be resolved once the user submit his search.
    *    The promise will return the searchParameters entered by the user.
    *    If the user cancelled the search, then the search parameter will be undefined.
    *    Note : please remember that the promise will be resolve only the first time. IF you expect to use the same SearchScreen object for several
    *    search, please use listeners.
    *
    * Events :
    *    The search screen define 3 events :
    *
    *  - cancel  : the user cancelled the modal. This event is cancellable. If default prevented, then the search screen will not be hidden
    *  - close   : For modal only. Executed when the modal is starting to close
    *  - closed  : For modal only. Executed when the modal is closed
    *  - display : the modal is displayed. If default prevented, the modal will not be displayed
    *  - submit  : the user click on the "search" button. The event is cancellable. The default behavior will be to resolve the promise.
    *
    * @name AdminLib.Model.Handler.SearchScreen
    * @class
    * @param {SearchScreenParameters} parameters
    * @param parent
    * @param {boolean} cancelButton If true, then the search screen will display a cancel button
    * @constructor
    * @property {AdminLib.widget.Portlet} portlet
    * @property {HTMLElement}            dom           DOM of the portlet
    * @property {AdminLib.widget.Form}    form         DOM of the form
    * @property {Promise.<SearchScreen>} buildPromise  Promise resolved when the search screen is finished to be builded.
    * @property {AdminLib.widget.Widget}  widget
    * @property {Promise<Object>}        promise       Promise that will be resolved once the reserch has been made. The promise will return the search parameters
    */
   function SearchScreen(parameters, parent) {

      AdminLib.EventTarget.call(this);

      this.parent  = parent;
      this.title   = 'Search...';
      this.modal   = parameters.modal;

      if (AdminLib.coalesce(parameters.cancelButton, false))
         this.cancelButton = { label   : typeof(parameters.cancelButton) === 'string' ? parameters.cancelButton : 'Cancel'
                             , class   : AdminLib.coalesce(parameters.cancelButton.class, 'btn btn-primary')
                             , icon    : AdminLib.coalesce(parameters.cancelButton.icon, false)
                             , handler : this.cancelSearch.bind(this)}

      this.autoHide = AdminLib.coalesce(parameters.autoHide, false);
      this.modal    = AdminLib.coalesce(parameters.modal, false);

      this.reset();

   }

   SearchScreen.prototype                        = Object.create(AdminLib.EventTarget.prototype);
   SearchScreen.prototype.constructor            = SearchScreen;

   /**
    * Build the DOM of the search screen
    * @private
    */
   SearchScreen.prototype.buildDOM               = function buildDOM() {

      var formParameters;

      if (this.modal) {
         this.widget = new AdminLib.widget.Modal({title: this.title});

         this.widget.addEventListener ( AdminLib.widget.Modal.event.hide
                                      ,   function(event) {
                                             var /** @type {AdminLib.Event} */ screenEvent;

                                             screenEvent = new AdminLib.Event ( SearchScreen.event.close
                                                                             , { cancelable : event.cancelable
                                                                               , target     : this});

                                             this.dispatchEvent(screenEvent);

                                             if (screenEvent.defaultPrevented)
                                                event.preventDefault();

                                          });

         this.widget.addEventListener ( AdminLib.widget.Modal.event.hidden
                                      ,   function(event) {
                                             var /** @type {AdminLib.Event} */ screenEvent;

                                             screenEvent = new AdminLib.Event ( SearchScreen.event.closed
                                                                             , { cancelable : false
                                                                               , target     : this});

                                             this.dispatchEvent(screenEvent);
                                          });

      }
      else
         this.widget = new AdminLib.widget.Portlet({ title   : this.title });

      // For a search, all fields can be nullable
      formParameters = this.parent.getFormParameters();
      formParameters.fields.forEach(function(field) {
         field.nullable = true;

         // In modal, we want the form to occupy all the frame
         if (this.modal)
            field.style.input.sizeClass = 'col-md-9';
      }.bind(this));

      this.form      = new AdminLib.widget.Form(formParameters);

      this.searchAction = this.form.addAction({ class  : 'btn btn-primary'
                                              , code   : 'search'
                                              , label  : 'Search'
                                              , action : this.listener_onsubmit.bind(this)});

      if (this.cancelButton)
         this.form.addAction(this.cancelButton);

      this.form.addEventListener('submit', this.listener_onsubmit.bind(this));

      this.widget.setContent(this.form);

   };

   /**
    * Cancel the search.
    * The function will resolve the search screen promise. The promise will return
    * "undefined".
    *
    */
   SearchScreen.prototype.cancelSearch           = function cancelSearch() {

      var /** @type {AdminLib.Event} */ event;

      event = new AdminLib.Event ( SearchScreen.event.cancel
                                , { cancelable : true
                                  , target     : this } );

      this.dispatchEvent(event);

      if (event.defaultPrevented)
         return;

      this.fulfillFunction(undefined);
   };

   /**
    * Display the search screen.
    * The function will first fire the event "display".
    * The function will return a promise;
    * The promise resolve an object that :
    *    - Will be undefined if the user cancel the search
    *    - Will return the search parameters asked by the user
    * The promise will be rejected if the event "display" has been cancelled.
    * In this case, the value return by the promise will be the event.
    *
    * @param {HTMLElement} [parentDOM] Parent in wich the parent screen will be added
    * @returns {Promise.<Object>}
    * @public
    */
   SearchScreen.prototype.display                = function display() {

      var /** @type {AdminLib.Event} */ event;

      // Firering event : display
      event = new AdminLib.Event ( SearchScreen.event.display
                                , { cancelable : true
                                  , target     : this } );

      this.dispatchEvent(event);

      if (event.defaultPrevented)
         return Promise.reject(event);

      if (this.widget === undefined)
         this.buildDOM();

      // Displaying the screen
      if (this.modal) {
         this.widget.display();
      }
      else {
         AdminLib.StandardPage.emptyMain();
         AdminLib.StandardPage.setTitle(this.parent.itemType_plural, '');
         AdminLib.StandardPage.addToMain(this.widget);
      }

      return this.promise;
   };

   /**
    * @internal
    */
   SearchScreen.prototype.dispose                = function dispose() {

      if (!this.form)
         return;

      this.form.dispose();
   };

   /**
    *
    * @returns {AdminLib.Action.Button}
    * @public
    */
   SearchScreen.prototype.getSearchButton        = function getSearchButton() {
      return this.searchAction;
   };

   /**
    * Return the widget of the screen.
    *
    * "getPromise" return you a promise that will be resolved when the form is finished to be added.
    * @returns {AdminLib.widget.Portlet | AdminLib.widget.Modal}
    * @private
    */
   SearchScreen.prototype.getWidget              = function getDOM() {
      if (this.widget === undefined)
         this.buildDOM();

      return this.widget;
   };

   /**
    * Function executed when the user submited the form
    * @param {Event} event
    * @returns {boolean}
    * @private
    */
   SearchScreen.prototype.listener_onsubmit      = function searchSubmit(event) {

      var /** @type {AdminLib.Event} */ event
        , /** @type {Item}          */ item
        , /** @type {Object}        */ searchParameters;

      item = this.form.getValue();
      searchParameters = {};

       Object.keys(item).forEach(function(code) {

         var /** @type {ModelField}                */ field
           , /** @type {AdminLib.widget.Form.Field} */ formField
           , /** @type {*}                         */ value;

         formField = this.form.getField(code);
         value     = item[code];
         field     = this.parent.getField(code);

         if (value === undefined)
            return;

         if (formField.isMultiple() && value === null) {
            code  = code + ':null';
            value = undefined;
         }
         else
            code = code + ':like';

         searchParameters[code] = field.getSearchString(value);
      }.bind(this));

      // Firering event : search
      event = new AdminLib.Event ( SearchScreen.event.search
                                , { cancelable : true
                                  , detail     : {searchParameters : searchParameters}
                                  , target     : this } );

      this.dispatchEvent(event);

      if (event.defaultPrevented)
         return false;

      // end event;

      this.fulfillFunction(searchParameters);

      return false;
   };

   SearchScreen.prototype.reset                  = function reset() {

      this.dom    = undefined;
      this.widget = undefined;
      this.promise = new Promise(function(fulfill) {
         this.fulfillFunction = fulfill;
      }.bind(this));

      this.form = undefined;

   };

   SearchScreen.event = { cancel  : 'cancel'
                        , close   : 'close'
                        , closed  : 'closed'
                        , display : 'display'
                        , search  : 'search'};

   var internalToken = {};

   // ******************** SearchItem ********************/
   function SearchItem(parent) {
      this.searchScreen = new SearchScreen(parent, true);
      this.parent = parent;
   }

   SearchItem.prototype.buildDOM                 = function display() {

      this.modal = new AdminLib.widget.Modal();


      if (this.parent.searchFirst) {

         this.searchScreen = new SearchScreen({ modal  : true
                                              , cancel : true });

         this.searchScreen.display().then(function() {

            this.parent.listScreen.display({ cancel : true
                                           , mode   : ListScreen.MODE.SELECT })

         });
      }


   };

   /**
    * Indicate if the code is valid or not.
    * To be valid, a code :
    *    -  must be a string
    *    -  must not start with the "reservedPrefix" value
    *
    * @param {string} code
    * @returns {boolean}
    */
   function checkCode(code) {

      if (typeof(code) !== 'string')
         return false;

      return code.indexOf(reservedPrefix) !== 0
   }

   Handler.SearchScreen = SearchScreen;

   return Handler;
})();