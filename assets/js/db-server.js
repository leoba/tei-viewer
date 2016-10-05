/**
 * Global DB server class.
 */
class DBServer {

    /**
     * Initialise with database options.
     */
    constructor() {
        this.server = null;
        this.options = {
            server: 'tei-viewer',
            version: 3,
            schema: {
                tei: {
                    key: {keyPath: 'id', autoIncrement: true}
                }
            }
        };
    }

    /**
     * Connect to the database.
     */
    connect() {
        var _this = this;
        return new Promise(function(resolve, reject) {
            db.open(_this.options).then(function(server) {
                _this.server = server;
                resolve();
            }).catch(function (err) {
                if (err.type === 'blocked') {
                    oldConnection.close();
                    return err.resume;
                }
                reject(err);
            });
        });
    }


    /**
     * Add a record, ensuring that a connection is established first.
     */
    add(data) {
        var _this = this;

        function addRecord(id, xml) {
            return new Promise(function(resolve, reject) {
                _this.server.tei.add(data).then(function() {
                    resolve();
                }).catch(function (err) {
                    reject(err);
                });
            });
        }

        return new Promise(function(resolve, reject) {
            if (_this.server === null) {
                _this.connect().then(function() {
                    resolve(addRecord(data));
                }).catch(function (err) {
                    reject(err);
                });
            } else {
                resolve(addRecord(data));
            }
        });
    }

    /**
     * Return a record, ensuring that a connection is established first.
     */
    get(id) {
        var _this = this;

        function getRecord(id) {
            return new Promise(function(resolve, reject) {
                _this.server.tei.get(id).then(function(record) {
                    if (typeof record === 'undefined') {
                        reject(new Error('Record not found'));
                    }
                    resolve(record);
                }).catch(function (err) {
                    reject(err);
                });
            });
        }

        return new Promise(function(resolve, reject) {
            if (_this.server === null) {
                _this.connect().then(function() {
                    resolve(getRecord(id));
                }).catch(function (err) {
                    reject(err);
                });
            } else {
                resolve(getRecord(id));
            }
        });
    }


    /**
     * Update a record, ensuring that a connection is established first.
     */
    update(record) {
        var _this = this;

        function updateRecord(record) {
            return new Promise(function(resolve, reject) {
                _this.server.tei.update(record).then(function() {
                    resolve();
                }).catch(function (err) {
                    reject(err);
                });
            });
        }

        return new Promise(function(resolve, reject) {
            if (_this.server === null) {
                _this.connect().then(function() {
                    resolve(updateRecord(record));
                }).catch(function (err) {
                    reject(err);
                });
            } else {
                resolve(updateRecord(record));
            }
        });
    }

    /**
     * Return multiple records, ensuring that a connection is established first.
     */
    getAll() {
        var _this = this;

        function getAllRecords(fromRecord, toRecord) {
            return new Promise(function(resolve, reject) {
                _this.server.tei.query()
                                .all()
                                .execute()
                                .then(function(records) {
                                    resolve(records);
                }).catch(function (err) {
                    reject(err);
                });
            });
        }

        return new Promise(function(resolve, reject) {
            if (_this.server === null) {
                _this.connect().then(function() {
                    resolve(getAllRecords());
                }).catch(function (err) {
                    reject(err);
                });
            } else {
                resolve(getAllRecords());
            }
        });
    }


    /**
     * Count records, ensuring that a connection is established first.
     */
    count() {
        var _this = this;

        function countRecords() {
            return new Promise(function(resolve, reject) {
                _this.server.tei.count().then(function (n) {
                    resolve(n);
                }).catch(function (err) {
                    reject(err);
                });
            });
        }

        return new Promise(function(resolve, reject) {
            if (_this.server === null) {
                _this.connect().then(function() {
                    resolve(countRecords());
                }).catch(function (err) {
                    reject(err);
                });
            } else {
                resolve(countRecords());
            }
        });
    }

    /**
     * Clear all records, ensuring that a connection is established first.
     */
    clearAll() {
        var _this = this;

        function clearAllRecords() {
            return new Promise(function(resolve, reject) {
                _this.server.tei.clear().then(function () {
                    resolve();
                }).catch(function (err) {
                    reject(err);
                });
            });
        }

        return new Promise(function(resolve, reject) {
            if (_this.server === null) {
                _this.connect().then(function() {
                    resolve(clearAllRecords());
                }).catch(function (err) {
                    reject(err);
                });
            } else {
                resolve(clearAllRecords());
            }
        });
    }

}

export default window.dbServer = new DBServer();