/*
 * pwix:logger/src/common/js/configure.js
 */

import _ from 'lodash';

import { ReactiveVar } from 'meteor/reactive-var';

import { Severity } from '../definitions/severity.def';

_conf = {};
Logger._conf = new ReactiveVar( _conf );

Logger._defaults = {
    engine: 'console',
    severityLevelClient: Severity.C.INFO,
    severityLevelServer: Severity.C.INFO,
    verbosity: Logger.C.Verbose.CONFIGURE
};

/**
 * @summary Get/set the package configuration
 *  Should be called *in same terms* both by the client and the server.
 * @param {Object} o configuration options
 * @returns {Object} the package configuration
 */
Logger.configure = function( o ){
    if( arguments.length ){
        const built_conf = Logger.validateOptions( o, true );
        if( Object.keys( built_conf ).length ){
            _conf = { ..._conf, ...built_conf };
            Logger._conf.set( _conf );
            // be verbose if asked for
            if( _conf.verbosity & Logger.C.Verbose.CONFIGURE ){
                console.debug( 'pwix:logger configure() with', built_conf );
            }
        }
    }
    // also acts as a getter
    return { ...Logger._conf.get() };
}

_conf = _.merge( {}, Logger._defaults );
Logger._conf.set( _conf );
