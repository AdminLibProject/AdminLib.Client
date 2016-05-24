'use strict';

AdminLib.debug = (function() {

   /**
    * This function is to be call when you didn't yet implemented a save function for you model.
    *
    * @param {string}      apiName
    * @param {HTMLElement} content
    * @return {Promise.<ActionResult>}
    */
   function actionConfirmation(apiName, content) {

      var /** @type {HTMLElement} */ modalDOM
        , /** @type {Object}      */ modalTemplateData
        , /** @type {Promise}     */ promise
        , /** @type {function}    */ promiseFullfillFunction;

      // Building promise that will be returned
      promise = new Promise(function(fullfill) {
         promiseFullfillFunction = fullfill;
      });

      // Creating the modal template data
      modalTemplateData = { labels  : []
                          , apiName : apiName};

      // Building the modal
      modalDOM = AdminLib.dom.build(actionConfirmationTemplate, modalTemplateData);

      modalDOM.querySelector('.modal-body').appendChild(content);

      // Adding listeners for each buttons of the modal

      // Button : success
      modalDOM.querySelector('#success').addEventListener('click', function() {

         var /** @type {ActionResult} */ actionResult;

         actionResult = { success : true
                        , title   : 'Not yet implemented'
                        , message : 'Success message from the "debug.' + apiName + '" function'};

         promiseFullfillFunction(actionResult);
      });

      // Button : error
      modalDOM.querySelector('#error').addEventListener('click', function() {

         var /** @type {SaveResult} */ actionResult;

         actionResult = { success : false
                        , title   : 'Not implemented !'
                        , message : 'Error message from the "debug.' + apiName + '" function'};

         promiseFullfillFunction(actionResult);
      });

      // Button : edit
      modalDOM.querySelector('#edit').addEventListener('click', function() {

         var /** @type {HTMLElement} */ editDOM
           , /** @type {string}      */ message
           , /** @type {string}      */ title;

         title   = 'Not implemented !';
         message = 'Error message from the "debug.' + apiName + '" function';

         editDOM = AdminLib.dom.build(customResponseTemplate, { title   : title
                                                  , message : message});

         editDOM.querySelector('button#OK').addEventListener('click', function() {

            var /** @type {ActionResult}  */ ActionResult;

            title   = editDOM.querySelector('input#inputTitle').value;
            message = editDOM.querySelector('input#inputMessage').value;

            ActionResult = { success : false
                           , title   : title
                           , message : message};

            $(editDOM).modal('hide');
            promiseFullfillFunction(ActionResult);
         });

         $(editDOM).modal('show');

      });

      // Displaying the modal
      $(modalDOM).modal('show');

      return promise.then(function(actionResult) {
         $(modalDOM).modal('hide');
         return actionResult;
      });
   }

   /**
    * This function is to be call when you didn't yet implemented a save function for you model.
    *
    * @param {Item} createdItem
    * @param {string} [apiName="createdItem"]
    * @return {Promise.<ActionResult>}
    */
   function createItem(createdItem, apiName) {

      var /** @type {HTMLElement} */ dom
        , /** @type {number}      */ f
        , /** @type {string}      */ template
        , /** @type {Object}      */ templateData;

      apiName = AdminLib.coalesce(apiName, 'createdItem');

      // Creating the modal template data
      templateData = { createdItem : [] };

      for(f in createdItem) {
         templateData.createdItem.push({ name : f, value : createdItem[f] });
      }

      template =
            '<div class="row">'

         +     '<div class="col-md-6">'

         +        '<h4>New item values</h4>'
         +        '<dl class="dl-horizontal">'
         +           '{{#createdItem}}'
         +              '<dt>{{name}}</dt>'
         +              '<dd>{{value}}</dd>'
         +           '{{/createdItem}}'
         +        '</dl>'

         +     '</div>'
         +  '</div>';

      dom = AdminLib.dom.build(template, templateData);

      return actionConfirmation(apiName, dom);
   }

   /**
    * This function is to be call when you didn't yet implemented a save function for you model.
    *
    * @param {Item[]|function(Item):string} param1 - If function, then use as "getItemLabel"
    * @param {Item[]} [param2]
    * @return {Promise.<ActionResult>}
    */
   function deleteItems(param1, param2) {

      var /** @type {Item[]}                */ deletedItems
        , /** @type {HTMLElement}           */ dom
        , /** @type {number}                */ i
        , /** @type {string[]}              */ labels
        , /** @type {string}                */ template
        , /** @type {function(Item):string} */ getItemLabel;

      if (param2 !== undefined) {
         deletedItems = param2;
         getItemLabel = param1;
      }
      else {
         deletedItems = param1;
         getItemLabel = function(item) {
            return AdminLib.coalesce(item.label, item.code, item.id);
         }
      }

      template =  '<ul>{{#labels}}<li>{{.}}</li>{{/labels}}</ul>';

      labels = [];

      for(i in deletedItems) {
         labels.push(getItemLabel(deletedItems[i]));
      }

      dom = AdminLib.dom.build(template, {labels:labels});

      return actionConfirmation('deletedItems', dom);
   }

   /**
    * This function is to be call when you didn't yet implemented a save function for you model.
    *
    * @param {Item} oldItem
    * @param {Item} newItem
    * @return {Promise.<ActionResult>}
    */
   function saveEdit(newItem, oldItem) {

      var /** @type {HTMLElement} */ dom
        , /** @type {number} */ f
        , /** @type {string} */ template
        , /** @type {Object} */ templateData;

      // Creating the modal template data
      templateData = { newItemFields : []
                     , oldItemFields : []};

      for(f in newItem) {
         templateData.newItemFields.push({ name : f, value : newItem[f] });
      }

      for(f in oldItem) {
         templateData.oldItemFields.push({ name : f, value : oldItem[f] });
      }

      template =
            '<div class="row">'

         +     '<div class="col-md-6">'
         +        '<h4>New item values</h4>'
         +        '<dl class="dl-horizontal">'
         +           '{{#newItemFields}}'
         +              '<dt>{{name}}</dt>'
         +              '<dd>{{value}}</dd>'
         +           '{{/newItemFields}}'
         +        '</dl>'
         +     '</div>'

         +     '<div class="col-md-6">'
         +        '<h4>Old item values</h4>'
         +           '<dl class="dl-horizontal">'
         +              '{{#oldItemFields}}'
         +                 '<dt>{{name}}</dt>'
         +                 '<dd>{{value}}</dd>'
         +              '{{/oldItemFields}}'
         +           '</dl>'
         +        '</div>'

         +     '</div>'
         +  '</div>';

      dom = AdminLib.dom.build(template, templateData);

      return actionConfirmation('saveEdit', dom);
   }

   var actionConfirmationTemplate =
         '<div id="responsive" class="modal fade" tabindex="-1" data-width="760">'
      +     '<div class="modal-header">'
      +        '<button type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button>'
      +        '<h3>[Debug] The model don\'t implemented yet a "{{apiName}}" function.</h3>'
      +     '</div>'
      +     '<div class="modal-body">'
      +     '</div>'

      +     '<div class="modal-footer">'
      +        '<button id="success" type="button" class="btn btn-success">Success</button>'
      +        '<button id="error"   type="button" class="btn btn-danger">Error</button>'
      +        '<button id="edit"    type="button" class="btn btn-default">Edit response</button>'
      +     '</div>'

      +  '</div>';

   var customResponseTemplate =
         '<div id="responsive" class="modal fade" tabindex="-1" data-width="760">'
      +     '<div class="modal-header">'
      +        '<button type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button>'
      +        '<h3>Response edition</h3>'
      +     '</div>'
      +     '<div class="modal-body">'
      +        '<div class="row">'
      +           '<div class="col-md-12">'
      +              '<form role="form" class="form-horizontal">'

                        // Success
      +                 '<div class="form-group">'
      +                    '<label for="inputSuccess" class="col-sm-2 control-label">Success</label>'
      +                    '<div class="col-sm-10">'
      +                       '<input type="checkbox" class="form-control" id="inputSuccess">'
      +                    '</div>'
      +                 '</div>'

      +                 // Title
      +                 '<div class="form-group">'
      +                    '<label for="inputTitle" class="col-sm-2 control-label">Title</label>'
      +                    '<div class="col-sm-10">'
      +                       '<input type="text" class="form-control" id="inputTitle" value="{{title}}">'
      +                    '</div>'
      +                 '</div>'

                        // Message
      +                 '<div class="form-group">'
      +                    '<label for="inputMesssage" class="col-sm-2 control-label">Message<label>'
      +                    '<div class="col-sm-10">'
      +                       '<input type="text" class="form-control" id="inputMesssage" value="{{message}}">'
      +                    '</div>'
      +                 '</div>'

      +              '</form>'
      +           '</div>'
      +        '</div>'
      +     '</div>'

      +     '<div class="modal-footer">'
      +        '<button id="OK" type="button" data-dismiss="modal" class="btn btn-success">OK</button>'
      +     '</div>'

      +  '</div>';

   return { createItem  : createItem
          , deleteItems : deleteItems
          , saveEdit    : saveEdit };

})();