'use strict';

AdminLib.User = (function() {

   var /** @type {User} */ user;

   /**
    *
    * @param {number} id
    * @param {string} username
    * @param {string} email
    * @constructor
    * @extend AdminLib.EventTarget
    */
   function User(id, username, email) {

      AdminLib.EventTarget.call(this);

      this.id       = id;
      this.username = username;
      this.email    = email;

      this.profile = new Profile();
   }

   User.prototype                                = Object.create(AdminLib.EventTarget.prototype);
   User.prototype.constructor                    = User;

   /**
    *
    * @returns {Promise}
    */
   User.prototype.refresh                        = function() {
      return this.profile.refresh()
   };

   function Profile() {
      this.loaded = false;
   }

   Profile.prototype.refresh                     = function() {

      return AdminLib.loadAjax('user/current', {fields: ['profile']}).then(function(user) {
         this.loaded     = true;
         this.firstName = user.profile.firstName;
         this.lastName  = user.profile.lastName;
         this.avatar     = user.profile.avatar;
      }.bind(this));

   };

   return User;
})();