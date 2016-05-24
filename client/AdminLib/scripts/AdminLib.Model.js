'use strict';

AdminLib.Model                                    = (function() {

   /**
    * @name AdminLib.Model~HandlerInformations
    * @typedef {Object}
    * @property {string[]}              scripts
    * @property {AdminLib.Model.Handler} handler
    * @property {AdminLib.Page}          page
    *
    */

   /**
    *
    * About property : handler
    *
    * Indicate the name of the handler.
    *
    * If handler is true or undefined, then the handler of the declared model is the default one.
    *
    * If the handler is false, then the model will have no default handler.
    *
    * If the handler is a string, then it will be used as the name of the handler.
    *
    * About property : handlerPath
    *
    * If the model declare an handler (default or not), then handlerPath declare the path of the stript
    * of the handler. If not defined, then the default path will be :
    *
    * For default handler :
    *    /model/{model}.js
    *
    * For non-default handler :
    *    /model/{model}.{handler}.js
    *
    * Where:
    *    {model}   : code of the model
    *    {handler} : code of the handler
    *
    * @name AdminLib.Model.Parameters
    * @typedef {Object}
    * @property {string}                apiPath
    * @property {string}                breadCrumbName Name of the model that will be display in the breadCrumbs bar. If not defined, then the label will be used
    * @property {BreadcrumbParameter[]} breadCrumbs
    * @property {string}                code
    * @property {boolean|string}        handler        Name of the handler
    * @property {string|string[]}       handlerPath    List of scripts of the handler
    * @property {string}                label          Label to use when talking about the model. If not defined, the the code will be used
    * @property {boolean}               menuEntry      Default: False. Indicate if there is a menu entry for the model or not.
    * @property {string}                model          Name of the model
    * @property {boolean}               page           Default: true. Indicate the page of the handler model
    *
    */

   /**
    * @name AdminLib.Model
    * @class
    * @param {AdminLib.Model.Parameters} parameters
    * @constructor
    * @property {string}                apiPath
    * @property {string}                breadCrumbName
    * @property {BreadcrumbParameter[]} breadCrumbs
    * @property {string}                code
    * @property {boolean}               hasMenuEntry   Indicate if the model has a menu entry (true) or not (false)
    * @property {string}                menuEntryID
    * @property {string}                moduleName
    * @property {RegExp}                urlRegExp
    */
   function Model(parameters) {

      var /** @type {Object} */ defaultHandler
        , /** @type {boolean} */ hasDefaultHandler;

      if (typeof(parameters) === 'string')
         parameters = {code : parameters};

      this.code             = parameters.code;

      this.apiPath          = AdminLib.coalesce(parameters.api, this.code.replace(/\./g, '/'));
      this.moduleName       = parameters.module;
      this.hasMenuEntry     = AdminLib.coalesce(parameters.menuEntry, false);

      this.handlers         = new AdminLib.Namespace ( /* itemType            */ undefined
                                                    , /* acceptUndefined     */ false
                                                    , /* keyType             */ 'string'
                                                    , /* acceptUndefinedKeys */ true);

      // handler
      hasDefaultHandler = AdminLib.coalesce(parameters.handler, true);

      if (hasDefaultHandler) {
         this.declareHandler(parameters);
      }
      else if (parameters.handlerPath)
         throw 'The model has no default handler and should not have handler path declared';

      if (this.code.indexOf('-') !== -1)
         throw 'Forbiden character : "-"';

      if (this.hasMenuEntry)
         this.menuEntryID = 'model-' + this.code.replace(/\./g, '-');

      // Example of regexp : ^country(\/\d+$|\/\d+\/.*$|\/?$)
      // Match with :
      //    . country
      //    . country/
      //    . country/9
      //    . country/9/
      //    . country/9/informations
      this.urlRegExp   = new RegExp(this.apiPath.replace('\/', '\\/') + '(\/\d+$|\/\d+\/.*$|\/?$)');

      // Binding function, so it's easy to call them
      this.breadCrumbHandler = this.breadCrumbHandler.bind(this);
      this.display           = this.display.bind(this);
      this.getURL            = this.getURL.bind(this);
      this.label             = AdminLib.coalesce(parameters.label, this.code);
      this.load              = this.load.bind(this);
      this.loadList          = this.loadList.bind(this);
      this.menuHandler       = this.menuHandler.bind(this);
      this.getURL            = this.getURL.bind(this);
      this.getState          = this.getState.bind(this);
      this.urlHandler        = this.urlHandler.bind(this);
      this.breadCrumbName    = AdminLib.coalesce(parameters.breadCrumbName, this.label.capitalizeFirstLetter());

      // Property : breadcrumbs
      if (parameters.breadCrumbs !== undefined)
         this.breadCrumbs = parameters.breadCrumbs.slice(0);
      else
         this.breadCrumbs = [];

      this.breadCrumbs.push({ label : this.breadCrumbName
                            , url   : this.getURL()
                            , handler : this.breadCrumbHandler })

   }

   /**
    *
    * @param {Event} event
    */
   Model.prototype.breadCrumbHandler             = function(event) {
      this.display();
   };

   /**
    * Check if the provided handler exists or not.
    * If the handler is not declared, then the function will raise an error.
    * @param {string|AdminLib.Model} handler
    * @public
    */
   Model.prototype.checkDeclaredHandler          = function(handler) {

      if (this.hasHandler(handler))
         return;

      if (handler === undefined)
         throw 'The model don\'t have default handler';

      throw 'The handler "' + handler + '" is not declared';
   };

   /**
    * Ask the server to create the item.
    *
    * About: handler
    * If an handler is provided, then it must have been declared in the model.
    * If no handler has been provided, then the default handler will be used.
    * The handler is usefull only for the queryFields. The creation will be
    * performe even if no handler has been found.
    *
    * About: queryFields
    * If no query fields is declared and if a handler has been found, then
    * the query fields will be all the fields of the handler
    *
    * About: transacton
    * If the value is true, then a new transaction object will be created (and returned)
    *
    * @param {Item}                         item
    * @param {string}                       [handler]   Code of the handler object to use for the item creation.
    * @param {string[]}                     queryFields List of fields to query in return of the PUT
    * @param {AdminLib.Connection | boolean} connection Default: False. Indicate the transaction to use for the query
    * @returns {Promise|AdminLib.Connection}
    */
   Model.prototype.create                        = function(item, handler, queryFields, connection) {

      item = this.minimize(item);

      if (this.isHandlerDeclared(handler)) {
         return this.loadHandler(handler).then(function(handler) {

            if (queryFields === undefined)
               queryFields = handler.getFields().map(function(field) {
                  return field.getApiCode();
               });

            return AdminLib.loadAjax ( this.apiPath
                                    , item
                                    , 'PUT'
                                    , undefined
                                    , {fields: queryFields}
                                    , connection);

         }.bind(this));
      }
      else {
         return AdminLib.loadAjax ( this.apiPath
                                 , item
                                 , 'PUT'
                                 , undefined
                                 , {fields: queryFields}
                                 , connection);
      }



   };

   /**
    * Declare a new handler.
    * @todo coalesce parameters
    * @param {AdminLib.Model.Handler.Parameters} parameters
    * @public
    */
   Model.prototype.declareHandler                = function(parameters) {
      var /** @type {Object} */ handler
        , /** @type {string} */ handlerPath;

      if (this.handlers.has(parameters.handler))
         throw 'Handler already declared';

      handler = { code : parameters.handler};

      this.handlers.add(handler);

      handler.page = AdminLib.coalesce(handler.page, true);

      // Parameter : handlerPath
      if (parameters.handlerPath === undefined) {

         if (parameters.handler === undefined)
            handlerPath = ['/model/' + this.getCode() + '.js'];
         else
            handlerPath = ['/model/' + this.getCode() + '.' + parameters.handler + '.js'];

      }
      else if (typeof(parameters.handlerPath) === 'string')
         handlerPath = [parameters.handlerPath];
      else // typeof === array
         handlerPath = parameters.handlerPath.slice(0);

      handler.scripts = handlerPath;
   };

   /**
    *
    * Calls :
    *    defineHandler(modelHandlerParameters);
    *    defineHandler(code, handlerParameters);
    *
    * @param param1
    * @param param2
    * @returns {AdminLib.Model.Handler}
    * @public
    */
   Model.prototype.defineHandler                 = function(param1, param2) {

      var /** @type {string}                            */ code
        , /** @type {AdminLib.Model.Handler}             */ handler
        , /** @type {AdminLib.Model~HandlerInformations} */ handlerInfo;

      code = undefined;

      switch(arguments.length) {

         case 1:
            handler = param1;
            break;

         case 2:
            code    = param1;
            handler = param2;
      }

      if (this.isHandlerLoaded(code) && !AdminLib.debug)
         throw 'Handler already loaded';

      handlerInfo = this.handlers.get(code);

      handler = new AdminLib.Model.Handler(handler, code, this);

      handlerInfo.handler = handler;

      return handler;
   };

   /**
    *
    * @param {Item}               item
    * @param {AdminLib.Connection} connection
    * @returns {Promise.<AjaxActionResult>}
    * @public
    */
   Model.prototype['delete']                     = function(item, connection) {

      return AdminLib.Model.delete ( /* path       */ this.apiPath + '/' + this.getID(item)[0]
                                  , /* object     */ undefined
                                  , /* headers    */ undefined
                                  , /* connection */ connection);

   };

   /**
    * Display the model by using the default handler.
    * All parameters will be provided to the display handler function.
    * @param {string} handler
    * @returns {Promise}
    * @public
    */
   Model.prototype.display                       = function(handler) {

      var /** @type {Array} */ listParameters;

      listParameters = Array.prototype.slice.call(arguments, 1);

      return this.displayHandler(undefined, listParameters);
   };

   /**
    *
    * @param {string} code
    * @param {Array}  listParameters
    * @returns {Promise}
    * @public
    */
   Model.prototype.displayHandler                = function(code, listParameters) {
      return this.loadHandler(code)
         .then(
            function(handler) {
               handler.display.apply(handler, listParameters);
            }.bind(this));
   };

   /**
    * Use this function to edit an item on server side.
    * The values of the item of the given ID will be replaced by thoses of "item".
    * By default, a field that is "undefined" will NOT be changed on server side.
    * Empty fields MUST be declared in the "emptyFields" array.
    * The server MUST return the object newly created. With the fields provided
    * by "fields" parameter.
    *
    * @param {*}                  id            ID of the edited item
    * @param {Item}               editedItem    New values of the item.
    * @param {string[]}           [emptyFields] List of empty fields
    * @param {string[]}           [queryFields] List of field of the updated item to retreive
    * @param {AdminLib.Connection} [connection]
    * @returns {Promise.<AdminLib.Action.Result>}
    */
   Model.prototype.edit                          = function(id, editedItem, emptyFields, queryFields, connection) {

      var /** @type {Object} */ urlParameters;

      // En attendant de gérer l'ID correctement.
      if (id instanceof Array)
         id = id[0];

      urlParameters = {};

      if (id === undefined)
         throw 'No ID provided';

      if (queryFields !== undefined)
         urlParameters.fields = queryFields;

      if (emptyFields !== undefined)
         urlParameters.emptyFields = emptyFields;


      return AdminLib.Model.patch ( /* path          */ this.apiPath + '/' + id
                                 , /* urlParameters */ urlParameters
                                 , /* object        */ editedItem
                                 , /* headers       */ undefined
                                 , /* connection    */ connection);

   };

   /**
    *
    * @private
    */
   Model.prototype.enableMenu                    = function() {

      if (this.hasMenuEntry)
         AdminLib.StandardPage.activateMenu(this.menuEntryID);
   };

   /**
    * Indicate if two items are equals or not.
    *
    * Item will be considered as equal if they have the same primary key values.
    *
    * @param {Item} item1
    * @param {Item} item2
    * @returns {boolean}
    * @public
    */
   Model.prototype.equal                         = function(item1, item2) {
      return this.getID(item1)[0] === this.getID(item2)[0];
   };

   /**
    *
    * @param {string} path
    * @param {Object} object
    * @param {Object} headers
    * @returns {Promise}
    */
   Model.prototype.get                           = function(path, object, headers) {
      return AdminLib.Model.get(this.apiPath + '/' + path, object, headers);
   };

   /**
    * Return the API path of the model
    * @returns {string}
    * @public
    */
   Model.prototype.getApiPath                    = function() {
      return this.apiPath;
   };

   /**
    *
    * @returns {string}
    * @public
    */
   Model.prototype.getCode                       = function() {
      return this.code;
   };

   /**
    *
    * @param {string} code
    * @returns {AdminLib.Model.Handler}
    * @public
    */
   Model.prototype.getHandler                    = function(code) {

      var /** @type {AdminLib.Model.Handler.Information} */ handlerInformations;

      if (!this.isHandlerDeclared(code))
         throw 'The handler is not declared';

      if (!this.isHandlerLoaded(code))
         throw 'The handler is not loaded';

      handlerInformations = this.handlers.get(code);

      return handlerInformations.handler;
   };

   /**
    *
    * @param {Item} item
    * @returns {Array.<number|string>}
    * @public
    */
   Model.prototype.getID                         = function(item) {
      return [item.id];
   };

   /**
    *
    * @param {string|AdminLib.Model.Handler} [handler]
    * @returns {AdminLib.Page}
    */
   Model.prototype.getPage                       = function(handler) {

      if (!this.hasHandler(handler))
         throw 'The handler don\'t belong to the model';

      return AdminLib.page.get(this, handler);
   };

   /**
    *
    */
   Model.prototype.getSource                     = function() {
      return AdminLib.loadModule(this.moduleName)
               .then(
                  function () {
                     // TODO : incorrect
                     return AdminApp.module.centerGroup.getNewSource()
                  });
   };

   Model.prototype.getState                      = function() {
      /* return new AdminLib.HistoryState ( { model : this.code }
                              , this.getStateTitle.apply(this, arguments)
                              , this.getURL.apply(this, arguments))*/
   };

   Model.prototype.getStateTitle                 = function() {
      return 'App - ';
   };

   /**
    *
    * @returns {string}
    * @public
    */
   Model.prototype.getTitle                      = function() {
      return 'App';
   };

   /**
    * @param {Item} [item]
    * @returns {string}
    * @public
    */
   Model.prototype.getURL                        = function(item) {

      if (item === undefined)
         return '/' + this.apiPath;

      return this.getURL() + '/' + this.getID(item)[0];
   };

   /**
    * Check if the handler belongs to the model or not.
    * The main difference with the "is declared handler" function is that
    * this function accept also AdminLib.Model.Handler objects as parameter.
    *
    * @param {string|AdminLib.Model} handler
    * @public
    */
   Model.prototype.hasHandler                    = function(handler) {

      var /** @type {string} */ code;

      if (handler instanceof AdminLib.Model.Handler)
         return handler.getModel() === this

      return this.isHandlerDeclared(handler);
   };

   /**
    *
    * @param {string} code
    * @returns {boolean}
    * @public
    */
   Model.prototype.isHandlerDeclared             = function(code) {

      var /** @type {Object} */ handlerInfo;

      handlerInfo = this.handlers.get(code);

      if (handlerInfo === undefined)
         return false;

      if (handlerInfo.scripts === undefined)
         return false;

      return handlerInfo.scripts.length > 0;
   };

   /**
    *
    * @param {string} code
    * @returns {boolean}
    * @public
    */
   Model.prototype.isHandlerLoaded               = function(code) {
      var /** @type {Object} */ handlerInfo;

      if (!this.isHandlerDeclared(code))
         return false;

      return this.handlers.get(code).handler !== undefined;
   };

   /**
    * Minimize the data so it can be jsonify.
    * This function should be overriden.
    * @param {Item} item
    * @returns {Item}
    */
   Model.prototype.minimize                      = function(item) {
      return item;
   };

   /**
    * Load the fields of the given item
    * @param {Item}     item
    * @param {string[]} fields
    * @returns {Promise.<Item>}
    * @public
    */
   Model.prototype.load                          = function(item, fields) {
      return AdminLib.loadAjax(this.apiPath + '/' + item.id, {fields : fields})
   };

   /**
    *
    * @param {string} [code]
    * @returns {Promise<AdminLib.Model.Handler>}
    * @public
    */
   Model.prototype.loadHandler                   = function(code) {

      var /** @type {string[]} */ scripts;

      // Checking that the handler is declared
      if (!this.isHandlerDeclared(code)) {
         if (code === undefined)
            return Promise.reject('The default handler of the model "' + this.code + '" is not declared');
         else
            return Promise.reject('The handler "' + code + '" of the model "' + this.code + '" is not declared');
      }

      // If the handler is already defined, we return
      // In debug mode, we always reload the model handler
      // Like that, we don't have to always refresh the page to update modifications
      if (this.isHandlerLoaded(code) && !AdminLib.debug)
         return Promise.resolve(this.getHandler(code));

      // Retreiving the list of scripts of the handler
      scripts = this.handlers.get(code).scripts;

      return AdminLib.loadScripts(scripts)
         .then(
            function() {

               if (!this.isHandlerLoaded(code)) {

               if (code === undefined)
                  return Promise.reject('The default handler hasn\'t been declared');
               else
                  return Promise.reject('The handler "' + code + '" hasn\'t been declared');
               }

               return this.getHandler(code);
            }.bind(this));
   };

   /**
    *
    * @param {string[]} fields    List of fields to display
    * @param {object}   [filters] Filters to apply
    * @returns {Promise<Item[]>}
    */
   Model.prototype.loadList                      = function(fields, filters) {

      var /** @type {Object}  */ parameters
        , /** @type {Promise} */ promise;

      filters = filters == undefined ? {} : filters;

      parameters = $.extend({}, filters, {fields: fields});

      promise = AdminLib.loadAjax(this.apiPath, parameters).then(function(data) {
         return data.list;
      });

      return promise;
   };

   /**
    *
    * About getValue :
    *    When searching a value inside the list of options, by default we compare each item with each other.
    *    This function is usefull for example when the options are a list of items.
    *
    * @name AdminLib.Model.LoadOptionsParameters
    * @property {string[]}                     fields             List of fields to retrieve
    * @property {Object}                       [filters]
    * @property {function(Item):string|string} [getValue]         Default: Retreived the value to compare
    * @property {function(Item):string|string} [getLabel='label'] Function returning the label of the option or name of the field containing the label
    * @property {string}                       [sort]             Order of the sort : ASC or DESC.
    */


   /**
    *
    * About parameters :
    *    If "parameters" is an array, then it will be used as the field list to retrieve.
    *    Equivalent of :
    *       parameters = {fields : parameters}
    *
    * @param {string[]|AdminLib.Model.LoadOptionsParameters} parameters
    * @returns {Promise.<SelectOptionsLike>}
    */
   Model.prototype.loadOptions                   = function(parameters) {

      var /** @type {function}                     */ equalFunction
        , /** @type {function(Item):string|string} */ getLabel
        , /** @type {function(Item):string|string} */ getValue
        , /** @type {Promise}                      */ promise
        , /** @type {string}                       */ sort;

      if (parameters instanceof Array) {
         parameters = {fields : parameters};
      }

      sort          = AdminLib.coalesce(parameters.sort    , undefined);
      getLabel      = AdminLib.coalesce(parameters.getLabel, 'label');
      getValue      = parameters.getValue;

      if (sort !== undefined)
         sort = sort.toUpperCase();

      if (sort !== undefined && sort !== 'ASC' && sort !== 'DESC')
         throw new AdminLib.Error('Invalid "sort" value. Values accepted are : ASC, DESC or undefined');

      promise = this.loadList ( parameters.fields
                              , parameters.filters);

      promise = promise.then(
         /**
          *
          * @param {Item[]} items
          * @returns {Item[]}
          */
         function(items) {

            var /** @type {SelectOption} */ selectOption;

            items = items.map(
               function(item) {
                  return { item  : item
                         , label : typeof(getLabel) === 'function' ? getLabel(item) : item[getLabel]
                         , value : typeof(getValue) === 'function' ? getValue(item) : getValue === undefined ? item : item[getValue]};
               });

            if (sort === 'ASC')
               items = items.sort(function(i1, i2) {
                  return i1.label < i2.label ? -1 : (i1.label > i2.label ? 1 : 0);
               });

            else if (sort === 'DESC')
               items = items.sort(function(i1, i2) {
                  return i1.label < i2.label ? 1 : (i1.label > i2.label ? -1 : 0);
               });

            return items;
      });

      if (typeof(getValue) === 'function')

         equalFunction = function(a, b) {
            return getValue(a) == getValue(b);
         }

      else if (typeof(getValue) === 'string')
         equalFunction = function(a, b) {
            return a[getValue] == b[getValue];
         }
      else
         equalFunction = this.equal.bind(this);

      return new AdminLib.SelectOptionList(promise, equalFunction);
   };

   /**
    * Handle the click on the menu item
    * @param {Event} event
    */
   Model.prototype.menuHandler                   = function(event) {
      this.display();
   };

   /**
    *
    * @param path
    * @param urlParameters
    * @param object
    * @param headers
    * @returns {Promise.<AjaxActionResult>}
    */
   Model.prototype.post                          = function(path, urlParameters, object, headers, connection) {

      return AdminLib.Model.post ( /* path          */ this.apiPath + '/' + path
                                , /* urlParameters */ urlParameters
                                , /* data          */ object
                                , /* headers       */ headers
                                , /* connection    */ connection);

   };

   /**
    *
    * @param {string} path
    * @param {Object} urlParameters
    * @param {Object} object
    * @param {Object} headers
    * @returns {Promise.<AjaxActionResult>}
    * @private
    */
   Model.prototype.patch                         = function(path, urlParameters, object, headers, connection) {

      return AdminLib.Model.patch ( /* path          */ this.apiPath + '/' + path
                                 , /* urlParameters */ urlParameters
                                 , /* data          */ object
                                 , /* headers       */ headers
                                 , /* connection    */ connection);
   };

   /**
    *
    * @param path
    * @param urlParameters
    * @param object
    * @param headers
    * @returns {Promise.<AjaxActionResult>}
    */
   Model.prototype.put                           = function(path, urlParameters, object, headers, connection) {

      return AdminLib.Model.put ( /* path          */ this.apiPath + '/' + path
                               , /* urlParameters */ urlParameters
                               , /* data          */ object
                               , /* headers       */ headers
                               , /* connection    */ connection);

   };

   /**
    *
    * @param {string} path
    * @param {File}   file
    * @public
    */
   Model.prototype.sendFile                      = function(path, file) {
      return AdminLib.Model.sendFile(this.apiPath + '/' + path, file);
   };

   /**
    *
    * @param {string}                       path
    * @param {FormData|AdminLib.widget.Form} formData
    * @param {string[]}                     fields Fields to return
    * @returns {Promise.<Item>}
    * @public
    */
   Model.prototype.sendMultipart                 = function(path, formData, fields) {
      return AdminLib.Model.sendMultipart(this.apiPath + '/' + path, formData, fields);
   };

   /**
    *
    * @param item
    * @returns {*}
    * @public
    */
   Model.prototype.update                        = function(item) {

      var /** @type {function():boolean} */ onsuccess
        , /** @type {function():boolean} */ onerror;

      onsuccess = function() { return true  };
      onerror   = function() { return false };

      return AdminLib.loadAjax ( this.apiPath + '/' + item.id
                              , item
                              , 'PATH')
               .then(onsuccess, onerror);

   };

   /**
    *
    * @private
    */
   Model.prototype.updateBreadCrumb              = function() {
      AdminLib.StandardPage.updateBreadCrumb(this.breadCrumbs);
   };

   Model.prototype.urlHandler                    = function(url) {
      return Module.load(this.moduleName).then(function() {
         AdminLib.modules[this.moduleName].urlHandler(url);
      }.bind(this));
   };

   /**
    * @name AdminLib.Model.ajax
    * @param {string}             path
    * @param {Object}             data
    * @param {string}             method
    * @param {Object}             headers
    * @param {Object}             urlParameters
    * @param {AdminLib.Connection} connection
    * @returns {Promise.<AjaxActionResult>}
    * @private
    */
   Model.ajax                                    = function(path, data, method, headers, urlParameters, connection) {

      var /** @type {function():boolean} */ onsuccess
        , /** @type {function():boolean} */ onerror
        , /** @type {string}             */ urlParametersString;

      onsuccess =
         /**
          * @param {Response} response
          * @returns {Promise.<AjaxActionResult>}
          */
         function(response) {
             return { success    : true
                    , status     : response.status
                    , statusText : response.statusText
                    , message    : response.message
                    , data       : response }
         };

      onerror   =
         /**
          *
          * @param {Response} response
          * @returns {Promise.<AjaxActionResult>}
          */
         function(response) {
            return response.json().then(function(data) {
               return { success    : false
                      , status     : response.status
                      , statusText : response.statusText
                      , message    : data.message
                      , data       : data };
            });
         };

      urlParametersString = AdminLib.getURLParameters(urlParameters);

      return AdminLib.loadAjax ( /* path          */ path + (urlParametersString  ? '?' + urlParametersString : '')
                              , /* data          */data
                              , /* method        */ method
                              , /* headers       */ headers
                              , /* urlParameters */ undefined
                              , /* connection    */ connection)
               .then(onsuccess, onerror);
   };

   /**
    * @name AdminLib.Model.delete
    * @param {string}             path
    * @param {Object}             object
    * @param {Object}             headers
    * @param {AdminLib.Connection} connection
    * @returns {Promise.<AjaxActionResult>}
    */
   Model['delete']                               = function(path, object, headers, connection) {

      return AdminLib.Model.ajax ( /* path          */ path
                                , /* data          */ object
                                , /* method        */ 'DELETE'
                                , /* headers       */ headers
                                , /* urlParameters */ undefined
                                , /* connection    */ connection);

   };

   /**
    * @name AdminLib.Model.put
    * @param {string}             path
    * @param {Object}             object
    * @param {Object}             headers
    * @param {AdminLib.Connection} connection
    * @returns {Promise.<AjaxActionResult>}
    * @private
    */
   Model.put                                     = function(path, urlParameters, object, headers, connection) {
      return AdminLib.Model.ajax ( /* path          */ path
                                , /* data          */ object
                                , /* method        */ 'PUT'
                                , /* headers       */ headers
                                , /* urlParameters */ undefined
                                , /* connection    */ connection);
   };

   /**
    * @name AdminLib.Model.patch
    * @param {string}             path
    * @param {Object}             urlParameters
    * @param {Object}             object
    * @param {Object}             headers
    * @param {AdminLib.Connection} connection
    * @returns {Promise.<AjaxActionResult>}
    * @private
    */
   Model.patch                                   = function(path, urlParameters, object, headers, connection) {
      return AdminLib.Model.ajax ( /* path          */ path
                                , /* data          */ object
                                , /* method        */ 'PATCH'
                                , /* headers       */ headers
                                , /* urlParameters */ urlParameters
                                , /* connection    */ connection);
   };

   /**
    *
    * @param {string} path
    * @param {Object} urlParameters
    * @param {Object} object
    * @param {Object} headers
    * @returns {Promise.<AjaxActionResult>}
    * @private
    */
   Model.post                                    = function(path, urlParameters, object, headers, connection) {

      return AdminLib.Model.ajax ( /* path          */ path
                                , /* data          */ object
                                , /* method        */ 'POST'
                                , /* headers       */ headers
                                , /* urlParameters */ urlParameters
                                , /* connection    */ connection);

   };

   Model.sendFile                                = function(path, file) {

      var /** @type {function():boolean} */ onsuccess
        , /** @type {function():boolean} */ onerror;

      onsuccess =
         /**
          * @param {Response} response
          * @returns {Promise.<AjaxActionResult>}
          */
         function(response) {
             return { success    : true
                    , status     : response.status
                    , statusText : response.statusText
                    , message    : response.message
                    , data       : response }
         };

      onerror   =
         /**
          *
          * @param {Response} response
          * @returns {Promise.<AjaxActionResult>}
          */
         function(response) {
            return response.json().then(function(data) {
               return { success    : false
                      , status     : response.status
                      , statusText : response.statusText
                      , message    : data.message
                      , data       : data };
            });
         };

      return AdminLib.sendFile ( path
                              , file)
               .then(onsuccess, onerror);
   };

   /**
    *
    * @param {string}   path
    * @param {FormData|AdminLib.widget.Form} formData
    * @param {string[]} fields Fields to return
    * @returns {Promise.<Item>}
    * @public
    */
   Model.sendMultipart                           = function(path, formData, fields) {
      return AdminLib.sendMultipart(path, {fields: fields}, formData, 'POST');
   };

   return Model
})();

AdminLib.Model.Namespace                          = (function() {

   /**
    *
    * @param {string} code
    * @constructor
    * @extends {AdminLib.Namespace}
    */
   function Namespace(code) {

      AdminLib.Namespace.call(this, /* itemType           */ AdminLib.Model
                                 , /* acceptUndefined    */ false
                                 , /* keyType            */ 'string'
                                 , /* acceptUndefinedKey */ false);

      this.code = code;
   }

   Namespace.prototype                           = Object.create(AdminLib.Namespace.prototype);
   Namespace.prototype.constructor               = AdminLib.Model.Namespace;

   /**
    * Clone the namespace
    * @returns {AdminLib.Model.Namespace}
    * @public
    */
   Namespace.prototype.clone                     = function() {
      var /** @type {AdminLib.Model.Namespace} */ clone

      clone = AdminLib.Namespace.prototype.clone.call(this);
      clone.code = this.code;

      return clone;
   };

   /**
    * Return the code of the namespace
    * @returns {string}
    * @public
    */
   Namespace.prototype.getCode                   = function() {
      return this.code;
   };

   return Namespace;
})();

AdminLib.model                                    = (function() {

   var declare
     , /** @type {AdminLib.Model.Namespace}                     */ defaultNamespace
     , getModel
     , getNamespace
     , /** @type {AdminLib.Namespace.<AdminLib.Model.Namespace>} */ namespaces;

   /**
    * Declare a model and a handler.
    * If the model don't exists, then it will be created
    * @name AdminLib.model.declare
    * @param {AdminLib.Model|AdminLib.Model.Parameters|string} parameters
    * @param {string|AdminLib.Namespace}                      [namespaceCode]
    * @returns {AdminLib.Model}
    * @public
    */
   declare                                    = function declare(parameters, namespaceCode) {

      var /** @type {AdminLib.Model}           */ model
        , /** @type {AdminLib.Model.Namespace} */ namespace;

      namespace = AdminLib.model.namespace(namespaceCode);

      if (typeof(parameters) === 'string')
         parameters = {code : parameters};

      if (namespace === undefined)
         namespace = new AdminLib.Model.Namespace(namespaceCode);

      if (parameters instanceof AdminLib.model) {
         model = parameters;
         namespace.add(model);
      }
      else if (namespace.has(parameters.code)) {
         // If the model already exists in the model, we retrieve it
         // and add the declared handler
         model = namespace.get(parameters.code);
         model.declareHandler(parameters);
      }
      else {
         // If the model don't exists, we create it
         model = new AdminLib.Model(parameters);
         namespace.add(model);
      }

      namespace.add(model);

      return model;
   };

   /**
    * @name AdminLib.model
    * Return the model corresponding to the given code. If no namespace code provided, then
    * the model will be search in the default namespace.
    *
    * @param {string}                         name
    * @param {string|AdminLib.Model.Namespace} [namespace]
    * @returns {AdminLib.Model}
    * @public
    */
   getModel                                   = function get(name, namespace) {

      var /** @type {string}                  */ model;

      if (!(namespace instanceof AdminLib.Model.Namespace))
         namespace = AdminLib.model.namespace(namespace);

      if (namespace === undefined)
         throw 'The namespace don\'t exists';

      model = namespace.get(name);

      if (model === undefined)
         throw 'The model ' + (namespace === undefined ? '' : '"' + namespace.getCode() + '":') + '"' + name + '" don\'t exists';

      return model;
   };

   /**
    *
    * Return the namespace corresponding to the given code.
    * If the code is undefined, then return the default namespace.
    *
    * @name AdminLib.model.namespace
    * @param {string} [code]
    * @returns {AdminLib.Model.Namespace}
    * @public
    */
   getNamespace                               = function get(code) {
      return namespaces.get(code)
   };

   namespaces       = new AdminLib.Namespace ( /* itemType           */ AdminLib.Model.Namespace
                                            , /* acceptUndefined    */ false
                                            , /* keyType            */ 'string'
                                            , /* acceptUndefinedKey */ true);

   defaultNamespace = new AdminLib.Model.Namespace(undefined);

   namespaces.add(defaultNamespace);

   getModel.declare   = declare;
   getModel.namespace = getNamespace;
   getModel.get       = getModel;

   return getModel;
})();