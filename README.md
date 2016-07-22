# tei-viewer

A single page HTML5 application to display and export summaries of multiple
TEI XML documents.

Uploaded files are saved to client-side storage and transformed via XSLT to be
displayed in table form.

[Try it here](http://alexandermendes.github.io/tei-viewer/)


## Requirements

This application requires a browser that supports HTML5 indexedDB, Promises
and the File APIs, for example:

- Chrome 45
- Firefox 45
- Safari 9


## Toolbar

The core functionality is provided via the following toolbar buttons:

- **Add Files:** Upload TEI XML documents.

- **Hide:** Hide table columns.

- **Show:** Show table columns.

- **Clear:** Remove all uploaded documents.

- **Print:** Print the current view.

- **Export:** Export the table to a CSV file.

- **Settings:** View and modify the settings.

- **Help:** View the README file.


## Settings

The following general settings are provided:

- **XSLT:** The XSLT script used to transform uploaded XML documents for table display.

- **Show Borders:** Show/hide table borders.

- **Freeze Header:** Freeze/unfreeze the header row.

- **Show Tooltips:** Show/hide tooltips.

- **Records Per Page:** The maximum number of records to display on each page.

- **Reset Settings:** Return to default settings.

**Note:** A cookie is used to store the above settings between uses.


## Running offline

It is possible to run tei-viewer offline, however, your browser will probably
block certain AJAX calls to the local filesystem. There are various ways around
this, depending on your browser, but perhaps one of the simplest is to just run
a local server.

Here's an example of how to run a local instance of tei-viewer using Python 2.x:

```
git clone https://github.com/alexandermendes/tei-viewer
cd tei-viewer
python -m SimpleHTTPServer
```

Then visit [http://localhost:8000/](http://localhost:8000/)


## Contributing

Bugs and suggested improvements are tracked as
[GitHub Issues](https://github.com/alexandermendes/tei-viewer/issues).
