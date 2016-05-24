'use strict';

/**
 * @typedef {Object|function():DataSource|Promise.<DataSource>|string} DataSource
 *
 *
 *
 */

/**
 * @typedef {Object} SectionInformation
 * @property {string}                   type
 * @property {Object.<PageInformation>} pages
 *
 */

/**
 * @typedef {Object} PageInformation
  * @property {string}   template
  * @property {string}   data
  * @property {string[]} dataFields
  *
  */

/**
 * @namespace {Object} AdminLib.widget
 */

/**
 * @namespace {Object} AdminLib.callback
 */

/**
 * @namespace {Object} AdminLib
 */
var AdminLib              = (function() {

   /**
    *
    * A module is defined by a set of pre-requisite, scripts, stylesheets and templates.
    * It's fully loaded when all of theses objets are loaded.
    * Note that any of theses objects (including pre-requisites) can already have been loaded previously.
    * In this case, the object will not be re-loaded : it will just be skipped.
    *
    * @typedef {Object} Package
    * @property {string[]} modules
    * @property {string[]} scripts
    * @property {string[]} stylesheets
    * @property {string[]} templates
    *
    */

   var AdminLib
     , /** @type {Object.<Promise>}          */ _loadedScripts     = {}
     , /** @type {Object.<Promise>}          */ _loadedStylesheets = {}
     , /** @type {Object.<Promise.<string>>} */ _loadedTemplates   = {}
     , /** @type {string}                    */ _sessionId         = undefined
     , /** @type {string}                    */ currentMenu
     , /** @type {Number}                    */ maxID              = 0
     , /** @type {Promise}                   */ startPromise
     , /** @type {function}                  */ startPromiseFulfill
     , /** @type {Object.<string>}           */ templates          = {};

   startPromise = new Promise(function(fullfil) {
      startPromiseFulfill = fullfil;
   });

   currentMenu = undefined;

   /**
    * Append a dom element or a list of dom element to a parent dom.
    *
    * @name AdminLib.appendElement
    * @param {AdminLib.DomLike}                   parentDOM
    * @param {AdminLib.DomLike|AdminLib.DomLike[]} childDOM
    * @param {Object}                            parameters
    * @param {Object}                            parent
    * @public
    */
   function appendElement(parentDOM, childDOM, parameters, parent) {

      var /** @type {HTMLElement} */ childElement;

      parentDOM = getDOM(parentDOM);
      childDOM  = getDomList(childDOM);

      if (childDOM instanceof Promise || parentDOM instanceof Promise) {

         Promise
            .all([parentDOM, childDOM])
            .then(function(doms) {

               parentDOM = data[0];
               childDOM  = data[1];

               appendElement(parentDOM, childDOM);

            });

         return;
      }

      for(childElement of childDOM) {
         parentDOM.appendChild(childElement);
      }

   }

   /**
    * Clone an object.
    *
    * Seet http://api.jquery.com/clone/
    * @param {Object}  object
    * @returns {*}
    */
   function clone(object, deepClone) {

      var newObject;

      if (!(object instanceof Object))
         return object;

      newObject = {};

      if (deepClone !== undefined)
         $.extend(deepClone, newObject, object);
      else
         $.extend(newObject, object);

      return newObject;
   }

   function coalesce() {

      var /** @type {number} */ a
        , /** @type {*}      */ value;

      for(a in arguments) {

         value = arguments[a];
         if (value !== undefined && value !== null)
            return value;
      }

      return undefined;
   }

   /**
    *
    * @param {string}          attribute
    * @param {Array|ArrayLike} list
    * @param {*}               [defaultValue]
    * @returns {*}
    */
   function coalesceAttribute(attribute, list, defaultValue) {

      var /** @type {number}   */ a
        , /** @type {Object[]} */ allObjects
        , /** @type {Object}   */ object
        , /** @type {*}        */ value;

      if (list === undefined)
         list = [];
      else if (!(list instanceof Array))
         list = Array.prototype.slice.call(list, 0);

      for(a in list) {

         if (list[a] === undefined || list[a] === null)
            continue;

         value = list[a][attribute];
         if (value !== undefined && value !== null)
            return value;
      }

      return defaultValue;

   }

   /**
    *
    * Coalesce option parameters. Note that only the first not undefined parameters
    * will be coalesced.
    * Eg :
    *
    * var list1 = undefined;
    * var list2 = {1: 'hello', 2: 'world'};
    * var list3 = ['One', 'Two', 'Three']
    *
    * var param = coalesceOptionParameters([list1, list2, list3]}
    *
    *
    * In this example, param is the coalesced version of list 3 :
    *    param = { {value: 1, label: 'hello'}
    *            , {value: 2, label: 'world'} }
    *
    * If parametersList undefined, then it will return undefined
    * If all parameters are undefined, then wil return an empty array
    * If the parameters is an promise, then the function will return a
    * promise. The value of the promise will be the coalesced options
    *
    * @param {AdminLib.Parameters.ListOptionsLike[]} parametersList
    * @returns {AdminLib.Parameters.SelectOption[]}
    *
    */
   function coalesceOptionParameters(parametersList) {

      var /** {AdminLib.Parameters.ListOptionsLike} */ coalescedParameters;

      if (parametersList === undefined)
         return undefined;

      parametersList = AdminLib.list.filterUndefined(parametersList);

      if (parametersList.length === 0)
         return [];

      coalescedParameters = parametersList[0];

      // If the parameters object is a promise
      if (coalescedParameters instanceof Promise)
         return coalescedParameters.then(function(parameters) {
            return coalesceOptionParameters([parameters]);
         });

      // For : AdminLib.Parameters.ListOptionsObject
      if (!(coalescedParameters instanceof Array))
         return Object.keys(coalescedParameters).map(function(key) {

            return { value   : key
                   , label   : coalescedParameters[key]};

         });


      return coalescedParameters.map(function(parameters, index) {

         var /** @type {string[]} */ classes;

         if (parameters === undefined)
            return undefined;

         if (typeof(parameters) === 'string')

            return { value   : index
                   , label   : parameters};

         // Property : classes
         if (typeof(parameters.classes) === 'string')
            classes = parameters.classes.split(' ');
         else if (parameters.classes instanceof Array)
            classes = parameters.classes.slice(0);
         else
            classes = undefined;

         return { classes  : classes
                , disabled : AdminLib.coalesce(parameters.disabled, false)
                , label    : parameters.label
                , value    : parameters.value};

      });

   }

   /**
    * Define the given session ID as the current one.
    * The function will also update the local storage
    * @param {string} sessionId
    */
   function defineSessionID(sessionId) {
      if (sessionId === _sessionId)
         return;

      _sessionId = sessionId;
      localStorage.setItem('session-id', sessionId);
   }

   /**
    *
    * @param {string} moduleName
    * @param {Array} parameters
    * @returns {Promise}
    */
   function displayModule(moduleName, parameters) {

      return AdminLib.Package.load(moduleName).then(function() {

         // Calling the "display" function of the module with the parameter previously provided
         AdminLib.modules[moduleName].display.apply(AdminLib.modules[moduleName], parameters);

      });

   }

   /**
    * Show an error to the user
    * @param message
    * @param title
    * @returns {*}
    * @public
    */
   function error(message, title) {

      return new AdminLib.Error({ message : message
                               , title   : title });

   }

   /**
    * @name AdminLib.fetchRequest
    * @param {Request} request
    * @returns {Promise.<Response>}
    * @public
    */
   function fetchRequest(request) {

      return fetch(request).then(function(response) {

            var /** @type {string} */ sessionId;

            if (response.status !== 200)
               throw new AdminLib.FetchError(response, request);

            sessionId = response.headers.get('Session-Id');

            defineSessionID(sessionId);

            return response.json();
         });

   }

   /**
    * Encode a string to a application/x-www-form-urlencoded form.
    * Code provided by Mozilla (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent)
    * @param str
    * @returns {string}
    */
   function fixedEncodeURIComponent (str) {
     return encodeURIComponent(str).replace(/[!'()*]/g, function(c) {
       return '%' + c.charCodeAt(0).toString(16);
     });
   }

   /**
    *
    * @returns {AdminLib.menu}
    * @public
    */
   function getCurrentMenu() {
      return AdminLib.menu.get(this.currentMenu);
   }

   /**
    *
    * Use this function to get the DOM of an object.
    * If the provided object is already a dom object, then it's immediatly returned.
    * Oterwise, the function will call the "getDOM" function of the object.
    *
    * @name AdminLib.getDOM
    * @param {AdminLib.DomLike} dom
    * @returns {HTMLElement|Promise.<HTMLElement>}
    * @public
    */
   function getDOM(dom) {

      if (dom instanceof HTMLElement)
         return dom;

      else if (dom instanceof Promise)
         return dom.then(getDOM);

      else if (typeof(dom.getDOM) === 'function')
         return getDOM(dom.getDOM());

      else if (typeof(dom) === 'string')
         return AdminLib.dom.build(dom);

      throw 'Not a valid dom object';
   }

   /**
    *
    * @param {AdminLib.DomLike|Array.<AdminLib.DomLike>} domList
    * @returns {HTMLElement[]|Promise.<HTMLElement[]>}
    */
   function getDomList(domList) {

      var /** @type {AdminLib.DomLike}   */ domElement
        , /** @type {AdminLib.DomLike[]} */ newDomList
        , /** @type {boolean}           */ isPromise;

      if (domList instanceof HTMLElement)
         return [domList];

      if (domList instanceof Promise)
         return dom.then(getDomList);

      if (typeof(domList.getDOM) === 'function')
         return getDomList(domList.getDOM());

      if (domList instanceof Array) {

         newDomList = [];
         isPromise  = false;

         for(domElement of domList) {
            domElement = getDOM(domElement);
            isPromise  = isPromise || newDomList instanceof Promise;

            newDomList.push(domElement);
         }

         if (isPromise)
            return Promise.all(newDomList);

         return newDomList;
      }

      throw 'Not a valid dom';
   }

   /**
    *
    * @param {Item} editedItem
    * @param {Item} originalItem
    * @returns {string[]}
    */
   function getEmptyFields(editedItem, originalItem) {

      var /** @type {string[]} */ emptyFields
        , /** @type {string}   */ key;

      emptyFields = [];

      for(key of Object.keys(originalItem)) {

         if (originalItem[key] === undefined)
            continue;

         if (editedItem[key] !== undefined)
            continue;

         emptyFields.push(key);
      }

      return emptyFields;
   }

   function getModuleSource(moduleName) {

      return AdminLib.Package.load(moduleName).then(function() {
         return AdminLib.modules[moduleName].getNewSource();
      });

   }

   /**
    *
    * @returns {number}
    */
   function getNewId () {
      return maxID++;
   }

   /**
    * Return the current session ID;
    * @returns {string}
    */
   function getSessionID() {
      return _sessionId;
   }

   /**
    * Return the template corresponding to the given name
    * @param {string} name
    * @returns {string}
    */
   function getTemplate(name) {

      if (templates[name] === undefined)
         throw 'The template "' + name + '" hasn\'t been imported yet';

      return templates[name];
   }

   function getURLParameters(parameters) {

      var /** @type {string} */ name
        , /** @type {number} */ p
        , /** @type {string} */ stringParameters
        , /** @type {string} */ urlParameters;

      urlParameters = '';

      for(name in parameters) {

         stringParameters = '';

         if (parameters[name] instanceof Array) {

            if (parameters[name].length === 0)
               continue;

            for(p in parameters[name]) {
               stringParameters += ',' + fixedEncodeURIComponent(parameters[name][p]);
            }

            stringParameters = stringParameters.substr(1);
         }
         else {
            stringParameters += fixedEncodeURIComponent(parameters[name]);
         }

         urlParameters += '&' + name + (stringParameters != undefined && stringParameters != '' ? '=' + stringParameters : '');
      }

      return urlParameters.substr(1);
   }

   /**
    * @name AdminLib.loadAjax
    * Execute the an ajax query.
    * @param {string}             path
    * @param {object}             [data]
    * @param {string}             [method='GET']
    * @param {object}             [urlParameters] For non GET methods only
    * @param {object}             [headers]
    * @param {AdminLib.Connection} [connection]    Connection object to use for the query
    * @returns {Promise}
    */
   function loadAjax(path, data, method, headers, urlParameters, connection) {

      var /** @type {Promise} */ fetchPromise
        , /** @type {string}  */ formData
        , /** @type {Request} */ request
        , /** @type {string}  */ urlParametersString;

      method = method === undefined ? 'GET' : method;

      headers = AdminLib.coalesce(headers, {});

      if (method === 'GET')
         urlParameters = data;
      else {

         if (data instanceof FormData || data instanceof Blob)
            formData = data;
         else
            formData = JSON.stringify(data);
      }

      // Converting URL parameters to URL parameters string
      if (urlParameters)
         urlParametersString = getURLParameters(urlParameters);

      request = new Request ( '/api/' + path + (urlParametersString ? '?' + urlParametersString : '')
                            , { method : method
                              , body   : formData });

      // Adding headers
      AdminLib.list.forEachKey(headers, function(value, key) {
         request.headers.append(key, value);
      });

      // Adding default values for header
      if (headers['Accept'] === undefined)
         request.headers.append('Accept', 'application/json');

      if (headers['Cache-Control'] === undefined)
         request.headers.append('Cache-Control', 'no-cache');

      if (headers['Connection'] === undefined)
         request.headers.append('Connection', 'keep-alive');

      if (headers['DNT'] === undefined)
         request.headers.append('DNT', '1');

      if (headers['Pragma'] === undefined)
      request.headers.append('Pragma', 'no-cache');

      if (formData) {
         if (headers['Content-Type'] === undefined)
            request.headers.set('Content-Type', 'application/json');
      }

      if (getSessionID() !== undefined)
         request.headers.append('Session-Id',  getSessionID());


      if (connection) {
         if (typeof(connection) === 'boolean')
            connection = new Connection();

         fetchPromise = connection.addRequest(request);
      }
      else {
         fetchPromise = fetchRequest(request);
      }

      return fetchPromise;
   }

   /**
    *
    * @param {DataSource} dataSource
    * @returns {Promise}
    */
   function loadData(dataSource) {

      // If the source is a promise, then we will handle the response of the source
      if (dataSource instanceof Promise)
         return dataSource.then(loadData);

      // If the source is a string, then we use it as a URL and fetch data from it
      if (typeof(dataSource) === 'string')
         return loadAjax(dataSource);

      if (typeof(dataSource) === 'function')
         return loadData(dataSource());

      return Promise.resolve(dataSource);
   }

   /**
    * Load the session ID from the local storage
    */
   function loadSessionID() {
      _sessionId = localStorage.getItem('session-id');
   }

   /**
    * @name AdminLib.loadScripts
    * @param {string|string[]} script
    * @param {boolean} [fullpath=false]
    * @returns {Promise}
    */
   function loadScripts(script, fullpath) {

      var /** @type {function}          */ fullfilFunction
        , /** @type {string}            */ path
        , /** @type {Promise}           */ promise
        , /** @type {Promise[]}         */ promises
        , /** @type {number}            */ s
        , /** @type {HTMLScriptElement} */ scriptDOM;

      if (script === undefined)
         return Promise.resolve();

      // If several scripts has been provided, we load all of them
      if (script instanceof Array) {

         promises = [];

         for(s in script) {
            promises.push(loadScripts(script[s], fullpath));
         }

         return Promise.all(promises);
      }

      path = fullpath ? script : AdminLib.SCRIPT_ROOT + '/' + script;

      if (_loadedScripts[path] !== undefined)
         return _loadedScripts[path];

      scriptDOM = document.createElement('script');

      scriptDOM.onload  = function() {
         fullfilFunction();

         // In debug mode, we disable the cache
         if (AdminLib.debug)
            _loadedScripts[path] = undefined;

      };

      scriptDOM.type = 'text/javascript';
      scriptDOM.async = false;
      scriptDOM.src  = path;

      document.querySelector('head').appendChild(scriptDOM);

      promise = new Promise(function(fullfill) {
         fullfilFunction = fullfill;
      });

      _loadedScripts[path] = promise;

      return promise;
   }

   /**
    *
    * @param {string|string[]} file
    * @param {boolean} [fullpath=false]
    * @returns {Promise}
    */
   function loadStylesheet(file, fullpath) {

      var /** @type {function}          */ fullfilFunction
        , /** @type {string}            */ id
        , /** @type {string}            */ path
        , /** @type {Promise}           */ promise
        , /** @type {Promise[]}         */ promises
        , /** @type {HTMLScriptElement} */ linkDOM
        , /** @type {number}            */ s;

      if (file === undefined)
         return Promise.resolve();

      // If several filenames have been provided, wil load all of them.
      if (file instanceof Array) {

         promises = [];

         for(s in file) {
            promises.push(loadStylesheet(file[s], fullpath));
         }

         return Promise.all(promises);
      }

      if (file instanceof Object) {
         path = file.path;
         id   = file.id;
      }

      path = fullpath ? file : AdminLib.STYLESHEET_ROOT + '/' + file;

      if (_loadedStylesheets[path] !== undefined)
         return _loadedStylesheets[path];

      linkDOM = document.createElement('link');

      linkDOM.onload  = function() {
         fullfilFunction();
      };

      linkDOM.setAttribute('type', 'text/css');
      linkDOM.setAttribute('rel' , 'stylesheet');
      linkDOM.setAttribute('href', path);

      if (id !== undefined)
         linkDOM.setAttribute('id', id);

      document.querySelector('head').appendChild(linkDOM);

      promise = new Promise(function(fullfill) {
         fullfilFunction = fullfill;
      });

      _loadedStylesheets[path] = promise;

      return promise;
   }

   /**
    *
    * @param {string|string[]} name
    * @param {Repository} repository
    * @returns {Promise.<string>|Promise.<string[]>}
    */
   function loadTemplate(name, repository) {

      var /** @type {Promise} */ promise
        , /** @type {Promise[]} */ promises
        , /** @type {string} */ repositoryName
        , /** @type {number} */ t;

      if (name === undefined)
         return Promise.resolve();

      if (typeof(repository) === 'string') {
         repositoryName = repository;
         repository = Repository.get(repository);

         if (repository === undefined)
            throw 'Repository "' + repositoryName + '" don\'t exists';
      }


      if (name instanceof Array) {
         promises = [];

         for(t in name) {
            promises.push(loadTemplate(name[t], repository));
         }

         return Promise.all(promises);
      }

      if (_loadedTemplates[name]) {
         if (_loadedTemplates[name].repository !== repository)
            throw 'Template name "' + name + '" already exists in the repository "' + repository.name + '".';

         return _loadedTemplates[name].promise;
      }


      promise = fetch(repository.getTemplatePath(name + '.mustache')).then(function(response) {

         if (response.status !== 200)
            throw response;

         return response.text();
      }).then(function(text) {
         templates[name] = text;
         return text;
      });

      _loadedTemplates[name] = { promise    : promise
                               , repository : repository };

      return promise;
   }

   /**
    * Resolve the given URL and return a function to handle it
    * @param {string} [url]
    * @returns {function(url:string)}
    */
   function resolveURL(url) {

      var /** @type {number} */ m;

      url = AdminLib.coalesce(url, window.location.pathname.substring(1));

      if (url === '')
         return defaultUrlHandler;

      for(m in models) {
         if (models[m].urlRegExp.match(url))
            return models.urlHandler;
      }

   }

   /**
    * @name AdminLib.sendMultipart
    * @param {string}   path
    * @param {string[]} urlParameters
    * @param {FormData|AdminLib.widget.Form} formData
    * @param {string}   [method='POST']
    * @returns {Promise.<Object>}
    */
   function sendMultipart(path, urlParameters, formData, method) {

      var /** @type {function}       */ fulfillFunction
        , /** @type {Promise}        */ promise
        , /** @type {function}       */ rejectFunction
        , /** @type {XMLHttpRequest} */ xhr;

      method = AdminLib.coalesce(method, 'POST');

      if (formData instanceof AdminLib.widget.Form)
         formData = formData.getFormData();

      xhr = new XMLHttpRequest();

      promise = new Promise(function(fulfill, reject) {
         fulfillFunction = fulfill;
         rejectFunction  = reject;
      });

      if (urlParameters) {
         urlParameters = getURLParameters(urlParameters);

         if (urlParameters)
            path += '?' + urlParameters;
      }


      xhr.open(method, 'api/' + path, true);

      if (getSessionID() !== undefined)
         xhr.setRequestHeader('Session-Id', getSessionID());

      xhr.onload = function() {

         // If the request is successful, we return the response
         if (xhr.status == 200)
            fulfillFunction(JSON.parse(xhr.responseText));
         else
            rejectFunction(xhr.statusText);

      };

      xhr.onerror = function() {
         rejectFunction();
      };

      xhr.send(formData);

      return promise;
   }

   function sendFile(path, file) {

      var /** @type {FormData}       */ formData
        , /** @type {function} */ fulfillFunction
        , /** @type {Promise}        */ promise
        , /** @type {function} */ rejectFunction
        , /** @type {XMLHttpRequest} */ xhr;

      formData = new FormData();
      formData.append('file', file, file.name);

      promise = new Promise(function(fulfill, reject) {
         fulfillFunction = fulfill;
         rejectFunction  = reject;
      });

      xhr = new XMLHttpRequest();

      xhr.open('POST', 'api/' + path, true);

      xhr.onload = function() {

         // If the request is successful, we return the response
         if (xhr.status == 200)
            fulfillFunction(xhr.response);
         else
            rejectFunction(xhr.statusText);

      };

      xhr.onerror = function() {
         rejectFunction();
      };

      xhr.send(formData);

      return promise;

   }

   /**
    * Start the application.
    * The application will first load the current session from the server.
    *
    */
   function start() {

      history.onpopstate = HistoryHandler.onpopstate;

      loadSessionID();

      startPromise =
         Package.load('AdminLib').then(() => console.log('Packages loaded'))
            .then(function() {
               return Metronic.init(); // init metronic core components
               //QuickSidebar.init(); // init quick sidebar
               //Demo.init(); // init demo features
            })
            .then(startPromiseFulfill);
   }

   function sortByID(a, b) {
      return a.id < b.id ? -1 : (a.id > b.id ? 1 : 0);
   }

   function sortByLabel(a, b) {
      return a.label < b.label ? -1 : (a.label > b.label ? 1 : 0);
   }

   /**
    *
    * Transform a object to a promise.
    * If the provided object is a function, then the function will be executed and the toPromise
    * will be applied to this result.
    * If the provided object is a promise, then toPromise will return the resolved value.
    * If the resolved value is a function, then it will act like previously describe.
    *
    * Example :
    *
    *    object = 'a';
    *    toPromise(object); // Return Promise.<'a'>
    *
    *    object = Promise.resolve('b')
    *    toPromise(object); // Return Promise.<'b'>
    *
    *    object = function() { return 'c'};
    *    toPromise(object); // Return Promise.<'c'>
    *
    *    object = function() { return Promise.resolve('d') };
    *    toPromise(object); // Return Promise.<'d'>
    *
    *    object = function() { return function() { return Promise.resolve('e') }};
    *    toPromise(object); // Return Promise.<'e'>
    *
    * @param {function:*|Promise.<*>|*} object
    * @returns {Promise.<*>}
    * @public
    */
   function toPromise(object) {

      if (typeof(object) === 'function')
         object = toPromise(object());

      if (!(object instanceof Promise))
         object = Promise.resolve(object);

      object.then(function(object) {

         if (typeof(object) === 'function')
            return toPromise(object);

         return object;
      });

      return object;
   }

   var bootstrap                                 = (function() {

      function cm1() {
         return AdminLib.dom.div('col-md-1', arguments);
      }

      function cm2() {
         return AdminLib.dom.div('col-md-2', arguments);
      }

      function cm3() {
         return AdminLib.dom.div('col-md-3', arguments);
      }

      function cm4() {
         return AdminLib.dom.div('col-md-4', arguments);
      }

      function cm5() {
         return AdminLib.dom.div('col-md-5', arguments);
      }

      function cm6() {
         return AdminLib.dom.div('col-md-6', arguments);
      }

      function cm7() {
         return AdminLib.dom.div('col-md-7', arguments);
      }

      function cm8() {
         return AdminLib.dom.div('col-md-8', arguments);
      }

      function cm9() {
         return AdminLib.dom.div('col-md-9', arguments);
      }

      function cm10() {
         return AdminLib.dom.div('col-md-10', arguments);
      }

      function cm11() {
         return AdminLib.dom.div('col-md-11', arguments);
      }

      function cm12() {
         return AdminLib.dom.div('col-md-12', arguments);
      }

      function row(dom) {
         return AdminLib.dom.div('row', dom);
      }

      return { cm1  : cm1
             , cm2  : cm2
             , cm3  : cm3
             , cm4  : cm4
             , cm5  : cm5
             , cm6  : cm6
             , cm7  : cm7
             , cm8  : cm8
             , cm9  : cm9
             , cm10 : cm10
             , cm11 : cm11
             , cm12 : cm12
             , row  : row}

   })();

   var dom                                       = (function() {

      /**
       * Build a DOM from the given template.
       * @param template
       * @param [data]
       * @param {string} [parentTag="div"]
       * @returns {HTMLElement}
       * @public
       */
      function build(template, data, parentTag) {

         var /** @type {HTMLElement} */ dom;

         AdminLib.coalesce(parentTag, 'div');

         if (template instanceof Array) {
            data = template[1];
            template = template[0];
         }

         dom = document.createElement(parentTag);

         dom.innerHTML = Mustache.render(template, data);

         dom = dom.firstElementChild;
         dom.parentElement.removeChild(dom);

         return dom;
      }

      /**
       *
       * @param {string}                       element
       * @param {string|string[]}              [classes]
       * @param {HTMLElement[]|AdminLib.widget} dom
       * @returns {Element|*}
       */
      function createElement(element, classes, dom) {
         var /** @type {HTMLElement} */ node;

         node = document.createElement(element);

         if (typeof(classes) === 'string')
            classes = classes.split(' ');

         if (classes !== undefined)
            classes.map(function(className) {
               node.classList.add(className);
            });

         if (dom === undefined)
            return node;
         else if (dom instanceof HTMLElement) {
            node.appendChild(dom);
         }
         else if (typeof(dom.getDOM) === 'function') {
            node.appendChild(dom.getDOM());
         }
         else if (dom !== undefined)
           AdminLib.list.forEach(dom, function(dom) {

               if (typeof(dom.getDOM) === 'function')
                  node.appendChild(dom.getDOM());
               else
                  node.appendChild(dom);

            });

         return node;
      }

      /**
       *
       * @param {string|string[]}                                               [classes]
       * @param {Array.<HTMLElement|AdminLib.widget>|AdminLib.widget|HTMLElement} [dom]
       * @returns {HTMLElement}
       */
      function div(classes, dom) {
         return createElement('div', classes, dom);
      }

      /**
       *
       * @param {HTMLElement} dom
       * @public
       */
      function empty(dom) {
         dom.innerHTML = '';
      }

      /**
       * @param {HTMLElement} dom
       * @param {string}      classes
       * @return {Node}
       */
      function wrap(dom, classes) {

         var template
           , templateData
           , wrappedDOM;

         template     = '<div class="{{classes}}"></div>';
         templateData = { classes : classes };

         wrappedDOM = AdminLib.dom.build(template, templateData);
         wrappedDOM.appendChild(dom);
         return wrappedDOM;
      }

      var ClassList                              = (function() {

         /**
          * @name ClassList
          * @param {Classes|function():Classes} parameters
          * @constructor
          * @property {string[]} classes
          * @property {function():Classes} classFunction
          */
         function ClassList(parameters) {
            if (typeof(parameters) === 'string')
               this.classes = parameters.split(' ');

            else if (typeof(parameters) === 'function')
               this.classFunction = parameters;

            else if (parameters === undefined)
               this.classes = [];

            else // Should be array
               this.classes = parameters.slice(0);
         }

         /**
          *
          * @param {HTMLElement} dom
          * @param {...}
          * @public
          */
         ClassList.prototype.applyTo             = function(dom) {

            var /** @type {string}   */ className
              , /** @type {string[]} */ classes
              , /** @type {Array}    */ getClassesParameters;

            getClassesParameters = Array.prototype.slice.apply(Array.prototype.shift.apply(arguments), [0]);

            classes = this.getClasses.apply(this, getClassesParameters);

            for(className of classes) {
               dom.classList.add(className);
            }

         };

         /**
          *
          * @returns {string[]}
          * @param {...}
          * @public
          */
         ClassList.prototype.getClasses          = function() {

            var /** @type {Classes} */ classList;

            if (this.classFunction) {
               classList = this.classFunction.apply(undefined, arguments);

               if (typeof(classList) === 'string')
                  return classList.split(' ');
               else if (classList === 'undefined')
                  return [];

               return classList.slice(0);
            }

            return this.classes.slice(0);
         };

         ClassList.prototype.forEach             = function() {
            return Array.prototype.forEach.apply(this.getClasses, arguments);
         };

         /**
          * @param {HTMLElement} dom
          * @param {...}
          * @public
          */
         ClassList.prototype.removeFrom          = function(dom) {

            var /** @type {string}   */ className
              , /** @type {string[]} */ classes
              , /** @type {Array}    */ getClassesParameters;

            getClassesParameters = Array.prototype.slice.apply(Array.prototype.shift.apply(arguments), [0]);

            classes = this.getClasses.apply(this, getClassesParameters)

            for(className of classes) {
               dom.classList.remove(className);
            }
         };

         ClassList.prototype.toString            = function() {

            var /** @type {string[]} */ classes
              , /** @type {string}   */ classesString;

            classes = this.getClasses.apply(this, arguments);

            classesString = '';

           AdminLib.list.forEach(classes, function(className) {
               classesString += ' ' + className;
            });

            return classesString;
         };

         return ClassList;

      })();

      return { build         : build
             , createElement : createElement
             , div           : div
             , empty         : empty
             , wrap          : wrap

               // Classes
             , ClassList     : ClassList
      };

   })();

   var list                                      = (function() {

      /**
       *
       * @param {string}   attribute
       * @param {Object[]} objects
       * @param {*}        [defaultValue]
       * @param {boolean}  [addUndefined=true]
       *
       * @returns {Array}
       * @public
       */
      function attribute(attribute, objects, defaultValue, addUndefined) {
         var /** @type {number} */ i
           , /** @type {Array}  */ list;

         list = [];

         addUndefined = AdminLib.coalesce(addUndefined, true);

         for(i in objects) {

            if (objects[i] === undefined) {

               if (addUndefined)
                  list.push(defaultValue)

            }
            else if (objects[i][attribute] === undefined) {

               if (addUndefined)
                  list.push(defaultValue);

            }
            else
               list.push(objects[i][attribute]);

         }

         return list;
      };

      /**
       * Convert an object to an array.
       *
       * If undefined, then return an empty array
       * If array, then return a copy of the array.
       * If a string, then will split the string (using the space " " as separator).
       *
       * @param {*} element
       * @returns {*}
       */
      function convert(element) {

         if (element === undefined)
            return [];

         if (element instanceof Array)
            return element.slice(0);

         if (typeof(element) === 'string')
            return element.split(' ');

         return [element];
      }

      /**
       * @name AdminLib.list.filter
       * @param list
       * @param fct
       * @returns {Array.<T>}
       */
      function filter(list, fct) {
         return Array.prototype.filter.call(list, fct);
      }

      /**
       * Exclude all undefined values
       * @name AdminLib.list.filterUndefined
       * @param {ArrayLike} list
       * @returns {Array}
       */
      function filterUndefined(list) {
         return AdminLib.list.filter (list, function(l) {
            return l !== undefined;
         });
      }

      function forEach(list, fct) {
         return Array.prototype.map.call(list, fct);
      }

      function forEachKey(object, fct) {
         return Array.prototype.map.call(Object.keys(object), function(key) {
            fct(object[key], key, object);
         });
      }

      /**
       * @name AdminLib.list.map
       * @param list
       * @param fct
       * @returns {Array}
       */
      function map(list, fct) {
         return Array.prototype.map.call(list, fct);
      }

      /**
       * Extract the attribute of each objects of the list.
       *
       * @param attribute
       * @param list
       * @param {boolean} [excludeUndefined=true] IF true, then items that are undefined will be excluded.
       * @returns {Array}
       */
      function mapAttribute(attribute, list, excludeUndefined) {

         excludeUndefined = AdminLib.coalesce(excludeUndefined, true);

         if (excludeUndefined)
            return AdminLib.list.filterUndefined(list).map(function(item) {
               return item[attribute];
            });

         return list.map(function(item) {

            if (item === undefined)
               return undefined;

            return item[attribute];

         });
      }

      return { attribute       : attribute
             , convert         : convert
             , filter          : filter
             , filterUndefined : filterUndefined
             , forEach         : forEach
             , forEachKey      : forEachKey
             , map             : map
             , mapAttribute    : mapAttribute};

   })();

   var notify                                    = (function() {

      /**
       * @name AdminLib.notify.clear
       */
      function clear() {
         toastr.clear();
      }

      /**
       * @name AdminLib.notify.error
       * @param {Object|string} parameters
       * @returns {*}
       */
      function error(parameters) {

         if (typeof(parameters) === 'string')
            parameters = { message : parameters };

         return notify ( { type    : notify.TYPE.ERROR
                         , title   : parameters.title
                         , message : parameters.message
                         , onclick : parameters.onclick});

      }

      /**
       * @name AdminLib.notify.info
       * @param {Object|string} parameters
       * @returns {*}
       */
      function info(parameters) {

         if (typeof(parameters) === 'string')
            parameters = { message : parameters };

         return notify ( { type    : notify.TYPE.INFO
                         , title   : parameters.title
                         , message : parameters.message
                         , onclick : parameters.onclick});

      }

      /**
       * @name AdminLib.notify
       *
       * @param {Object|string} parameters
       */
      function notify(parameters) {

         if (typeof(parameters) === 'string')
            parameters = { message : parameters
                         , type    : 'info'};

         toastr.options = { closeButton    : true
                          , debug          : false
                          , positionClass  : 'toast-top-right'
                          , onclick        : parameters.onclick
                          , showDuration   : '1000'
                          , hideDuration   : '1000'
                          , timeOut        : '5000'
                          , extendedTimeOut: '1000'
                          , showEasing     : 'swing'
                          , hideEasing     : 'linear'
                          , showMethod     : 'fadeIn'
                          , hideMethod     : 'fadeOut'};

         toastr[parameters.type] ( AdminLib.coalesce(parameters.message, '')
                                 , AdminLib.coalesce(parameters.title, ''));
      }

      /**
       * @name AdminLib.notify.success
       * @param {Object} parameters
       * @returns {*}
       */
      function success(parameters) {

         if (typeof(parameters) === 'string')
            parameters = { message : parameters };

         return notify ( { type    : notify.TYPE.SUCCESS
                         , title   : parameters.title
                         , message : parameters.message
                         , onclick : parameters.onclick});

      }

      /**
       * @name AdminLib.notify.warning
       * @param {Object} parameters
       * @returns {*}
       */
      function warning(parameters) {

         if (typeof(parameters) === 'string')
            parameters = { message : parameters };

         return notify ( { type    : notify.TYPE.WARNING
                         , title   : parameters.title
                         , message : parameters.message
                         , onclick : parameters.onclick});

      }

      notify.clear   = clear;
      notify.error   = error;
      notify.info    = info;
      notify.success = success;
      notify.warning = warning;

      notify.TYPE    = { ERROR   : 'error'
                       , INFO    : 'info'
                       , SUCCESS : 'success'
                       , WARNING : 'warning' };

      return notify;
   })();

   var EventTarget                               = (function() {

      /**
       * @name AdminLib.EventTarget
       * @class
       * @constructor
       * @property {Object.<function>} EventTarget__eventTypes;
       */
      function EventTarget() {
         this.EventTarget__properties = { current : {}
                                        , types   : {}};
      }

      /**
       *
       * @param {string} type
       * @param {function(AdminLib.Event)} listener
       * @public
       */
      EventTarget.prototype.addEventListener     = function addEventListener(type, listener) {

         if (type === undefined)
            throw 'The type is undefined';

         if (this.EventTarget__properties.types[type] === undefined)
            this.EventTarget__properties.types[type] = [];

         this.EventTarget__properties.types[type].push(listener);
      };

      /**
       *
       * @param {string} type
       * @param {function(AdminLib.Event)} listener
       * @public
       */
      EventTarget.prototype.removeEventListener  = function removeEventListener(type, listener) {

         var /** @type {number} */ index;

         if (this.EventTarget__properties.types[type] === undefined)
            return;

         index = this.EventTarget__properties.types[type].indexOf(listener);

         if (index === -1)
            return;

         this.EventTarget__properties.types[type].slice(index, 1);
      };

      /**
       *
       * @param {AdminLib.Event} event
       * @protected
       */
      EventTarget.prototype.dispatchEvent        = function dispatchEvent(event) {

         var /** @type {AdminLib.Event[]}                 */ currentEvents
           , /** @type {number}                          */ indexOf
           , /** @type {number}                          */ l
           , /** @type {Array.<function(AdminLib.Event)>} */ listeners;

         listeners = this.EventTarget__properties.types[event.type];

         if (listeners === undefined)
            return;

         // Adding the event to the list of event
         if (this.EventTarget__properties.current[event.type] === undefined)
            this.EventTarget__properties.current[event.type] = [];

         currentEvents = this.EventTarget__properties.current[event.type];

         // Checking that the event is not already fired
         if (currentEvents.indexOf(event) !== -1)
            throw 'Event already fired';

         currentEvents.push(event);

         for(l in listeners) {

            listeners[l](event);

            if (event.propagationStopped)
               return;
         }

         // Removing the event from the list of events
         indexOf = currentEvents.indexOf(event);
         currentEvents.splice(indexOf, 1);
      };

      /**
       * Indicate if the event is running.
       *
       * If an AdminLib.Event object is provided, then it will check if this particular event is running.
       * If a string is provided, then it will indicate if at least one event of this type is running.
       *
       * @param {AdminLib.Event|string} event
       * @returns {boolean}
       * @protected
       */
      EventTarget.prototype.isEventRunning       = function isEventRunning(event) {

         if (event instanceof AdminLib.Event) {

            if (this.EventTarget__properties.current[event.type] === undefined)
               return false;

            return this.EventTarget__properties.current[event.type].indexOf(event) >= 0;
         }

         if (this.EventTarget__properties.current[event] === undefined)
            return false;

         return this.EventTarget__properties.current[event].length > 0;
      };

      return EventTarget;
   })();

   var Event                                     = (function() {

      /**
       * @typedef {Object} CustomEventInit
       * @property {boolean}      bubbles
       * @property {boolean}      cancelable
       * @property {*}            detail
       * @property {EventTarget}  target
       */

      /**
       * @name AdminLib.Event
       * @class
       * @param {string} typeArg
       * @param {AdminLib.Event.Parameters} parameters
       * @constructor
       */
      function Event(typeArg, parameters) {

         this.type = typeArg;


         parameters = parameters ? parameters : { bubbles   : false
                                                , cancelable: false};

         this.bubbles            = parameters.bubbles;
         this.cancelable         = parameters.cancelable;
         this.detail             = parameters.detail;
         this.target             = parameters.target;
         this.defaultPrevented   = false;
         this.timestamp          = Date.now();
         this.isTrusted          = false;
         this.propagationStopped = false;
      }

      Event.prototype.preventDefault                = function preventDefault() {
         if (this.cancelable)
            this.defaultPrevented = true;
      };

      Event.prototype.stopImmediatePropagation      = function stopImmediatePropagation() {
         this.propagationStopped = true;
      };

      Event.prototype.stopPropagation               = function stopPropagation() {
         this.propagationStopped = true;
      };

      return Event;
   })();

   var HistoryHandler                            = (function() {

      /**
       *
       * @param {HistoryState} historyState
       */
      function pushState(historyState) {
         return;

         /*
         history.pushState ( historyState.state
                           , historyState.title
                           , historyState.url); */
      }

      /**
       *
       * @param {HistoryState} historyState
       */
      function replaceState(historyState) {
         return;
         /*
         history.replaceState ( historyState.state
                              , historyState.title
                              , historyState.url);*/
      }

      function onpopstate(event) {

         var /** @type {string} */ handlerType
           , /** @type {Model}  */ model;

         handlerType = event.state.type;

         if (handlerType === undefined)
            return;

         if (handlerType === 'model') {
            model = event.state.parameters.model;
            model.display.apply(undefined, event.state.parameters.parameters);
         }

         event.state.handler.apply(undefined, event.state.parameters);
      }

      return { onpopstate   : onpopstate
             , pushState    : pushState
             , replaceState : replaceState}

   })();

   var HistoryState                              = (function() {

      /**
       *
       * @param {Object} state
       * @param {string} title
       * @param {string} url
       * @constructor
       * @class HistoryState
       * @property {Object} state
       * @property {string} title
       * @property {string} url
       */
      function HistoryState(state, title, url) {
         this.state = state;
         this.title = title;
         this.url   = url;
      }

      return HistoryState;
   })();

   var Loader                                    = (function() {

      /**
       * @name AdminLib.Loader.display
       * @param {HTMLElement} dom
       * @param {boolean}     [displayContent=false]
       * @public
       */
      function display(dom, displayContent) {

         var /** @type {string} */ template;

         // Template from : http://tobiasahlin.com/spinkit/
         template =
               '<div class="adminLibLoader-fading-circle">'
            +     '<div class="adminLibLoader-circle1 adminLibLoader-circle"></div>'
            +     '<div class="adminLibLoader-circle2 adminLibLoader-circle"></div>'
            +     '<div class="adminLibLoader-circle3 adminLibLoader-circle"></div>'
            +     '<div class="adminLibLoader-circle4 adminLibLoader-circle"></div>'
            +     '<div class="adminLibLoader-circle5 adminLibLoader-circle"></div>'
            +     '<div class="adminLibLoader-circle6 adminLibLoader-circle"></div>'
            +     '<div class="adminLibLoader-circle7 adminLibLoader-circle"></div>'
            +     '<div class="adminLibLoader-circle8 adminLibLoader-circle"></div>'
            +     '<div class="adminLibLoader-circle9 adminLibLoader-circle"></div>'
            +     '<div class="adminLibLoader-circle10 adminLibLoader-circle"></div>'
            +     '<div class="adminLibLoader-circle11 adminLibLoader-circle"></div>'
            +     '<div class="adminLibLoader-circle12 adminLibLoader-circle"></div>'
            +  '</div>';

         displayContent = AdminLib.coalesce(displayContent, false);

         // Removing previous loader (if displayed)
         remove(dom);

         dom.classList.add('loading');

         if (displayContent)
            dom.classList.add('loadingWithContent');

         dom.appendChild(AdminLib.dom.build(template));
      };

      /**
       * @name AdminLib.Loader.isDisplayed
       * @param {HTMLElement} dom
       * @returns {boolean}
       * @public
       */
      function isDisplayed(dom) {
         return dom.classList.contains('loading');
      };

      /**
       * @name AdminLib.Loader.isDisplayed
       * @param {HTMLElement} dom
       * @public
       */
      function remove(dom) {

         var /** @type {HTMLElement} */ loaderDOM;

         dom.classList.remove('loading');

         loaderDOM = dom.querySelector(':scope > .adminLibLoader-fading-circle');

         if (loaderDOM === null)
            return;

         dom.removeChild(loaderDOM);
      };

      /**
       *
       * @param {HTMLElement} dom
       * @param {boolean}     [displayLoader]
       * @public
       */
      function toggle(dom, displayLoader) {

         if (displayLoader === undefined)
            displayLoader = !isDisplayed(dom);

         if (displayLoader)
            display(dom);
         else
            remove(dom);

      };

      return { display     : display
             , isDisplayed : isDisplayed
             , remove      : remove
             , toggle      : toggle};

   })();

   var Package                                   = (function() {

      /**
       * @name AdminLib.Package
       * @extend AdminLib.EventTarget
       * @constructor
       * @class
       *
       * @param {Repository} repository
       * @param {string}     name
       * @param {AdminLib.Package.Parameters} parameters
       *
       * @property {Repository}         repository
       * @property {string[]}           packages
       * @property {Promise}            promise
       * @property {string[]}           stylesheets
       * @property {string[]}           scripts
       * @property {string[]}           templates
       * @property {function|undefined} then;
       */
      function Package(repository, name, parameters) {

         var /** @type {number} */ i;

         this.repository  = repository;
         this.name        = name;
         this.packages    = AdminLib.coalesce(parameters.packages   , []).slice(0);
         this.stylesheets = AdminLib.coalesce(parameters.stylesheets, []).slice(0);
         this.scripts     = AdminLib.coalesce(parameters.scripts    , []).slice(0);
         this.templates   = AdminLib.coalesce(parameters.templates  , []).slice(0);
         this.then        = parameters.then;

         for(i in this.stylesheets) {
            this.stylesheets[i] = repository.getStylesheetPath(this.stylesheets[i]);
         }

         for(i in this.scripts) {
            this.scripts[i]     = repository.getScriptPath(this.scripts[i]);
         }

      }

      Package.prototype                          = Object.create(EventTarget.prototype);
      Package.prototype.constructor              = this;

      /**
       * Load the package
       * @returns {Promise}
       * @public
       */
      Package.prototype.load                     = function load() {

         var /** @type {number}    */ i
           , /** @type {Promise[]} */ promises;

         if (this.promise != undefined)
            return this.promise;

         promises = [];

         // Loading all pre-required modules
         for(i in this.packages) {
            promises.push(Package.load(this.packages[i]));
         }

         // Loading templates
         promises.push(loadTemplate(this.templates, this.repository));

         // Loading stylesheets
         promises.push(loadStylesheet(this.stylesheets, true));

         // Loading the scripts after all pre-required modules are loaded
         this.promise = Promise.all(promises).then(function() {

            var /** @type {Promise}   */ promise
              , /** @type {Promise[]} */ promises
              , /** @type {string}    */ script;

            promise = Promise.resolve();

            // Loading scripts
            // Scripts are loaded sequentially
            for(script of this.scripts) {
               promise = promise.then(loadScripts.bind(undefined, script, true));
            }

            return promise;
         }.bind(this));

         if (this.then !== undefined)
            this.promise = this.promise.then(this.then);

         return this.promise;
      };

      Package.prototype.toString                 = function toString() {
         return '<Package: {' + this.repository.name + '} ' + this.name + '>';
      };

      /**
       *
       * @param {string|Object} name
       * @returns {Promise}
       */
      Package.load                               = function load(name) {

         var /** @type {Package} */ packageObject;

         if (name === undefined)
            return Promise.resolve();

         packageObject = Repository.getPackage(name);

         if (packageObject === undefined)
            throw new AdminLib.Error('Package "' + name + '" don\'t exists');

         return packageObject.load();
      };

      return Package;

   })();

   var Repository                                = (function() {

      var /** @type {Object.<Repository>} */ repositories;

      /**
       * @name RepositoryParameters
       * @typedef {Object}
       * @property {string} templateFolder
       * @property {string} scriptFolder
       * @property {string} stylesheetFolder
       *
       */

      repositories = {};

      /**
       *
       * @param {string}               name
       * @param {RepositoryParameters} [parameters]
       * @constructor
       * @property {string|undefined} templateFolder
       * @property {string|undefined} scriptFolder
       * @property {string|undefined} stylesheetFolder
       */
      function Repository(name, parameters) {

         parameters = AdminLib.coalesce(parameters, {});

         if (repositories[name] !== undefined)
            throw 'A repository named "' + name + '" already exists';

         repositories[name] = this;

         this.name    = name;
         this.modules = {};
         this.templateFolder   = parameters.templateFolder;
         this.scriptFolder     = parameters.scriptFolder;
         this.stylesheetFolder = parameters.stylesheetFolder;
      }

      Repository.prototype.addPackage = function(name, module) {
         this.modules[name] = new Package(this, name, module);
      };

      Repository.prototype.getPackage = function(name) {
         return this.modules[name];
      };

      Repository.prototype.getScriptPath = function(filename) {

         if (this.scriptFolder === undefined)
            return filename;

         return this.scriptFolder + '/' + filename;
      };

      Repository.prototype.getTemplatePath = function getTemplatePath(filename) {

         if (this.templateFolder === undefined)
            return filename;

         return this.templateFolder + '/' + filename;
      };

      Repository.prototype.getStylesheetPath     = function getStylesheetFolder(filename) {

         if (this.stylesheetFolder === undefined)
            return filename;
          
         return this.stylesheetFolder + '/' + filename;
      };

      Repository.prototype.save                  = function save() {};

      /**
       *
       * @param {string} name
       * @returns {Package}
       * @public
       */
      Repository.getPackage                       = function getPackage(name) {

         var /** @type {Package} */ moduleObject
           , /** @type {string} */ r;

         for(r in repositories) {

            moduleObject = repositories[r].getPackage(name);

            if (moduleObject !== undefined)
               return moduleObject;

         }

         return undefined;
      };

      /**
       *
       * @param {string} name
       * @returns {Repository}
       */
      Repository.get                             = function get(name) {
         return repositories[name];
      };

      return Repository;

   })();

   var SelectOptionList                          = (function() {

      /**
       *
       * @param {SelectOptionsLike}   options
       * @param {function(*, *):bool} [equal]
       * @constructor
       * @property {function(*, *):boolean} equal
       */
      function SelectOptionList(options, equal) {
         this.options       = convert(options, this);
         this.equalFunction = AdminLib.coalesce(equal, function(a, b) { return a === b});

         Object.defineProperty(this, 'length', { get: function() { return this.options.length}.bind(this) });
         Object.defineProperty(this, 'list'  , { get: function() { return this.options.slice(0); }.bind(this)});

         if (this.options instanceof Promise)
            this.options = this.options.then(function(options) {
               this.options = options;
            }.bind(this));

      }

      SelectOptionList.prototype[Symbol.iterator]= function() {

         var /** @type {number} */ index;

         index = 0;

         return { next :
                     function() {

                        if (index === this.options.length)
                           return {done: true};

                        return {value: this.options[index++], done: false};

                     }.bind(this) }

      };

      /**
       *
       * @param {*} v1
       * @param {*} v2
       * @returns {boolean}
       */
      SelectOptionList.prototype.equal           = function equal(v1, v2) {
         return this.equalFunction(v1, v2);
      }

      /**
       *
       * @returns {Array.<T>}
       */
      SelectOptionList.prototype.filter          = function filter() {

         var /** @type {SelectOptionList} */ list;
         list =  this.options.filter.apply(this.options, arguments);

         return new SelectOptionList(list, this.equalFunction);
      };

      SelectOptionList.prototype.forEach         = function forEach() {
         this.options.forEach.apply(this.options, arguments);
      };

      /**
       *
       * @param {number} index
       * @returns {*|Promise}
       */
      SelectOptionList.prototype.getValue        = function getValue(index) {
         var /** @type {Option} */ option;

         option = this.options[index];

         if (option)
            return option.value;

         return undefined;
      };

      SelectOptionList.prototype.getLabel        = function getLabel(value) {

         var /** @type {Option} */ option;

         option = this.getOptionFromValue(value);

         if (option === undefined)
            return undefined;

         return option.label;
      };

      /**
       * Return the list of options corresponding to the given values.
       * @param {Array} values
       * @return {Option[]}
       */
      SelectOptionList.prototype.getOptionsFromValues = function getOptionsFromValues(values) {

         var /** @type {Option}   */ option
           , /** @type {Set}      */ options
           , /** @type {*}        */ value;

         options = [];

         for(value of values) {

            for(option of this.options) {
               if (!option.equal(value))
                  continue;

               if (options.indexOf(option) !== -1)
                  continue;

               options.push(option);
            }
         }

         return options;
      };

      /**
       *
       * @param {*} value
       * @return {Option}
       */
      SelectOptionList.prototype.getOptionFromValue = function getOptionFromValue(value) {
         return this.getOptionsFromValue(value)[0];
      };

      /**
       *
       * @param {*} value
       * @returns {Option[]}
       */
      SelectOptionList.prototype.getOptionsFromValue = function getOptionsFromValue(value) {
         return this.options.filter(function(option) {

            if (option === undefined)
               return false;

            return option.equal(value);
         }.bind(this));
      };

      SelectOptionList.prototype.indexOf         = function indexOf() {
         return Array.prototype.indexOf(this.options, arguments);
      };

      SelectOptionList.prototype.isLoaded        = function isLoaded() {
         return !(this.options instanceof Promise);
      };

      SelectOptionList.prototype.isPromise       = function isPromise() {
         return this.options instanceof Promise;
      };

      SelectOptionList.prototype.push            = function push(option) {
         this.options.push(option);
      };

      /**
       *
       * @returns {Array}
       */
      SelectOptionList.prototype.map             = function map() {
         return this.options.map.apply(this.options, arguments);
      };

      /**
       *
       * @returns {Array.<T>}
       */
      SelectOptionList.prototype.slice           = function slice() {
         var /** @type {SelectOptionList} */ newList;
         newList = Array.prototype.slice.apply(this.options, arguments);

         return new SelectOptionList(newList, this.equalFunction);
      };

      SelectOptionList.prototype.splice          = function splice() {
         return Array.prototype.splice.apply(this.options, arguments);
      };

      SelectOptionList.prototype.then            = function then(onFulfilled, onRejected) {

         if (this.options instanceof Promise)
           return this.options.then(onFulfilled, onRejected);

         return Promise.resolve(this.options).then(onFulfilled, onRejected);

      };

      /**
       *
       * @param {SelectOptionsLike} options
       * @param {SelectOptionList}  parent
       * @returns {Array.<Option|undefined>}
       */
      function convert(options, parent) {

         if (options instanceof Promise)
            return options.then(function(options) {
               return convert(options, parent);
            });

         if (options instanceof Array) {

            parent = parent || options;

            return options.map(function(option, index, array) {

               if (option === undefined)
                  return undefined;

               return new Option(option, index, parent);
            });

         }
         else if (options instanceof SelectOptionList)
           return options.options.slice(0);
         else {

            parent = parent || Object.keys(options);

            return Object.keys(options).map(function(key, index) {

               new Option ( { label : value
                            , value : options[key]}
                          , index
                          , parent );

               });

         }

      }

      /**
       *
       * @param {{label:string, value:*}} option
       * @param {number}                  index
       * @param {SelectOptionList|Array}  parent
       * @constructor
       */
      function Option(option, index, parent) {
         this.label   = option.label;
         this.value   = option.value;
         this.index   = index;
         this.parent  = parent;

         // Property : classes
         if (option.classes)
            this.classes = option.classes.slice(0);
         else
            this.classes = [];
      }

      Option.prototype.equal                     = function equal(value) {
         return this.parent.equal(this.value, value);
      };

      Option.prototype.getIndex                  = function getIndex() {
         return this.index;
      };

      Option.coalesceParameters

      SelectOptionList.Option = Option;

      return SelectOptionList

   })();

   AdminLib =  { /** @type {Object}          */ config         : {}
              , /** @type {boolean}         */ debug          : true
              , /** @type {Object}          */ element        : {}
              , /** @type {Object}          */ metronic       : {}
              , /** @type {Object.<string>} */ modules        : {}
              , /** @type {Object}          */ pageComponents : {}
              , notify                   : notify
              , sections                 : {TYPE : { masterDetails : 'master-details' }}
              , sort                     : { id    : sortByID
                                           , label : sortByLabel}
              , templates                : templates
              , widget                   : {}

               // Classes
              , Event                    : Event
              , EventTarget              : EventTarget
              , HistoryHandler           : HistoryHandler
              , Package                  : Package
              , Repository               : Repository
              , SelectOptionList         : SelectOptionList

               // Packages
              , bs                       : bootstrap
              , dom                      : dom
              , list                     : list
              , Loader                   : Loader

               // Functions
              , appendElement            : appendElement
              , clone                    : clone
              , coalesce                 : coalesce
              , coalesceAttribute        : coalesceAttribute
              , coalesceOptionParameters : coalesceOptionParameters
              , displayModule            : displayModule
              , error                    : error
              , fetchRequest             : fetchRequest
              , getCurrentMenu           : getCurrentMenu
              , getDOM                   : getDOM
              , getEmptyFields           : getEmptyFields
              , getNewId                 : getNewId
              , getModuleSource          : getModuleSource
              , getURLParameters         : getURLParameters
              , getTemplate              : getTemplate
              , loadAjax                 : loadAjax
              , loadData                 : loadData
              , loadModule               : Package.load
              , loadScripts              : loadScripts
              , loadStylesheet           : loadStylesheet
              , loadTemplate             : loadTemplate
              , Parameter                : {}
              , pushState                : HistoryHandler.pushState
              , replaceState             : HistoryHandler.replaceState
              , sendFile                 : sendFile
              , sendMultipart            : sendMultipart
              , start                    : start
              , toPromise                : toPromise
              , then                     : startPromise.then.bind(startPromise)

               // Constants
              , SERVER_ROOT              : 'static'


               // Enums

              , CODE_LANGUAGE            : { css        : 'css'
                                           , html       : 'htmlmixed'
                                           , javascript : 'javascript'
                                           , sass       : 'sass'
                                           , sql        : 'sql'}

               /**
                * @enum AdminLib.DATA_TYPE
                */
              , DATA_TYPE                : { DATE      : 'date'
                                           , DATE_TIME : 'dateTime'
                                           , DECIMAL   : 'decimal'
                                           , NUMBER    : 'number'
                                           , TEXT      : 'text'
                                           , YEAR      : 'year'}

              , EVENT_TYPES              : {user_refresh : 'AdminLib.EVENT_TYPES.user_refresh' }

               /**
                * @enum AdminLib.FIELD_TYPE
                */
              , FIELD_TYPES              : { AUTO            : 'auto'
                                           , CHECKBOX        : 'checkbox'
                                           , CODE_EDITOR     : 'codeEditor'
                                           , DATE            : 'date'
                                           , DATE_TIME       : 'dateTime'
                                           , FILE            : 'file'
                                           , NUMBER          : 'number'
                                           , ORDERABLE_LIST  : 'orderableList'
                                           , ORDERABLE_TABLE : 'orderableTable'
                                           , PARAGRAPH       : 'textarea'
                                           , RADIO           : 'radio'
                                           , STATIC          : 'static'
                                           , SELECT          : 'select'
                                           , SELECT_ITEM     : 'selectItem'
                                           , SELECT_MULTIPLE : 'select multiple'
                                           , TEXT            : 'text'}

      };

   AdminLib.LIB_ROOT        = AdminLib.SERVER_ROOT + '';
   AdminLib.SCRIPT_ROOT     = AdminLib.LIB_ROOT    + '/script';
   AdminLib.METRONIC_ROOT   = AdminLib.SERVER_ROOT + '/metronic';
   AdminLib.STYLESHEET_ROOT = AdminLib.LIB_ROOT    + '/stylesheet';
   AdminLib.LIBRAIRY_ROOT   = AdminLib.SCRIPT_ROOT + '/librairies';

   AdminLib.EventTarget.call(AdminLib);
   AdminLib.addEventListener    = EventTarget.prototype.addEventListener.bind(AdminLib);
   AdminLib.removeEventListener = EventTarget.prototype.removeEventListener.bind(AdminLib);
   AdminLib.dispatchEvent       = EventTarget.prototype.dispatchEvent.bind(AdminLib);

   return AdminLib;

})();

// Extension of string
/**
 *
 * @returns {string}
 * @public
 */
String.prototype.capitalizeFirstLetter = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
};