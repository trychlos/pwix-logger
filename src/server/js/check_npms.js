/*
 * pwix:logger/src/server/js/check_npms.js
 */

import { checkNpmVersions } from 'meteor/tmeasday:check-npm-versions';

if( false ){
    // whitelist packages which are included via a subfolder or badly recognized
    require( 'pino-pretty/package.json' );
}

checkNpmVersions({
    'lodash': '^4.17.0',
    'pino': '^10.3.0',
    'pino-pretty': '^13.1.3'
},
    'pwix:logger'
);
