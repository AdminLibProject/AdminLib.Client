'use strict';

AdminLib.Connection                               = (function() {

   /**
    * @name AdminLib.Connection.Connection
    * @class
    * @constructor
    * @param {AdminLib.Connection.Parameters} parameters
    * @property {Promise}         promise
    * @property {function(*)}     fulfillFunction
    * @property {boolean}         onerrorcontinue
    * @property {function(*)}     rejectFuncton
    * @property {Promise[]}       requestPromises
    * @property {Promise[]}       requests
    * @property {Promise[]}       sequentialPromises
    */
   function Connection(parameters) {

      parameters = Connection.coalesceParameters(parameters);

      this.promise = new Promise(function(fulfill, reject) {
         this.fulfillFunction = fulfill;
         this.rejectFunction  = reject;
      }.bind(this));

      this.onErrorAction      = parameters.onerror;
      this.autocommit         = parameters.autocommit;
      this.id                 = maxID ++;
      this.open               = true;
      this.requestPromises    = [];
      this.sequentialPromises = [];
   }

   /**
    *
    * Add a reqeust to the connection.
    * The request will be fired as soon as possible (asynchronously), after :
    *    - all previous sequantial request have finished.
    *    - all commits and rollbacks
    *
    * If the request fail, then they are three scenarios :
    *    - if we are in on error continue, the promise will raise an error but the connection will continue handling
    *       request normally
    *    - if we are in on error rollback, a rollback will be perform :
    *
    *          - If the rollback is successful, then the request will raise an error but the connection will continuehandling
    *            request normally
    *
    *          - If the rollback has failed, then the request will raise an error AND the connection will stop.
    *
    *    - if a error handler has been provided, then it will be called. It will have the possibility to :
    *          - continue
    *          - rollback
    *
    *
    * @param {Request} request
    * @param {boolean} [sequential=false]
    * @public
    */
   Connection.prototype.addRequest               = function addRequest(request, sequential) {

      if (!this.open)
         throw 'Connection is closed';

      request.headers.append('Keep-Connection-Alive', '' + true );
      request.headers.append('Auto-Commit'          , '' + this.autocommit);
      request.headers.append('Connection-Id'        , '' + this.getID());

      sequential = AdminLib.coalesce(sequential, false);

      return this.buildRequestPromise(request, sequential);
   };

   /**
    * Sorry, this function is a little tricky
    *
    * This function build the request promise : it return a promise that will be resolved when the request has finished.
    *
    * In the same time, we build a second promise. This promise is here to know if the connection can continue or no.
    * If the request was successful, then the promise will be resolved and the connection will continue handling requests.
    * If the request has failed but the error has been handle (by a "continue" or "rollback" action), then the promise will
    * be resolved and the connection will continue handling requests.
    * If the request has failed AND the error hasn't been handle properly (fail to rollback, the error handler throw an exception, etc...)
    * then the promise will faile and the connection will stop handling requests.
    *
    * @param {Request} request
    * @param {boolean} sequential
    * @returns {Promise.<AdminLib.Action.Result>}
    * @private
    */
   Connection.prototype.buildRequestPromise      = function buildRequestPromise(request, sequential) {

      var /** @type {function}  */ fulfillInternalPromise
        , /** @type {function}  */ fulfillRequestPromise
        , /** @type {Promise}   */ internalPromise
        , /** @type {string}    */ onErrorAction
        , /** @type {function}  */ onRequestFulfill
        , /** @type {function}  */ onRequestReject
        , /** @type {Promise}   */ promise
        , /** @type {function}  */ rejectInternalPromise
        , /** @type {function}  */ rejectRequestPromise
        , /** @type {Promise}   */ requestPromise
        , /** @type {Promise[]} */ waitForPromises;

      // Note : we need to wait that the server already create the connection.
      sequential = this.requestPromises.length === 0 ? true : sequential;

      onErrorAction = this.onErrorAction;

      requestPromise = new Promise(function(fulfill, reject) {
         fulfillRequestPromise = fulfill;
         rejectRequestPromise  = reject;
      });

      internalPromise = new Promise(function(fulfill, reject) {
         fulfillInternalPromise = fulfill;
         rejectInternalPromise  = reject;
      });

      onRequestFulfill = function(data) {
         fulfillRequestPromise(data);
         fulfillInternalPromise();
      };

      onRequestReject = function(error) {
         var /** @type {function} */ actionParameter
           , /** @type {boolean}  */ actionPerformed
           , /** @type {function} */ onActionFulfill
           , /** @type {function} */ onActionReject;

         onActionFulfill = function() {
            rejectRequestPromise(error);
            fulfillInternalPromise();
         };

         onActionReject = function() {
            rejectRequestPromise(error);
            rejectInternalPromise();
         }.bind(this);

         switch(onErrorAction) {

            case Connection.onerror.continue:
               onActionFulfill();
               break;

            case Connection.onerror.rollback:
               this.performRollback().then( onActionFulfill
                                          , onActionReject);
               break;

            case undefined :
               onActionReject();
               break;

            default:

               actionPerformed = false;

               actionParameter = {error : error};

               actionParameter['continue'] = function() {

                  // We ensure that the user do not perform an action twice
                  if (actionPerformed)
                     throw 'Action already performed';

                  actionPerformed = true;
                  onActionFulfill();
               };

               actionParameter.rollback = function() {

                  var /** @type {Promise} */ promise;

                  // We ensure that the user do not perform an action twice
                  if (actionPerformed)
                     throw 'Action already performed';

                  actionPerformed = true;

                  promise = this.performRollback();

                  promise.then ( onActionFulfill
                               , onActionReject);

                  return promise;
               }.bind(this);

               try {
                  onErrorAction(actionParameter);
               }
               catch(e) {
                  // If the onErrorAction function failed, then use the throw exception as error object
                  error = e;
                  onActionReject();
               }
         }

      }.bind(this);

      // If the request must be executed sequentialy
      // then we must wait all requests before firering the request
      // If not, we only wait for the sequential promise to finish

      promise = Promise.all(this.requestPromises).then(function() {
         return AdminLib.fetchRequest(request);
      }.bind(this));

      promise = promise.then(onRequestFulfill, onRequestReject);

      if (sequential)
         this.sequentialPromises.push(internalPromise);

      // All promise requests are added in the array, event sequential ones
      this.requestPromises.push(internalPromise);

      return requestPromise;
   };

   /**
    *
    * @param {*} reject
    * @returns {Promise}
    * @public
    */
   Connection.prototype['catch']                 = function (reject) {
      return this.promise.catch(reject);
   };

   /**
    * Close the connection.
    * @param {boolean} [force=false]
    * @public
    */
   Connection.prototype.close                    = function close(force) {
      var /** @type {function}    */ close
        , /** @type {function(*)} */ onsuccess
        , /** @type {function(*)} */ onerror;

      if (!this.open)
         return;

      this.open = false;

      close = function() {

         return AdminLib.loadAjax ( /* path          */ 'server/connection'
                                 , /* data          */ undefined
                                 , /* method        */ 'DELETE'
                                 , /* headers       */ { 'Keep-Connection-Alive' : false
                                                       , 'Auto-Commit'           : this.autocommit
                                                       , 'Connection-Id'         : '' + this.getID()}
                                 , /* urlParameters */ undefined
                                 , /* connection    */ undefined);
      }.bind(this);

      onsuccess = function(result) {
         return close().then ( function() { this.fulfillFunction(result); }.bind(this)
                             , function(closeError) { this.rejectFunction(result); return closeError; }.bind(this))

      }.bind(this);

      onerror = function(result) {

         if (force)
            return close().then ( function() {this.rejectFunction(result);}.bind(this)
                                , function(closeError) {this.rejectFunction(result); return closeError; }.bind(this) );

         return result;
      }.bind(this);

      Promise.all(this.requestPromises).then(onsuccess, onerror);
   };

   /**
    * Commit the transactions.
    * A closed connection can't make commit and will throw an error
    * The function will return a promise that will indicate if the commit was successful (true) or not
    *
    * @returns {Promise.<boolean>} If resolve true, then the commit was successful, false overwis
    * @public
    */
   Connection.prototype.commit                   = function commit() {

      var /** @type {function(*)} */ onerror
        , /** @type {function(*)} */ onsuccess
        , /** @type {Promise}     */ promise;

      if (!this.open)
         throw 'Connection is closed';

      onsuccess = function() {

         var /** @type {function(*)} */ onerror
           , /** @type {function(*)} */ onsuccess
           , /** @type {Promise}     */ promise;

         promise = AdminLib.loadAjax ( /* path          */ 'server/connection/commit'
                                    , /* data          */ undefined
                                    , /* method        */ 'PATCH'
                                    , /* headers       */ { 'Keep-Connection-Alive' : true
                                                          , 'Auto-Commit'           : true
                                                          , 'Connection-Id'         : '' + this.getID()}
                                    , /* urlParameters */ undefined);

         onerror = function(error) {
            return { success : false
                   , error   : error};
         }.bind(this);

         onsuccess = function() {
            return { success : true };
         }.bind(this);

         return promise;

      }.bind(this);

      onerror = function(error) {

         return { success : false
                , error   : error};
      };

      promise = Promise.all(this.requestPromises).then(onsuccess, onerror);

      // The promise is added to the sequential promises
      this.sequentialPromises.push(promise);
      this.requestPromises.push(promise);

      return promise;
   };

   /**
    *
    * @returns {string}
    * @public
    */
   Connection.prototype.getID                    = function getID() {
      return 'Connection-' + this.id;
   };

   /**
    * Do the rollback
    * @private
    */
   Connection.prototype.performRollback          = function performRollback() {

      var /** @type {function(*)} */ onerror
        , /** @type {function(*)} */ onsuccess
        , /** @type {Promise}     */ promise;

      promise = AdminLib.loadAjax ( /* path          */ 'server/connection/rollback'
                                 , /* data          */ undefined
                                 , /* method        */ 'PATCH'
                                 , /* headers       */ { 'Keep-Connection-Alive' : true
                                                       , 'Auto-Commit'           : true
                                                       , 'Connection-Id'         : '' + this.getID()}
                                 , /* urlParameters */ undefined
                                 , /* transaction   */ undefined);

      onerror = function(error) {
          return { success : false
                 , error   : error} ;
       }.bind(this);

      onsuccess = function() {
         this.fulfillFunction(this);
         return { success : true} ;
      }.bind(this);

      promise = promise.then(onsuccess, onerror);

      return promise;
   };

   /**
    * Rollback the connection.
    * A closed connection can't performe a rollback and will throw an error
    * The function will return a promise that will indicate if the rollback was successful (true) or not
    *
    * @returns {Promise.<boolean>} If resolve true, then the rollback was successful, false overwis
    * @public
    */
   Connection.prototype.rollback                 = function rollback(token) {

      var /** @type {Promise}     */ promise
        , /** @type {function(*)} */ rollbackFunction;

      if (!this.open && !token)
         throw 'Transaction is closed';

      rollbackFunction = this.performRollback.bind(this);

      // We rollback even if there is errors
      promise = Promise.all(this.requestPromises).then(rollbackFunction, rollbackFunction);

      // The promise is added to the sequential promises
      this.sequentialPromises.push(promise);

      this.requestPromises.push(promise);

      return promise;
   };

   /**
    *
    * @param {*} fulfill
    * @param {*} reject
    * @returns {Promise.<T>}
    * @public
    */
   Connection.prototype.then                     = function then(fulfill, reject) {
      return this.promise.then(fulfill, reject);
   };

   /**
    *
    * @param {AdminLib.Connection.Parameters[]} parametersList
    * @returns {AdminLib.Connection.Parameters}
    */
   Connection.coalesceParameters                 = function coalesceParameters(parametersList) {

      var /** @type {AdminLib.Connection.Parameters} */ coalescedParameters;

      coalescedParameters = { autocommit : AdminLib.coalesceAttribute('autocommit', parametersList, false)
                            , onerror    : AdminLib.coalesceAttribute('onerror'   , parametersList, Connection.onerror.rollback )};

      return coalescedParameters;
   };


   Connection.onerror = { 'continue' : 'continue'
                        , 'rollback' : 'rollback'};

   var maxID = 0;

   return Connection;
})();