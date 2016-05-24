'use strict';

AdminLib.widget.Portlet                           = (function() {

   /**
    *
    * @param {AdminLib.widget.Portlet.Parameters} parameters
    * @constructor
    * @property {DOMTokenList}       classList             Class of the widget
    * @property {HTMLElement}        contentDOM
    * @property {function}           disposeFunction
    * @property {function}           disposeWidgetFunction Dispose function of the currently added widget
    * @property {HTMLElement}        dom
    * @property {string}             font
    * @property {string}             icon
    * @property {boolean}            isLoading             Indicate if the portlet appear as loading (true) or not (false)
    * @property {string}             title
    * @property {AdminLib.Collection} widgets
    */
   function Portlet(parameters) {

      AdminLib.EventTarget.call(this);

      parameters = Portlet.coalesceParameters([parameters]);

      this.classes         = parameters.classes;
      this.collapse        = parameters.collapse;
      this.collapsed       = parameters.collapse.startCollapsed;
      this.disposeFunction = parameters.dispose;
      this.font            = parameters.font;
      this.icon            = parameters.icon;
      this.loading         = parameters.loading;
      this.sizeClass       = parameters.sizeClass;
      this.title           = parameters.title;
      this.widgets         = new AdminLib.Collection(AdminLib.element.Button);
      this.disposeList     = [];

      Object.defineProperty(this, 'classList', {get : function() {
                                                         return this.getDOM().classList
                                                      }.bind(this)});

      for(var button of parameters.buttons) {
         this.addButton(button);
      }

   }

   Portlet.prototype                             = Object.create(AdminLib.EventTarget.prototype);
   Portlet.prototype.constructor                 = Portlet;

   /**
    * Add a button to the action bar.
    *
    * If button parameter is a AdminLib.Action.Button.Parameter
    * then the action will receive as first parameter the portlet
    *
    * @param {AdminLib.Action.Button|AdminLib.Action.Button.Parameter} widget
    * @param {boolean} [prepend=false]
    * @return {AdminLib.element.Button}
    *
    * @public
    */
   Portlet.prototype.addButton                   = function addButton(widget, prepend) {

      prepend = AdminLib.coalesce(prepend, false);

      if (!(widget instanceof AdminLib.element.Button)) {

         if (widget.action) {
            widget        = AdminLib.clone(widget); // We don't modify the original widget object
            widget.action = widget.action.bind(widget, this);
         }


         widget = new AdminLib.element.Button(widget, this.widgets);
      }

      this.addWidget(widget, prepend);

      return widget;
   };

   /**
    * Add a content to the portlet. The content will be added after the previous ones.
    *
    * @param {AdminLib.DomLike} content
    * @param {Object}          parameters
    *
    * @public
    */
   Portlet.prototype.addContent                  = function addContent(content, parameters) {

      var /** @type {HTMLElement} */ dom;

      parameters = { autoDispose : AdminLib.coalesceAttribute('autoDispose', [parameters], true)};

      if (content === undefined || content === null)
         throw 'No content provided';

      if (typeof(content.getDOM) === 'function') {
         this.addContent(content.getDOM(), parameters);

         if (parameters.autoDispose)
            this.disposeList.push(content);

         return;
      }

      AdminLib.appendElement ( /* parentDOM */ this.getContentDOM()
                            , /* childDOM  */ content);

   };

   /**
    * Add a dropdown to the action bar
    *
    * @param {AdminLib.widget.Dropdown|AdminLib.widget.Dropdown.Parameters} widget
    * @return {AdminLib.widget.Dropdown}
    *
    * @public
    */
   Portlet.prototype.addDropdown                 = function addDropdown(widget) {
      if (!(widget instanceof AdminLib.widget.Dropdown)) {
         widget = new AdminLib.widget.Dropdown(widget);
      }

      this.addWidget(widget);

      return widget;
   };

   /**
    * Add a widget to the portlet action bar.
    *
    * @param {AdminLib.Widget} widget
    * @param {boolean}        [prepend=false]
    * @return {AdminLib.Widget} Added widget
    *
    * @public
    */
   Portlet.prototype.addWidget                   = function addAction(widget, prepend) {

      prepend = AdminLib.coalesce(prepend, false);

      if (prepend)
         this.widgets.unshift(widget);
      else
         this.widgets.push(widget);

      if (!this.dom)
         return;

      this.addWidgetToDOM(widget, prepend);

      return widget;
   };

   /**
    * Add a widget (e.g : AdminLib.element.Button) to the action bar.
    *
    * @param {AdminLib.Widget} widget
    * @param {boolean}        prepend
    *
    * @private
    */
   Portlet.prototype.addWidgetToDOM              = function addButtonToDOM(widget, prepend) {

      if (prepend)
         $(this.actionBar).prepend(widget.getDOM());
      else
         $(this.actionBar).append(widget.getDOM());

   };

   /**
    * Build the DOM of the portlet
    *
    * @private
    */
   Portlet.prototype.buildDOM                    = function() {

      this.dom        = AdminLib.dom.build(template, this);

      this.headerDOM  = this.dom.querySelector('.portlet-title');
      this.bodyDOM    = this.dom.querySelector('.portlet-body');
      this.actionBar  = this.dom.querySelector('.actions');
      this.contentDOM = AdminLib.dom.build('<div class="row"></div>');

      this.dom.querySelector('.portlet-body').appendChild(this.contentDOM);

      if (this.collapse.header && this.collapse.enabled) {

         this.headerDOM.addEventListener('click', function(event) {
            this.toggleCollapse();
         }.bind(this));

      }

      this.widgets.forEach(this.addWidgetToDOM.bind(this));

      if (this.loading) {
         this.loading = false;
         this.displayLoader();
      }

   };

   /**
    *
    * Collapse the portlet.
    * The function will fire two events :
    *    - AdminLib.widget.Portlet.event.collapse
    *    - AdminLib.widget.Portlet.event.collapsed
    *
    * The collapse will not be executed if the portlet is already collapsed or if the event
    * AdminLib.widget.Portlet.event.collapse is prevented
    *
    * @returns {boolean} Indicate if the collapse has been executed (true) or not (false).
    * @public
    */
   Portlet.prototype.collapse                    = function collapse() {
      return this.toggleCollapse(true);
   };

   /**
    * Display the portlet as loading
    * @public
    */
   Portlet.prototype.displayLoader               = function displayLoader(parameters) {
      this.toggleLoader(AdminLib.coalesce(parameters, true));
   };

   /**
    * @public
    */
   Portlet.prototype.dispose                     = function dispose() {

      var /** @type {Object} */ disposeObject;

      if (this.disposeFunction)
         this.disposeFunction();

      for(disposeObject of this.disposeList) {
         disposeObject.dispose();
      }

      this.disposeList = [];
   };

   /**
    * Remove all contents of the DOM
    *
    * @public
    */
   Portlet.prototype.empty                       = function empty() {

      if (!this.contentDOM)
         return;

     AdminLib.list.forEach(this.contentDOM.children, function(dom) {
         this.contentDOM.removeChild(dom);
      }.bind(this));

   };

   /**
    *
    * Expand the portlet.
    * The function will fire two events :
    *    - AdminLib.widget.Portlet.event.expand
    *    - AdminLib.widget.Portlet.event.expanded
    *
    * The expand will not be executed if the portlet is already expand or if the event
    * AdminLib.widget.Portlet.event.expand is prevented
    *
    * @returns {boolean} Indicate if the expand has been executed (true) or not (false).
    * @public
    */
   Portlet.prototype.expand                      = function expand() {
      return this.toggleCollapse(false);
   };

   /**
    * Return the content of the portlet
    * @returns {HTMLElement}
    *
    * @private
    */
   Portlet.prototype.getContentDOM               = function getContentDOM() {
      if (this.contentDOM === undefined)
         this.buildDOM();

      return this.contentDOM;
   };

   /**
    * Return the DOM of the portlet
    *
    * @returns {HTMLElement}
    *
    * @public
    */
   Portlet.prototype.getDOM                      = function getDOM() {
      if (this.dom === undefined)
         this.buildDOM();

      return this.dom;
   };

   /**
    * Return the widget corresponding to the informations
    *
    * @param {string|number} info
    * @returns {AdminLib.Widget}
    *
    * @public
    */
   Portlet.prototype.getWidget                   = function getWidget(info) {
      return this.widgets.get(info);
   };

   /**
    * Return all widgets
    * @returns {AdminLib.Widget}
    *
    * @public
    */
   Portlet.prototype.getWidgets                  = function getWidget() {
      return this.widgets.getAll();
   };

   /**
    * Display the portlet as not loading
    * @public
    */
   Portlet.prototype.removeLoader                = function removeLoader() {
      this.toggleLoader(false);
   };

   /**
    *
    * @param {AdminLib.Widget|string} widget
    */
   Portlet.prototype.removeWidget                = function removeWidget(widget) {

      var /** @type {HTMLElement} */ dom;

      if (!(widget instanceof AdminLib.Widget))
         widget = this.getWidget(widget);

      dom = widget.getDOM();

      dom.parentElement.removeChild(dom);
      this.widgets.remove(widget);
   };

   /**
    *
    * Apply the querySelector function to the content DOM and return the result
    *
    * @returns {HTMLElement}
    *
    * @public
    */
   Portlet.prototype.querySelector               = function querySelector() {
      return this.contentDOM.querySelector.apply(this.contentDOM, arguments);
   };

   /**
    * Apply the querySelectorAll function to the content DOM and return the result
    * @returns {NodeList}
    *
    * @public
    */
   Portlet.prototype.querySelectorAll            = function querySelectorAll() {
      return this.contentDOM.querySelectorAll.apply(this.contentDOM, arguments);
   };

   /**
    * Define the content as the portlet. The portlet will first be emptied.
    *
    * Note that if you provide a widget (such as a datatbale), then the portlet
    * will automatically call the dispose function of the widget when the portlet
    * is disposed (unless you already have provided a "dispose" function).
    *
    * If the previous content was a widget (such as a datatable), then it's dispose
    * function WILL NOT be called.
    *
    * @param {AdminLib.AsyncDOMLike} content
    * @param {Object}              [parameters]
    *
    * @public
    */
   Portlet.prototype.setContent                  = function setContent(content, parameters) {

      var /** @type {Object}          */ disposeObject
        , /** @type {AdminLib.DomLike} */ dom;

      parameters = { autoDispose : AdminLib.coalesceAttribute('autoDispose', [parameters], true)};

      AdminLib.dom.empty(this.getContentDOM());

      this.contentPromise        = undefined;
      this.disposeWidgetFunction = undefined;

      for(disposeObject of this.disposeList) {
         // We do not dispose the current content object
         if (disposeObject === content)
            continue;

         disposeObject.dispose();
      }

      this.disposeList = [];

      // HTMLElement
      if (content instanceof HTMLElement)
         dom = content;

      // Promise
      else if (content instanceof Promise) {

         this.contentPromise = content;

         content.then(function(contentToAdd) {

            // If another content has been defined, then we do not apply the content
            if (this.contentPromise !== content)
               return;

            this.setContent(contentToAdd, parameters.autoDispose);

         }.bind(this));

         return;
      }

      // getDOM
      else if (typeof(content.getDOM) === 'function') {

         this.setContent(content.getDOM());

         if (parameters.autoDispose)
            this.disposeList.push(content);

         return;
      }

      // string
      else if (typeof(content) === 'string')
         dom = AdminLib.dom.build(dom);

      else
         throw 'Not a valid dom object';

      this.getContentDOM().appendChild(dom);
   };

   /**
    * Set the new size class of the portlet
    * @param {string} sizeClass
    * @public
    */
   Portlet.prototype.setSizeClass                = function setSizeClass(sizeClass) {

      if (this.dom) {
         this.classList.remove(this.sizeClass);
         this.classList.add(sizeClass)
      }

      this.sizeClass = sizeClass;
   };

   /**
    *
    * @param {string} title
    * @public
    */
   Portlet.prototype.setTitle                    = function setTitle(title) {

      var /** @type {HTMLElement} */ newCaption
        , /** @type {HTMLElement} */ oldCaption;

      this.title = title;

      if (this.dom === undefined)
         return;

      newCaption = AdminLib.dom.build(templateCaption, this);
      oldCaption = this.dom.querySelector('.portlet-title > .caption');

      oldCaption.parentElement.replaceChild(newCaption, oldCaption);
   };

   /**
    * @param {boolean} [collapsed]
    * @returns {boolean} Indicate if the action has been performed (true) or not (false).
    * @public
    */
   Portlet.prototype.toggleCollapse              = function toggleCollapse(collapsed) {

      var /** @type {AdminLib.Event} */ event;

      collapsed = !!AdminLib.coalesce(collapsed, !this.collapsed);

      if (collapsed === this.collapsed)
         return false;

      // Event : collpse/expand
      event = new AdminLib.Event( collapsed ? Portlet.event.collapse : Portlet.event.expand
                               , { cancelable : true
                                 , target     : this });

      this.dispatchEvent(event);

      if (event.defaultPrevented)
         return false;
      // End event

      this.collapsed = collapsed;

      this.bodyDOM.classList.toggle('collapse', this.collapsed);

      // Event : collpsed/expanded
      event = new AdminLib.Event( collapsed ? Portlet.event.collapsed : Portlet.event.expanded
                               , { cancelable : false
                                 , target     : this });

      this.dispatchEvent(event);
      // End event

      return true;
   };

   /**
    *
    * @param {boolean} [loading]
    * @public
    */
   Portlet.prototype.toggleLoader                = function toggleLoading(loading) {

      loading = !!AdminLib.coalesce(loading, !this.loading);

      if (this.loading === loading)
         return;

      this.loading = loading;

      if (!this.dom)
         return;

      AdminLib.Loader.toggle(this.dom, this.loading);
   };

   /**
    *
    * @param {AdminLib.widget.Portlet.Parameters[]} parametersList
    * @returns {AdminLib.widget.Portlet.Parameters}
    * @public
    */
   Portlet.coalesceParameters                    = function coalesceParameters(parametersList) {

      var /** @type {AdminLib.widget.Portlet.Parameters} */ coalescedParameters;

      coalescedParameters = { buttons        : AdminLib.coalesceAttribute('buttons'       , parametersList, []).slice(0)
                            , classes        : AdminLib.coalesceAttribute('classes'       , parametersList)
                            , collapsed      : AdminLib.coalesceAttribute('collapsed'     , parametersList, false)
                            , font           : AdminLib.coalesceAttribute('font'          , parametersList, 'font-red-sunglo bold')
                            , headerCollapse : AdminLib.coalesceAttribute('headerCollapse', parametersList, false)
                            , icon           : AdminLib.coalesceAttribute('icon'          , parametersList)
                            , loading        : AdminLib.coalesceAttribute('loading'       , parametersList, false)
                            , sizeClass      : AdminLib.coalesceAttribute('sizeClass'     , parametersList, 'col-md-12')
                            , title          : AdminLib.coalesceAttribute('title'         , parametersList) };

      coalescedParameters.collapse = Portlet.coalesceCollapseParameters(AdminLib.list.attribute('collapse', parametersList, false))

      for(var b in coalescedParameters.buttons) {
         if (coalescedParameters.buttons[b] instanceof AdminLib.element.Button)
            continue;

         coalescedParameters.buttons[b] = new AdminLib.element.Button(coalescedParameters.buttons[b]);
      }

      return coalescedParameters;
   };

   /**
    *
    * @param {AdminLib.widget.Portlet.Collapse} parametersList
    * @public
    */
   Portlet.coalesceCollapseParameters            = function coalesceCollapseParameters(parametersList) {

      var /** @type {AdminLib.widget.Portlet.Collapse} */ coalescedParameters;

      parametersList = parametersList.map(function(parameters) {
         if (typeof(parameters) === 'boolean')
            return { enabled : parameters};

         return parameters;
      });

      coalescedParameters = { enabled        : AdminLib.coalesceAttribute('enabled'       , parametersList, true)
                            , header         : AdminLib.coalesceAttribute('header'        , parametersList, true )
                            , startCollapsed : AdminLib.coalesceAttribute('startCollapsed', parametersList, false)};

      return coalescedParameters;

   };

   Portlet.widget = { fullscreenButton : 'AdminLib.widget.protlet.widget.fullScreenButton' };

   Portlet.event = { collapse  : 'collapse'
                   , collapsed : 'collapsed'
                   , expand    : 'expand'
                   , expanded  : 'expanded'};


   var templateCaption =
         '<div class="caption">'
      +     '{{#icon}}<i class="{{icon}} {{font}}"></i>{{/icon}}'
      +     '<span class="{{font}} bold uppercase">{{title}}</span>'
      +  '</div>';

   var template =
         '<div class="portlet {{classes}} {{sizeClass}} {{#collapse}}{{#enabled}}collapsable{{/enabled}}{{/collapse}}"'
      +      ' data-AdminModule="portlet">'
      +     '<div class="portlet-title">'
      +        templateCaption
      +        '<div class="actions"></div>'
      +     '</div>'
      +     '<div class="portlet-body {{#collapsed}}collapse{{/collapsed}}"></div>'
      +  '</div>';

   return Portlet;
})();