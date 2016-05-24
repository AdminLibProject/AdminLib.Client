'use strict';

AdminLib.Page = (function() {

   var repository;

   repository = new AdminLib.Repository('AdminLib.page');

   /**
    *
    * About model :
    *
    *    If a model and string handler has been provided
    *    then the handler will be the corresponding handler of model.
    *
    * @name AdminLib.Page
    * @extends AdminLib.Package
    * @class
    * @constructor
    *
    * @param {AdminLib.Page.Parameters} parameters
    * @property {string}                   code
    * @property {string|function():string} url
    * @property {string}                   model
    * @property {function|string}          handler
    */
   function Page(parameters) {

      if (typeof(parameters) === 'string')
         parameters = {code : parameters};

      AdminLib.EventTarget.call(this);

      this.code = parameters.code;
      this.url  = AdminLib.coalesce(parameters.url, this.code.replace(/\./g, '/'));
      this.package = new AdminLib.Package(repository, this.code, parameters);

      if (parameters.model !== false)
         this.model = AdminLib.coalesce(parameters.model, this.code);

      this.handler = parameters.handler;

      if (this.url === undefined)
         throw 'No URL provided';
   }

   Page.prototype                                = Object.create(AdminLib.EventTarget.prototype);
   Page.prototype.constructor                    = Page;

   /**
    *
    * @param {function} handler
    * @public
    */
   Page.prototype.defineHandler                  = function defineHandler(handler) {

      if (this.model !== undefined)
         throw 'The page use a model. The handler must be declare at model level';

      if (typeof(this.handler) === 'function')
         throw 'An handler have already been declared';

      this.handler = handler;
   };

   /**
    * Display the page.
    *
    * Param executeHandler :
    *
    * If handler parameter is true, then the handler will be executed.
    * If it's false, then the handler will not be executed at all (but menu and URL will still be uploaded)
    * If an array is provided, then the handler will be executed with this array as arguments
    *
    * @param {boolean|Array} [executeHandler=true]
    * @public
    */
   Page.prototype.display                        = function display(executeHandler) {
      var handlerPromise
        , /** @type {Array}              */ handlerParameters
        , /** @type {AdminLib.Menu.Entry} */ menuEntry;

      if (executeHandler instanceof Array) {
         handlerParameters = executeHandler;
         executeHandler    = true;
      }
      else {
         executeHandler    = AdminLib.coalesce(executeHandler, true);
         handlerParameters = [];
      }


      menuEntry = this.getCurrentMenuEntry();

      if (menuEntry)
         menuEntry.activate(false);

      if (executeHandler) {
         handlerPromise = this.getHandler();

         return handlerPromise.then(function(handler) {

            if (typeof(handler) === 'function')
               return handler.apply(undefined, handlerParameters);

            return handler.display.apply(handler, handlerParameters);
         });
      }
   };

   /**
    *
    * @returns {string}
    * @public
    */
   Page.prototype.getCode                        = function getCode() {
      return this.code;
   };

   /**
    *
    * @returns {AdminLib.Menu.Entry}
    * @public
    */
   Page.prototype.getCurrentMenuEntry            = function getCurrentMenuEntry() {
      return this.getMenuEntry(AdminLib.getCurrentMenu());
   };

   /**
    * Return the a promise that resolve the handler of the page.
    * @returns {Promise.<AdminLib.Model.Handler>}
    * @public
    */
   Page.prototype.getHandler                     = function getHandler() {

      var /** @type {AdminLib.Model} */ model
        , /** @type {Promise}       */ promise;

      promise = this.package.load();

      if (this.model) {
         model = this.getModel();

         if (model === undefined)
            throw 'Model not declared';

         return promise.then(
                  function() {
                     return model.loadHandler(this.handler);
               }.bind(this));

      }
      else if (typeof(this.handler) === 'string') {
         // Handler correspond to the name of a script : we load the script
         // and then check that the script declare the page handler

         promise = promise
                     .then(
                        function() {
                           return AdminLib.loadScripts(this.handler, true);
                        }.bind(this))
                     .then(
                        function() {
                           if (!typeof(this.handler) === 'function')
                              throw 'No handler loaded !';

                           return this.handler;
                        }.bind(this))

         return promise;
      }
      else if (this.handler)
         return promise.then(
                  function() {
                     return this.handler;
                  }.bind(this));


      return Promise.reject('No handler provided');
   };

   /**
    *
    * @returns {string}
    * @public
    */
   Page.prototype.getHandlerCode                 = function getHandlerCode() {
      return this.handler;
   };

   /**
    * @param {AdminLib.Menu} menu
    * @returns {AdminLib.Menu.Entry}
    * @public
    */
   Page.prototype.getMenuEntry                   = function getMenuEntry(menu) {
      return AdminLib.menu.entry.get(this, menu);
   };

   /**
    * Return the model associated to the page
    * @returns {AdminLib.Model}
    * @public
    */
   Page.prototype.getModel                       = function getModel() {

      if (this.model === undefined)
         return undefined;

      return AdminLib.model.get(this.model);
   };

   /**
    *
    * @returns {string}
    * @public
    */
   Page.prototype.getModelCode                   = function getModelCode() {
      return this.model;
   };

   /**
    *
    * @param rest
    * @returns {string}
    * @public
    */
   Page.prototype.getURL                         = function getURL() {

      if (typeof(this.url) === 'string')
         return string;

      return this.url.apply(undefined, arguments);
   };

   return Page;
})();

AdminLib.page = (function() {

   var /** @type {AdminLib.Namespace.<AdminLib.Page>} */ pages
     , /** @type {Object.<Object.<string>>}         */ pagesByModel;

   pages = new AdminLib.Namespace ( /* itemType            */ AdminLib.Page
                                 , /* acceptUndefined     */ false
                                 , /* keyType             */ 'string'
                                 , /* acceptUndefinedKeys */ true);

   pagesByModel = {};

   /**
    * Declaration :
    *    declareMenu(parameters);
    *    declareMenu(code, parameters);
    *
    * @param {string|AdminLib.Page.Parameters} param1
    * @param {string}                         [param2]
    * @public
    */
   function declare(parameters) {

      var /** @type {string}       */ model
        , /** @type {string}       */ handler
        , /** @type {AdminLib.Page} */ page;

      if (parameters instanceof AdminLib.Page)
         page = parameters;
      else
         page = new AdminLib.Page(parameters);

      model = page.getModelCode();

      if (model) {
         if (!pagesByModel[model])
               pagesByModel[model] = {};

         handler = page.getHandlerCode();

         if (pagesByModel[model][handler])
            throw 'A page is already defined for this model/handler';

         pagesByModel[model][handler] = page;
      }

      pages.add(page);

   };

   /**
    *
    * Calls :
    *    1. function(code:string):AdminLib.Page
    *    2. function(model:string, [handler:string]):AdminLib.Page
    *    3. function(model:AdminLib.Model, [handler:string]):AdminLib.Page
    *    4. function(handler:AdminLib.Model.Handler):AdminLib.Page
    *
    * @name AdminLib.page.get
    * @method
    * @param {string} [code]
    * @returns {AdminLib.Page}
    * @public
    */
   function getPage(param1, param2) {

      var /** @type {string} */ handler
        , /** @type {string} */ model;

      if (arguments.length === 1) {

         if (typeof(param1) === 'string')
            return pages.get(param1, true);

         // param1 instanceof AdminLib.Model.Handler
         model   = param1.getModel().getCode();
         handler = param1.getCode();

      }
      else {
         if (param1 instanceof AdminLib.Model)
            model = param1.getModel()
         else // typeof(param1) === 'string';
            model = param1;

         if (param2 instanceof AdminLib.Model.Handler)
            handler = param2.getCode();
         else // typeof(handler) === 'string';
            handler = param2;
      }

      if (!pagesByModel[model])
         return undefined;

      return pagesByModel[model][handler];
   };

   /**
    *
    * @param {string} [code]
    * @returns {boolean}
    * @public
    */
   function has(code) {
      return pages.hasPackage(code);
   };

   getPage.declare = declare;
   getPage.has     = has;
   getPage.get     = getPage;

   return getPage;

})();