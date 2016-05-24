'use strict';

AdminLib.widget.Datatable.Cell                     = (function() {

   var domAttributes = AdminLib.widget.Datatable._domAttributes;

   /**
    *
    * @param {AdminLib.widget.Datatable.Row}   row
    * @param {AdminLib.widget.Datatable.Field} field
    * @constructor
    * @property {boolean} linkEnabled Indicate if the link of the cell is enabled or not. This property is used only until the tableDOM is created
    */
   function Cell(row, field) {
      this.row       = row;
      this.field     = field;
      this.datatable = row.getDatatable();
   };

   /**
    *
    * @returns {HTMLElement}
    * @public
    */
   Cell.prototype.getDOM                         = function getDOM() {
      if (!this.dom)
         this.dom = this.field.getCellDOM(this.row);

      return this.dom;
   };

   /**
    * Return the Item to wich is linked the row
    * @returns {Item}
    * @public
    */
   Cell.prototype.getItem                        = function getItem() {
      return this.row.getItem();
   };

   /**
    *
    * @returns {boolean}
    * @public
    */
   Cell.prototype.isClicable                     = function isClicable() {
      if (this.clicable !== undefined)
         return this.clicable;

      return this.field.isClicable();
   };

   /**
    * Indicate if the edit mode is enabled for the given cell or not.
    * @public
    */
   Cell.prototype.isEditModeEnabled              = function isEditModeEnabled() {
      if (this.editMode !== undefined)
         return this.editMode;

      if (this.field.isEditModeEnabled())
         return true;

      return this.row.isEditModeEnabled();
   };

   /**
    * Return the current state of the link.
    *
    * Developpment comment :
    *    This function is NOT TO USE ON INITIALISATION of the datatable.
    *    Use instead field.getLink().isEnabled() function.
    *
    * @returns {boolean}
    * @public
    */
   Cell.prototype.isLinkEnabled                  = function isLinkEnabled() {

      if (!this.field.isLinkable())
         throw 'The field has no link defined !';

      // If the tableDOM is not yet created yet, we look for the local value
      if (!this.datatable.tableDOM) {
         if (this.linkEnabled)
            return this.linkEnabled;

         return this.field.getLink().isEnabled(this.row.getItem());
      }

      // If the tableDOM is created, we look for the DOM value
      return this.getDOM().getAttribute(domAttributes.dataset.link.enabled.attribute) === domAttributes.dataset.link.enabled.value.true;
   };

   /**
    * Indicate if the "linkEnabled" is define or not
    * @returns {boolean}
    * @internal
    */
   Cell.prototype.hasCustomLinkEnableProperty    = function hasCustomLinkEnableProperty() {
      return this.linkEnabled !== undefined;
   };

   /**
    *
    * @param {boolean} [enabled]
    * @public
    */
   Cell.prototype.toggleLinkEnabled              = function toggleLink(enabled) {

      if (!this.field.isLinkable())
         throw 'The field has no link defined !';

      if (!this.datatable.tableDOM)
         this.linkEnabled = AdminLib.coalesce(enabled, !this.isLinkEnabled());
      else
         this.field.getLink().toggleEnabled(enabled, this.getItem());
   };

   return Cell;

})();