'use strict';

AdminLib.widget.Dropdown = (function() {

   // ******************** Dropdown ********************

   /**
    * @name AdminLib.widget.DropDown
    * @class
    * @param {Parameters} parameters
    * @constructor
    */
   function Dropdown(parameters) {

      var /** @type {AdminLib.Action.Button.Parameter} */ defaultConfirmButtonParameters
        , /** @type {Promise}                         */ loadPromise;

      // Property : enabled
      this.enabled = AdminLib.coalesce(parameters.enabled, true);

      // Property : entries
      this.entries = new AdminLib.Collection(Entry);

      // Property : id
      this.id    = lastID++;
      this.domID = 'AdminLib_widget_Dropdown_' + this.id;

      // Property : placeholder
      this.placeholder = parameters.placeholder;

   }

   Dropdown.prototype                             = Object.create(AdminLib.Widget.prototype);
   Dropdown.prototype.constructor                 = Dropdown;

   /**
    * Add the given entry to the Dropdown
    * @param {Entry} entry
    * @public
    */
   Dropdown.prototype.addEntry                    = function(entry) {

      if (!(entry instanceof Entry))
         entry = new Entry(entry);

      this.entries.add(entry);
      this.addEntryToDOM(entry);
   };

   /**
    * Add the DOM of the entry to the DOM
    * @param {Entry} entry
    * @private
    */
   Dropdown.prototype.addEntryToDOM              = function addEntryToDOM(entry) {
      this.listEntriesDOM.appendChild(entry.getDOM());
   };

   /**
    * Build the DOM of the dropdown
    * @private
    */
   Dropdown.prototype.buildDOM                    = function buildDOM() {

      var /** @type {string}        */ dropDownTemplate
        , /** @type {HTMLElement[]} */ dropDownDOM
        , /** @type {string}        */ placeholderTemplate;

      if (this.placeholder)
         placeholderTemplate = '<option disabled selected>{{placeholder}}</option>'
      else
         placeholderTemplate = '';

      // Adding a select box
      dropDownTemplate =   '<div class="dropdown">'
                        +     '<button class="{{button.class}} dropdown-toggle" id="' + this.domID + '" type="button" data-toggle="dropdown" aria-expanded="true">'
                        +        '{{button.label}}'
                        +        '<span class="carret"></span>'
                        +     '</button>'
                        +     '<ul class="dropdown-menu" role="menu" aria-labelledby="' + this.domID  + '">'
                        +     '</ul>'
                        +  '</div>';

      this.dom            = AdminLib.dom.build(dropDownTemplate, this);
      this.button         = this.dom.querySelector('button');
      this.listEntriesDOM = this.dom.querySelector('ul');

      // Add all entries to the DOM
      this.entries.forEach(this.addEntryToDOM.bind(this));
   };

   /**
    * Disable the dropdown.
    * @public
    */
   Dropdown.prototype.disable                     = function disable() {
      this.button.disabled = true;
   };

   /**
    * Disable the given entry
    * @param {string|number} entry
    * @public
    */
   Dropdown.prototype.disableEntry                = function disableEntry(entry) {
      entry = this.getEntry(entry);

      if (entry === undefined)
         throw 'The entry don\'t exists';

      entry.enable();
   };

   /**
    * Enable the dropdown.
    * @public
    */
   Dropdown.prototype.enable                      = function enable() {
      this.button.disabled = false;
   };

   /**
    * enable the given entry
    * @param {string|number} entry
    * @public
    */
   Dropdown.prototype.enableEntry                = function enableEntry(entry) {
      entry = this.getEntry(entry);

      if (entry === undefined)
         throw 'The entry don\'t exists';

      entry.enable();
   };

   /**
    * Return the DOM of the dropdown
    * @returns {HTMLElement}
    * @public
    */
   Dropdown.prototype.getDOM                      = function getDOM() {
      if (this.dom === undefined)
         this.buildDOM();

      return this.dom;
   };

   /**
    * Return the list of all entries
    * @returns {Entry[]}
    * @public
    */
   Dropdown.prototype.getEntries                 = function getEntries() {
      return this.entries.getAll();
   };

   /**
    * Return the entry corresponding to the given code or index
    * @param {string|number} info
    * @returns {Entry}
    * @public
    */
   Dropdown.prototype.getEntry                   = function getEntry(info) {
      return this.entries.get(info);
   };

   /**
    * Remove the given entry
    * @param {Entry|string|number} entry
    */
   Dropdown.prototype.removeEntry                = function removeEntry(entry) {
      if (!(entry instanceof Entry))
         entry = this.getEntry(entry);

      entry.remove(token);
      this.entries.remove(entry);
   };

   // ******************** Entry ********************

   /**
    *
    * @name AdminLib.widget.Dropdown.Entry
    * @class
    * @param {Parameters} parameters
    * @param {Dropdown} parent
    * @constructor
    * @extend {AdminLib.Widget}
    *
    * @property {string}     domID
    * @property {boolean}    enabled
    * @property {function}   handler
    * @property {string}     icon
    * @property {number}     id
    * @property {string}     label
    * @property {Dropdown}   parent
    * @property {Entry.TYPE} type
    * @property {string}     url
    */
   function Entry(parameters, parent){

      AdminLib.Widget.call(this, parameters);

      this.parent  = parent;

      this.code    = parameters.code;
      this.enabled = entry.enabled;
      this.handler = parameters.handler;
      this.icon    = parameters.icon;
      this.id      = this.domID + '_' + this.parent.entries.length;
      this.label   = parameters.label;
      this.url     = parameters.url;

      if (this.label === undefined && this.handler === undefined && this.url === undefined && this.icon === undefined)
         this.type = Entry.TYPE.SEPARATOR;
      else if (this.label !== undefiend && this.handler === undefined && this.url === undefined)
         this.type = Entry.TYPE.HEADER;
      else
         this.type = Entry.TYPE.LINK;

   }

   Entry.prototype                               = Object.create(AdminLib.Widget.prototype);
   Entry.prototype.constructor                   = Entry;

   /**
    * Build the DOM of the entry.
    * @private
    */
   Entry.prototype.buildDOM                      = function buildDOM() {

      switch(this.type) {

         case Entry.TYPE.SEPARATOR:
            this.dom = AdminLib.dom.build(separatorTemplate);
            break;

         case Entry.TYPE.HEADER:
            this.dom = AdminLib.dom.build(headerTemplate, this);
            break;

         case Entry.TYPE.LINK:
            this.dom = AdminLib.dom.build(entryTemplate, this);
            this.dom.addEventListener('click', this.execute.bind(this));
            break;
      }

   };

   /**
    * Disable the menu entry
    * @public
    */
   Entry.prototype.disable                       = function disable() {

      this.enabled = false;

      if (this.type !== Entry.TYPE.LINK)
         return;

      this.dom.classList.add('disabled');
   };

   /**
    * Enable the menu entry.
    * @public
    */
   Entry.prototype.enable                        = function enable() {

      this.enabled = true;

      if (this.type !== Entry.TYPE.LINK)
         return;

      this.dom.classList.remove('disabled');
   };

   /**
    * Execute the menu entry, unless it's disabled.
    * @param {boolean} [force=false] If true, then the menu entry will be executed even if it's disabled.
    */
   Entry.prototype.execute                       = function execute(force) {

      force = AdminLib.coalesce(force, false);

      if (this.type !== Entry.TYPE.LINK)
         return;

      if (!this.enabled && !force)
         return;

      this.handler();
   };

   /**
    * Return the DOM of the entry
    * @returns {HTMLElement|*}
    * @public
    */
   Entry.prototype.getDOM                        = function() {
      if (this.dom === undefined)
         this.buildDOM();

      return this.dom;
   }

   /**
    * Remove the entry from the DOM
    * @param {Object} tokenObject
    * @private
    */
   Entry.prototype.remove                        = function remove(tokenObject) {
      if (tokenObject !== token)
         throw 'You can\'t remove an entry using this function. Use the Dropdown.removeEntry" instead';

      this.dom.parentElement.removeChild(this.dom);
   };

   /**
    * @Enum
    */
   Entry.TYPE = { LINK      : 'link'
                , SEPARATOR : 'separator'
                , HEADER    : 'header' };

   var entryTemplate =  +  '<li role="presentation" id="{{id}}">'
                        +      '<a href="{{#url}}{{url}}{{/url}}{{^url}}#{{/url}}" role="menuitem" tabindex="-1" href="#">'
                        +        '{{#icon}}<i class="{{icon}}"> </i>'
                        +        '{{label}}'
                        +     '</a>'
                        +  '</li>';

   var headerTemplate = '<li role="presentation" class="dropdown-header" id="{{id}}">{{label}}</li>';

   var separatorTemplate = '<li role="presentation" class="divider" id="{{id}}"></li>';


   var token = {};

   var lastID = 0;

   /**
    * @name ListBoxOption
    * @typedef {Object}
    * @property {SelectOption} option
    * @property {string}       value
    */

})();