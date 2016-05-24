'use strict';

AdminLib.widget.Modal = (function() {

   /**
    * @name AdminLib.widget.Modal
    * @class
    * @extend AdminLib.EventTarget
    * @param {AdminLib.widget.Modal.Parameters} parameters
    * @constructor
    * @property {Object.<AdminLib.element.Button>} buttons
    * @property {HTMLElement}      dom
    * @property {HTMLElement}      domFooter
    * @property {HTMLElement}      domBody
    * @property {boolean}          fullwidth
    * @property {DOMMessageString} message
    * @property {HTMLElement}      messageDOM
    * @property {HTMLElement}      modal
    * @property {Promise}          promise TODO : not usefull
    * @property {string}           title
    */
   function Modal(parameters) {

      var /** @type {number} */ b
        , buttonParameters;

      AdminLib.EventTarget.call(this);

      parameters = Modal.coalesceParameters([parameters]);

      this.buttons          = new AdminLib.Collection(AdminLib.element.Button);
      this.fullwidth        = parameters.fullwidth;
      this.message          = parameters.message instanceof HTMLElement ? '' : parameters.message;
      this.messageDOM       = parameters.message instanceof HTMLElement ? parameters.message : '';
      this.returnLabel      = parameters.returnLabel;
      this.title            = parameters.title;
      this.displayed        = false;
      this.pages            = [];

      // Property : buttons
      for(buttonParameters of parameters.buttons) {
         this.addButton(buttonParameters);
      }

   }

   Modal.prototype                               = Object.create(AdminLib.EventTarget.prototype);
   Modal.prototype.constructor                   = Modal;

   /**
    *
    */
   Modal.prototype.addPage                       = function addPage() {

      var /** @type {Object}   */ currentPage
        , /** @type {NodeList} */ allPages;

      currentPage = { buttons : this.buttons.clone() };

      // Removing all buttons of the page
      this.buttons.forEach(this.removeButton.bind(this));

      this.pages.push(currentPage);

      allPages = this.domBody.querySelectorAll(':scope > .page');

      for(var i=0; i < allPages.length; i++) {
         allPages[i].classList.add('hide');
      }

      this.domBody.appendChild(AdminLib.dom.div(['page', 'row']));

      this.returnLink.classList.remove('hide');
   };

   /**
    * @param {AdminLib.element.Button|AdminLib.element.Button.Parameter} button
    * @returns {AdminLib.element.Button} Created button
    *
    */
   Modal.prototype.addButton                     = function addButton(button) {

      if (!(button instanceof AdminLib.element.Button))
         button = new AdminLib.element.Button(button, this.buttons);

      this.buttons.push(button);

      // Adding the button to the DOM
      if (this.dom)
         this.domFooter.appendChild(button.getDOM());

      return button;
   };

   /**
    * Build the modal.
    *
    * @protected
    */
   Modal.prototype.buildDOM                      = function buildDOM() {

      var /** @type {number} */ b
        , /** @type {AdminLib.element.Button} */ button;

      this.displayed  = false;
      this.dom        = AdminLib.dom.build(AdminLib.getTemplate('widget.modal'), this);
      this.domFooter  = this.dom.querySelector('.modal-footer');
      this.domBody    = this.dom.querySelector('.modal-body');
      this.returnLink = this.domBody.querySelector(':scope > #returnButton');

      this.returnLink.querySelector('a').addEventListener('click', function() {
         this.removePage();
         return false;
      }.bind(this));

      if (this.messageDOM)
         this.dom.querySelector('.modal-body .page').appendChild(AdminLib.bs.row(this.messageDOM));

      // Listening event : show.bs.modal
      $(this.dom).on('show.bs.modal',  this.ondisplay.bind(this));

      // Listening event : shown.bs.modal
      $(this.dom).on('shown.bs.modal',  this.ondisplayed.bind(this));

      // Listening event : hide.bs.modal
      $(this.dom).on('hide.bs.modal', this.onhide.bind(this));

      // Listening event : hidden.bs.modal
      $(this.dom).on('hidden.bs.modal',  this.onhidden.bind(this));

      // Adding buttons
      for(button of this.buttons) {
         this.domFooter.appendChild(button.getDOM());
      }

   };

   /**
    * Display the modal
    *
    * @public
    */
   Modal.prototype.display                       = function display() {

      var /** @type {AdminLib.Event} */ event;

      if (this.displayed)
         return true;

      if (this.dom === undefined)
         this.buildDOM();

      $(this.dom).modal('show');

      return this.displayed;
   };

   /**
    * Empty the content of the modal
    *
    * @public
    */
   Modal.prototype.empty                         = function empty() {

      if (this.domBody === undefined)
         this.buildDOM();

     AdminLib.list.forEach(this.domBody.children, function(dom) {

         if (dom === this.returnLink)
            return;

         this.domBody.removeChild(dom);
      }.bind(this));

      this.domBody.appendChild(AdminLib.dom.div(['page', 'row']));

      this.refreshDOM();
   };

   /**
    * Return the button corresponding to the information
    *
    * @param {string|number} info
    * @returns {AdminLib.element.Button}
    *
    * @public
    */
   Modal.prototype.getButton                     = function getButton(info) {
      return this.buttons.get(info);
   };

   /**
    * Return all buttons of the modal
    *
    * @returns {AdminLib.element.Button[]}
    *
    * @public
    */
   Modal.prototype.getButtons                    = function getButtons() {
      return this.buttons.getAll();
   };

   Modal.prototype.getReturnLink                 = function getReturnLink() {
      return this.returnLink;
   };

   /**
    * Hide the modal.
    * Forced hidding can't be cancelled by events.
    * @public
    */
   Modal.prototype.hide                          = function hide() {

      if (!this.displayed)
         return true;

      if (this.isEventRunning(Modal.event.hide) || this.isEventRunning(Modal.event.hidden))
         return;

      $(this.dom).modal('hide');

      return !this.displayed;
   };

   /**
    * Triggered before the modal is displayed
    * @param {Event} onDisplayEvent
    * @private
    */
   Modal.prototype.ondisplay                     = function ondisplay(onDisplayEvent) {

      var /** @type {AdminLib.Event} */ event;

      // Firering event : hide
      event = new AdminLib.Event ( AdminLib.widget.Modal.event.display
                                , { cancellable : true
                                  , target      : this });

      this.dispatchEvent(event);

      if (event.defaultPrevented)
         onDisplayEvent.preventDefault();

      this.displayed = true;

      // end event : hide
   };

   /**
    * Triggered once the modal is displayed
    * @private
    */
   Modal.prototype.ondisplayed                   = function ondisplayed() {

      var /** @type {AdminLib.Event} */ event;

      // Firering event : hide
      event = new AdminLib.Event ( AdminLib.widget.Modal.event.displayed
                                , { cancellable : false
                                  , target      : this });

      this.dispatchEvent(event);

      // end event : hide
   };

   /**
    * Triggered before the modal is hidden
    * @param {Event} onHideEvent
    * @private
    */
   Modal.prototype.onhide                        = function onhide(onHideEvent) {
      var /** @type {AdminLib.Event} */ event;

      // Firering event : hide
      event = new AdminLib.Event ( AdminLib.widget.Modal.event.hide
                                , { cancellable : AdminLib.coalesce(this.forcedHidding, true)
                                  , target      : this });

      this.dispatchEvent(event);

      if (event.defaultPrevented)
         onHideEvent.preventDefault();
      // end event : hide

      this.displayed = false;
   };

   /**
    * Triggered once the modal is hidden
    * @private
    */
   Modal.prototype.onhidden                      = function onhidden() {
      var /** @type {AdminLib.Event} */ event;

      // Firering event : hidden
      event = new AdminLib.Event ( AdminLib.widget.Modal.event.hidden
                                , { cancellable : false
                                  , target      : this });

      this.dispatchEvent(event);

      // end event : hidden
   };

   /**
    * Update the size of the modal
    * @public
    */
   Modal.prototype.refreshDOM                    = function updateSize() {
      this.dom.style['margin-top'] = '-' + (this.dom.offsetHeight / 2 - 1) + 'px';
   };

   /**
    * Remove the current page and display the previous one.
    * If no previous page, then display nothing
    * @public
    */
   Modal.prototype.removePage                    = function removePage() {

      var /** @type {HTMLElement} */ page
        , /** @type {number}      */ pageNumber;

      pageNumber = this.pages.length + 1;

      // Removing the current page
      page = this.domBody.querySelector(':scope > :nth-child(' + pageNumber + ')');
      page.parentElement.removeChild(page);

      // Removing current buttons
      this.buttons.forEach(this.removeButton.bind(this));

      // If the page was the only one, then we return
      if (pageNumber === 1)
         return;

      // Displaying the previous page
      pageNumber -= 1;

      page = this.domBody.querySelector(':scope > :nth-child(' + pageNumber + ')');
      page.classList.remove('hide');

      // Adding buttons of the previous page
      this.pages.buttons.forEach(function(button) {
         this.addButton(button);
      }.bind(this));

      // If there is no other page, then we hide the "return" link
      if (pageNumber === 1)
         this.returnLink.classList.add('hide');

      this.refreshDOM();

   };

   /**
    * Remove the given button
    *
    * @param {AdminLib.element.Button|string|number} button
    * @return {AdminLib.element.Button} Removed button
    *
    * @public
    */
   Modal.prototype.removeButton                  = function removeButton(button) {

      var /** @type {HTMLElement} */ dom;

      if (!(button instanceof AdminLib.element.Button)) {
         button = this.getButton(button);

         if (button === undefined)
            throw 'Button not found';
      }

      dom = button.getDOM();
      dom.parentElement.removeChild(dom);

      this.buttons.remove(button);


   };

   /**
    * Define the content of the modal.
    * The modal is first emptyied.
    *
    * @param {AdminLib.AsyncDOMLike} content
    * @param {boolean}              [adaptWidget=true]
    * @param {boolean}              autodispose
    *
    * @public
    */
   Modal.prototype.setContent                    = function setContent(content, adaptWidget, autodispose) {

      var closeEvents
        , /** @type {HTMLElement} */ dom
        , widget;

      /*if (typeof(content.getDOM) === 'function') {
         widget = dom;
         dom = dom.getDOM();
      } */

      this.empty();

      this.contentDOM = undefined;
      adaptWidget = AdminLib.coalesce(adaptWidget, true);

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

            this.setContent(contentToAdd, adaptWidget, autodispose);

         });

         return;
      }

      // getDOM
      else if (typeof(content.getDOM) === 'function') {

         if (!this.disposeFunction && autodispose && typeof(content.dispose) === 'function')
            this.disposeWidgetFunction = content.dispose.bind(content);

         dom = content.getDOM();

         this.setContent(dom);

         widget = content;
      }

      this.domBody.querySelector('.page:not(.hide)').appendChild(dom);

      if (adaptWidget && widget) {

         if (typeof(adaptWidget) === 'boolean')
            adaptWidget = { handleButtons : true
                          , hideEvents    : []};

         if (typeof(widget.getButtons) === 'function') {
            widget.getButtons.forEach(function(button) {
               this.addButton(button);
            }.bind(this));
         }

         // Adding hide event listeners
         for(var closeEvent in adaptWidget.closeEvents) {
            widget.addEventListener ( closeEvent
                                    ,  function() {
                                          this.hide();
                                       }.bind(this));
         }

      }

      this.refreshDOM();
   };

   /**
    * @param {AdminLib.widget.Modal.Parameters[]} parametersList
    * @returns {AdminLib.widget.Modal.Parameters}
    */
   Modal.coalesceParameters                      = function coalesceParameters(parametersList) {

      var /** @type {AdminLib.widget.Modal.Parameters} */ coalescedParameters;

      coalescedParameters = { buttons     : AdminLib.coalesceAttribute('buttons'    , parametersList, []).map(b => AdminLib.element.Button.coalesceParameters([b])  )
                            , fullwidth   : AdminLib.coalesceAttribute('fullwidth'  , parametersList, true)
                            , message     : AdminLib.coalesceAttribute('message'    , parametersList)
                            , returnLabel : AdminLib.coalesceAttribute('returnLabel', parametersList, 'return')
                            , title       : AdminLib.coalesceAttribute('title'      , parametersList)};

      return coalescedParameters;
   };

   Modal.event = { display   : 'AdminLib.widget.Modal.event.display'
                 , displayed : 'AdminLib.widget.Modal.event.displayed'
                 , hide      : 'AdminLib.widget.Modal.event.hide'
                 , hidden    : 'AdminLib.widget.Modal.event.hidden' };

   return Modal;
})();