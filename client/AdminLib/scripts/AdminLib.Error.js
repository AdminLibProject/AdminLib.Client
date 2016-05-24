'use strict';

AdminLib.Error                                    = (function() {

   /**
    *
    * @param {AdminLib.Error.Parameters.Like} parameters
    * @constructor
    * @property {function}         action
    * @property {string}           message
    * @property {Promise.<string>} messagePromise
    * @property {boolean}          silent
    * @property {string}           title
    * @property {Promise.<string>} titlePromise
    */
   function Error(parameters) {

      AdminLib.EventTarget.call(this);

      if (!(parameters instanceof Promise))
         parameters = Promise.resolve(parameters);

      this.promise = parameters.then(function(parameters) {

         var /** @type {Promise.<string>} */ messagePromise
           , /** @type {Promise.<string>} */ titlePromise;

         parameters = Error.coalesceParameters([parameters]);

         this.action = parameters.action;

         // Property: message
         messagePromise = AdminLib.toPromise(parameters.message)
                           .then(
                              function(message) {
                                 this.message = message;
                              }.bind(this));

         // Property: title
         titlePromise   = AdminLib.toPromise(parameters.title)
                           .then(
                              function(title) {
                                 this.title = title;
                              }.bind(this));

         parameters = Error.coalesceParameters([parameters]);

         return Promise.all([messagePromise, titlePromise]);
      }.bind(this));

      if (!parameters.silent)
         this.display();
   }

   Error.prototype                               = Object.create(AdminLib.EventTarget.prototype);
   Error.prototype.constructor                   = Error;

   /**
    * Display the error
    * @public
    */
   Error.prototype.display                       = function() {

      this.promise.then(function() {

         var /** @type {AdminLib.Event} */ event;

         // Event: display
         event = new AdminLib.Event ( Error.event.display
                                   , { cancelable: true
                                     , target    : this});

         this.dispatchEvent(event);

         if (event.defaultPrevented)
            return;
         // Event: displayed

         AdminLib.notify.error({ message: this.message
                              , onclick: this.action
                              , title  : this.title });

         // Event: displayed
         event = new AdminLib.Event ( Error.event.displayed
                                   , { cancelable: false
                                     , target    : this});

         this.dispatchEvent(event);
         // Event: displayed

      }.bind(this));

   };

   /**
    * @param {AdminLib.Error.Parameters.Like[]} parametersList
    * @returns {AdminLib.Error.Parameters}
    * @public
    */
   Error.coalesceParameters                   = function (parametersList) {

      var /** @type {AdminLib.Error.Parameters} */ coalescedParameters;

      parametersList = parametersList.map(function(parameters) {

         if (typeof(parameters) === 'string')
            return {message: parameters};
         else if (typeof(parameters) === 'function')
            return {message: parameters};
         else if (parameters instanceof Promise)
            return {message: parameters};

         return parameters;
      });

      coalescedParameters = { action  : AdminLib.coalesceAttribute('action' , parametersList)
                            , message : AdminLib.coalesceAttribute('message', parametersList)
                            , silent  : AdminLib.coalesceAttribute('silent' , parametersList, false)
                            , title   : AdminLib.coalesceAttribute('title'  , parametersList)};

      return coalescedParameters;
   };

   Error.event = { display  : 'display'
                 , displayed: 'displayed' };

   return Error;

})();

AdminLib.FetchError                               = (function() {

   function FetchError(fetchResponse, request) {

      var /** @type {Object}                   */ error
        , /** @type {function}                 */ onerror
        , /** @type {function}                 */ onsuccess
        , /** @type {AdminLib.Error.Parameters} */ parameters
        , /** @type {Promise}                  */ promise;

      onerror = function() {
         return { action  : undefined
                , message : request.method + ': ' + fetchResponse.url
                , silent  : false
                , title   : 'Error ' + fetchResponse.status + ': ' + fetchResponse.statusText};
      };

      onsuccess = function(error) {

         var /** @type {AdminLib.Error.Parameters} */ parameters;

         if (error.type === 'DatabaseException')
            parameters = { action  : undefined
               , message : error.informations.message
               , silent  : false
               , title   : 'Database exception'};

         else
            parameters = { action  : undefined
               , message : error.message
               , silent  : false
               , title   : 'Internal Server Error'};

         return parameters;

      };

      promise = fetchResponse.json().then(onsuccess, onerror);

      AdminLib.Error.call(this, promise);

   }

   FetchError.prototype                          = Object.create(AdminLib.Error.prototype);
   FetchError.prototype.constructor              =  FetchError;

   return FetchError;
})();