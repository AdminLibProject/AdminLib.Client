'use strict';

// AdminLib.Menu
(function() {

   AdminLib.Menu                                  = (function() {

      /**
       *
       * @param parameters
       * @constructor
       * @property {Array.<AdminLib.Menu.Entry|AdminLib.Menu.Heading|AdminLib.Menu.SubMenu>} entries
       * @property {AdminLib.Menu.Entry} activatedEntry
       * @property {string}             code
       */
      function Menu(parameters, code) {
         var /** @type {AdminLib.Menu.Entry|AdminLib.Menu} */ entry
           , /** @type {Object}                          */ entryParameters;

         this.entries = [];
         this.menu    = this;
         this.code    = code;

         for(entryParameters of parameters) {
            entry = getMenuEntry(entryParameters, this);
            this.entries.push(entry);
         }

      };

      /**
       *
       * @param element
       * @param executeHandler
       * @internal
       */
      Menu.prototype.activateElement             = function activateElement(element, executeHandler) {

         var /** @type {AdminLib.Menu~Element} */ parent;

         if (element === this.activeElement) {
            if (AdminLib.coalesce(executeHandler, true))
               this.activeElement.executeHandler();

            return;
         }

         // Deactivating the previous element
         parent = this.activeElement;

         while (parent !== undefined) {
            parent.setActive(false);
            parent = parent.getParent();
         }

         // Activating the new element
         parent = element;

         while (parent !== undefined) {
            parent.setActive(true);
            parent = parent.getParent();
         }

         this.activeElement = element;

         if (element instanceof AdminLib.Menu.Entry)
            if (AdminLib.coalesce(executeHandler, true))
               this.activeElement.executeHandler();

      };

      /**
       * User the menu as the current one
       * @public
       */
      Menu.prototype.display                     = function display() {

         var /** @type {HTMLElement}          */ dom
           , /** @type {AdminLib.Menu.Element} */ element
           , /** @type {HTMLElement}          */ sideBarToggler;

         dom = AdminLib.StandardPage.sidebarHandler.getDOM();

         sideBarToggler = dom.querySelector('li.sidebar-toggler-wrapper');
         AdminLib.dom.empty(dom);

         dom.appendChild(sideBarToggler);

         for(element of this.entries) {
            dom.appendChild(element.getDOM());
         }

      };

      /**
       *
       * @returns {AdminLib.Menu.Entry}
       */
      Menu.prototype.getActivatedEntry           = function getActivatedEntry() {
         return this.activatedEntry;
      };

      /**
       * Return the code of the menu
       * @returns {string}
       * @public
       */
      Menu.prototype.getCode                     = function getCode() {
         return this.code;
      };

      /**
       *
       * @param {AdminLib.Menu.Entry} entry
       * @internal
       */
      Menu.prototype.setActivatedEntry           = function setActivatedEntry(entry) {
         this.activatedEntry = entry;
      };

      var templateSubMenu =
            '<li class="sidebar-toggler-wrapper">'
         +     '<!-- BEGIN SIDEBAR TOGGLER BUTTON -->'
         +     '<div class="sidebar-toggler"></div>'
         +     '<!-- END SIDEBAR TOGGLER BUTTON -->'
         +  '</li>';

      return Menu;

   })();

   AdminLib.Menu.Element                          = (function() {

      function Element(parameters, parent) {

         this.parent        = parent instanceof AdminLib.Menu ? undefined : parent;
         this.menu          = parent.menu;
         this.activeElement = undefined;
      };

      /**
       * @protected
       */
      Element.prototype.buildDOM                 = function buildDOM() {
         throw 'Abstract method';
      };

      /**
       *
       * @returns {HTMLElement}
       * @public
       */
      Element.prototype.getDOM                   = function getDOM() {
         if (this.dom === undefined)
            this.buildDOM();

         return this.dom;
      };

      /**
       *
       * @returns {AdminLib.Menu}
       * @public
       */
      Element.prototype.getMenu                  = function getMenu() {
         return this.menu;
      };

      /**
       *
       * @returns {AdminLib.Menu~Element}
       * @public
       */
      Element.prototype.getParent                   = function getParent() {
         return this.parent;
      };

      return Element;

   })();

   AdminLib.Menu.Entry                            = (function() {

      /**
       *
       * @param parameters
       * @param {AdminLib.Menu|AdminLib.Menu.SubMenu} parent
       * @constructor
       * @property {string|function}                   handler
       * @property {string}                            icon
       * @property {string}                            label
       * @property {AdminLib.Menu}                      menu
       * @property {string}                            page
       * @property {AdminLib.Menu|AdminLib.Menu.SubMenu} parent
       */
      function Entry(parameters, parent) {

         var /** @type {AdminLib.Menu} */ menu;

         AdminLib.Menu.Element.call(this, parameters, parent);

         this.icon    = parameters.icon;
         this.handler = parameters.handler;
         this.label   = parameters.label;
         this.link    = parameters.link;
         this.page    = parameters.page;

         declareEntry(this);
      };

      Entry.prototype                            = Object.create(AdminLib.Menu.Element.prototype);
      Entry.prototype.constructor                = Entry;

      /**
       *
       * @param {boolean} [executeHandler=true]
       * @public
       */
      Entry.prototype.activate                   = function activate(executeHandler) {
         this.getMenu().activateElement(this, executeHandler);
      };

      /**
       * Build the DOM of the entry
       * @private
       */
      Entry.prototype.buildDOM                   = function buildDOM() {

         this.dom = AdminLib.dom.build(template, this);

         this.dom.querySelector('a').addEventListener('click', this.onclick.bind(this));

         if (this.handler !== undefined) {

            this.dom.querySelector('a').addEventListener('click', function() {
               this.activate();
            }.bind(this));

         }

      };

      /**
       * Execute the handler of the entry
       * @public
       */
      Entry.prototype.executeHandler             = function executeHandler() {

         var /** @type {AdminLib.Page} */ page
           , /** @type {Promise}      */ promise;

         if (this.handler)

            promise = Promise.resolve(true).then(function() {
               this.handler()
            }.bind(this));

         else {

            page = this.getPage();

            if (page === undefined)
               throw 'No handler defined';


            promise = Promise.resolve(true).then(function() {
               page.display();
            });

         }

         return promise;
      };

      /**
       * @returns {AdminLib.Page}
       * @public
       */
      Entry.prototype.getPage                    = function getPage() {

         var /** @type {AdminLib.Page} */ page;

         if (this.page === undefined)
            return undefined;

         page = AdminLib.page.get(this.page);

         if (page === undefined)
            throw AdminLib.error('The page hasn\'t been declared');

         return page;
      };

      /**
       *
       * @returns {string}
       * @public
       */
      Entry.prototype.getPageCode                = function getPageCode() {
         return this.page;
      };

      /**
       * @private
       */
      Entry.prototype.onclick                    = function onclick(event) {
         this.activate();

         event.preventDefault();
         event.stopImmediatePropagation();

      };

      /**
       *
       * @param {boolean} activate
       * @internal
       */
      Entry.prototype.setActive                  = function setActive(activate) {
         this.getDOM().classList.toggle('active', activate);
      };

      var template =
               '<li class="entry {{class}}">'
            +     '<a href="#" {{#link}} target="{{link}}" {{/link}}><i class="{{icon}}"></i> {{{label}}}</a>'
            +  '</li>';

      var pages = {};

      /**
       *
       * @param {AdminLib.Menu.Entry} entry
       */
      function declareEntry(entry) {
         var /** @type {string} */ menu
           , /** @type {string} */ page;

         if (entry.getPageCode() === undefined)
            return;

         menu = entry.getMenu().getCode();

         if (!pages[menu])
            pages[menu] = {};

         page = entry.getPageCode();

         if (pages[menu][page])
            throw 'The page is already defined for this menu entry';

         pages[menu][page] = entry;
      };

      /**
       * Return the entry corresponding to the given page
       * @param {string|AdminLib.Page} page
       * @param {string|AdminLib.Menu} menu
       * @returns {AdminLib.Menu.Entry}
       * @public
       */
      function getEntry(page, menu) {

         if (page instanceof AdminLib.Page)
            page = page.getCode();

         if (menu instanceof AdminLib.Menu)
            menu = menu.getCode();

         if (pages[menu] === undefined)
            return undefined;

         return pages[menu][page];
      };

      Entry.getEntry = getEntry;

      return Entry;
   })();

   AdminLib.Menu.SubMenu                          = (function() {

      function SubMenu(parameters, parent) {

         var /** @type {AdminLib.Menu.Entry|AdminLib.Menu} */ entry
           , /** @type {Object}                          */ entryParameters;

         AdminLib.Menu.Element.call(this, parameters, parent);

         this.class         = parameters.class;
         this.label         = parameters.label;
         this.entries       = [];
         this.activated     = false;
         this.activeElement = undefined;

         for(entryParameters of parameters.entries) {
            entry = getMenuEntry(entryParameters, this);
            this.entries.push(entry);
         }

      };

      SubMenu.prototype                          = Object.create(AdminLib.Menu.Element.prototype);
      SubMenu.prototype.constructor              = SubMenu;

      SubMenu.prototype.activate                 = function activate() {
         this.getMenu().activate(this);
      };

      /**
       * Build the dom of the sub menu
       * @private
       */
      SubMenu.prototype.buildDOM                 = function buildDOM() {

         var entry
           , /** @type {HTMLElement} */ ul;

         this.dom = AdminLib.dom.build(template, this, 'UL');
         this.dom.querySelector('a').addEventListener('click', this.toggle.bind(this));

         this.ul = this.dom.querySelector('ul');

         for(entry of this.entries) {
            this.ul.appendChild(entry.getDOM());
         }

      };

      /**
       * Collapse the sub menu
       * @public
       */
      SubMenu.prototype.collapse                 = function collapse() {
         this.toggle(false);
      };

      /**
       * Expand the menu
       * @public
       */
      SubMenu.prototype.expand                   = function expand() {

         var parent;

         this.toggle(true);

         parent = this.getParent();

         if (parent !== undefined)
            parent.expand();

      };

      /**
       * Toggle the menu
       * @param {boolean} [open] If true, then expand the menu. If false, then collapse it
       * @public
       */
      SubMenu.prototype.toggle                   = function toggle(open) {
         this.getDOM().classList.toggle('open', open);
      };

      /**
       *
       * @param {boolean} activate
       * @internal
       */
      SubMenu.prototype.setActive                = function setActive(activate) {
         this.getDOM().classList.toggle('active', activate);
      };

      var template =
               '<li class="{{class}}">'
            +     '<a href="javascript:">'
            +        '<i class="{{icon}}"></i>'
            +        '<span class="title"> {{{label}}}</span>'
            +        '<span class="arrow"></span>'
            +     '</a>'
            +     '<ul class="sub-menu">'
            +     '</ul>'
            +  '</li>';

      return SubMenu;

   })();

   AdminLib.Menu.Heading                          = (function() {

      /**
       *
       * @param {Object} parameters
       * @param {AdminLib.Menu|AdminLib.Menu.SubMenu} parent
       * @constructor
       * @extends {AdminLib.Menu.Element}
       */
      function Heading(parameters, parent) {
         AdminLib.Menu.Element.call(this, parameters, parent);
         this.title = parameters.title;
      };

      Heading.prototype                          = Object.create(AdminLib.Menu.Element.prototype);
      Heading.prototype.constructor              = Heading;

      Heading.prototype.buildDOM                 = function buildDOM() {
         this.dom = AdminLib.dom.build(this, template);
      };

      var template =
               '<li class="heading">'
            +     '<h3 class="uppercase"> {{title}}</h3>'
            +  '</li>';

      return Heading;

   })();

   function getMenuEntry(parameters, parent) {
      var /** @type {Object} */ menuItem

      if (parameters.page !== undefined)
         return new AdminLib.Menu.Entry(parameters, parent);

      if (parameters.entries === undefined)
         return new AdminLib.Menu.Heading(parameters, parent);

      return new AdminLib.Menu.SubMenu(parameters, parent);
   };

})();

/**
 * @property {AdminLib.menu.declare}   declare
 * @property {AdminLib.menu.has}       has
 * @property {AdminLib.menu.get}       get
 * @property {AdminLib.Menu.Entry.get} entry
 *
 */
AdminLib.menu = (function() {

   var /** @type {AdminLib.Namespace.<AdminLib.Menu>} */ menus;

   menus = new AdminLib.Namespace( /* itemType            */ AdminLib.Menu
                                , /* acceptUndefined     */ false
                                , /* keyType             */ 'string'
                                , /* acceptUndefinedKeys */ true);

   /**
    * @callback {AdminLib.menu.declare}
    *
    * Declaration :
    *    declareMenu(parameters);
    *    declareMenu(code, parameters);
    *
    * @param {string|AdminLib.Menu.Parameters} param1
    * @param {string}                         [param2]
    * @public
    */
   function declare(param1, param2) {

      var /** @type {string}                  */ code
        , /** @type {AdminLib.Menu}            */ menu
        , /** @type {AdminLib.Menu.Parameters} */ parameters;

      if (typeof(param1) === 'string') {
         code = param1;
         parameters = param2;
      }
      else {
         if (param2 !== undefined)
            throw 'Invalid parameters';

         parameters = param1;
      }

      if (menus.has(code))
         throw 'Menu already declared';

      menu = new AdminLib.Menu(parameters, code);

      menus.add(menu, code);
   };

   /**
    * @name AdminLib.menu.get
    * @callback
    *
    * @param {string} [code]
    * @returns {AdminLib.menu}
    *
    * @public
    */
   function getMenu(code) {
      return menus.get(code, true);
   };

   /**
    * @name AdminLib.menu.has
    * @callback
    * @param {string} [code]
    * @returns {boolean}
    * @public
    */
   function has(code) {
      return menus.has(code);
   };

   getMenu.declare   = declare;
   getMenu.get       = getMenu;
   getMenu.has       = has;

   getMenu.entry     = AdminLib.Menu.Entry.getEntry;
   getMenu.entry.get = AdminLib.Menu.Entry.getEntry;

   return getMenu;

})();