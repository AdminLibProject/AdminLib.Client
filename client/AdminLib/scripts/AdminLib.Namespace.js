'use strict';

AdminLib.Widget                                   = (function() {

   function Widget(parameters) {
      this.code = AdminLib.coalesce(parameters.code, 'main');
   }

   Widget.prototype.getCode                      = function getCode() {
      return this.code;
   };

   return Widget;

})();

AdminLib.Namespace                                = (function() {

   /**
    *
    * @name AdminLib.Namespace
    * @param {class|class[]} [itemType]
    * @param {boolean}               [acceptUndefined=true]
    * @param {class|class[]} [keyType]
    * @param {boolean}               [acceptUndefinedKey=true]
    * @constructor
    * @class
    * @name Namespace
    * @property {Object.<AdminLib.Model>} models
    * @property {string}                 code
    */
   function Namespace(itemType, acceptUndefined, keyType, acceptUndefinedKey) {

      var /** @type {string|function} */ type;

      this.items = new Map();

      this.acceptUndefined    = AdminLib.coalesce(acceptUndefined, true);
      this.acceptUndefinedKey = AdminLib.coalesce(acceptUndefinedKey);

      // Property : itemTypes
      if (itemType instanceof Array)
         this.itemTypes = itemType.slice(0);
      else if (itemType)
         this.itemTypes = [itemType];
      else
         this.itemTypes = [];

      // Checking each item type
      for(type of this.itemTypes) {
         if (typeof(type) !== 'string' && typeof(type) !== 'function')
            throw 'Invalid item type';
      }


      if (typeof(keyType) === 'array')
         this.keyTypes = keyType.slice(0);
      else if (keyType)
         this.keyTypes = [keyType];
      else
         this.keyTypes = [];

      // Checking each key type
      for(type of this.keyTypes) {
         if (typeof(type) !== 'string' && typeof(type) !== 'function')
            throw 'Invalid item type';
      }

   }

   /***
    *
    * Forms :
    *    add(item)
    *    add(item, code)
    *    add(item, code, replace)
    *    add(item, replace)
    *
    *    The default value for the "replace" parameter is "false".
    *    If no code is provided, then the code will be look inside the item :
    *       If the item has a function "getCode", then it will be executed
    *       Otherwise, the "item.code" value will be used
    *
    * @param {Item}           item
    * @param {*|boolean}      [param2]
    * @param {boolean}        [param3]
    * @returns {AdminLib.Model}
    * @public
    */
   Namespace.prototype.add                       = function(item, param2, param3) {

      var /** @type {string}  */ code
        , /** @type {Item}    */ existingItem
        , /** @type {boolean} */ replace;

      if (!this.isValidItem(item))
         throw 'Invalid item';

      code    = undefined;
      replace = false;

      switch(arguments.length) {

         case 2:
            if (typeof(param2) === 'boolean')
               replace = param2;
            else
               code = param2;

            break;

         case 3:
            code   = param2;
            replace = param3;
            break;
      }

      if (code === undefined)
         code = this.getItemCode(item);

      existingItem = this.get(code, true);

      if (existingItem === item)
         return;

      if (existingItem !== undefined)
         throw 'An item with the code "' + code + '" already exists';

      this.items.set(code, item);
   };

   /**
    * Clone the namespace
    * @public
    */
   Namespace.prototype.clone                     = function() {

      var /** @type {AdminLib.Namespace} */ clone;

      clone = new Namespace( /* itemType            */ this.itemTypes
                           , /* acceptUndefined     */ this.acceptUndefined
                           , /* keyType             */ this.keyTypes
                           , /* acceptUndefinedKeys */ this.acceptUndefinedKeys)

      return this.clonify(clone)
   };

   /**
    *
    * @param {AdminLib.Namespace} clone
    * @protected
    */
   Namespace.prototype.clonify                   = function(clone) {

      for(var code of this.items.keys()) {
         clone.items.set(code, this.items.get(code));
      }
   };

   /**
    * Empty the namespace
    * @public
    */
   Namespace.prototype.empty                     = function() {
      this.items = new Map();
   };

   /**
    *
    * @param {*}       code
    * @param {boolean} [silent=true]
    * @returns {Item}
    * @public
    */
   Namespace.prototype.get                       = function(code, silent) {

      if (!this.has(code)) {

         if (AdminLib.coalesce(silent, true))
            return;

         throw 'No item corresponding to the given code';
      }

      return this.items.get(code);
   };

   /**
    *
    * @param {*} item
    * @returns {*}
    */
   Namespace.prototype.getItemCode               = function(item) {

      var /** @type {string} */ code;

      if (typeof(item.getCode) === 'function' )
         code = item.getCode();
      else
         code = item.code;

      return code;
   };

   /**
    * Indicate if the given code exists in the namespace
    * @param {*} code
    * @returns {boolean}
    * @public
    */
   Namespace.prototype.has                       = function(code) {

      if (!this.isValidCode(code))
         throw 'Invalid code';

      return this.items.has(code);
   };

   /**
    *
    * @param {*} item
    * @returns {boolean}
    */
   Namespace.prototype.isValidItem               = function(item) {
      return this.isValidType(item, this.acceptUndefined, this.itemTypes);
   };

   /**
    *
    * @param {*} code
    * @returns {boolean}
    */
   Namespace.prototype.isValidCode               = function(code) {
      return this.isValidType(code, this.acceptUndefinedKey, this.keyTypes);
   };

   /**
    *
    * @param {*} item
    * @returns {boolean}
    * @private
    */
   Namespace.prototype.isValidType               = function(item, acceptUndefined, listTypes) {

      var /** @type {string|function} */ type;

      if (item === undefined)
         return acceptUndefined;

      if (listTypes.length === 0)
         return true;

      for(type of listTypes) {


         // If the itemType is a string
         if (typeof(type) === 'string') {
            if (typeof(item) === type)
               return true;

            continue;
         }

         // If the itemType is a function
         if (Object.keys(type.prototype).length === 0)
            if (type(item, this))
               return true;

         // If the itemType is a constructor
         if (item instanceof type)
            return true;

      }

      return false;
   };

   /**
    *
    * @param {string|AdminLib.Model} code
    * @param {boolean} [silent=true]
    * @returns {Item} Return the removed item
    * @public
    */
   Namespace.prototype.remove                    = function(code, silent) {

      var /** @type {Item} */ item;

      if (!this.has(code)) {

         if (silent)
            return undefined;

         throw 'No item corresponding to the given code';
      }

      item = this.get(code, silent);

      this.items.delete(code);

      return item;
   };

   return Namespace;

})();

AdminLib.Collection                               = (function() {

   /**
    *
    * @param {class|class[]} itemType
    * @param acceptUndefined
    * @constructor
    */
   function Collection(itemType, acceptUndefined) {

      AdminLib.Namespace.call(this, /* itemType           */ itemType
                                 , /* acceptUndefined    */ acceptUndefined
                                 , /* keyType            */ 'string'
                                 , /* acceptUndefinedKey */ false);

      this.byIndex = [];

      Object.defineProperty(this, 'length', { get : function() { return this.byIndex.length;}.bind(this)});
      Object.defineProperty(this, 'list'  , { get : function() { return this.byIndex.slice(0); }.bind(this)});

      delete(this.add);
   }

   Collection.prototype                          = Object.create(AdminLib.Namespace.prototype);
   Collection.prototype.constructor              = Collection;

   Collection.prototype[Symbol.iterator]         = function() {

      var /** @type {number} */ index;

      index = 0;

      return { next :
                  function() {

                     if (index === this.byIndex.length)
                        return {done: true};

                     return {value: this.byIndex[index++], done: false};

                  }.bind(this) }

   };

   /**
    * Add all arguments to the collection
    * @param {...*} items
    * @public
    */
   Collection.prototype.add                      = function add() {

      var /** @type {*} */ item;

      for(var a=0; a < arguments.length; a++) {

         item = arguments[a];

         AdminLib.Namespace.prototype.add.call(this, item);
         this.byIndex.push(item);
      }

   };

   /**
    * Clone the list and return a new list.
    * @returns {AdminLib.Collection}
    * @public
    */
   Collection.prototype.clone                    = function clone() {

      var /** @type {AdminLib.Collection} */ clone;

      clone = new Collection(this.itemTypes, this.acceptUndefined);

      AdminLib.Namespace.prototype.clonify.call(this, clone);

      clone.byIndex = this.byIndex.slice(0);

      return clone;
   };

   /**
    * Empty the collection
    * @public
    */
   Collection.prototype.empty                    = function empty() {
      AdminLib.Namespace.prototype.empty.call(this);
      this.byIndex = [];
   };

   /**
    *
    * @param {string|number} code
    * @returns {Item}
    * @public
    */
   Collection.prototype.get                      = function get(code) {

      var /** @type {Item} */ item;

      if (typeof(code) === 'number')
         return this.byIndex[code];


      return AdminLib.Namespace.prototype.get.call(this, code);
   };

   /**
    *
    * @param {function} fct
    * @returns {Array.<T>}
    * @public
    */
   Collection.prototype.filter                   = function filter(fct) {
      return this.byIndex.filter(fct);
   };

   /**
    *
    * @param {function} fct
    * @public
    */
   Collection.prototype.forEach                  = function forEach(fct) {
      this.byIndex.forEach(fct);
   };

   /**
    *
    * @returns {Item[]}
    * @public
    */
   Collection.prototype.getAll                   = function getAll() {
      return this.slice(0);
   };

   /**
    *
    * @returns {number}
    * @public
    */
   Collection.prototype.indexOf                  = function indexOf() {
      return Array.prototype.indexOf.apply(this.byIndex, arguments);
   };

   /**
    *
    * @param {function} fct
    * @returns {Array}
    * @public
    */
   Collection.prototype.map                      = function map(fct) {
      return this.byIndex.map(fct);
   };

   /**
    * @param {Object} item
    * @returns {number}
    * @public
    */
   Collection.prototype.push                     = function(item) {
      AdminLib.Namespace.prototype.add.call(this, item, false);

      return this.byIndex.push(item);
   };

   /**
    * @param {Item|number|string} item
    * @return {Item}
    */
   Collection.prototype.remove                   = function remove(item) {

      var /** @type {string} */ code
        , /** @type {number} */ index;

      if (typeof(item) === 'string') {
         code = item;
         item  = this.get(item);
         index = this.indexOf(item);
      }
      else if (typeof(item) === 'number') {
         code   = this.getItemCode(item); // TODO : We should be able to retreive the code without calling this function
         item   = this.get(item);
         index  = item;
      }
      else {
         index = this.indexOf(item);
         code   = this.getItemCode(item);
      }


      if (index === -1)
         throw 'The item don\'t belongs to the list';

      AdminLib.Namespace.prototype.remove.call(this, code, false);
      this.splice(index, 1);

      return item;
   };

   /**
    * @returns {Collection}
    * @public
    */
   Collection.prototype.reverse                  = function reverse() {
      this.byIndex.reverse();
      return this;
   };

   /**
    *
    * @returns {Array.<T>}
    * @public
    */
   Collection.prototype.slice                    = function slice() {
      return Array.prototype.slice.apply(this.byIndex, arguments);
   };

   /**
    *
    * @returns {Array.<T>}
    * @public
    */
   Collection.prototype.splice                   = function splice() {
      return Array.prototype.splice.apply(this.byIndex, arguments);
   };

   /**
    * @returns {number}
    * @public
    */
   Collection.prototype.unshift                  = function unshift() {

      var /** @type {Item}   */ item
        , /** @type {Item[]} */ items;

      items = Array.prototype.slice.call(arguments);
      items = items.reverse();

      for(item of items) {
         AdminLib.Namespace.prototype.add.call(this, item, false);
         this.byIndex.unshift(item);
      }

      return this.length;
   };

   return Collection;

})();