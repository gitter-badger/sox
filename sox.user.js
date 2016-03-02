// ==UserScript==
// @name         Stack Overflow Extras (SOX)
// @namespace    https://github.com/soscripted/sox
// @version      EXPERIMENTAL 1.0.1
// @description  Adds a bunch of optional features to sites in the Stack Overflow Network.
// @contributor  ᴉʞuǝ (stackoverflow.com/users/1454538/)
// @contributor  ᔕᖺᘎᕊ (stackexchange.com/users/4337810/)
// @updateURL    https://rawgit.com/soscripted/sox/experimental/sox.user.js
// @match        *://*.stackoverflow.com/*
// @match        *://*.stackexchange.com/*
// @match        *://*.superuser.com/*
// @match        *://*.serverfault.com/*
// @match        *://*.askubuntu.com/*
// @match        *://*.stackapps.com/*
// @match        *://*.mathoverflow.net/*
// @require      https://code.jquery.com/jquery-2.1.4.min.js
// @require      https://ajax.googleapis.com/ajax/libs/jqueryui/1.8/jquery-ui.min.js
// @require      https://cdn.rawgit.com/timdown/rangyinputs/master/rangyinputs-jquery-src.js
// @require      https://cdn.rawgit.com/jeresig/jquery.hotkeys/master/jquery.hotkeys.js
// @require      https://cdn.rawgit.com/camagu/jquery-feeds/master/jquery.feeds.js
// @require      https://rawgit.com/soscripted/sox/repo-system/sox.helpers.js
// @require      https://rawgit.com/soscripted/sox/repo-system/sox.features.js
// @resource     settingsDialog https://rawgit.com/soscripted/sox/repo-system/sox.dialog.html
// @resource     info https://rawgit.com/soscripted/sox/repo-system/themes/sox.features.info.json
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_getResourceText
// ==/UserScript==
/*jshint multistr: true */
(function(sox, $, undefined) {
    //var SOX = 'Stack Overflow Extras';
    var SOX_SETTINGS = 'SOXSETTINGS',
        INFO = GM_getResourceText('info'),
        uploadHandlers = {};

    var $settingsDialog = $(GM_getResourceText('settingsDialog')),
        $soxSettingsDialog,
        $soxSettingsDialogFeatures,
        $soxSettingsSave,
        $soxSettingsReset,
        $soxSettingsClose;

    function isAvailable() {
        return GM_getValue(SOX_SETTINGS, -1) != -1;
    }

    function getSettings() {
        return JSON.parse(GM_getValue(SOX_SETTINGS));
    }

    function getRepos() {
        var repos = GM_getValue('REPOS');
        return repos ? JSON.parse(repos) : [];
    }

    function getFiles() {
        var files = GM_getValue('FILES');
        return files ? JSON.parse(files) : [];
    }

    function getFile() {
        var file = GM_getValue(name);
        return file || '';
    }

    function updateRepos() { //TODO: $.get is synchronous?
        repos.forEach(function(repo) {
            var version = $.get(repo.url + 'version.txt');
            if (version > repo.version) {
                repo.files.forEach(function(file) {
                    GM_setValue(repo.name + '.' + file, $.get(file));
                });
            }
        });
    }

    function loadFiles() {
        var files = getFiles();
        files.forEach(function(file) {
            $('<script/>', {
                text: getFile(file) //TODO: text?
            }).appendTo('head');
        });
    }

//TODO: add file/repo URL via drop, overwrite confirmation

    function save(options) {
        var prev = isAvailable() ? getSettings() : {},
            newOptions = $.extend(prev, options);
        GM_setValue(SOX_SETTINGS, newOptions);
        console.log('SOX settings saved: ' + newOptions);
    }

    function addFeatures(features, category) {
        for (var feature in features) {
            var $div = $('<div/>'),
                $label = $('<label/>'),
                $input = $('<input/>', {
                    id: feature,
                    type: 'checkbox',
                    style: 'margin-right: 5px;'
                });
            $div.append($label);
            $label.append($input);
            $input.after(features[feature]);
            $('.after-sox-' + category + '-category').before($div);
        }
    }

    function addCategory(name) {
        var id = 'sox-' + name + '-category',
            class = 'after-' + $('.sox-settings-category:last').attr('class').split(' ')[1]; //TODO: better
        if  ($('#' + id).length) {
            return;
        }
        var $div = $('<div/>', {
                id: id
                class: 'sox-settings-category ' + class
            }),
            $h3 = $('<h3/>', {
                text: name
            });
        $div.append($h3);
        $soxSettingsDialogFeatures.append($div);
    }

    function loadFeatures(url) {
        //load json
        if (url) {
            $.getJSON(url, function(info) {
                if (!info) {
                    return;
                } else {
                    for (var category in info.all) {
                        addCategory(category);
                        addFeatures(info.all[category], category);
                    }
                    for (category in info[site]) { //TODO: site
                        addCategory(category);
                        addFeatures(info[site][category], category);
                    }
                }
            });
        } else if (INFO) {
            for (var category in INFO.all) {
                addCategory(category);
                addFeatures(INFO[category]);
            }
            for (category in INFO[site]) { //TODO: site
                addCategory(category);
                addFeatures(INFO[site][category]);
            }
            INFO = {}; //prevent multiple adding when blank repo url passed
        }
    }
    
    function initUpload() {
        ($('<div/>', {
            class: 'upload'
        }).css({
            'z-index': '1002',
            position: 'fixed',
            display: 'none',
            top: '0',
            left: '0',
            bottom: '0',
            right: '0',
            border: 'solid 10px rgba(255, 255, 255, 0.75)',
            background: 'rgba(0, 0, 0, 0)'
        })).append($('<div/>', {
            class: 'upload'
        }).css({
            position: 'absolute',
            'z-index': '1003',
            background: 'rgba(255, 255, 255, 0.75)',
            display: 'none',
            top: '0',
            left: '0',
            bottom: '0',
            right: '0',
            border: 'dashed 10px #888'
        })).appendTo('body');

        //Quick theme changer
        $('html').on('dragenter', function(e) {
            e.preventDefault();
            $('.upload').css({
                display: 'block'
            });
        });
        $('.upload').on('dragleave', function(e) {
            e.preventDefault();
            $('.upload').hide();
        });
        $('html').on('drop', function(e) { //TODO: fix this and get file name - if file:// + image upload
            console.log('yay');
            $('.upload').hide();
            e.preventDefault();
            console.log(e);
            window.e = e;
            console.log(e.dataTransfer.originalEvent.__proto__.dataTransfer.get.toString());
            console.log('data logged');
            console.log(e.dataTransfer.getData('path'));
            console.log(e.dataTransfer.getData('url'));
            console.log(e.dataTransfer.getData('text/html'));
        });
        //TODO: use uploadhandlers
        //TODO: fix uploading, detect filetype then conditionally show - if (chat && (extension === 'sox.css' || extension === 'sox.theme.js' || extension === 'png' || extension === 'jpg') {$('#upload').show();}
        // then set url: GM_setValue(siteName_siteType_(css|js), url)
        //TODO: support modifying html + js

        //TODO: get other settings from PPCG script - e.g. question of the day
    }

    //initialize sox
    (function() {

        // add sox CSS file and font-awesome CSS file
        $('head').append('<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/font-awesome/4.5.0/css/font-awesome.min.css">')
                 .append('<link rel="stylesheet" type="text/css" href="https://rawgit.com/soscripted/sox/dev/sox.css" />');
        $('body').append($settingsDialog);

        $soxSettingsDialog = $('#sox-settings-dialog');
        $soxSettingsDialogFeatures = $soxSettingsDialog.find('#sox-settings-dialog-features');
        $soxSettingsSave = $soxSettingsDialog.find('#sox-settings-dialog-save');
        $soxSettingsReset = $soxSettingsDialog.find('#sox-settings-dialog-reset');
        $soxSettingsClose = $soxSettingsDialog.find('#sox-settings-dialog-close');

        loadFeatures(); //load all the features in the settings dialog

        // add settings icon to navbar
        var $soxSettingsButton = $('<a/>', {
                id: 'soxSettingsButton',
                class: 'topbar-icon yes-hover sox-settings-button',
                title: 'Change SOX Settings',
                style: 'color: #A1A1A1',
                click: function(e) {
                    e.preventDefault();
                    $('#sox-settings-dialog').toggle();
                }
            }),
            $icon = $('<i/>', {
                class: 'fa fa-cogs'
            });
        $soxSettingsButton.append($icon).appendTo('div.network-items');

        // add click handlers for the buttons in the settings dialog
        $soxSettingsClose.on('click', function() {
            $soxSettingsDialog.hide();
        });
        $soxSettingsReset.on('click', function() {
            reset();
            location.reload(); // reload page to reflect changed settings
        });
        $soxSettingsSave.on('click', function() {
            var extras = [];
            $soxSettingsDialogFeatures.find('input[type=checkbox]:checked').each(function() {
                var x = $(this).attr('id');
                extras.push(x); //Add the function's ID (also the checkbox's ID) to the array
            });
            save(extras);
            location.reload(); // reload page to reflect changed settings
        });

        // check if settings exist and execute desired functions
        if (isAvailable()) {//TODO: load uploadhandlers
            var extras = getSettings();
            // TODO: cache files, other stuff, if $.get(repoURL + 'version.txt') >  repoVersion
            for (var i = 0; i < extras.length; ++i) {
                $soxSettingsDialogFeatures.find('#' + extras[i]).prop('checked', true);
                try {
                    features[extras[i]](); //Call the functions that were chosen
                } catch(err) {
                    $soxSettingsDialogFeatures.find('#' + extras[i]).parent().css('color', 'red').attr('title', 'There was an error loading this feature. Please raise an issue on GitHub.');
                    console.log('SOX error: There was an error loading the feature "' + extras[i] + '". Please raise an issue on GitHub, and copy the following error log.');
                    console.log('Error details:');
                    console.log(err);
                    i++;
                }
            }
        } else {
            // no settings found, mark all inputs as checked and display settings dialog
            $soxSettingsDialogFeatures.find('input').prop('checked', true);

            setTimeout(function(){
                $soxSettingsDialog.show();
            }, 500);

            //$soxSettingsDialog.delay(800).show(); //not working -- why!?
        }

    })();
}(window.sox = window.sox || {}, jQuery));
