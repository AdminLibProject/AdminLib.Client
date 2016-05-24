'use strict';

AdminLib.widget.Portlet.CodeEditor                = (function() {

   /**
    * @name AdminLib.widget.Portlet.Editor.Parameters
    * @mixes AdminLib.widget.Portlet.Parameters
    * @property {AdminLib.CODE_LANGUAGE} language
    * @property {string}                text
    *
    */

   /**
    * @extends AdminLib.widget.Portlet.Editable
    * @param {AdminLib.widget.Portlet.Editor.Parameters} parameters
    * @constructor
    * @property {AdminLib.CODE_LANGUAGE} language
    * @property {string}                text
    */
   function Portlet(parameters) {

      parameters = Portlet.coalesceParameters([parameters]);

      this.language        = parameters.language;
      this.text            = parameters.text;

      AdminLib.widget.Portlet.Editable.call(this, parameters);
   }

   Portlet.prototype                             = Object.create(AdminLib.widget.Portlet.Editable.prototype);
   Portlet.prototype.constructor                 = Portlet;

   /**
    * @protected
    */
   Portlet.prototype.buildDOM                    = function buildDOM() {

      // Note : we don't use either a form nor a template : the "buildDOM" function
      // of the AdminLib.widget.Portlet.Editable class should not be called.
      AdminLib.widget.Portlet.prototype.buildDOM.call(this);

      if (this.isEditModeEnabled())
         this.enableEditMode();
      else
         this.disableEditMode();

   };

   /**
    *
    * @protected
    */
   Portlet.prototype.createForm                  = function() {

      if (this.language)
         this.loadEditor = AdminLib.Package.load('codeMirror.' + this.language);
      else
         this.loadEditor = AdminLib.Package.load('codeMirror');

      this.loadEditor.then(function() {

         this.editor = new CodeMirror( this.getDOM()
                                     , { lineNumbers : true
                                       , mode        : this.language === 'sql' ? 'text/x-plsql' : this.language
                                       , readOnly    : !this.isEditModeEnabled()
                                       , value       : this.text });

      }.bind(this));

   };

   /**
    * Define the position of the cursor
    * See the function "doc.setCursor" in https://codemirror.net/doc/manual.html#api_sizing
    *
    * @param {string} line
    * @param {string} position
    * @public
    */
   Portlet.prototype.setCursor                   = function setCursor(line, position) {
      this.editor.getDoc().setCursor(line, position);
   };

   Portlet.prototype.getEditedText               = function getEditedText() {

      return this.editor.getDoc().getValue();

   };

   Portlet.prototype.saveForm                    = function saveForm() {

      var /** @type {Promise.<SaveResult>} */ promise;

      if (this.saveFunction !== undefined) {
         promise = this.saveFunction(this.getEditedText());

         promise = promise
                     .then(
                        function(result) {

                           if (result.success && result.data) {
                              this.setText(result.data);
                           }

                           return result;

                        }.bind(this))

      }
      else
         promise = Promise.resolve({success: true});

      return promise;
   };

   /**
    * @param {string} text
    * @public
    */
   Portlet.prototype.setText                     = function setText(text) {
      this.text = text;
      this.editor.getDoc().setValue(this.text);
   };

   /**
    *
    * @protected
    */
   Portlet.prototype.toggleFormEnable            = function toggleFormEnable() {

      if (!this.editor)
         return;

      this.editor.setOption('readOnly', !this.isEditModeEnabled());

      // If the edition is disabled
      // then we reset the value
      if (!this.isEditModeEnabled())
         this.setText(this.text);
   }

   /**
    * @param {AdminLib.widget.Portlet.Editor.Parameters[]} parametersList
    * @return AdminLib.widget.Portlet.Editor.Parameters
    * @public
    */
   Portlet.coalesceParameters                    = function coalesceParameters(parametersList) {

      var /** @type {AdminLib.widget.Portlet.Editor.Parameters} */ coalescedParameters;

      coalescedParameters = AdminLib.widget.Portlet.Editable.coalesceParameters(parametersList);

      coalescedParameters.language        = AdminLib.coalesceAttribute('language'       , parametersList, ['css', 'html', 'javascript', 'sql']).slice(0);
      coalescedParameters.text            = AdminLib.coalesceAttribute('text'           , parametersList, '');

      return coalescedParameters;

   };



   return Portlet;

})();