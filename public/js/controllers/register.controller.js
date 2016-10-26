(function() {
    'use strict';

    angular
        .module('app')
        .controller('RegisterController', RegisterController);

    RegisterController.$inject = ['UserService', '$location', '$rootScope', 'FlashService', '$scope'];

    function RegisterController(UserService, $location, $rootScope, FlashService, $scope) {
        $rootScope.dynamicPageClass = "register";

        //Initialize all tooltips
        $(function() {
            $('[data-toggle="tooltip"]').tooltip()
        });

        var vm = this;
        vm.register = register;

        function register() {
            vm.dataLoading = true;
            vm.user.imageData = $("#contactPic").attr('src');
            UserService.Create(vm.user)
                .then(function(response) {
                    if (response.success) {
                        FlashService.Success(response.message, true);
                        $location.path('/login');
                    } else {
                        FlashService.Error(response.message);
                        vm.dataLoading = false;
                    }
                });
        }

        //To select image for contact
        $scope.uploadImage = function() {
            $("#imageUpload").click();
        }

        //Handle when the image is selected. Store Base64 format of image
        $scope.imageSelected = function(image) {
            $scope.uploadedImage = null;
            var reader = new FileReader();
            reader.onload = function(e) {
                $("#contactPic").attr('src', e.target.result);
            }
            reader.readAsDataURL(image[0]);
            angular.element("#imageUpload").val(null);
        }
    }

})();
