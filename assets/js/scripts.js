var tableXSLTProcessor, listXSLTProcessor;

/** Add XML files to local storage. */
$( "#add-files" ).change(function(evt) {
    showLoading();
    var files = evt.target.files;
    var uniqueFilenames = $('#unique-fn').val() == 'True';
    var pending = files.length;

    for (var i = 0, f; f = files[i]; i++) {
        if (f.type !== 'text/xml') {
            showAlert(f.name + ' is not a valid XML file', 'warning');
            continue;
        }

        var reader = new FileReader();
            reader.onload = (function(theFile) {
                return function(e) {

                // Check for uniqueness
                var key = theFile.name;
                if (localStorage.getItem(theFile.name) && uniqueFilenames) {
                    showAlert('A file with the name ' + theFile.name + ' has \
                              already been uploaded.', 'warning');
                } else if (!uniqueFilenames) {
                    key += Date.now();
                }

                try {
                    //Remove XML declaration (for merging) and store
                    var xmlStr = e.target.result.replace(/<\?xml.*?\?>/g, "");
                    localStorage.setItem(key, xmlStr);
                } catch (e) {
                    hideLoading();
                    showAlert("Upload failed, local storage quota \
                              exceeded. The currently loaded files must be \
                              cleared before more can be uploaded.", 'danger');
                    throw new Error(e)
                }

                --pending
                if (pending == 0) {
                    refreshViews();
                }
            };
        })(f);
        reader.readAsText(f);
    }
});


/** Show loading icon. */
function showLoading() {
    $('#files-uploaded').hide();
    $('#loading-icon').show();
}


/** Hide loading icon. */
function hideLoading() {
    $('#loading-icon').hide();
    $('#files-uploaded').show();
}


/** Refresh the table and list views. */
function refreshViews() {
    var mergedDocs = mergeUploadedDocs();
    if (typeof tableXSLTProcessor == "undefined" ||
        typeof listXSLTProcessor == "undefined") {
        showAlert('XSLT processors not loaded yet, please try again.', 'warning');
    } else {
        var tableDoc = tableXSLTProcessor.transformToFragment(mergedDocs, document);
        var listDoc = listXSLTProcessor.transformToFragment(mergedDocs, document);
        var hiddenCols = getHiddenColumns();
        $('#table-view').html(tableDoc);
        $('#list-view').html(listDoc);
        $(hiddenCols).each(function(k, v) {  // Hide previously hidden columns
            hideColumn(v);
        });
    }
    $('#files-uploaded').html(localStorage.length + ' files uploaded');
    $('#tei-form').trigger("reset");
    enableSettings();
    populateTableMenus();
    hideLoading();
}


/** Populate the hide, show and sort menus. */
function populateTableMenus() {
    var headings = []
    var hiddenCols = 0;
    $('table th').each(function(i) {
        var h = {'label': $(this).html(), 'visible': $(this).is(':visible'),
                 'index': i}
        headings.push(h);
        if ($(this).is(':hidden')) {
            ++hiddenCols;
        }
    });

    if (headings.length > 0) {
        $( "#sort-menu" ).load( "_snippets.html #thead-li-template", function() {
            var template = $('#thead-li-template').html();
            var rendered = Mustache.render(template, {cls: 'sort-column',
                                           headings: headings});
            $('#thead-li-template').remove();
            $("#sort-menu").append(rendered);
        });
    } else {
        $( "#sort-menu" ).load( "_snippets.html #option-ph-template", function() {
            var template = $('#option-ph-template').html();
            var rendered = Mustache.render(template, {label: "Nothing to sort"});
            $('#option-ph-template').remove();
            $("#sort-menu").append(rendered);
        });
    }

    if (hiddenCols != headings.length) {
        $( "#hide-menu" ).load( "_snippets.html #thead-li-template", function() {
            var template = $('#thead-li-template').html();
            function getCls() {
                return (this.visible) ? "hide-column" : "hide-column hidden";
            }
            var rendered = Mustache.render(template, {cls: getCls,
                                           headings: headings});
            $('#thead-li-template').remove();
            $("#hide-menu").append(rendered);
        });
    } else {
        $( "#hide-menu" ).load( "_snippets.html #option-ph-template", function() {
            var template = $('#option-ph-template').html();
            var rendered = Mustache.render(template, {label: "Nothing to hide"});
            $('#option-ph-template').remove();
            $("#hide-menu").append(rendered);
        });
    }

    if (hiddenCols > 0) {
        $( "#show-menu" ).load( "_snippets.html #thead-li-template", function() {
            var template = $('#thead-li-template').html();
            function getCls() {
                return (!this.visible) ? "show-column" : "show-column hidden";
            }
            var rendered = Mustache.render(template, {cls: getCls,
                                           headings: headings});
            $('#thead-li-template').remove();
            $("#show-menu").append(rendered);
        });
    } else {
        $( "#show-menu" ).load( "_snippets.html #option-ph-template", function() {
            var template = $('#option-ph-template').html();
            var rendered = Mustache.render(template, {label: "Nothing to show"});
            $('#option-ph-template').remove();
            $("#show-menu").append(rendered);
        });
    }
}


/** Hide a table column. */
function hideColumn(i) {
    $('table tr > *:nth-child(' + i + ')').hide();
    populateTableMenus();
}


/** Hide column menu item clicked. */
$( "#hide-menu" ).on('click', '.hide-column', function(e) {
    var index = parseInt($(this).attr('data-index')) + 1;
    hideColumn(index);
    e.preventDefault();
});


/** Show a table column. */
function showColumn(i) {
    $('table tr > *:nth-child(' + i + ')').show();
    populateTableMenus();
}


/** Show column menu item clicked. */
$( "#show-menu" ).on('click', '.show-column', function(e) {
    var index = parseInt($(this).attr('data-index')) + 1;
    showColumn(index);
    e.preventDefault();
});


/** Return an array of currently hidden indexes. */
function getHiddenColumns(){
    var hiddenCols = [];
    $('table th').each(function(k, v) {
        if ($(this).is(':hidden')) {
            hiddenCols.push(k + 1);
        }
    });
    return hiddenCols;
}


/** Sort table by column. */
function sortTable(i) {

}


/** Enable or disable settings certain settings if local storage is empty. */
function enableSettings() {
    if (localStorage.length == 0){
        $('#unique-fn').attr('disabled', false);
        $('#default-settings').attr('disabled', false);
    } else {
        $('#unique-fn').attr('disabled', true);
        $('#default-settings').attr('disabled', true);
    }
    $('#unique-fn').selectpicker('refresh');
}


/** Return all uploaded files merged into single XML document. */
function mergeUploadedDocs(){
    var xmlStr, values = [], keys = Object.keys(localStorage), i = keys.length;
    while ( i-- ) {
        values.push(localStorage.getItem(keys[i]));
    }
    xmlStr = '<MERGED-TEI>' + values.join("") + '</MERGED-TEI>';
    return loadXMLDoc(xmlStr);
}


/** Display a Bootstrap alert. */
function showAlert(msg, type) {
    $( "#alerts" ).load( "_alerts.html #alert-template" ,function(){
        var template = $('#alert-template').html();
        var rendered = Mustache.render(template, {msg: msg, type: type});
        $('#alert-template').remove();
        $( "#alerts" ).append(rendered);
    });
}


/** Clear local storage and refresh views. */
$( "#clear-views" ).click(function() {
    showLoading();
    localStorage.clear();
    refreshViews();
});


/** Refresh the current XSLT processors. */
function refreshXSLTProcessors() {
    var tableXSLT = $('#select-table-xslt').val();
    var listXSLT = $('#select-list-xslt').val();

    // Load the table XSLT
    var tablePromise = Promise.resolve($.ajax({
        url: "assets/xsl/" + tableXSLT
    })).then(function(result) {
        tableXSLTProcessor = new XSLTProcessor();
        tableXSLTProcessor.importStylesheet(result);

        //Then load the list XSLT
        var listPromise = Promise.resolve($.ajax({
            url: "assets/xsl/" + listXSLT
        })).then(function(result) {
            listXSLTProcessor = new XSLTProcessor();
            listXSLTProcessor.importStylesheet(result);
            refreshViews();
        }, function() {
            showAlert(listXSLT + ' could not be loaded', 'danger');
        });
    }, function() {
        showAlert(tableXSLT + ' could not be loaded', 'danger');
    });
}


/** Export the table to CSV. */
$( "#csv-export" ).click(function() {
    // Return an escaped CSV string
    function formatCSV(str) {
        return escapedStr = '"' + str.replace(/"/g, '""') + '"';
    }

    // Get table rows
    var rows = [];
    $('table tr').each(function() {
        var row = [];
        $(this).find('th,td').each(function () {
            var val = $(this)[0].innerHTML;
            row.push(val)
        });
        rows.push(row.join(','));
    });

    var csvString = rows.join("\n");
    console.log(csvString);
    var encodedUri = encodeURI('data:attachment/csv;charset=utf-8,' + csvString);
    var link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "tei_data.csv");
    link.click();
});


/** Load and return an XML document. */
function loadXMLDoc(text) {
    var parseXml;
    if (typeof window.DOMParser != "undefined") {
        parseXml = function(xmlStr) {
            return (new window.DOMParser()).parseFromString(xmlStr, "text/xml");
        };
    } else if (typeof window.ActiveXObject != "undefined" &&
        new window.ActiveXObject("Microsoft.XMLDOM")) {
        parseXml = function(xmlStr) {
            var xmlDoc = new window.ActiveXObject("Microsoft.XMLDOM");
            xmlDoc.async = "false";
            xmlDoc.loadXML(xmlStr);
            return xmlDoc;
        };
    } else {
        hideLoading();
        var msg = "No XML parser found";
        showAlert(msg, 'danger')
        throw new Error(msg);
    }
    return parseXml(text);
}


//Function to convert boolean to capitalized string
Boolean.prototype.toCapsString = function () {
    return this.toString().charAt(0).toUpperCase() + this.toString().slice(1);
}


/** Reset to default settings. */
$( "#default-settings" ).click(function() {
    loadDefaultSettings();
});


/** Handle change of load table XSLT setting. */
$( "#select-table-xslt" ).change(function() {
    showLoading();
    var settings = Cookies.getJSON('settings');
    settings.xsl.selectedTable = $('#select-table-xslt').val();
    Cookies.set('settings', settings);
    refreshXSLTProcessors();
});


/** Handle change of load list XSLT setting. */
$( "#select-list-xslt" ).change(function() {
    showLoading();
    var settings = Cookies.getJSON('settings');
    settings.xsl.selectedList = $('#select-list-xslt').val();
    Cookies.set('settings', settings);
    refreshXSLTProcessors();
});


/** Handle change of unique filenames setting. */
$( "#unique-fn" ).change(function() {
    var settings = Cookies.getJSON('settings');
    var uniqueFn = $('#unique-fn').val() == 'True';
    settings.uniqueFilenames = uniqueFn;
    Cookies.set('settings', settings);
    console.log(Cookies.get('settings'));
});


/** Load settings from cookie. */
function loadSettings(){
    var settings = Cookies.getJSON('settings');

    // XSLT files
    $.each( settings.xsl.table, function( key, val ) {
        var html = '<option value="' + val + '">' + key + '</option>';
        $('#select-table-xslt').append(html);
    });
    $.each( settings.xsl.list, function( key, val ) {
        var html = '<option value="' + val + '">' + key + '</option>';
        $('#select-list-xslt').append(html);
    });
    $('#select-table-xslt').val(settings.xsl.selectedTable);
    $('#select-list-xslt').val(settings.xsl.selectedList);

    // Unique filenames
    var uniqueFn = settings.uniqueFilenames.toCapsString()
    $('#unique-fn').val(uniqueFn);

    $('.selectpicker').selectpicker('refresh');
    refreshXSLTProcessors();
}


/** Reset to default settings. */
function loadDefaultSettings() {
    $.getJSON( "settings.json", function( settings ) {
        Cookies.set('settings', settings);
        loadSettings();
    }).then(function() {
        refreshXSLTProcessors();
    }, function() {
        showAlert('A valid settings file could not be found', 'danger')
    });
}


$(function() {
    showLoading();

    // Check for required HTML5 features
    if (typeof(localStorage) == 'undefined' ) {
        showAlert('Your browser does not support HTML5 localStorage. \
                  Try upgrading.', 'danger');
    }
    if (typeof(FileReader) == 'undefined' || typeof(File) == 'undefined'
        || typeof(FileList) == 'undefined' || typeof(Blob) == 'undefined') {
        showAlert('Your browser does not support the HTML5 File APIs. \
                  Try upgrading.', 'danger');
    }

    // Initialise settings from cookie or defaults
    if (typeof Cookies.get('settings') != "undefined") {
        loadSettings();
    } else {
        loadDefaultSettings();
    }
});
