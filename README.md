# hsp

### Installing Gulp

This project uses Gulp to manage the project workflow. If you don't already have the CLI installed, then run:

    $ sudo npm install -g gulp-cli

### Installing Dependencies:

    $ npm install

### Building Locally

    $ gulp build

### Running the development server

    $ gulp serve

  This uses BrowserSync to dynamically inject CSS and conveniently reload the page on HTML/JS changes.  The build process gets run every time a change occurs.

### Compiling

The compilation process runs the build process but also minifies assets while adding cache-busting fingerprints to said files.  Everything gets copied to the `./build` directory.

The output of the build process lives in the root directory.
