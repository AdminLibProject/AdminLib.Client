'use strict';

AdminLib.widget.Modal.Datatable = (function() {

   /**
    * @name AdminLib.widget.Modal.Datatable
    * @extends {AdminLib.widget.Datatable}
    * @memberof AdminLib.widget
    * @namespace AdminLib.widget.Modal.Datatable
    *
    * @param {AdminLib.widget.Modal.Datatable.Parameters} parameters
    * @constructor
    */
   function Modal(parameters) {

      parameters = Modal.Datatable.coalesceParameters([parameters]);

      this.modalDatable_tableActions = parameters.tableActions;
      parameters.tableActions = [];

      AdminLib.widget.Datatable.call(this, parameters);

      this.title = parameters.title;

      this.modal = new AdminLib.widget.Modal({ buttons : parameters.buttons
                                            , message : this.getDOM()
                                            , title   : this.title});
   };

   Modal.prototype                               = Object.create(AdminLib.widget.Datatable.prototype);
   Modal.prototype.constructor                   = Modal;

   /**
    * Add a button to the modal
    *
    * @param {AdminLib.Action.Button.Parameter} actionButton
    * @returns {AdminLib.element.Button} Created button
    *
    * @public
    */
   Modal.prototype.addButton                     = function addButton(parameters) {
      return this.modal.addButton(parameters);
   };

   /**
    * Display the modal
    * @returns {Promise}
    */
   Modal.prototype.displayModal                  = function show() {
      return this.modal.display(this);
   };

   /**
    * Return the modal button corresponding to the information
    *
    * @param {string|number} button
    * @returns {AdminLib.element.Button}
    *
    * @public
    */
   Modal.prototype.getButton                     = function getButton(info) {
      return this.modal.getButton(info);
   };

   /**
    * Return all buttons of the modal
    *
    * @returns {AdminLib.element.Button[]}
    *
    * @public
    */
   Modal.prototype.getButtons                    = function getButtons() {
      return this.modal.getButtons();
   };

   /**
    * Hide the modal.
    *
    * @public
    */
   Modal.prototype.hideModal                     = function closeModal() {
      return this.modal.hide();
   };

   /**
    * Remove the given button
    *
    * @param {WidgetButtoon|string|number} button Button to remove
    * @returns {AdminLib.element.Button}
    */
   Modal.prototype.removeButton                  = function removeButton(button) {
      return this.modal.removeButton(button);
   };

   /**
    * Hide the modal.
    *
    * @public
    */
   Modal.prototype.hide                          = function hide() {
      return this.modal.hide();
   };

   /**
    *
    * @param {AdminLib.widget.Modal.Parameters[]} parametersList
    * @returns {AdminLib.widget.Modal.Parameters}
    */
   Modal.coalesceParameters                      = function coalesceParameters(parametersList) {

      var /** @type {AdminLib.widget.Modal.Parameters} */ coalescedParameters;

      coalescedParameters = AdminLib.widget.Datatable.coalesceParameters(parametersList);

      coalescedParameters.title = AdminLib.coalesceAttribute('title', parametersList);

      return coalescedParameters
   };

   return Modal;

})();