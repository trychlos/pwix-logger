/*
 * pwix:logger/src/common/js/functions.js
 */

import _ from 'lodash';

import { Severity } from '../definitions/severity.def';

Logger = {
    ...Logger,
    ...{
        /**
         * @summary Return a fresh, validated partial configuration before changing any state
         * @locus Client
         * @param {Object} options the options to be validated
         * @param {Boolean} configuration
         */
        validateOptions( options, configuration = false ){
            if( !_.isPlainObject( options )){
                throw new TypeError( 'pwix:logger options must be a plain object' );
            }
            const result = {};
            const unknown = [];
            Object.keys( options ).forEach(( key ) => {
                const value = options[key];
                let valid;
                switch( key ){
                    case 'engine':
                        valid = value === 'console' || value === 'pino';
                        break;
                    case 'severityLevelClient':
                    case 'severityLevelServer':
                        valid = Severity.level( value ) >= 0;
                        break;
                    case 'verbosity':
                        if( configuration ){
                            valid = value === Logger.C.Verbose.NONE || value === Logger.C.Verbose.CONFIGURE;
                            break;
                        }
                        // Configuration diagnostics are global, not per-instance.
                    default:
                        unknown.push( key );
                        return;
                }
                if( !valid ){
                    throw new TypeError( 'pwix:logger invalid value for ' + key );
                }
                result[key] = value;
            });
            unknown.forEach(( key ) => console.warn( "pwix:logger ignore unmanaged key '" + key + "'" ));
            return result;
        }
    }
};
