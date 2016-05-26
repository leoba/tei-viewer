function TeiTable() {

    var XSLTProc;
    var hiddenCols = [];

    /** Populate the hide and show menus. */
    function _populateMenus() {
        var headings = []
        $('table th').each(function(i) {
            var h = {'label': $(this).html(),
                     'visible': hiddenCols.indexOf(i) == -1,
                     'index': i}
            headings.push(h);
        });

        function renderPlaceholder(id) {
            var template = $("#table-menu-ph-template").html();
                rendered = Mustache.render(template, {label: "Nothing to " + id});
            $("#" + id + "-menu").html(rendered);
        }

        function renderMenu(id, cls) {
            var template = $("#table-menu-template").html();
                rendered = Mustache.render(template, {cls: cls, headings: headings});
            $("#" + id + "-menu").html(rendered);
        }

        function getHideCls() {
            return (this.visible) ? "hide-column" : "hide-column hidden";
        }

        function getShowCls() {
            return (!this.visible) ? "show-column" : "show-column hidden";
        }

        if (hiddenCols.length !== $('table th').length) {
            renderMenu('hide', getHideCls)
        } else {
            renderPlaceholder('hide');
        }

        if (hiddenCols.length > 0) {
            renderMenu('show', getShowCls)
        } else {
            renderPlaceholder('show');
        }
    }

    /** Hide a table column. */
    this.hideColumn = function(columnIndex) {
        $('table tr > *:nth-child(' + (columnIndex + 1) + ')').hide();
        hiddenCols.push(columnIndex);
        _populateMenus();
    }

    /** Show a table column. */
    this.showColumn = function(columnIndex) {
        $('table tr > *:nth-child(' + (columnIndex + 1) + ')').show();
        hiddenCols = $.grep(hiddenCols, function(value) {
            return value != columnIndex;
        });
        _populateMenus();
    }

    /** Fixes for frozen table header. */
    this.fixFrozenTable = function() {

        // Resize header cells
        $('#table-scroll.fixed tbody tr:first-child td').each(function(i) {
            var colWidth = $(this).width();
            $('table thead tr th:nth-child(' + (i + 1) + ')').width(colWidth);
        });

        // Resize tbody to always show vertical scroll bar
        var offset = $('#table-scroll').scrollLeft();
            width  = $('#table-scroll').width();
        $('#table-scroll.fixed tbody').css('width', offset + width);

        // Add padding
        var headerHeight = $('thead').height();
        $('#table-scroll.fixed tbody').css('margin-top', headerHeight);
    }

    /** Load TEI data into the table view. */
    this.populate = function(xml) {
        teiTable = this;
        html = XSLTProc.transformToFragment(xml, document);
        $('#table-scroll').html(html);
        this.fixFrozenTable();
        $(hiddenCols).each(function(k, v) {
            teiTable.hideColumn(v);
        });
        _populateMenus();
    }

    /** Update the XSLT processor. */
    this.updateXSLTProc = function(obj) {
        XSLTProc = obj;
    }


    /** Check if the XSLT processor has been loaded. */
    this.XSLTProcLoaded = function() {
        return typeof(XSLTProc) !== 'undefined';
    }


    /** Show table borders. */
    this.showBorders = function() {
        $('table').addClass('table-bordered');
        this.fixFrozenTable();
    }


    /** Hide table borders. */
    this.hideBorders = function() {
        $('table').removeClass('table-bordered');
        this.fixFrozenTable();
    }
}
