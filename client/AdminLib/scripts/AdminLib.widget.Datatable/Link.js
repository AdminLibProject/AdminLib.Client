'use strict';

AdminLib.widget.Datatable.Link                    = (function() {

   var domAttributes = AdminLib.widget.Datatable._domAttributes;

   /**
    *
    * @name AdminLib.widget.Datatable.Link
    * @extends AdminLib.Link
    * @param {AdminLib.widget.Datatable.Link.Parameters} parameters
    * @param {AdminLib.widget.Datatable
    * @param {AdminLib.widget.Datatable.Field}          field
    * @constructor
    * @property {AdminLib.widget.Datatable.Field}                field
    * @property {AdminLib.widget.Datatable}                      datatable
    * @property {boolean|AdminLib.widget.Datatable.Link.Enabled} enabled
    * @property {string|AdminLib.widget.Datatable.Link.Handler}  handler
    * @property {AdminLib.Model}                                 model
    * @property {string}                                        url
    */
   function Link(parameters, parent) {

      parameters     = Link.coalesceParameters([parameters]);

      this.clicableCell = parameters.clicableCell;

      if (parent instanceof AdminLib.widget.Datatable)
         this.datatable = parent;
      else {
         this.field     = parent;
         this.datatable = this.field.parent;
      }

      if (parameters.enabled instanceof Array) {
         this.enabledList = parameters.enabled;
         this.enabledList.include = AdminLib.coalesce(parameters.enabled.include, true);
         parameters.enabled = true;
      }

      this.equalFunction = parameters.equal;
      this.useValue      = parameters.useValue;

      if (typeof(parameters.handler) !== 'function' && parameters.model === undefined)
         parameters.model = this.model;

      AdminLib.Link.call(this, parameters);

   };

   Link.prototype                                = Object.create(AdminLib.Link.prototype);
   Link.prototype.constructor                    = Link;

   /**
    *
    * @param {Item} item
    */
   Link.prototype.getDOM                         = function getDOM(item, equal) {

      var /** @type {HTMLTableCellElement} */ dom;

      if (!this.datatable.tableDOM)
         return undefined;

      if (this.field === undefined)
         return this.datatable.getRow(item).getDOM();

      dom = this.field.getCellDOM(item, equal);

      return dom;
   };

   Link.prototype.getTemplateData                = function getTemplateData(row, field) {
      var /** @type {Objec} */ data;
      data = { enabled : this.isEnabled(row.getItem()) };
      return data;
   };

   /**
    * Indicate if the link is clicable by a link (false) or a cell (true).
    * This doesn't means that the link is enabled or not.
    * @public
    */
   Link.prototype.isClicableCell                 = function isClicableCell() {
      return this.clicableCell;
   };

   /**
    *
    * @param {Item|number}                  item
    * @param {function(Item, Item):boolean} equal
    * @returns {boolean}
    * @public
    */
   Link.prototype.isEnabled                      = function isEnabled(item, equal) {

      var /** @type {AdminLib.widget.Datatable.Cell} */ cell
        , /** @type {boolean}                       */ enabled
        , /** @type {Array}                         */ enableParameters
        , /** @type {number}                        */ itemIndex
        , /** @type {HTMLElement}                   */ itemDOM
        , /** @type {Item}                          */ filterList;

      if (item === undefined)
         return AdminLib.Link.prototype.isEnabled.call(this);

      if (typeof(item) === 'number') {
         itemIndex = item;
         item = this.datatable.getItem(itemIndex);
      }

      // We look the value in the DOM if the item DOM exists
      itemDOM = this.getDOM(item);

      // If the datatable DOM is not already created, we look for the default value
      if (!itemDOM) {

         // Checking if there is not yet a value defined at cell level
         if (this.field) {
            if (this.datatable.hasCell(this.field, item)) {
               cell = this.datatable.getCell(this.field, item)

               if (cell.hasCustomLinkEnableProperty())
                  return cell.isLinkEnabled();

            }
         }

         // If we have a list of enabled items, then we check if the item is in the list
         if (this.enabledList instanceof Array) {

            if (this.equalFunction) {

               filterList = this.enabledList.filter(this.equalFunction.bind(undefined, item));

               if (filterList.length === 0)
                  return !this.enabledList.include;
               else
                  return this.enabledList.include;

            }
            else {
               if (this.enabledList.indexOf(item) !== -1)
                  return this.enabledList.include;

               if (itemIndex === undefined)
                  itemIndex = this.datatable.getIndex(item);

               enabled = this.enabledList.indexOf(itemIndex);

               if (this.enabledList.include)
                  return enabled;
               else
                  return !enabled;
            }
         }

         return AdminLib.Link.prototype.isEnabled.call(this, item, this);
      }

      // If the tabledom is created
      // we check the enabled attribute
      return itemDOM.getAttribute(domAttributes.dataset.link.enabled.attribute) === domAttributes.dataset.link.enabled.true;
   };

   /**
    * Enable or disable the link for all items or one item.
    * @param {boolean} [enabled]
    * @param {Item|AdminLib.widget.Datatable.Row} [item]
    * @param {AdminLib.Equal}                     [equal]
    * @public
    */
   Link.prototype.toggleEnabled                  = function toggleEnabled(enabled, item, equal) {

      var /** @type {AdminLib.widget.Datatable.Cell} */ cell
        , /** @type {HTMLElement}                   */ dom
        , /** @type {Item}                          */ item;

      if (enabled === undefined)
         enabled = !this.isEnabled(item);

      if (item === undefined)
         this.enabled = enabled;

      // If the item is not defined
      // then we toggle the link of all items
      if (item === undefined) {
         // If the tableDOM is not yet defined, then we don't have to disable the links
         if (!this.datatable.tableDOM)
            return;

         for(item in this.datatable.data) {
            this.toggleEnabled(this.enabled, item, equal);
         };

         return;
      }

      // If the tableDOM is already loaded, we make toggle in the DOM
      if (this.datatable.tableDOM) {

         dom = this.getDOM(item, equal);

         // Setting the "link disabled" attribute
         dom.setAttribute(domAttributes.dataset.link.enabled.attribute, enabled ? domAttributes.dataset.link.enabled.true
                                                                                : domAttributes.dataset.link.enabled.false );

         // Disabling the link and the css
         if (this.field.isClicable(item)) {
            dom.classList.toggle('linkDisabled', !enabled);
         }
         else
            dom.querySelector('a').disabled = !enabled;
      }
      // If the tableDOM is not yet created, we keep the value in the cell object.
      else if (this.field) {
         cell = this.field.getCell(item, equal);
         cell.toggleLinkEnabled(enabled)
      }

   };

   /**
    *
    * @param {AdminLib.widget.Datatable.Link.Parameter[]} parametersList
    */
   Link.coalesceParameters = function coalesceParameters(parametersList) {

      var /** @type {AdminLib.widget.Datatable.Link.CForm} */ coalescedParameters
        , /** @type {boolean}                             */ linkField;

      coalescedParameters = AdminLib.Link.coalesceParameters(parametersList);

      if (coalescedParameters === false)
         return false;

      coalescedParameters.clicableCell = AdminLib.coalesceAttribute('clicableCell', parametersList, true)
      coalescedParameters.equal        = AdminLib.coalesceAttribute('equal'       , parametersList);
      coalescedParameters.useValue     = AdminLib.coalesceAttribute('useValue'    , parametersList, false);

      if (coalescedParameters.enabled instanceof Array)
         coalescedParameters.enabled = coalescedParameters.enabled.slice(0);

      return coalescedParameters;
   };

   return Link;
})();