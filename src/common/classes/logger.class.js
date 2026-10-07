/*
 * pwix:logger/src/common/classes/logger.class.js
 */

import _ from 'lodash';
import pino from 'pino';

import { check, Match } from 'meteor/check';

import { Severity } from '../definitions/severity.def';

export class LoggerClass {

    // static data

    // the list of instanciated (and named) loggers
    static _byName = Object.create( null );

    // the engine objects
    static _engines = {
        console: console
    };

    // associates a source function name with the corresponding engine method
    static _sources = {
        alert: {
            console: 'error',
            pino: 'error'
        },
        critical: {
            console: 'error',
            pino: 'fatal'
        },
        debug: {
            console: 'debug',
            pino: 'debug'
        },
        emergency: {
            console: 'error',
            pino: 'fatal'
        },
        error: {
            console: 'error',
            pino: 'error'
        },
        info: {
            console: 'info',
            pino: 'info'
        },
        log: {
            console: 'log',
            pino: 'info'
        },
        notice: {
            console: 'info',
            pino: 'info'
        },
        trace: {
            console: 'trace',
            pino: 'trace'
        },
        verbose: {
            console: 'debug',
            pino: 'debug'
        },
        warn: {
            console: 'warn',
            pino: 'warn'
        },
        warning: {
            console: 'warn',
            pino: 'warn'
        }
    };

    // static methods

    /**
     * @summary This function accepts:
     *  - zero parameter: returns the 'default' logger instance, instanciating if needed
     *  - one parameter:
     *    > if a string, then the name of an instance to be retrieved/instanciated
     *    > if an object, then options to apply to this instance, only considered if not already instanciated
     *  - two paramters: a name and an options object which doesn't contain any 'name' key.
     * @param {String|Object} name name or options
     * @param {Object} options options
     */
    static get( ...callArgs ){
        const count = callArgs.length;
        check( count, Match.Where(( count ) => count <= 2 ));
        let name = '_default_';
        let options = {};
        if( count > 0 ){
            const first = callArgs[0];
            if( typeof first === 'string' ){
                name = first;
                if( count === 2 ){
                    if( !_.isPlainObject( callArgs[1] ) || Object.prototype.hasOwnProperty.call( callArgs[1], 'name' )){
                        throw new TypeError( 'pwix:logger expected options without a name' );
                    }
                    options = callArgs[1];
                }
            } else {
                if( count !== 1 || !_.isPlainObject( first )){
                    throw new TypeError( 'pwix:logger expected a name or options object' );
                }
                options = { ...first };
                if( Object.prototype.hasOwnProperty.call( options, 'name' )){
                    name = options.name;
                    delete options.name;
                }
            }
        }
        check( name, Match.NonEmptyString );
        options = Logger.validateOptions( options );
        if( LoggerClass._byName[name] ){
            check( LoggerClass._byName[name], LoggerClass );
            return LoggerClass._byName[name];
        }
        return new LoggerClass( name, options );
    }

    // private data

    // private methods

    // try to identify the caller
    _callerHint( stackFramesToSkip = 2 ){
        // NOTE: heuristic. Meteor bundling/minification can alter stacks.
        const err = new Error();
        const stack = String( err.stack || '' ).split( '\n' ).slice( stackFramesToSkip );
        //console.debug( 'stack', stack );
        const line = stack.find( s => s.includes( '/' ) || s.includes( '\\' ) || s.includes( 'http' ));
        if( !line ) return '';
        // Try to extract ".../file.js:line:col" or "http...:line:col"
        const m = line.match( /((?:https?:\/\/.*?|packages\/.*?|\/.*?|[A-Za-z]:\\.*?)):(\d+):(\d+)/ );
        return m ? `${m[1]}:${m[2]}` : '';
    }

    // output to stdout
    // @parms {String} severity the severity level
    // @parms {String} source the function name
    //  if source is 'verbose', first arg in '...args' is the verbosity object
    _out( severity, source, ...args ){

        //console.debug( 'severity', severity );
        //console.debug( 'source', source );
        //console.debug( 'args', args );

        const hint = this._callerHint( 4 );
        //console.debug( 'hint', hint );

        // client-side
        // hint.3: http://localhost:3010/packages/pwix_logger.js?hash=fbe1031aa2b37b8e3d2c0c0d6fd0e5216e2ff4db:202 in development environment
        // hint 4: http://localhost:3010/packages/pwix_blaze-layout.js?hash=2031e778a4690b4a4b14b2bdc0858ceed902cf80:74 when originating from a package
        // hint.4: http://localhost:3010/app/app.js?hash=5e1b776bef9938975a05aad1161dc5878654dfdd:3422 when originating from the app
        // though in all cases DevTools provides the correct file and line (because pwix:logger is registered in IgnoreList)
        // server-side
        // hint.4: packages/pwix:collection-behaviours/src/common/js/behaviours.js:52 in development environment
        // hint.4: /common/init/accounts-users.js:78 in development environment
        //console.debug( 'hint', hint );
        let pckname = '';
        let filename = '';
        let linenumber = '';
        if( hint.match( /\/packages\/|^packages\// )){
            const marker = '/packages/';
            const packageStart = hint.startsWith( 'packages/' )
                ? 'packages/'.length
                : hint.indexOf( marker ) + marker.length;
            if( Meteor.isClient ){
                pckname = hint.substring( packageStart );
                let idx = pckname.indexOf( '.js?' );
                pckname = pckname.substring( 0, idx );
                pckname = pckname.replace( '_', ':' );
            } else {
                pckname = hint.substring( packageStart );
                let idx = pckname.indexOf( '/' );
                pckname = pckname.substring( 0, idx );
                idx = hint.lastIndexOf( '/' );
                filename = hint.substring( idx+1 );
                linenumber = filename;
                idx = filename.indexOf( ':' );
                filename = filename.substring( 0, idx );
                linenumber = linenumber.substring( idx+1 );
                //console.debug( 'filename', filename, 'linenumber', linenumber );
            }
        } else {
            if( Meteor.isClient ){
                // nothing to hope for that apart from scanning the built app.js..
            } else {
                let idx = hint.indexOf( ':' );
                filename = hint.substring( 0, idx );
                linenumber = hint.substring( idx+1 );
                //console.debug( 'filename', filename, 'linenumber', linenumber );
            }
        }

        // determine the log engine - must exist and exhibit the relevant function
        // instanciating one if needed
        const config = { ...Logger.configure(), ...this._options };
        const engineName = config.engine;

        // determine the to-be-called function
        let fn = 'info';
        if( LoggerClass._sources[source] ){
            fn = LoggerClass._sources[source][engineName] || 'info';
        }

        // this line must it be outputed, depending of its semantic and of the minimal configured severity level
        let loggable = true;
        if( source === 'verbose' ){
            const opts = args.shift();
            loggable = opts.verbosity & opts.against;
        }
        if( loggable ){
            if( Meteor.isClient ){
                const minClient = config.severityLevelClient;
                //console.debug( 'severity', severity, 'minClient', minClient, 'compare', Severity.compare( severity, minClient ));
                loggable = Severity.compare( severity, minClient ) <= 0;
            } else {
                const minServer = config.severityLevelServer;
                loggable = Severity.compare( severity, minServer ) <= 0;
            }
        }

        // severity, source are provided by the caller
        // pckname, filename and linenumber are computed, maybe empty (or wrong)
        if( loggable ){
            const engineObject = engineName === 'pino'
                ? ( this._pino || ( this._pino = this._createPino() ))
                : LoggerClass._engines.console;
            if( _.isFunction( engineObject[fn] )){
                if( pckname ){
                    args.unshift( pckname );
                }
                engineObject[fn]( ...args );
            } else {
                console.warn( 'unmanaged source \''+source+'\' for \''+engineName+'\' configured engine' );
            }
        }
    }

    // public data

    /**
     * Constructor
     * @summary instanciate a new LoggerClass instance, trying to keep it as a singleton
     *  We want either zero, one or two parameters:
     *  - one: instanciate a new named instance with default options
     *  - two: instanciate a new named instance with provided options
     * @param {String} name
     * @param {Object} options
     * @returns {LoggerClass} this instance
     */
    constructor( name, options = {} ){
        check( name, Match.NonEmptyString );
        const validated = Logger.validateOptions( options );
        if( LoggerClass._byName[name] ){
            console.warn( 'pwix:logger LoggerClass() \''+name+'\' name is already instanciated (maybe are you trying to instanciate it yourself, but you should rather rely on Logger.get().' );
            return LoggerClass._byName[name];
        }

        this._options = validated;
        this._name = name;
        this._pino = null;
        LoggerClass._byName[name] = this;
    }

    _createPino(){
        const prettyTarget = Meteor.isServer ? Npm.require.resolve( 'pino-pretty' ) : 'pino-pretty';

        return pino({
            name: this._name,
            level: 'trace',
            // according to https://getpino.io/#/docs/api?id=interpolationvalues-any
            // Since pino v6, we do not automatically concatenate and cast to string consecutive parameters:
            // However, it's possible to inject a hook to modify this behavior:
            hooks: {
                logMethod: function( args, method ){
                    //console.debug( 'logMethod', arguments );
                    if( args.length > 1 ){
                        for( let i=1 ; i<args.length ; ++i ){
                            if( args[0].length ){
                                args[0] += ' ';
                            }
                            if( _.isString( args[i] )){
                                args[0] += '%s';
                            } else {
                                args[0] += '%o';
                            }
                        }
                    }
                    //console.debug( 'args', args );
                    method.apply( this, args )
                }
            },
            transport: {
                target: prettyTarget,
                options: {
                    colorize: true
                }
            }
        });

    }

    /*
     * Have a method per severity level
     */
    alert(){ this._out( Severity.C.ALERT, 'alert', ...arguments ); }
    critical(){ this._out( Severity.C.CRITICAL, 'critical', ...arguments ); }
    debug(){ this._out( Severity.C.DEBUG, 'debug', ...arguments ); }
    emergency(){ this._out( Severity.C.EMERGENCY, 'emergency', ...arguments ); }
    error(){ this._out( Severity.C.ERROR, 'error', ...arguments ); }
    info(){ this._out( Severity.C.INFO, 'info', ...arguments ); }
    notice(){ this._out( Severity.C.NOTICE, 'notice', ...arguments ); }
    warning(){ this._out( Severity.C.WARNING, 'warning', ...arguments ); }

    /*
     * Have also console-interface compliance
     */
    log(){ this._out( Severity.C.NOTICE, 'log', ...arguments ); }
    trace(){ this._out( Severity.C.DEBUG, 'trace', ...arguments ); }
    warn(){ this._out( Severity.C.WARNING, 'warn', ...arguments ); }

    /*
     * verbosity
     */
    verbose(){ this._out( Severity.C.DEBUG, 'verbose', ...arguments ); }
}
