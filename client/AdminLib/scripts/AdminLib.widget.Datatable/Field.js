'use strict';

AdminLib.widget.Datatable.Field                   = (function() {

   var domAttributes = AdminLib.widget.Datatable._domAttributes;

   /**
    *
    *
    * @name AdminLib.widget.Datatable.Field
    * @extends AdminLib.Field
    * @class
    * @param {AdminLib.widget.Datatable.Field.Parameters} parameters
    * @param {number}                                    index
    * @param {AdminLib.widget.Datatable}                  parent
    * @constructor
    * @property {string|undefined}                               attribute             Name of the attribute that will be use to retreive the value of the field
    * @property {boolean}                                        clicableCell          If true, then the whole cell is clicable. If false, then only the value is clicable, by a link.
    * @property {string}                                         code
    * @property {boolean}                                        creatable
    * @property {string[]|boolean}                               dependencies          List of fields on wich depends the field
    * @property {boolean}                                        editable
    * @property {function(Item, Item):boolean}                   equalFunction
    * @property {function(value):string}                         formatValueFunction
    * @property {function(value, Item):string}                   getOrderValueFunction
    * @property {number}                                         index                 Index of the field in the parent datatable.
    * @property {string}                                         label
    * @property {AdminLib.widget.Datatable.Link}                  link
    * @property {string}                                         helpText
    * @property {function(Item):string}                          getValueFunction
    * @property {string}                                         inputType
    * @property {boolean}                                        nullable
    * @property {FieldOptions}                                   options
    * @property {function(SelectOption, Item):boolean}           optionFilter
    * @property {boolean}                                        orderable              Indicate if the column can be ordered or not
    * @property {AdminLib.widget.Datatable}                       parent                 Datatable in wich belongs the field
    * @property {string}                                         placeholder
    * @property {Promise.<Field>}                                promise                Promise that is resolve when all options has been retreived
    * @property {function(Item, *)}                              setValueFunction       Function to use to define the value of the field into the item
    * @property {ClassList}                                      textClasses
    * @property {prototype}                                      type
    * @property {function(string, Item):pFieldValidationMessage} validation
    * @property {boolean}                                        visible
    */
   function Field(parameters, index, parent) {

      var /** @type {Promise} */ promise;

      // Note : parameters have already been coalesced, since only Datatable can call this class

      AdminLib.Field.call(this, parameters);

      this.creatable             = parameters.creatable;
      this.dependencies          = parameters.dependencies;
      this.editMode              = parameters.editMode;
      this.index                 = index;
      this.orderable             = parameters.orderable;
      this.parent                = parent;
      this.sizeClasses           = parameters.sizeClasses;
      this.selectMode            = this.parent.selectMode;
      this.storeName             = this.parent.storeName !== undefined ? 'resizableColumnId-column-' + this.code : undefined;
      this.visible               = parameters.visible;
      this.type                  = parameters.type;

      this.cache                 = [];
      this.clicableCell          = AdminLib.coalesce(parameters.clicableCell, !!this.parent.clicableRow);

      // Property : apiFields
      if (parameters.api !== undefined) {

         if (typeof(parameters.api) === 'boolean' ) {

            // We add api field only if the parent have a model defined
            if (this.parent.model)
               this.apiFields = [this.getCode()];

         }
         else if (typeof(parameters.api) === 'string') {
            this.apiFields = [parameters.api];
         }
         else
            this.apiFields = parameters.api.slice(0);

      }

      // Property : getOrderValueFunction
      if (parameters.getOrderValue)
         this.getOrderValueFunction = parameters.getOrderValue;
      else if (this.type !== undefined)
         this.getOrderValueFunction = this.type.getOrderValue;

      // Property : link
      if (parameters.link)
         this.link = new AdminLib.widget.Datatable.Link(parameters.link, this);

      // Property : clicableCell
      this.clicableCell = AdminLib.coalesce ( parameters.clicableCell
                                   , this.link ? this.link.isClicableCell() : !!this.parent.clicableRow );

      // Controls

      //noinspection JSValidateTypes
      if (this.creatable && this.setValueFunction === undefined && this.attribute === undefined)
         throw 'Field can\'t be creatable without an "attribute" property or a "setValue" function';

      if (this.editable && this.setValueFunction === undefined && this.attribute === undefined)
         throw 'Field can\'t be editable without an "attribute" property or a "setValue" function';

      // Control
      if (this.apiFields && !this.parent.model)
         throw 'You can\'t defined api fields without a parent model';

      // TODO : detect circle dependencies

   }

   Field.prototype                               = Object.create(AdminLib.Field.prototype);
   Field.prototype.constructor                   = Field;

   /**
    *
    * @param {AdminLib.widget.Datatable~CreationRow} row
    * @internal
    */
   Field.prototype.buildCreateField              = function buildCreateField(row) {

      var /** @type {AdminLib.widget.Form.Field} */ editField;

      this.enableEditMode(undefined);

      editField = this.getEditField(undefined);

      editField.toggleEnable(this.creatable);
   };

   /**
    * Build the input of the field.
    * We extend the AdminLib.Field class method because we add the 'input-sm' height class.
    * @param {Item}                                                                        [item]
    * @param {AdminLib.widget.Form.Field.Parameters|AdminLib.widget.Form.Field.Parameters[]} [parameters]
    * @returns {AdminLib.widget.Form.Field}
    */
   Field.prototype.buildEditField                = function buildEditField(item, parameters) {

      parameters = AdminLib.list.convert(parameters);
      parameters.unshift({style : {input: { heightClass: 'input-sm'} }});

      return AdminLib.Field.prototype.buildEditField.call(this, item, parameters);
   };

   /**
    * Build a DOM for the field
    * @param {*}    value
    * @param {Item} item
    * @returns {HTMLElement}
    */
   Field.prototype.buildDOM                      = function buildDOM(value, item) {
      var dom;

      dom = AdminLib.dom.build(this.buildHtmlString(value, item));

      return dom;
   };

   /**
    *
    * @param value
    * @param item
    * @returns {*}
    * @private
    */
   Field.prototype.buildHtmlString               = function buildHtmlString(value, item) {

      var /** @type {string}  */ template
        , /** @type {Object}  */ templateData;

      templateData = {label : this.getTextValue(value, item)};

      if (this.isLinkable() && !this.isClicable(item)) {
         template = '<a data-adminlib-type="link" id="value" href="{{link}}">{{label}}</a>';
         templateData.link = this.link.getURL(item);
      }
      else
         template = '<span id="value">{{label}}</span>';

      return Mustache.render(template, templateData);
   };

   /**
    *
    * @param {HTMLTableRowElement} tableRow
    *@public
    */
   Field.prototype.cleanValidation               = function cleanValidation(tableRow) {
      var /** @type {HTMLTableCellElement} */ cell
        , /** @type {HTMLElement}          */ formGroup;

      cell = this.getCellDOM(tableRow);

      cell.classList.remove('danger');
      cell.classList.remove('warning');
      cell.classList.remove('success');

      if (this.editable)
         formGroup = this.getEditField().cleanValidation();

   };

   /**
    *
    * @param {Item|AdminLib.widget.Datatable.Row|number} item
    * @public
    */
   Field.prototype.enableEditMode                = function enableEditMode(item) {

      var /** @type {HTMLTableCellElement} */ cell
        , /** @type {HTMLElement}          */ dom
        , /** @type {AdminLib.widget.Row}   */ row;

      if (!this.isVisible())
         return;

      // Finding the item
      item = this.parent.getItem(item);

      dom  = this.getEditField(item).getDOM();
      cell = this.getCellDOM(item);

      cell.classList.add('editMode');
      AdminLib.dom.empty(cell);
      cell.appendChild(dom);

      // Setting the "editMode" attribute on the DOM
      cell.setAttribute ( /* attribute */ domAttributes.dataset.editMode.attribute
                        , /* value     */ domAttributes.dataset.editMode.enabled);

   };

   /**
    *
    * @param {Item|number|AdminLib.widget.Datatable.Row} item
    * @public
    */
   Field.prototype.disableEditMode               = function disableEditMode(item) {
      var /** @type {HTMLTableCellElement} */ cell
        , /** @type {HTMLElement}          */ dom
        , /** @type {*}                    */ value;

      value = this.getValue(item);

      dom  = this.buildDOM(value, item);
      cell = this.getCellDOM(item);

      AdminLib.dom.empty(cell);
      cell.appendChild(dom);

      cell.classList.remove('editMode');

      // Setting the "editMode" attribute on the DOM
      cell.setAttribute ( /* attribute */ domAttributes.dataset.editMode.attribute
                        , /* value     */ domAttributes.dataset.editMode.disabled);
   };

   /**
    * Return the list of API fields on wich depend the field
    * @return {string[]} fields
    * @public
    */
   Field.prototype.getApiFields                  = function getApiFields() {

      if (this.apiFields)
         return this.apiFields.slice(0);

      return [];
   };

   /**
    *
    * @param {Item|number|AdminLib.widget.Datatable.Row} item
    */
   Field.prototype.getCell                       = function getCell(item) {
      return this.parent.getCell(this, item);
   };

   /**
    *
    * Return the cell corresponding to the field.
    * If the parameter is an item, then the function will first search for the table row corresponding to the item.
    * If the parameter is a table row, then we directly search inside the table row. This is faster.
    * @param {Item|number|AdminLib.widget.Datatable.Row} [item]
    * @returns {HTMLElement}
    * @public
    */
   Field.prototype.getCellDOM                    = function getCellDOM(item, equal) {

      var /** @type {string}              */ query
        , /** @type {HTMLTableRowElement} */ row;

      if (this.isTableField()) {
         if (item instanceof AdminLib.widget.Datatable.Row)
            row = item.getDOM();
         else if (item !== undefined)
            row = this.parent.getRow(item, equal).getDOM();
         else
            row = this.parent.creationHandler.row.getDOM();

         query = 'td[' + domAttributes.dataset.field.index + '="' + this.index + '"],th[' + domAttributes.dataset.field.index + '="' + this.index + '"]';
      }
      else {
         if (item instanceof AdminLib.widget.Datatable.ExtraFieldsRow)
            row = item.getDOM();
         else if (item !== undefined)
            row = this.parent.getRow(item, equal).getDOM();
         else
            row = this.parent.creationHandler.getRow().getDOM();

         query = 'tr[' + domAttributes.dataset.field.index + '="' + this.index + '"] > #value';
      }

      if (row === undefined || row === null)
         return undefined;

      return row.querySelector(query);

   };

   /**
    * Return the data for the child row template.
    * @param item
    * @returns {Object}
    * @private
    */
   Field.prototype.getChildRowTemplateData       = function getChildRowTemplateData(item) {

      var /** @type {Parameters} */ parameters
        , /** @type {*}          */ value;

      value = this.getValue(item);

      parameters = { code        : this.getCode()
                   , editable    : this.editable
                   , index       : this.getIndex()
                   , isClicable  : this.isClicable()
                   , linkable    : this.isLinkable()
                   , name        : this.label
                   , type        : this.type === Number ? 'numeric' : ''
                   , label       : this.getTextValue(value, item)
                   , textClasses : this.getTextClassString(item) };

      return parameters;

   };

   /**
    * Return the jquery datatable plugins cell.
    * See http://datatables.net/reference/api/cell()
    * @param {AdminLib.widget.Datatable.ItemLike} row
    * @param {Object}                            modifier  See "modifier" parameter on http://datatables.net/reference/api/cell()
    * @return {Object}
    * @internal
    */
   Field.prototype.getDatatableCell              = function getDatatableCell(row, modifier) {
      return this.parent.getDatatableCell(this, row, modifier);
   };

   /**
    * Return the jquery datatable plugins column.
    * See http://datatables.net/reference/api/column()
    * @returns {Object}
    * @internal
    */
   Field.prototype.getDatatableColumn            = function () {
      return this.datatableColumn;
   };

   /**
    * Return the jquery datatable plugins column index
    * @returns {number}
    * @internal
    */
   Field.prototype.getDatatableColumnIndex       = function () {

      var /** @type {number} */ index;

      if (this.datatableColumn)
         return this.datatableColumn.index();

      index =   (this.parent.hasExtraFields()       ? 1 : 0)
              + 1
              + this.parent.tableFields.indexOf(this);

      return index;
   };

   /**
    *
    * @returns {{data: (function(this:Field)), render: (*|function(this:Field)), title: string}}
    * @private
    */
   Field.prototype.getDatatableParameters        = function getDatatableParameters() {

      return { data   : function(item, type) {
                           if (type === 'set')
                              return item;

                           return AdminLib.coalesce(this.getValue(item), '');
                        }.bind(this)
             , render : this.render.bind(this)
             , title  : this.label };

   };

   /**
    * Return the index of the field
    * @returns {number}
    * @public
    */
   Field.prototype.getIndex                      = function getIndex() {
      return this.index;
   };

   /**
    *
    * @returns {AdminLib.widget.Datatable.Link}
    * @public
    */
   Field.prototype.getLink                       = function getLink() {
      return this.link;
   };

   /**
    *
    * @param {value} value
    * @param {Item} item
    * @returns {string} Order value
    * @private
    */
   Field.prototype.getOrderValue                 = function getOrderValue(value, textValue, item) {
      if (!this.getOrderValueFunction)
         return /** @type {string} */ AdminLib.coalesce(textValue, value, '');

      return this.getOrderValueFunction(value, item);
   };

   /**
    * Return a promise that is resolved when the option's list is fetched.
    * @returns {Promise.<Field>}
    */
   Field.prototype.getPromise                    = function getPromise() {
      return this.promise;
   };

   /**
    *
    * @param {*} value
    * @param {Item} item
    * @returns {string|undefined}
    */
   Field.prototype.getSearchValue                = function getSearchValue(value, textValue, item) {

      if (textValue)
         return textValue;

      return this.getTextValue(value, item);
   };

   Field.prototype.getSelectItemData             = function getSelectItemData(item) {


   };

   /**
    *
    */
   Field.prototype.getTemplateData               = function getTemplateData(item) {
      var /** @type {Object}  */ data
        , /** @type {string}  */ link
        , /** @type {boolean} */ linkEnabled
        , /** @type {string}  */ textValue
        , /** @type {*}       */ value;

      value     = this.getValue(item, false);
      textValue = this.getTextValue(value, item);

      if (this.isLinkable()) {
         link = this.link.getURL(item);

         if (link === undefined)
            link = '';

         linkEnabled = this.link.isEnabled(item);
      }
      else
         link = undefined;

      //noinspection JSReferencingMutableVariableFromClosure
      data = { clicableCell : this.clicableCell
             , code         : this.code
             , editable     : this.editable
             , editMode     : this.isEditModeEnabled(item)
             , index        : this.index
             , label        : textValue
             , linkable     : this.isLinkable()
             , link         : link
             , linkEnabled  : linkEnabled
             , orderable    : this.isOrderable()
             , orderValue   : this.getOrderValue(value, textValue, item)
             , searchValue  : this.getSearchValue(value, textValue, item)
             , sizeClasses  : this.sizeClasses
             , storeName    : this.storeName
             , textClasses  : this.getTextClassString(item)
             , type         : this.type === Number ? 'numeric' : ''};

      return data;
   };

   /**
    * Return the value of the field for the given item.
    * If returnEditedValue is true, then the function will return the value provided in the edit form.
    * Otherwise, it will return the value of the given item. In this case, if the item is a table row,
    * then it will look for the item first.
    *
    * @param {AdminLib.widget.Datatable.ItemLike} item
    * @param {boolean}                           [returnEditedValue=false]
    * @returns {string}
    * @public
    */
   Field.prototype.getValue                      = function(item, returnEditedValue) {

      var /** @type {*} */ value;

      returnEditedValue = AdminLib.coalesce(returnEditedValue, false);

      item = this.parent.getItem(item);

      if (returnEditedValue) {
         return this.getEditField(item).getValue();
      }
      else {

         if (this.getValueFunction !== undefined)
            value = this.getValueFunction(item, this);
         else if (item !== undefined)
            value = item[this.attribute];

         return value;
      }

   };

   /**
    * Hide the field (and the datatable column);
    * @public
    */
   Field.prototype.hide                          = function() {
      this.toggleVisibility(false);
   };

   /**
    * Initialize the DOM informations of the field.
    * @internal
    */
   Field.prototype.initializeDOM                 = function initializeDOM() {

      var /** @type {HTMLElement} */ tableHeader;

      if (this.isTableField) {

         tableHeader = this.parent.getTableDOM().querySelector('th[' + domAttributes.dataset.field.index + '="' + this.index + '"]');

         // Retreiving the datatable.net column object
         this.datatableColumn = this.parent.datatable.column(tableHeader);
         this.datatableColumn.visible(this.visible);
      }

   };

   /**
    * Indicate if the field is a clicable field or not.
    * This doesn't mean that the link is enabled.
    *
    * If an item is provided, then it will look at item level.
    *
    * @param {Item} [item]
    * @returns {boolean}
    * @public
    */
   Field.prototype.isClicable                    = function(item) {

      // If the item is provided
      // Then we will check at cell level if the cell is cicable or not.
      // If the cell is not provided, then we
      if (item !== undefined) {

         if (this.parent.tableDOM)
            return this.getCellDOM(item).getAttribute(domAttributes.dataset.type.attribute) === domAttributes.dataset.type.values.clicableCell;

         else if (this.parent.hasCell(this, item))
            return this.parent.getCell(this, item).isClicable();

         // If clicableCell attribute is defined
         else if (typeof(this.clicableCell) === 'boolean')
            return this.clicableCell;

         else if (this.clicableCell)
            return this.clicableCell(item, this.parent.getRow(item));

         // If clicableRow parent attribute is defined : it's either a function or a boolean
         else if (typeof(this.parent.clicableRow) === 'boolean')
            return this.parent.clicableRow;

         else if (this.parent.clicableRow)
            return this.parent.clicableRow(item, this.parent.getRow(item));

         else
            return false;

      }

      if (this.clicableCell !== undefined)
         return this.clicableCell;

      else if (typeof(this.parent.clicableRow) === 'boolean')
         return this.parent.clicableRow;

      return false;
   };

   /**
    * Indicate if the field is creatable or not
    * @returns {boolean} - true : the field is creatable. False otherwise.
    * @public
    */
   Field.prototype.isCreatable                   = function isCreatable() {
      return this.creatable;
   };

   /**
    *
    * @returns {boolean}
    * @public
    */
   Field.prototype.isEditable                    = function isEditable() {
      return this.editable;
   };

   /**
    * Indicate if the edit mode is enabled for the field of the given item.
    * If no item provided, then return the value at field level.
    * @param {Item|HTMLTableRowElement|AdminLib.widget.Datatable.Row} item
    * @public
    */
   Field.prototype.isEditModeEnabled             = function isEditModeEnabled(item) {

      if (item === undefined)
         return this.editMode;

      if (this.parent.hasCell(this, item))
         return this.parent.getCell(this, item).isEditModeEnabled();

      if (this.editMode)
         return true;

      // If the edit mode is not enabled at field level, then we return the row value.
      return this.parent.getRow(item).isEditModeEnabled();
   };

   /**
    * Indicate if the given value is to be considered as an empty value or not.
    * This is useful for example if you consider undefined as an "empty" value
    * but not '' (empty string).
    *
    * Note :
    *    The next step is to provide the hability to developper to create there own
    *    critera using a function.
    *
    * @param {*} value
    * @returns {boolean}
    * @public
    */
   Field.prototype.isEmptyValue                  = function isEmptyValue(value) {
      return value === undefined || value === '' || value === null;
   };

   /**
    * Indicate if the field is an extrafield or not
    * @returns {boolean}
    * @public
    */
   Field.prototype.isExtraField                  = function isExtraField() {
      return this.isTableField();
   };

   /**
    * @returns {boolean}
    */
   Field.prototype.isLinkable                    = function isLinkable() {
      return !!this.link;
   };

   /**
    * @returns {boolean}
    * @public
    */
   Field.prototype.isLinkEnabled                 = function isLinkEnabled() {
      if (this.link === undefined)
         throw 'The field has no link defined';

      return this.link.isEnabled();
   };

   /**
    * Indicate if the field is orderable (true) or not (false).
    * @returns {boolean}
    * @public
    */
   Field.prototype.isOrderable                   = function isOrderable() {
      return this.orderable;
   };

   /**
    * Indicate if the field is an table fieldor not
    * @returns {boolean}
    * @public
    */
   Field.prototype.isTableField                  = function isTableField() {
      return !!this.parent.tableFields.get(this.code);
   };

   /**
    * Indicate if the field is visible or not.
    * @returns {boolean} If true, then the field is visible. False otherwise
    * @public
    */
   Field.prototype.isVisible                     = function isVisible() {
      return this.visible
   };

   /**
    * @param {Event} event
    * @param {Item}  item
    * @private
    */
   Field.prototype.onclick                       = function onclick(event, item) {

      var /** @type {AdminLib.Event}                 */ clickEvent
        , /** @type {string}                        */ domtype
        , /** @type {AdminLib.Event}                 */ followEvent
        , /** @type {AdminLib.widget.Datatable.Link} */ link
        , /** @type {Item[]}                        */ listItems
        , /** @type {AdminLib.widget.Row}            */ row;

      row    = this.parent.getRow(item);

      // Firing event : click
      clickEvent = new AdminLib.Event ( Field.event.click
                                     , { cancellable : true
                                       , detail      : {item : item, row : row}
                                       , target      : this});

      this.dispatchEvent(clickEvent);

      if (clickEvent.defaultPrevented)
         return false;
      // End event : click

      domtype = Field.getDomType(event.target);

      // We handle only links and clicable cell
      if (domtype !== 'link' && domtype !== 'clicableCell') {
         return false;
      }

      // Stopping the event
      event.stopImmediatePropagation();
      event.preventDefault();

      link = AdminLib.coalesce(this.link, this.parent.link);

      if (link === undefined)
         return link;

      // If the link is disabled, we quit
      if (!link.isEnabled(item))
         return false;

      // Firing event "follow"
      followEvent = new AdminLib.Event ( Field.event.follow
                                      , { cancellable : true
                                        , detail      : {item : item, row : row}
                                        , target      : this});

      this.dispatchEvent(followEvent);

      if (followEvent.defaultPrevented)
         return false;

      // End event

      // Following the link
      if (link.useValue) {

         listItems = this.parent.data.map(function(item) {
            return this.getValue(item);
         }.bind(this));

         link.follow(this.getValue(item), listItems);
      }
      else
         link.follow(item, this.parent.data);

      return false;
   };

   /**
    *
    * @param {Item}        item
    * @param {HTMLElement} tableRow
    * @internal
    */
   Field.prototype.onItemChange                  = function (item, tableRow) {

      var /** @type {AdminLib.widget.Form.Field} */ editField
        , /** @type {string}                    */ options;

      if (this.optionFilter) {
         editField = this.getEditField(item);
         options   = this.getOptionList(item);
         editField.setOptionList(options);
      }

      this.refresh(item);
   };

   /**
    * Function that will remove the item from mapItems
    * @param {Item} item
    * @internal
    */
   Field.prototype.onItemRemoved                 = function (item) {
      this.mapItems.delete(item);
   };

   /**
    *
    * @param {Array.<Item|AdminLib.widget.Datatable.Row>} [item]
    * @public
    */
   Field.prototype.refresh                       = function refresh(item) {

      var /** @type {HTMLElement} */ cell
        , /** @type {*}           */ value;

      if (item === undefined) {
         item = this.parent.data;
      }

      if (item instanceof Array) {

         for(var it of item) {
            this.refresh(it);
         }

         return;
      }

      cell  = this.getCellDOM(item);

      this.setCellValue(cell, item);
   };

   /**
    *
    * @param {HTMLElement} cell
    * @param {Item}        item
    * @private
    */
   Field.prototype.setCellValue                  = function setCellValue(cell, item) {

      var /** @type {string} */ textValue
        , /** @type {*}      */ value;

      value = this.getValue(item);
      AdminLib.dom.empty(cell);
      cell.appendChild(this.buildDOM(value, item));

      textValue = this.getTextValue(item);

      cell.dataset.search = this.getSearchValue(value, textValue, item);
      cell.dataset.order  = this.getOrderValue(value , textValue, item);
   };

   /**
    * Show the field.
    * @public
    */
   Field.prototype.show                          = function show() {
      this.toggleVisibility(true);
   };

   /**
    * Toggle the visibility of the field.
    * @param {boolean} [visibility] Visibility to set. If not defined, then inverse the visibility status.
    * @public
    */
   Field.prototype.toggleVisibility              = function toggleVisibility(visibility) {

      visibility = !!AdminLib.coalesce(visibility, !this.visible);

      // We do nothing if the visibility is already in the expected status
      if (this.visible === visibility)
         return;

      this.visible = visibility;

      if (this.isTableField()) {

         if (this.datatableColumn)
            this.datatableColumn.visible(this.visible);

      }
      else {
         // TODO : hide/show extra fields
      }

   };

   /**
    * Updating the field for the given item.
    *
    * About param : row
    *    We use the "getItem" function of the row param to retreive the old item :
    *    this means that at this point, "getItem" must still return the old item.
    *
    * @param {AdminLib.widget.Datatable.Row} row
    * @param {Item}                         newItem
    * @protected
    */
   Field.prototype.updateItem                    = function updateItem(row, newItem) {

      var /** @type {HTMLElement} */ cell
        , /** @type {string}      */ textValue
        , /** @type {*}           */ value;

      AdminLib.Field.prototype.updateItem.call(this, row.getItem(), newItem);

      cell  = this.getCellDOM(row.getItem());
      this.setCellValue(cell, newItem);
   };

   /**
    * Validate the edited value of an item.
    *
    * @param {Item}               item
    * @return {Promise.<boolean>} Indicate if the validation was successful (true) or has failed (false)
    */
   Field.prototype.validate                      = function validate(item) {

      var /** @type {AdminLib.widget.Form.Field} */ field
        , /** @type {pFieldValidationMessage}   */ validationMessage
        , /** @type {string}                    */ value;

      // If the field is not editable, we don't have to validate
      if (!this.editable)
         return Promise.resolve(true);

      // If the field hasn't any validation, we return true
      if (this.validationFunction === undefined)
         return Promise.resolve(true);

      value             = this.getValue(item, true).getValue();
      validationMessage = this.validationFunction(value, item);

      // Transforming the validation on a promise
      if (!(validationMessage instanceof Promise))
         validationMessage = Promise.resolve(validationMessage);

      // Returning the result
      return validationMessage.then(function(fieldValidationMessage) {

         var /** @type {HTMLElement} */ helpBlocError;

         field.cleanValidation();

         // If the validation was successful, we return true
         if (fieldValidationMessage.success) {

            // Removing the "has-error" class to the field group
            field.setValidation(AdminLib.widget.Form.Field.VALIDATION.SUCCESS);
            return true;
         }

         field.setValidation(AdminLib.widget.Form.Field.VALIDATION.ERROR);
         field.setErrorMessage(fieldValidationMessage.message);

         return false;
      });

   };

   /**
    * @param {AdminLib.widget.Datatable.Parameters.Field[]} parameters
    * @returns {AdminLib.widget.Datatable.Parameters.Field}
    */
   Field.coalesceParameters                      = function coalesceParameters(parameters) {

      var /** @type {AdminLib.widget.Datatable.Parameters.Field} */ coalescedParameters
        , /** @type {Array} */ linkParameters;

      parameters = AdminLib.coalesce(parameters, []);

      coalescedParameters = Field.coalesceBaseParameters(parameters);

      linkParameters = AdminLib.list.attribute('link', parameters, undefined, false);

      // By default, cells are not clicable
      if (linkParameters.length > 0)
         linkParameters.push({clicableCell: false});

      coalescedParameters.api             = AdminLib.coalesceAttribute('api'            , parameters, true);
      coalescedParameters.clicableCell    = AdminLib.coalesceAttribute('clicableCell'   , parameters);
      coalescedParameters.dependencies    = AdminLib.coalesceAttribute('dependencies'   , parameters, false);
      coalescedParameters.editMode        = AdminLib.coalesceAttribute('editMode'       , parameters, false);
      coalescedParameters.inputType       = AdminLib.coalesceAttribute('inputType'      , parameters, AdminLib.FIELD_TYPES.AUTO);
      coalescedParameters.inputParameters = AdminLib.coalesceAttribute('inputParameters', parameters);
      coalescedParameters.helpText        = AdminLib.coalesceAttribute('helpText'       , parameters);
      coalescedParameters.link            = AdminLib.widget.Datatable.Link.coalesceParameters(linkParameters);
      coalescedParameters.optionFilter    = AdminLib.coalesceAttribute('optionFilter'   , parameters);
      coalescedParameters.model           = AdminLib.coalesceAttribute('model'          , parameters);
      coalescedParameters.setValue        = AdminLib.coalesceAttribute('setValue'       , parameters);
      coalescedParameters.validation      = AdminLib.coalesceAttribute('validation'     , parameters);

      coalescedParameters.editable        = AdminLib.coalesceAttribute('editable'       , parameters, !!coalescedParameters.setValue || !!coalescedParameters.attribute);
      coalescedParameters.creatable       = AdminLib.coalesceAttribute('creatable'      , parameters, coalescedParameters.editable);
      coalescedParameters.nullable        = AdminLib.coalesceAttribute('nullable'       , parameters, true);
      coalescedParameters.placeholder     = AdminLib.coalesceAttribute('placeholder'    , parameters, coalescedParameters.label);

      coalescedParameters.dependencies    = coalescedParameters.dependencies instanceof Array ? coalescedParameters.dependencies.slice(0) : coalescedParameters.dependencies;

      return coalescedParameters;

   };

   /**
    * @param {AdminLib.widget.Datatable.Parameters.BaseField[]} parameters
    * @returns {AdminLib.widget.Datatable.Parameters.BaseField}
    */
   Field.coalesceBaseParameters                  = function coalesceBaseParameters(parameters) {

      var /** @type {AdminLib.widget.Datatable.Parameters.BaseField} */ coalescedParameters;

      parameters = AdminLib.coalesce(parameters, []);

      coalescedParameters = { code         : AdminLib.coalesceAttribute('code'         , parameters)
                            , default      : AdminLib.coalesceAttribute('default'      , parameters)
                            , equal        : AdminLib.coalesceAttribute('equal'        , parameters)
                            , formatValue  : AdminLib.coalesceAttribute('formatValue'  , parameters)
                            , getValue     : AdminLib.coalesceAttribute('getValue'     , parameters)
                            , getOrderValue: AdminLib.coalesceAttribute('getOrderValue', parameters)
                            , options      : AdminLib.coalesceAttribute('options'      , parameters)
                            , orderable    : AdminLib.coalesceAttribute('orderable'    , parameters, true)
                            , sizeClasses  : AdminLib.coalesceAttribute('sizeClasses'  , parameters, [])
                            , textClasses  : AdminLib.coalesceAttribute('textClasses'  , parameters)
                            , visible      : AdminLib.coalesceAttribute('visible'      , parameters, true)};

      coalescedParameters.attribute = AdminLib.coalesceAttribute('attribute'  , parameters, coalescedParameters.setValue ? undefined : coalescedParameters.code);
      coalescedParameters.label     = AdminLib.coalesceAttribute('label'      , parameters, coalescedParameters.code.capitalizeFirstLetter());

      coalescedParameters.options   = coalescedParameters.options instanceof Array ? coalescedParameters.options.slice(0) : coalescedParameters.options;

      if (typeof(coalescedParameters.sizeClasses) === 'string')
         coalescedParameters.sizeClasses = coalescedParameters.sizeClasses.split(' ');
      else
         coalescedParameters.sizeClasses = coalescedParameters.sizeClasses.slice(0);

      return coalescedParameters;
   };

   Field.event                                   = { click  : 'AdminLib.widget.Datatable.Field.event.click'
                                                   , follow : 'AdminLib.widget.Datatable.Field.event.follow' };

   /**
    *
    * @param {HTMLElement}              dom
    * @param {AdminLib.widget.Datatable} datatable
    * @returns {AdminLib.widget.Datatable.Field}
    * @public
    */
   Field.get                                     = function (dom, datatable) {
      var /** @type {HTMLTableElement}     */ cell
        , /** @type {AdminLib.widget.Field} */ field
        , /** @type {number}               */ fieldIndex;

      cell = $(dom).closest('td').get(0);

      // Checking that the column has a link handler
      fieldIndex = parseInt(cell.getAttribute(domAttributes.dataset.field.index));

      return datatable.getField(fieldIndex);
   };

   /**
    *
    * @param {HTMLElement} dom
    * @returns {string}
    * @private
    */
   Field.getDomType                              = function getDomType(dom) {
      return AdminLib.widget.Datatable.getDomType(dom);
   };

   /**
    * Return the field text value of the given item
    *
    * This function act as a virtual function : it simulate a Field objet
    * as if it was really created with the "parameters" values.
    *
    * Use fields :
    *    - formatValue
    *    - options
    *
    * @param {AdminLib.widget.Datatable.Parameters.Field} parameters
    * @param {*} value
    * @returns {*}
    */
   Field.getTextValue                            = function getTextValue(parameters, value) {

      var /** @type {Object} */ thisObject;

      if (parameters.options instanceof Promise)
         throw 'The "options" property MUST NOT be a promise';

      thisObject = { formatValueFunction : parameters.formatValue
                   , options             : parameters.options};

      return Field.prototype.getTextValue.call(thisObject, value);
   };

   /**
    *
    * @param {AdminLib.widget.Datatable} datatable
    * @param {Event} event
    * @internal
    */
   Field.onclick                                 = function onclick(event, datatable) {
      var /** @type {AdminLib.widget.Datatable.Field} */ field
        , /** @type {Item}                           */ item
        , /** @type {AdminLib.widget.Datatable.Row}   */ row;

      row      = AdminLib.widget.Datatable.Row.get(event.target, datatable);
      field    = Field.get(event.target, datatable);

      if (field === undefined)
         throw 'Field not found';

      if (row === undefined)
         throw 'Row not found';

      item = row.getItem();

      return field.onclick(event, item);
   };

   Field.mergeOnFirstLaunch                      = function() {};

   return Field;

})();