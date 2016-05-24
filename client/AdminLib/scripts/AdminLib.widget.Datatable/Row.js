'use strict';

AdminLib.widget.Datatable.Row                     = (function() {

   /**
    *
    * About : cancelEditButton
    *    This button is created the first time the edition is enabled : this way we limit memory usage
    *
    * About : saveEditButton
    *    This button is created the first time the edition is enabled : this way we limit memory usage
    *
    * @name AdminLib.widget.Datatable.Row
    * @class
    * @extends AdminLib.EventTarget
    * @param {Item} item
    * @param {AdminLib.widget.Datatable} parent
    * @constructor
    * @property {AdminLib.Action.Button}                   cancelEditButton Button used to cancel the edition of the row
    * @property {HTMLTableRowElement}                     dom              DOM of the row
    * @property {boolean}                                 expanded         Indicate if the row is currently expanded (true) or not (false).
    * @property {number}                                  index            Index of the row in the parent row list
    * @property {Item}                                    item             Item handled by the row
    * @property {boolean}                                 editModeEnabled  Indicate if the edit mode is enabled (true) or not (false)
    * @property {AdminLib.widget.Datatable.ExtraFieldsRow} extraFieldsRow   Object that will handle the extra fields
    * @property {AdminLib.widget.Datatable}                parent           Datatable in wich belong the row object
    * @property {AdminLib.Action.Button}                   saveEditButton   Button used to save the edition of the row
    * @property {boolean}                                 selected         Indicate if the row is selected or not. This property keep the selected status until the tableDOM is created.
    */
   function Row(item, parent) {

      AdminLib.EventTarget.call(this);

      this.parent          = parent;

      this.expanded        = false;
      this.index           = this.parent.getIndex(item);
      this.item            = item;
      this.editModeEnabled = false;
      this.extraFieldsRow  = new AdminLib.widget.Datatable.ExtraFieldsRow(this);
      this.fields          = this.parent.fields;
      this.selectable      = undefined;
      this.selected        = false;
   }

   Row.prototype                                 = Object.create(AdminLib.EventTarget.prototype);
   Row.prototype.constructor                     = Row;

   /**
    * Clear all validation effects on the row
    * @public
    */
   Row.prototype.cleanValidation                 = function () {

      var /** @type {ClassList} */ classList;

      classList = this.getDOM().classList;

      classList.remove('danger');
      classList.remove('success');
      classList.remove('warning');
   };

   /**
    * Collapse the child row
    * @public
    */
   Row.prototype.collapse                        = function () {

      var /** @type {HTMLElement} */ expandButton;

      if (!this.isExpandable())
         return;

      if (!this.expanded)
         return;

      this.expanded     = false;

      expandButton        = this.getExpandButton();

      // Hiding the child row
      this.datatableRow.child.hide();

      // Updating the class
      this.dom.classList.remove('shown');

      // Collapsing the "expand cell" button
      expandButton.classList.remove('row-details-open');
      expandButton.classList.add('row-details-close');
   };

   /**
    * Disable the edit mode.
    * @public
    */
   Row.prototype.disableEditMode                 = function () {

      var /** @type {HTMLElement}   */ editGroup
        , /** @type {AdminLib.Event} */ event;

      if (!this.editModeEnabled)
         return;

      this.editModeEnabled = false;

      // If the datatable has been redraw during saving, the buttons don't exists

      if (this.editGroup !== null) {
         this.editGroup.parentElement.removeChild(editGroup);
         this.editButton.classList.remove('hide');
      }

      // Displaying input fields
      for(var field of this.parent.tableFields) {

         // If the field is not visible, then we do nothing
         if(!field.isVisible())
            continue;

         field.disableEditMode(this);
      }

      // If we have an edit button, then we have a cancel button and a save button.
      // Theses two later buttons must be hiden and the edit button shown again.
      if (this.editButton) {
         this.editButton.classList.remove('hide');
         this.cancelEditButton.hide();
         this.saveEditButton.hide();
      }

      this.dom.classList.remove('editMode');

      this.cleanValidation();

      // Event: Row.event.editModeDisabled
      event = new AdminLib.Event ( Row.event.editModeDisabled
                                , { cancellable : false
                                  , target      : this });

      this.dispatchEvent(event);

   };

   /**
    * @method AdminLib.widget.Datatable#enableEditMode
    *
    * @param {boolean} autoExpand
    *
    * @public
    */
   Row.prototype.enableEditMode                  = function (autoExpand) {

      var /** @type {HTMLElement}                     */ buttonGroup
        , /** @type {AdminLib.Event}                   */ event
        , /** @type {AdminLib.Action.Button.Parameter} */ saveActionParameters;

      if (this.editModeEnabled)
         return;

      autoExpand = AdminLib.coalesce(autoExpand, true);

      this.editModeEnabled = true;

      if (this.parent.hasExtraFields() && autoExpand)
        this.expand();

      // Displaying input fields
      for(var field of this.parent.tableFields) {
         field.enableEditMode(this);
      }

      // Applying modifications
      this.dom.classList.add('editMode');

      if (this.editButton) {
         if (!this.cancelButton) {
            // Handling buttons
            this.cancelEditButton = new AdminLib.Action.Button({ 'class'  : 'btn-xs grey'
                                                              , icon     : 'fa fa-undo'
                                                              , id       : 'cancel'
                                                              , action   :   function(event) {
                                                                                event.stopImmediatePropagation();
                                                                                this.disableEditMode(true);
                                                                                return {success:true, silent:true};
                                                                             }.bind(this)});
         }

         if (!this.saveButton) {
            saveActionParameters  = { class      : 'btn-xs green'
                                    , icon       : 'fa fa-check'
                                    , id         : 'save'
                                    , validation : { validation : this.validate.bind(this, true, this.parent.validationFunction) }
                                    , action     :  function(event) {
                                                       event.stopImmediatePropagation();
                                                       return this.saveEdition();
                                                    }.bind(this)};

            this.saveEditButton  = new AdminLib.Action.Button(saveActionParameters);
         }

         buttonGroup  = AdminLib.dom.build('<div id="editButtons" class="btn-group" role="group" aria-label="Save or cancel"></div>');
         buttonGroup.appendChild(this.saveEditButton.getDOM());
         buttonGroup.appendChild(this.cancelEditButton.getDOM());

         this.editButton.classList.add('hide');
         this.editButton.parentElement.appendChild(buttonGroup);
      }

      // Event: Row.event.editModeDisabled
      event = new AdminLib.Event ( Row.event.editModeEnabled
                                , { cancellable : false
                                  , target      : this });

      this.dispatchEvent(event);

   };

   /**
    *
    * @public
    */
   Row.prototype.expand                          = function () {

      var /** @type {HTMLTableRowElement} */ childRow
        , /** @type {HTMLTableElement}    */ childRowContent
        , /** @type {HTMLElement}         */ expandButton
        , row;

      if (!this.isExpandable())
         return;

      if (this.expanded)
         return;

      this.expanded = true;

      expandButton       = this.getExpandButton();

      // Building child row content
      if (this.extraFieldsRow.getExtraFields().length > 0)
         childRowContent = [this.extraFieldsRow.getDOM()];
      else
         childRowContent = [];

      for(childRow of this.parent.childRows) {

         if (childRow instanceof HTMLElement)
            childRowContent.push(childRow);
         else if (typeof(childRow) === 'function')
            childRowContent.push(childRow(this.item));
         else
            throw 'Invalid child row';
      }

      // Declaring the child row and displaying it
      this.datatableRow.child(childRowContent).show();

      for(var content of childRowContent) {
         childRow = content.parentElement.parentElement;

         childRow.classList.add('details');            // adding "detail" class to the TR element
         childRow.firstChild.classList.add('details'); // adding "detail" class to the TD element

         childRow.dataset.rowType = 'child';
         childRow.dataset.index   = this.getIndex();
      }

      expandButton.classList.remove('row-details-close');
      expandButton.classList.add('row-details-open');
   };

   /**
    * Fix the row on top of the table
    *
    * If "equal" parameter is defined, then the item will be search by comparing the items with this function
    * The equal parameter will not be used if the item is :
    *    -  a HTMLTableRowElement instance
    *    -  a AdminLib.widget.Datatable.Row instance
    *    -  a number
    *
    * @param {AdminLib.widget.Datatable.ItemLike} index
    * @param {AdminLib.EqualFunction}             [equal]
    * @param {boolean}                           [redraw=true] If true, then the datatable will be redraw to apply change
    * @returns {AdminLib.widget.Datatable}
    * @public
    */
   Row.prototype.fix                             = function (redraw) {
      this.parent.fixRow(this, redraw);
   };

   /**
    *
    * @param {number|string|AdminLib.widget.Datatable.Field} field
    * @public
    */
   Row.prototype.getCell                         = function (field) {
      return this.parent.getCell(field, this);
   };

   /**
    *
    * @param {AdminLib.widget.Datatable.FieldLike} field
    * @returns {HTMLElement}
    * @public
    */
   Row.prototype.getCellDOM                      = function (field) {

      field = this.parent.getField(field);

      if (field === undefined)
         throw 'Field don\'t exists !';

      return field.getCellDOM(this);
   };

   /**
    * @returns {AdminLib.widget.Datatable}
    * @public
    */
   Row.prototype.getDatatable                    = function () {
      return this.parent;
   };

   /**
    * Return the jquery datatable plugins column.
    * See http://datatables.net/reference/api/cell()
    * @param {AdminLib.widget.Datatable.FieldLike} field
    * @param {Object}                             modifier  See "modifier" parameter on http://datatables.net/reference/api/cell()
    * @return {Object}
    * @internal
    */
   Row.prototype.getDatatableCell                = function (field, modifier) {
      return this.parent.getDatatableCell(field, this, modifier);
   };

   /**
    * Return the jquery datatable plugins row.
    * See http://datatables.net/reference/api/row()
    * @returns {Object}
    * @internal
    */
   Row.prototype.getDatatableRow                 = function () {
      return this.datatableRow;
   };

   /**
    *
    * @returns {HTMLTableRowElement}
    * @public
    */
   Row.prototype.getDOM                          = function () {
      return this.dom;
   };

   /**
    * Return the edited value of the given item.
    *
    * @method AdminLib.widget.Datatable#getEditedInformations
    * @param {HTMLTableRowElement} tableRow Table row corresponding to the item
    * @param {Item}                item     Original item
    * @return {Item}
    * @private
    */
   Row.prototype.getEditedInformations           = function () {

      var /** @type {Item}                           */ editedItem
        , /** @type {*}                              */ editedValue
        , /** @type {string}                         */ emptyFields
        , /** @type {AdminLib.widget.Datatable.Field} */ field;

      editedItem = AdminLib.clone(this.item);

      // If the data table is not editable, we return a copy of the item
      if (!this.isEditable())
         return editedItem;

      emptyFields = [];

      for(field of this.parent.getFields()) {

         if (!field.isEditable())
            continue;

         editedValue = field.getValue(this.dom, true);

         if (field.isEmptyValue(editedValue))
            emptyFields.push(field.getCode())
         else
            field.setValue ( /* item  */ editedItem
                           , /* value */ editedValue);
      }

      return { editedItem  : editedItem
             , emptyFields : emptyFields };
   };

   /**
    *
    * @returns {HTMLElement}
    * @public
    */
   Row.prototype.getExpandButton                 = function () {
      return this.dom.querySelector('td#expandCell span');
   };

   Row.prototype.getExtraFieldRow                = function () {

      return this.extraFieldRow();

   };

   /**
    *
    * @returns {number}
    * @public
    */
   Row.prototype.getIndex                        = function () {
      return this.index;
   };

   /**
    * Return the item associated to the row
    * @returns {Item}
    * @public
    */
   Row.prototype.getItem                         = function () {
      return this.item;
   };

   /**
    * @returns {HTMLElement}
    * @private
    */
   Row.prototype.getRowSelector                  = function () {
      return this.dom.querySelector('td#' + domAttributes.id.rowSelector);
   };

   /**
    * Return the data of the row template
    * @returns {AdminLib.widget.Datatable~Template.Row}
    * @private
    */
   Row.prototype.getTemplateData                 = function () {

      var /** @type {Object}   */ data
        , /** @type {Object[]} */ fields
        , /** @type {Object}   */ linkData
        , /** @type {Object}   */ rowButtons
        , /** @type {string}   */ rowClasses;

      if (this.getRowClassFunction)
         rowClasses = new AdminLib.dom.ClassList(this.parent.getRowClassFunction(this.item)).toString();

      fields     = this.parent.getTableFields().map(function(field) {
         return field.getTemplateData(this.item);
      }.bind(this));

      rowButtons = this.parent.getRowButtons().map(function(rowButton) {
         return rowButton.getTemplateData(this.item);
      }.bind(this));

      if (this.parent.clicableRow)
         linkData = this.parent.link.getTemplateData(this);

      data = { expandable  : this.parent.isRowExpandable()
             , index       : this.index
             , link        : linkData
             , rowButtons  : rowButtons
             , rowClasses  : rowClasses
             , selectable  : this.isSelectable()
             , selected    : this.isSelected()
             , tableFields : fields};

      return data;
   };

   /**
    * Function that will be executed once the parent DOM has been created
    * @param {HTMLTableRowElement} dom
    * @private
    */
   Row.prototype.initializeDOM                   = function (dom) {

      if (dom)
         this.dom = dom;
      else
         this.dom = this.parent.tableDOM.querySelector('tbody > tr[data-index="' + this.index + '"][data-row-type="row"]');

      if (this.isSelectable()) {
         this.checkbox = this.dom.querySelector('input[data-adminlib-type="checkbox"]');
      }

      if (this.parent.editAction) {
          this.editButton   = this.parent.editAction.editButton.getButton(this.dom);
          this.editGroup    = this.editButton.parentElement.querySelector('div#editButtons');
      }

   };

   /**
    * @internal
    */
   Row.prototype.initializeDatatableRow          = function () {
      this.datatableRow = this.parent.datatable.row($(this.dom));

      if (this.parent.datatableRow === this)
         this.scrollTo();
   };

   /**
    * Invalidate the datatable plugins row.
    * See http://datatables.net/reference/api/row().invalidate()
    * @public
    */
   Row.prototype.invalidate                      = function () {

      if (!this.datatableRow)
         return;

      this.datatableRow.invalidate();
   };

   /**
    * Indicate if the row is fixed (true) or not (false);
    * @returns {boolean}
    * @public
    */
   Row.prototype.isFixed                         = function () {
      return this.parent.getFixedRows().indexOf(this) !== -1;
   };

   /**
    *
    * @returns {boolean}
    * @public
    */
   Row.prototype.isEditable                      = function () {
      return this.parent.isEditable();
   };

   /**
    * Indicate if the edit mode is enabled
    * @returns {boolean}
    * @public
    */
   Row.prototype.isEditModeEnabled               = function () {
      return this.editModeEnabled;
   };

   Row.prototype.isExpandable                    = function () {
      return this.parent.getExtraFields().length > 0 || this.parent.childRows.length > 0;
   };

   /**
    *
    * @returns {boolean}
    * @public
    */
   Row.prototype.isExpanded                      = function () {
      return this.expanded;
   };

   /**
    * Indicate if the row is selected (true) or not (false)
    * @returns {boolean}
    * @public
    */
   Row.prototype.isSelected                      = function () {
      if (this.dom)
         return this.dom.classList.contains('active');

      return this.selected;
   };

   /**
    * Indicate if the row can be selected or not
    * @returns {boolean}
    * @public
    */
   Row.prototype.isSelectable                    = function () {

      if (this.selectable === undefined) {

         // Determining the initial state of selectability

         if (this.parent.selectedItems === undefined)
            this.selectable = true;
         else if (this.parent.selectedItems instanceof Array) {
            // If the selectedItems property is an array, then we check that
            // the item or the index is in the array

            if (this.parent.selectedItems.indexOf(this.getItem()))
               this.selectable = this.parent.selectedItems.indexOf(this.getIndex())
            else
               this.seletable = true;
         }
         else if (typeof(this.parent.selectedItems) === 'boolean')
            this.selectable = this.parent.selectedItems;
         else
            this.selectable = !!this.parent.selectedItems(this.getItem(), this.parent.data);
      }

      return this.selectable;
   };

   /**
    *
    * @param {boolean} [cleanValidation=true]
    * @public
    */
   Row.prototype.notifyError                     = function (cleanValidation) {
      cleanValidation = AdminLib.coalesce(cleanValidation, true);

      if (cleanValidation)
         this.cleanValidation();

      this.getDOM().classList.add('danger');
   };

   /**
    *
    * @param {boolean} [cleanValidation=true]
    * @public
    */
   Row.prototype.notifySuccess                   = function (cleanValidation) {
      cleanValidation = AdminLib.coalesce(cleanValidation, true);

      if (cleanValidation)
         this.cleanValidation();

      this.getDOM().classList.add('success');
   };

   /**
    *
    * @param {boolean} [cleanValidation=true]
    * @public
    */
   Row.prototype.notifyWarning                   = function (cleanValidation) {
      cleanValidation = AdminLib.coalesce(cleanValidation, true);

      if (cleanValidation)
         this.cleanValidation();

      this.getDOM().classList.add('warning');
   };

   /**
    *
    * @param {Field} source Field that have change. This field will not be updated
    * @private
    */
   Row.prototype.onItemChange                    = function (source) {

      var /** @type {boolean} */ doUpdate;

      // Decide, for each field, if the field event "onItemChange" must be triggered
      for(var field of this.parent.getFields()) {

         if (field === source || !field.dependencies)
            return;

         doUpdate = false;

         if (field.dependencies === true)
            doUpdate = true;
         else if (field.dependencies && source === undefined)
            doUpdate = true;
         else if (field.dependencies.indexOf(source.code) !== -1)
            doUpdate = true;

         if (doUpdate)
            field.onItemChange ( item
                               , tableRow);
      }

   };

   /**
    *
    * @param {Event}                    event
    * @param {AdminLib.widget.Datatable} datatable
    */
   Row.prototype.onButtonClick                   = function (event) {

      var /** @type {HTMLButtonElement}                  */ button
        , /** @type {string}                             */ index
        , /** @type {Item}                               */ item
        , /** @type {Row}                                */ row
        , /** @type {AdminLib.widget.Datatable.RowButton} */ rowButton
        , /** @type {string}                             */ rowButtonIndex
        , /** @type {HTMLElement}                        */ rowDOM;

      button         = event.target.tagName === 'BUTTON' ? event.target : event.target.parentElement;

      rowButtonIndex = parseInt(button.getAttribute('data-rowButtonIndex'));
      rowButton      = this.parent.getRowButton(rowButtonIndex);

      rowButton.execute(this.getItem(), row);
   };

   /**
    *
    * @param {Event} event
    * @returns {boolean}
    * @private
    */
   Row.prototype.onclick                         = function (event) {

      var /** @type {string} */ domtype;

      domtype = Row.getDomType(event.target);

      switch(domtype) {

         case 'checkbox':
            event.stopImmediatePropagation();
            //event.preventDefault();

            this.oncheckboxclick(event);
            return false;

         case 'rowButton':
            event.stopImmediatePropagation();
            event.preventDefault();

            this.onButtonClick(event);
            return false;

         case 'expand':
            event.stopImmediatePropagation();
            event.preventDefault();

            this.toggleExpand();
            return false;

      }

   };

   /**
    *
    * @param {Event} event
    * @internal
    */
   Row.prototype.oncheckboxclick                 = function (domEvent) {

      var /** @type {AdminLib.Event} */ event
        , /** @type {string}        */ type;

      if (domEvent.target.checked)
         this.select();
      else
         this.unselect();

      // Event : selectItem / unselectItem
      type = domEvent.target.checked ? AdminLib.widget.Datatable.event.selectItem
                                     : AdminLib.widget.Datatable.event.unselectItem;

      event = new AdminLib.Event ( type
                                , { cancelable : false
                                  , target     : this });

      this.parent.dispatchEvent(event);
      // End event

      this.parent.updateRowActionSelect();

   };

   /**
    *
    * @param {Event} event
    * @private
    */
   Row.prototype.onRowButtonClick                = function (event) {

      var /** @type {HTMLButtonElement}                  */ button
        , /** @type {string}                             */ index
        , /** @type {Item}                               */ item
        , /** @type {AdminLib.widget.Datatable.RowAction} */ rowButton
        , /** @type {string}                             */ rowButtonIndex
        , /** @type {HTMLElement}                        */ rowDOM;

      button = event.target.tagName === 'BUTTON' ? event.target : event.target.parentElement;

      // retreiving the row selected
      index = button.parentElement.parentElement.getAttribute('data-index');

      // Checkbox at row level
      item = this.getItem(index);

      rowButtonIndex = button.getAttribute('data-rowButtonIndex');
      rowButton = this.rowButtons[rowButtonIndex];

      rowDOM = this.tableDOM.querySelector('tr[data-index="' + index + '"]');

      //rowButton.execute.call(rowButton, item, this);
      rowButton.execute(item);
   };

   /**
    *
    * @param {boolean} [redraw=true]
    * @public
    */
   Row.prototype.release                         = function (redraw) {
      this.parent.releaseRow(this, redraw);
   };

   /**
    * Remove the row from the datatable.
    * This will NOT remove the corresponding item from the list of datatables items.
    * @internal
    */
   Row.prototype.remove                          = function () {
      this.datatableRow.remove();
   };

   /**
    *
    * @param {HTMLTableRowElement} tableRow
    * @param {Item}                item
    * @returns {Promise.<ActionResult>}
    * @private
    */
   Row.prototype.saveEdition                     = function () {

      var /** @type {Object}  */ editedInformations
        , /** @type {Promise} */ promise;

      this.cleanValidation();

      // At this point, all validations was successful
      editedInformations = this.getEditedInformations();

      if (this.parent.editAction.handler)
         promise = this.parent.editAction.handler(editedInformations.editedItem, this.getItem());
      else
         promise = this.parent.model.edit ( /* id          */ this.parent.model.getID(editedInformations.editedItem)
                                          , /* editedItem  */ editedInformations.editedItem
                                          , /* emptyFields */ editedInformations.emptyFields);


      // Building the promise to handle the save result.
      return promise.then(function(saveResult) {

         var /** @type {AdminLib.Event} */ event
           , /** @type {Item}          */ newItem;

         if (saveResult.success) {

            newItem = AdminLib.coalesce(saveResult.item, editedInformations.editedItem);

            this.disableEditMode();
            this.updateItem(newItem);

            // Firefing event : edited
            event = new AdminLib.Event ( AdminLib.widget.Datatable.event.itemEdited
                                      , { cancelable : false
                                        , target     : this
                                        , detail     : { newItem : newItem
                                                       , oldItem : this.getItem() }});

            this.parent.dispatchEvent(event);
         }

         return saveResult;

      }.bind(this));
   };

   /**
    * Scroll the datatable until the row
    * @public {boolean} [redraw=true]
    * @public
    */
   Row.prototype.scrollTo                        = function (redraw) {

      if (this.datatableRow === undefined) {
         this.parent.rowScrolledTo = this;
         return;
      }

      redraw = AdminLib.coalesce(redraw, true);

      this.datatableRow.scrollTo();

      if (redraw)
         this.parent.redraw();

   };

   /**
    * Select the given row.
    * The function will check the checkbox (if present) and add the "active" style to the row
    * @param {boolean} [force=false] if false, then an exception will be thrown if the row is not selectable
    * @public
    */
   Row.prototype.select                          = function (force) {
      this.toggleSelection(true, force);
   };

   /**
    *
    * @param {boolean} expand
    * @public
    */
   Row.prototype.toggleExpand                    = function (expand) {

      expand = !!AdminLib.coalesce(expand, !this.isExpanded());

      if (expand)
         this.expand();
      else
         this.collapse();

   };

   /**
    *
    * @param {boolean} [fix]
    * @public
    */
   Row.prototype.toggleFix                       = function (fix) {

      fix = !!AdminLib.coalesce(fix, !this.isFixed());

      if (fix)
         this.fix();
      else
         this.release();

   };

   /**
    *
    * @param {boolean} [selectable]
    * @public
    */
   Row.prototype.toggleSelectable                = function (selectable) {

      if (selectable === undefined)
         selectable = !this.isSelectable();

      if (!selectable) {
         if (this.isSelected())
            this.unselect();
      }

      this.selectable = !!selectable;

      this.dom.classList.toggle('selectable');
      this.checkbox.disabled = !this.selectable;
   };

   /**
    * Toggle the selection
    * @param {boolean} [selected]
    * @param {boolean} [force=false] If false, then an exception will be thrown if the row is not selectable
    * @public
    */
   Row.prototype.toggleSelection                 = function (selected, force) {

      selected = !!AdminLib.coalesce(selected, !this.isSelected());

      // Checking that the row is selectable
      if (selected && !this.isSelectable() && !force)
         throw 'Row is not selectable';

      if (this.checkbox) {
         this.checkbox.checked = selected;
         this.checkbox.parentElement.classList.toggle('checked', selected);
      }

      if (this.dom)
         this.dom.classList.toggle('active', selected);
      else
         this.selected = selected;

      this.parent.setSelectedItem(this, selected);

      if (this.parent.fixOnSelect)
         this.toggleFix(selected);
   };

   /**
    * Replace the old item by the new one
    * @param {Item}    newItem
    * @param {boolean} [redraw=true]
    * @public
    */
   Row.prototype.updateItem                      = function (newItem, redraw) {
      var /** @type {Item}   */ oldItem;

      redraw = AdminLib.coalesce(redraw, true);

      // Changing the old item by the new one
      oldItem = this.item;
      this.item = newItem;
      this.datatableRow.invalidate();
      this.parent.updateItem(this, newItem, oldItem, redraw);

      // Updating each fields
      for(var field of this.fields) {
         if (!field.isVisible())
            continue;

         field.updateItem(this, newItem);
      }

   };

   /**
    * Unselect the row
    * @public
    */
   Row.prototype.unselect                        = function () {
      this.toggleSelection(false);
   };

   /**
    * @param {boolean}             [fieldValidation=true] Indicate if the field should also validate the item or not
    * @param {function}            [validationFunction]   Function to use to validate the values
    * @returns {Promise.<AdminLib.Action.RESPONSE_TYPE>}
    * @public
    */
   Row.prototype.validate                        = function (fieldValidation, validationFunction) {

      var /** @type {Item}    */ editedItem
        , /** @type {Promise} */ promise;

      promise = this.parent.isItemValide(this.item, fieldValidation, validationFunction);

      promise = promise.then(function(validationResult) {

         var /** @type {number}                         */ f
           , /** @type {AdminLib.widget.Datatable.Field} */ field
           , /** @type {string}                         */ message
           , /** @type {string}                         */ title;

         if (validationResult.result === AdminLib.Action.RESPONSE_TYPE.success)
            return {result : AdminLib.Action.RESPONSE_TYPE.success};

         // Adding the "danger" class to all cell that are concerned by the error
         for(var code of validationResult.fields) {
            field = this.getField(code);

            if (field === undefined)
               throw 'No field corresponding to the given code. Code provided : "' + code + '"';

            field.getCellDOM(this.dom).classList.add('danger');
         }

         title = validationResult.title !== undefined ? validationResult.title : this.title;
         message = validationResult.message !== undefined ? validationResult.message : 'The value provided are not valid';

         return { result  : AdminLib.Action.RESPONSE_TYPE.error
                , title   : title
                , message : message };

      }.bind(this));

      return promise;

   };

   Row.event                                     = { editModeDisabled : 'AdminLib.widget.Datatable.Row.event.editModeDisabled'
                                                   , editModeEnabled  : 'AdminLib.widget.Datatable.Row.event.editModeEnabled'};

   Row.onclick                                   = function (event, datatable) {

      var /** @type {AdminLib.widget.Datatable.Row} */ row;

      row = Row.get(event.target, datatable);

      if (row === undefined)
         throw 'Row not found';

      return row.onclick(event);
   };

   /**
    *
    * @param {HTMLElement}              dom
    * @param {AdminLib.widget.Datatable} datatable
    * @returns {AdminLib.widget.Datatable.Row}
    * @public
    */
   Row.get                                       = function (dom, datatable) {
      var /** @type {number} */ index
        , /** @type {HTMLTableRowElement} */ rowDOM;

      rowDOM = $(dom).closest('tr')[0];

      if (rowDOM === undefined || rowDOM === null)
         return undefined;

      index = parseInt(rowDOM.dataset.index)

      return datatable.getRow(index);
   };

   /**
    *
    * @param {HTMLElement} dom
    * @returns {string}
    * @private
    */
   Row.getDomType                                = function (dom) {
      return AdminLib.widget.Datatable.getDomType(dom);
   };

   Row.mergeOnFirstLaunch   = function() {
   };

   return Row;

})();