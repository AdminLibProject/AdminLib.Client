'use strict';

AdminLib.widget.TabBar = (function() {

   /**@typedef {Object} TabInformations
    * @property {string}                         code
    * @property {string}                         class
    * @property {Object|Promise|function|string} data
    * @property {function(code:string)}          handler
    * @property {string}                         label
    * @property {string[]}                       modules
    * @property {string[]}                       scripts
    * @property {string[]}                       stylesheets
    * @property {string}                         template
    */

   /**
    *
    * @constructor
    * @class TabBar
    * @property {Tab[]}                 tabs
    * @property {Tab}                   currentTab;
    * @property {Promise.<HTMLElement>} mainDOM
    */
   function TabBar() {
      this.tabs       = [];
      this.currentTab = undefined;
      this.id         = AdminLib.getNewId();
      this.mainDOM    = undefined;
   }

   TabBar.prototype.addTab                       = function(parameters) {
      var /** @type {Tab} */ tab;

      tab = new Tab(this, parameters);
      this.tabs.push(tab);

      this.getListTabDOM().appendChild(tab.getDOM());
   };

   /**
    * Activate the given tab and display it's content
    * @param {string|number} tab
    * @returns {TabBar}
    */
   TabBar.prototype.activate                     = function activate(tab) {

      this.currentTab = this.getTab(tab);
      this.currentTab.activate();
      this.refreshMain();
   };

   TabBar.prototype.buildDOM                     = function() {
      this.dom = AdminLib.dom.build(template, undefined);
      this.listTabDOM = this.dom.querySelector('ul');
   };

   /**
    *
    * @returns {Tab}
    */
   TabBar.prototype.getCurrentTab                = function() {
      return this.currentTab;
   };

   /**
    *
    * @returns {HTMLElement}
    */
   TabBar.prototype.getDOM                       = function() {
      if (this.dom === undefined)
         this.buildDOM();

      return this.dom;
   };

   TabBar.prototype.getListTabDOM                = function() {
      if (this.listTabDOM === undefined)
         this.buildDOM();

      return this.listTabDOM;
   };

   TabBar.prototype.getMain                      = function(refresh) {

      if (this.mainDOM === undefined || refresh)
         this.mainDOM = this.currentTab.buildMain();

      return this.mainDOM;
   };

   /**
    *
    * @param tab
    * @returns {Tab}
    */
   TabBar.prototype.getTab                       = function getTab(tab) {
      if (typeof(tab) === 'number')
         return this.tabs[tab];
   };

   TabBar.prototype.refreshMain                  = function refreshMain() {

      var /** @type {Promise.<HTMLElement>} */ mainDOM;

      this.removeMain();

      mainDOM = this.getMain();

      mainDOM.then(function(mainDOM) {
         this.getDOM().querySelector('.tab-content').appendChild(mainDOM);
      }.bind(this));
   };

   TabBar.prototype.removeMain                   = function() {
      if (this.mainDOM !== undefined)
         this.mainDOM.parentElement.removeChild(this.mainDOM);

      this.mainDOM = undefined;
   };

   TabBar.prototype.reset                        = function() {

      this.currentTab.reset();
      this.currentTab = undefined;
      this.tabs       = [];
      this.mainDOM    = undefined;

      this.dom.parentElement.removeChild(this.dom);
      this.dom = undefined;
   };

   /**
    *
    * @param {HTMLElement|Promise.<HTMLElement>} mainDOM
    */
   TabBar.prototype.setMain                      = function(mainDOM) {
      this.removeMain();

      this.mainDOM = mainDOM;

      if (mainDOM instanceof Promise) {
         return mainDOM.then(this.setMain.bind(this));
      }

      this.dom.querySelector('.tab-content').appendChild(this.mainDOM);
      return Promise.resolve(this.mainDOM);
   };

   /**
    *
    * @param {AdminLib.widget.TabBar} parent
    * @param {TabInformations}       informations
    * @constructor
    * @class Tab
    * @extend  AdminLib.Module
    * @property {string}                class
    * @property {string}                code
    * @property {HTMLElement}           contentDOM
    * @property {DataSource}            data
    * @property {HTMLElement}           dom
    * @property {string}                href
    * @property {Function}              [handler]
    * @property {string}                label
    * @property {AdminLib.widget.TabBar} parent
    */
   function Tab(parent, informations) {

      if (informations.template === undefined)
         throw 'No template defined';

      this.parent      = parent;
      this.code        = informations.code;
      this.label       = informations.label;
      this.class       = informations.class;
      this.handler     = informations.handler;
      this.data        = informations.data;
      this.dom         = undefined;
      this.contentDOM  = undefined;
      this.href        = informations.href;
      this.id          = AdminLib.getNewId();

      // Module informations
      this.modules     = informations.modules;
      this.stylesheets = informations.stylesheets;
      this.scripts     = informations.scripts;
      this.template    = informations.template;
   }

   /**
    * Mark the tab as active
    *
    */
   Tab.prototype.activate                        = function() {

      if (this.parent.getCurrentTab())
         this.parent.getCurrentTab().deactivate();

      this.dom.classList.add('active');
   };

   /**
    * Build the DOM of the tab.
    */
   Tab.prototype.buildDOM                        = function() {
      this.dom = AdminLib.dom.build(templateTab, this);

      this.dom.querySelector('a').addEventListener('click', function(event) {

         if (this.isActive()) {
            event.preventDefault();
            return;
         }


         if (this.handler !== undefined) {
            this.activate();
            this.handler(event);
         }
         else
            this.display();

         event.preventDefault();

      }.bind(this));
   };

   /**
    *
    * @returns {Promise<HTMLElement[]>}
    */
   Tab.prototype.buildMain                       = function buildMain() {
      var /** @type {Promise[]} */ promises;

      promises = [ AdminLib.loadTemplate(this.template)
                 , AdminLib.loadData(this.data)
                 , AdminLib.loadModule(this.modules)];

      // If a "proceed data" function has been provided, we apply it to the Promise returning the data
      if (this.proceedData)
         promises[1].then(this.proceedData);

      return Promise.all(promises).then(AdminLib.dom.build);
   };

   /**
    * Diactivate the tab : the tab is no longer marked as active
    */
   Tab.prototype.deactivate                      = function() {
      this.dom.classList.remove('active');
   };

   /**
    * Display the tab.
    * The function will first activate the tab. Then, it will load the content template, the content data and all dependencies.
    *
    */
   Tab.prototype.display                         = function() {

      var /** @type {Promise[]} */ promises;

      this.activate();


      // Loading the template, the data and all dependencies
      promises = [ AdminLib.loadTemplate(this.template)
                 , AdminLib.loadData(this.data)
                 , AdminLib.loadModule(this)];

      Promise.all(promises)
         .then(AdminLib.dom.build)
         .then(function(dom) {
            AdminLib.StandardPage.setMain(dom);

            this.contentDOM = dom;

            this.parent.currentTab = this;
         }.bind(this));

   };

   Tab.prototype.isActive                        = function isActive() {
      return this.dom.classList.contains('active');
   };

   /**
    * Reset the tab.
    * Reseting consist for now to simply to destroy the content dom;
    *
    */
   Tab.prototype.reset                           = function() {

      if (this.contentDOM.parentElement !== undefined && this.contentDOM.parentElement !== null)
         this.contentDOM.parentElement.removeChild(this.contentDOM);

      this.contentDOM = undefined;
   };


   /**
    *
    * @returns {HTMLElement}
    */
   Tab.prototype.getDOM                          = function() {
      if (this.dom === undefined)
         this.buildDOM();

      return this.dom;
   };

   var template =
         '<div class="col-md-12">'
      +     '<div class="tabbable-custom">'
      +        '<ul class="nav nav-tabs"></ul>'
      +        '<div class="tab-content"></div>'
      +     '</div>'
      +  '</div>';

   var templateTab =
         '<li class="" data-code="{{code}}">'
      +     '<a href="{{href}}" data-toggle="tab">'
      +        '{{label}}'
      +        '{{#badges}}'
      +           '<span class="badge {{class}}">'
      +              '{{label}}'
      +           '</span>'
      +        '{{/badges}}'
      +        '{{#tags}}'
      +           '<span class="label label-sm label-{{type}} {{class}}">'
      +              '{{label}}'
      +           '</span>'
      +        '{{/tags}}'
      +     '</a>'
      +  '</li>';

   return TabBar;

})();