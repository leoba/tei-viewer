import dbServer from '../model/db-server';

/**
 * Subclass of Dropzone that uploads records to IndexedDB.
 */
class TEIDropzone extends Dropzone {

    constructor(elementId, opts) {
        super(elementId, opts);
        Dropzone.autoDiscover = false;
    }

    uploadFiles(files) {
        var _this = this;
        var reader = {};

        function saveFile(f) {
            return function(evt) {

                try {
                    $.parseXML(evt.target.result);
                } catch(error) {
                    _this._errorProcessing([f], "Invalid XML");
                    return;
                }

                dbServer.add({
                    xml: evt.target.result,
                    filename: f.name
                }).then(function() {
                    _this._finished([f], 'Success');
                }).catch(function(error) {
                    _this._errorProcessing([f], error.message);
                });
            };
        }

        for (var i = 0; i < files.length; i++) {
            reader = new FileReader();
            reader.onload = saveFile(files[i]);
            reader.readAsText(files[i]);
            _this.emit("updateprogress");
        }
    }

}

export default TEIDropzone;