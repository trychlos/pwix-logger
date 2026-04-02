/*
 * pwix:logger/src/server/js/check_npms.js
 */

import { checkNpmVersions } from 'meteor/tmeasday:check-npm-versions';

if( false ){
    // whitelist packages which are included via a subfolder or badly recognized
}

checkNpmVersions({
    'lodash': '^4.17.0',
    'pino': '^10.3.0'
},
    'pwix:logger'
);
