(function () {
    'use strict';

    angular
        .module('app')
        .factory('UserService', UserService);

    UserService.$inject = ['$http'];
    function UserService($http) {
        var service = {};

        service.GetContacts = GetContacts;
        service.GetAllConversationsForUser = GetAllConversationsForUser;
        service.GetConversationForUser = GetConversationForUser;
        service.GetByUsername = GetByUsername;
        service.Create = Create;
        service.Update = Update;
        service.Delete = Delete;
        service.AuthenticateUser = AuthenticateUser;

        return service;

        function AuthenticateUser(user) {
            return $http.post('/api/authenticate', user).then(handleSuccess, handleError('Error signing in'));
        }

        function GetContacts(user) {
            return $http.post('/api/contacts', user).then(handleSuccess, handleError('Error getting contacts'));
        }

        function GetAllConversationsForUser(user) {
            return $http.post('/api/allConversations', user).then(handleSuccess, handleError('Error getting conversations for User'));
        }

        function GetConversationForUser(user) {
            return $http.post('/api/conversation', user).then(handleSuccess, handleError('Error getting conversations for User'));
        }

        function GetByUsername(username) {
            return $http.get('/api/users/' + username).then(handleSuccess, handleError('Error getting user by username'));
        }

        function Create(user) {
            return $http.post('/api/create', user).then(handleSuccess, handleError('Error creating user'));
        }

        function Update(user) {
            return $http.put('/api/users/' + user.id, user).then(handleSuccess, handleError('Error updating user'));
        }

        function Delete(id) {
            return $http.delete('/api/users/' + id).then(handleSuccess, handleError('Error deleting user'));
        }

        // private functions

        function handleSuccess(res) {
            return res.data;
        }

        function handleError(error) {
            return function () {
                return {
                    success: false,
                    message: error
                };
            };
        }
    }

})();
