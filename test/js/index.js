// Import Tinytest from the tinytest Meteor package.
import { Tinytest } from "meteor/tinytest";

// Import and rename a variable exported by logger.js.
import { name as packageName } from "meteor/pwix:logger";

// Write your tests here!
// Here is an example.
Tinytest.add( 'logger - example', function( test ){
    test.equal( packageName, 'logger' );
});
