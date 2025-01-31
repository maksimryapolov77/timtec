(function(angular){
    'use strict';

    var module = angular.module('messages.controllers', []);

    // Service to share data across the controllers
    module.factory('messages_list', function() {
        return {
            messages : []
        };
    });

    module.controller('NewMessageController', ['$scope', '$uibModal', '$window', 'Message', 'Student', 'StudentSearch', 'Class', 'messages_list', '$rootScope', 'ContentFile', 'uiTinymceConfig',
        function($scope, $uibModal, $window, Message, Student, StudentSearch, Class, messages_list, $rootScope, ContentFile, uiTinymceConfig) {
            $scope.course_id = parseInt($window.course_id, 10);
            $scope.messages = messages_list.messages;

            uiTinymceConfig.images_upload_handler = ContentFile.upload;

            $scope.new_message = function () {
                var modalInstance = $uibModal.open({
                    templateUrl: 'newMessageModal.html',
                    controller: ['$scope', '$uibModalInstance', 'course_id', SendMessageModalInstanceCtrl],
                    resolve: {
                        course_id: function () {
                            return $scope.course_id;
                        }
                    }
                });
                modalInstance.result.then(function (new_message) {
                    new_message.$save({}, function(new_message){
                        messages_list.messages.unshift(new_message);
                        $rootScope.$broadcast('newMessage');
                    });

                });
            };
            var SendMessageModalInstanceCtrl = function ($scope, $uibModalInstance, course_id) {

                $scope.new_message = new Message();
                $scope.new_message.course = course_id;
                $scope.new_message.users = [];
                $scope.recipient_list = [];
                $scope.empty_msg_subject_error = false;
                $scope.empty_msg_body_error = false;

                $scope.classes = Class.query({course: course_id}, function(classes){
                    classes.checked = [];
                    $scope.classes_ready = true;
                    return classes;
                });

                // trick to user modal.all_checked in ng-model html tag
                $scope.modal = {};
                $scope.modal.all_checked = true;

                $scope.send = function () {
                    // TODO validação dos campo: títle e message não podem ser vazios
                    if ($scope.modal.all_checked) {
                        $scope.new_message.users = [];
                        angular.forEach($scope.classes, function(klass) {
                            $scope.new_message.users = $scope.new_message.users.concat(klass.students);
                        });
                    } else if ($scope.classes.checked) {
                        angular.forEach($scope.classes.checked, function(klass) {
                            $scope.new_message.users = $scope.new_message.users.concat(klass);
                        });
                    }
                    if ($scope.new_message.message && $scope.new_message.subject) {
                        $uibModalInstance.close($scope.new_message);
                        $scope.empty_msg_subject_error = false;
                        $scope.empty_msg_body_error = false;
                    }
                    if (!$scope.new_message.message) {
                        $scope.empty_msg_body_error = true;
                    } else {
                        $scope.empty_msg_body_error = false;
                    }
                    if (!$scope.new_message.subject) {
                        $scope.empty_msg_subject_error = true;
                    } else {
                        $scope.empty_msg_subject_error = false;
                    }
                };

                $scope.cancel = function () {
                    $uibModalInstance.dismiss();
                };
                $scope.getUsers = function(val) {
                    return new StudentSearch(val, course_id);
                };

                $scope.on_select_student = function(model) {
                    $scope.new_message.users.unshift(model.id);
                    $scope.recipient_list.unshift(model);
                    $scope.asyncSelected = '';
                };

                $scope.remove_student = function(index) {
                    $scope.new_message.users.splice(index, 1);
                    $scope.recipient_list.splice(index, 1);
                };

            };
        }
    ]);

    module.controller('NewGlobalMessageController', ['$scope', '$uibModal', '$window', 'MessageGlobal', 'Student', 'Group', 'UserSearch', 'Class', 'messages_list', '$rootScope', '$sce', 'ContentFile', 'uiTinymceConfig',
        function($scope, $uibModal, $window, MessageGlobal, Student, Group, UserSearch, Class, messages_list, $rootScope, $sce, ContentFile, uiTinymceConfig) {
            $scope.course_id = parseInt($window.course_id, 10);
            $scope.messages = messages_list.messages;

            uiTinymceConfig.images_upload_handler = ContentFile.upload;

            $scope.new_message = function () {
                var modalInstance = $uibModal.open({
                    templateUrl: 'newMessageModal.html',
                    controller: ['$scope', '$uibModalInstance', 'course_id', SendMessageModalInstanceCtrl],
                    resolve: {
                        course_id: function () {
                            return $scope.course_id;
                        }
                    }
                });
                modalInstance.result.then(function (new_message) {
                    new_message.$save({}, function(new_message){
                        messages_list.messages.unshift(new_message);
                        $rootScope.$broadcast('newMessage');
                    });

                });
            };
            var SendMessageModalInstanceCtrl = function ($scope, $uibModalInstance) {

                // Get groups listing
                Group.query({}, function (groups) {
                    $scope.groups = groups;
                });

                $scope.get_as_safe_html = function(value) {
                    return $sce.trustAsHtml(value);
                };

                $scope.contract_name = function(item) {
                    if (item.contract && item.contract.name !== '')
                        return item.contract.name;
                    else
                        return 'Grupos sem contrato';
                };

                $scope.group_label = function(item) {
                    if (item.contract && item.contract.name != '')
                        return item.name + ' - ' + item.contract.name;
                    else
                        return item.name;
                };

                $scope.new_message = new MessageGlobal();
                $scope.new_message.users = [];
                $scope.recipient_list = [];
                $scope.empty_msg_subject_error = false;
                $scope.empty_msg_body_error = false;

                // trick to user modal.all_checked in ng-model html tag
                $scope.modal = {};
                $scope.modal.modes = {
                    ALL_STUDENTS: 1,
                    SOME_GROUPS: 2,
                    SOME_STUDENTS: 3
                };
                $scope.modal.selected_mode = $scope.modal.modes.ALL_STUDENTS;

                $scope.send = function () {
                    if ($scope.modal.selected_mode == $scope.modal.modes.ALL_STUDENTS){
                        $scope.new_message.all_students = true;
                        delete $scope.new_message.users;  // ensures that the empty array wont be sent to the server
                    }
                    // If groups were specified, put them in a groups field
                    if ($scope.modal.selected_mode == $scope.modal.modes.SOME_GROUPS){
                        $scope.new_message.groups = $scope.groups.checked;
                        delete $scope.new_message.users;  // ensures that the empty array wont be sent to the server
                    }
                    if ($scope.new_message.message && $scope.new_message.subject) {
                        $uibModalInstance.close($scope.new_message);
                        $scope.empty_msg_subject_error = false;
                        $scope.empty_msg_body_error = false;
                    }
                    if (!$scope.new_message.message) {
                        $scope.empty_msg_body_error = true;
                    } else {
                        $scope.empty_msg_body_error = false;
                    }
                    if (!$scope.new_message.subject) {
                        $scope.empty_msg_subject_error = true;
                    } else {
                        $scope.empty_msg_subject_error = false;
                    }
                };

                $scope.cancel = function () {
                    $uibModalInstance.dismiss();
                };
                $scope.getUsers = function(val) {
                    return new UserSearch(val);
                };

                $scope.on_select_student = function(model) {
                    $scope.new_message.users.unshift(model.id);
                    $scope.recipient_list.unshift(model);
                    $scope.asyncSelected = '';
                };

                $scope.remove_student = function(index) {
                    $scope.new_message.users.splice(index, 1);
                    $scope.recipient_list.splice(index, 1);
                };

            };
        }
    ]);

    module.controller('MessagesListController', ['$scope', '$uibModal', '$sce', '$window', 'Message', 'messages_list',
        function($scope, $uibModal, $sce, $window, Message, messages_list) {
            $scope.course_id = parseInt($window.course_id, 10);
            $scope.course_slug = $window.course_slug;
            messages_list.messages = Message.query({course: $scope.course_id});
            $scope.messages = messages_list.messages;
            $scope.$on('newMessage', function() {
                $scope.messages = messages_list.messages;
            });

            $scope.strip_html = function(html_content) {
                var text = html_content ? "<p>"+String(html_content).replace(/<[^>]+>/gm, '')+"</p>" : '';
                return $sce.trustAsHtml(text);
            };
        }
    ]);

    module.controller('MessagesDashboardController', ['$scope', '$uibModal', '$sce', '$window', 'Message', 'messages_list',
        function($scope, $uibModal, $sce, $window, Message, messages_list) {
            // messages_list.messages = Message.query({limit_to: 2, unread: true});
            $scope.messages = Message.query({unread: true});

            $scope.strip_html = function(html_content) {
                var text = html_content ? "<p>"+String(html_content).replace(/<[^>]+>/gm, '')+"</p>" : '';
                return $sce.trustAsHtml(text);
            };
        }
    ]);

    module.controller('MessagesOverviewController', ['$scope', '$uibModal', '$sce', '$window', 'Message', 'messages_list',
        function($scope, $uibModal, $sce, $window, Message, messages_list) {
            messages_list.messages = Message.query({limit_to: 20});
            $scope.messages = messages_list.messages;

            $scope.strip_html = function(html_content) {
                var text = html_content ? "<p>"+String(html_content).replace(/<[^>]+>/gm, '')+"</p>" : '';
                return $sce.trustAsHtml(text);
            };
        }
    ]);

    module.controller('MessagesGlobalOverviewController', ['$scope', '$uibModal', '$sce', '$window', 'MessageGlobal', 'messages_list',
        function($scope, $uibModal, $sce, $window, MessageGlobal, messages_list) {
            messages_list.messages = MessageGlobal.query({limit_to: 20});
            $scope.messages = messages_list.messages;

            $scope.strip_html = function(html_content) {
                var text = html_content ? "<p>"+String(html_content).replace(/<[^>]+>/gm, '')+"</p>" : '';
                return $sce.trustAsHtml(text);
            };
        }
    ]);

    module.controller('MessageController', ['$scope', '$window', '$sce', 'Message', 'MessageRead',
        function($scope, $window, $sce, Message, MessageRead) {
            $scope.course_id = parseInt($window.course_id, 10);
            $scope.message_id = document.location.href.match(/message\/([0-9]+)/)[1];
            $scope.message = Message.get({messageId: $scope.message_id}, function(message) {
                MessageRead.save({message: $scope.message_id});
            });

            $scope.get_as_safe_html = function(html_content) {
                return $sce.trustAsHtml(html_content);
            }
        }
    ]);
})(angular);
