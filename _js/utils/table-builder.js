import he from 'he';

import dbServer from '../model/db-server';
import Editor from '../utils/editor';
import exportXML from '../utils/export-xml';
import exportJSON from '../utils/export-json';
import notify from '../view/notify';


class TableBuilder {

    /**
     * Initialise.
     */
    constructor(tableElem, xsltFilename) {
        this.tableElem = tableElem;
        this.xsltFilename = xsltFilename
    }

    /**
     * Return the dataset.
     */
    getDataset(records) {
        return records.map(function(el) {
            return el[this.xsltFilename];
        })
    }

    /**
     * Return the table columns.
     */
    getColumns() {
        let columns = [{data: null}];
        $('th:not(:first-child)').each(function() {
            columns.push({data: $(this).text()});
        });
        return columns;
    }

    /**
     * Build the table.
     */
    build(dataSet) {
        return new Promise((resolve, reject) => {
            const columns = this.getColumns(),
                  table   = this.tableElem.DataTable({
                "data": dataSet,
                "dom": "Bfrtip",
                "deferRender": true,
                "colReorder": {
                    "fixedColumnsLeft": 1,
                },
                "columnDefs": [
                    {
                        "targets": "_all",
                        "render": function (data, type, full, meta) {
                            return he.decode(data.toString());  // Decode HTML entities
                        }
                    },
                    {
                        "searchable": false,
                        "orderable": false,
                        "targets": 0,
                        "className": "bg-faded",
                    }
                ],
                "columns": columns,
                "buttons": [
                    {
                        "extend": "collection",
                        "text": "Export",
                        "autoClose": true,
                        "buttons": [
                            {
                                "extend": "excelHtml5",
                                "title": "buttons-excel-export",
                                "exportOptions": {
                                    "columns": function (idx, data, node) {
                                        return idx !== 0 && idx !== 1;
                                    }
                                }
                            },
                            {
                                "extend": "csvHtml5",
                                "title": "buttons-csv-export",
                                "exportOptions": {
                                    "columns": function (idx, data, node) {
                                        return idx !== 0 && idx !== 1;
                                    }
                                }
                            },
                            {
                                "text": "XML",
                                "className": "buttons-xml-export",
                                "action": function (evt, dt, node, conf) {
                                    dbServer.getAll().then(function(records) {
                                        exportXML(records);
                                    }).catch(function(err) {
                                        notify(err.message, 'error');
                                        throw err;
                                    });
                                }
                            },
                            {
                                "text": "JSON",
                                "className": "buttons-json-export",
                                "action": function (evt, dt, node, conf) {
                                    dbServer.getAll().then(function(records) {
                                        exportJSON(dataSet, false);
                                    }).catch(function(err) {
                                        notify(err.message, 'error');
                                        throw err;
                                    });
                                }
                            },
                            {
                                "text": "JSONP",
                                "className": "buttons-jsonp-export",
                                "action": function (evt, dt, node, conf) {
                                    dbServer.getAll().then(function(records) {
                                        exportJSON(dataSet, true);
                                    }).catch(function(err) {
                                        notify(err.message, 'error');
                                        throw err;
                                    });
                                }
                            }
                        ]
                    },
                    {
                        "extend": "collection",
                        "text": "Edit",
                        "autoClose": true,
                        "buttons": [
                            {
                                "text": "Select All",
                                "extend": "selectAll"
                            },
                            {
                                "text": "Deselect",
                                "extend": "selectNone"
                            },
                            {
                                "text": "Delete",
                                "className": "buttons-delete",
                                "action": function (evt, dt, node, conf) {
                                    $('tbody tr.selected').each(function() {
                                        const id = $(this).attr('id');
                                        dbServer.remove(id).then(function() {
                                            dt.rows('#' + id).remove().draw();
                                        }).catch(function(err) {
                                            notify(err.message, 'error');
                                            throw err;
                                        });
                                    });
                                }
                            },
                            {
                                "text": "Delete All",
                                "className": "buttons-delete-all",
                                "action": function (evt, dt, node, conf) {
                                    $('tbody tr').each(function() {
                                        const id = $(this).attr('id');
                                        dbServer.remove(id).then(function() {
                                            dt.rows('#' + id).remove().draw();
                                        }).catch(function(err) {
                                            notify(err.message, 'error');
                                            throw err;
                                        });
                                    });
                                }
                            },
                            {
                                "text": "XML Editor",
                                "className": "buttons-xml-editor",
                                "action": function (evt, dt, node, conf) {
                                    if ($('tr.selected').length !== 1) {
                                        notify('Please select a single row to edit', 'info');
                                    } else {
                                        const id = parseInt($('tr.selected').attr('id'));

                                        // Load the record into the editor modal
                                        dbServer.get(id).then(function(record) {
                                            const container = $('#editor-modal .modal-body')[0],
                                                  editor    = new Editor(container, record, this.xsltFilename);
                                            $('#editor-modal .modal-title').html(`Editing ${record.filename}`)
                                            $('#editor-modal').modal('show');
                                            editor.refresh();

                                            // Handle save button click event
                                            $('#editor-modal #save-xml').on('click', function(evt){
                                                editor.save();
                                                dt.rows('#' + id).data(record[this.xsltFilename]).draw();
                                                $('#editor-modal').modal('hide');
                                                notify('Record saved!', 'success');
                                            });
                                        }).catch(function (err) {
                                            notify(err.message, 'error');
                                            throw err;
                                        });
                                    }
                                }
                            },
                        ]
                    },
                    {
                        "extend": "collection",
                        "text": "View",
                        "buttons": [
                            "pageLength",
                            {
                                "extend": "colvis",
                                "columns": ":gt(0)"
                            }
                        ]
                    }
                ],
                "order": [[ 1, 'asc' ]],
                "select": {
                    "style": "os",
                    "selector": "td:first-child"
                }
            });

            // Add index column
            table.on('order.dt search.dt', function () {
                table.column(0, {search:'applied', order:'applied'})
                     .nodes()
                     .each(function (cell, i) {
                        cell.innerHTML = i+1;
                });
            }).draw();

            // Move table elements
            $("footer #table-pagination").html($(".dataTables_paginate"));
            $("footer #table-info").append($(".dataTables_info"));
            $(".dataTables_filter").remove();
            $('.navbar-nav').append($('.dt-buttons'));

            // Fix styles
            $('.dt-buttons>.buttons-collection').removeClass('btn-secondary');
            $('.dt-buttons>.buttons-collection').addClass('nav-link');
            $('.dt-buttons.btn-group').addClass('nav-item');

            // Fix tbody position
            $('.dataTable tbody').css('height', 'calc(100% - ' + $('thead').height() + 'px)');
            $('.dataTable tbody').css('top', $('thead').height() + 'px');

            // Handle search
            $("#table-search").on("keyup search input paste cut", function() {
                table.search(this.value).draw();
             });

            // Handle select all
            $('.select-all').on('click', table.rows().select);

            resolve(table);
        });
    }

    buildFromDB(records) {
        const dataSet = this.getDataset(records);
        this.build(dataSet);
    }
}

export default TableBuilder;