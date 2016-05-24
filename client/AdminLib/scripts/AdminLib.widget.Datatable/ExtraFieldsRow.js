'use strict';

AdminLib.widget.Datatable.ExtraFieldsRow = (function() {

   var /* AdminLib.widget.Datatable.CreationHandler */ CreationHandler
     , /* AdminLib.widget.Datatable.ExtraFieldsRow  */ Datatable
     , /* AdminLib.widget.Datatable.Field           */ Field
     , /* AdminLib.widget.Datatable.Row             */ Row
     , /* AdminLib.widget.Datatable.RowAction       */ RowAction
     , /* AdminLib.widget.Datatable.RowButton       */ RowButton
     , /* AdminLib.widget.Datatable.TableAction     */ TableAction;

   var domAttributes = AdminLib.widget.Datatable._domAttributes;

   /**
    * @name ExtraFieldsRow
    * @param {AdminLib.widget.Datatable.Row} parent
    * @constructor
    * @property {AdminLib.widget.Datatable.Row} parent
    */
   function ExtraFieldsRow(parent) {
      this.parent = parent;
      this.item   = this.parent.getItem();
   }

   /**
    * Build the DOM of the extra field
    * @private
    */
   ExtraFieldsRow.prototype.buildDOM             = function() {

      var /** @type {boolean} */ isEditModeEnabled
        , /** @type {Object}  */ templateData
        , /** @type {*}       */ value;

      templateData = this.getTemplateData();

      this.dom = AdminLib.dom.build(template, templateData);

      isEditModeEnabled = this.parent.isEditModeEnabled();

      // Building the content of each fields of the child row
      for(var field of this.getExtraFields()) {
         var /** @type {HTMLElement} */ cell;

         cell = field.getCellDOM(this);

         AdminLib.dom.empty(cell);

         if (isEditModeEnabled)
            cell.appendChild(field.getEditField(this.item).getDOM());
         else {
            value = field.getValue(this.item);
            cell.appendChild(field.buildDOM(value, this.item));
         }
      }
   };

   /**
    * Return the datatbale
    * @returns {AdminLib.widget.Datatable}
    * @public
    */
   ExtraFieldsRow.prototype.getDatatable         = function getDatatable() {
      return this.parent.getDatatable();
   };

   /**
    * Return the DOM of the extrafields row
    * @returns {HTMLElement}
    * @public
    */
   ExtraFieldsRow.prototype.getDOM               = function getDOM() {
      if (!this.dom)
         this.buildDOM();

      return this.dom;
   };

   /**
    * Return the list of extrafields
    * @returns {AdminLib.widget.Datatable}
    * @public
    */
   ExtraFieldsRow.prototype.getExtraFields       = function getExtraFields() {
      return this.getDatatable().getExtraFields();
   };

   /**
    *
    */
   ExtraFieldsRow.prototype.getTemplateData      = function getChildRowTemplateData(item) {

      var /** @type {Object} */ parameters;

      parameters = { extraFields : [] };

      for (var field of this.getExtraFields()) {
         parameters.extraFields.push(field.getChildRowTemplateData(item));
      }

      return parameters;
   };

   ExtraFieldsRow.mergeOnFirstLaunch = function() {

      CreationHandler = AdminLib.widget.Datatable.CreationHandler;
      Datatable       = AdminLib.widget.Datatable;
      Field           = AdminLib.widget.Datatable.Field;
      Row             = AdminLib.widget.Datatable.Row;
      RowAction       = AdminLib.widget.Datatable.RowAction;
      RowButton       = AdminLib.widget.Datatable.RowButton;
      TableAction     = AdminLib.widget.Datatable.TableAction;

      delete(ExtraFieldsRow.mergeOnFirstLaunch);
   };


   var template =

         '<table id="child">'
   +        '<tbody>'
   +           '{{#extraFields}}'
   +              '<tr data-field="{{code}}"'
   +                  ' ' + domAttributes.dataset.field.index + '="{{index}}"'
   +                  ' data-adminlib-type="{{#isClicable}}clicableCell{{/isClicable}}{{^isClicable}}cell{{/isClicable}}"'
   +                  ' class="{{type}} {{#editable}}editable{{/editable}} {{#isClicable}}clicableCell{{/isClicable}}">'

   +                 '<td id="label">'
   +                    '{{name}}:'
   +                 '</td>'

   +                 '<td id="value">'
   +                 '</td>'

   +              '</tr>'

   +           '{{/extraFields}}'

   +        '</tbody>'
   +     '</table>';

   return ExtraFieldsRow;

})();